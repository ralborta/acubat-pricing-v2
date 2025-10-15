'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { formatNumber, formatCurrency } from '../../../lib/formatters'
import { 
  AlertTriangle, 
  AlertCircle,
  XCircle,
  CheckCircle,
  Download,
  Filter,
  TrendingDown,
  DollarSign,
  Package,
  Clock,
  BarChart3
} from 'lucide-react'

interface Alerta {
  id: string
  tipo: 'rentabilidad_negativa' | 'precio_fuera_rango' | 'sin_varta' | 'error_procesamiento' | 'rentabilidad_baja'
  severidad: 'alta' | 'media' | 'baja'
  titulo: string
  descripcion: string
  producto?: string
  proveedor?: string
  sesion_id?: number
  fecha: string
  valor_actual?: number
  valor_esperado?: number
  accion_sugerida: string
}

interface DatosAlertas {
  resumen: {
    total_alertas: number
    alertas_alta: number
    alertas_media: number
    alertas_baja: number
    productos_afectados: number
    sesiones_afectadas: number
  }
  alertas: Alerta[]
  por_tipo: {
    rentabilidad_negativa: number
    precio_fuera_rango: number
    sin_varta: number
    error_procesamiento: number
    rentabilidad_baja: number
  }
  por_severidad: {
    alta: Alerta[]
    media: Alerta[]
    baja: Alerta[]
  }
  tendencias: {
    alertas_por_dia: any[]
    tipos_mas_comunes: any[]
  }
}

