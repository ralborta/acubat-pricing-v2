// PDF A EXCEL - EXTRACTOR QUE SÍ FUNCIONA
// Usando pdf-parse + filtros de calidad para datos reales

import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

interface FilaTabla {
  codigo?: string;
  descripcion?: string;
  precio?: number;
  stock?: number;
  unidad?: string;
}

// ============================================
// ESTRATEGIA 1: PDF-PARSE (Texto nativo)
// ============================================

async function extraerTextoConPDFParse(pdfBuffer: Buffer): Promise<string[]> {
  try {
    console.log('📄 Intentando extracción con pdf-parse...');
    
    // Usar pdf-parse que funciona mejor en serverless
    const pdfParse = require('pdf-parse');
    const data = await pdfParse(pdfBuffer, {
      normalizeWhitespace: true,
      disableCombineTextItems: false
    });
    
    if (data.text && data.text.length > 50) {
      console.log(`✅ Texto extraído: ${data.text.length} caracteres`);
      
      // Dividir en líneas y limpiar
      const lineas = data.text
        .split('\n')
        .map((linea: string) => linea.trim())
        .filter((linea: string) => linea.length > 3)
        .filter((linea: string) => !/^[\s\u0000-\u001F\u007F-\u009F]*$/.test(linea)); // Filtrar basura
      
      console.log(`📝 ${lineas.length} líneas válidas extraídas`);
      return lineas;
    }
    
    throw new Error('PDF sin texto extraíble');
    
  } catch (error) {
    console.warn('⚠️ pdf-parse falló:', error instanceof Error ? error.message : 'Error desconocido');
    throw error;
  }
}

// ============================================
// ESTRATEGIA 2: Parsing manual del PDF
// ============================================

async function extraerTextoManual(pdfBuffer: Buffer): Promise<string[]> {
  try {
    console.log('🔧 Extrayendo texto manualmente...');
    
    const pdfString = pdfBuffer.toString('latin1');
    const lineasEncontradas: string[] = [];
    
    // Buscar streams de texto
    const streamMatches = pdfString.match(/stream\s*([\s\S]*?)\s*endstream/g);
    
    if (streamMatches) {
      for (const stream of streamMatches) {
        // Buscar texto entre paréntesis (formato PDF común)
        const textMatches = stream.match(/\(([^)]{3,100}?)\)/g);
        
        if (textMatches) {
          for (const match of textMatches) {
            const texto = match.slice(1, -1); // Quitar paréntesis
            
            // Filtrar solo texto legible
            if (esTextoLegible(texto)) {
              lineasEncontradas.push(texto);
            }
          }
        }
        
        // Buscar arrays de texto [(...) (...)]
        const arrayMatches = stream.match(/\[\s*(\([^)]+\)\s*)+\]/g);
        
        if (arrayMatches) {
          for (const arrayMatch of arrayMatches) {
            const textos = arrayMatch.match(/\(([^)]+)\)/g);
            if (textos) {
              const lineaCompleta = textos.map(t => t.slice(1, -1)).join(' ');
              if (esTextoLegible(lineaCompleta)) {
                lineasEncontradas.push(lineaCompleta);
              }
            }
          }
        }
      }
    }
    
    // Buscar texto directo
    const textDirecto = pdfString.match(/BT\s*([\s\S]*?)\s*ET/g);
    if (textDirecto) {
      for (const bt of textDirecto) {
        const matches = bt.match(/\(([^)]{3,})\)/g);
        if (matches) {
          for (const match of matches) {
            const texto = match.slice(1, -1);
            if (esTextoLegible(texto)) {
              lineasEncontradas.push(texto);
            }
          }
        }
      }
    }
    
    console.log(`📝 Extracción manual: ${lineasEncontradas.length} líneas`);
    return lineasEncontradas.filter(linea => linea.length > 2);
    
  } catch (error) {
    console.error('❌ Error en extracción manual:', error);
    throw new Error('No se pudo extraer texto del PDF');
  }
}

// ============================================
// FILTRO DE TEXTO LEGIBLE
// ============================================

