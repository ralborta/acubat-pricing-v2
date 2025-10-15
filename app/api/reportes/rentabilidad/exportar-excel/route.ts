import { NextRequest, NextResponse } from 'next/server'
import { HistorialPricing } from '../../../../lib/supabase-historial'
import * as XLSX from 'xlsx'

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Exportando reporte de rentabilidad a Excel...')
    
    // Obtener datos de rentabilidad
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
          nombre_sesion: sesion.nombre_sesion
        }))
        todosProductos.push(...productosConSesion)
      } catch (error) {
        console.warn(`Error obteniendo productos de sesión ${sesion.id}:`, error)
      }
    }

    // Preparar datos para Excel
    const datosExcel = todosProductos.map(producto => ({
      'Sesión': producto.nombre_sesion,
      'Fecha': new Date(producto.fecha_procesamiento).toLocaleDateString('es-AR'),
      'Producto': producto.producto,
      'Modelo': producto.modelo,
      'Proveedor': producto.proveedor,
      'Precio Base Original': producto.precio_base_original,
      'Precio Minorista Final': producto.minorista_precio_final,
      'Rentabilidad Minorista (%)': producto.minorista_rentabilidad,
      'Precio Mayorista Final': producto.mayorista_precio_final,
      'Rentabilidad Mayorista (%)': producto.mayorista_rentabilidad,
      'Con Equivalencia Varta': producto.equivalencia_varta?.encontrada ? 'Sí' : 'No',
      'Modelo Varta': producto.equivalencia_varta?.modelo_varta || '',
      'Precio Varta': producto.equivalencia_varta?.precio_varta || '',
      'Es Rentable': (producto.minorista_rentabilidad > 0 && producto.mayorista_rentabilidad > 0) ? 'Sí' : 'No'
    }))

    // Calcular estadísticas por proveedor
    const estadisticasProveedor: any = {}
    todosProductos.forEach(producto => {
      const proveedor = producto.proveedor || 'Sin Marca'
      if (!estadisticasProveedor[proveedor]) {
        estadisticasProveedor[proveedor] = {
          cantidad: 0,
          rentabilidad_minorista: 0,
          rentabilidad_mayorista: 0,
          productos_rentables: 0
        }
      }
      
      estadisticasProveedor[proveedor].cantidad++
      estadisticasProveedor[proveedor].rentabilidad_minorista += producto.minorista_rentabilidad || 0
      estadisticasProveedor[proveedor].rentabilidad_mayorista += producto.mayorista_rentabilidad || 0
      
      if (producto.minorista_rentabilidad > 0 && producto.mayorista_rentabilidad > 0) {
        estadisticasProveedor[proveedor].productos_rentables++
      }
    })

    // Calcular promedios por proveedor
    const resumenProveedores = Object.keys(estadisticasProveedor).map(proveedor => {
      const stats = estadisticasProveedor[proveedor]
      return {
        'Proveedor': proveedor,
        'Cantidad Productos': stats.cantidad,
        'Rentabilidad Promedio Minorista (%)': (stats.rentabilidad_minorista / stats.cantidad).toFixed(2),
        'Rentabilidad Promedio Mayorista (%)': (stats.rentabilidad_mayorista / stats.cantidad).toFixed(2),
        'Productos Rentables': stats.productos_rentables,
        'Porcentaje Rentables (%)': ((stats.productos_rentables / stats.cantidad) * 100).toFixed(1)
      }
    })

    // Top productos más rentables
    const topRentables = [...todosProductos]
      .filter(p => p.minorista_rentabilidad > 0)
      .sort((a, b) => b.minorista_rentabilidad - a.minorista_rentabilidad)
      .slice(0, 50)
      .map(producto => ({
        'Producto': producto.producto,
        'Proveedor': producto.proveedor,
        'Rentabilidad Minorista (%)': producto.minorista_rentabilidad,
        'Rentabilidad Mayorista (%)': producto.mayorista_rentabilidad,
        'Precio Minorista': producto.minorista_precio_final,
        'Precio Mayorista': producto.mayorista_precio_final,
        'Con Varta': producto.equivalencia_varta?.encontrada ? 'Sí' : 'No'
      }))

    // Crear workbook con múltiples hojas
    const workbook = XLSX.utils.book_new()

    // Hoja 1: Datos completos
    const wsDatos = XLSX.utils.json_to_sheet(datosExcel)
    XLSX.utils.book_append_sheet(workbook, wsDatos, 'Datos Completos')

    // Hoja 2: Resumen por proveedor
    const wsProveedores = XLSX.utils.json_to_sheet(resumenProveedores)
    XLSX.utils.book_append_sheet(workbook, wsProveedores, 'Resumen por Proveedor')

    // Hoja 3: Top productos rentables
    const wsTopRentables = XLSX.utils.json_to_sheet(topRentables)
    XLSX.utils.book_append_sheet(workbook, wsTopRentables, 'Top Productos Rentables')

    // Hoja 4: Estadísticas generales
    const estadisticasGenerales = [
      { 'Métrica': 'Total Productos', 'Valor': todosProductos.length },
      { 'Métrica': 'Productos Rentables', 'Valor': todosProductos.filter(p => p.minorista_rentabilidad > 0 && p.mayorista_rentabilidad > 0).length },
      { 'Métrica': 'Productos No Rentables', 'Valor': todosProductos.filter(p => p.minorista_rentabilidad <= 0 || p.mayorista_rentabilidad <= 0).length },
      { 'Métrica': 'Rentabilidad Promedio Minorista (%)', 'Valor': todosProductos.length > 0 ? (todosProductos.reduce((sum, p) => sum + (p.minorista_rentabilidad || 0), 0) / todosProductos.length).toFixed(2) : 0 },
      { 'Métrica': 'Rentabilidad Promedio Mayorista (%)', 'Valor': todosProductos.length > 0 ? (todosProductos.reduce((sum, p) => sum + (p.mayorista_rentabilidad || 0), 0) / todosProductos.length).toFixed(2) : 0 },
      { 'Métrica': 'Total Sesiones', 'Valor': sesiones.length },
      { 'Métrica': 'Proveedores Únicos', 'Valor': Object.keys(estadisticasProveedor).length },
      { 'Métrica': 'Fecha de Generación', 'Valor': new Date().toLocaleString('es-AR') }
    ]
    const wsEstadisticas = XLSX.utils.json_to_sheet(estadisticasGenerales)
    XLSX.utils.book_append_sheet(workbook, wsEstadisticas, 'Estadísticas Generales')

    // Generar archivo Excel
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    console.log('✅ Excel generado exitosamente:', {
      hojas: workbook.SheetNames.length,
      productos: todosProductos.length,
      proveedores: Object.keys(estadisticasProveedor).length
    })

    // Retornar archivo Excel
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="reporte_rentabilidad_${new Date().toISOString().split('T')[0]}.xlsx"`
      }
    })
    
  } catch (error) {
    console.error('❌ Error exportando Excel:', error)
    return NextResponse.json({ 
      error: 'Error exportando reporte a Excel',
      detalles: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
