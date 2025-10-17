import { NextRequest, NextResponse } from 'next/server'
import { HistorialPricing } from "@/lib/supabase-historial"

export async function GET(request: NextRequest) {
  try {
    console.log('📈 Generando reporte de rentabilidad...')
    
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

    // Calcular estadísticas
    const totalProductos = todosProductos.length
    const productosRentables = todosProductos.filter(p => 
      p.minorista_rentabilidad > 0 && p.mayorista_rentabilidad > 0
    ).length
    const productosNoRentables = totalProductos - productosRentables

    // Calcular rentabilidad promedio
    const rentabilidadPromedioMinorista = todosProductos.length > 0
      ? todosProductos.reduce((sum, p) => sum + (p.minorista_rentabilidad || 0), 0) / todosProductos.length
      : 0

    const rentabilidadPromedioMayorista = todosProductos.length > 0
      ? todosProductos.reduce((sum, p) => sum + (p.mayorista_rentabilidad || 0), 0) / todosProductos.length
      : 0

    // Estadísticas por proveedor
    const porProveedor: any = {}
    todosProductos.forEach(producto => {
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
    const topRentables = [...todosProductos]
      .filter(p => p.minorista_rentabilidad > 0)
      .sort((a, b) => b.minorista_rentabilidad - a.minorista_rentabilidad)
      .slice(0, 20)

    // Productos menos rentables
    const menosRentables = [...todosProductos]
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
      productos: todosProductos,
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
