// app/api/pdf-to-excel/route.ts
// Proxy Vercel → Microservicio CloudConvert (PDF→XLSX)

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';         // ← usamos Buffer
export const dynamic = 'force-dynamic';  // ← evita caché

const MICROSERVICE_URL =
  process.env.PDF_MICROSERVICE_URL || 'https://pdf-microservice-production.up.railway.app';

const MAX_BYTES = 50 * 1024 * 1024;     // 50 MB (binario)
const TIMEOUT_MS = 30_000;

function hasPdfMime(file: File) {
  return (file.type || '').toLowerCase().includes('pdf');
}
function hasPdfExt(name: string) {
  return /\.pdf$/i.test(name || '');
}
function safeOutName(name: string) {
  return (name || 'documento.pdf').replace(/\.pdf$/i, '.xlsx');
}

export async function POST(request: NextRequest) {
  const inicio = Date.now();

  try {
    // 1) Recibir archivo del form-data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No se recibió archivo' },
        { status: 400 }
      );
    }

    // Validaciones básicas
    const name = file.name || 'documento.pdf';
    const size = file.size ?? 0;

    if (!(hasPdfMime(file) || hasPdfExt(name))) {
      return NextResponse.json(
        { success: false, error: 'El archivo debe ser un PDF' },
        { status: 400 }
      );
    }

    if (size > MAX_BYTES) {
      // Nota: base64 agrega ~33% de overhead; mejor usar import/upload en el micro para >10–15 MB
      return NextResponse.json(
        {
          success: false,
          error: 'Archivo demasiado grande',
          detalles: `Máximo ${Math.floor(MAX_BYTES / (1024 * 1024))} MB (${(size / 1024 / 1024).toFixed(2)} MB enviado)`,
          sugerencia: 'Usar endpoint con import/upload en el microservicio para archivos grandes'
        },
        { status: 413 }
      );
    }

    // 2) Convertir a base64 (data URL segura)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64DataUrl = `data:application/pdf;base64,${buffer.toString('base64')}`;

    // 3) Llamar al microservicio con timeout
    const controller = AbortSignal.timeout(TIMEOUT_MS);

    const microRes = await fetch(`${MICROSERVICE_URL}/extract-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ pdfBase64: base64DataUrl, filename: name }),
      signal: controller
    });

    // 4) Si el micro responde con error: intentar extraer detalle y armar Excel de diagnóstico
    if (!microRes.ok) {
      let errObj: any = null;
      try { errObj = await microRes.json(); } catch {}
      const errorDetail =
        errObj?.error || errObj?.details || `HTTP ${microRes.status}`;

      // Excel de diagnóstico
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();
      const rows = [
        ['ERROR DE PROCESAMIENTO'],
        [''],
        ['HTTP Status', microRes.status],
        ['Detalle', errorDetail],
        ['Archivo', name],
        ['Tamaño (MB)', (size / 1024 / 1024).toFixed(2)],
        ['Microservicio', MICROSERVICE_URL],
        ['Tiempo total', `${Date.now() - inicio} ms`],
        [''],
        ['Sugerencias'],
        ['• Verificar que el microservicio esté activo'],
        ['• Revisar CLOUDCONVERT_API_KEY en el micro'],
        ['• Probar con un PDF diferente'],
        ['• Para PDFs grandes, usar import/upload (sin base64)'],
        ...(errObj?.jobId ? [['Job ID', errObj.jobId]] : [])
      ];
      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'Diagnóstico');
      const diagBuf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      const diagB64 = Buffer.from(diagBuf).toString('base64');

      return NextResponse.json({
        success: false,
        excel: diagB64,
        error: `Error del microservicio: ${errorDetail}`,
        nombreSugerido: 'error_diagnostico.xlsx'
      });
    }

    // 5) Parsear respuesta OK del micro
    let result: any;
    try {
      result = await microRes.json();
    } catch (e) {
      return NextResponse.json(
        { success: false, error: 'Respuesta inválida del microservicio' },
        { status: 502 }
      );
    }

    // 6) Caso A: el micro ya devuelve el Excel
    if (result?.success && result?.excel) {
      return NextResponse.json({
        success: true,
        excel: result.excel,
        nombreSugerido: result.filename || safeOutName(name),
        downloadUrl: result.downloadUrl, // si el micro la pasa
        mensaje: result.mensaje || 'Conversión exitosa',
        estadisticas: {
          lineasTexto: result.stats?.lineasTexto || 0,
          filasTablas: result.stats?.filasTablas || 0,
          campos: result.stats?.campos || [],
          tienePrecios: result.stats?.tienePrecios || 0,
          tieneStock: result.stats?.tieneStock || 0
        },
        jobId: result.jobId || undefined
      });
    }

    // 7) Caso B: el micro devuelve productos JSON y generamos Excel acá (fallback)
    if (result?.success && result?.data?.productos) {
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(result.data.productos);
      ws['!cols'] = [{ wch: 12 }, { wch: 45 }, { wch: 12 }, { wch: 8 }, { wch: 10 }];
      XLSX.utils.book_append_sheet(wb, ws, 'Productos');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      const b64 = Buffer.from(buf).toString('base64');

      // Calcular estadísticas para la UI
      const productos = result.data.productos;
      const campos = productos.length > 0 ? Object.keys(productos[0]) : [];
      const tienePrecios = productos.filter(p => p.precio && p.precio > 0).length;
      const tieneStock = productos.filter(p => p.stock && p.stock > 0).length;

      return NextResponse.json({
        success: true,
        excel: b64,
        nombreSugerido: safeOutName(name),
        mensaje: `${productos.length} productos extraídos`,
        estadisticas: {
          lineasTexto: productos.length,
          filasTablas: productos.length,
          campos: campos,
          tienePrecios: tienePrecios,
          tieneStock: tieneStock
        }
      });
    }

    // 8) Sin éxito ni datos
    return NextResponse.json(
      {
        success: false,
        error: result?.error || 'No se pudieron extraer datos del PDF',
        detalles: result?.detalles || 'El microservicio no devolvió datos válidos'
      },
      { status: 502 }
    );
  } catch (error: any) {
    // Timeout o error general
    const isAbort = error?.name === 'TimeoutError' || error?.name === 'AbortError';
    const msg = isAbort
      ? `Timeout: el microservicio excedió ${TIMEOUT_MS}ms`
      : (error?.message || 'Error inesperado');

    try {
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([
        ['ERROR'],
        [''],
        ['Mensaje', msg],
        ['Tipo', error?.name || 'N/A'],
        ['Tiempo total', `${Date.now() - inicio} ms`]
      ]);
      XLSX.utils.book_append_sheet(wb, ws, 'Error');
      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      const b64 = Buffer.from(buf).toString('base64');

      return NextResponse.json({
        success: false,
        excel: b64,
        error: msg,
        nombreSugerido: 'error_inesperado.xlsx'
      }, { status: isAbort ? 504 : 500 });
    } catch {
      return NextResponse.json(
        { success: false, error: msg },
        { status: isAbort ? 504 : 500 }
      );
    }
  }
}

export async function GET() {
  try {
    const r = await fetch(`${MICROSERVICE_URL}/health`, {
      signal: AbortSignal.timeout(5000)
    });
    const body = r.ok ? await r.json() : null;
    return NextResponse.json({
      service: 'PDF to Excel - Proxy Vercel',
      version: '2.1.0',
      timestamp: new Date().toISOString(),
      arquitectura: {
        frontend: 'Vercel',
        microservicio: MICROSERVICE_URL,
        procesamiento: 'CloudConvert'
      },
      estado: {
        vercel: 'OK',
        microservicio: r.ok ? 'OK' : `HTTP ${r.status}`,
        detalles: body || {}
      },
      configuracion: { timeout: `${TIMEOUT_MS}ms`, maxSize: `${MAX_BYTES} bytes` }
    });
  } catch (e: any) {
    return NextResponse.json({
      service: 'PDF to Excel - Proxy Vercel',
      version: '2.1.0',
      timestamp: new Date().toISOString(),
      arquitectura: {
        frontend: 'Vercel',
        microservicio: MICROSERVICE_URL,
        procesamiento: 'CloudConvert'
      },
      estado: { vercel: 'OK', microservicio: 'no disponible' },
      error: e?.message || 'Microservicio no responde'
    }, { status: 503 });
  }
}