function esTextoLegible(texto: string): boolean {
  if (!texto || texto.length < 3) return false;
  
  // Filtrar caracteres raros y símbolos
  const caracteresRaros = /[♠♦♣♥♪♫☺☻◄►▲▼♀♂♤♧♡♢]/;
  if (caracteresRaros.test(texto)) return false;
  
  // Filtrar texto que es principalmente caracteres de control
  const caracteresControl = /[\u0000-\u001F\u007F-\u009F]/g;
  const textoLimpio = texto.replace(caracteresControl, '');
  if (textoLimpio.length < texto.length * 0.7) return false;
  
  // Debe contener al menos algunas letras
  const tieneLetras = /[a-zA-ZáéíóúñÁÉÍÓÚÑ]/.test(texto);
  if (!tieneLetras) return false;
  
  // Filtrar líneas que son solo números o símbolos
  if (/^[\d\s\-_.=]+$/.test(texto)) return false;
  
  return true;
}

// ============================================
// DETECTOR DE TABLAS MEJORADO
// ============================================

function detectarYParsearTablas(lineasTexto: string[]): FilaTabla[] {
  console.log('🔍 Detectando tablas en texto limpio...');
  
  if (lineasTexto.length === 0) {
    throw new Error('No se extrajo texto válido del PDF');
  }
  
  console.log('📋 Primeras 10 líneas para análisis:');
  lineasTexto.slice(0, 10).forEach((linea, i) => {
    console.log(`  ${i+1}: "${linea}"`);
  });
  
  const filas: FilaTabla[] = [];
  let enTabla = false;
  
  for (let i = 0; i < lineasTexto.length; i++) {
    const linea = lineasTexto[i].trim();
    
    if (linea.length < 5) continue;
    
    // Detectar encabezados de tabla
    if (esEncabezadoTabla(linea)) {
      enTabla = true;
      console.log(`📊 Tabla detectada en línea ${i}: "${linea}"`);
      continue;
    }
    
    // Si estamos en tabla, intentar extraer datos
    if (enTabla || pareceFilaDeProducto(linea)) {
      const fila = parsearFilaProducto(linea);
      if (fila) {
        filas.push(fila);
        console.log(`✅ Producto ${filas.length}: ${fila.codigo || 'SIN_COD'} - ${fila.descripcion?.substring(0, 30) || 'SIN_DESC'}`);
      }
    }
    
    // Detectar fin de tabla
    if (esFinTabla(linea)) {
      enTabla = false;
    }
  }
  
  console.log(`🎯 Total extraído: ${filas.length} productos`);
  
  if (filas.length === 0) {
    // Crear datos de ejemplo SOLO como último recurso
    console.log('⚠️ No se detectaron productos. Creando ejemplo para demostración...');
    return crearEjemploTransparente();
  }
  
  return filas;
}

function esEncabezadoTabla(linea: string): boolean {
  const lineaLower = linea.toLowerCase();
  const palabrasClave = [
    'codigo', 'descripcion', 'precio', 'stock', 'cantidad',
    'producto', 'item', 'articulo', 'valor', 'importe',
    'referencia', 'nombre', 'detalle'
  ];
  
  let coincidencias = 0;
  for (const palabra of palabrasClave) {
    if (lineaLower.includes(palabra)) coincidencias++;
  }
  
  return coincidencias >= 2;
}

function pareceFilaDeProducto(linea: string): boolean {
  // Una fila de producto típicamente tiene:
  // - Código alfanumérico
  // - Descripción de texto
  // - Números (precio, cantidad)
  
  const tieneLetras = /[a-zA-Z]/.test(linea);
  const tieneNumeros = /\d/.test(linea);
  const tieneEspacios = /\s/.test(linea);
  const elementos = linea.split(/\s+/).length;
  
  return tieneLetras && tieneNumeros && tieneEspacios && elementos >= 3;
}

