import { NextResponse } from 'next/server'
import { config as unifiedConfig } from '@/lib/config'

export async function POST() {
  try {
    console.log('🔄 Reseteando configuración a valores por defecto...')
    
    // Resetear en Supabase (si está disponible)
    await unifiedConfig.reset('supabase')
    
    // También limpiar localStorage en el cliente
    return NextResponse.json({ 
      success: true, 
      message: 'Configuración reseteada a valores por defecto',
      data: null,
      clearLocalStorage: true
    })
  } catch (error) {
    console.error('❌ Error reseteando configuración:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
