import { NextRequest, NextResponse } from 'next/server'
import { HistorialPricing } from '../../../../lib/supabase-historial'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Generando reporte comparativo...')
    
    // Obtener todas las sesiones ordenadas por fecha
    const sesiones = await HistorialPricing.obtenerSesiones(1000)
    
    if (sesiones.length === 0) {
      return NextResponse.json({
        success: true,
        datos: {
          sesiones: [],
          comparaciones: {
            sesion_anterior: null,
            sesion_actual: null,
            cambios: {
              productos: { valor: 0, porcentaje: 0, tendencia: 'stable' as const },
              rentabilidad_minorista: { valor: 0, porcentaje: 0, tendencia: 'stable' as const },
              rentabilidad_mayorista: { valor: 0, porcentaje: 0, tendencia: 'stable' as const },
              valor_total: { valor: 0, porcentaje: 0, tendencia: 'stable' as const }
            }
          },
          tendencias: {
            productos_por_dia: [],
            rentabilidad_por_dia: [],
            valor_por_dia: []
          }
        }
      })
    }

    // Procesar cada sesión para obtener estadísticas detalladas
    const sesionesDetalladas = []
    for (const sesion of sesiones) {
      try {
        const estadisticas = await HistorialPricing.obtenerEstadisticasSesion(sesion.id)
        const productos = await HistorialPricing.obtenerProductosSesion(sesion.id)
        
        // Calcular valores totales
        const valorTotalMinorista = productos.reduce((sum, p) => sum + (p.minorista_precio_final || 0), 0)
        const valorTotalMayorista = productos.reduce((sum, p) => sum + (p.mayorista_precio_final || 0), 0)
        
        sesionesDetalladas.push({
          id: sesion.id,
          nombre_sesion: sesion.nombre_sesion,
          fecha_procesamiento: sesion.fecha_procesamiento,
          archivo_original: sesion.archivo_original,
          total_productos: estadisticas.total_productos,
          productos_rentables: estadisticas.productos_rentables || 0,
          rentabilidad_promedio_minorista: estadisticas.rentabilidad_promedio_minorista,
          rentabilidad_promedio_mayorista: estadisticas.rentabilidad_promedio_mayorista,
          con_equivalencia_varta: estadisticas.con_equivalencia_varta,
          valor_total_minorista: valorTotalMinorista,
          valor_total_mayorista: valorTotalMayorista
        })
      } catch (error) {
        console.warn(`Error procesando sesión ${sesion.id}:`, error)
      }
    }

    // Ordenar por fecha (más reciente primero)
    sesionesDetalladas.sort((a, b) => 
      new Date(b.fecha_procesamiento).getTime() - new Date(a.fecha_procesamiento).getTime()
    )

    // Calcular comparaciones entre las dos sesiones más recientes
    let comparaciones = {
      sesion_anterior: null as any,
      sesion_actual: null as any,
      cambios: {
        productos: { valor: 0, porcentaje: 0, tendencia: 'stable' as const },
        rentabilidad_minorista: { valor: 0, porcentaje: 0, tendencia: 'stable' as const },
        rentabilidad_mayorista: { valor: 0, porcentaje: 0, tendencia: 'stable' as const },
        valor_total: { valor: 0, porcentaje: 0, tendencia: 'stable' as const }
      }
    }

    if (sesionesDetalladas.length >= 2) {
      const sesionActual = sesionesDetalladas[0]
      const sesionAnterior = sesionesDetalladas[1]
      
      comparaciones.sesion_actual = sesionActual
      comparaciones.sesion_anterior = sesionAnterior
      
      // Calcular cambios
      const cambioProductos = sesionActual.total_productos - sesionAnterior.total_productos
      const cambioRentabilidadMinorista = sesionActual.rentabilidad_promedio_minorista - sesionAnterior.rentabilidad_promedio_minorista
      const cambioRentabilidadMayorista = sesionActual.rentabilidad_promedio_mayorista - sesionAnterior.rentabilidad_promedio_mayorista
      const cambioValorTotal = sesionActual.valor_total_minorista - sesionAnterior.valor_total_minorista
      
      // Calcular porcentajes
      const porcentajeProductos = sesionAnterior.total_productos > 0 
        ? (cambioProductos / sesionAnterior.total_productos) * 100 
        : 0
      const porcentajeRentabilidadMinorista = sesionAnterior.rentabilidad_promedio_minorista > 0 
        ? (cambioRentabilidadMinorista / sesionAnterior.rentabilidad_promedio_minorista) * 100 
        : 0
      const porcentajeRentabilidadMayorista = sesionAnterior.rentabilidad_promedio_mayorista > 0 
        ? (cambioRentabilidadMayorista / sesionAnterior.rentabilidad_promedio_mayorista) * 100 
        : 0
      const porcentajeValorTotal = sesionAnterior.valor_total_minorista > 0 
        ? (cambioValorTotal / sesionAnterior.valor_total_minorista) * 100 
        : 0
      
      // Determinar tendencias
      const getTendencia = (valor: number): 'up' | 'down' | 'stable' => {
        if (valor > 0.1) return 'up'
        if (valor < -0.1) return 'down'
        return 'stable'
      }
      
      comparaciones.cambios = {
        productos: {
          valor: cambioProductos,
          porcentaje: porcentajeProductos,
          tendencia: getTendencia(cambioProductos)
        },
        rentabilidad_minorista: {
          valor: cambioRentabilidadMinorista,
          porcentaje: porcentajeRentabilidadMinorista,
          tendencia: getTendencia(cambioRentabilidadMinorista)
        },
        rentabilidad_mayorista: {
          valor: cambioRentabilidadMayorista,
          porcentaje: porcentajeRentabilidadMayorista,
          tendencia: getTendencia(cambioRentabilidadMayorista)
        },
        valor_total: {
          valor: cambioValorTotal,
          porcentaje: porcentajeValorTotal,
          tendencia: getTendencia(cambioValorTotal)
        }
      }
    } else if (sesionesDetalladas.length === 1) {
      comparaciones.sesion_actual = sesionesDetalladas[0]
    }

    // Calcular tendencias por día (últimos 30 días)
    const tendencias = {
      productos_por_dia: [] as any[],
      rentabilidad_por_dia: [] as any[],
      valor_por_dia: [] as any[]
    }

    // Agrupar sesiones por día
    const sesionesPorDia: any = {}
    sesionesDetalladas.forEach(sesion => {
      const fecha = new Date(sesion.fecha_procesamiento).toISOString().split('T')[0]
      if (!sesionesPorDia[fecha]) {
        sesionesPorDia[fecha] = {
          fecha,
          total_productos: 0,
          rentabilidad_minorista: 0,
          rentabilidad_mayorista: 0,
          valor_total: 0,
          cantidad_sesiones: 0
        }
      }
      
      sesionesPorDia[fecha].total_productos += sesion.total_productos
      sesionesPorDia[fecha].rentabilidad_minorista += sesion.rentabilidad_promedio_minorista
      sesionesPorDia[fecha].rentabilidad_mayorista += sesion.rentabilidad_promedio_mayorista
      sesionesPorDia[fecha].valor_total += sesion.valor_total_minorista
      sesionesPorDia[fecha].cantidad_sesiones += 1
    })

    // Calcular promedios por día
    Object.values(sesionesPorDia).forEach((dia: any) => {
      tendencias.productos_por_dia.push({
        fecha: dia.fecha,
        productos: dia.total_productos,
        sesiones: dia.cantidad_sesiones
      })
      
      tendencias.rentabilidad_por_dia.push({
        fecha: dia.fecha,
        minorista: dia.rentabilidad_minorista / dia.cantidad_sesiones,
        mayorista: dia.rentabilidad_mayorista / dia.cantidad_sesiones
      })
      
      tendencias.valor_por_dia.push({
        fecha: dia.fecha,
        valor: dia.valor_total,
        sesiones: dia.cantidad_sesiones
      })
    })

    // Ordenar tendencias por fecha
    tendencias.productos_por_dia.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
    tendencias.rentabilidad_por_dia.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())
    tendencias.valor_por_dia.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())

    const datos = {
      sesiones: sesionesDetalladas,
      comparaciones,
      tendencias
    }

    console.log('✅ Reporte comparativo generado:', {
      total_sesiones: sesionesDetalladas.length,
      tiene_comparacion: comparaciones.sesion_anterior !== null,
      tendencias_dias: tendencias.productos_por_dia.length
    })
    
    return NextResponse.json({
      success: true,
      datos: datos
    })
    
  } catch (error) {
    console.error('❌ Error generando reporte comparativo:', error)
    return NextResponse.json({ 
      error: 'Error generando reporte comparativo',
      detalles: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
