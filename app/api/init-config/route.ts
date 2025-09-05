import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Crear cliente Supabase solo si las variables están disponibles
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Inicializando configuración en Supabase...')
    
    // Verificar si Supabase está disponible
    if (!supabase) {
      console.warn('⚠️ Supabase no disponible, usando configuración por defecto')
      return NextResponse.json({ 
        success: false, 
        error: 'Supabase no configurado',
        data: null
      })
    }
    
    // Configuración inicial
    const configInicial = {
      modo: 'produccion',
      iva: 21,
      markups: {
        mayorista: 22,
        directa: 60,
        distribucion: 20
      },
      factoresVarta: {
        factorBase: 40,
        capacidad80Ah: 35
      },
      promociones: false,
      promocionesHabilitado: false,
      comisiones: {
        mayorista: 5,
        directa: 8,
        distribucion: 6
      },
      ultimaActualizacion: new Date().toISOString()
    }
    
    // Insertar configuración inicial
    const { data, error } = await supabase
      .from('config')
      .insert({
        config_data: configInicial,
        created_at: new Date().toISOString()
      })
      .select()
    
    if (error) {
      console.error('❌ Error insertando configuración:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 })
    }
    
    console.log('✅ Configuración inicializada en Supabase:', data)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Configuración inicializada correctamente',
      data: data[0]
    })
    
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
    console.log('🔍 Verificando configuración en Supabase...')
    
    // Verificar si Supabase está disponible
    if (!supabase) {
      console.warn('⚠️ Supabase no disponible')
      return NextResponse.json({ 
        success: false, 
        error: 'Supabase no configurado',
        data: null
      })
    }
    
    const { data, error } = await supabase
      .from('config')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    if (error) {
      console.error('❌ Error obteniendo configuración:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 })
    }
    
    console.log('✅ Configuración encontrada:', data)
    
    return NextResponse.json({ 
      success: true, 
      data: data 
    })
    
  } catch (error) {
    console.error('❌ Error en GET init-config:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
