'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { formatNumber, formatCurrency } from '../../../lib/formatters'
import { 
  Package, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  BarChart3,
  Download,
  Filter,
  Star,
  Award,
  AlertTriangle,
  ArrowLeft
} from 'lucide-react'

interface ProductoProveedor {
  id: number
  producto: string
  modelo: string
  proveedor: string
  minorista_rentabilidad: number
  mayorista_rentabilidad: number
  minorista_precio_final: number
  mayorista_precio_final: number
  equivalencia_varta: any
  sesion_id: number
  fecha_procesamiento: string
}

interface EstadisticasProveedor {
  proveedor: string
  cantidad_productos: number
  productos_rentables: number
  porcentaje_rentables: number
  rentabilidad_promedio_minorista: number
  rentabilidad_promedio_mayorista: number
  valor_total_minorista: number
  valor_total_mayorista: number
  con_equivalencia_varta: number
  porcentaje_varta: number
  ranking_rentabilidad: number
  ranking_cantidad: number
  productos_top: ProductoProveedor[]
  productos_problematicos: ProductoProveedor[]
}

interface DatosProveedores {
  estadisticas: EstadisticasProveedor[]
  ranking_general: {
    por_rentabilidad: EstadisticasProveedor[]
    por_cantidad: EstadisticasProveedor[]
    por_valor: EstadisticasProveedor[]
  }
  resumen_general: {
    total_proveedores: number
    total_productos: number
    rentabilidad_promedio_general: number
    proveedor_dominante: string
    proveedor_mas_rentable: string
  }
}

