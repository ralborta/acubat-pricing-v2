import { NextRequest, NextResponse } from 'next/server';
import configManager from '@/lib/configManagerLocal';

// GET - Obtener configuración actual
export async function GET() {
  try {
    const config = await configManager.getCurrentConfig();
    
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
    const validation = configManager.validateConfig(body);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Configuración inválida',
          details: validation.errors
        },
        { status: 400 }
      );
    }

    // Guardar configuración
    const savedConfig = await configManager.saveConfig(body);
    
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
    const currentConfig = await configManager.getCurrentConfig();
    const updatedConfig = { ...currentConfig, ...body };
    
    // Validar configuración actualizada
    const validation = configManager.validateConfig(updatedConfig);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Configuración inválida',
          details: validation.errors
        },
        { status: 400 }
      );
    }

    // Guardar configuración actualizada
    const savedConfig = await configManager.saveConfig(updatedConfig);
    
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
    const resetConfig = await configManager.resetConfig();
    
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
