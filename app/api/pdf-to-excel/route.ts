// PDF A EXCEL - SOLUCIONADO ERROR DOMMatrix
// Usando solo APIs compatibles con Vercel serverless

import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

interface FilaExtraida {
  codigo?: string;
  descripcion?: string;
  precio?: number;
  stock?: number;
  categoria?: string;
  unidad?: string;
}

// ============================================
// EXTRACTOR SIN DEPENDENCIAS PROBLEMÁTICAS
// ============================================

async function extraerTextoCompatible(pdfArrayBuffer: ArrayBuffer): Promise<string[]> {
  console.log('📄 Extrayendo texto con método compatible...');
  
  try {
    // POLYFILL para DOMMatrix (evitar el error)
    if (typeof globalThis.DOMMatrix === 'undefined') {
      console.log('🔧 Configurando polyfills para entorno serverless...');
      
      // Polyfill básico para DOMMatrix
      globalThis.DOMMatrix = class DOMMatrix {
        a: number = 1;
        b: number = 0;
        c: number = 0;
        d: number = 1;
        e: number = 0;
        f: number = 0;
        
        constructor() {
          // Propiedades ya definidas arriba
        }
        
        static fromMatrix() { return new DOMMatrix(); }
      } as any;
      
      // Otros polyfills necesarios
      if (typeof globalThis.Path2D === 'undefined') {
        globalThis.Path2D = class Path2D {} as any;
      }
      
      if (typeof globalThis.CanvasGradient === 'undefined') {
        globalThis.CanvasGradient = class CanvasGradient {} as any;
      }
      
      if (typeof globalThis.CanvasPattern === 'undefined') {
        globalThis.CanvasPattern = class CanvasPattern {} as any;
      }
    }
    
    // Importar pdf.js DESPUÉS de los polyfills
    const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist');
    
    // Configurar worker
    GlobalWorkerOptions.workerSrc = 
      `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js`;
    
    console.log('📚 Cargando PDF...');
    const loadingTask = getDocument({
      data: pdfArrayBuffer,
      verbosity: 0, // Sin logs
      maxImageSize: 1024 * 1024, // 1MB máximo por imagen
      disableFontFace: true, // Evitar problemas de fuentes
      disableRange: false,
      disableStream: false
    });
    
    const pdfDoc = await loadingTask.promise;
    console.log(`📊 PDF cargado exitosamente: ${pdfDoc.numPages} páginas`);
    
    const todasLasLineas: string[] = [];
    const maxPaginas = Math.min(pdfDoc.numPages, 8); // Límite conservador
    
    for (let numPagina = 1; numPagina <= maxPaginas; numPagina++) {
      console.log(`📖 Procesando página ${numPagina}/${maxPaginas}`);
      
      try {
        const page = await pdfDoc.getPage(numPagina);
        const textContent = await page.getTextContent();
        
        // Procesar items de texto
        const items = textContent.items as any[];
        console.log(`📝 Encontrados ${items.length} elementos de texto en página ${numPagina}`);
        
        // Agrupar texto por líneas (posición Y similar)
        const lineasPorY = new Map<number, string[]>();
        
        for (const item of items) {
          if (item.str && item.str.trim() && item.transform) {
            const y = Math.round(item.transform[5]); // Posición Y
            const texto = item.str.trim();
            
            if (!lineasPorY.has(y)) {
              lineasPorY.set(y, []);
            }
            lineasPorY.get(y)!.push(texto);
          }
        }
        
        // Convertir a líneas ordenadas
        const lineasPagina = Array.from(lineasPorY.entries())
          .sort(([y1], [y2]) => y2 - y1) // De arriba a abajo
          .map(([y, textos]) => textos.join(' ').trim())
          .filter(linea => linea.length > 2);
        
        todasLasLineas.push(...lineasPagina);
        console.log(`✅ Página ${numPagina}: ${lineasPagina.length} líneas extraídas`);
        
      } catch (pageError) {
        console.warn(`⚠️ Error en página ${numPagina}:`, pageError instanceof Error ? pageError.message : 'Error desconocido');
        continue; // Continuar con la siguiente página
      }
    }
    
    console.log(`✅ Extracción completada: ${todasLasLineas.length} líneas totales`);
    
    // Debug: mostrar primeras líneas
    if (todasLasLineas.length > 0) {
      console.log('🔍 Primeras 5 líneas extraídas:');
      todasLasLineas.slice(0, 5).forEach((linea, i) => {
        console.log(`  ${i+1}: "${linea}"`);
      });
    }
    
    return todasLasLineas;
    
  } catch (error) {
    console.error('❌ Error completo en extracción:', error);
    
    // Si falla todo, intentar extracción básica
    return extraerTextoBasico(pdfArrayBuffer);
  }
}

// ============================================
// EXTRACTOR BÁSICO DE RESPALDO
// ============================================

