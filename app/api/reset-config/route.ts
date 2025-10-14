import { NextResponse } from 'next/server'
import { config as unifiedConfig } from '@/lib/config'
import { DEFAULT_CONFIG } from '@/lib/config/defaults'

export async function POST() {
  try {
    console.log('🔄 Reseteando configuración a valores por defecto...')
    
    // Resetear en Supabase (si está disponible)
    try {
      await unifiedConfig.reset('supabase')
      console.log('✅ Configuración reseteada en Supabase')
    } catch (supabaseError) {
      console.warn('⚠️ Error reseteando en Supabase:', supabaseError)
    }
    
    // También resetear en local
    try {
      await unifiedConfig.reset('local')
      console.log('✅ Configuración reseteada en localStorage')
    } catch (localError) {
      console.warn('⚠️ Error reseteando en localStorage:', localError)
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Configuración reseteada a valores por defecto',
      data: DEFAULT_CONFIG,
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
