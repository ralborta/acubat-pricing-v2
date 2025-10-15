import { NextRequest, NextResponse } from 'next/server'
import { HistorialPricing } from '../../../../lib/supabase-historial'
import * as XLSX from 'xlsx'

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Exportando reporte comparativo a Excel...')
    
    // Obtener datos comparativos
    const sesiones = await HistorialPricing.obtenerSesiones(1000)
    
    if (sesiones.length === 0) {
      return NextResponse.json({ error: 'No hay datos para exportar' }, { status: 400 })
    }

    // Procesar sesiones para obtener estadísticas detalladas
    const sesionesDetalladas = []
    for (const sesion of sesiones) {
      try {
        const estadisticas = await HistorialPricing.obtenerEstadisticasSesion(sesion.id)
        const productos = await HistorialPricing.obtenerProductosSesion(sesion.id)
        
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

    // Ordenar por fecha
    sesionesDetalladas.sort((a, b) => 
      new Date(b.fecha_procesamiento).getTime() - new Date(a.fecha_procesamiento).getTime()
    )

    // Preparar datos para Excel - Hoja 1: Resumen de Sesiones
    const resumenSesiones = sesionesDetalladas.map(sesion => ({
      'ID Sesión': sesion.id,
      'Nombre Sesión': sesion.nombre_sesion,
      'Fecha': new Date(sesion.fecha_procesamiento).toLocaleDateString('es-AR'),
      'Archivo Original': sesion.archivo_original,
      'Total Productos': sesion.total_productos,
      'Productos Rentables': sesion.productos_rentables,
      'Porcentaje Rentables (%)': sesion.total_productos > 0 ? ((sesion.productos_rentables / sesion.total_productos) * 100).toFixed(1) : 0,
      'Rentabilidad Promedio Minorista (%)': sesion.rentabilidad_promedio_minorista.toFixed(2),
      'Rentabilidad Promedio Mayorista (%)': sesion.rentabilidad_promedio_mayorista.toFixed(2),
      'Valor Total Minorista': sesion.valor_total_minorista,
      'Valor Total Mayorista': sesion.valor_total_mayorista,
      'Con Equivalencia Varta': sesion.con_equivalencia_varta
    }))

    // Calcular comparaciones entre sesiones
    const comparaciones = []
    for (let i = 0; i < sesionesDetalladas.length - 1; i++) {
      const sesionActual = sesionesDetalladas[i]
      const sesionAnterior = sesionesDetalladas[i + 1]
      
      const cambioProductos = sesionActual.total_productos - sesionAnterior.total_productos
      const cambioRentabilidadMinorista = sesionActual.rentabilidad_promedio_minorista - sesionAnterior.rentabilidad_promedio_minorista
      const cambioRentabilidadMayorista = sesionActual.rentabilidad_promedio_mayorista - sesionAnterior.rentabilidad_promedio_mayorista
      const cambioValorTotal = sesionActual.valor_total_minorista - sesionAnterior.valor_total_minorista
      
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
      
      comparaciones.push({
        'Sesión Actual': sesionActual.nombre_sesion,
        'Fecha Actual': new Date(sesionActual.fecha_procesamiento).toLocaleDateString('es-AR'),
        'Sesión Anterior': sesionAnterior.nombre_sesion,
        'Fecha Anterior': new Date(sesionAnterior.fecha_procesamiento).toLocaleDateString('es-AR'),
        'Cambio Productos': cambioProductos,
        'Cambio Productos (%)': porcentajeProductos.toFixed(2),
        'Cambio Rentabilidad Minorista (%)': cambioRentabilidadMinorista.toFixed(2),
        'Cambio Rentabilidad Minorista (%)': porcentajeRentabilidadMinorista.toFixed(2),
        'Cambio Rentabilidad Mayorista (%)': cambioRentabilidadMayorista.toFixed(2),
        'Cambio Rentabilidad Mayorista (%)': porcentajeRentabilidadMayorista.toFixed(2),
        'Cambio Valor Total': cambioValorTotal,
        'Cambio Valor Total (%)': porcentajeValorTotal.toFixed(2)
      })
    }

    // Calcular tendencias por día
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

    const tendenciasDiarias = Object.values(sesionesPorDia).map((dia: any) => ({
      'Fecha': new Date(dia.fecha).toLocaleDateString('es-AR'),
      'Total Productos': dia.total_productos,
      'Cantidad Sesiones': dia.cantidad_sesiones,
      'Rentabilidad Promedio Minorista (%)': (dia.rentabilidad_minorista / dia.cantidad_sesiones).toFixed(2),
      'Rentabilidad Promedio Mayorista (%)': (dia.rentabilidad_mayorista / dia.cantidad_sesiones).toFixed(2),
      'Valor Total': dia.valor_total
    })).sort((a, b) => new Date(a.Fecha).getTime() - new Date(b.Fecha).getTime())

    // Estadísticas generales
    const estadisticasGenerales = [
      { 'Métrica': 'Total Sesiones', 'Valor': sesionesDetalladas.length },
      { 'Métrica': 'Total Productos Procesados', 'Valor': sesionesDetalladas.reduce((sum, s) => sum + s.total_productos, 0) },
      { 'Métrica': 'Productos Rentables Totales', 'Valor': sesionesDetalladas.reduce((sum, s) => sum + s.productos_rentables, 0) },
      { 'Métrica': 'Rentabilidad Promedio General Minorista (%)', 'Valor': sesionesDetalladas.length > 0 ? (sesionesDetalladas.reduce((sum, s) => sum + s.rentabilidad_promedio_minorista, 0) / sesionesDetalladas.length).toFixed(2) : 0 },
      { 'Métrica': 'Rentabilidad Promedio General Mayorista (%)', 'Valor': sesionesDetalladas.length > 0 ? (sesionesDetalladas.reduce((sum, s) => sum + s.rentabilidad_promedio_mayorista, 0) / sesionesDetalladas.length).toFixed(2) : 0 },
      { 'Métrica': 'Valor Total Procesado', 'Valor': sesionesDetalladas.reduce((sum, s) => sum + s.valor_total_minorista, 0) },
      { 'Métrica': 'Días con Actividad', 'Valor': Object.keys(sesionesPorDia).length },
      { 'Métrica': 'Fecha de Generación', 'Valor': new Date().toLocaleString('es-AR') }
    ]

    // Crear workbook con múltiples hojas
    const workbook = XLSX.utils.book_new()

    // Hoja 1: Resumen de Sesiones
    const wsResumen = XLSX.utils.json_to_sheet(resumenSesiones)
    XLSX.utils.book_append_sheet(workbook, wsResumen, 'Resumen de Sesiones')

    // Hoja 2: Comparaciones
    if (comparaciones.length > 0) {
      const wsComparaciones = XLSX.utils.json_to_sheet(comparaciones)
      XLSX.utils.book_append_sheet(workbook, wsComparaciones, 'Comparaciones')
    }

    // Hoja 3: Tendencias Diarias
    const wsTendencias = XLSX.utils.json_to_sheet(tendenciasDiarias)
    XLSX.utils.book_append_sheet(workbook, wsTendencias, 'Tendencias Diarias')

    // Hoja 4: Estadísticas Generales
    const wsEstadisticas = XLSX.utils.json_to_sheet(estadisticasGenerales)
    XLSX.utils.book_append_sheet(workbook, wsEstadisticas, 'Estadísticas Generales')

    // Generar archivo Excel
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    console.log('✅ Excel comparativo generado exitosamente:', {
      hojas: workbook.SheetNames.length,
      sesiones: sesionesDetalladas.length,
      comparaciones: comparaciones.length,
      tendencias_dias: tendenciasDiarias.length
    })

    // Retornar archivo Excel
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="reporte_comparativo_${new Date().toISOString().split('T')[0]}.xlsx"`
      }
    })
    
  } catch (error) {
    console.error('❌ Error exportando Excel comparativo:', error)
    return NextResponse.json({ 
      error: 'Error exportando reporte comparativo a Excel',
      detalles: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
