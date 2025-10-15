'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { formatNumber, formatCurrency } from '../../../lib/formatters'
import { 
  TrendingUp, 
  TrendingDown,
  Package, 
  DollarSign,
  Download,
  Filter,
  Calendar,
  BarChart3
} from 'lucide-react'

interface ProductoRentabilidad {
  id: number
  producto: string
  proveedor: string
  minorista_rentabilidad: number
  mayorista_rentabilidad: number
  minorista_precio_final: number
  mayorista_precio_final: number
  equivalencia_varta: any
  sesion_id: number
  fecha_procesamiento: string
}

interface EstadisticasRentabilidad {
  rentabilidad_promedio_minorista: number
  rentabilidad_promedio_mayorista: number
  productos_rentables: number
  productos_no_rentables: number
  total_productos: number
  por_proveedor: any
  top_rentables: ProductoRentabilidad[]
  menos_rentables: ProductoRentabilidad[]
}

export default function ReporteRentabilidadPage() {
  const [productos, setProductos] = useState<ProductoRentabilidad[]>([])
  const [estadisticas, setEstadisticas] = useState<EstadisticasRentabilidad | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtros, setFiltros] = useState({
    proveedor: 'todos',
    rentabilidad_minima: 0,
    solo_rentables: false
  })

  useEffect(() => {
    cargarDatosRentabilidad()
  }, [])

  const cargarDatosRentabilidad = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/reportes/rentabilidad')
      const data = await response.json()
      
      if (data.success) {
        setProductos(data.productos)
        setEstadisticas(data.estadisticas)
      } else {
        setError(data.error || 'Error cargando datos de rentabilidad')
      }
    } catch (err) {
      setError('Error de conexión')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const exportarExcel = async () => {
    try {
      const response = await fetch('/api/reportes/rentabilidad/exportar-excel')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `reporte_rentabilidad_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error exportando Excel:', error)
    }
  }


  const formatearPorcentaje = (valor: number) => {
    return `${valor.toFixed(1)}%`
  }

  const formatearPrecio = (precio: number) => {
    return formatCurrency(precio, false)
  }

  const productosFiltrados = productos.filter(producto => {
    if (filtros.proveedor !== 'todos' && producto.proveedor !== filtros.proveedor) {
      return false
    }
    if (filtros.rentabilidad_minima > 0 && producto.minorista_rentabilidad < filtros.rentabilidad_minima) {
      return false
    }
    if (filtros.solo_rentables && (producto.minorista_rentabilidad <= 0 || producto.mayorista_rentabilidad <= 0)) {
      return false
    }
    return true
  })

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando análisis de rentabilidad...</p>
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
          <Button onClick={cargarDatosRentabilidad} className="mt-2">
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              📈 Análisis de Rentabilidad
            </h1>
            <p className="text-gray-600">
              Análisis detallado de rentabilidad por producto, proveedor y canal
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportarExcel}>
              <Download className="h-4 w-4 mr-2" />
              Exportar Excel
            </Button>
          </div>
        </div>
      </div>

      {/* Estadísticas principales */}
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
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
              <CardTitle className="text-sm font-medium">Productos Rentables</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {estadisticas.productos_rentables}
              </div>
              <p className="text-xs text-muted-foreground">
                De {estadisticas.total_productos} total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">No Rentables</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {estadisticas.productos_no_rentables}
              </div>
              <p className="text-xs text-muted-foreground">
                Requieren atención
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Proveedor
              </label>
              <select
                value={filtros.proveedor}
                onChange={(e) => setFiltros({...filtros, proveedor: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="todos">Todos los proveedores</option>
                {estadisticas?.por_proveedor && Object.keys(estadisticas.por_proveedor).map(proveedor => (
                  <option key={proveedor} value={proveedor}>{proveedor}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Rentabilidad Mínima (%)
              </label>
              <input
                type="number"
                value={filtros.rentabilidad_minima}
                onChange={(e) => setFiltros({...filtros, rentabilidad_minima: parseFloat(e.target.value) || 0})}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
            
            <div className="flex items-end">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filtros.solo_rentables}
                  onChange={(e) => setFiltros({...filtros, solo_rentables: e.target.checked})}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Solo productos rentables
                </span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top productos rentables */}
      {estadisticas?.top_rentables && estadisticas.top_rentables.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Top 10 Productos Más Rentables
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {estadisticas.top_rentables.slice(0, 10).map((producto, index) => (
                <div key={producto.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="bg-green-100 text-green-800">
                      #{index + 1}
                    </Badge>
                    <div>
                      <div className="font-medium text-gray-900">{producto.producto}</div>
                      <div className="text-sm text-gray-600">{producto.proveedor}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">
                      {formatearPorcentaje(producto.minorista_rentabilidad)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatearPrecio(producto.minorista_precio_final)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabla de productos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Productos Filtrados ({productosFiltrados.length})
          </CardTitle>
          <CardDescription>
            Lista detallada de productos con análisis de rentabilidad
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium text-gray-600">Producto</th>
                  <th className="text-left p-3 font-medium text-gray-600">Proveedor</th>
                  <th className="text-left p-3 font-medium text-gray-600">Minorista</th>
                  <th className="text-left p-3 font-medium text-gray-600">Mayorista</th>
                  <th className="text-left p-3 font-medium text-gray-600">Rentabilidad</th>
                  <th className="text-left p-3 font-medium text-gray-600">Varta</th>
                </tr>
              </thead>
              <tbody>
                {productosFiltrados.map((producto) => (
                  <tr key={producto.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div className="font-medium text-gray-900">{producto.producto}</div>
                    </td>
                    
                    <td className="p-3">
                      <Badge variant="outline">{producto.proveedor}</Badge>
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
    </div>
  )
}
