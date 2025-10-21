'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { formatNumber, formatCurrency } from '../../../lib/formatters'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  Calculator,
  Download,
  Filter,
  ArrowUp,
  ArrowDown,
  Minus,
  Percent,
  Target,
  ArrowLeft
} from 'lucide-react'

interface ProductoFinanciero {
  id: number
  producto: string
  proveedor: string
  precio_base_original: number
  minorista_precio_final: number
  mayorista_precio_final: number
  minorista_rentabilidad: number
  mayorista_rentabilidad: number
  valor_agregado_minorista: number
  valor_agregado_mayorista: number
  sesion_id: number
  fecha_procesamiento: string
}

interface AnalisisFinanciero {
  resumen_general: {
    valor_total_procesado: number
    valor_agregado_total: number
    rentabilidad_promedio: number
    margen_bruto_promedio: number
    ahorro_por_descuentos: number
    proyeccion_mensual: number
    proyeccion_anual: number
  }
  por_proveedor: {
    proveedor: string
    valor_procesado: number
    valor_agregado: number
    rentabilidad_promedio: number
    cantidad_productos: number
    porcentaje_participacion: number
  }[]
  por_sesion: {
    sesion_id: number
    fecha: string
    valor_procesado: number
    valor_agregado: number
    rentabilidad_promedio: number
    cantidad_productos: number
  }[]
  top_productos_valor: ProductoFinanciero[]
  top_productos_rentabilidad: ProductoFinanciero[]
  proyecciones: {
    escenario_conservador: number
    escenario_realista: number
    escenario_optimista: number
  }
}

