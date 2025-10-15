'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { 
  TrendingUp, 
  BarChart3, 
  Package, 
  Calendar, 
  DollarSign, 
  AlertTriangle,
  Download,
  FileText,
  Users,
  Clock
} from 'lucide-react'

interface EstadisticasGenerales {
  total_sesiones: number
  total_productos: number
  rentabilidad_promedio: number
  proveedores_unicos: number
  sesiones_mes: number
  productos_rentables: number
}

export default function ReportesPage() {
  const [estadisticas, setEstadisticas] = useState<EstadisticasGenerales | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    cargarEstadisticasGenerales()
  }, [])

  const cargarEstadisticasGenerales = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/reportes/estadisticas-generales')
      const data = await response.json()
      
      if (data.success) {
        setEstadisticas(data.estadisticas)
      } else {
        setError(data.error || 'Error cargando estadísticas')
      }
    } catch (err) {
      setError('Error de conexión')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const reportes = [
    {
      id: 'rentabilidad',
      titulo: 'Análisis de Rentabilidad',
      descripcion: 'Análisis detallado de rentabilidad por producto, proveedor y canal',
      icono: TrendingUp,
      color: 'bg-green-500',
      ruta: '/reportes/rentabilidad',
      metricas: [
        'Rentabilidad promedio por canal',
        'Productos más/menos rentables',
        'Análisis por proveedor',
        'Tendencias temporales'
      ]
    },
    {
      id: 'comparativo',
      titulo: 'Comparativo de Sesiones',
      descripcion: 'Comparar sesiones entre fechas y analizar cambios',
      icono: BarChart3,
      color: 'bg-blue-500',
      ruta: '/reportes/comparativo',
      metricas: [
        'Comparación entre sesiones',
        'Análisis de cambios en precios',
        'Impacto de descuentos',
        'Evolución de márgenes'
      ]
    },
    {
      id: 'proveedor',
      titulo: 'Análisis por Proveedor',
      descripcion: 'Estadísticas detalladas por marca y proveedor',
      icono: Package,
      color: 'bg-purple-500',
      ruta: '/reportes/proveedor',
      metricas: [
        'Estadísticas por marca',
        'Productos más procesados',
        'Rentabilidad por proveedor',
        'Equivalencias Varta'
      ]
    },
    {
      id: 'temporal',
      titulo: 'Tendencias Temporales',
      descripcion: 'Análisis de actividad y tendencias en el tiempo',
      icono: Calendar,
      color: 'bg-orange-500',
      ruta: '/reportes/temporal',
      metricas: [
        'Actividad por día/semana/mes',
        'Volumen de procesamiento',
        'Tendencias estacionales',
        'Picos de actividad'
      ]
    },
    {
      id: 'financiero',
      titulo: 'Reporte Financiero',
      descripcion: 'Análisis económico e impacto financiero',
      icono: DollarSign,
      color: 'bg-emerald-500',
      ruta: '/reportes/financiero',
      metricas: [
        'Valor total procesado',
        'Impacto económico',
        'Ahorros por descuentos',
        'Proyecciones de ingresos'
      ]
    },
    {
      id: 'alertas',
      titulo: 'Centro de Alertas',
      descripcion: 'Productos y situaciones que requieren atención',
      icono: AlertTriangle,
      color: 'bg-red-500',
      ruta: '/reportes/alertas',
      metricas: [
        'Rentabilidad negativa',
        'Precios fuera de rango',
        'Sin equivalencia Varta',
        'Errores de procesamiento'
      ]
    }
  ]

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando reportes...</p>
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
          <Button onClick={cargarEstadisticasGenerales} className="mt-2">
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          📊 Centro de Reportes
        </h1>
        <p className="text-gray-600">
          Análisis detallados y reportes del sistema de pricing
        </p>
      </div>

      {/* Estadísticas generales */}
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sesiones</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estadisticas.total_sesiones}</div>
              <p className="text-xs text-muted-foreground">
                Sesiones procesadas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estadisticas.total_productos}</div>
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
                {estadisticas.rentabilidad_promedio.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Promedio general
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Proveedores</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estadisticas.proveedores_unicos}</div>
              <p className="text-xs text-muted-foreground">
                Marcas diferentes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Este Mes</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estadisticas.sesiones_mes}</div>
              <p className="text-xs text-muted-foreground">
                Sesiones del mes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rentables</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {estadisticas.productos_rentables}
              </div>
              <p className="text-xs text-muted-foreground">
                Productos rentables
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lista de reportes */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Reportes Disponibles
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reportes.map((reporte) => {
            const Icono = reporte.icono
            return (
              <Card key={reporte.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${reporte.color} text-white`}>
                      <Icono className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{reporte.titulo}</CardTitle>
                      <CardDescription className="mt-1">
                        {reporte.descripcion}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Incluye:
                      </h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {reporte.metricas.map((metrica, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                            {metrica}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="flex gap-2 pt-4 border-t">
                      <Button 
                        className="flex-1"
                        onClick={() => window.location.href = reporte.ruta}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Ver Reporte
                      </Button>
                      
                      <Button 
                        variant="outline"
                        onClick={() => window.location.href = `${reporte.ruta}?exportar=excel`}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Información adicional */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="p-1 bg-blue-100 rounded-full">
            <Clock className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-blue-800 font-medium">Información de Reportes</h3>
            <p className="text-blue-700 text-sm mt-1">
              Todos los reportes se generan en tiempo real desde la base de datos de Supabase. 
              Puedes exportar cualquier reporte a Excel con un solo click. 
              Los datos se actualizan automáticamente cada vez que procesas un archivo.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
