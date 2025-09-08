// PDF A EXCEL - APROVECHANDO VERCEL PRO AL MÁXIMO
// 60 segundos de timeout + 50MB + processing avanzado

import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

interface FilaExtraida {
  codigo?: string;
  descripcion?: string;
  precio?: number;
  stock?: number;
  categoria?: string;
  unidad?: string;
  observaciones?: string;
}

// ============================================
// EXTRACCIÓN AVANZADA (aprovechando 60s de PRO)
// ============================================

async function extraerTextoAvanzado(pdfArrayBuffer: ArrayBuffer): Promise<string[]> {
  const inicioTiempo = Date.now();
  console.log('🚀 VERCEL PRO: Extracción avanzada iniciada...');
  
  try {
    const pdfjs = await import('pdfjs-dist/build/pdf.js');
    const { getDocument, GlobalWorkerOptions } = pdfjs;
    
    GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
    
    const loadingTask = getDocument({ 
      data: pdfArrayBuffer,
      maxImageSize: 5 * 1024 * 1024, // 5MB por imagen (PRO puede manejar más)
      disableFontFace: false, // Mejor calidad de texto
      verbosity: 1
    });
    
    const pdfDoc = await loadingTask.promise;
    console.log(`📊 PDF cargado: ${pdfDoc.numPages} páginas totales`);
    
    const lineasTexto: string[] = [];
    
    // CON PRO podemos procesar MÁS páginas
    const maxPaginas = Math.min(pdfDoc.numPages, 15); // 15 páginas con PRO
    
    for (let numPagina = 1; numPagina <= maxPaginas; numPagina++) {
      // Control de tiempo más relajado con PRO (55 segundos)
      const tiempoTranscurrido = Date.now() - inicioTiempo;
      if (tiempoTranscurrido > 55000) {
        console.log(`⏰ Límite de tiempo PRO alcanzado: ${tiempoTranscurrido}ms`);
        break;
      }
      
      console.log(`📖 Procesando página ${numPagina}/${maxPaginas} (${tiempoTranscurrido}ms)`);
      
      const page = await pdfDoc.getPage(numPagina);
      const textContent = await page.getTextContent();
      
      // EXTRACCIÓN AVANZADA: Organizar por posición espacial
      interface TextItem {
        texto: string;
        x: number;
        y: number;
        ancho: number;
        alto: number;
      }
      
      const items: TextItem[] = [];
      
      for (const item of textContent.items as any[]) {
        if (item.str && item.str.trim()) {
          items.push({
            texto: item.str.trim(),
            x: Math.round(item.transform[4]),
            y: Math.round(item.transform[5]),
            ancho: Math.round(item.width || 0),
            alto: Math.round(item.height || 0)
          });
        }
      }
      
      // Agrupar por filas (Y similar) y ordenar por X
      const filasPorY = new Map<number, TextItem[]>();
      const toleranciaY = 5; // píxeles de tolerancia
      
      for (const item of items) {
        let yEncontrado = false;
        
        for (const [yExistente, itemsEnY] of filasPorY.entries()) {
          if (Math.abs(item.y - yExistente) <= toleranciaY) {
            itemsEnY.push(item);
            yEncontrado = true;
            break;
          }
        }
        
        if (!yEncontrado) {
          filasPorY.set(item.y, [item]);
        }
      }
      
      // Convertir a líneas de texto ordenadas
      const filasOrdenadas = Array.from(filasPorY.entries())
        .sort(([y1], [y2]) => y2 - y1) // De arriba a abajo
        .map(([y, items]) => {
          // Ordenar items por posición X (izquierda a derecha)
          const itemsOrdenados = items.sort((a, b) => a.x - b.x);
          return itemsOrdenados.map(item => item.texto).join(' ').trim();
        })
        .filter(linea => linea.length > 3);
      
      lineasTexto.push(...filasOrdenadas);
    }
    
    const tiempoTotal = Date.now() - inicioTiempo;
    console.log(`✅ Extracción completada: ${lineasTexto.length} líneas en ${tiempoTotal}ms`);
    
    return lineasTexto;
    
  } catch (error) {
    console.error('❌ Error en extracción:', error);
    throw new Error(`Error extrayendo texto: ${error.message}`);
  }
}

// ============================================
// PARSING INTELIGENTE AVANZADO (aprovechando tiempo PRO)
// ============================================