function parsearFilaProducto(linea: string): FilaTabla | null {
  try {
    // Separar por espacios múltiples o tabs
    let elementos = linea.split(/\s{2,}|\t/).map(e => e.trim()).filter(e => e);
    
    // Si no funciona, usar espacios simples
    if (elementos.length < 3) {
      elementos = linea.split(/\s+/).filter(e => e.length > 0);
    }
    
    if (elementos.length < 2) return null;
    
    const fila: FilaTabla = {};
    
    // Estrategia de asignación por patrones
    for (let i = 0; i < elementos.length; i++) {
      const elemento = elementos[i];
      
      // Código: alfanumérico, generalmente corto, al inicio
      if (i <= 1 && !fila.codigo && /^[A-Z0-9]{2,12}$/i.test(elemento)) {
        fila.codigo = elemento.toUpperCase();
        continue;
      }
      
      // Precio: contiene números y posibles símbolos
      if (!fila.precio && /[\d,.]/.test(elemento) && !/^[A-Z]+$/i.test(elemento)) {
        const precio = extraerNumero(elemento);
        if (precio > 0 && precio < 1000000) {
          fila.precio = precio;
          continue;
        }
      }
      
      // Stock: número entero pequeño
      if (!fila.stock && /^\d{1,4}$/.test(elemento)) {
        const stock = parseInt(elemento);
        if (stock >= 0 && stock < 10000) {
          fila.stock = stock;
          continue;
        }
      }
      
      // Unidad: siglas conocidas
      if (!fila.unidad && /^(UN|KG|LT|MT|PZ|UD|UNIDAD)$/i.test(elemento)) {
        fila.unidad = elemento.toUpperCase();
        continue;
      }
      
      // Descripción: texto más largo, no números puros
      if (!fila.descripcion && elemento.length > 3 && !/^\d+$/.test(elemento)) {
        fila.descripcion = elemento;
      }
    }
    
    // Validar fila
    if (!fila.codigo && !fila.descripcion) return null;
    if (fila.descripcion && fila.descripcion.length < 3) return null;
    
    return fila;
    
  } catch (error) {
    return null;
  }
}

function extraerNumero(texto: string): number {
  const numeroLimpio = texto.replace(/[^\d.,]/g, '');
  if (numeroLimpio.includes(',') && numeroLimpio.includes('.')) {
    // Formato europeo: 1.234,56
    if (numeroLimpio.lastIndexOf(',') > numeroLimpio.lastIndexOf('.')) {
      return parseFloat(numeroLimpio.replace(/\./g, '').replace(',', '.'));
    }
  }
  const numero = parseFloat(numeroLimpio.replace(',', '.'));
  return isNaN(numero) ? 0 : numero;
}

function esFinTabla(linea: string): boolean {
  return /^(total|subtotal|suma|observaciones|notas)/i.test(linea);
}

// ============================================
// EJEMPLO TRANSPARENTE (último recurso)
// ============================================

function crearEjemploTransparente(): FilaTabla[] {
  console.log('📝 Creando ejemplo transparente para demostración...');
  
  return [
    {
      codigo: 'DEMO001',
      descripcion: 'PRODUCTO DE EJEMPLO - Su PDF no contenía tablas detectables',
      precio: 0,
      stock: 0,
      unidad: 'UN'
    },
    {
      codigo: 'INFO',
      descripcion: 'Este archivo muestra la estructura esperada del Excel',
      precio: 0,
      stock: 0,
      unidad: 'UN'
    },
    {
      codigo: 'AYUDA',
      descripcion: 'Verifique que su PDF contenga tablas con texto seleccionable',
      precio: 0,
      stock: 0,
      unidad: 'UN'
    }
  ];
}

// ============================================
// GENERADOR DE EXCEL
// ============================================

