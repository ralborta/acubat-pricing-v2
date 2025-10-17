import { NextRequest, NextResponse } from 'next/server'
import { HistorialPricing } from "@/lib/supabase-historial"
import * as XLSX from 'xlsx'

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Exportando análisis por proveedor a Excel...')
    
    // Obtener datos de proveedores
    const sesiones = await HistorialPricing.obtenerSesiones(50)
    
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
          fecha_procesamiento: sesion.fecha_procesamiento
        }))
        todosProductos.push(...productosConSesion)
      } catch (error) {
        console.warn(`Error obteniendo productos de sesión ${sesion.id}:`, error)
      }
    }

    // Agrupar por proveedor
    const productosPorProveedor: any = {}
    todosProductos.forEach(producto => {
      const proveedor = producto.proveedor || 'Sin Marca'
      if (!productosPorProveedor[proveedor]) {
        productosPorProveedor[proveedor] = []
      }
      productosPorProveedor[proveedor].push(producto)
    })

    // Calcular estadísticas por proveedor
    const estadisticasProveedores: any[] = []
    Object.keys(productosPorProveedor).forEach(proveedor => {
      const productos = productosPorProveedor[proveedor]
      const cantidadProductos = productos.length
      const productosRentables = productos.filter((p: any) => 
        p.minorista_rentabilidad > 0 && p.mayorista_rentabilidad > 0
      ).length
      const porcentajeRentables = cantidadProductos > 0 
        ? (productosRentables / cantidadProductos) * 100 
        : 0

      const rentabilidadPromedioMinorista = productos.length > 0
        ? productos.reduce((sum: number, p: any) => sum + (p.minorista_rentabilidad || 0), 0) / productos.length
        : 0

      const rentabilidadPromedioMayorista = productos.length > 0
        ? productos.reduce((sum: number, p: any) => sum + (p.mayorista_rentabilidad || 0), 0) / productos.length
        : 0

      const valorTotalMinorista = productos.reduce((sum: number, p: any) => sum + (p.minorista_precio_final || 0), 0)
      const valorTotalMayorista = productos.reduce((sum: number, p: any) => sum + (p.mayorista_precio_final || 0), 0)

      const conEquivalenciaVarta = productos.filter((p: any) => p.equivalencia_varta?.encontrada).length
      const porcentajeVarta = cantidadProductos > 0 
        ? (conEquivalenciaVarta / cantidadProductos) * 100 
        : 0

      estadisticasProveedores.push({
        'Proveedor': proveedor,
        'Cantidad Productos': cantidadProductos,
        'Productos Rentables': productosRentables,
        'Porcentaje Rentables (%)': porcentajeRentables.toFixed(1),
        'Rentabilidad Promedio Minorista (%)': rentabilidadPromedioMinorista.toFixed(2),
        'Rentabilidad Promedio Mayorista (%)': rentabilidadPromedioMayorista.toFixed(2),
        'Valor Total Minorista': valorTotalMinorista,
        'Valor Total Mayorista': valorTotalMayorista,
        'Con Equivalencia Varta': conEquivalenciaVarta,
        'Porcentaje Varta (%)': porcentajeVarta.toFixed(1)
      })
    })

    // Ordenar por rentabilidad para rankings
    const estadisticasOrdenadas = [...estadisticasProveedores].sort((a, b) => 
      parseFloat(b['Rentabilidad Promedio Minorista (%)']) - parseFloat(a['Rentabilidad Promedio Minorista (%)'])
    )

    // Agregar rankings
    const estadisticasConRanking = estadisticasOrdenadas.map((est, index) => ({
      ...est,
      'Ranking Rentabilidad': index + 1
    }))

    // Ordenar por cantidad para ranking de cantidad
    const porCantidad = [...estadisticasProveedores].sort((a, b) => b['Cantidad Productos'] - a['Cantidad Productos'])
    const estadisticasConRankingCantidad = porCantidad.map((est, index) => ({
      ...est,
      'Ranking Cantidad': index + 1
    }))

    // Ordenar por valor para ranking de valor
    const porValor = [...estadisticasProveedores].sort((a, b) => b['Valor Total Minorista'] - a['Valor Total Minorista'])
    const estadisticasConRankingValor = porValor.map((est, index) => ({
      ...est,
      'Ranking Valor': index + 1
    }))

    // Top productos por proveedor
    const topProductosPorProveedor: any[] = []
    Object.keys(productosPorProveedor).forEach(proveedor => {
      const productos = productosPorProveedor[proveedor]
      const topProductos = [...productos]
        .filter(p => p.minorista_rentabilidad > 0)
        .sort((a, b) => b.minorista_rentabilidad - a.minorista_rentabilidad)
        .slice(0, 10)
        .map(producto => ({
          'Proveedor': proveedor,
          'Producto': producto.producto,
          'Modelo': producto.modelo,
          'Rentabilidad Minorista (%)': producto.minorista_rentabilidad,
          'Rentabilidad Mayorista (%)': producto.mayorista_rentabilidad,
          'Precio Minorista': producto.minorista_precio_final,
          'Precio Mayorista': producto.mayorista_precio_final,
          'Con Varta': producto.equivalencia_varta?.encontrada ? 'Sí' : 'No'
        }))
      
      topProductosPorProveedor.push(...topProductos)
    })

    // Productos problemáticos por proveedor
    const productosProblematicos: any[] = []
    Object.keys(productosPorProveedor).forEach(proveedor => {
      const productos = productosPorProveedor[proveedor]
      const problematicos = [...productos]
        .filter(p => p.minorista_rentabilidad <= 0 || p.mayorista_rentabilidad <= 0)
        .sort((a, b) => a.minorista_rentabilidad - b.minorista_rentabilidad)
        .slice(0, 10)
        .map(producto => ({
          'Proveedor': proveedor,
          'Producto': producto.producto,
          'Modelo': producto.modelo,
          'Rentabilidad Minorista (%)': producto.minorista_rentabilidad,
          'Rentabilidad Mayorista (%)': producto.mayorista_rentabilidad,
          'Precio Minorista': producto.minorista_precio_final,
          'Precio Mayorista': producto.mayorista_precio_final,
          'Con Varta': producto.equivalencia_varta?.encontrada ? 'Sí' : 'No',
          'Problema': producto.minorista_rentabilidad <= 0 ? 'Rentabilidad Minorista Negativa' : 'Rentabilidad Mayorista Negativa'
        }))
      
      productosProblematicos.push(...problematicos)
    })

    // Estadísticas generales
    const totalProveedores = estadisticasProveedores.length
    const totalProductos = estadisticasProveedores.reduce((sum, est) => sum + est['Cantidad Productos'], 0)
    const rentabilidadPromedioGeneral = estadisticasProveedores.length > 0
      ? estadisticasProveedores.reduce((sum, est) => sum + parseFloat(est['Rentabilidad Promedio Minorista (%)']), 0) / estadisticasProveedores.length
      : 0

    const proveedorDominante = porCantidad.length > 0 ? porCantidad[0]['Proveedor'] : ''
    const proveedorMasRentable = estadisticasOrdenadas.length > 0 ? estadisticasOrdenadas[0]['Proveedor'] : ''

    const estadisticasGenerales = [
      { 'Métrica': 'Total Proveedores', 'Valor': totalProveedores },
      { 'Métrica': 'Total Productos', 'Valor': totalProductos },
      { 'Métrica': 'Rentabilidad Promedio General (%)', 'Valor': rentabilidadPromedioGeneral.toFixed(2) },
      { 'Métrica': 'Proveedor Dominante', 'Valor': proveedorDominante },
      { 'Métrica': 'Proveedor Más Rentable', 'Valor': proveedorMasRentable },
      { 'Métrica': 'Fecha de Generación', 'Valor': new Date().toLocaleString('es-AR') }
    ]

    // Crear workbook con múltiples hojas
    const workbook = XLSX.utils.book_new()

    // Hoja 1: Estadísticas por Proveedor
    const wsEstadisticas = XLSX.utils.json_to_sheet(estadisticasConRanking)
    XLSX.utils.book_append_sheet(workbook, wsEstadisticas, 'Estadísticas por Proveedor')

    // Hoja 2: Ranking por Rentabilidad
    const wsRankingRentabilidad = XLSX.utils.json_to_sheet(estadisticasConRanking)
    XLSX.utils.book_append_sheet(workbook, wsRankingRentabilidad, 'Ranking por Rentabilidad')

    // Hoja 3: Ranking por Cantidad
    const wsRankingCantidad = XLSX.utils.json_to_sheet(estadisticasConRankingCantidad)
    XLSX.utils.book_append_sheet(workbook, wsRankingCantidad, 'Ranking por Cantidad')

    // Hoja 4: Ranking por Valor
    const wsRankingValor = XLSX.utils.json_to_sheet(estadisticasConRankingValor)
    XLSX.utils.book_append_sheet(workbook, wsRankingValor, 'Ranking por Valor')

    // Hoja 5: Top Productos por Proveedor
    const wsTopProductos = XLSX.utils.json_to_sheet(topProductosPorProveedor)
    XLSX.utils.book_append_sheet(workbook, wsTopProductos, 'Top Productos por Proveedor')

    // Hoja 6: Productos Problemáticos
    const wsProblematicos = XLSX.utils.json_to_sheet(productosProblematicos)
    XLSX.utils.book_append_sheet(workbook, wsProblematicos, 'Productos Problemáticos')

    // Hoja 7: Estadísticas Generales
    const wsGenerales = XLSX.utils.json_to_sheet(estadisticasGenerales)
    XLSX.utils.book_append_sheet(workbook, wsGenerales, 'Estadísticas Generales')

    // Generar archivo Excel
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    console.log('✅ Excel de proveedores generado exitosamente:', {
      hojas: workbook.SheetNames.length,
      proveedores: totalProveedores,
      productos: totalProductos,
      top_productos: topProductosPorProveedor.length,
      problematicos: productosProblematicos.length
    })

    // Retornar archivo Excel
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="reporte_proveedores_${new Date().toISOString().split('T')[0]}.xlsx"`
      }
    })
    
  } catch (error) {
    console.error('❌ Error exportando Excel de proveedores:', error)
    return NextResponse.json({ 
      error: 'Error exportando análisis por proveedor a Excel',
      detalles: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