function parsearTablasAvanzado(lineasTexto: string[]): FilaExtraida[] {
  console.log('🧠 Análisis avanzado de tablas iniciado...');
  
  const filas: FilaExtraida[] = [];
  let estadoActual: 'buscando' | 'en_tabla' | 'procesando_datos' = 'buscando';
  let tipoTablaDetectado = '';
  let patronColumnas: string[] = [];
  
  // PATRONES AVANZADOS para diferentes tipos de tablas
  const patronesTabla = {
    inventario: /^(código|code|item|art[íi]culo|producto|sku)/i,
    precios: /^(descripción|description|producto|item|servicio)/i,
    stock: /^(material|producto|item|código|referencia)/i,
    ventas: /^(fecha|período|cliente|producto)/i
  };
  
  const patronesColumna = {
    codigo: /^(código|code|item|art|sku|ref|id)/i,
    descripcion: /^(descripción|description|producto|nombre|detalle|concepto)/i,
    precio: /^(precio|price|valor|importe|costo|tarifa|monto)/i,
    stock: /^(stock|existencia|cantidad|cant|qty|inventario|disponible)/i,
    categoria: /^(categoría|category|tipo|clase|grupo|familia)/i,
    unidad: /^(unidad|unit|medida|ud|uom|um)/i
  };
  
  for (let i = 0; i < lineasTexto.length; i++) {
    const linea = lineasTexto[i].trim();
    
    if (!linea || linea.length < 5) {
      if (estadoActual === 'procesando_datos') {
        // Línea vacía puede ser separador, continuar
        continue;
      } else if (estadoActual === 'en_tabla') {
        // Fin de tabla
        estadoActual = 'buscando';
        tipoTablaDetectado = '';
        patronColumnas = [];
      }
      continue;
    }
    
    // FASE 1: Detectar inicio de tabla
    if (estadoActual === 'buscando') {
      for (const [tipo, patron] of Object.entries(patronesTabla)) {
        if (patron.test(linea)) {
          console.log(`📊 Tabla de ${tipo} detectada en línea ${i}: "${linea}"`);
          estadoActual = 'en_tabla';
          tipoTablaDetectado = tipo;
          patronColumnas = analizarEncabezados(linea);
          break;
        }
      }
      continue;
    }
    
    // FASE 2: Analizar estructura de tabla
    if (estadoActual === 'en_tabla') {
      // Buscar línea de datos o continuación de encabezados
      if (esLineaDatos(linea, patronColumnas)) {
        estadoActual = 'procesando_datos';
        // Procesar esta línea como datos
        const fila = parsearLineaAvanzada(linea, patronColumnas, tipoTablaDetectado);
        if (fila) filas.push(fila);
      } else if (complementaEncabezados(linea, patronColumnas)) {
        // Línea adicional de encabezados
        patronColumnas = [...patronColumnas, ...analizarEncabezados(linea)];
      }
      continue;
    }
    
    // FASE 3: Procesar datos de tabla
    if (estadoActual === 'procesando_datos') {
      // Detectar fin de tabla
      if (esFinDeTabla(linea)) {
        estadoActual = 'buscando';
        tipoTablaDetectado = '';
        patronColumnas = [];
        continue;
      }
      
      // Procesar línea de datos
      const fila = parsearLineaAvanzada(linea, patronColumnas, tipoTablaDetectado);
      if (fila) {
        filas.push(fila);
      }
    }
  }
  
  console.log(`✅ Análisis completado: ${filas.length} filas extraídas`);
  return aplicarPostProcesamiento(filas);
}

function analizarEncabezados(linea: string): string[] {
  const palabras = linea.toLowerCase()
    .replace(/[^\w\sáéíóúñ]/g, ' ')
    .split(/\s+/)
    .filter(p => p.length > 2);
  
  const columnas: string[] = [];
  
  for (const palabra of palabras) {
    for (const [tipo, patron] of Object.entries(patronesColumna)) {
      if (patron.test(palabra)) {
        columnas.push(tipo);
        break;
      }
    }
  }
  
  return [...new Set(columnas)]; // Eliminar duplicados
}

function esLineaDatos(linea: string, patronColumnas: string[]): boolean {
  // Una línea de datos debe tener:
  // 1. Al menos 3 elementos separados
  // 2. Al menos un número (precio, cantidad, etc.)
  // 3. No ser solo texto descriptivo
  
  const elementos = linea.split(/\s{2,}|\t/).filter(e => e.trim());
  if (elementos.length < 2) return false;
  
  const tieneNumero = /[\d.,\$€]+/.test(linea);
  const noEsSoloTexto = !/^[a-záéíóúñ\s]+$/i.test(linea);
  
  return tieneNumero && (elementos.length >= 3 || noEsSoloTexto);
}

