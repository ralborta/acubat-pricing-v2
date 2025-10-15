'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { formatNumber, formatCurrency } from '../../../lib/formatters'
import { 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  Activity,
  Clock,
  Download,
  Filter,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react'

interface TendenciaTemporal {
  fecha: string
  sesiones: number
  productos: number
  rentabilidad_promedio: number
  valor_total: number
  proveedores_unicos: number
  con_varta: number
}

interface DatosTemporales {
  tendencias_diarias: TendenciaTemporal[]
  tendencias_semanales: TendenciaTemporal[]
  tendencias_mensuales: TendenciaTemporal[]
  estadisticas_generales: {
    total_dias_activos: number
    promedio_sesiones_por_dia: number
    promedio_productos_por_dia: number
    dia_mas_activo: string
    mes_mas_activo: string
    crecimiento_sesiones: number
    crecimiento_productos: number
    crecimiento_rentabilidad: number
  }
  patrones: {
    dias_semana: any[]
    horas_dia: any[]
    estacionalidad: any[]
  }
}

export default function ReporteTemporalPage() {
  const [datos, setDatos] = useState<DatosTemporales | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtros, setFiltros] = useState({
    periodo: 'diario', // 'diario', 'semanal', 'mensual'
    fecha_desde: '',
    fecha_hasta: '',
    mostrar_tendencias: true
  })

  useEffect(() => {
    cargarDatosTemporales()
  }, [])

  const cargarDatosTemporales = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/reportes/temporal')
      const data = await response.json()
      
      if (data.success) {
        setDatos(data.datos)
      } else {
        setError(data.error || 'Error cargando datos temporales')
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
      const response = await fetch('/api/reportes/temporal/exportar-excel')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `reporte_tendencias_${new Date().toISOString().split('T')[0]}.xlsx`
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

  const getTendenciasActuales = () => {
    switch (filtros.periodo) {
      case 'diario':
        return datos?.tendencias_diarias || []
      case 'semanal':
        return datos?.tendencias_semanales || []
      case 'mensual':
        return datos?.tendencias_mensuales || []
      default:
        return []
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando tendencias temporales...</p>
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
          <Button onClick={cargarDatosTemporales} className="mt-2">
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
              📅 Tendencias Temporales
            </h1>
            <p className="text-gray-600">
              Análisis de actividad y tendencias en el tiempo
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

      {/* Estadísticas generales */}
      {datos?.estadisticas_generales && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Días Activos</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{datos.estadisticas_generales.total_dias_activos}</div>
              <p className="text-xs text-muted-foreground">
                Días con actividad
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Promedio Sesiones/Día</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{datos.estadisticas_generales.promedio_sesiones_por_dia.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">
                Sesiones por día
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Crecimiento Sesiones</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold flex items-center gap-2 ${getTendenciaColor(datos.estadisticas_generales.crecimiento_sesiones)}`}>
                {getTendenciaIcon(datos.estadisticas_generales.crecimiento_sesiones)}
                {formatearPorcentaje(datos.estadisticas_generales.crecimiento_sesiones)}
              </div>
              <p className="text-xs text-muted-foreground">
                vs período anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Día Más Activo</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">{formatearFecha(datos.estadisticas_generales.dia_mas_activo)}</div>
              <p className="text-xs text-muted-foreground">
                Mayor actividad
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
            Filtros y Configuración
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Período de Análisis
              </label>
              <select
                value={filtros.periodo}
                onChange={(e) => setFiltros({...filtros, periodo: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="diario">Diario</option>
                <option value="semanal">Semanal</option>
                <option value="mensual">Mensual</option>
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
                Fecha Hasta
              </label>
              <input
                type="date"
                value={filtros.fecha_hasta}
                onChange={(e) => setFiltros({...filtros, fecha_hasta: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Patrones de actividad */}
      {datos?.patrones && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Días de la semana */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Actividad por Día de la Semana
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {datos.patrones.dias_semana.map((dia, index) => (
                  <div key={dia.dia} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                    <div className="font-medium">{dia.dia}</div>
                    <div className="text-right">
                      <div className="font-bold text-blue-600">{dia.sesiones}</div>
                      <div className="text-xs text-gray-500">sesiones</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Horas del día */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-green-600" />
                Actividad por Hora
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {datos.patrones.horas_dia.slice(0, 5).map((hora, index) => (
                  <div key={hora.hora} className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                    <div className="font-medium">{hora.hora}:00</div>
                    <div className="text-right">
                      <div className="font-bold text-green-600">{hora.sesiones}</div>
                      <div className="text-xs text-gray-500">sesiones</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Estacionalidad */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                Estacionalidad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {datos.patrones.estacionalidad.map((mes, index) => (
                  <div key={mes.mes} className="flex items-center justify-between p-2 bg-purple-50 rounded-lg">
                    <div className="font-medium">{mes.mes}</div>
                    <div className="text-right">
                      <div className="font-bold text-purple-600">{mes.sesiones}</div>
                      <div className="text-xs text-gray-500">sesiones</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabla de tendencias */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Tendencias {filtros.periodo === 'diario' ? 'Diarias' : filtros.periodo === 'semanal' ? 'Semanales' : 'Mensuales'} ({getTendenciasActuales().length})
          </CardTitle>
          <CardDescription>
            Análisis detallado de actividad por período
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium text-gray-600">Fecha</th>
                  <th className="text-left p-3 font-medium text-gray-600">Sesiones</th>
                  <th className="text-left p-3 font-medium text-gray-600">Productos</th>
                  <th className="text-left p-3 font-medium text-gray-600">Rentabilidad</th>
                  <th className="text-left p-3 font-medium text-gray-600">Valor Total</th>
                  <th className="text-left p-3 font-medium text-gray-600">Proveedores</th>
                  <th className="text-left p-3 font-medium text-gray-600">Con Varta</th>
                </tr>
              </thead>
              <tbody>
                {getTendenciasActuales().map((tendencia, index) => (
                  <tr key={tendencia.fecha} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div className="font-medium text-gray-900">
                        {formatearFecha(tendencia.fecha)}
                      </div>
                    </td>
                    
                    <td className="p-3">
                      <div className="font-medium">{tendencia.sesiones}</div>
                    </td>
                    
                    <td className="p-3">
                      <div className="font-medium">{tendencia.productos}</div>
                    </td>
                    
                    <td className="p-3">
                      <div className="font-medium text-green-600">
                        {formatearPorcentaje(tendencia.rentabilidad_promedio)}
                      </div>
                    </td>
                    
                    <td className="p-3">
                      <div className="font-medium">
                        {formatearPrecio(tendencia.valor_total)}
                      </div>
                    </td>
                    
                    <td className="p-3">
                      <Badge variant="outline">
                        {tendencia.proveedores_unicos}
                      </Badge>
                    </td>
                    
                    <td className="p-3">
                      <Badge variant="outline">
                        {tendencia.con_varta}
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
