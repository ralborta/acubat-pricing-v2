import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { ConfiguracionSistema } from '@/lib/types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = (typeof window === 'undefined' && supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null

// GET - Obtener historial de configuraciones
export async function GET(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ 
        success: false, 
        error: 'Supabase no configurado' 
      }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    const { data, error } = await supabase
      .from('config_historial')
      .select('id, version, descripcion, created_at, config_data')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('❌ Error obteniendo historial:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data: data || [],
      total: data?.length || 0
    })
  } catch (error) {
    console.error('❌ Error en GET historial:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    }, { status: 500 })
  }
}

// POST - Restaurar una configuración del historial
export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ 
        success: false, 
        error: 'Supabase no configurado' 
      }, { status: 500 })
    }

    const body = await request.json()
    const { historialId, descripcion } = body

    if (!historialId) {
      return NextResponse.json({ 
        success: false, 
        error: 'ID de historial requerido' 
      }, { status: 400 })
    }

    // Obtener la configuración del historial
    const { data: historialItem, error: fetchError } = await supabase
      .from('config_historial')
      .select('config_data')
      .eq('id', historialId)
      .single()

    if (fetchError || !historialItem) {
      return NextResponse.json({ 
        success: false, 
        error: 'Configuración no encontrada en el historial' 
      }, { status: 404 })
    }

    const configToRestore = historialItem.config_data as ConfiguracionSistema

    // Guardar como nueva versión en historial antes de restaurar
    await supabase
      .from('config_historial')
      .insert({
        config_data: configToRestore,
        version: new Date().toISOString(),
        descripcion: descripcion || `Restaurado desde versión ${historialId}`,
        created_at: new Date().toISOString()
      })

    // Actualizar la configuración actual
    const { data: existing } = await supabase
      .from('config')
      .select('id')
      .eq('id', 1)
      .maybeSingle()

    if (existing?.id) {
      await supabase
        .from('config')
        .update({ 
          config_data: configToRestore, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', 1)
    } else {
      await supabase
        .from('config')
        .insert({ 
          id: 1, 
          config_data: configToRestore, 
          created_at: new Date().toISOString(), 
          updated_at: new Date().toISOString() 
        })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Configuración restaurada exitosamente',
      data: configToRestore
    })
  } catch (error) {
    console.error('❌ Error restaurando configuración:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    }, { status: 500 })
  }
}