function complementaEncabezados(linea: string, patronColumnas: string[]): boolean {
  const palabrasLinea = analizarEncabezados(linea);
  return palabrasLinea.length > 0 && !palabrasLinea.every(p => patronColumnas.includes(p));
}

function esFinDeTabla(linea: string): boolean {
  const patronesFinTabla = [
    /^(total|subtotal|suma|resumen|fin|page|página)/i,
    /^(observaciones|notas|comentarios)/i,
    /^(condiciones|términos|validez)/i
  ];
  
  return patronesFinTabla.some(p => p.test(linea));
}

function parsearLineaAvanzada(linea: string, columnas: string[], tipoTabla: string): FilaExtraida | null {
  try {
    // Múltiples estrategias de separación
    let elementos: string[] = [];
    
    // Estrategia 1: Separación por espacios múltiples
    elementos = linea.split(/\s{2,}/).map(e => e.trim()).filter(e => e);
    
    // Estrategia 2: Si no funciona, usar tabulaciones
    if (elementos.length < 2) {
      elementos = linea.split(/\t/).map(e => e.trim()).filter(e => e);
    }
    
    // Estrategia 3: Regex específico por tipo de tabla
    if (elementos.length < 2) {
      switch (tipoTabla) {
        case 'inventario':
          const match1 = linea.match(/^(\S+)\s+(.+?)\s+([\d.,\$€]+)\s*(.*)$/);
          if (match1) elementos = [match1[1], match1[2], match1[3], match1[4]].filter(e => e.trim());
          break;
        case 'precios':
          const match2 = linea.match(/^(.+?)\s+([\d.,\$€]+)\s*(.*)$/);
          if (match2) elementos = [match2[1], match2[2], match2[3]].filter(e => e.trim());
          break;
      }
    }
    
    if (elementos.length < 1) return null;
    
    // Mapear elementos a campos
    const fila: FilaExtraida = {};
    
    // Asignación inteligente basada en patrones y posición
    for (let i = 0; i < elementos.length; i++) {
      const elemento = elementos[i];
      
      // Detectar tipo de dato por contenido
      if (/^[\w\d-]{2,12}$/.test(elemento) && !fila.codigo) {
        fila.codigo = elemento;
      } else if (/[\d.,]+\s*[\$€]?|\$[\d.,]+/.test(elemento) && !fila.precio) {
        const precio = extraerNumero(elemento);
        if (precio > 0) fila.precio = precio;
      } else if (/^\d+$/.test(elemento) && parseInt(elemento) < 10000 && !fila.stock) {
        fila.stock = parseInt(elemento);
      } else if (elemento.length > 5 && !fila.descripcion) {
        fila.descripcion = elemento;
      } else if (/^(kg|gr|lt|mt|pz|un|ud)$/i.test(elemento)) {
        fila.unidad = elemento;
      } else if (!fila.categoria && elemento.length > 3 && elemento.length < 20) {
        fila.categoria = elemento;
      }
    }
    
    // Validaciones
    if (!fila.descripcion && !fila.codigo) return null;
    if (fila.descripcion && fila.descripcion.length < 3) return null;
    
    return fila;
    
  } catch (error) {
    console.warn('⚠️ Error parseando línea avanzada:', linea.substring(0, 50));
    return null;
  }
}

function extraerNumero(texto: string): number {
  const match = texto.match(/([\d.,]+)/);
  if (match) {
    const numero = parseFloat(match[1].replace(',', '.'));
    return isNaN(numero) ? 0 : numero;
  }
  return 0;
}

function aplicarPostProcesamiento(filas: FilaExtraida[]): FilaExtraida[] {
  console.log('🔧 Aplicando post-procesamiento...');
  
  return filas
    .filter(fila => {
      // Filtrar filas muy pobres en datos
      const campos = Object.keys(fila).length;
      return campos >= 2 && (fila.descripcion || fila.codigo);
    })
    .map(fila => {
      // Limpiar y normalizar datos
      if (fila.descripcion) {
        fila.descripcion = fila.descripcion
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 100); // Limitar longitud
      }
      
      if (fila.codigo) {
        fila.codigo = fila.codigo.toUpperCase().trim();
      }
      
      return fila;
    });
}

