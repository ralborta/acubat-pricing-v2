import { NextRequest, NextResponse } from 'next/server';
import fileStorage from '@/lib/fileStorage';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const usuario = formData.get('usuario') as string || 'acubat';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No se proporcionó archivo' },
        { status: 400 }
      );
    }

    // Leer archivo como base64
    const buffer = await file.arrayBuffer();
    const base64Content = Buffer.from(buffer).toString('base64');

    // Guardar archivo en storage
    const fileData = {
      nombre: file.name,
      contenido: base64Content,
      usuario: usuario,
      tipo: file.name.toLowerCase().endsWith('.csv') ? 'csv' : 'excel',
      tamano: file.size
    };

    const savedFile = await fileStorage.saveFile(fileData);

    return NextResponse.json({
      success: true,
      data: {
        id: savedFile.id,
        nombre: savedFile.nombre,
        fechaSubida: savedFile.fechaSubida,
        mensaje: 'Archivo guardado para procesamiento automático'
      }
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Error subiendo archivo:', error);
    return NextResponse.json(
      { success: false, error: 'Error al subir archivo' },
      { status: 500 }
    );
  }
}

// GET - Obtener archivos pendientes
export async function GET() {
  try {
    const pendingFiles = await fileStorage.getUnprocessedFiles();
    const allFiles = await fileStorage.getPendingFiles();

    return NextResponse.json({
      success: true,
      data: {
        pendientes: pendingFiles,
        totales: allFiles,
        estadisticas: {
          pendientes: pendingFiles.length,
          procesados: allFiles.filter((f: any) => f.procesado).length,
          total: allFiles.length
        }
      }
    });
  } catch (error) {
    console.error('❌ Error obteniendo archivos:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener archivos' },
      { status: 500 }
    );
  }
}
