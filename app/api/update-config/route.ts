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
    
    // 🔄 UPSERT: Actualizar si existe, insertar si no existe
    let data, error;
    
    // Primero intentar actualizar
    const updateResult = await supabase
      .from('config')
      .update({
        config_data: configToSave,
        updated_at: new Date().toISOString()
      })
      .eq('id', 1)
      .select()
    
    if (updateResult.error) {
      console.error('❌ Error actualizando configuración:', updateResult.error)
      return NextResponse.json({ 
        success: false, 
        error: updateResult.error.message 
      }, { status: 500 })
    }
    
    // Si no hay datos (no existe el registro), insertar uno nuevo
    if (!updateResult.data || updateResult.data.length === 0) {
      console.log('📝 Registro no existe, creando nuevo...')
      const insertResult = await supabase
        .from('config')
        .insert({
          id: 1,
          config_data: configToSave,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
      
      if (insertResult.error) {
        console.error('❌ Error insertando configuración:', insertResult.error)
        return NextResponse.json({ 
          success: false, 
          error: insertResult.error.message 
        }, { status: 500 })
      }
      
      data = insertResult.data;
    } else {
      data = updateResult.data;
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
