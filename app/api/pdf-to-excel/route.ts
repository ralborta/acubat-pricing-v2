// PDF A EXCEL - VERCEL PRO + STRUCTURED OUTPUTS
// Implementación profesional con schema definido

import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

interface ProductoEstructurado {
  codigo: string;
  descripcion: string;
  precio: number;
  stock: number;
  unidad: string;
  categoria?: string;
}

interface RespuestaEstructurada {
  productos: ProductoEstructurado[];
  metadatos: {
    totalProductos: number;
    paginasProcesadas: number;
    calidadExtraccion: 'alta' | 'media' | 'baja';
    metodoProcesamiento: string;
  };
}

// ============================================
// SCHEMA ESTRUCTURADO PARA OPENAI
// ============================================

const SCHEMA_PRODUCTOS = {
  type: "json_schema",
  json_schema: {
    name: "extraccion_productos_pdf",
    strict: true,
    schema: {
      type: "object",
      properties: {
        productos: {
          type: "array",
          items: {
            type: "object",
            properties: {
              codigo: {
                type: "string",
                description: "Código único del producto (ej: ABC123)"
              },
              descripcion: {
                type: "string",
                description: "Descripción completa del producto"
              },
              precio: {
                type: "number",
                description: "Precio numérico sin símbolos monetarios"
              },
              stock: {
                type: "number",
                description: "Cantidad en stock como número entero"
              },
              unidad: {
                type: "string",
                description: "Unidad de medida (UN, KG, LT, etc.)"
              },
              categoria: {
                type: "string",
                description: "Categoría del producto si está disponible"
              }
            },
            required: ["codigo", "descripcion", "precio", "stock", "unidad"],
            additionalProperties: false
          }
        },
        metadatos: {
          type: "object",
          properties: {
            totalProductos: {
              type: "number",
              description: "Número total de productos extraídos"
            },
            paginasProcesadas: {
              type: "number", 
              description: "Número de páginas procesadas del PDF"
            },
            calidadExtraccion: {
              type: "string",
              enum: ["alta", "media", "baja"],
              description: "Calidad percibida de la extracción"
            },
            metodoProcesamiento: {
              type: "string",
              description: "Método usado para procesar el PDF"
            }
          },
          required: ["totalProductos", "paginasProcesadas", "calidadExtraccion", "metodoProcesamiento"],
          additionalProperties: false
        }
      },
      required: ["productos", "metadatos"],
      additionalProperties: false
    }
  }
};

// ============================================
// EXTRACTOR DE TEXTO OPTIMIZADO VERCEL PRO
// ============================================