export default function ReporteFinancieroPage() {
  const [datos, setDatos] = useState<AnalisisFinanciero | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtros, setFiltros] = useState({
    proveedor: 'todos',
    fecha_desde: '',
    fecha_hasta: '',
    valor_minimo: 0,
    solo_rentables: false
  })

  useEffect(() => {
    cargarDatosFinancieros()
  }, [])

  const cargarDatosFinancieros = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/reportes/financiero')
      const data = await response.json()
      
      if (data.success) {
        setDatos(data.datos)
      } else {
        setError(data.error || 'Error cargando datos financieros')
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
      const response = await fetch('/api/reportes/financiero/exportar-excel')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `reporte_financiero_${new Date().toISOString().split('T')[0]}.xlsx`
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

  const getTendenciaIcon = (valor: number) => {
    if (valor > 0) return <ArrowUp className="h-4 w-4 text-green-600" />
    if (valor < 0) return <ArrowDown className="h-4 w-4 text-red-600" />
    return <Minus className="h-4 w-4 text-gray-600" />
  }

  const getTendenciaColor = (valor: number) => {
    if (valor > 0) return 'text-green-600'
    if (valor < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando análisis financiero...</p>
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
          <Button onClick={cargarDatosFinancieros} className="mt-2">
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
                💰 Reporte Financiero
              </h1>
              <p className="text-gray-600">
                Análisis económico e impacto financiero del sistema de pricing
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
              <CardTitle className="text-sm font-medium">Valor Total Procesado</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatearPrecio(datos.resumen_general.valor_total_procesado)}
              </div>
              <p className="text-xs text-muted-foreground">
                Valor total de productos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Agregado</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatearPrecio(datos.resumen_general.valor_agregado_total)}
              </div>
              <p className="text-xs text-muted-foreground">
                Valor agregado por pricing
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rentabilidad Promedio</CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {formatearPorcentaje(datos.resumen_general.rentabilidad_promedio)}
              </div>
              <p className="text-xs text-muted-foreground">
                Promedio general
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ahorro por Descuentos</CardTitle>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {formatearPrecio(datos.resumen_general.ahorro_por_descuentos)}
              </div>
              <p className="text-xs text-muted-foreground">
                Ahorro generado
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Proyecciones */}
      {datos?.proyecciones && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              Proyecciones de Ingresos
            </CardTitle>
            <CardDescription>
              Proyecciones basadas en la actividad actual
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <h3 className="text-lg font-semibold text-red-800 mb-2">Escenario Conservador</h3>
                <div className="text-2xl font-bold text-red-600">
                  {formatearPrecio(datos.proyecciones.escenario_conservador)}
                </div>
                <p className="text-sm text-red-600 mt-1">Proyección mensual</p>
              </div>
              
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">Escenario Realista</h3>
                <div className="text-2xl font-bold text-yellow-600">
                  {formatearPrecio(datos.proyecciones.escenario_realista)}
                </div>
                <p className="text-sm text-yellow-600 mt-1">Proyección mensual</p>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <h3 className="text-lg font-semibold text-green-800 mb-2">Escenario Optimista</h3>
                <div className="text-2xl font-bold text-green-600">
                  {formatearPrecio(datos.proyecciones.escenario_optimista)}
                </div>
                <p className="text-sm text-green-600 mt-1">Proyección mensual</p>
              </div>
            </div>
          </CardContent>
        </Card>
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
                {datos?.por_proveedor.map(prov => (
                  <option key={prov.proveedor} value={prov.proveedor}>{prov.proveedor}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Fecha Desde
              </label>
              <input
                type="date"
                value={filtros.fecha_desde}
                onChange={(e) => setFiltros({...filtros, fecha_desde: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Valor Mínimo
              </label>
              <input
                type="number"
                value={filtros.valor_minimo}
                onChange={(e) => setFiltros({...filtros, valor_minimo: parseFloat(e.target.value) || 0})}
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
                  Solo rentables
                </span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Análisis por proveedor */}
      {datos?.por_proveedor && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Análisis por Proveedor
            </CardTitle>
            <CardDescription>
              Participación financiera de cada proveedor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium text-gray-600">Proveedor</th>
                    <th className="text-left p-3 font-medium text-gray-600">Valor Procesado</th>
                    <th className="text-left p-3 font-medium text-gray-600">Valor Agregado</th>
                    <th className="text-left p-3 font-medium text-gray-600">Rentabilidad</th>
                    <th className="text-left p-3 font-medium text-gray-600">Participación</th>
                    <th className="text-left p-3 font-medium text-gray-600">Productos</th>
                  </tr>
                </thead>
                <tbody>
                  {datos.por_proveedor.map((proveedor, index) => (
                    <tr key={proveedor.proveedor} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div className="font-medium text-gray-900">{proveedor.proveedor}</div>
                      </td>
                      
                      <td className="p-3">
                        <div className="font-medium text-blue-600">
                          {formatearPrecio(proveedor.valor_procesado)}
                        </div>
                      </td>
                      
                      <td className="p-3">
                        <div className="font-medium text-green-600">
                          {formatearPrecio(proveedor.valor_agregado)}
                        </div>
                      </td>
                      
                      <td className="p-3">
                        <div className="font-medium text-purple-600">
                          {formatearPorcentaje(proveedor.rentabilidad_promedio)}
                        </div>
                      </td>
                      
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${proveedor.porcentaje_participacion}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">
                            {formatearPorcentaje(proveedor.porcentaje_participacion)}
                          </span>
                        </div>
                      </td>
                      
                      <td className="p-3">
                        <Badge variant="outline">
                          {proveedor.cantidad_productos}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top productos por valor */}
      {datos?.top_productos_valor && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Top 10 Productos por Valor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {datos.top_productos_valor.slice(0, 10).map((producto, index) => (
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
                      {formatearPrecio(producto.minorista_precio_final)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatearPorcentaje(producto.minorista_rentabilidad)} rentabilidad
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Análisis por sesión */}
      {datos?.por_sesion && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Análisis por Sesión ({datos.por_sesion.length})
            </CardTitle>
            <CardDescription>
              Impacto financiero de cada sesión de pricing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium text-gray-600">Sesión</th>
                    <th className="text-left p-3 font-medium text-gray-600">Fecha</th>
                    <th className="text-left p-3 font-medium text-gray-600">Valor Procesado</th>
                    <th className="text-left p-3 font-medium text-gray-600">Valor Agregado</th>
                    <th className="text-left p-3 font-medium text-gray-600">Rentabilidad</th>
                    <th className="text-left p-3 font-medium text-gray-600">Productos</th>
                  </tr>
                </thead>
                <tbody>
                  {datos.por_sesion.map((sesion, index) => (
                    <tr key={sesion.sesion_id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <Badge variant="outline">#{sesion.sesion_id}</Badge>
                      </td>
                      
                      <td className="p-3">
                        <div className="text-sm">
                          {new Date(sesion.fecha).toLocaleDateString('es-AR')}
                        </div>
                      </td>
                      
                      <td className="p-3">
                        <div className="font-medium text-blue-600">
                          {formatearPrecio(sesion.valor_procesado)}
                        </div>
                      </td>
                      
                      <td className="p-3">
                        <div className="font-medium text-green-600">
                          {formatearPrecio(sesion.valor_agregado)}
                        </div>
                      </td>
                      
                      <td className="p-3">
                        <div className="font-medium text-purple-600">
                          {formatearPorcentaje(sesion.rentabilidad_promedio)}
                        </div>
                      </td>
                      
                      <td className="p-3">
                        <Badge variant="outline">
                          {sesion.cantidad_productos}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
