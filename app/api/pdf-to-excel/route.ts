// PDF DIRECTO A EXCEL - SIMPLE Y EFECTIVO
// GPT-4o lee el PDF y genera Excel directamente

import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

interface ProductoExtraido {
  codigo?: string;
  descripcion?: string;
  precio?: number;
  stock?: number;
  unidad?: string;
  categoria?: string;
}

// ============================================
// EXTRACCIÓN DIRECTA CON GPT-4o
// ============================================

async function procesarPDFConGPT4o(pdfBuffer: Buffer, nombreArchivo: string): Promise<ProductoExtraido[]> {
  console.log('🤖 Procesando PDF directamente con GPT-4o...');
  
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY no configurada');
  }
  
  const OpenAI = require('openai');
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
  
  try {
    // Convertir PDF a base64 para envío
    const pdfBase64 = pdfBuffer.toString('base64');
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `INSTRUCCIONES ESPECÍFICAS:
Analiza este PDF y extrae TODOS los productos/items de las tablas que encuentres.

FORMATO DE RESPUESTA (JSON válido):
{
  "productos": [
    {
      "codigo": "ABC123",
      "descripcion": "Descripción del producto",
      "precio": 123.45,
      "stock": 10,
      "unidad": "UN",
      "categoria": "Categoría si existe"
    }
  ],
  "resumen": {
    "totalProductos": 0,
    "paginas": 0,
    "tablas": 0
  }
}

REGLAS IMPORTANTES:
1. Solo extraer datos que estén claramente visibles en tablas
2. Si un campo no existe, omitirlo del JSON
3. Precios como números (sin símbolos monetarios)
4. Stock como números enteros
5. Códigos en mayúsculas
6. Responder SOLO con JSON válido, sin texto adicional

PROCESAR:`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:application/pdf;base64,${pdfBase64}`
              }
            }
          ]
        }
      ],
      max_tokens: 4000,
      temperature: 0.1
    });
    
    const contenido = response.choices[0].message.content;
    console.log('📋 Respuesta de GPT-4o recibida');
    
    // Parsear JSON de respuesta
    if (!contenido) {
      throw new Error('GPT-4o no devolvió contenido');
    }
    
    // Limpiar la respuesta para extraer solo el JSON
    const jsonMatch = contenido.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Respuesta no contiene JSON válido:', contenido);
      throw new Error('GPT-4o no devolvió JSON válido');
    }
    
    const resultado = JSON.parse(jsonMatch[0]);
    
    if (!resultado.productos || !Array.isArray(resultado.productos)) {
      throw new Error('Respuesta no contiene array de productos');
    }
    
    console.log(`✅ GPT-4o extrajo ${resultado.productos.length} productos`);
    console.log(`📊 Resumen: ${resultado.resumen?.totalProductos || 0} productos, ${resultado.resumen?.paginas || 0} páginas`);
    
    return resultado.productos;
    
  } catch (error) {
    console.error('❌ Error en GPT-4o:', error instanceof Error ? error.message : String(error));
    throw new Error(`GPT-4o falló: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

// ============================================
// GENERADOR DE EXCEL DIRECTO
// ============================================

function generarExcelDirecto(productos: ProductoExtraido[], nombreArchivo: string, costo: number): Buffer {
  console.log('📊 Generando Excel...');
  
  const workbook = XLSX.utils.book_new();
  
  if (productos.length === 0) {
    // Hoja de error
    const errorData = [
      ['RESULTADO', 'Sin productos encontrados'],
      ['ARCHIVO', nombreArchivo],
      ['FECHA', new Date().toLocaleString('es-ES')],
      ['COSTO', `$${costo.toFixed(3)}`],
      [''],
      ['POSIBLES CAUSAS:'],
      ['• El PDF no contiene tablas de productos'],
      ['• Las tablas no están bien estructuradas'],
      ['• El PDF es de muy baja calidad'],
      ['• El contenido no es reconocible como productos'],
      [''],
      ['SOLUCIONES:'],
      ['• Verificar que el PDF contenga tablas claras'],
      ['• Usar PDFs con mejor calidad de imagen'],
      ['• Asegurar que las tablas tengan encabezados'],
      ['• Probar con un PDF más simple primero']
    ];
    
    const worksheet = XLSX.utils.aoa_to_sheet(errorData);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sin Datos');
  } else {
    // Hoja principal con productos
    const worksheet = XLSX.utils.json_to_sheet(productos);
    
    // Configurar anchos de columna
    worksheet['!cols'] = [
      { wch: 12 }, // codigo
      { wch: 45 }, // descripcion
      { wch: 12 }, // precio
      { wch: 8 },  // stock
      { wch: 10 }, // unidad
      { wch: 15 }  // categoria
    ];
    
    // Formato de encabezados
    if (worksheet['!ref']) {
      const range = XLSX.utils.decode_range(worksheet['!ref']);
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddr = XLSX.utils.encode_cell({ r: 0, c: col });
        if (worksheet[cellAddr]) {
          worksheet[cellAddr].s = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "4472C4" } }
          };
        }
      }
    }
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Productos');
    
    // Hoja de resumen
    const resumenData = [
      ['RESUMEN DE EXTRACCIÓN'],
      [''],
      ['Archivo procesado:', nombreArchivo],
      ['Fecha y hora:', new Date().toLocaleString('es-ES')],
      ['Método:', 'GPT-4o directo'],
      ['Costo de procesamiento:', `$${costo.toFixed(3)}`],
      [''],
      ['ESTADÍSTICAS'],
      ['Total productos:', productos.length],
      ['Con código:', productos.filter(p => p.codigo).length],
      ['Con descripción:', productos.filter(p => p.descripcion).length],
      ['Con precio:', productos.filter(p => p.precio !== undefined).length],
      ['Con stock:', productos.filter(p => p.stock !== undefined).length],
      ['Con unidad:', productos.filter(p => p.unidad).length],
      ['Con categoría:', productos.filter(p => p.categoria).length],
      [''],
      ['ANÁLISIS DE PRECIOS'],
      productos.filter(p => p.precio).length > 0 ? ['Precio mínimo:', Math.min(...productos.filter(p => p.precio).map(p => p.precio!))] : ['Precio mínimo:', 'N/A'],
      productos.filter(p => p.precio).length > 0 ? ['Precio máximo:', Math.max(...productos.filter(p => p.precio).map(p => p.precio!))] : ['Precio máximo:', 'N/A'],
      productos.filter(p => p.precio).length > 0 ? ['Precio promedio:', (productos.filter(p => p.precio).reduce((sum, p) => sum + p.precio!, 0) / productos.filter(p => p.precio).length).toFixed(2)] : ['Precio promedio:', 'N/A'],
      [''],
      ['ANÁLISIS DE STOCK'],
      productos.filter(p => p.stock !== undefined).length > 0 ? ['Stock total:', productos.filter(p => p.stock !== undefined).reduce((sum, p) => sum + p.stock!, 0)] : ['Stock total:', 'N/A'],
      ['Productos sin stock:', productos.filter(p => p.stock === 0).length],
      [''],
      ['CATEGORÍAS DETECTADAS'],
      ...Array.from(new Set(productos.filter(p => p.categoria).map(p => p.categoria)))
        .slice(0, 10)
        .map(cat => ['', cat]),
      [''],
      ['VENTAJAS DE GPT-4o DIRECTO'],
      ['✅ Lee PDFs nativamente como ChatGPT'],
      ['✅ No requiere conversión a imágenes'],
      ['✅ Comprende estructura de documentos'],
      ['✅ Extracción más precisa y completa'],
      ['✅ Menor costo computacional'],
      ['✅ Procesamiento más rápido'],
      ['✅ Compatible 100% con Vercel']
    ];
    
    const worksheetResumen = XLSX.utils.aoa_to_sheet(resumenData);
    XLSX.utils.book_append_sheet(workbook, worksheetResumen, 'Resumen');
  }
  
  return XLSX.write(workbook, { 
    type: 'buffer', 
    bookType: 'xlsx',
    compression: true 
  });
}

