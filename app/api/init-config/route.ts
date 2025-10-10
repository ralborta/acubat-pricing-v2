import { NextRequest, NextResponse } from 'next/server'
import { config as unifiedConfig } from '@/lib/config'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Inicializando configuración en Supabase...')
    
    // Guardar defaults en origen preferido de servidor (Supabase si está disponible)
    const saved = await unifiedConfig.save({}, 'supabase')
    return NextResponse.json({ success: true, message: 'Configuración inicializada correctamente', data: saved })
    
  } catch (error) {
    console.error('❌ Error en init-config:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    const current = await unifiedConfig.load()
    return NextResponse.json({ success: true, data: { config_data: current } })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Error desconocido' }, { status: 500 })
  }
}
