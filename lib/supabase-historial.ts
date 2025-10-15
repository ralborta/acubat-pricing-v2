// Helper para guardar datos de pricing en Supabase
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Faltan variables de entorno de Supabase')
}

const supabase = createClient(supabaseUrl, supabaseKey)

export interface SesionPricing {
  nombre_sesion: string
  archivo_original: string
  usuario_id?: string
  configuracion_usada: any
  estadisticas: any
  estado?: string
  observaciones?: string
}

export interface ProductoPricing {
  sesion_id: number
  producto: string
  tipo?: string
  modelo?: string
  proveedor?: string
  precio_base_original?: number
  precio_base_minorista?: number
  precio_base_mayorista?: number
  descuento_proveedor?: number
  costo_estimado_minorista?: number
  costo_estimado_mayorista?: number
  minorista_precio_neto?: number
  minorista_precio_final?: number
  minorista_rentabilidad?: number
  minorista_markup_aplicado?: number
  mayorista_precio_neto?: number
  mayorista_precio_final?: number
  mayorista_rentabilidad?: number
  mayorista_markup_aplicado?: number
  equivalencia_varta?: any
  validacion_moneda?: any
}

export class HistorialPricing {
  /**
   * Guardar una sesión de pricing completa
   */
  static async guardarSesionCompleta(
    sesion: SesionPricing,
    productos: ProductoPricing[]
  ): Promise<{ sesion_id: number; productos_guardados: number }> {
    try {
      console.log('💾 Guardando sesión de pricing en Supabase...')
      
      // 1. Guardar sesión
      const { data: sesionGuardada, error: errorSesion } = await supabase
        .from('sesiones_pricing')
        .insert(sesion)
        .select()
        .single()

      if (errorSesion) {
        console.error('❌ Error guardando sesión:', errorSesion)
        throw new Error(`Error guardando sesión: ${errorSesion.message}`)
      }

      console.log('✅ Sesión guardada con ID:', sesionGuardada.id)

      // 2. Preparar productos con sesion_id
      const productosConSesion = productos.map(producto => ({
        ...producto,
        sesion_id: sesionGuardada.id
      }))

      // 3. Guardar productos
      const { data: productosGuardados, error: errorProductos } = await supabase
        .from('productos_pricing')
        .insert(productosConSesion)
        .select()

      if (errorProductos) {
        console.error('❌ Error guardando productos:', errorProductos)
        throw new Error(`Error guardando productos: ${errorProductos.message}`)
      }

      console.log('✅ Productos guardados:', productosGuardados?.length || 0)

      return {
        sesion_id: sesionGuardada.id,
        productos_guardados: productosGuardados?.length || 0
      }

    } catch (error) {
      console.error('❌ Error en guardarSesionCompleta:', error)
      throw error
    }
  }

  /**
   * Obtener sesiones de pricing
   */
  static async obtenerSesiones(limit: number = 50): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('sesiones_pricing')
        .select('*')
        .order('fecha_procesamiento', { ascending: false })
        .limit(limit)

      if (error) {
        console.error('❌ Error obteniendo sesiones:', error)
        throw new Error(`Error obteniendo sesiones: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error('❌ Error en obtenerSesiones:', error)
      throw error
    }
  }

  /**
   * Obtener productos de una sesión
   */
  static async obtenerProductosSesion(sesion_id: number): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('productos_pricing')
        .select('*')
        .eq('sesion_id', sesion_id)
        .order('id', { ascending: true })

      if (error) {
        console.error('❌ Error obteniendo productos:', error)
        throw new Error(`Error obteniendo productos: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error('❌ Error en obtenerProductosSesion:', error)
      throw error
    }
  }

  /**
   * Obtener estadísticas de una sesión
   */
  static async obtenerEstadisticasSesion(sesion_id: number): Promise<any> {
    try {
      const { data: productos, error } = await supabase
        .from('productos_pricing')
        .select('minorista_rentabilidad, mayorista_rentabilidad, proveedor, equivalencia_varta')
        .eq('sesion_id', sesion_id)

      if (error) {
        console.error('❌ Error obteniendo estadísticas:', error)
        throw new Error(`Error obteniendo estadísticas: ${error.message}`)
      }

      if (!productos || productos.length === 0) {
        return {
          total_productos: 0,
          rentabilidad_promedio_minorista: 0,
          rentabilidad_promedio_mayorista: 0,
          productos_rentables: 0,
          con_equivalencia_varta: 0,
          por_proveedor: {}
        }
      }

      // Calcular estadísticas
      const totalProductos = productos.length
      const rentabilidadPromedioMinorista = productos.reduce((sum, p) => sum + (p.minorista_rentabilidad || 0), 0) / totalProductos
      const rentabilidadPromedioMayorista = productos.reduce((sum, p) => sum + (p.mayorista_rentabilidad || 0), 0) / totalProductos
      const productosRentables = productos.filter(p => (p.minorista_rentabilidad || 0) > 0 && (p.mayorista_rentabilidad || 0) > 0).length
      const conEquivalenciaVarta = productos.filter(p => p.equivalencia_varta?.encontrada).length

      // Estadísticas por proveedor
      const porProveedor: any = {}
      productos.forEach(p => {
        const proveedor = p.proveedor || 'Sin Marca'
        if (!porProveedor[proveedor]) {
          porProveedor[proveedor] = {
            cantidad: 0,
            rentabilidad_minorista: 0,
            rentabilidad_mayorista: 0
          }
        }
        porProveedor[proveedor].cantidad++
        porProveedor[proveedor].rentabilidad_minorista += p.minorista_rentabilidad || 0
        porProveedor[proveedor].rentabilidad_mayorista += p.mayorista_rentabilidad || 0
      })

      // Calcular promedios por proveedor
      Object.keys(porProveedor).forEach(proveedor => {
        const stats = porProveedor[proveedor]
        stats.rentabilidad_minorista = stats.rentabilidad_minorista / stats.cantidad
        stats.rentabilidad_mayorista = stats.rentabilidad_mayorista / stats.cantidad
      })

      return {
        total_productos: totalProductos,
        rentabilidad_promedio_minorista: rentabilidadPromedioMinorista,
        rentabilidad_promedio_mayorista: rentabilidadPromedioMayorista,
        productos_rentables: productosRentables,
        con_equivalencia_varta: conEquivalenciaVarta,
        por_proveedor: porProveedor
      }

    } catch (error) {
      console.error('❌ Error en obtenerEstadisticasSesion:', error)
      throw error
    }
  }
}
