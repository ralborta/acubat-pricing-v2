import { NextRequest, NextResponse } from 'next/server'
import { HistorialPricing } from '../../../../lib/supabase-historial'

export async function GET(request: NextRequest) {
  try {
    console.log('📦 Generando análisis por proveedor...')
    
    // Obtener todas las sesiones
    const sesiones = await HistorialPricing.obtenerSesiones(1000)
    
    if (sesiones.length === 0) {
      return NextResponse.json({
        success: true,
        datos: {
          estadisticas: [],
          ranking_general: {
            por_rentabilidad: [],
            por_cantidad: [],
            por_valor: []
          },
          resumen_general: {
            total_proveedores: 0,
            total_productos: 0,
            rentabilidad_promedio_general: 0,
            proveedor_dominante: '',
            proveedor_mas_rentable: ''
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
    const estadisticas: any[] = []
    Object.keys(productosPorProveedor).forEach(proveedor => {
      const productos = productosPorProveedor[proveedor]
      const cantidadProductos = productos.length
      const productosRentables = productos.filter(p => 
        p.minorista_rentabilidad > 0 && p.mayorista_rentabilidad > 0
      ).length
      const porcentajeRentables = cantidadProductos > 0 
        ? (productosRentables / cantidadProductos) * 100 
        : 0

      const rentabilidadPromedioMinorista = productos.length > 0
        ? productos.reduce((sum, p) => sum + (p.minorista_rentabilidad || 0), 0) / productos.length
        : 0

      const rentabilidadPromedioMayorista = productos.length > 0
        ? productos.reduce((sum, p) => sum + (p.mayorista_rentabilidad || 0), 0) / productos.length
        : 0

      const valorTotalMinorista = productos.reduce((sum, p) => sum + (p.minorista_precio_final || 0), 0)
      const valorTotalMayorista = productos.reduce((sum, p) => sum + (p.mayorista_precio_final || 0), 0)

      const conEquivalenciaVarta = productos.filter(p => p.equivalencia_varta?.encontrada).length
      const porcentajeVarta = cantidadProductos > 0 
        ? (conEquivalenciaVarta / cantidadProductos) * 100 
        : 0

      // Top productos del proveedor (más rentables)
      const productosTop = [...productos]
        .filter(p => p.minorista_rentabilidad > 0)
        .sort((a, b) => b.minorista_rentabilidad - a.minorista_rentabilidad)
        .slice(0, 5)

      // Productos problemáticos (no rentables)
      const productosProblematicos = [...productos]
        .filter(p => p.minorista_rentabilidad <= 0 || p.mayorista_rentabilidad <= 0)
        .sort((a, b) => a.minorista_rentabilidad - b.minorista_rentabilidad)
        .slice(0, 5)

      estadisticas.push({
        proveedor,
        cantidad_productos: cantidadProductos,
        productos_rentables: productosRentables,
        porcentaje_rentables: porcentajeRentables,
        rentabilidad_promedio_minorista: rentabilidadPromedioMinorista,
        rentabilidad_promedio_mayorista: rentabilidadPromedioMayorista,
        valor_total_minorista: valorTotalMinorista,
        valor_total_mayorista: valorTotalMayorista,
        con_equivalencia_varta: conEquivalenciaVarta,
        porcentaje_varta: porcentajeVarta,
        ranking_rentabilidad: 0, // Se calculará después
        ranking_cantidad: 0, // Se calculará después
        productos_top: productosTop,
        productos_problematicos: productosProblematicos
      })
    })

    // Calcular rankings
    const porRentabilidad = [...estadisticas].sort((a, b) => b.rentabilidad_promedio_minorista - a.rentabilidad_promedio_minorista)
    const porCantidad = [...estadisticas].sort((a, b) => b.cantidad_productos - a.cantidad_productos)
    const porValor = [...estadisticas].sort((a, b) => b.valor_total_minorista - a.valor_total_minorista)

    // Asignar rankings
    porRentabilidad.forEach((est, index) => {
      est.ranking_rentabilidad = index + 1
    })
    porCantidad.forEach((est, index) => {
      est.ranking_cantidad = index + 1
    })

    // Calcular resumen general
    const totalProveedores = estadisticas.length
    const totalProductos = estadisticas.reduce((sum, est) => sum + est.cantidad_productos, 0)
    const rentabilidadPromedioGeneral = estadisticas.length > 0
      ? estadisticas.reduce((sum, est) => sum + est.rentabilidad_promedio_minorista, 0) / estadisticas.length
      : 0

    const proveedorDominante = porCantidad.length > 0 ? porCantidad[0].proveedor : ''
    const proveedorMasRentable = porRentabilidad.length > 0 ? porRentabilidad[0].proveedor : ''

    const datos = {
      estadisticas,
      ranking_general: {
        por_rentabilidad: porRentabilidad,
        por_cantidad: porCantidad,
        por_valor: porValor
      },
      resumen_general: {
        total_proveedores: totalProveedores,
        total_productos: totalProductos,
        rentabilidad_promedio_general: rentabilidadPromedioGeneral,
        proveedor_dominante: proveedorDominante,
        proveedor_mas_rentable: proveedorMasRentable
      }
    }

    console.log('✅ Análisis por proveedor generado:', {
      total_proveedores: totalProveedores,
      total_productos: totalProductos,
      proveedor_dominante: proveedorDominante,
      proveedor_mas_rentable: proveedorMasRentable
    })
    
    return NextResponse.json({
      success: true,
      datos: datos
    })
    
  } catch (error) {
    console.error('❌ Error generando análisis por proveedor:', error)
    return NextResponse.json({ 
      error: 'Error generando análisis por proveedor',
      detalles: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