// ============================================
// EXCEL AVANZADO (aprovechando capacidad PRO)
// ============================================

function generarExcelAvanzado(datos: FilaExtraida[], nombreArchivo: string, estadisticas: any): Buffer {
  console.log('📊 Generando Excel avanzado...');
  
  const workbook = XLSX.utils.book_new();
  
  if (datos.length === 0) {
    // Hoja de diagnóstico detallada
    const diagnostico = [
      ['DIAGNÓSTICO DE EXTRACCIÓN'],
      [''],
      ['Estado:', 'No se detectaron tablas válidas'],
      ['Archivo:', nombreArchivo],
      ['Páginas procesadas:', estadisticas.paginasProcesadas || 0],
      ['Líneas de texto:', estadisticas.lineasTexto || 0],
      ['Tiempo de procesamiento:', estadisticas.tiempoProcesamiento || 'N/A'],
      [''],
      ['POSIBLES CAUSAS:'],
      ['• El PDF contiene solo imágenes (necesita OCR)'],
      ['• Las tablas no tienen estructura detectables'],
      ['• El formato de tabla es muy irregular'],
      ['• El texto está muy fragmentado'],
      [''],
      ['SUGERENCIAS:'],
      ['• Verificar que el PDF contenga texto seleccionable'],
      ['• Usar PDFs con tablas bien estructuradas'],
      ['• Probar con documentos más simples primero'],
      ['• Contactar soporte si el problema persiste']
    ];
    
    const worksheetDiag = XLSX.utils.aoa_to_sheet(diagnostico);
    XLSX.utils.book_append_sheet(workbook, worksheetDiag, 'Diagnóstico');
  } else {
    // Hoja principal con datos extraídos
    const worksheet = XLSX.utils.json_to_sheet(datos);
    
    // Configuración avanzada de columnas
    const anchos = [
      { wch: 15 }, // código
      { wch: 45 }, // descripción
      { wch: 12 }, // precio
      { wch: 8 },  // stock
      { wch: 18 }, // categoria
      { wch: 10 }, // unidad
      { wch: 25 }  // observaciones
    ];
    worksheet['!cols'] = anchos;
    
    // Formato de encabezados
    if (worksheet['!ref']) {
      const range = XLSX.utils.decode_range(worksheet['!ref']);
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddr = XLSX.utils.encode_cell({ r: 0, c: col });
        if (worksheet[cellAddr]) {
          worksheet[cellAddr].s = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "4472C4" } },
            alignment: { horizontal: "center" }
          };
        }
      }
      
      // Formato de datos numéricos
      for (let row = 1; row <= range.e.r; row++) {
        // Columna de precio
        const precioCellAddr = XLSX.utils.encode_cell({ r: row, c: 2 });
        if (worksheet[precioCellAddr] && typeof worksheet[precioCellAddr].v === 'number') {
          worksheet[precioCellAddr].z = '"$"#,##0.00';
        }
      }
    }
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos Extraídos');
    
    // Hoja de análisis avanzado
    const analisis = [
      ['ANÁLISIS DETALLADO'],
      [''],
      ['Archivo procesado:', nombreArchivo],
      ['Fecha de procesamiento:', new Date().toLocaleString('es-ES')],
      [''],
      ['ESTADÍSTICAS GENERALES'],
      ['Total de filas extraídas:', datos.length],
      ['Filas con código:', datos.filter(d => d.codigo).length],
      ['Filas con descripción:', datos.filter(d => d.descripcion).length],
      ['Filas con precio:', datos.filter(d => d.precio).length],
      ['Filas con stock:', datos.filter(d => d.stock).length],
      ['Filas con categoría:', datos.filter(d => d.categoria).length],
      [''],
      ['ANÁLISIS DE PRECIOS'],
      ['Precio mínimo:', Math.min(...datos.filter(d => d.precio).map(d => d.precio!)) || 0],
      ['Precio máximo:', Math.max(...datos.filter(d => d.precio).map(d => d.precio!)) || 0],
      ['Precio promedio:', (datos.filter(d => d.precio).reduce((sum, d) => sum + d.precio!, 0) / datos.filter(d => d.precio).length).toFixed(2) || 0],
      [''],
      ['ANÁLISIS DE STOCK'],
      ['Stock total:', datos.filter(d => d.stock).reduce((sum, d) => sum + d.stock!, 0)],
      ['Productos sin stock:', datos.filter(d => d.stock === 0).length],
      ['Stock promedio:', (datos.filter(d => d.stock).reduce((sum, d) => sum + d.stock!, 0) / datos.filter(d => d.stock).length).toFixed(0) || 0],
      [''],
      ['CATEGORÍAS DETECTADAS'],
      ...Array.from(new Set(datos.filter(d => d.categoria).map(d => d.categoria)))
        .map(cat => ['', cat])
    ];
    
    const worksheetAnalisis = XLSX.utils.aoa_to_sheet(analisis);
    XLSX.utils.book_append_sheet(workbook, worksheetAnalisis, 'Análisis');
    
    // Hoja de procesamiento técnico
    const tecnico = [
      ['INFORMACIÓN TÉCNICA'],
      [''],
      ['Método de extracción:', 'PDF.js + Parsing Avanzado'],
      ['Tiempo de procesamiento:', estadisticas.tiempoProcesamiento || 'N/A'],
      ['Páginas procesadas:', estadisticas.paginasProcesadas || 0],
      ['Líneas de texto extraídas:', estadisticas.lineasTexto || 0],
      ['Algoritmo de detección:', 'Análisis espacial + Patrones'],
      ['Plan Vercel:', 'PRO (60s timeout)'],
      [''],
      ['CALIDAD DE EXTRACCIÓN'],
      ['Filas procesadas:', estadisticas.lineasTexto || 0],
      ['Filas válidas extraídas:', datos.length],
      ['Tasa de éxito:', `${((datos.length / (estadisticas.lineasTexto || 1)) * 100).toFixed(1)}%`],
      [''],
      ['CAMPOS DETECTADOS'],
      ['Códigos únicos:', new Set(datos.filter(d => d.codigo).map(d => d.codigo)).size],
      ['Descripciones únicas:', new Set(datos.filter(d => d.descripcion).map(d => d.descripcion)).size],
      ['Precios únicos:', new Set(datos.filter(d => d.precio).map(d => d.precio)).size]
    ];
    
    const worksheetTecnico = XLSX.utils.aoa_to_sheet(tecnico);
    XLSX.utils.book_append_sheet(workbook, worksheetTecnico, 'Info Técnica');
  }
  
  // Generar buffer con compresión
  const buffer = XLSX.write(workbook, {
    type: 'buffer',
    bookType: 'xlsx',
    compression: true,
    cellStyles: true
  });
  
  console.log(`✅ Excel avanzado generado: ${buffer.length} bytes`);
  return buffer;
}

