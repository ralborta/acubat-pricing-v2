'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { formatNumber, formatCurrency } from '../../../lib/formatters'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Package,
  DollarSign,
  Download,
  Filter,
  ArrowUp,
  ArrowDown,
  Minus,
  ArrowLeft
} from 'lucide-react'

interface SesionComparativa {
  id: number
  nombre_sesion: string
  fecha_procesamiento: string
  archivo_original: string
  total_productos: number
  productos_rentables: number
  rentabilidad_promedio_minorista: number
  rentabilidad_promedio_mayorista: number
  con_equivalencia_varta: number
  valor_total_minorista: number
  valor_total_mayorista: number
}

interface ComparacionSesiones {
  sesiones: SesionComparativa[]
  comparaciones: {
    sesion_anterior: SesionComparativa | null
    sesion_actual: SesionComparativa | null
    cambios: {
      productos: { valor: number, porcentaje: number, tendencia: 'up' | 'down' | 'stable' }
      rentabilidad_minorista: { valor: number, porcentaje: number, tendencia: 'up' | 'down' | 'stable' }
      rentabilidad_mayorista: { valor: number, porcentaje: number, tendencia: 'up' | 'down' | 'stable' }
      valor_total: { valor: number, porcentaje: number, tendencia: 'up' | 'down' | 'stable' }
    }
  }
  tendencias: {
    productos_por_dia: any[]
    rentabilidad_por_dia: any[]
    valor_por_dia: any[]
  }
}