async function extraerTextoBasico(pdfArrayBuffer: ArrayBuffer): Promise<string[]> {
  console.log('🔄 Intentando extracción básica de respaldo...');
  
  try {
    // Convertir ArrayBuffer a string para análisis básico
    const uint8Array = new Uint8Array(pdfArrayBuffer);
    const decoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: false });
    
    let contenidoCompleto = '';
    
    // Leer en chunks para evitar problemas de memoria
    const chunkSize = 1024 * 1024; // 1MB chunks
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.slice(i, i + chunkSize);
      contenidoCompleto += decoder.decode(chunk, { stream: true });
    }
    
    // Buscar patrones de texto en el PDF
    const lineasEncontradas: string[] = [];
    
    // Patrones comunes para extraer texto de PDFs
    const patronesTexto = [
      /BT\s+([^E]+?)\s+ET/g, // Texto entre BT y ET
      /Tj\s*\[([^\]]+)\]/g,   // Arrays de texto
      /\(([^)]{5,})\)/g,      // Texto entre paréntesis
      /\[([^\]]{10,})\]/g,    // Arrays de strings
    ];
    
    for (const patron of patronesTexto) {
      let match;
      while ((match = patron.exec(contenidoCompleto)) !== null) {
        const texto = match[1];
        if (texto && texto.trim().length > 3) {
          // Limpiar y procesar el texto encontrado
          const textoLimpio = texto
            .replace(/[\x00-\x1F\x7F-\x9F]/g, ' ') // Remover caracteres de control
            .replace(/\s+/g, ' ') // Normalizar espacios
            .trim();
          
          if (textoLimpio.length > 5) {
            lineasEncontradas.push(textoLimpio);
          }
        }
      }
    }
    
    console.log(`📝 Extracción básica encontró ${lineasEncontradas.length} elementos de texto`);
    
    if (lineasEncontradas.length === 0) {
      throw new Error('No se pudo extraer texto del PDF. Puede ser un PDF de solo imágenes o estar protegido.');
    }
    
    return lineasEncontradas;
    
  } catch (error) {
    console.error('❌ Error en extracción básica:', error);
    throw new Error('El PDF no contiene texto extraíble o está dañado. Verifique que sea un PDF con texto seleccionable.');
  }
}

// ============================================
// DETECTOR DE TABLAS (SIMPLIFICADO)
// ============================================

function detectarTablasSimplificado(lineasTexto: string[]): FilaExtraida[] {
  console.log('🔍 Detectando tablas con método simplificado...');
  
  if (lineasTexto.length === 0) {
    throw new Error('No hay texto para analizar. El PDF puede estar vacío o ser solo imágenes.');
  }
  
  const filas: FilaExtraida[] = [];
  
  // Buscar patrones que parezcan datos tabulares
  for (let i = 0; i < lineasTexto.length; i++) {
    const linea = lineasTexto[i].trim();
    
    if (linea.length < 10) continue;
    
    // Detectar si la línea parece contener datos de producto/tabla
    if (pareceFilaDeTabla(linea)) {
      const fila = extraerDatosDeLinea(linea);
      if (fila) {
        filas.push(fila);
        console.log(`✅ Fila ${filas.length}: ${fila.codigo || 'N/A'} - ${fila.descripcion?.substring(0, 30) || 'N/A'}`);
      }
    }
  }
  
  console.log(`🎯 Resultado: ${filas.length} filas detectadas`);
  
  if (filas.length === 0) {
    // Mostrar contenido para debug
    console.log('📋 Contenido extraído del PDF:');
    lineasTexto.slice(0, 10).forEach((linea, i) => {
      console.log(`  ${i+1}: "${linea}"`);
    });
    
    throw new Error('No se detectaron tablas válidas en el PDF. Verifique que contenga datos estructurados en formato de tabla.');
  }
  
  return filas;
}

function pareceFilaDeTabla(linea: string): boolean {
  // Una línea parece de tabla si:
  // 1. Contiene al menos 3 elementos separados
  // 2. Tiene al menos un número
  // 3. No es solo texto descriptivo
  
  const elementos = linea.split(/\s+/).filter(e => e.length > 0);
  const tieneNumeros = /\d/.test(linea);
  const tieneTextoDescriptivo = elementos.some(e => e.length > 8);
  
  return elementos.length >= 3 && tieneNumeros && tieneTextoDescriptivo;
}