function generarExcelReal(datos: FilaTabla[], nombreArchivo: string, esEjemplo: boolean = false): Buffer {
  const workbook = XLSX.utils.book_new();
  
  // Hoja principal
  const worksheet = XLSX.utils.json_to_sheet(datos);
  worksheet['!cols'] = [
    { wch: 12 }, { wch: 45 }, { wch: 12 }, { wch: 8 }, { wch: 10 }
  ];
  
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos');
  
  // Hoja de información
  const info = [
    ['INFORMACIÓN DE EXTRACCIÓN'],
    [''],
    ['Archivo original:', nombreArchivo],
    ['Fecha de procesamiento:', new Date().toLocaleString('es-ES')],
    ['Filas procesadas:', datos.length],
    ['Tipo de extracción:', esEjemplo ? 'EJEMPLO (PDF sin tablas detectables)' : 'DATOS REALES'],
    [''],
    esEjemplo ? ['NOTA IMPORTANTE:', 'Su PDF no contenía tablas detectables.'] : ['Estado:', 'Datos extraídos exitosamente'],
    esEjemplo ? ['', 'Este archivo muestra la estructura esperada.'] : ['', ''],
    esEjemplo ? ['', 'Verifique que su PDF tenga texto seleccionable.'] : ['', ''],
    [''],
    ['SUGERENCIAS PARA MEJORES RESULTADOS:'],
    ['• Use PDFs con texto seleccionable (no imágenes escaneadas)'],
    ['• Asegúrese de que las tablas estén bien estructuradas'],
    ['• Evite PDFs con protección o encriptación'],
    ['• Tablas con encabezados claros funcionan mejor']
  ];
  
  const worksheetInfo = XLSX.utils.aoa_to_sheet(info);
  XLSX.utils.book_append_sheet(workbook, worksheetInfo, 'Información');
  
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
}

// ============================================
// API ROUTE PRINCIPAL
// ============================================

export async function POST(request: NextRequest) {
  const inicio = Date.now();
  
  try {
    console.log('🚀 Iniciando extracción REAL de PDF...');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No se proporcionó archivo PDF' },
        { status: 400 }
      );
    }
    
    if (!file.type.includes('pdf')) {
      return NextResponse.json(
        { success: false, error: 'Solo archivos PDF son soportados' },
        { status: 400 }
      );
    }
    
    if (file.size > 15 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'Archivo muy grande (máximo 15MB)' },
        { status: 400 }
      );
    }
    
    console.log(`📄 Procesando: ${file.name}`);
    
    const arrayBuffer = await file.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);
    
    let lineasTexto: string[] = [];
    let metodoUsado = '';
    
    // Intentar múltiples métodos de extracción
    try {
      lineasTexto = await extraerTextoConPDFParse(pdfBuffer);
      metodoUsado = 'pdf-parse';
    } catch (error1) {
      console.log('📄 Intentando extracción manual...');
      try {
        lineasTexto = await extraerTextoManual(pdfBuffer);
        metodoUsado = 'manual';
      } catch (error2) {
        console.error('❌ Todos los métodos fallaron');
        throw new Error('No se pudo extraer texto del PDF. Puede ser un PDF de solo imágenes o estar protegido.');
      }
    }
    
    // Detectar y parsear tablas
    const productos = detectarYParsearTablas(lineasTexto);
    const esEjemplo = productos.length <= 3 && productos[0]?.codigo === 'DEMO001';
    
    // Generar Excel
    const excelBuffer = generarExcelReal(productos, file.name, esEjemplo);
    const excelBase64 = excelBuffer.toString('base64');
    
    const tiempoTotal = Date.now() - inicio;
    
    return NextResponse.json({
      success: true,
      excel: excelBase64,
      estadisticas: {
        tiempoProcesamiento: `${tiempoTotal}ms`,
        metodoExtraccion: metodoUsado,
        lineasTexto: lineasTexto.length,
        productosExtraidos: productos.length,
        esEjemplo: esEjemplo,
        calidad: esEjemplo ? 'Ejemplo' : productos.length > 5 ? 'Alta' : 'Media'
      },
      nombreSugerido: file.name.replace('.pdf', '_extraido.xlsx'),
      mensaje: esEjemplo 
        ? '⚠️ PDF sin tablas detectables - Se creó archivo de ejemplo'
        : `✅ ${productos.length} productos extraídos exitosamente`,
      transparencia: esEjemplo 
        ? 'Este archivo contiene datos de ejemplo porque no se detectaron tablas en su PDF'
        : 'Datos extraídos directamente de su PDF'
    });
    
  } catch (error) {
    const tiempoError = Date.now() - inicio;
    console.error('❌ Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error procesando PDF',
        tiempoProcesamiento: `${tiempoError}ms`
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'PDF Extractor Real',
    version: '8.0.0 - Text Quality Focused',
    descripcion: 'Extrae datos reales, filtra basura, transparente sobre ejemplos'
  });
}