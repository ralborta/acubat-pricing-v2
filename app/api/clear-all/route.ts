import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { DEFAULT_CONFIG } from '@/lib/config/defaults'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

export async function POST() {
  try {
    console.log('🧹 Limpiando TODA la configuración...')
    
    // Limpiar Supabase completamente
    if (supabase) {
      try {
        const { error } = await supabase
          .from('config')
          .delete()
          .neq('id', 0) // Eliminar todos los registros
        
        if (error) {
          console.warn('⚠️ Error limpiando Supabase:', error)
        } else {
          console.log('✅ Supabase limpiado completamente')
        }
      } catch (supabaseError) {
        console.warn('⚠️ Error limpiando Supabase:', supabaseError)
      }
    }
    
    // Insertar configuración por defecto limpia
    if (supabase) {
      try {
        const { error } = await supabase
          .from('config')
          .insert({ 
            id: 1, 
            config_data: DEFAULT_CONFIG, 
            created_at: new Date().toISOString(), 
            updated_at: new Date().toISOString() 
          })
        
        if (error) {
          console.warn('⚠️ Error insertando configuración por defecto:', error)
        } else {
          console.log('✅ Configuración por defecto insertada en Supabase')
        }
      } catch (insertError) {
        console.warn('⚠️ Error insertando configuración por defecto:', insertError)
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Toda la configuración ha sido limpiada y reseteada',
      data: DEFAULT_CONFIG,
      clearLocalStorage: true
    })
  } catch (error) {
    console.error('❌ Error limpiando configuración:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
