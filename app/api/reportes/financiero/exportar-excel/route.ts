import { NextRequest, NextResponse } from 'next/server'
import { HistorialPricing } from '../../../../lib/supabase-historial'
import * as XLSX from 'xlsx'

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Exportando reporte financiero a Excel...')
    
    // Obtener datos financieros
    const sesiones = await HistorialPricing.obtenerSesiones(1000)
    
    if (sesiones.length === 0) {
      return NextResponse.json({ error: 'No hay datos para exportar' }, { status: 400 })
    }

    // Obtener todos los productos
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

    // Calcular métricas financieras
    const valorTotalProcesado = todosProductos.reduce((sum, p) => sum + (p.minorista_precio_final || 0), 0)
    const valorAgregadoTotal = todosProductos.reduce((sum, p) => sum + (p.valor_agregado_minorista || 0), 0)
    const rentabilidadPromedio = todosProductos.length > 0
      ? todosProductos.reduce((sum, p) => sum + (p.minorista_rentabilidad || 0), 0) / todosProductos.length
      : 0
    const margenBrutoPromedio = valorTotalProcesado > 0 
      ? (valorAgregadoTotal / valorTotalProcesado) * 100 
      : 0

    const ahorroPorDescuentos = todosProductos.reduce((sum, p) => {
      const descuento = p.descuento_proveedor || 0
      const precioOriginal = p.precio_base_original || 0
      return sum + (precioOriginal * descuento / 100)
    }, 0)

    // Proyecciones
    const diasActivos = new Set(todosProductos.map(p => 
      new Date(p.fecha_procesamiento).toISOString().split('T')[0]
    )).size
    const promedioDiario = diasActivos > 0 ? valorTotalProcesado / diasActivos : 0
    const proyeccionMensual = promedioDiario * 30
    const proyeccionAnual = proyeccionMensual * 12

    // Preparar datos para Excel
    const productosExcel = todosProductos.map(producto => ({
      'Sesión ID': producto.sesion_id,
      'Fecha': new Date(producto.fecha_procesamiento).toLocaleDateString('es-AR'),
      'Producto': producto.producto,
      'Proveedor': producto.proveedor,
      'Precio Base Original': producto.precio_base_original,
      'Precio Minorista Final': producto.minorista_precio_final,
      'Precio Mayorista Final': producto.mayorista_precio_final,
      'Valor Agregado Minorista': producto.valor_agregado_minorista,
      'Valor Agregado Mayorista': producto.valor_agregado_mayorista,
      'Rentabilidad Minorista (%)': producto.minorista_rentabilidad,
      'Rentabilidad Mayorista (%)': producto.mayorista_rentabilidad,
      'Descuento Proveedor (%)': producto.descuento_proveedor || 0,
      'Ahorro por Descuento': (producto.precio_base_original || 0) * (producto.descuento_proveedor || 0) / 100,
      'Con Varta': producto.equivalencia_varta?.encontrada ? 'Sí' : 'No'
    }))

    // Análisis por proveedor
    const productosPorProveedor: any = {}
    todosProductos.forEach(producto => {
      const proveedor = producto.proveedor || 'Sin Marca'
      if (!productosPorProveedor[proveedor]) {
        productosPorProveedor[proveedor] = []
      }
      productosPorProveedor[proveedor].push(producto)
    })

    const analisisPorProveedorExcel = Object.keys(productosPorProveedor).map(proveedor => {
      const productos = productosPorProveedor[proveedor]
      const valorProcesado = productos.reduce((sum, p) => sum + (p.minorista_precio_final || 0), 0)
      const valorAgregado = productos.reduce((sum, p) => sum + (p.valor_agregado_minorista || 0), 0)
      const rentabilidadPromedio = productos.length > 0
        ? productos.reduce((sum, p) => sum + (p.minorista_rentabilidad || 0), 0) / productos.length
        : 0
      const porcentajeParticipacion = valorTotalProcesado > 0 
        ? (valorProcesado / valorTotalProcesado) * 100 
        : 0

      return {
        'Proveedor': proveedor,
        'Valor Procesado': valorProcesado,
        'Valor Agregado': valorAgregado,
        'Rentabilidad Promedio (%)': rentabilidadPromedio.toFixed(2),
        'Cantidad Productos': productos.length,
        'Porcentaje Participación (%)': porcentajeParticipacion.toFixed(2),
        'Valor Promedio por Producto': productos.length > 0 ? (valorProcesado / productos.length).toFixed(2) : 0
      }
    }).sort((a, b) => b['Valor Procesado'] - a['Valor Procesado'])

    // Análisis por sesión
    const analisisPorSesionExcel = []
    for (const sesion of sesiones) {
      try {
        const productos = await HistorialPricing.obtenerProductosSesion(sesion.id)
        const valorProcesado = productos.reduce((sum, p) => sum + (p.minorista_precio_final || 0), 0)
        const valorAgregado = productos.reduce((sum, p) => sum + ((p.minorista_precio_final || 0) - (p.precio_base_original || 0)), 0)
        const rentabilidadPromedio = productos.length > 0
          ? productos.reduce((sum, p) => sum + (p.minorista_rentabilidad || 0), 0) / productos.length
          : 0

        analisisPorSesionExcel.push({
          'Sesión ID': sesion.id,
          'Fecha': new Date(sesion.fecha_procesamiento).toLocaleDateString('es-AR'),
          'Valor Procesado': valorProcesado,
          'Valor Agregado': valorAgregado,
          'Rentabilidad Promedio (%)': rentabilidadPromedio.toFixed(2),
          'Cantidad Productos': productos.length,
          'Valor Promedio por Producto': productos.length > 0 ? (valorProcesado / productos.length).toFixed(2) : 0
        })
      } catch (error) {
        console.warn(`Error procesando sesión ${sesion.id}:`, error)
      }
    }

    // Top productos por valor
    const topProductosValor = [...todosProductos]
      .sort((a, b) => (b.minorista_precio_final || 0) - (a.minorista_precio_final || 0))
      .slice(0, 50)
      .map(producto => ({
        'Producto': producto.producto,
        'Proveedor': producto.proveedor,
        'Precio Minorista Final': producto.minorista_precio_final,
        'Precio Mayorista Final': producto.mayorista_precio_final,
        'Valor Agregado Minorista': producto.valor_agregado_minorista,
        'Valor Agregado Mayorista': producto.valor_agregado_mayorista,
        'Rentabilidad Minorista (%)': producto.minorista_rentabilidad,
        'Rentabilidad Mayorista (%)': producto.mayorista_rentabilidad,
        'Sesión ID': producto.sesion_id,
        'Fecha': new Date(producto.fecha_procesamiento).toLocaleDateString('es-AR')
      }))

    // Top productos por rentabilidad
    const topProductosRentabilidad = [...todosProductos]
      .filter(p => p.minorista_rentabilidad > 0)
      .sort((a, b) => b.minorista_rentabilidad - a.minorista_rentabilidad)
      .slice(0, 50)
      .map(producto => ({
        'Producto': producto.producto,
        'Proveedor': producto.proveedor,
        'Rentabilidad Minorista (%)': producto.minorista_rentabilidad,
        'Rentabilidad Mayorista (%)': producto.mayorista_rentabilidad,
        'Precio Minorista Final': producto.minorista_precio_final,
        'Precio Mayorista Final': producto.mayorista_precio_final,
        'Valor Agregado Minorista': producto.valor_agregado_minorista,
        'Sesión ID': producto.sesion_id,
        'Fecha': new Date(producto.fecha_procesamiento).toLocaleDateString('es-AR')
      }))

    // Estadísticas generales
    const estadisticasGenerales = [
      { 'Métrica': 'Valor Total Procesado', 'Valor': valorTotalProcesado },
      { 'Métrica': 'Valor Agregado Total', 'Valor': valorAgregadoTotal },
      { 'Métrica': 'Rentabilidad Promedio (%)', 'Valor': rentabilidadPromedio.toFixed(2) },
      { 'Métrica': 'Margen Bruto Promedio (%)', 'Valor': margenBrutoPromedio.toFixed(2) },
      { 'Métrica': 'Ahorro por Descuentos', 'Valor': ahorroPorDescuentos },
      { 'Métrica': 'Días Activos', 'Valor': diasActivos },
      { 'Métrica': 'Promedio Diario', 'Valor': promedioDiario.toFixed(2) },
      { 'Métrica': 'Proyección Mensual', 'Valor': proyeccionMensual },
      { 'Métrica': 'Proyección Anual', 'Valor': proyeccionAnual },
      { 'Métrica': 'Total Productos', 'Valor': todosProductos.length },
      { 'Métrica': 'Total Proveedores', 'Valor': Object.keys(productosPorProveedor).length },
      { 'Métrica': 'Fecha de Generación', 'Valor': new Date().toLocaleString('es-AR') }
    ]

    // Proyecciones por escenario
    const proyeccionesExcel = [
      { 'Escenario': 'Conservador', 'Proyección Mensual': proyeccionMensual * 0.8, 'Proyección Anual': proyeccionMensual * 0.8 * 12 },
      { 'Escenario': 'Realista', 'Proyección Mensual': proyeccionMensual, 'Proyección Anual': proyeccionAnual },
      { 'Escenario': 'Optimista', 'Proyección Mensual': proyeccionMensual * 1.2, 'Proyección Anual': proyeccionMensual * 1.2 * 12 }
    ]

    // Crear workbook con múltiples hojas
    const workbook = XLSX.utils.book_new()

    // Hoja 1: Productos Detallados
    const wsProductos = XLSX.utils.json_to_sheet(productosExcel)
    XLSX.utils.book_append_sheet(workbook, wsProductos, 'Productos Detallados')

    // Hoja 2: Análisis por Proveedor
    const wsProveedores = XLSX.utils.json_to_sheet(analisisPorProveedorExcel)
    XLSX.utils.book_append_sheet(workbook, wsProveedores, 'Análisis por Proveedor')

    // Hoja 3: Análisis por Sesión
    const wsSesiones = XLSX.utils.json_to_sheet(analisisPorSesionExcel)
    XLSX.utils.book_append_sheet(workbook, wsSesiones, 'Análisis por Sesión')

    // Hoja 4: Top Productos por Valor
    const wsTopValor = XLSX.utils.json_to_sheet(topProductosValor)
    XLSX.utils.book_append_sheet(workbook, wsTopValor, 'Top Productos por Valor')

    // Hoja 5: Top Productos por Rentabilidad
    const wsTopRentabilidad = XLSX.utils.json_to_sheet(topProductosRentabilidad)
    XLSX.utils.book_append_sheet(workbook, wsTopRentabilidad, 'Top Productos por Rentabilidad')

    // Hoja 6: Proyecciones
    const wsProyecciones = XLSX.utils.json_to_sheet(proyeccionesExcel)
    XLSX.utils.book_append_sheet(workbook, wsProyecciones, 'Proyecciones')

    // Hoja 7: Estadísticas Generales
    const wsGenerales = XLSX.utils.json_to_sheet(estadisticasGenerales)
    XLSX.utils.book_append_sheet(workbook, wsGenerales, 'Estadísticas Generales')

    // Generar archivo Excel
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    console.log('✅ Excel financiero generado exitosamente:', {
      hojas: workbook.SheetNames.length,
      productos: todosProductos.length,
      valor_total: valorTotalProcesado,
      valor_agregado: valorAgregadoTotal,
      proyeccion_mensual: proyeccionMensual
    })

    // Retornar archivo Excel
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="reporte_financiero_${new Date().toISOString().split('T')[0]}.xlsx"`
      }
    })
    
  } catch (error) {
    console.error('❌ Error exportando Excel financiero:', error)
    return NextResponse.json({ 
      error: 'Error exportando reporte financiero a Excel',
      detalles: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
