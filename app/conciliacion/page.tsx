'use client'

import { useState, useEffect } from 'react'
import { formatCurrency, formatNumber, formatPercentage } from '../../lib/formatters'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  FileUp, 
  RefreshCw, 
  BarChart3, 
  Settings,
  CheckCircle,
  Clock,
  AlertCircle,
  Building2
} from 'lucide-react'

interface ResumenConciliacion {
  totalTransacciones: number
  totalConciliadas: number
  totalPendientes: number
  totalBancos: number
}

interface EstadoBanco {
  id: string
  nombre: string
  conciliadas: number
  total: number
  porcentaje: number
  estado: 'completado' | 'en_progreso' | 'pendiente'
}

export default function ConciliacionPage() {
  const [resumen, setResumen] = useState<ResumenConciliacion>({
    totalTransacciones: 0,
    totalConciliadas: 0,
    totalPendientes: 0,
    totalBancos: 0
  })

  const [bancos, setBancos] = useState<EstadoBanco[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    cargarDatosConciliacion()
  }, [])

  const cargarDatosConciliacion = async () => {
    try {
      setCargando(true)
      // TODO: Implementar llamada a API
      // Simulación de datos
      setResumen({
        totalTransacciones: 1250,
        totalConciliadas: 890,
        totalPendientes: 360,
        totalBancos: 3
      })

      setBancos([
        {
          id: '1',
          nombre: 'Santander',
          conciliadas: 450,
          total: 500,
          porcentaje: 90,
          estado: 'completado'
        },
        {
          id: '2',
          nombre: 'Galicia',
          conciliadas: 320,
          total: 350,
          porcentaje: 91,
          estado: 'completado'
        },
        {
          id: '3',
          nombre: 'BBVA',
          conciliadas: 120,
          total: 360,
          porcentaje: 33,
          estado: 'en_progreso'
        }
      ])
    } catch (error) {
      console.error('Error cargando datos:', error)
    } finally {
      setCargando(false)
    }
  }

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'completado':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'en_progreso':
        return <Clock className="h-5 w-5 text-yellow-500" />
      case 'pendiente':
        return <AlertCircle className="h-5 w-5 text-gray-400" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />
    }
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'completado':
        return 'text-green-600 bg-green-50'
      case 'en_progreso':
        return 'text-yellow-600 bg-yellow-50'
      case 'pendiente':
        return 'text-gray-600 bg-gray-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🏦 Conciliación Bancaria
        </h1>
        <p className="text-gray-600">
          Sistema de conciliación secuencial con múltiples bancos
        </p>
      </div>

      {/* Resumen General */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileUp className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Transacciones</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(resumen.totalTransacciones)}</p>
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
                <p className="text-sm font-medium text-gray-600">Conciliadas</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(resumen.totalConciliadas)}</p>
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
                <p className="text-2xl font-bold text-gray-900">{formatNumber(resumen.totalPendientes)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Building2 className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Bancos</p>
                <p className="text-2xl font-bold text-gray-900">{resumen.totalBancos}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estado de Conciliaciones */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <RefreshCw className="h-5 w-5 mr-2" />
            Estado de Conciliaciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {bancos.map((banco) => (
              <div key={banco.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  {getEstadoIcon(banco.estado)}
                  <div>
                    <h3 className="font-semibold text-gray-900">{banco.nombre}</h3>
                    <p className="text-sm text-gray-600">
                      {banco.conciliadas}/{banco.total} transacciones
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className={`text-sm font-medium px-2 py-1 rounded-full ${getEstadoColor(banco.estado)}`}>
                      {banco.porcentaje}%
                    </p>
                  </div>
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${banco.porcentaje}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabs de Funcionalidad */}
      <Tabs defaultValue="cargar" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="cargar" className="flex items-center">
            <FileUp className="h-4 w-4 mr-2" />
            Cargar Archivos
          </TabsTrigger>
          <TabsTrigger value="conciliar" className="flex items-center">
            <RefreshCw className="h-4 w-4 mr-2" />
            Conciliar
          </TabsTrigger>
          <TabsTrigger value="reportes" className="flex items-center">
            <BarChart3 className="h-4 w-4 mr-2" />
            Reportes
          </TabsTrigger>
          <TabsTrigger value="config" className="flex items-center">
            <Settings className="h-4 w-4 mr-2" />
            Configuración
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cargar" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Cargar Archivos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Sube los archivos de transacciones y movimientos bancarios para comenzar la conciliación.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <FileUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Transacciones</h3>
                  <p className="text-gray-600 mb-4">Archivo de ventas y compras</p>
                  <Button>Seleccionar Archivo</Button>
                </div>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Movimientos Bancarios</h3>
                  <p className="text-gray-600 mb-4">Archivo de movimientos del banco</p>
                  <Button>Seleccionar Archivo</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conciliar" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Proceso de Conciliación</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-6">
                Inicia el proceso de conciliación secuencial con los bancos configurados.
              </p>
              <Button size="lg" className="w-full">
                <RefreshCw className="h-5 w-5 mr-2" />
                Iniciar Conciliación
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reportes" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Reportes de Conciliación</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-6">
                Genera reportes detallados de las conciliaciones realizadas.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="h-20 flex flex-col">
                  <BarChart3 className="h-6 w-6 mb-2" />
                  Por Banco
                </Button>
                <Button variant="outline" className="h-20 flex flex-col">
                  <Clock className="h-6 w-6 mb-2" />
                  Por Período
                </Button>
                <Button variant="outline" className="h-20 flex flex-col">
                  <FileUp className="h-6 w-6 mb-2" />
                  Detallado
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Bancos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-6">
                Configura los bancos y parámetros de conciliación.
              </p>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Configurar Bancos
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
