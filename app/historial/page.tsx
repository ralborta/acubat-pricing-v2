'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { CalendarDays, FileText, TrendingUp, Package, Download, Eye } from 'lucide-react'

interface SesionPricing {
  id: number
  nombre_sesion: string
  archivo_original: string
  fecha_procesamiento: string
  usuario_id: string
  configuracion_usada: any
  estadisticas: {
    total_productos: number
    productos_rentables: number
    con_equivalencia_varta: number
    margen_promedio: string
  }
  estado: string
}

export default function HistorialPage() {
  const [sesiones, setSesiones] = useState<SesionPricing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    cargarSesiones()
  }, [])

  const cargarSesiones = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/historial/sesiones?limit=20')
      const data = await response.json()
      
      if (data.success) {
        setSesiones(data.sesiones)
      } else {
        setError(data.error || 'Error cargando sesiones')
      }
    } catch (err) {
      setError('Error de conexión')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleString('es-AR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const calcularRentabilidadPromedio = (estadisticas: any) => {
    if (estadisticas.total_productos === 0) return 0
    return ((estadisticas.productos_rentables / estadisticas.total_productos) * 100).toFixed(1)
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando historial de sesiones...</p>
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
          <Button onClick={cargarSesiones} className="mt-2">
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          📊 Historial de Procesos de Pricing
        </h1>
        <p className="text-gray-600">
          Visualiza y gestiona todas las sesiones de pricing procesadas
        </p>
      </div>

      {/* Estadísticas generales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sesiones</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sesiones.length}</div>
            <p className="text-xs text-muted-foreground">
              Procesos completados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productos Totales</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sesiones.reduce((acc, s) => acc + s.estadisticas.total_productos, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              En todas las sesiones
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rentabilidad Promedio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sesiones.length > 0 
                ? (sesiones.reduce((acc, s) => {
                    const rentabilidad = calcularRentabilidadPromedio(s.estadisticas)
                    return acc + (typeof rentabilidad === 'string' ? parseFloat(rentabilidad) : rentabilidad)
                  }, 0) / sesiones.length).toFixed(1)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Productos rentables
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Con Varta</CardTitle>
            <Badge variant="secondary">Varta</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {sesiones.reduce((acc, s) => acc + s.estadisticas.con_equivalencia_varta, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Equivalencias encontradas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de sesiones */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Sesiones Recientes
        </h2>
        
        {sesiones.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No hay sesiones de pricing
              </h3>
              <p className="text-gray-600 mb-4">
                Procesa tu primer archivo para ver el historial aquí
              </p>
              <Button onClick={() => window.location.href = '/carga'}>
                Procesar Archivo
              </Button>
            </CardContent>
          </Card>
        ) : (
          sesiones.map((sesion) => (
            <Card key={sesion.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{sesion.nombre_sesion}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <CalendarDays className="h-4 w-4" />
                      {formatearFecha(sesion.fecha_procesamiento)}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={sesion.estado === 'completado' ? 'default' : 'secondary'}>
                      {sesion.estado}
                    </Badge>
                    <Badge variant="outline">
                      ID: {sesion.id}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {sesion.estadisticas.total_productos}
                    </div>
                    <div className="text-sm text-gray-600">Productos</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {sesion.estadisticas.productos_rentables}
                    </div>
                    <div className="text-sm text-gray-600">Rentables</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {sesion.estadisticas.con_equivalencia_varta}
                    </div>
                    <div className="text-sm text-gray-600">Con Varta</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {calcularRentabilidadPromedio(sesion.estadisticas)}%
                    </div>
                    <div className="text-sm text-gray-600">Rentabilidad</div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    <strong>Archivo:</strong> {sesion.archivo_original}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.location.href = `/historial/${sesion.id}`}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver Detalles
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.location.href = `/historial/exportar/${sesion.id}`}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Exportar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
