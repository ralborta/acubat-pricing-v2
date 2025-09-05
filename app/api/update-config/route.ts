import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Crear cliente Supabase solo si las variables están disponibles
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('💾 Actualizando configuración en Supabase:', body)
    
    // Verificar si Supabase está disponible
    if (!supabase) {
      console.warn('⚠️ Supabase no disponible')
      return NextResponse.json({ 
        success: false, 
        error: 'Supabase no configurado'
      })
    }
    
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
    
    // Insertar nueva configuración
    const { data, error } = await supabase
      .from('config')
      .insert({
        config_data: configToSave,
        created_at: new Date().toISOString()
      })
      .select()
    
    if (error) {
      console.error('❌ Error actualizando configuración:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 })
    }
    
    console.log('✅ Configuración actualizada en Supabase:', data)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Configuración actualizada correctamente',
      data: data[0]
    })
    
  } catch (error) {
    console.error('❌ Error en update-config:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
