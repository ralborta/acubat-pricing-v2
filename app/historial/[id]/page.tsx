'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { ArrowLeft, Package, TrendingUp, DollarSign, Percent, CalendarDays, FileText } from 'lucide-react'

interface ProductoPricing {
  id: number
  producto: string
  tipo: string
  modelo: string
  proveedor: string
  precio_base_original: number
  minorista_precio_final: number
  mayorista_precio_final: number
  minorista_rentabilidad: number
  mayorista_rentabilidad: number
  equivalencia_varta: any
  validacion_moneda: any
}

interface EstadisticasSesion {
  total_productos: number
  rentabilidad_promedio_minorista: number
  rentabilidad_promedio_mayorista: number
  productos_rentables: number
  con_equivalencia_varta: number
  por_proveedor: any
}

export default function DetalleSesionPage() {
  const params = useParams()
  const sesionId = params.id as string
  
  const [productos, setProductos] = useState<ProductoPricing[]>([])
  const [estadisticas, setEstadisticas] = useState<EstadisticasSesion | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (sesionId) {
      cargarDetalleSesion()
    }
  }, [sesionId])

  const cargarDetalleSesion = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/historial/sesiones/${sesionId}/productos`)
      const data = await response.json()
      
      if (data.success) {
        setProductos(data.productos)
        setEstadisticas(data.estadisticas)
      } else {
        setError(data.error || 'Error cargando detalles de la sesión')
      }
    } catch (err) {
      setError('Error de conexión')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatearPrecio = (precio: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(precio)
  }

  const formatearPorcentaje = (valor: number) => {
    return `${valor.toFixed(1)}%`
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando detalles de la sesión...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Error</h3>
          <p className="text-red-600">{error}</p>
          <Button onClick={cargarDetalleSesion} className="mt-2">
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button 
            variant="outline" 
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              📊 Detalle de Sesión #{sesionId}
            </h1>
            <p className="text-gray-600">
              Productos procesados y análisis de rentabilidad
            </p>
          </div>
        </div>
      </div>

      {/* Estadísticas de la sesión */}
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estadisticas.total_productos}</div>
              <p className="text-xs text-muted-foreground">
                Productos procesados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rentabilidad Minorista</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatearPorcentaje(estadisticas.rentabilidad_promedio_minorista)}
              </div>
              <p className="text-xs text-muted-foreground">
                Promedio general
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rentabilidad Mayorista</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatearPorcentaje(estadisticas.rentabilidad_promedio_mayorista)}
              </div>
              <p className="text-xs text-muted-foreground">
                Promedio general
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Con Varta</CardTitle>
              <Badge variant="secondary">Varta</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {estadisticas.con_equivalencia_varta}
              </div>
              <p className="text-xs text-muted-foreground">
                Equivalencias encontradas
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabla de productos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Productos Procesados ({productos.length})
          </CardTitle>
          <CardDescription>
            Lista detallada de todos los productos con sus cálculos de pricing
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium text-gray-600">Producto</th>
                  <th className="text-left p-3 font-medium text-gray-600">Proveedor</th>
                  <th className="text-left p-3 font-medium text-gray-600">Precio Base</th>
                  <th className="text-left p-3 font-medium text-gray-600">Minorista</th>
                  <th className="text-left p-3 font-medium text-gray-600">Mayorista</th>
                  <th className="text-left p-3 font-medium text-gray-600">Rentabilidad</th>
                  <th className="text-left p-3 font-medium text-gray-600">Varta</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((producto) => (
                  <tr key={producto.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div>
                        <div className="font-medium text-gray-900">{producto.producto}</div>
                        <div className="text-sm text-gray-500">{producto.modelo}</div>
                      </div>
                    </td>
                    
                    <td className="p-3">
                      <Badge variant="outline">{producto.proveedor}</Badge>
                    </td>
                    
                    <td className="p-3">
                      <div className="font-medium">
                        {formatearPrecio(producto.precio_base_original)}
                      </div>
                    </td>
                    
                    <td className="p-3">
                      <div className="font-medium text-green-600">
                        {formatearPrecio(producto.minorista_precio_final)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatearPorcentaje(producto.minorista_rentabilidad)}
                      </div>
                    </td>
                    
                    <td className="p-3">
                      <div className="font-medium text-blue-600">
                        {formatearPrecio(producto.mayorista_precio_final)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatearPorcentaje(producto.mayorista_rentabilidad)}
                      </div>
                    </td>
                    
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Badge 
                          variant={producto.minorista_rentabilidad > 0 ? "default" : "destructive"}
                          className="text-xs"
                        >
                          M: {formatearPorcentaje(producto.minorista_rentabilidad)}
                        </Badge>
                        <Badge 
                          variant={producto.mayorista_rentabilidad > 0 ? "secondary" : "destructive"}
                          className="text-xs"
                        >
                          W: {formatearPorcentaje(producto.mayorista_rentabilidad)}
                        </Badge>
                      </div>
                    </td>
                    
                    <td className="p-3">
                      {producto.equivalencia_varta?.encontrada ? (
                        <Badge variant="default" className="bg-purple-100 text-purple-800">
                          ✓ Varta
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-500">
                          -
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Botones de acción */}
      <div className="flex justify-end gap-4 mt-6">
        <Button 
          variant="outline"
          onClick={() => window.location.href = `/historial/exportar/${sesionId}`}
        >
          <FileText className="h-4 w-4 mr-2" />
          Exportar a ERP
        </Button>
        
        <Button 
          onClick={() => window.location.href = `/historial`}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al Historial
        </Button>
      </div>
    </div>
  )
}
