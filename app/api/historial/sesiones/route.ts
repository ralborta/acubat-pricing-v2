import { NextRequest, NextResponse } from 'next/server'
import { HistorialPricing } from "@/lib/supabase-historial"

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Obteniendo sesiones de historial...')
    
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 50) // Forzar máximo 50
    
    // Obtener sesiones
    const sesiones = await HistorialPricing.obtenerSesiones(limit)
    
    console.log(`✅ Sesiones obtenidas: ${sesiones.length}`)
    
    return NextResponse.json({
      success: true,
      sesiones: sesiones,
      total: sesiones.length
    })
    
  } catch (error) {
    console.error('❌ Error obteniendo sesiones:', error)
    return NextResponse.json({ 
      error: 'Error obteniendo sesiones del historial',
      detalles: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
