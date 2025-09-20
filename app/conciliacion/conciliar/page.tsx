'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  RefreshCw, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Building2,
  ArrowRight,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react'

interface PasoConciliacion {
  id: string
  banco: string
  estado: 'pendiente' | 'en_progreso' | 'completado' | 'error'
  transaccionesTotal: number
  transaccionesConciliadas: number
  transaccionesPendientes: number
  porcentaje: number
  tiempoEstimado: string
  detalles?: string
}

interface ConciliacionDetalle {
  id: string
  transaccion: string
  monto: number
  fecha: string
  banco: string
  estado: 'conciliada' | 'pendiente' | 'error'
  coincidencia?: string
}

export default function ConciliarPage() {
  const [pasos, setPasos] = useState<PasoConciliacion[]>([])
  const [pasoActual, setPasoActual] = useState(0)
  const [conciliando, setConciliando] = useState(false)
  const [detalles, setDetalles] = useState<ConciliacionDetalle[]>([])
  const [mostrarDetalles, setMostrarDetalles] = useState<string | null>(null)

  useEffect(() => {
    cargarPasosConciliacion()
  }, [])

  const cargarPasosConciliacion = () => {
    setPasos([
      {
        id: '1',
        banco: 'Santander',
        estado: 'completado',
        transaccionesTotal: 500,
        transaccionesConciliadas: 450,
        transaccionesPendientes: 50,
        porcentaje: 90,
        tiempoEstimado: '2 min',
        detalles: 'Conciliación completada exitosamente'
      },
      {
        id: '2',
        banco: 'Galicia',
        estado: 'completado',
        transaccionesTotal: 350,
        transaccionesConciliadas: 320,
        transaccionesPendientes: 30,
        porcentaje: 91,
        tiempoEstimado: '1.5 min',
        detalles: 'Conciliación completada exitosamente'
      },
      {
        id: '3',
        banco: 'BBVA',
        estado: 'en_progreso',
        transaccionesTotal: 360,
        transaccionesConciliadas: 120,
        transaccionesPendientes: 240,
        porcentaje: 33,
        tiempoEstimado: '5 min',
        detalles: 'Conciliación en progreso...'
      }
    ])
  }

  const iniciarConciliacion = async () => {
    setConciliando(true)
    
    // Simular proceso de conciliación
    for (let i = 0; i < pasos.length; i++) {
      if (pasos[i].estado === 'pendiente' || pasos[i].estado === 'en_progreso') {
        setPasoActual(i)
        
        // Actualizar estado a en_progreso
        setPasos(prev => prev.map((paso, index) => 
          index === i ? { ...paso, estado: 'en_progreso' } : paso
        ))

        // Simular progreso
        for (let progreso = 0; progreso <= 100; progreso += 10) {
          await new Promise(resolve => setTimeout(resolve, 200))
          
          setPasos(prev => prev.map((paso, index) => 
            index === i 
              ? { 
                  ...paso, 
                  porcentaje: progreso,
                  transaccionesConciliadas: Math.floor((progreso / 100) * paso.transaccionesTotal)
                }
              : paso
          ))
        }

        // Marcar como completado
        setPasos(prev => prev.map((paso, index) => 
          index === i 
            ? { 
                ...paso, 
                estado: 'completado',
                porcentaje: 100,
                transaccionesConciliadas: paso.transaccionesTotal,
                transaccionesPendientes: 0
              }
            : paso
        ))
      }
    }

    setConciliando(false)
  }

  const pausarConciliacion = () => {
    setConciliando(false)
  }

  const reiniciarConciliacion = () => {
    setPasos(prev => prev.map(paso => ({ ...paso, estado: 'pendiente', porcentaje: 0 })))
    setPasoActual(0)
    setConciliando(false)
  }

  const verDetalles = async (pasoId: string) => {
    // Simular carga de detalles
    setDetalles([
      {
        id: '1',
        transaccion: 'TXN-001234',
        monto: 15000,
        fecha: '2024-01-15',
        banco: 'Santander',
        estado: 'conciliada',
        coincidencia: 'MOV-789012'
      },
      {
        id: '2',
        transaccion: 'TXN-001235',
        monto: 25000,
        fecha: '2024-01-15',
        banco: 'Santander',
        estado: 'conciliada',
        coincidencia: 'MOV-789013'
      },
      {
        id: '3',
        transaccion: 'TXN-001236',
        monto: 18000,
        fecha: '2024-01-15',
        banco: 'Santander',
        estado: 'pendiente'
      }
    ])
    setMostrarDetalles(pasoId)
  }

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'completado':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'en_progreso':
        return <Clock className="h-5 w-5 text-yellow-500" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />
    }
  }

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'completado':
        return 'bg-green-100 text-green-800'
      case 'en_progreso':
        return 'bg-yellow-100 text-yellow-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getEstadoTexto = (estado: string) => {
    switch (estado) {
      case 'completado':
        return 'Completado'
      case 'en_progreso':
        return 'En Progreso'
      case 'error':
        return 'Error'
      default:
        return 'Pendiente'
    }
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🔄 Conciliación Secuencial
        </h1>
        <p className="text-gray-600">
          Proceso de conciliación paso a paso con múltiples bancos
        </p>
      </div>

      {/* Controles */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                onClick={iniciarConciliacion}
                disabled={conciliando}
                className="flex items-center"
              >
                <Play className="h-4 w-4 mr-2" />
                {conciliando ? 'Conciliando...' : 'Iniciar Conciliación'}
              </Button>
              
              {conciliando && (
                <Button 
                  onClick={pausarConciliacion}
                  variant="outline"
                  className="flex items-center"
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Pausar
                </Button>
              )}
              
              <Button 
                onClick={reiniciarConciliacion}
                variant="outline"
                className="flex items-center"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reiniciar
              </Button>
            </div>
            
            <div className="text-sm text-gray-600">
              Progreso General: {pasos.filter(p => p.estado === 'completado').length}/{pasos.length} bancos
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pasos de Conciliación */}
      <div className="space-y-6">
        {pasos.map((paso, index) => (
          <Card key={paso.id} className={`${index === pasoActual ? 'ring-2 ring-blue-500' : ''}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Building2 className="h-5 w-5 mr-2" />
                  Paso {index + 1}: {paso.banco}
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge className={getEstadoColor(paso.estado)}>
                    {getEstadoIcon(paso.estado)}
                    <span className="ml-1">{getEstadoTexto(paso.estado)}</span>
                  </Badge>
                  {index < pasos.length - 1 && (
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Progreso */}
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Progreso: {paso.porcentaje}%</span>
                    <span>Tiempo estimado: {paso.tiempoEstimado}</span>
                  </div>
                  <Progress value={paso.porcentaje} className="w-full" />
                </div>

                {/* Estadísticas */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{paso.transaccionesTotal}</div>
                    <div className="text-sm text-gray-600">Total</div>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{paso.transaccionesConciliadas}</div>
                    <div className="text-sm text-gray-600">Conciliadas</div>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{paso.transaccionesPendientes}</div>
                    <div className="text-sm text-gray-600">Pendientes</div>
                  </div>
                </div>

                {/* Detalles */}
                {paso.detalles && (
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {paso.detalles}
                  </div>
                )}

                {/* Botón de detalles */}
                <div className="flex justify-end">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => verDetalles(paso.id)}
                  >
                    Ver Detalles
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal de Detalles */}
      {mostrarDetalles && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-4xl max-h-[80vh] overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Detalles de Conciliación</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setMostrarDetalles(null)}
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="overflow-y-auto">
              <div className="space-y-2">
                {detalles.map((detalle) => (
                  <div key={detalle.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div>
                        <div className="font-semibold">{detalle.transaccion}</div>
                        <div className="text-sm text-gray-600">{detalle.fecha}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">${detalle.monto.toLocaleString()}</div>
                        <div className="text-sm text-gray-600">{detalle.banco}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={detalle.estado === 'conciliada' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                        {detalle.estado === 'conciliada' ? 'Conciliada' : 'Pendiente'}
                      </Badge>
                      {detalle.coincidencia && (
                        <span className="text-sm text-gray-600">
                          → {detalle.coincidencia}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
