import { NextRequest, NextResponse } from 'next/server'
import { HistorialPricing } from "@/lib/supabase-historial"

export async function GET(request: NextRequest) {
  try {
    console.log('💰 Generando reporte financiero...')
    
    // Obtener todas las sesiones
    const sesiones = await HistorialPricing.obtenerSesiones(1000)
    
    if (sesiones.length === 0) {
      return NextResponse.json({
        success: true,
        datos: {
          resumen_general: {
            valor_total_procesado: 0,
            valor_agregado_total: 0,
            rentabilidad_promedio: 0,
            margen_bruto_promedio: 0,
            ahorro_por_descuentos: 0,
            proyeccion_mensual: 0,
            proyeccion_anual: 0
          },
          por_proveedor: [],
          por_sesion: [],
          top_productos_valor: [],
          top_productos_rentabilidad: [],
          proyecciones: {
            escenario_conservador: 0,
            escenario_realista: 0,
            escenario_optimista: 0
          }
        }
      })
    }

    // Obtener todos los productos de todas las sesiones
    const todosProductos = []
    for (const sesion of sesiones) {
      try {
        const productos = await HistorialPricing.obtenerProductosSesion(sesion.id)
        const productosConSesion = productos.map(p => ({
          ...p,
          sesion_id: sesion.id,
          fecha_procesamiento: sesion.fecha_procesamiento,
          valor_agregado_minorista: (p.minorista_precio_final || 0) - (p.precio_base_original || 0),
          valor_agregado_mayorista: (p.mayorista_precio_final || 0) - (p.precio_base_original || 0)
        }))
        todosProductos.push(...productosConSesion)
      } catch (error) {
        console.warn(`Error obteniendo productos de sesión ${sesion.id}:`, error)
      }
    }

    // Calcular resumen general
    const valorTotalProcesado = todosProductos.reduce((sum, p) => sum + (p.minorista_precio_final || 0), 0)
    const valorAgregadoTotal = todosProductos.reduce((sum, p) => sum + (p.valor_agregado_minorista || 0), 0)
    const rentabilidadPromedio = todosProductos.length > 0
      ? todosProductos.reduce((sum, p) => sum + (p.minorista_rentabilidad || 0), 0) / todosProductos.length
      : 0
    const margenBrutoPromedio = valorTotalProcesado > 0 
      ? (valorAgregadoTotal / valorTotalProcesado) * 100 
      : 0

    // Calcular ahorro por descuentos (estimado)
    const ahorroPorDescuentos = todosProductos.reduce((sum, p) => {
      const descuento = p.descuento_proveedor || 0
      const precioOriginal = p.precio_base_original || 0
      return sum + (precioOriginal * descuento / 100)
    }, 0)

    // Proyecciones basadas en actividad actual
    const diasActivos = new Set(todosProductos.map(p => 
      new Date(p.fecha_procesamiento).toISOString().split('T')[0]
    )).size

    const promedioDiario = diasActivos > 0 ? valorTotalProcesado / diasActivos : 0
    const proyeccionMensual = promedioDiario * 30
    const proyeccionAnual = proyeccionMensual * 12

    // Análisis por proveedor
    const productosPorProveedor: any = {}
    todosProductos.forEach(producto => {
      const proveedor = producto.proveedor || 'Sin Marca'
      if (!productosPorProveedor[proveedor]) {
        productosPorProveedor[proveedor] = []
      }
      productosPorProveedor[proveedor].push(producto)
    })

    const analisisPorProveedor = Object.keys(productosPorProveedor).map(proveedor => {
      const productos = productosPorProveedor[proveedor]
      const valorProcesado = productos.reduce((sum: number, p: any) => sum + (p.minorista_precio_final || 0), 0)
      const valorAgregado = productos.reduce((sum: number, p: any) => sum + (p.valor_agregado_minorista || 0), 0)
      const rentabilidadPromedio = productos.length > 0
        ? productos.reduce((sum: number, p: any) => sum + (p.minorista_rentabilidad || 0), 0) / productos.length
        : 0
      const porcentajeParticipacion = valorTotalProcesado > 0 
        ? (valorProcesado / valorTotalProcesado) * 100 
        : 0

      return {
        proveedor,
        valor_procesado: valorProcesado,
        valor_agregado: valorAgregado,
        rentabilidad_promedio: rentabilidadPromedio,
        cantidad_productos: productos.length,
        porcentaje_participacion: porcentajeParticipacion
      }
    }).sort((a, b) => b.valor_procesado - a.valor_procesado)

    // Análisis por sesión
    const analisisPorSesion = []
    for (const sesion of sesiones) {
      try {
        const productos = await HistorialPricing.obtenerProductosSesion(sesion.id)
        const valorProcesado = productos.reduce((sum, p) => sum + (p.minorista_precio_final || 0), 0)
        const valorAgregado = productos.reduce((sum, p) => sum + ((p.minorista_precio_final || 0) - (p.precio_base_original || 0)), 0)
        const rentabilidadPromedio = productos.length > 0
          ? productos.reduce((sum, p) => sum + (p.minorista_rentabilidad || 0), 0) / productos.length
          : 0

        analisisPorSesion.push({
          sesion_id: sesion.id,
          fecha: sesion.fecha_procesamiento,
          valor_procesado: valorProcesado,
          valor_agregado: valorAgregado,
          rentabilidad_promedio: rentabilidadPromedio,
          cantidad_productos: productos.length
        })
      } catch (error) {
        console.warn(`Error procesando sesión ${sesion.id}:`, error)
      }
    }

    // Ordenar por fecha (más reciente primero)
    analisisPorSesion.sort((a, b) => 
      new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    )

    // Top productos por valor
    const topProductosValor = [...todosProductos]
      .sort((a, b) => (b.minorista_precio_final || 0) - (a.minorista_precio_final || 0))
      .slice(0, 20)

    // Top productos por rentabilidad
    const topProductosRentabilidad = [...todosProductos]
      .filter(p => p.minorista_rentabilidad > 0)
      .sort((a, b) => b.minorista_rentabilidad - a.minorista_rentabilidad)
      .slice(0, 20)

    // Proyecciones por escenario
    const proyecciones = {
      escenario_conservador: proyeccionMensual * 0.8, // 80% del escenario realista
      escenario_realista: proyeccionMensual,
      escenario_optimista: proyeccionMensual * 1.2 // 120% del escenario realista
    }

    const datos = {
      resumen_general: {
        valor_total_procesado: valorTotalProcesado,
        valor_agregado_total: valorAgregadoTotal,
        rentabilidad_promedio: rentabilidadPromedio,
        margen_bruto_promedio: margenBrutoPromedio,
        ahorro_por_descuentos: ahorroPorDescuentos,
        proyeccion_mensual: proyeccionMensual,
        proyeccion_anual: proyeccionAnual
      },
      por_proveedor: analisisPorProveedor,
      por_sesion: analisisPorSesion,
      top_productos_valor: topProductosValor,
      top_productos_rentabilidad: topProductosRentabilidad,
      proyecciones: proyecciones
    }

    console.log('✅ Reporte financiero generado:', {
      valor_total: valorTotalProcesado,
      valor_agregado: valorAgregadoTotal,
      rentabilidad_promedio: rentabilidadPromedio.toFixed(1) + '%',
      proyeccion_mensual: proyeccionMensual,
      proveedores: analisisPorProveedor.length
    })
    
    return NextResponse.json({
      success: true,
      datos: datos
    })
    
  } catch (error) {
    console.error('❌ Error generando reporte financiero:', error)
    return NextResponse.json({ 
      error: 'Error generando reporte financiero',
      detalles: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