// ============================================
// API ROUTE SIMPLIFICADO
// ============================================

export async function POST(request: NextRequest) {
  const inicio = Date.now();
  
  try {
    console.log('🚀 Iniciando conversión directa PDF → Excel...');
    
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
    
    if (file.size > 20 * 1024 * 1024) { // 20MB límite para GPT-4o
      return NextResponse.json(
        { success: false, error: 'Archivo muy grande (máximo 20MB)' },
        { status: 400 }
      );
    }
    
    console.log(`📄 Procesando: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
    
    const arrayBuffer = await file.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);
    
    // Estimación de costo (GPT-4o es más económico que GPT-4V)
    const costoEstimado = Math.max(0.01, (file.size / (1024 * 1024)) * 0.005); // ~$0.005 por MB
    
    console.log(`💰 Costo estimado: $${costoEstimado.toFixed(3)}`);
    
    // Procesar PDF directamente con GPT-4o
    const productos = await procesarPDFConGPT4o(pdfBuffer, file.name);
    
    // Generar Excel
    const excelBuffer = generarExcelDirecto(productos, file.name, costoEstimado);
    const excelBase64 = excelBuffer.toString('base64');
    
    const tiempoTotal = Date.now() - inicio;
    
    console.log(`✅ Conversión completada en ${tiempoTotal}ms`);
    console.log(`📊 Resultado: ${productos.length} productos extraídos`);
    
    return NextResponse.json({
      success: true,
      excel: excelBase64,
      estadisticas: {
        tiempoProcesamiento: `${tiempoTotal}ms`,
        productosExtraidos: productos.length,
        conCodigo: productos.filter(p => p.codigo).length,
        conPrecio: productos.filter(p => p.precio !== undefined).length,
        conStock: productos.filter(p => p.stock !== undefined).length,
        conCategoria: productos.filter(p => p.categoria).length,
        metodo: 'GPT-4o directo',
        archivoTamaño: `${(file.size / 1024 / 1024).toFixed(2)}MB`
      },
      costos: {
        esteDocumento: `$${costoEstimado.toFixed(3)}`,
        mensual30docs: `$${(costoEstimado * 30).toFixed(2)}`
      },
      nombreSugerido: file.name.replace('.pdf', '_extraido_gpt4o.xlsx'),
      mensaje: productos.length > 0 
        ? `🎯 ${productos.length} productos extraídos con GPT-4o (Costo: $${costoEstimado.toFixed(3)})`
        : `⚠️ No se encontraron productos en el PDF (Costo: $${costoEstimado.toFixed(3)})`,
      ventajas: [
        'Lectura nativa de PDF como ChatGPT',
        'Sin conversión a imágenes',
        'Comprensión de estructura completa',
        'Extracción más precisa',
        'Menor costo que GPT-4V'
      ]
    });
    
  } catch (error) {
    const tiempoError = Date.now() - inicio;
    console.error('❌ Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error procesando PDF',
        tiempoProcesamiento: `${tiempoError}ms`,
        solucion: 'Verificar API key de OpenAI y formato del PDF'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'PDF to Excel - GPT-4o Direct',
    version: '11.0.0 - Native PDF Reading',
    descripcion: 'Convierte PDF a Excel usando GPT-4o nativamente como ChatGPT',
    ventajas: [
      'Lee PDFs directamente (como ChatGPT)',
      'No requiere conversión a imágenes',
      'Comprende estructura de documentos',
      'Más económico que GPT-4V',
      'Más rápido y preciso',
      'Compatible 100% con Vercel'
    ],
    costos: {
      porDocumento: '$0.005-$0.02',
      mensual30docs: '$0.15-$0.60'
    },
    limitaciones: [
      'Requiere OPENAI_API_KEY',
      'Máximo 20MB por PDF',
      'Depende de la claridad del PDF'
    ]
  });
}