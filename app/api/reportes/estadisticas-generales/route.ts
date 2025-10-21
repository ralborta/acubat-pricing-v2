import { NextRequest, NextResponse } from 'next/server'
import { HistorialPricing } from "@/lib/supabase-historial"

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Obteniendo estadísticas generales...')
    
    // Obtener todas las sesiones
    const sesiones = await HistorialPricing.obtenerSesiones(50) // Obtener más sesiones para estadísticas
    
    if (sesiones.length === 0) {
      return NextResponse.json({
        success: true,
        estadisticas: {
          total_sesiones: 0,
          total_productos: 0,
          rentabilidad_promedio: 0,
          proveedores_unicos: 0,
          sesiones_mes: 0,
          productos_rentables: 0
        }
      })
    }

    // Calcular estadísticas generales
    const totalSesiones = sesiones.length
    const totalProductos = sesiones.reduce((acc, s) => acc + s.estadisticas.total_productos, 0)
    const productosRentables = sesiones.reduce((acc, s) => acc + s.estadisticas.productos_rentables, 0)
    
    // Calcular rentabilidad promedio
    let rentabilidadTotal = 0
    let sesionesConRentabilidad = 0
    const distribucion = { optimo: 0, advertencia: 0, critico: 0 }
    
    for (const sesion of sesiones) {
      try {
        const estadisticas = await HistorialPricing.obtenerEstadisticasSesion(sesion.id)
        if (estadisticas.rentabilidad_promedio_minorista > 0) {
          rentabilidadTotal += estadisticas.rentabilidad_promedio_minorista
          sesionesConRentabilidad++
        }
        if (estadisticas.distribucion_margenes) {
          distribucion.optimo += estadisticas.distribucion_margenes.optimo || 0
          distribucion.advertencia += estadisticas.distribucion_margenes.advertencia || 0
          distribucion.critico += estadisticas.distribucion_margenes.critico || 0
        }
      } catch (error) {
        console.warn(`Error obteniendo estadísticas de sesión ${sesion.id}:`, error)
      }
    }
    
    const rentabilidadPromedio = sesionesConRentabilidad > 0 
      ? rentabilidadTotal / sesionesConRentabilidad 
      : 0

    // Obtener proveedores únicos
    const proveedoresSet = new Set<string>()
    for (const sesion of sesiones) {
      try {
        const productos = await HistorialPricing.obtenerProductosSesion(sesion.id)
        productos.forEach(p => {
          if (p.proveedor && p.proveedor !== 'Sin Marca') {
            proveedoresSet.add(p.proveedor)
          }
        })
      } catch (error) {
        console.warn(`Error obteniendo productos de sesión ${sesion.id}:`, error)
      }
    }

    // Calcular sesiones del mes actual
    const mesActual = new Date()
    const inicioMes = new Date(mesActual.getFullYear(), mesActual.getMonth(), 1)
    const sesionesMes = sesiones.filter(s => {
      const fechaSesion = new Date(s.fecha_procesamiento)
      return fechaSesion >= inicioMes
    }).length

    const estadisticas = {
      total_sesiones: totalSesiones,
      total_productos: totalProductos,
      rentabilidad_promedio: rentabilidadPromedio,
      proveedores_unicos: proveedoresSet.size,
      sesiones_mes: sesionesMes,
      productos_rentables: productosRentables,
      distribucion_margenes: distribucion
    }

    console.log('✅ Estadísticas calculadas:', estadisticas)
    
    return NextResponse.json({
      success: true,
      estadisticas: estadisticas
    })
    
  } catch (error) {
    console.error('❌ Error obteniendo estadísticas generales:', error)
    return NextResponse.json({ 
      error: 'Error obteniendo estadísticas generales',
      detalles: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