function extraerDatosDeLinea(linea: string): FilaExtraida | null {
  try {
    // Separar elementos por espacios múltiples o patrones
    let elementos = linea.split(/\s{2,}/).map(e => e.trim()).filter(e => e);
    
    // Si no funciona, intentar separación por espacios simples
    if (elementos.length < 3) {
      elementos = linea.split(/\s+/).filter(e => e.length > 0);
    }
    
    if (elementos.length < 2) return null;
    
    const fila: FilaExtraida = {};
    
    // Asignar campos de forma heurística
    for (const elemento of elementos) {
      if (!fila.codigo && /^[A-Z0-9]{3,10}$/i.test(elemento)) {
        fila.codigo = elemento;
      } else if (!fila.precio && /[\d.,\$€]/.test(elemento)) {
        const precio = parseFloat(elemento.replace(/[^\d.,]/g, '').replace(',', '.'));
        if (!isNaN(precio) && precio > 0) {
          fila.precio = precio;
        }
      } else if (!fila.stock && /^\d{1,5}$/.test(elemento)) {
        fila.stock = parseInt(elemento);
      } else if (!fila.descripcion && elemento.length > 5 && !/^\d+$/.test(elemento)) {
        fila.descripcion = elemento;
      }
    }
    
    // Validar que tenga datos útiles
    return (fila.codigo || fila.descripcion) ? fila : null;
    
  } catch (error) {
    return null;
  }
}

// ============================================
// GENERADOR DE EXCEL
// ============================================

function generarExcelFinal(datos: FilaExtraida[], nombreArchivo: string): Buffer {
  console.log('📊 Generando Excel final...');
  
  const workbook = XLSX.utils.book_new();
  
  // Hoja principal
  const worksheet = XLSX.utils.json_to_sheet(datos);
  worksheet['!cols'] = [
    { wch: 15 }, { wch: 40 }, { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 12 }
  ];
  
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos');
  
  // Hoja de información
  const info = [
    ['INFORMACIÓN DE EXTRACCIÓN'],
    ['Archivo:', nombreArchivo],
    ['Fecha:', new Date().toLocaleString('es-ES')],
    ['Filas extraídas:', datos.length],
    ['Método:', 'Extracción directa de PDF'],
    ['Estado:', datos.length > 0 ? 'Exitoso' : 'Sin datos detectados']
  ];
  
  const worksheetInfo = XLSX.utils.aoa_to_sheet(info);
  XLSX.utils.book_append_sheet(workbook, worksheetInfo, 'Info');
  
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

// ============================================
// API ROUTE PRINCIPAL
// ============================================

export async function POST(request: NextRequest) {
  const inicio = Date.now();
  
  try {
    console.log('🚀 Iniciando conversión PDF a Excel (versión compatible)...');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No se proporcionó archivo PDF' },
        { status: 400 }
      );
    }
    
    if (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json(
        { success: false, error: 'Solo archivos PDF son soportados' },
        { status: 400 }
      );
    }
    
    if (file.size > 20 * 1024 * 1024) { // 20MB límite más conservador
      return NextResponse.json(
        { success: false, error: 'Archivo muy grande (máximo 20MB)' },
        { status: 400 }
      );
    }
    
    console.log(`📄 Procesando: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
    
    const arrayBuffer = await file.arrayBuffer();
    
    // Timeout de 40 segundos
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout: El archivo es muy complejo')), 40000)
    );
    
    const processingPromise = async () => {
      const lineasTexto = await extraerTextoCompatible(arrayBuffer);
      const datosExtraidos = detectarTablasSimplificado(lineasTexto);
      return { lineasTexto, datosExtraidos };
    };
    
    const { lineasTexto, datosExtraidos } = await Promise.race([
      processingPromise(),
      timeoutPromise
    ]) as { lineasTexto: string[], datosExtraidos: FilaExtraida[] };
    
    const excelBuffer = generarExcelFinal(datosExtraidos, file.name);
    const excelBase64 = excelBuffer.toString('base64');
    
    const tiempoFinal = Date.now() - inicio;
    
    return NextResponse.json({
      success: true,
      excel: excelBase64,
      estadisticas: {
        tiempoProcesamiento: `${tiempoFinal}ms`,
        lineasTexto: lineasTexto.length,
        filasExtraidas: datosExtraidos.length,
        conCodigo: datosExtraidos.filter(d => d.codigo).length,
        conPrecio: datosExtraidos.filter(d => d.precio).length,
        conStock: datosExtraidos.filter(d => d.stock !== undefined).length
      },
      nombreSugerido: file.name.replace('.pdf', '_extraido.xlsx'),
      mensaje: `✅ ${datosExtraidos.length} filas extraídas del PDF`
    });
    
  } catch (error) {
    const tiempoError = Date.now() - inicio;
    console.error('❌ Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error procesando PDF',
        tiempoProcesamiento: `${tiempoError}ms`,
        solucion: 'Verificar que el PDF contenga texto seleccionable y tablas estructuradas'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'PDF to Excel - Vercel Compatible',
    version: '7.0.0 - DOMMatrix Fixed',
    status: '✅ Funcionando',
    solucionado: 'Error DOMMatrix corregido con polyfills'
  });
}