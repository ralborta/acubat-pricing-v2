// ============================================
// VERCEL - PROXY CON MANEJO DE ERRORES ROBUSTO
// ============================================

import { NextRequest, NextResponse } from 'next/server';

const MICROSERVICE_URL = process.env.PDF_MICROSERVICE_URL || 
  'https://pdf-microservice-production.up.railway.app';

export async function POST(request: NextRequest) {
  const inicio = Date.now();
  
  try {
    console.log('[VERCEL] Iniciando procesamiento...');
    
    // 1. Recibir archivo PDF
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      console.error('[VERCEL] No se recibió archivo');
      return NextResponse.json(
        { success: false, error: 'No se recibió archivo' },
        { status: 400 }
      );
    }
    
    if (!file.type.includes('pdf')) {
      console.error('[VERCEL] Archivo no es PDF:', file.type);
      return NextResponse.json(
        { success: false, error: 'El archivo debe ser PDF' },
        { status: 400 }
      );
    }
    
    console.log(`[VERCEL] Archivo recibido: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    
    // 2. Convertir a base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = `data:application/pdf;base64,${buffer.toString('base64')}`;
    
    console.log('[VERCEL] PDF convertido a base64');
    console.log(`[VERCEL] Llamando microservicio: ${MICROSERVICE_URL}/extract-pdf`);
    
    // 3. Llamar al microservicio con timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 segundos timeout
    
    let microserviceResponse;
    try {
      microserviceResponse = await fetch(`${MICROSERVICE_URL}/extract-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfBase64: base64,
          filename: file.name
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
    } catch (fetchError: any) {
      console.error('[VERCEL] Error llamando microservicio:', fetchError);
      
      if (fetchError.name === 'AbortError') {
        return NextResponse.json({
          success: false,
          error: 'Timeout: El microservicio tardó demasiado en responder',
          detalles: 'El procesamiento excedió 30 segundos'
        }, { status: 504 });
      }
      
      return NextResponse.json({
        success: false,
        error: 'No se pudo conectar con el microservicio',
        detalles: fetchError.message,
        microservicio: MICROSERVICE_URL
      }, { status: 503 });
    }
    
    console.log(`[VERCEL] Respuesta del microservicio: ${microserviceResponse.status}`);
    
    // 4. Verificar respuesta del microservicio
    if (!microserviceResponse.ok) {
      console.error(`[VERCEL] Microservicio respondió con error: ${microserviceResponse.status}`);
      
      let errorDetail = '';
      try {
        const errorData = await microserviceResponse.json();
        errorDetail = errorData.error || errorData.message || 'Error desconocido';
      } catch {
        errorDetail = `HTTP ${microserviceResponse.status}`;
      }
      
      // Generar Excel de diagnóstico cuando falla
      const XLSX = await import('xlsx');
      const workbook = XLSX.utils.book_new();
      
      const diagnostico = [
        ['ERROR DE PROCESAMIENTO'],
        [''],
        ['Estado:', `Error ${microserviceResponse.status}`],
        ['Detalles:', errorDetail],
        ['Archivo:', file.name],
        ['Tamaño:', `${(file.size / 1024 / 1024).toFixed(2)} MB`],
        ['Microservicio:', MICROSERVICE_URL],
        ['Tiempo:', `${Date.now() - inicio}ms`],
        [''],
        ['POSIBLES CAUSAS:'],
        ['• El microservicio no está configurado correctamente'],
        ['• CloudConvert API key no está configurada'],
        ['• El PDF no contiene tablas válidas'],
        ['• Error de conexión o timeout'],
        [''],
        ['SOLUCIONES:'],
        ['• Verificar que el microservicio esté activo en Railway'],
        ['• Verificar CLOUDCONVERT_API_KEY en Railway'],
        ['• Probar con un PDF diferente'],
        ['• Revisar los logs en Railway']
      ];
      
      const worksheet = XLSX.utils.aoa_to_sheet(diagnostico);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Error');
      
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      const excelBase64 = Buffer.from(excelBuffer).toString('base64');
      
      return NextResponse.json({
        success: false,
        excel: excelBase64,
        error: `Error del microservicio: ${errorDetail}`,
        nombreSugerido: 'error_diagnostico.xlsx',
        mensaje: 'Se generó un Excel con información del error'
      });
    }
    
    // 5. Procesar respuesta exitosa
    let resultado;
    try {
      resultado = await microserviceResponse.json();
      console.log('[VERCEL] Respuesta parseada:', {
        success: resultado.success,
        hasExcel: !!resultado.excel,
        hasProductos: !!resultado.productos
      });
    } catch (parseError) {
      console.error('[VERCEL] Error parseando respuesta:', parseError);
      return NextResponse.json({
        success: false,
        error: 'Respuesta inválida del microservicio'
      }, { status: 502 });
    }
    
    // 6. Si el microservicio devuelve Excel directamente
    if (resultado.success && resultado.excel) {
      console.log('[VERCEL] Excel recibido del microservicio');
      
      const tiempoTotal = Date.now() - inicio;
      
      return NextResponse.json({
        success: true,
        excel: resultado.excel,
        nombreSugerido: resultado.filename || file.name.replace('.pdf', '.xlsx'),
        mensaje: resultado.mensaje || 'Conversión exitosa',
        estadisticas: {
          tiempoProcesamiento: `${tiempoTotal}ms`,
          metodo: 'CloudConvert',
          microservicio: MICROSERVICE_URL,
          ...resultado.estadisticas
        },
        costos: resultado.costo || { estimado: '$0.00' }
      });
    }
    
    // 7. Si el microservicio devuelve productos JSON (fallback)
    if (resultado.success && resultado.data?.productos) {
      console.log('[VERCEL] Productos JSON recibidos, generando Excel...');
      
      const XLSX = await import('xlsx');
      const workbook = XLSX.utils.book_new();
      
      const worksheet = XLSX.utils.json_to_sheet(resultado.data.productos);
      worksheet['!cols'] = [
        { wch: 12 }, { wch: 45 }, { wch: 12 }, { wch: 8 }, { wch: 10 }
      ];
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Productos');
      
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      const excelBase64 = Buffer.from(excelBuffer).toString('base64');
      
      return NextResponse.json({
        success: true,
        excel: excelBase64,
        nombreSugerido: file.name.replace('.pdf', '.xlsx'),
        mensaje: `${resultado.data.productos.length} productos extraídos`,
        estadisticas: {
          tiempoProcesamiento: `${Date.now() - inicio}ms`,
          productosExtraidos: resultado.data.productos.length,
          metodo: resultado.processing?.metodo || 'Desconocido'
        }
      });
    }
    
    // 8. Si no hay éxito o no hay datos
    console.error('[VERCEL] Respuesta sin éxito o sin datos:', resultado);
    
    return NextResponse.json({
      success: false,
      error: resultado.error || 'No se pudieron extraer datos del PDF',
      detalles: resultado.detalles || 'El microservicio no devolvió datos válidos'
    });
    
  } catch (error) {
    console.error('[VERCEL] Error general:', error);
    
    // Generar Excel de error como último recurso
    try {
      const XLSX = await import('xlsx');
      const workbook = XLSX.utils.book_new();
      
      const diagnostico = [
        ['ERROR INESPERADO'],
        [''],
        ['Error:', error instanceof Error ? error.message : 'Error desconocido'],
        ['Tipo:', error instanceof Error ? error.name : 'N/A'],
        ['Tiempo:', `${Date.now() - inicio}ms`],
        [''],
        ['Por favor, contacta soporte con esta información']
      ];
      
      const worksheet = XLSX.utils.aoa_to_sheet(diagnostico);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Error');
      
      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      const excelBase64 = Buffer.from(excelBuffer).toString('base64');
      
      return NextResponse.json({
        success: false,
        excel: excelBase64,
        error: error instanceof Error ? error.message : 'Error inesperado',
        nombreSugerido: 'error_inesperado.xlsx'
      });
      
    } catch {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Error crítico procesando la solicitud'
        },
        { status: 500 }
      );
    }
  }
}