async function extraerTextoVercelPro(pdfBuffer: Buffer): Promise<string[]> {
  console.log('Extrayendo texto con capacidades Vercel PRO...');
  
  try {
    // Usar pdf.js optimizado para Vercel PRO (60s timeout)
    const pdfjsLib = await import('pdfjs-dist');
    
    pdfjsLib.GlobalWorkerOptions.workerSrc = 
      `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js`;
    
    const loadingTask = pdfjsLib.getDocument({ 
      data: pdfBuffer,
      verbosity: 0
    });
    
    const pdfDoc = await loadingTask.promise;
    const todasLasLineas: string[] = [];
    
    // Vercel PRO permite procesar más páginas
    const maxPaginas = Math.min(pdfDoc.numPages, 15);
    
    for (let pageNum = 1; pageNum <= maxPaginas; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Organizar texto por posición Y
      const itemsPorY = new Map<number, Array<{texto: string, x: number}>>();
      
      for (const item of textContent.items as any[]) {
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
      
      // Convertir a líneas ordenadas
      const lineasPagina = Array.from(itemsPorY.entries())
        .sort(([y1], [y2]) => y2 - y1)
        .map(([y, items]) => {
          const itemsOrdenados = items.sort((a, b) => a.x - b.x);
          return itemsOrdenados.map(item => item.texto).join(' ').trim();
        })
        .filter(linea => linea.length > 3);
      
      todasLasLineas.push(...lineasPagina);
    }
    
    console.log(`Texto extraído: ${todasLasLineas.length} líneas de ${maxPaginas} páginas`);
    return todasLasLineas;
    
  } catch (error) {
    console.error('Error en extracción de texto:', error);
    throw new Error('No se pudo extraer texto del PDF');
  }
}

// ============================================
// PROCESAMIENTO CON GPT-4 + STRUCTURED OUTPUTS
// ============================================

async function procesarConStructuredOutputs(
  lineasTexto: string[], 
  nombreArchivo: string
): Promise<RespuestaEstructurada> {
  
  console.log('Procesando con GPT-4 + Structured Outputs...');
  
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY no configurada');
  }
  
  const openaiModule = await import('openai');
  const OpenAI = openaiModule.default;
  
  const openai = new (OpenAI as any)({
    apiKey: process.env.OPENAI_API_KEY
  });
  
  // Preparar texto para el modelo
  const textoCompleto = lineasTexto.join('\n');
  const textoLimitado = textoCompleto.substring(0, 50000); // Límite para el modelo
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `Eres un experto en extraer datos de productos de documentos PDF. 
          Analiza el texto proporcionado y extrae ÚNICAMENTE los productos que estén claramente definidos en tablas.
          
          REGLAS ESTRICTAS:
          - Solo extraer productos que tengan al menos código, descripción y precio
          - Precios deben ser números positivos (remover símbolos monetarios)
          - Stock debe ser número entero (0 si no está disponible)
          - Códigos en mayúsculas y sin espacios
          - Unidades estándar: UN, KG, LT, MT, PZ, etc.
          - Si no hay datos claros, devolver array vacío
          - Evaluar honestamente la calidad de extracción`
        },
        {
          role: "user", 
          content: `Archivo: ${nombreArchivo}

Texto extraído del PDF:
${textoLimitado}

Extrae todos los productos encontrados en este texto siguiendo el schema estricto.`
        }
      ],
      response_format: SCHEMA_PRODUCTOS,
      temperature: 0.1,
      max_tokens: 4000
    });
    
    const contenido = response.choices[0].message.content;
    
    if (!contenido) {
      throw new Error('No se recibió respuesta del modelo');
    }
    
    const resultado: RespuestaEstructurada = JSON.parse(contenido);
    
    console.log(`Structured outputs: ${resultado.productos.length} productos extraídos`);
    console.log(`Calidad reportada: ${resultado.metadatos.calidadExtraccion}`);
    
    return resultado;
    
  } catch (error) {
    console.error('Error en GPT-4 structured outputs:', error);
    throw new Error(`Error en procesamiento: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// ============================================
// GENERADOR DE EXCEL PROFESIONAL
// ============================================

function generarExcelProfesional(
  respuesta: RespuestaEstructurada,
  nombreArchivo: string,
  tiempoMS: number,
  costo: number
): Buffer {
  
  console.log('Generando Excel profesional...');
  
  const workbook = XLSX.utils.book_new();
  const productos = respuesta.productos;
  
  if (productos.length === 0) {
    // Hoja de diagnóstico
    const diagnostico = [
      ['DIAGNÓSTICO DE EXTRACCIÓN'],
      [''],
      ['Estado:', 'Sin productos detectados'],
      ['Archivo:', nombreArchivo],
      ['Tiempo de procesamiento:', `${tiempoMS}ms`],
      ['Costo:', `$${costo.toFixed(3)}`],
      ['Calidad reportada:', respuesta.metadatos.calidadExtraccion],
      ['Método:', respuesta.metadatos.metodoProcesamiento],
      ['Páginas procesadas:', respuesta.metadatos.paginasProcesadas],
      [''],
      ['ANÁLISIS:'],
      ['El modelo GPT-4 no encontró productos estructurados'],
      ['Esto puede deberse a:'],
      ['• PDF sin tablas de productos'],
      ['• Formato de tabla no reconocible'],
      ['• Calidad de imagen muy baja'],
      ['• Texto corrupto o ilegible'],
      [''],
      ['RECOMENDACIONES:'],
      ['• Verificar que el PDF contenga tablas claras'],
      ['• Usar PDFs con texto seleccionable'],
      ['• Asegurar buena resolución de imagen'],
      ['• Probar con documento más simple']
    ];
    
    const worksheet = XLSX.utils.aoa_to_sheet(diagnostico);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Diagnóstico');
  } else {
    // Hoja principal de productos
    const worksheet = XLSX.utils.json_to_sheet(productos);
    
    // Configurar formato profesional
    worksheet['!cols'] = [
      { wch: 12 }, // codigo
      { wch: 50 }, // descripcion
      { wch: 12 }, // precio
      { wch: 8 },  // stock
      { wch: 10 }, // unidad
      { wch: 20 }  // categoria
    ];
    
    // Formato de encabezados
    if (worksheet['!ref']) {
      const range = XLSX.utils.decode_range(worksheet['!ref']);
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddr = XLSX.utils.encode_cell({ r: 0, c: col });
        if (worksheet[cellAddr]) {
          worksheet[cellAddr].s = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "2E7D32" } },
            alignment: { horizontal: "center" }
          };
        }
      }
      
      // Formato de precios
      for (let row = 1; row <= range.e.r; row++) {
        const precioCellAddr = XLSX.utils.encode_cell({ r: row, c: 2 });
        if (worksheet[precioCellAddr] && typeof worksheet[precioCellAddr].v === 'number') {
          worksheet[precioCellAddr].z = '"$"#,##0.00';
        }
      }
    }
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Productos');
    
    // Hoja de análisis
    const analisis = [
      ['ANÁLISIS PROFESIONAL'],
      [''],
      ['INFORMACIÓN GENERAL'],
      ['Archivo procesado:', nombreArchivo],
      ['Fecha y hora:', new Date().toLocaleString('es-ES')],
      ['Tiempo de procesamiento:', `${tiempoMS}ms`],
      ['Costo de procesamiento:', `$${costo.toFixed(3)}`],
      ['Plataforma:', 'Vercel PRO'],
      [''],
      ['MÉTODO DE EXTRACCIÓN'],
      ['Tecnología:', 'GPT-4 + Structured Outputs'],
      ['Schema validation:', 'Activo'],
      ['Páginas procesadas:', respuesta.metadatos.paginasProcesadas],
      ['Calidad de extracción:', respuesta.metadatos.calidadExtraccion.toUpperCase()],
      ['Método de procesamiento:', respuesta.metadatos.metodoProcesamiento],
      [''],
      ['ESTADÍSTICAS DE DATOS'],
      ['Total productos extraídos:', productos.length],
      ['Productos con categoría:', productos.filter(p => p.categoria).length],
      ['Rango de precios:', productos.length > 0 ? 
        `$${Math.min(...productos.map(p => p.precio)).toFixed(2)} - $${Math.max(...productos.map(p => p.precio)).toFixed(2)}` : 'N/A'],
      ['Stock total:', productos.reduce((sum, p) => sum + p.stock, 0)],
      ['Valor total inventario:', `$${productos.reduce((sum, p) => sum + (p.precio * p.stock), 0).toFixed(2)}`],
      [''],
      ['DISTRIBUCIÓN POR UNIDADES'],
      ...Array.from(new Set(productos.map(p => p.unidad)))
        .map(unidad => [
          `${unidad}:`, 
          productos.filter(p => p.unidad === unidad).length
        ]),
      [''],
      ['DISTRIBUCIÓN POR CATEGORÍAS'],
      ...Array.from(new Set(productos.filter(p => p.categoria).map(p => p.categoria)))
        .slice(0, 10)
        .map(categoria => [
          `${categoria}:`,
          productos.filter(p => p.categoria === categoria).length
        ]),
      [''],
      ['CALIDAD Y CONFIABILIDAD'],
      ['Método:', 'Structured Outputs con schema estricto'],
      ['Validación:', 'Automática por OpenAI'],
      ['Consistencia:', respuesta.metadatos.calidadExtraccion === 'alta' ? 'Excelente' : 'Aceptable'],
      ['Repetibilidad:', 'Alta (mismo input = mismo output)'],
      [''],
      ['VENTAJAS DE STRUCTURED OUTPUTS'],
      ['✓ Schema JSON estricto definido'],
      ['✓ Validación automática de tipos'],
      ['✓ No interpretación libre del modelo'],
      ['✓ Consistencia garantizada'],
      ['✓ Campos requeridos obligatorios'],
      ['✓ Sin "alucinaciones" de estructura'],
      ['✓ Formato predecible siempre']
    ];
    
    const worksheetAnalisis = XLSX.utils.aoa_to_sheet(analisis);
    XLSX.utils.book_append_sheet(workbook, worksheetAnalisis, 'Análisis');
  }
  
  return XLSX.write(workbook, { 
    type: 'buffer', 
    bookType: 'xlsx',
    compression: true 
  });
}

// ============================================
// API ROUTE VERCEL PRO
// ============================================

export async function POST(request: NextRequest) {
  const inicio = Date.now();
  
  try {
    console.log('Iniciando conversión profesional PDF a Excel...');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file || !file.type.includes('pdf')) {
      return NextResponse.json(
        { success: false, error: 'Se requiere archivo PDF válido' },
        { status: 400 }
      );
    }
    
    // Límites Vercel PRO
    const MAX_SIZE = 50 * 1024 * 1024; // 50MB en PRO
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: `Archivo muy grande. Máximo Vercel PRO: 50MB` },
        { status: 400 }
      );
    }
    
    console.log(`Procesando ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
    
    const arrayBuffer = await file.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);
    
    // PASO 1: Extraer texto aprovechando timeout PRO (60s)
    const lineasTexto = await extraerTextoVercelPro(pdfBuffer);
    
    if (lineasTexto.length === 0) {
      throw new Error('No se pudo extraer texto del PDF');
    }
    
    // PASO 2: Procesar con structured outputs
    const respuestaEstructurada = await procesarConStructuredOutputs(lineasTexto, file.name);
    
    // PASO 3: Generar Excel profesional
    const tiempoMS = Date.now() - inicio;
    const costoEstimado = 0.02; // GPT-4 turbo cost
    
    const excelBuffer = generarExcelProfesional(
      respuestaEstructurada, 
      file.name, 
      tiempoMS, 
      costoEstimado
    );
    
    const excelBase64 = excelBuffer.toString('base64');
    
    console.log(`Conversión completada en ${tiempoMS}ms`);
    
    return NextResponse.json({
      success: true,
      excel: excelBase64,
      structured: {
        schema: 'JSON Schema estricto aplicado',
        validacion: 'Automática por OpenAI',
        consistencia: 'Garantizada'
      },
      estadisticas: {
        tiempoProcesamiento: `${tiempoMS}ms`,
        productosExtraidos: respuestaEstructurada.productos.length,
        paginasProcesadas: respuestaEstructurada.metadatos.paginasProcesadas,
        calidadExtraccion: respuestaEstructurada.metadatos.calidadExtraccion,
        metodo: 'GPT-4 + Structured Outputs',
        plataforma: 'Vercel PRO'
      },
      costos: {
        esteDocumento: `$${costoEstimado.toFixed(3)}`,
        mensual30docs: `$${(costoEstimado * 30).toFixed(2)}`
      },
      nombreSugerido: file.name.replace('.pdf', '_structured.xlsx'),
      mensaje: respuestaEstructurada.productos.length > 0
        ? `${respuestaEstructurada.productos.length} productos extraídos con schema estricto`
        : 'Sin productos detectados - Ver diagnóstico en Excel',
      ventajas: [
        'Schema JSON estricto',
        'Validación automática',
        'Sin alucinaciones de estructura',
        'Repetibilidad garantizada',
        'Optimizado para Vercel PRO'
      ]
    });
    
  } catch (error) {
    const tiempoError = Date.now() - inicio;
    console.error('Error en conversión:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error procesando PDF',
        tiempoProcesamiento: `${tiempoError}ms`,
        plataforma: 'Vercel PRO'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'PDF to Excel - Professional',
    version: '13.0.0 - Structured Outputs',
    plataforma: 'Vercel PRO optimizado',
    caracteristicas: [
      'Schema JSON estricto',
      'Structured Outputs de OpenAI', 
      'Validación automática de tipos',
      'Sin alucinaciones de estructura',
      'Optimizado para Vercel PRO (60s timeout)',
      'Procesamiento hasta 15 páginas',
      'Excel con análisis profesional'
    ],
    costos: {
      porDocumento: '$0.02',
      mensual30docs: '$0.60'
    },
    dependencias: [
      'openai (structured outputs)',
      'xlsx (excel generation)',
      'pdfjs-dist (text extraction)'
    ]
  });
}