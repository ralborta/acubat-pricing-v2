'use client'

import { useState, useRef } from 'react'
import { formatCurrency, formatNumber, formatPercentage } from '../../../lib/formatters'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  FileUp, 
  Building2, 
  CheckCircle, 
  AlertCircle,
  X,
  Download,
  Trash2
} from 'lucide-react'

interface ArchivoCargado {
  id: string
  nombre: string
  tipo: 'transacciones' | 'bancario'
  tamaño: number
  fecha: string
  estado: 'cargando' | 'completado' | 'error'
  registros?: number
}

export default function CargarArchivosPage() {
  const [archivos, setArchivos] = useState<ArchivoCargado[]>([])
  const [cargando, setCargando] = useState(false)
  const [progreso, setProgreso] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, tipo: 'transacciones' | 'bancario') => {
    const file = event.target.files?.[0]
    if (!file) return

    const nuevoArchivo: ArchivoCargado = {
      id: Date.now().toString(),
      nombre: file.name,
      tipo,
      tamaño: file.size,
      fecha: new Date().toLocaleString('es-AR'),
      estado: 'cargando'
    }

    setArchivos(prev => [...prev, nuevoArchivo])
    setCargando(true)
    setProgreso(0)

    try {
      // Simular carga progresiva
      for (let i = 0; i <= 100; i += 10) {
        setProgreso(i)
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // Simular procesamiento
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Actualizar estado del archivo
      setArchivos(prev => prev.map(archivo => 
        archivo.id === nuevoArchivo.id 
          ? { 
              ...archivo, 
              estado: 'completado', 
              registros: Math.floor(Math.random() * 1000) + 100 
            }
          : archivo
      ))

    } catch (error) {
      setArchivos(prev => prev.map(archivo => 
        archivo.id === nuevoArchivo.id 
          ? { ...archivo, estado: 'error' }
          : archivo
      ))
    } finally {
      setCargando(false)
      setProgreso(0)
    }
  }

  const eliminarArchivo = (id: string) => {
    setArchivos(prev => prev.filter(archivo => archivo.id !== id))
  }

  const getTipoIcon = (tipo: string) => {
    return tipo === 'transacciones' ? <FileUp className="h-5 w-5" /> : <Building2 className="h-5 w-5" />
  }

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'completado':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      case 'cargando':
        return <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
      default:
        return null
    }
  }

  const formatearTamaño = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          📁 Cargar Archivos
        </h1>
        <p className="text-gray-600">
          Sube los archivos de transacciones y movimientos bancarios para comenzar la conciliación
        </p>
      </div>

      {/* Área de Carga */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Transacciones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileUp className="h-5 w-5 mr-2 text-blue-600" />
              Archivo de Transacciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
              <FileUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Ventas y Compras</h3>
              <p className="text-gray-600 mb-4">
                Archivo Excel con transacciones de ventas y compras
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Formatos soportados: .xlsx, .xls, .csv
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => handleFileUpload(e, 'transacciones')}
                className="hidden"
                id="transacciones-file"
              />
              <Button 
                onClick={() => fileInputRef.current?.click()}
                disabled={cargando}
                className="w-full"
              >
                {cargando ? 'Cargando...' : 'Seleccionar Archivo'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Movimientos Bancarios */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="h-5 w-5 mr-2 text-green-600" />
              Movimientos Bancarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-green-400 transition-colors">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Extracto Bancario</h3>
              <p className="text-gray-600 mb-4">
                Archivo con movimientos bancarios para conciliar
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Formatos soportados: .xlsx, .xls, .csv
              </p>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => handleFileUpload(e, 'bancario')}
                className="hidden"
                id="bancario-file"
              />
              <Button 
                onClick={() => document.getElementById('bancario-file')?.click()}
                disabled={cargando}
                variant="outline"
                className="w-full"
              >
                {cargando ? 'Cargando...' : 'Seleccionar Archivo'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progreso de Carga */}
      {cargando && (
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Procesando archivo...</span>
              <span className="text-sm text-gray-500">{progreso}%</span>
            </div>
            <Progress value={progreso} className="w-full" />
          </CardContent>
        </Card>
      )}

      {/* Archivos Cargados */}
      <Card>
        <CardHeader>
          <CardTitle>Archivos Cargados</CardTitle>
        </CardHeader>
        <CardContent>
          {archivos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileUp className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No hay archivos cargados</p>
              <p className="text-sm">Sube archivos para comenzar la conciliación</p>
            </div>
          ) : (
            <div className="space-y-4">
              {archivos.map((archivo) => (
                <div key={archivo.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    {getTipoIcon(archivo.tipo)}
                    <div>
                      <h3 className="font-semibold text-gray-900">{archivo.nombre}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>{formatearTamaño(archivo.tamaño)}</span>
                        <span>•</span>
                        <span>{archivo.fecha}</span>
                        {archivo.registros && (
                          <>
                            <span>•</span>
                            <span>{archivo.registros} registros</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getEstadoIcon(archivo.estado)}
                    {archivo.estado === 'completado' && (
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-1" />
                        Descargar
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => eliminarArchivo(archivo.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Acciones */}
      {archivos.length > 0 && (
        <div className="mt-8 flex justify-end space-x-4">
          <Button variant="outline">
            Limpiar Todo
          </Button>
          <Button>
            Continuar a Conciliación
          </Button>
        </div>
      )}
    </div>
  )
}
