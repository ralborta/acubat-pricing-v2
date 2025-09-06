import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Crear cliente Supabase solo si las variables están disponibles
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

export async function GET() {
  try {
    console.log('🔍 Verificando datos en Supabase...')
    
    // Verificar si Supabase está disponible
    if (!supabase) {
      console.warn('⚠️ Supabase no disponible')
      return NextResponse.json({ 
        success: false, 
        error: 'Supabase no configurado',
        data: null
      })
    }
    
    // Verificar tabla config
    console.log('🔍 Verificando tabla config...')
    const { data: configData, error: configError } = await supabase
      .from('config')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)
    
    if (configError) {
      console.error('❌ Error en tabla config:', configError)
    }
    
    // Verificar tabla equivalencias_varta
    console.log('🔍 Verificando tabla equivalencias_varta...')
    const { data: vartaData, error: vartaError } = await supabase
      .from('equivalencias_varta')
      .select('*')
      .limit(5)
    
    if (vartaError) {
      console.error('❌ Error en tabla equivalencias_varta:', vartaError)
    }
    
    // Verificar tabla productos
    console.log('🔍 Verificando tabla productos...')
    const { data: productosData, error: productosError } = await supabase
      .from('productos')
      .select('*')
      .limit(5)
    
    if (productosError) {
      console.error('❌ Error en tabla productos:', productosError)
    }
    
    // Verificar tabla simulaciones
    console.log('🔍 Verificando tabla simulaciones...')
    const { data: simulacionesData, error: simulacionesError } = await supabase
      .from('simulaciones')
      .select('*')
      .limit(5)
    
    if (simulacionesError) {
      console.error('❌ Error en tabla simulaciones:', simulacionesError)
    }
    
    const resultado = {
      config: {
        data: configData,
        error: configError?.message,
        count: configData?.length || 0
      },
      equivalencias_varta: {
        data: vartaData,
        error: vartaError?.message,
        count: vartaData?.length || 0
      },
      productos: {
        data: productosData,
        error: productosError?.message,
        count: productosData?.length || 0
      },
      simulaciones: {
        data: simulacionesData,
        error: simulacionesError?.message,
        count: simulacionesData?.length || 0
      }
    }
    
    console.log('✅ Verificación completada:', resultado)
    
    return NextResponse.json({ 
      success: true, 
      message: 'Verificación de base de datos completada',
      data: resultado
    })
    
  } catch (error) {
    console.error('❌ Error en check-db:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