// ============================================
// ENDPOINT GET - VERIFICACIÓN DE ESTADO
// ============================================

export async function GET() {
  console.log('[VERCEL] Verificando estado del sistema...');
  
  let microserviceStatus = 'desconocido';
  let microserviceDetails = {};
  
  try {
    const healthResponse = await fetch(`${MICROSERVICE_URL}/health`, {
      signal: AbortSignal.timeout(5000) // 5 segundos timeout
    });
    
    if (healthResponse.ok) {
      const health = await healthResponse.json();
      microserviceStatus = health.status || 'OK';
      microserviceDetails = health;
    } else {
      microserviceStatus = `Error ${healthResponse.status}`;
    }
  } catch (error) {
    microserviceStatus = 'no disponible';
    console.error('[VERCEL] Microservicio no responde:', error);
  }
  
  return NextResponse.json({
    service: 'PDF to Excel - Proxy Vercel',
    version: '2.0.1',
    timestamp: new Date().toISOString(),
    arquitectura: {
      frontend: 'Vercel',
      microservicio: MICROSERVICE_URL,
      procesamiento: 'CloudConvert'
    },
    estado: {
      vercel: 'OK',
      microservicio: microserviceStatus,
      detalles: microserviceDetails
    },
    configuracion: {
      microserviceUrl: MICROSERVICE_URL,
      timeout: '30 segundos',
      maxSize: '50 MB'
    }
  });
}