// PDF A EXCEL - EXTRACCIÓN REAL DE DATOS
// SIN productos inventados, SOLO datos del PDF real

import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

interface FilaExtraida {
  codigo?: string;
  descripcion?: string;
  precio?: number;
  stock?: number;
  categoria?: string;
  unidad?: string;
  linea_original?: string; // Para debugging
}

// ============================================
// EXTRACCIÓN REAL DE TEXTO DEL PDF
// ============================================

async function extraerTextoRealDelPDF(pdfArrayBuffer: ArrayBuffer): Promise<string[]> {
  console.log('📄 Extrayendo texto REAL del PDF...');
  
  try {
    // Importar pdf.js de forma compatible con Vercel
    const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist');
    
    // Configurar worker
    GlobalWorkerOptions.workerSrc = 
      `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
    
    const loadingTask = getDocument({ data: pdfArrayBuffer });
    const pdfDoc = await loadingTask.promise;
    
    console.log(`📊 PDF cargado: ${pdfDoc.numPages} páginas`);
    
    const todasLasLineas: string[] = [];
    const maxPaginas = Math.min(pdfDoc.numPages, 10);
    
    for (let numPagina = 1; numPagina <= maxPaginas; numPagina++) {
      console.log(`📖 Extrayendo texto de página ${numPagina}/${maxPaginas}`);
      
      const page = await pdfDoc.getPage(numPagina);
      const textContent = await page.getTextContent();
      
      // Extraer TEXTO REAL del PDF
      const textItems = textContent.items as any[];
      
      // Organizar texto por posición Y (filas)
      const itemsPorY = new Map<number, Array<{texto: string, x: number}>>();
      
      for (const item of textItems) {
        if (item.str && item.str.trim()) {
          const y = Math.round(item.transform[5]);
          const x = Math.round(item.transform[4]);
          
          if (!itemsPorY.has(y)) {
            itemsPorY.set(y, []);
          }
          
          itemsPorY.get(y)!.push({
            texto: item.str.trim(),
            x: x
          });
        }
      }
      
      // Convertir a líneas ordenadas (de arriba a abajo, izquierda a derecha)
      const lineasPagina = Array.from(itemsPorY.entries())
        .sort(([y1], [y2]) => y2 - y1) // De arriba a abajo
        .map(([y, items]) => {
          // Ordenar por posición X (izquierda a derecha)
          const itemsOrdenados = items.sort((a, b) => a.x - b.x);
          return itemsOrdenados.map(item => item.texto).join(' ').trim();
        })
        .filter(linea => linea.length > 2); // Solo líneas con contenido
      
      todasLasLineas.push(...lineasPagina);
    }
    
    console.log(`✅ Texto extraído: ${todasLasLineas.length} líneas reales del PDF`);
    
    // DEBUG: Mostrar primeras líneas extraídas
    console.log('🔍 Primeras 10 líneas extraídas:');
    todasLasLineas.slice(0, 10).forEach((linea, i) => {
      console.log(`  ${i+1}: "${linea}"`);
    });
    
    return todasLasLineas;
    
  } catch (error) {
    console.error('❌ Error extrayendo texto del PDF:', error);
    throw new Error(`No se pudo extraer texto del PDF: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

// ============================================
// DETECCIÓN INTELIGENTE DE TABLAS REALES
// ============================================

function detectarTablasReales(lineasTexto: string[]): FilaExtraida[] {
  console.log('🔍 Analizando líneas REALES para detectar tablas...');
  
  if (lineasTexto.length === 0) {
    throw new Error('No se extrajo texto del PDF. Puede ser un PDF de solo imágenes.');
  }
  
  const filas: FilaExtraida[] = [];
  let enTabla = false;
  let tipoTablaDetectado = '';
  
  // Patrones para detectar diferentes tipos de tablas REALES
  const patronesEncabezado = [
    /código.*descripción.*precio/i,
    /item.*producto.*valor/i,
    /art.*descripción.*importe/i,
    /ref.*nombre.*costo/i,
    /sku.*detalle.*precio/i,
    /producto.*cantidad.*total/i
  ];
  
  for (let i = 0; i < lineasTexto.length; i++) {
    const linea = lineasTexto[i].trim();
    
    if (!linea || linea.length < 5) {
      // Línea vacía puede indicar fin de tabla
      if (enTabla && i > 0) {
        const siguienteLinea = lineasTexto[i + 1]?.trim();
        if (!siguienteLinea || siguienteLinea.length < 5) {
          enTabla = false;
          console.log(`📊 Fin de tabla detectado en línea ${i}`);
        }
      }
      continue;
    }
    
    // DETECTAR INICIO DE TABLA
    if (!enTabla) {
      const esEncabezado = patronesEncabezado.some(patron => patron.test(linea));
      
      if (esEncabezado) {
        enTabla = true;
        tipoTablaDetectado = determinarTipoTabla(linea);
        console.log(`📊 ¡TABLA REAL DETECTADA! Línea ${i}: "${linea}"`);
        console.log(`📋 Tipo: ${tipoTablaDetectado}`);
        continue;
      }
    }
    
    // PROCESAR DATOS DE TABLA
    if (enTabla) {
      // Saltar líneas decorativas
      if (/^[-=_\s*]+$/.test(linea)) {
        continue;
      }
      
      // Detectar fin de tabla por patrones específicos
      if (esFinDeTablaReal(linea)) {
        enTabla = false;
        console.log(`📊 Fin de tabla por patrón: "${linea}"`);
        continue;
      }
      
      // EXTRAER DATOS REALES
      const filaExtraida = extraerDatosReales(linea, tipoTablaDetectado, i);
      if (filaExtraida) {
        filas.push(filaExtraida);
        console.log(`✅ Fila ${filas.length}: ${filaExtraida.codigo || 'N/A'} - ${filaExtraida.descripcion?.substring(0, 30) || 'N/A'}`);
      }
    }
  }
  
  console.log(`🎯 RESULTADO: ${filas.length} filas REALES extraídas del PDF`);
  
  if (filas.length === 0) {
    console.log('⚠️ No se detectaron tablas válidas. Contenido del PDF:');
    lineasTexto.slice(0, 20).forEach((linea, i) => {
      console.log(`  ${i+1}: "${linea}"`);
    });
    throw new Error('No se detectaron tablas en el PDF. Verificar que contenga tablas estructuradas con texto legible.');
  }
  
  return filas;
}

function determinarTipoTabla(encabezado: string): string {
  const linea = encabezado.toLowerCase();
  
  if (linea.includes('precio') || linea.includes('costo') || linea.includes('valor')) {
    return 'lista_precios';
  } else if (linea.includes('stock') || linea.includes('inventario') || linea.includes('existencia')) {
    return 'inventario';
  } else if (linea.includes('venta') || linea.includes('factura') || linea.includes('cliente')) {
    return 'ventas';
  } else {
    return 'productos_general';
  }
}

function esFinDeTablaReal(linea: string): boolean {
  const patronesFinTabla = [
    /^total\s*:/i,
    /^subtotal\s*:/i,
    /^suma\s*:/i,
    /^observaciones/i,
    /^notas\s*:/i,
    /^condiciones/i,
    /^términos/i,
    /^página\s*\d+/i,
    /^fin\s+de\s+lista/i,
    /^actualizado/i,
    /^vigencia/i
  ];
  
  return patronesFinTabla.some(patron => patron.test(linea));
}

// ============================================
// EXTRACCIÓN DE DATOS REALES DE CADA LÍNEA
// ============================================

function extraerDatosReales(linea: string, tipoTabla: string, numeroLinea: number): FilaExtraida | null {
  try {
    console.log(`🔍 Analizando línea ${numeroLinea}: "${linea}"`);
    
    // Múltiples estrategias de separación
    let elementos: string[] = [];
    
    // Estrategia 1: Separación por múltiples espacios
    elementos = linea.split(/\s{2,}/).map(e => e.trim()).filter(e => e.length > 0);
    
    // Estrategia 2: Separación por tabuladores
    if (elementos.length < 3) {
      elementos = linea.split(/\t/).map(e => e.trim()).filter(e => e.length > 0);
    }
    
    // Estrategia 3: Separación por patrones específicos del tipo de tabla
    if (elementos.length < 3) {
      elementos = separarPorPatrones(linea, tipoTabla);
    }
    
    if (elementos.length < 2) {
      console.log(`⚠️ Línea insuficiente: solo ${elementos.length} elementos`);
      return null;
    }
    
    console.log(`📋 Elementos detectados: [${elementos.join('] [') }]`);
    
    // Crear fila con datos REALES
    const fila: FilaExtraida = {
      linea_original: linea // Para debugging
    };
    
    // ASIGNACIÓN INTELIGENTE DE CAMPOS
    for (let i = 0; i < elementos.length; i++) {
      const elemento = elementos[i].trim();
      
      if (!elemento) continue;
      
      // DETECTAR CÓDIGO (alfanumérico corto, generalmente al inicio)
      if (i <= 1 && !fila.codigo && esCodigoProducto(elemento)) {
        fila.codigo = elemento;
        console.log(`  📝 Código: "${elemento}"`);
        continue;
      }
      
      // DETECTAR PRECIO (contiene números y símbolos monetarios)
      if (!fila.precio && esPrecio(elemento)) {
        const precio = extraerPrecioReal(elemento);
        if (precio > 0) {
          fila.precio = precio;
          console.log(`  💰 Precio: ${precio}`);
          continue;
        }
      }
      
      // DETECTAR STOCK/CANTIDAD (número entero sin símbolos)
      if (!fila.stock && esStock(elemento)) {
        const stock = parseInt(elemento.replace(/\D/g, ''));
        if (!isNaN(stock) && stock >= 0 && stock < 100000) {
          fila.stock = stock;
          console.log(`  📦 Stock: ${stock}`);
          continue;
        }
      }
      
      // DETECTAR UNIDAD (siglas como UN, KG, LT, etc.)
      if (!fila.unidad && esUnidad(elemento)) {
        fila.unidad = elemento.toUpperCase();
        console.log(`  📏 Unidad: "${elemento}"`);
        continue;
      }
      
      // DETECTAR DESCRIPCIÓN (texto largo, no números)
      if (!fila.descripcion && esDescripcion(elemento)) {
        fila.descripcion = elemento;
        console.log(`  📄 Descripción: "${elemento.substring(0, 30)}..."`);
        continue;
      }
    }
    
    // VALIDAR QUE LA FILA TENGA DATOS ÚTILES
    if (!fila.codigo && !fila.descripcion) {
      console.log(`❌ Fila rechazada: sin código ni descripción`);
      return null;
    }
    
    if (fila.descripcion && fila.descripcion.length < 3) {
      console.log(`❌ Fila rechazada: descripción muy corta`);
      return null;
    }
    
    // Limpiar campo de debugging en producción
    delete fila.linea_original;
    
    console.log(`✅ Fila válida extraída`);
    return fila;
    
  } catch (error) {
    console.warn(`⚠️ Error procesando línea ${numeroLinea}:`, error instanceof Error ? error.message : 'Error desconocido');
    return null;
  }
}

function separarPorPatrones(linea: string, tipoTabla: string): string[] {
  // Patrones específicos según tipo de tabla
  switch (tipoTabla) {
    case 'lista_precios':
      // Patrón: CÓDIGO DESCRIPCIÓN PRECIO [STOCK] [UNIDAD]
      const match1 = linea.match(/^(\S+)\s+(.+?)\s+([\d.,\$€]+)\s*(.*)$/);
      if (match1) {
        return [match1[1], match1[2], match1[3], match1[4]].filter(e => e.trim());
      }
      break;
      
    case 'inventario':
      // Patrón: CÓDIGO DESCRIPCIÓN STOCK PRECIO
      const match2 = linea.match(/^(\S+)\s+(.+?)\s+(\d+)\s+([\d.,\$€]+).*$/);
      if (match2) {
        return [match2[1], match2[2], match2[4], match2[3]]; // Precio y stock invertidos
      }
      break;
  }
  
  // Patrón genérico de respaldo
  return linea.split(/\s+/).filter(e => e.length > 0);
}

// ============================================
// FUNCIONES DE DETECCIÓN DE TIPOS DE DATOS
// ============================================

function esCodigoProducto(texto: string): boolean {
  // Códigos típicos: alfanuméricos, 3-15 caracteres, sin espacios
  return /^[A-Z0-9]{2,15}$/i.test(texto) && 
         texto.length >= 3 && 
         texto.length <= 15 &&
         /\d/.test(texto); // Debe contener al menos un número
}

function esPrecio(texto: string): boolean {
  // Contiene números y posibles símbolos monetarios
  return /[\d.,]+/.test(texto) && 
         /[\$€£¥₹₽¢]|precio|cost|valor|importe/.test(texto.toLowerCase()) ||
         /^\d{1,10}[.,]?\d{0,2}$/.test(texto.replace(/[\$€£¥₹₽¢,]/g, ''));
}

function extraerPrecioReal(texto: string): number {
  // Extraer solo números y puntos/comas
  const numeroLimpio = texto.replace(/[^\d.,]/g, '');
  
  // Manejar formatos como "1.234,56" o "1,234.56"
  let numero: number;
  
  if (numeroLimpio.includes(',') && numeroLimpio.includes('.')) {
    // Formato "1.234,56" (europeo)
    if (numeroLimpio.lastIndexOf(',') > numeroLimpio.lastIndexOf('.')) {
      numero = parseFloat(numeroLimpio.replace(/\./g, '').replace(',', '.'));
    } else {
      // Formato "1,234.56" (americano)
      numero = parseFloat(numeroLimpio.replace(/,/g, ''));
    }
  } else if (numeroLimpio.includes(',')) {
    // Solo comas - asumir formato europeo si hay más de 3 dígitos después
    const partes = numeroLimpio.split(',');
    if (partes[1] && partes[1].length <= 2) {
      numero = parseFloat(numeroLimpio.replace(',', '.'));
    } else {
      numero = parseFloat(numeroLimpio.replace(/,/g, ''));
    }
  } else {
    numero = parseFloat(numeroLimpio);
  }
  
  return isNaN(numero) ? 0 : numero;
}

function esStock(texto: string): boolean {
  // Número entero, posiblemente con separadores de miles
  const numeroLimpio = texto.replace(/[.,]/g, '');
  return /^\d{1,6}$/.test(numeroLimpio) && 
         parseInt(numeroLimpio) < 100000; // Límite razonable para stock
}

function esUnidad(texto: string): boolean {
  // Unidades típicas
  const unidadesComunes = [
    'UN', 'UND', 'UNIDAD', 'UNIDADES',
    'KG', 'GR', 'GRAMOS', 'KILOS',
    'LT', 'ML', 'LITROS', 'MILILITROS',
    'MT', 'CM', 'MM', 'METROS', 'CENTIMETROS',
    'M2', 'M3', 'M²', 'M³',
    'PZ', 'PIEZA', 'PIEZAS',
    'CAJA', 'CAJAS', 'PAR', 'PARES'
  ];
  
  return unidadesComunes.includes(texto.toUpperCase()) ||
         /^(UN|KG|LT|MT|CM|MM|PZ|M[23²³])$/i.test(texto);
}

function esDescripcion(texto: string): boolean {
  // Texto descriptivo: más de 5 caracteres, contiene letras, no es solo números
  return texto.length >= 5 && 
         /[a-zA-ZáéíóúñÁÉÍÓÚÑ]/.test(texto) && 
         !/^\d+[.,]?\d*$/.test(texto) &&
         !esUnidad(texto);
}

// ============================================
// GENERACIÓN DE EXCEL CON DATOS REALES
// ============================================

function generarExcelConDatosReales(datos: FilaExtraida[], nombreArchivo: string, estadisticas: any): Buffer {
  console.log('📊 Generando Excel con datos REALES extraídos...');
  
  const workbook = XLSX.utils.book_new();
  
  // Hoja principal con datos extraídos
  const worksheet = XLSX.utils.json_to_sheet(datos);
  
  // Configurar anchos de columna
  worksheet['!cols'] = [
    { wch: 15 }, // código
    { wch: 50 }, // descripción (más ancho para textos reales)
    { wch: 15 }, // precio
    { wch: 10 }, // stock
    { wch: 15 }, // categoria
    { wch: 12 }  // unidad
  ];
  
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos Extraídos');
  
  // Hoja de análisis de los datos extraídos
  const analisis = [
    ['ANÁLISIS DE DATOS EXTRAÍDOS'],
    [''],
    ['Archivo procesado:', nombreArchivo],
    ['Fecha y hora:', new Date().toLocaleString('es-ES')],
    [''],
    ['ESTADÍSTICAS'],
    ['Total de filas extraídas:', datos.length],
    ['Filas con código de producto:', datos.filter(d => d.codigo).length],
    ['Filas con descripción:', datos.filter(d => d.descripcion).length],
    ['Filas con precio:', datos.filter(d => d.precio).length],
    ['Filas con información de stock:', datos.filter(d => d.stock !== undefined).length],
    ['Filas con unidad de medida:', datos.filter(d => d.unidad).length],
    [''],
    ['ANÁLISIS DE PRECIOS (si aplica)'],
    ['Precio mínimo:', datos.filter(d => d.precio).length > 0 ? Math.min(...datos.filter(d => d.precio).map(d => d.precio!)) : 'N/A'],
    ['Precio máximo:', datos.filter(d => d.precio).length > 0 ? Math.max(...datos.filter(d => d.precio).map(d => d.precio!)) : 'N/A'],
    ['Precio promedio:', datos.filter(d => d.precio).length > 0 ? 
      (datos.filter(d => d.precio).reduce((sum, d) => sum + d.precio!, 0) / datos.filter(d => d.precio).length).toFixed(2) : 'N/A'],
    [''],
    ['CÓDIGOS ÚNICOS DETECTADOS'],
    ...Array.from(new Set(datos.filter(d => d.codigo).map(d => d.codigo))).slice(0, 20).map(codigo => ['', codigo]),
    [''],
    ['INFORMACIÓN TÉCNICA'],
    ['Método de extracción:', 'PDF.js + Análisis de patrones'],
    ['Líneas de texto procesadas:', estadisticas.lineasTexto || 0],
    ['Tiempo de procesamiento:', estadisticas.tiempoProcesamiento || 'N/A']
  ];
  
  const worksheetAnalisis = XLSX.utils.aoa_to_sheet(analisis);
  XLSX.utils.book_append_sheet(workbook, worksheetAnalisis, 'Análisis');
  
  return XLSX.write(workbook, { 
    type: 'buffer', 
    bookType: 'xlsx',
    compression: true 
  });
}

// ============================================
// API ROUTE PRINCIPAL
// ============================================

export async function POST(request: NextRequest) {
  const inicio = Date.now();
  
  try {
    console.log('🚀 Iniciando extracción REAL de datos de PDF...');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No se proporcionó archivo PDF' },
        { status: 400 }
      );
    }
    
    // Validaciones
    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json(
        { success: false, error: 'Solo archivos PDF son soportados' },
        { status: 400 }
      );
    }
    
    if (file.size > 30 * 1024 * 1024) { // 30MB límite
      return NextResponse.json(
        { success: false, error: 'Archivo muy grande (máximo 30MB)' },
        { status: 400 }
      );
    }
    
    console.log(`📄 Procesando archivo real: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
    
    // Leer archivo PDF
    const arrayBuffer = await file.arrayBuffer();
    
    // Control de timeout
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('El PDF es muy complejo para procesar en el tiempo límite')), 50000)
    );
    
    const processingPromise = async () => {
      // PASO 1: Extraer texto REAL del PDF
      const lineasTextoReales = await extraerTextoRealDelPDF(arrayBuffer);
      
      // PASO 2: Detectar y extraer tablas REALES
      const datosRealesExtraidos = detectarTablasReales(lineasTextoReales);
      
      return { lineasTextoReales, datosRealesExtraidos };
    };
    
    const { lineasTextoReales, datosRealesExtraidos } = await Promise.race([
      processingPromise(),
      timeoutPromise
    ]) as { lineasTextoReales: string[], datosRealesExtraidos: FilaExtraida[] };
    
    // PASO 3: Generar Excel con datos reales
    const tiempoTranscurrido = Date.now() - inicio;
    const estadisticas = {
      tiempoProcesamiento: `${tiempoTranscurrido}ms`,
      lineasTexto: lineasTextoReales.length
    };
    
    const excelBuffer = generarExcelConDatosReales(datosRealesExtraidos, file.name, estadisticas);
    const excelBase64 = excelBuffer.toString('base64');
    
    const tiempoFinal = Date.now() - inicio;
    
    console.log(`✅ EXTRACCIÓN REAL COMPLETADA en ${tiempoFinal}ms`);
    console.log(`📊 DATOS REALES: ${datosRealesExtraidos.length} filas extraídas del PDF`);
    
    return NextResponse.json({
      success: true,
      excel: excelBase64,
      estadisticas: {
        tiempoProcesamiento: `${tiempoFinal}ms`,
        lineasTextoExtraidas: lineasTextoReales.length,
        filasRealesExtraidas: datosRealesExtraidos.length,
        conCodigo: datosRealesExtraidos.filter(d => d.codigo).length,
        conPrecio: datosRealesExtraidos.filter(d => d.precio).length,
        conStock: datosRealesExtraidos.filter(d => d.stock !== undefined).length,
        conUnidad: datosRealesExtraidos.filter(d => d.unidad).length,
        calidadExtraccion: calcularCalidadExtraccion(datosRealesExtraidos)
      },
      nombreSugerido: file.name.replace('.pdf', '_datos_extraidos.xlsx'),
      mensaje: `✅ ${datosRealesExtraidos.length} filas de datos REALES extraídas del PDF`,
      origen: 'Datos extraídos directamente del PDF cargado'
    });
    
  } catch (error) {
    const tiempoError = Date.now() - inicio;
    console.error('❌ Error en extracción real:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error procesando el PDF',
        tiempoProcesamiento: `${tiempoError}ms`,
        sugerencias: [
          'Verificar que el PDF contenga tablas con texto seleccionable',
          'Asegurar que las tablas estén bien estructuradas',
          'Probar con un PDF más simple si el problema persiste',
          'El PDF puede contener solo imágenes (requiere OCR)'
        ]
      },
      { status: 500 }
    );
  }
}

function calcularCalidadExtraccion(datos: FilaExtraida[]): string {
  if (datos.length === 0) return 'Sin datos';
  
  const conCodigo = datos.filter(d => d.codigo).length;
  const conDescripcion = datos.filter(d => d.descripcion).length;
  const conPrecio = datos.filter(d => d.precio).length;
  
  const porcentajeCompletitud = ((conCodigo + conDescripcion + conPrecio) / (datos.length * 3)) * 100;
  
  if (porcentajeCompletitud >= 70) return 'Alta';
  if (porcentajeCompletitud >= 40) return 'Media';
  return 'Baja';
}

export async function GET() {
  return NextResponse.json({
    service: 'PDF to Excel - Extracción Real',
    version: '6.0.0 - Real Data Only',
    descripcion: 'Extrae datos REALES del PDF cargado, sin datos inventados',
    caracteristicas: [
      '✅ Extracción real de texto del PDF',
      '✅ Detección inteligente de tablas',
      '✅ Análisis de patrones reales',
      '✅ Sin datos hardcodeados',
      '✅ Múltiples estrategias de parsing',
      '✅ Excel con datos del archivo cargado'
    ],
    garantias: [
      'Solo datos del PDF cargado',
      'Sin productos inventados',
      'Análisis real del contenido',
      'Transparencia total en extracción'
    ]
  });
}