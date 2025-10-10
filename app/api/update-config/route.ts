import { NextRequest, NextResponse } from 'next/server'
import { config as unifiedConfig } from '@/lib/config'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('💾 Actualizando configuración unificada')
    
    // Validar que tenga la estructura correcta
    if (!body.iva || !body.markups) {
      return NextResponse.json({ 
        success: false, 
        error: 'Configuración inválida: faltan campos requeridos' 
      }, { status: 400 })
    }
    
    // Agregar timestamp
    const configToSave = {
      ...body,
      ultimaActualizacion: new Date().toISOString()
    }
    
    const saved = await unifiedConfig.save(configToSave, 'supabase')
    return NextResponse.json({ success: true, message: 'Configuración actualizada correctamente', data: saved })
    
  } catch (error) {
    console.error('❌ Error en update-config:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