// ============================================
// API ROUTE OPTIMIZADA PARA VERCEL PRO
// ============================================

export async function POST(request: NextRequest) {
  const tiempoInicio = Date.now();
  
  try {
    console.log('🚀 VERCEL PRO: Iniciando conversión avanzada PDF a Excel...');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No se proporcionó archivo PDF' },
        { status: 400 }
      );
    }
    
    // Validaciones PRO (más permisivas)
    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json(
        { success: false, error: 'Solo archivos PDF son soportados' },
        { status: 400 }
      );
    }
    
    // Límite PRO: 50MB
    const MAX_SIZE_PRO = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE_PRO) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Archivo muy grande. Máximo con Vercel PRO: ${MAX_SIZE_PRO / 1024 / 1024}MB`,
          tamañoArchivo: `${(file.size / 1024 / 1024).toFixed(2)}MB`
        },
        { status: 400 }
      );
    }
    
    console.log(`📄 Procesando: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
    
    // Leer archivo
    const arrayBuffer = await file.arrayBuffer();
    
    // Control de timeout PRO (55 segundos para seguridad)
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout: Procesamiento muy complejo incluso para PRO')), 55000)
    );
    
    // PASO 1: Extracción avanzada
    console.log('⚡ Iniciando extracción avanzada...');
    const extractionPromise = extraerTextoAvanzado(arrayBuffer);
    const lineasTexto = await Promise.race([extractionPromise, timeoutPromise]) as string[];
    
    // PASO 2: Parsing avanzado
    console.log('🧠 Iniciando análisis avanzado...');
    const datosExtraidos = parsearTablasAvanzado(lineasTexto);
    
    // PASO 3: Excel avanzado
    const tiempoTranscurrido = Date.now() - tiempoInicio;
    const estadisticas = {
      tiempoProcesamiento: `${tiempoTranscurrido}ms`,
      lineasTexto: lineasTexto.length,
      paginasProcesadas: Math.min(15, Math.ceil(lineasTexto.length / 50)) // Estimación
    };
    
    console.log('📊 Generando Excel avanzado...');
    const excelBuffer = generarExcelAvanzado(datosExtraidos, file.name, estadisticas);
    
    // Respuesta
    const excelBase64 = excelBuffer.toString('base64');
    const tiempoFinal = Date.now() - tiempoInicio;
    
    console.log(`✅ CONVERSIÓN COMPLETADA en ${tiempoFinal}ms`);
    console.log(`📊 Resultados: ${datosExtraidos.length} filas extraídas`);
    
    return NextResponse.json({
      success: true,
      excel: excelBase64,
      estadisticas: {
        ...estadisticas,
        tiempoProcesamiento: `${tiempoFinal}ms`,
        filasExtraidas: datosExtraidos.length,
        conCodigo: datosExtraidos.filter(d => d.codigo).length,
        conPrecio: datosExtraidos.filter(d => d.precio).length,
        conStock: datosExtraidos.filter(d => d.stock).length,
        conCategoria: datosExtraidos.filter(d => d.categoria).length,
        tasaExito: `${((datosExtraidos.length / Math.max(lineasTexto.length, 1)) * 100).toFixed(1)}%`,
        planVercel: 'PRO',
        limitesUsados: {
          tiempo: `${tiempoFinal}ms / 60000ms`,
          archivo: `${(file.size / 1024 / 1024).toFixed(2)}MB / 50MB`
        }
      },
      nombreSugerido: file.name.replace('.pdf', '_extraido_pro.xlsx'),
      mensaje: datosExtraidos.length > 0 
        ? `🚀 ¡Excelente! ${datosExtraidos.length} filas extraídas con Vercel PRO`
        : '⚠️ No se detectaron tablas - revisar diagnóstico en Excel',
      calidad: datosExtraidos.length > 10 ? 'Alta' : datosExtraidos.length > 0 ? 'Media' : 'Baja'
    });
    
  } catch (error) {
    const tiempoError = Date.now() - tiempoInicio;
    console.error('❌ Error en conversión PRO:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error interno del servidor',
        tiempoProcesamiento: `${tiempoError}ms`,
        planVercel: 'PRO',
        limitesUsados: {
          tiempo: `${tiempoError}ms / 60000ms`
        },
        sugerencias: [
          'Con Vercel PRO puedes procesar archivos más grandes',
          'Verificar que el PDF contenga texto seleccionable',
          'Probar con PDFs menos complejos si el error persiste',
          'El límite de 60 segundos permite documentos extensos'
        ],
        soporteTecnico: {
          error: error.message,
          timestamp: new Date().toISOString(),
          archivo: file?.name || 'unknown',
          tamaño: file?.size ? `${(file.size / 1024 / 1024).toFixed(2)}MB` : 'unknown'
        }
      },
      { status: 500 }
    );
  }
}

