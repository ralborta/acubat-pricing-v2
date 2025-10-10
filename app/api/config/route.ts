import { NextRequest, NextResponse } from 'next/server';
import { config as unifiedConfig } from '@/lib/config';

// GET - Obtener configuración actual
export async function GET() {
  try {
    const config = await unifiedConfig.load();
    
    return NextResponse.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('❌ Error obteniendo configuración:', error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener configuración' },
      { status: 500 }
    );
  }
}

// POST - Guardar nueva configuración
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar configuración
    // Guardar configuración en origen de servidor (Supabase)
    const savedConfig = await unifiedConfig.save(body, 'supabase');
    
    return NextResponse.json({
      success: true,
      data: savedConfig,
      message: 'Configuración guardada exitosamente'
    }, { status: 201 });
  } catch (error) {
    console.error('❌ Error guardando configuración:', error);
    return NextResponse.json(
      { success: false, error: 'Error al guardar configuración' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar configuración existente
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Obtener configuración actual y actualizarla
    const currentConfig = await unifiedConfig.load();
    const updatedConfig = { ...currentConfig, ...body };
    const savedConfig = await unifiedConfig.save(updatedConfig, 'supabase');
    
    return NextResponse.json({
      success: true,
      data: savedConfig,
      message: 'Configuración actualizada exitosamente'
    });
  } catch (error) {
    console.error('❌ Error actualizando configuración:', error);
    return NextResponse.json(
      { success: false, error: 'Error al actualizar configuración' },
      { status: 500 }
    );
  }
}

// DELETE - Resetear a configuración por defecto
export async function DELETE() {
  try {
    const resetConfig = await unifiedConfig.reset('supabase');
    
    return NextResponse.json({
      success: true,
      data: resetConfig,
      message: 'Configuración reseteada a valores por defecto'
    });
  } catch (error) {
    console.error('❌ Error reseteando configuración:', error);
    return NextResponse.json(
      { success: false, error: 'Error al resetear configuración' },
      { status: 500 }
    );
  }
}
