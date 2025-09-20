'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
// import { DatePickerWithRange } from '@/components/ui/date-picker'
import { 
  BarChart3, 
  Download, 
  FileText, 
  Calendar,
  Building2,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react'

interface ReporteGenerado {
  id: string
  nombre: string
  tipo: 'banco' | 'periodo' | 'detallado'
  fecha: string
  tamaño: string
  descargas: number
}

interface EstadisticaBanco {
  banco: string
  totalTransacciones: number
  conciliadas: number
  pendientes: number
  porcentaje: number
  montoTotal: number
  montoConciliado: number
}

export default function ReportesPage() {
  const [reportes, setReportes] = useState<ReporteGenerado[]>([])
  const [estadisticas, setEstadisticas] = useState<EstadisticaBanco[]>([])
  const [filtroBanco, setFiltroBanco] = useState<string>('todos')
  const [filtroPeriodo, setFiltroPeriodo] = useState<string>('mes')
  const [generando, setGenerando] = useState(false)

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = () => {
    // Simular datos de reportes
    setReportes([
      {
        id: '1',
        nombre: 'Conciliación Enero 2024 - Santander',
        tipo: 'banco',
        fecha: '2024-01-15',
        tamaño: '2.3 MB',
        descargas: 5
      },
      {
        id: '2',
        nombre: 'Resumen Mensual Enero 2024',
        tipo: 'periodo',
        fecha: '2024-01-31',
        tamaño: '1.8 MB',
        descargas: 12
      },
      {
        id: '3',
        nombre: 'Detalle Completo Enero 2024',
        tipo: 'detallado',
        fecha: '2024-01-31',
        tamaño: '5.2 MB',
        descargas: 3
      }
    ])

    // Simular estadísticas
    setEstadisticas([
      {
        banco: 'Santander',
        totalTransacciones: 500,
        conciliadas: 450,
        pendientes: 50,
        porcentaje: 90,
        montoTotal: 12500000,
        montoConciliado: 11250000
      },
      {
        banco: 'Galicia',
        totalTransacciones: 350,
        conciliadas: 320,
        pendientes: 30,
        porcentaje: 91,
        montoTotal: 8750000,
        montoConciliado: 8000000
      },
      {
        banco: 'BBVA',
        totalTransacciones: 360,
        conciliadas: 120,
        pendientes: 240,
        porcentaje: 33,
        montoTotal: 9000000,
        montoConciliado: 3000000
      }
    ])
  }

  const generarReporte = async (tipo: string) => {
    setGenerando(true)
    
    // Simular generación de reporte
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const nuevoReporte: ReporteGenerado = {
      id: Date.now().toString(),
      nombre: `Reporte ${tipo} - ${new Date().toLocaleDateString()}`,
      tipo: tipo as any,
      fecha: new Date().toLocaleDateString(),
      tamaño: `${(Math.random() * 5 + 1).toFixed(1)} MB`,
      descargas: 0
    }
    
    setReportes(prev => [nuevoReporte, ...prev])
    setGenerando(false)
  }

  const descargarReporte = (reporteId: string) => {
    // Simular descarga
    setReportes(prev => prev.map(r => 
      r.id === reporteId 
        ? { ...r, descargas: r.descargas + 1 }
        : r
    ))
  }

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'banco':
        return <Building2 className="h-5 w-5 text-blue-600" />
      case 'periodo':
        return <Calendar className="h-5 w-5 text-green-600" />
      case 'detallado':
        return <FileText className="h-5 w-5 text-purple-600" />
      default:
        return <FileText className="h-5 w-5" />
    }
  }

  const getTipoTexto = (tipo: string) => {
    switch (tipo) {
      case 'banco':
        return 'Por Banco'
      case 'periodo':
        return 'Por Período'
      case 'detallado':
        return 'Detallado'
      default:
        return tipo
    }
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          📊 Reportes de Conciliación
        </h1>
        <p className="text-gray-600">
          Genera y descarga reportes detallados de las conciliaciones
        </p>
      </div>

      {/* Estadísticas Generales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Reportes</p>
                <p className="text-2xl font-bold text-gray-900">{reportes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Conciliaciones</p>
                <p className="text-2xl font-bold text-gray-900">
                  {estadisticas.reduce((sum, stat) => sum + stat.conciliadas, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {estadisticas.reduce((sum, stat) => sum + stat.pendientes, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Monto Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${estadisticas.reduce((sum, stat) => sum + stat.montoTotal, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generar Reportes */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Generar Nuevo Reporte</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Reporte por Banco */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Building2 className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Por Banco</h3>
              <p className="text-gray-600 mb-4">
                Reporte detallado de conciliaciones por banco
              </p>
              <div className="space-y-2 mb-4">
                <Select value={filtroBanco} onValueChange={setFiltroBanco}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar banco" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los bancos</SelectItem>
                    <SelectItem value="santander">Santander</SelectItem>
                    <SelectItem value="galicia">Galicia</SelectItem>
                    <SelectItem value="bbva">BBVA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={() => generarReporte('banco')}
                disabled={generando}
                className="w-full"
              >
                {generando ? 'Generando...' : 'Generar Reporte'}
              </Button>
            </div>

            {/* Reporte por Período */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Calendar className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Por Período</h3>
              <p className="text-gray-600 mb-4">
                Reporte de conciliaciones por período de tiempo
              </p>
              <div className="space-y-2 mb-4">
                <Select value={filtroPeriodo} onValueChange={setFiltroPeriodo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mes">Último mes</SelectItem>
                    <SelectItem value="trimestre">Último trimestre</SelectItem>
                    <SelectItem value="año">Último año</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={() => generarReporte('periodo')}
                disabled={generando}
                variant="outline"
                className="w-full"
              >
                {generando ? 'Generando...' : 'Generar Reporte'}
              </Button>
            </div>

            {/* Reporte Detallado */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <FileText className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Detallado</h3>
              <p className="text-gray-600 mb-4">
                Reporte completo con todas las transacciones
              </p>
              <div className="space-y-2 mb-4">
                <div className="text-sm text-gray-500">
                  Incluye todas las transacciones y movimientos
                </div>
              </div>
              <Button 
                onClick={() => generarReporte('detallado')}
                disabled={generando}
                variant="outline"
                className="w-full"
              >
                {generando ? 'Generando...' : 'Generar Reporte'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas por Banco */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Estadísticas por Banco</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {estadisticas.map((stat) => (
              <div key={stat.banco} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <Building2 className="h-5 w-5 text-gray-400" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{stat.banco}</h3>
                    <p className="text-sm text-gray-600">
                      {stat.conciliadas}/{stat.totalTransacciones} transacciones
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-600">Progreso</p>
                    <p className="text-lg font-bold text-gray-900">{stat.porcentaje}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-600">Monto</p>
                    <p className="text-lg font-bold text-gray-900">
                      ${stat.montoConciliado.toLocaleString()}
                    </p>
                  </div>
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${stat.porcentaje}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Reportes Generados */}
      <Card>
        <CardHeader>
          <CardTitle>Reportes Generados</CardTitle>
        </CardHeader>
        <CardContent>
          {reportes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No hay reportes generados</p>
              <p className="text-sm">Genera tu primer reporte para comenzar</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reportes.map((reporte) => (
                <div key={reporte.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    {getTipoIcon(reporte.tipo)}
                    <div>
                      <h3 className="font-semibold text-gray-900">{reporte.nombre}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>{getTipoTexto(reporte.tipo)}</span>
                        <span>•</span>
                        <span>{reporte.fecha}</span>
                        <span>•</span>
                        <span>{reporte.tamaño}</span>
                        <span>•</span>
                        <span>{reporte.descargas} descargas</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => descargarReporte(reporte.id)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Descargar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
