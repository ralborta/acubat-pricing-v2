import { NextRequest, NextResponse } from 'next/server'
import { HistorialPricing } from "@/lib/supabase-historial"

export async function GET(request: NextRequest) {
  try {
    console.log('⚠️ Generando centro de alertas...')
    
    // Obtener todas las sesiones
    const sesiones = await HistorialPricing.obtenerSesiones(50)
    
    if (sesiones.length === 0) {
      return NextResponse.json({
        success: true,
        datos: {
          resumen: {
            total_alertas: 0,
            alertas_alta: 0,
            alertas_media: 0,
            alertas_baja: 0,
            productos_afectados: 0,
            sesiones_afectadas: 0
          },
          alertas: [],
          por_tipo: {
            rentabilidad_negativa: 0,
            precio_fuera_rango: 0,
            sin_varta: 0,
            error_procesamiento: 0,
            rentabilidad_baja: 0
          },
          por_severidad: {
            alta: [],
            media: [],
            baja: []
          },
          tendencias: {
            alertas_por_dia: [],
            tipos_mas_comunes: []
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

    // Generar alertas
    const alertas: any[] = []

    // 1. Alertas de rentabilidad negativa
    const productosRentabilidadNegativa = todosProductos.filter(p => 
      p.minorista_rentabilidad <= 0 || p.mayorista_rentabilidad <= 0
    )

    productosRentabilidadNegativa.forEach(producto => {
      alertas.push({
        id: `rent_neg_${producto.id}`,
        tipo: 'rentabilidad_negativa',
        severidad: 'alta',
        titulo: 'Rentabilidad Negativa Detectada',
        descripcion: `El producto "${producto.producto}" tiene rentabilidad negativa en ${producto.minorista_rentabilidad <= 0 ? 'minorista' : 'mayorista'}`,
        producto: producto.producto,
        proveedor: producto.proveedor,
        sesion_id: producto.sesion_id,
        fecha: producto.fecha_procesamiento,
        valor_actual: producto.minorista_rentabilidad <= 0 ? producto.minorista_rentabilidad : producto.mayorista_rentabilidad,
        valor_esperado: 0,
        accion_sugerida: 'Revisar precios base y márgenes aplicados. Considerar ajustar precios o descuentos.'
      })
    })

    // 2. Alertas de precios fuera de rango
    const productosPrecioFueraRango = todosProductos.filter(p => {
      const precioMinorista = p.minorista_precio_final || 0
      const precioMayorista = p.mayorista_precio_final || 0
      return precioMinorista < 1000 || precioMinorista > 100000 || 
             precioMayorista < 1000 || precioMayorista > 100000
    })

    productosPrecioFueraRango.forEach(producto => {
      const precioMinorista = producto.minorista_precio_final || 0
      const precioMayorista = producto.mayorista_precio_final || 0
      const fueraRango = precioMinorista < 1000 || precioMinorista > 100000 || 
                        precioMayorista < 1000 || precioMayorista > 100000

      if (fueraRango) {
        alertas.push({
          id: `precio_rango_${producto.id}`,
          tipo: 'precio_fuera_rango',
          severidad: 'media',
          titulo: 'Precio Fuera de Rango Normal',
          descripcion: `El producto "${producto.producto}" tiene precios fuera del rango esperado (1,000 - 100,000 ARS)`,
          producto: producto.producto,
          proveedor: producto.proveedor,
          sesion_id: producto.sesion_id,
          fecha: producto.fecha_procesamiento,
          valor_actual: precioMinorista,
          valor_esperado: 50000, // Precio promedio esperado
          accion_sugerida: 'Verificar cálculos de pricing y precios base. Revisar configuración de márgenes.'
        })
      }
    })

    // 3. Alertas de productos sin equivalencia Varta
    const productosSinVarta = todosProductos.filter(p => !p.equivalencia_varta?.encontrada)

    productosSinVarta.forEach(producto => {
      alertas.push({
        id: `sin_varta_${producto.id}`,
        tipo: 'sin_varta',
        severidad: 'baja',
        titulo: 'Sin Equivalencia Varta',
        descripcion: `El producto "${producto.producto}" no tiene equivalencia Varta configurada`,
        producto: producto.producto,
        proveedor: producto.proveedor,
        sesion_id: producto.sesion_id,
        fecha: producto.fecha_procesamiento,
        accion_sugerida: 'Considerar agregar equivalencia Varta para mejorar cálculos de mayorista.'
      })
    })

    // 4. Alertas de rentabilidad baja (entre 0% y 10%)
    const productosRentabilidadBaja = todosProductos.filter(p => 
      p.minorista_rentabilidad > 0 && p.minorista_rentabilidad < 10
    )

    productosRentabilidadBaja.forEach(producto => {
      alertas.push({
        id: `rent_baja_${producto.id}`,
        tipo: 'rentabilidad_baja',
        severidad: 'media',
        titulo: 'Rentabilidad Baja',
        descripcion: `El producto "${producto.producto}" tiene rentabilidad muy baja (${producto.minorista_rentabilidad.toFixed(1)}%)`,
        producto: producto.producto,
        proveedor: producto.proveedor,
        sesion_id: producto.sesion_id,
        fecha: producto.fecha_procesamiento,
        valor_actual: producto.minorista_rentabilidad,
        valor_esperado: 20, // Rentabilidad mínima esperada
        accion_sugerida: 'Revisar márgenes aplicados. Considerar ajustar precios o buscar mejores condiciones de compra.'
      })
    })

    // 5. Alertas de errores de procesamiento (productos con datos faltantes)
    const productosConErrores = todosProductos.filter(p => 
      !p.producto || !p.proveedor || p.minorista_precio_final === 0 || p.mayorista_precio_final === 0
    )

    productosConErrores.forEach(producto => {
      alertas.push({
        id: `error_proc_${producto.id}`,
        tipo: 'error_procesamiento',
        severidad: 'alta',
        titulo: 'Error de Procesamiento',
        descripcion: `El producto "${producto.producto || 'Sin nombre'}" tiene datos faltantes o incorrectos`,
        producto: producto.producto || 'Sin nombre',
        proveedor: producto.proveedor || 'Sin proveedor',
        sesion_id: producto.sesion_id,
        fecha: producto.fecha_procesamiento,
        accion_sugerida: 'Revisar datos de entrada y configuración del sistema. Verificar mapeo de columnas.'
      })
    })

    // Calcular estadísticas
    const totalAlertas = alertas.length
    const alertasAlta = alertas.filter(a => a.severidad === 'alta').length
    const alertasMedia = alertas.filter(a => a.severidad === 'media').length
    const alertasBaja = alertas.filter(a => a.severidad === 'baja').length
    const productosAfectados = new Set(alertas.map(a => a.producto)).size
    const sesionesAfectadas = new Set(alertas.map(a => a.sesion_id)).size

    // Contar por tipo
    const porTipo = {
      rentabilidad_negativa: alertas.filter(a => a.tipo === 'rentabilidad_negativa').length,
      precio_fuera_rango: alertas.filter(a => a.tipo === 'precio_fuera_rango').length,
      sin_varta: alertas.filter(a => a.tipo === 'sin_varta').length,
      error_procesamiento: alertas.filter(a => a.tipo === 'error_procesamiento').length,
      rentabilidad_baja: alertas.filter(a => a.tipo === 'rentabilidad_baja').length
    }

    // Agrupar por severidad
    const porSeveridad = {
      alta: alertas.filter(a => a.severidad === 'alta'),
      media: alertas.filter(a => a.severidad === 'media'),
      baja: alertas.filter(a => a.severidad === 'baja')
    }

    // Calcular tendencias (agrupar por día)
    const alertasPorDia: any = {}
    alertas.forEach(alerta => {
      const fecha = new Date(alerta.fecha).toISOString().split('T')[0]
      if (!alertasPorDia[fecha]) {
        alertasPorDia[fecha] = {
          fecha,
          total: 0,
          alta: 0,
          media: 0,
          baja: 0
        }
      }
      alertasPorDia[fecha].total++
      alertasPorDia[fecha][alerta.severidad]++
    })

    const tendencias = {
      alertas_por_dia: Object.values(alertasPorDia).sort((a: any, b: any) => 
        new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
      ),
      tipos_mas_comunes: Object.entries(porTipo)
        .sort(([,a], [,b]) => b - a)
        .map(([tipo, cantidad]) => ({ tipo, cantidad }))
    }

    const datos = {
      resumen: {
        total_alertas: totalAlertas,
        alertas_alta: alertasAlta,
        alertas_media: alertasMedia,
        alertas_baja: alertasBaja,
        productos_afectados: productosAfectados,
        sesiones_afectadas: sesionesAfectadas
      },
      alertas: alertas.sort((a, b) => {
        // Ordenar por severidad (alta primero) y luego por fecha
        const severidadOrder: { [key: string]: number } = { alta: 3, media: 2, baja: 1 }
        const severidadDiff = (severidadOrder[b.severidad] || 0) - (severidadOrder[a.severidad] || 0)
        if (severidadDiff !== 0) return severidadDiff
        return new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      }),
      por_tipo: porTipo,
      por_severidad: porSeveridad,
      tendencias: tendencias
    }

    console.log('✅ Centro de alertas generado:', {
      total_alertas: totalAlertas,
      alertas_alta: alertasAlta,
      alertas_media: alertasMedia,
      alertas_baja: alertasBaja,
      productos_afectados: productosAfectados
    })
    
    return NextResponse.json({
      success: true,
      datos: datos
    })
    
  } catch (error) {
    console.error('❌ Error generando centro de alertas:', error)
    return NextResponse.json({ 
      error: 'Error generando centro de alertas',
      detalles: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
