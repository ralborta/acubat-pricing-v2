import { NextRequest, NextResponse } from 'next/server'
import { HistorialPricing } from "@/lib/supabase-historial"

export async function GET(request: NextRequest) {
  try {
    console.log('📈 Generando reporte de rentabilidad...')
    const params = request.nextUrl.searchParams
    const proveedorFiltro = params.get('proveedor') || ''
    const fechaDesde = params.get('fecha_desde') || ''
    const fechaHasta = params.get('fecha_hasta') || ''
    const soloRentables = params.get('solo_rentables') === '1'
    const rentMin = parseFloat(params.get('rent_min') || '0') || 0
    const valorMin = parseFloat(params.get('valor_min') || '0') || 0
    
    // Obtener sesiones limitadas para evitar archivos muy grandes
    const sesiones = await HistorialPricing.obtenerSesiones(50)
    
    if (sesiones.length === 0) {
      return NextResponse.json({
        success: true,
        productos: [],
        estadisticas: {
          rentabilidad_promedio_minorista: 0,
          rentabilidad_promedio_mayorista: 0,
          productos_rentables: 0,
          productos_no_rentables: 0,
          total_productos: 0,
          por_proveedor: {},
          top_rentables: [],
          menos_rentables: []
        }
      })
    }

    // Obtener productos limitados de las sesiones (máximo 1000 productos total)
    const todosProductos = []
    const maxProductos = 1000
    let productosObtenidos = 0
    
    for (const sesion of sesiones) {
      if (productosObtenidos >= maxProductos) break
      
      try {
        const productos = await HistorialPricing.obtenerProductosSesion(sesion.id)
        const productosConSesion = productos.map(p => ({
          ...p,
          sesion_id: sesion.id,
          fecha_procesamiento: sesion.fecha_procesamiento
        }))
        
        // Limitar productos por sesión para no exceder el total
        const productosRestantes = maxProductos - productosObtenidos
        const productosLimitados = productosConSesion.slice(0, productosRestantes)
        
        todosProductos.push(...productosLimitados)
        productosObtenidos += productosLimitados.length
        
        console.log(`📊 Sesión ${sesion.id}: ${productosLimitados.length} productos (total: ${productosObtenidos})`)
      } catch (error) {
        console.warn(`Error obteniendo productos de sesión ${sesion.id}:`, error)
      }
    }
    
    console.log(`📊 Total productos procesados: ${todosProductos.length}`)

    // Aplicar filtros server-side
    const productosFiltrados = todosProductos.filter((p: any) => {
      if (proveedorFiltro && proveedorFiltro !== 'todos' && (p.proveedor || 'Sin Marca') !== proveedorFiltro) return false
      if (fechaDesde && new Date(p.fecha_procesamiento) < new Date(fechaDesde)) return false
      if (fechaHasta && new Date(p.fecha_procesamiento) > new Date(fechaHasta)) return false
      if (soloRentables && !((p.minorista_rentabilidad || 0) > 0 && (p.mayorista_rentabilidad || 0) > 0)) return false
      if (rentMin > 0 && (p.minorista_rentabilidad || 0) < rentMin) return false
      if (valorMin > 0 && (p.minorista_precio_final || 0) < valorMin) return false
      return true
    })

    // Calcular estadísticas
    const totalProductos = productosFiltrados.length
    const productosRentables = productosFiltrados.filter(p => 
      p.minorista_rentabilidad > 0 && p.mayorista_rentabilidad > 0
    ).length
    const productosNoRentables = totalProductos - productosRentables

    // Calcular rentabilidad promedio
    const rentabilidadPromedioMinorista = productosFiltrados.length > 0
      ? productosFiltrados.reduce((sum, p) => sum + (p.minorista_rentabilidad || 0), 0) / productosFiltrados.length
      : 0

    const rentabilidadPromedioMayorista = productosFiltrados.length > 0
      ? productosFiltrados.reduce((sum, p) => sum + (p.mayorista_rentabilidad || 0), 0) / productosFiltrados.length
      : 0

    // Estadísticas por proveedor
    const porProveedor: any = {}
    productosFiltrados.forEach(producto => {
      const proveedor = producto.proveedor || 'Sin Marca'
      if (!porProveedor[proveedor]) {
        porProveedor[proveedor] = {
          cantidad: 0,
          rentabilidad_minorista: 0,
          rentabilidad_mayorista: 0,
          productos_rentables: 0
        }
      }
      
      porProveedor[proveedor].cantidad++
      porProveedor[proveedor].rentabilidad_minorista += producto.minorista_rentabilidad || 0
      porProveedor[proveedor].rentabilidad_mayorista += producto.mayorista_rentabilidad || 0
      
      if (producto.minorista_rentabilidad > 0 && producto.mayorista_rentabilidad > 0) {
        porProveedor[proveedor].productos_rentables++
      }
    })

    // Calcular promedios por proveedor
    Object.keys(porProveedor).forEach(proveedor => {
      const stats = porProveedor[proveedor]
      stats.rentabilidad_minorista = stats.rentabilidad_minorista / stats.cantidad
      stats.rentabilidad_mayorista = stats.rentabilidad_mayorista / stats.cantidad
    })

    // Top productos más rentables (minorista)
    const topRentables = [...productosFiltrados]
      .filter(p => p.minorista_rentabilidad > 0)
      .sort((a, b) => b.minorista_rentabilidad - a.minorista_rentabilidad)
      .slice(0, 20)

    // Productos menos rentables
    const menosRentables = [...productosFiltrados]
      .filter(p => p.minorista_rentabilidad <= 0 || p.mayorista_rentabilidad <= 0)
      .sort((a, b) => a.minorista_rentabilidad - b.minorista_rentabilidad)
      .slice(0, 20)

    const estadisticas = {
      rentabilidad_promedio_minorista: rentabilidadPromedioMinorista,
      rentabilidad_promedio_mayorista: rentabilidadPromedioMayorista,
      productos_rentables: productosRentables,
      productos_no_rentables: productosNoRentables,
      total_productos: totalProductos,
      por_proveedor: porProveedor,
      top_rentables: topRentables,
      menos_rentables: menosRentables
    }

    console.log('✅ Reporte de rentabilidad generado:', {
      total_productos: totalProductos,
      productos_rentables: productosRentables,
      rentabilidad_promedio_minorista: rentabilidadPromedioMinorista.toFixed(1) + '%',
      rentabilidad_promedio_mayorista: rentabilidadPromedioMayorista.toFixed(1) + '%'
    })
    
    return NextResponse.json({
      success: true,
      productos: productosFiltrados,
      estadisticas: estadisticas
    })
    
  } catch (error) {
    console.error('❌ Error generando reporte de rentabilidad:', error)
    return NextResponse.json({ 
      error: 'Error generando reporte de rentabilidad',
      detalles: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