export default function ReporteComparativoPage() {
  const [datos, setDatos] = useState<ComparacionSesiones | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtros, setFiltros] = useState({
    fecha_desde: '',
    fecha_hasta: '',
    sesiones_seleccionadas: [] as number[]
  })

  useEffect(() => {
    cargarDatosComparativo()
  }, [])

  const cargarDatosComparativo = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/reportes/comparativo')
      const data = await response.json()
      
      if (data.success) {
        setDatos(data.datos)
      } else {
        setError(data.error || 'Error cargando datos comparativos')
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
      const response = await fetch('/api/reportes/comparativo/exportar-excel')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `reporte_comparativo_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error exportando Excel:', error)
    }
  }

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  const formatearPrecio = (precio: number) => {
    return formatCurrency(precio, false)
  }

  const formatearPorcentaje = (valor: number) => {
    return `${valor.toFixed(1)}%`
  }

  const getTendenciaIcon = (tendencia: 'up' | 'down' | 'stable') => {
    switch (tendencia) {
      case 'up': return <ArrowUp className="h-4 w-4 text-green-600" />
      case 'down': return <ArrowDown className="h-4 w-4 text-red-600" />
      default: return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  const getTendenciaColor = (tendencia: 'up' | 'down' | 'stable') => {
    switch (tendencia) {
      case 'up': return 'text-green-600'
      case 'down': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando análisis comparativo...</p>
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
          <Button onClick={cargarDatosComparativo} className="mt-2">
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
                🔍 Comparativo de Sesiones
              </h1>
              <p className="text-gray-600">
                Comparar sesiones entre fechas y analizar cambios en el tiempo
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

      {/* Comparación entre sesiones */}
      {datos?.comparaciones && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cambio en Productos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold flex items-center gap-2 ${getTendenciaColor(datos.comparaciones.cambios.productos.tendencia)}`}>
                {getTendenciaIcon(datos.comparaciones.cambios.productos.tendencia)}
                {datos.comparaciones.cambios.productos.valor > 0 ? '+' : ''}{datos.comparaciones.cambios.productos.valor}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatearPorcentaje(datos.comparaciones.cambios.productos.porcentaje)} vs sesión anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rentabilidad Minorista</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold flex items-center gap-2 ${getTendenciaColor(datos.comparaciones.cambios.rentabilidad_minorista.tendencia)}`}>
                {getTendenciaIcon(datos.comparaciones.cambios.rentabilidad_minorista.tendencia)}
                {datos.comparaciones.cambios.rentabilidad_minorista.valor > 0 ? '+' : ''}{formatearPorcentaje(datos.comparaciones.cambios.rentabilidad_minorista.valor)}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatearPorcentaje(datos.comparaciones.cambios.rentabilidad_minorista.porcentaje)} vs sesión anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rentabilidad Mayorista</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold flex items-center gap-2 ${getTendenciaColor(datos.comparaciones.cambios.rentabilidad_mayorista.tendencia)}`}>
                {getTendenciaIcon(datos.comparaciones.cambios.rentabilidad_mayorista.tendencia)}
                {datos.comparaciones.cambios.rentabilidad_mayorista.valor > 0 ? '+' : ''}{formatearPorcentaje(datos.comparaciones.cambios.rentabilidad_mayorista.valor)}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatearPorcentaje(datos.comparaciones.cambios.rentabilidad_mayorista.porcentaje)} vs sesión anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold flex items-center gap-2 ${getTendenciaColor(datos.comparaciones.cambios.valor_total.tendencia)}`}>
                {getTendenciaIcon(datos.comparaciones.cambios.valor_total.tendencia)}
                {datos.comparaciones.cambios.valor_total.valor > 0 ? '+' : ''}{formatearPrecio(datos.comparaciones.cambios.valor_total.valor)}
              </div>
              <p className="text-xs text-muted-foreground">
                {formatearPorcentaje(datos.comparaciones.cambios.valor_total.porcentaje)} vs sesión anterior
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detalles de sesiones comparadas */}
      {datos?.comparaciones && datos.comparaciones.sesion_anterior && datos.comparaciones.sesion_actual && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Comparación Detallada
            </CardTitle>
            <CardDescription>
              Comparación entre la sesión más reciente y la anterior
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sesión Anterior */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-700">Sesión Anterior</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sesión:</span>
                    <span className="font-medium">{datos.comparaciones.sesion_anterior.nombre_sesion}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fecha:</span>
                    <span className="font-medium">{formatearFecha(datos.comparaciones.sesion_anterior.fecha_procesamiento)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Productos:</span>
                    <span className="font-medium">{datos.comparaciones.sesion_anterior.total_productos}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rentabilidad Minorista:</span>
                    <span className="font-medium text-green-600">{formatearPorcentaje(datos.comparaciones.sesion_anterior.rentabilidad_promedio_minorista)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rentabilidad Mayorista:</span>
                    <span className="font-medium text-blue-600">{formatearPorcentaje(datos.comparaciones.sesion_anterior.rentabilidad_promedio_mayorista)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Valor Total:</span>
                    <span className="font-medium">{formatearPrecio(datos.comparaciones.sesion_anterior.valor_total_minorista)}</span>
                  </div>
                </div>
              </div>

              {/* Sesión Actual */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-700">Sesión Actual</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sesión:</span>
                    <span className="font-medium">{datos.comparaciones.sesion_actual.nombre_sesion}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fecha:</span>
                    <span className="font-medium">{formatearFecha(datos.comparaciones.sesion_actual.fecha_procesamiento)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Productos:</span>
                    <span className="font-medium">{datos.comparaciones.sesion_actual.total_productos}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rentabilidad Minorista:</span>
                    <span className="font-medium text-green-600">{formatearPorcentaje(datos.comparaciones.sesion_actual.rentabilidad_promedio_minorista)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rentabilidad Mayorista:</span>
                    <span className="font-medium text-blue-600">{formatearPorcentaje(datos.comparaciones.sesion_actual.rentabilidad_promedio_mayorista)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Valor Total:</span>
                    <span className="font-medium">{formatearPrecio(datos.comparaciones.sesion_actual.valor_total_minorista)}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabla de todas las sesiones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Historial de Sesiones ({datos?.sesiones.length || 0})
          </CardTitle>
          <CardDescription>
            Lista completa de sesiones con métricas comparativas
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium text-gray-600">Sesión</th>
                  <th className="text-left p-3 font-medium text-gray-600">Fecha</th>
                  <th className="text-left p-3 font-medium text-gray-600">Productos</th>
                  <th className="text-left p-3 font-medium text-gray-600">Rentabilidad Minorista</th>
                  <th className="text-left p-3 font-medium text-gray-600">Rentabilidad Mayorista</th>
                  <th className="text-left p-3 font-medium text-gray-600">Valor Total</th>
                  <th className="text-left p-3 font-medium text-gray-600">Con Varta</th>
                </tr>
              </thead>
              <tbody>
                {datos?.sesiones.map((sesion, index) => (
                  <tr key={sesion.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div className="font-medium text-gray-900">{sesion.nombre_sesion}</div>
                      <div className="text-sm text-gray-500">{sesion.archivo_original}</div>
                    </td>
                    
                    <td className="p-3">
                      <div className="text-sm">{formatearFecha(sesion.fecha_procesamiento)}</div>
                    </td>
                    
                    <td className="p-3">
                      <div className="font-medium">{sesion.total_productos}</div>
                      <div className="text-sm text-gray-500">
                        {sesion.productos_rentables} rentables
                      </div>
                    </td>
                    
                    <td className="p-3">
                      <div className="font-medium text-green-600">
                        {formatearPorcentaje(sesion.rentabilidad_promedio_minorista)}
                      </div>
                    </td>
                    
                    <td className="p-3">
                      <div className="font-medium text-blue-600">
                        {formatearPorcentaje(sesion.rentabilidad_promedio_mayorista)}
                      </div>
                    </td>
                    
                    <td className="p-3">
                      <div className="font-medium">
                        {formatearPrecio(sesion.valor_total_minorista)}
                      </div>
                    </td>
                    
                    <td className="p-3">
                      <Badge variant="outline">
                        {sesion.con_equivalencia_varta}
                      </Badge>
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