export default function ReporteProveedorPage() {
  const [datos, setDatos] = useState<DatosProveedores | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtros, setFiltros] = useState({
    proveedor: 'todos',
    rentabilidad_minima: 0,
    solo_con_varta: false,
    ordenar_por: 'rentabilidad' // 'rentabilidad', 'cantidad', 'valor'
  })

  useEffect(() => {
    cargarDatosProveedores()
  }, [])

  const cargarDatosProveedores = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/reportes/proveedor')
      const data = await response.json()
      
      if (data.success) {
        setDatos(data.datos)
      } else {
        setError(data.error || 'Error cargando datos de proveedores')
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
      const response = await fetch('/api/reportes/proveedor/exportar-excel')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `reporte_proveedores_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error exportando Excel:', error)
    }
  }

  const formatearPrecio = (precio: number) => {
    return formatCurrency(precio, false)
  }

  const formatearPorcentaje = (valor: number) => {
    return `${valor.toFixed(1)}%`
  }

  const getRankingIcon = (ranking: number) => {
    if (ranking === 1) return <Award className="h-5 w-5 text-yellow-500" />
    if (ranking === 2) return <Award className="h-5 w-5 text-gray-400" />
    if (ranking === 3) return <Award className="h-5 w-5 text-orange-500" />
    return <span className="text-sm font-medium text-gray-500">#{ranking}</span>
  }

  const getRankingColor = (ranking: number) => {
    if (ranking === 1) return 'bg-yellow-100 text-yellow-800'
    if (ranking === 2) return 'bg-gray-100 text-gray-800'
    if (ranking === 3) return 'bg-orange-100 text-orange-800'
    return 'bg-gray-100 text-gray-600'
  }

  const estadisticasFiltradas = datos?.estadisticas.filter(est => {
    if (filtros.proveedor !== 'todos' && est.proveedor !== filtros.proveedor) {
      return false
    }
    if (filtros.rentabilidad_minima > 0 && est.rentabilidad_promedio_minorista < filtros.rentabilidad_minima) {
      return false
    }
    if (filtros.solo_con_varta && est.porcentaje_varta === 0) {
      return false
    }
    return true
  }) || []

  const estadisticasOrdenadas = [...estadisticasFiltradas].sort((a, b) => {
    switch (filtros.ordenar_por) {
      case 'rentabilidad':
        return b.rentabilidad_promedio_minorista - a.rentabilidad_promedio_minorista
      case 'cantidad':
        return b.cantidad_productos - a.cantidad_productos
      case 'valor':
        return b.valor_total_minorista - a.valor_total_minorista
      default:
        return 0
    }
  })

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando análisis por proveedor...</p>
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
          <Button onClick={cargarDatosProveedores} className="mt-2">
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
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => window.history.length > 1 ? window.history.back() : (window.location.href = '/reportes')}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Volver
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                📦 Análisis por Proveedor
              </h1>
              <p className="text-gray-600">
                Estadísticas detalladas por marca y proveedor
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportarExcel}>
              <Download className="h-4 w-4 mr-2" />
              Exportar Excel
            </Button>
          </div>
        </div>
      </div>

      {/* Resumen general */}
      {datos?.resumen_general && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Proveedores</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{datos.resumen_general.total_proveedores}</div>
              <p className="text-xs text-muted-foreground">
                Marcas diferentes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{datos.resumen_general.total_productos}</div>
              <p className="text-xs text-muted-foreground">
                Productos analizados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rentabilidad Promedio</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatearPorcentaje(datos.resumen_general.rentabilidad_promedio_general)}
              </div>
              <p className="text-xs text-muted-foreground">
                Promedio general
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Proveedor Dominante</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{datos.resumen_general.proveedor_dominante}</div>
              <p className="text-xs text-muted-foreground">
                Más productos
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rankings */}
      {datos?.ranking_general && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Ranking por Rentabilidad */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Top 5 por Rentabilidad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {datos.ranking_general.por_rentabilidad.slice(0, 5).map((proveedor, index) => (
                  <div key={proveedor.proveedor} className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      {getRankingIcon(index + 1)}
                      <span className="font-medium">{proveedor.proveedor}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">
                        {formatearPorcentaje(proveedor.rentabilidad_promedio_minorista)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {proveedor.cantidad_productos} productos
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Ranking por Cantidad */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                Top 5 por Cantidad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {datos.ranking_general.por_cantidad.slice(0, 5).map((proveedor, index) => (
                  <div key={proveedor.proveedor} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      {getRankingIcon(index + 1)}
                      <span className="font-medium">{proveedor.proveedor}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-blue-600">
                        {proveedor.cantidad_productos}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatearPorcentaje(proveedor.rentabilidad_promedio_minorista)} rentabilidad
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Ranking por Valor */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-purple-600" />
                Top 5 por Valor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {datos.ranking_general.por_valor.slice(0, 5).map((proveedor, index) => (
                  <div key={proveedor.proveedor} className="flex items-center justify-between p-2 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      {getRankingIcon(index + 1)}
                      <span className="font-medium">{proveedor.proveedor}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-purple-600">
                        {formatearPrecio(proveedor.valor_total_minorista)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {proveedor.cantidad_productos} productos
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                {datos?.estadisticas.map(est => (
                  <option key={est.proveedor} value={est.proveedor}>{est.proveedor}</option>
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
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Ordenar por
              </label>
              <select
                value={filtros.ordenar_por}
                onChange={(e) => setFiltros({...filtros, ordenar_por: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="rentabilidad">Rentabilidad</option>
                <option value="cantidad">Cantidad</option>
                <option value="valor">Valor</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filtros.solo_con_varta}
                  onChange={(e) => setFiltros({...filtros, solo_con_varta: e.target.checked})}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Solo con Varta
                </span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de proveedores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Análisis Detallado por Proveedor ({estadisticasOrdenadas.length})
          </CardTitle>
          <CardDescription>
            Estadísticas completas de cada proveedor con rankings
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium text-gray-600">Ranking</th>
                  <th className="text-left p-3 font-medium text-gray-600">Proveedor</th>
                  <th className="text-left p-3 font-medium text-gray-600">Productos</th>
                  <th className="text-left p-3 font-medium text-gray-600">Rentabilidad</th>
                  <th className="text-left p-3 font-medium text-gray-600">Valor Total</th>
                  <th className="text-left p-3 font-medium text-gray-600">Con Varta</th>
                  <th className="text-left p-3 font-medium text-gray-600">Rentables</th>
                </tr>
              </thead>
              <tbody>
                {estadisticasOrdenadas.map((proveedor, index) => (
                  <tr key={proveedor.proveedor} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <Badge className={getRankingColor(index + 1)}>
                        #{index + 1}
                      </Badge>
                    </td>
                    
                    <td className="p-3">
                      <div className="font-medium text-gray-900">{proveedor.proveedor}</div>
                    </td>
                    
                    <td className="p-3">
                      <div className="font-medium">{proveedor.cantidad_productos}</div>
                      <div className="text-sm text-gray-500">
                        {proveedor.ranking_cantidad === 1 ? '🥇' : proveedor.ranking_cantidad === 2 ? '🥈' : proveedor.ranking_cantidad === 3 ? '🥉' : ''}
                      </div>
                    </td>
                    
                    <td className="p-3">
                      <div className="font-medium text-green-600">
                        {formatearPorcentaje(proveedor.rentabilidad_promedio_minorista)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {proveedor.ranking_rentabilidad === 1 ? '🥇' : proveedor.ranking_rentabilidad === 2 ? '🥈' : proveedor.ranking_rentabilidad === 3 ? '🥉' : ''}
                      </div>
                    </td>
                    
                    <td className="p-3">
                      <div className="font-medium">
                        {formatearPrecio(proveedor.valor_total_minorista)}
                      </div>
                    </td>
                    
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {proveedor.con_equivalencia_varta}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {formatearPorcentaje(proveedor.porcentaje_varta)}
                        </span>
                      </div>
                    </td>
                    
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Badge variant={proveedor.porcentaje_rentables > 80 ? "default" : proveedor.porcentaje_rentables > 60 ? "secondary" : "destructive"}>
                          {proveedor.productos_rentables}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {formatearPorcentaje(proveedor.porcentaje_rentables)}
                        </span>
                      </div>
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