// GET endpoint con información PRO
export async function GET() {
  return NextResponse.json({
    service: 'PDF to Excel Converter PRO',
    version: '4.0.0 - Vercel PRO Edition',
    plan: 'Vercel PRO',
    caracteristicas: [
      '🚀 60 segundos de procesamiento',
      '📄 Hasta 50MB por archivo',
      '📊 Hasta 15 páginas por PDF',
      '🧠 Análisis espacial avanzado',
      '📈 Múltiples hojas de Excel',
      '🔍 Detección inteligente de tablas',
      '📋 Diagnóstico detallado',
      '⚡ Optimizado para documentos complejos'
    ],
    limitaciones: [
      'Máximo 50MB por archivo',
      'Máximo 15 páginas por procesamiento',
      'Timeout de 60 segundos',
      'Requiere texto seleccionable (no OCR)'
    ],
    ventajasPRO: [
      '6x más tiempo de procesamiento vs Hobby',
      '5x más tamaño de archivo vs Hobby',
      '7x más páginas vs Hobby',
      'Análisis espacial avanzado',
      'Reportes detallados'
    ],
    endpoints: {
      POST: '/api/pdf-to-excel - Convertir PDF a Excel',
      GET: '/api/pdf-to-excel - Información del servicio'
    },
    ejemploUso: {
      url: 'POST /api/pdf-to-excel',
      headers: { 'Content-Type': 'multipart/form-data' },
      body: 'FormData con campo "file"',
      respuesta: {
        success: true,
        excel: 'base64_data...',
        estadisticas: '...',
        nombreSugerido: 'archivo_extraido_pro.xlsx'
      }
    }
  });
}