export default function CentroAlertasPage() {
  const [datos, setDatos] = useState<DatosAlertas | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtros, setFiltros] = useState({
    severidad: 'todas', // 'todas', 'alta', 'media', 'baja'
    tipo: 'todos', // 'todos', 'rentabilidad_negativa', 'precio_fuera_rango', etc.
    fecha_desde: '',
    fecha_hasta: '',
    solo_activas: true
  })

  useEffect(() => {
    cargarDatosAlertas()
  }, [])

  const cargarDatosAlertas = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/reportes/alertas')
      const data = await response.json()
      
      if (data.success) {
        setDatos(data.datos)
      } else {
        setError(data.error || 'Error cargando alertas')
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
      const response = await fetch('/api/reportes/alertas/exportar-excel')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `centro_alertas_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error exportando Excel:', error)
    }
  }

  const getSeveridadIcon = (severidad: string) => {
    switch (severidad) {
      case 'alta': return <XCircle className="h-5 w-5 text-red-600" />
      case 'media': return <AlertTriangle className="h-5 w-5 text-yellow-600" />
      case 'baja': return <AlertCircle className="h-5 w-5 text-blue-600" />
      default: return <AlertTriangle className="h-5 w-5 text-gray-600" />
    }
  }

  const getSeveridadColor = (severidad: string) => {
    switch (severidad) {
      case 'alta': return 'bg-red-100 text-red-800 border-red-200'
      case 'media': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'baja': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'rentabilidad_negativa': return <TrendingDown className="h-4 w-4" />
      case 'precio_fuera_rango': return <DollarSign className="h-4 w-4" />
      case 'sin_varta': return <Package className="h-4 w-4" />
      case 'error_procesamiento': return <XCircle className="h-4 w-4" />
      case 'rentabilidad_baja': return <AlertTriangle className="h-4 w-4" />
      default: return <AlertTriangle className="h-4 w-4" />
    }
  }

  const getTipoTitulo = (tipo: string) => {
    switch (tipo) {
      case 'rentabilidad_negativa': return 'Rentabilidad Negativa'
      case 'precio_fuera_rango': return 'Precio Fuera de Rango'
      case 'sin_varta': return 'Sin Equivalencia Varta'
      case 'error_procesamiento': return 'Error de Procesamiento'
      case 'rentabilidad_baja': return 'Rentabilidad Baja'
      default: return 'Alerta Desconocida'
    }
  }

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatearPrecio = (precio: number) => {
    return formatCurrency(precio, false)
  }

  const alertasFiltradas = datos?.alertas.filter(alerta => {
    if (filtros.severidad !== 'todas' && alerta.severidad !== filtros.severidad) {
      return false
    }
    if (filtros.tipo !== 'todos' && alerta.tipo !== filtros.tipo) {
      return false
    }
    if (filtros.fecha_desde && new Date(alerta.fecha) < new Date(filtros.fecha_desde)) {
      return false
    }
    if (filtros.fecha_hasta && new Date(alerta.fecha) > new Date(filtros.fecha_hasta)) {
      return false
    }
    return true
  }) || []

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando centro de alertas...</p>
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
          <Button onClick={cargarDatosAlertas} className="mt-2">
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
              ⚠️ Centro de Alertas
            </h1>
            <p className="text-gray-600">
              Productos y situaciones que requieren atención
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

      {/* Resumen de alertas */}
      {datos?.resumen && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Alertas</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{datos.resumen.total_alertas}</div>
              <p className="text-xs text-muted-foreground">
                Alertas activas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Alta Severidad</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{datos.resumen.alertas_alta}</div>
              <p className="text-xs text-muted-foreground">
                Requieren atención inmediata
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Media Severidad</CardTitle>
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{datos.resumen.alertas_media}</div>
              <p className="text-xs text-muted-foreground">
                Revisar pronto
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Productos Afectados</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{datos.resumen.productos_afectados}</div>
              <p className="text-xs text-muted-foreground">
                Productos con alertas
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Distribución por tipo */}
      {datos?.por_tipo && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Distribución por Tipo de Alerta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {Object.entries(datos.por_tipo).map(([tipo, cantidad]) => (
                <div key={tipo} className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    {getTipoIcon(tipo)}
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{cantidad}</div>
                  <div className="text-sm text-gray-600">{getTipoTitulo(tipo)}</div>
                </div>
              ))}
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
                Severidad
              </label>
              <select
                value={filtros.severidad}
                onChange={(e) => setFiltros({...filtros, severidad: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="todas">Todas las severidades</option>
                <option value="alta">Alta</option>
                <option value="media">Media</option>
                <option value="baja">Baja</option>
              </select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Tipo de Alerta
              </label>
              <select
                value={filtros.tipo}
                onChange={(e) => setFiltros({...filtros, tipo: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="todos">Todos los tipos</option>
                <option value="rentabilidad_negativa">Rentabilidad Negativa</option>
                <option value="precio_fuera_rango">Precio Fuera de Rango</option>
                <option value="sin_varta">Sin Equivalencia Varta</option>
                <option value="error_procesamiento">Error de Procesamiento</option>
                <option value="rentabilidad_baja">Rentabilidad Baja</option>
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

      {/* Lista de alertas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Alertas Filtradas ({alertasFiltradas.length})
          </CardTitle>
          <CardDescription>
            Lista detallada de alertas que requieren atención
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {alertasFiltradas.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  ¡No hay alertas!
                </h3>
                <p className="text-gray-600">
                  No se encontraron alertas con los filtros aplicados
                </p>
              </div>
            ) : (
              alertasFiltradas.map((alerta) => (
                <div key={alerta.id} className={`p-4 rounded-lg border-l-4 ${getSeveridadColor(alerta.severidad)}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getSeveridadIcon(alerta.severidad)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900">{alerta.titulo}</h3>
                          <Badge className={getSeveridadColor(alerta.severidad)}>
                            {alerta.severidad.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">
                            {getTipoTitulo(alerta.tipo)}
                          </Badge>
                        </div>
                        
                        <p className="text-gray-700 mb-3">{alerta.descripcion}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          {alerta.producto && (
                            <div>
                              <span className="font-medium">Producto:</span> {alerta.producto}
                            </div>
                          )}
                          {alerta.proveedor && (
                            <div>
                              <span className="font-medium">Proveedor:</span> {alerta.proveedor}
                            </div>
                          )}
                          <div>
                            <span className="font-medium">Fecha:</span> {formatearFecha(alerta.fecha)}
                          </div>
                          {alerta.valor_actual && (
                            <div>
                              <span className="font-medium">Valor Actual:</span> {formatearPrecio(alerta.valor_actual)}
                            </div>
                          )}
                          {alerta.valor_esperado && (
                            <div>
                              <span className="font-medium">Valor Esperado:</span> {formatearPrecio(alerta.valor_esperado)}
                            </div>
                          )}
                          {alerta.sesion_id && (
                            <div>
                              <span className="font-medium">Sesión:</span> #{alerta.sesion_id}
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-800">
                            <span className="font-medium">Acción sugerida:</span> {alerta.accion_sugerida}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
