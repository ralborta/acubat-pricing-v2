import { NextRequest, NextResponse } from 'next/server'
import { HistorialPricing } from "@/lib/supabase-historial"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sesionId = parseInt(params.id)
    
    if (isNaN(sesionId)) {
      return NextResponse.json({ 
        error: 'ID de sesión inválido' 
      }, { status: 400 })
    }
    
    console.log(`📊 Obteniendo productos de sesión ${sesionId}...`)
    
    // Obtener productos de la sesión
    const productos = await HistorialPricing.obtenerProductosSesion(sesionId)
    
    // Obtener estadísticas de la sesión
    const estadisticas = await HistorialPricing.obtenerEstadisticasSesion(sesionId)
    
    console.log(`✅ Productos obtenidos: ${productos.length}`)
    
    return NextResponse.json({
      success: true,
      sesion_id: sesionId,
      productos: productos,
      estadisticas: estadisticas,
      total: productos.length
    })
    
  } catch (error) {
    console.error('❌ Error obteniendo productos:', error)
    return NextResponse.json({ 
      error: 'Error obteniendo productos de la sesión',
      detalles: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
