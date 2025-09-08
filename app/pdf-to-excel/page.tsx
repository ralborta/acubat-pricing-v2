'use client'

import { useState, useRef } from 'react'
import { FileText, Upload, Download, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'

interface Estadisticas {
  lineasTexto: number
  filasTablas: number
  campos: string[]
  tienePrecios: number
  tieneStock: number
}

interface ResultadoConversion {
  success: boolean
  excel?: string
  estadisticas?: Estadisticas
  mensaje?: string
  nombreArchivo?: string
  error?: string
  detalle?: string
}

export default function PDFToExcelPage() {
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null)
  const [convirtiendo, setConvirtiendo] = useState(false)
  const [progreso, setProgreso] = useState(0)
  const [mensajeProgreso, setMensajeProgreso] = useState('')
  const [resultado, setResultado] = useState<ResultadoConversion | null>(null)
  const [error, setError] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Función para validar archivo PDF
  const validarArchivoPDF = (archivo: File): { valido: boolean; error?: string } => {
    if (!archivo) {
      return { valido: false, error: 'No se seleccionó ningún archivo' }
    }
    
    if (!archivo.type.includes('pdf') && !archivo.name.toLowerCase().endsWith('.pdf')) {
      return { valido: false, error: 'El archivo debe ser un PDF' }
    }
    
    if (archivo.size > 50 * 1024 * 1024) { // 50MB máximo
      return { valido: false, error: 'El archivo es demasiado grande (máximo 50MB)' }
    }
    
    return { valido: true }
  }

  // Función para manejar selección de archivo
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = event.target.files?.[0]
    if (archivo) {
      const validacion = validarArchivoPDF(archivo)
      if (validacion.valido) {
        setArchivoSeleccionado(archivo)
        setError('')
        setResultado(null)
      } else {
        setError(validacion.error || 'Error en el archivo')
        setArchivoSeleccionado(null)
      }
    }
  }

  // Función para convertir PDF a Excel (REAL)
  const convertirPDFaExcel = async () => {
    if (!archivoSeleccionado) {
      setError('Por favor selecciona un archivo PDF')
      return
    }

    setConvirtiendo(true)
    setProgreso(0)
    setError('')
    setResultado(null)

    try {
      // Crear FormData
      const formData = new FormData()
      formData.append('file', archivoSeleccionado)

      // Actualizar progreso
      setProgreso(20)
      setMensajeProgreso('Enviando archivo al servidor...')

      // Llamar a la API
      const response = await fetch('/api/pdf-to-excel', {
        method: 'POST',
        body: formData
      })

      setProgreso(50)
      setMensajeProgreso('Procesando PDF y extrayendo datos...')

      const resultado: ResultadoConversion = await response.json()

      setProgreso(80)
      setMensajeProgreso('Generando archivo Excel...')

      if (resultado.success && resultado.excel) {
        // Descargar archivo Excel
        const descargaExitosa = descargarArchivo(
          resultado.excel,
          resultado.nombreArchivo || 'conversion.xlsx',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )

        if (descargaExitosa) {
          setProgreso(100)
          setMensajeProgreso('¡Conversión completada exitosamente!')
          setResultado(resultado)
          console.log('✅ Conversión exitosa:', resultado.estadisticas)
        } else {
          throw new Error('Error al descargar el archivo')
        }
      } else {
        throw new Error(resultado.error || 'Error desconocido en la conversión')
      }

    } catch (error) {
      console.error('❌ Error en conversión:', error)
      setError(error instanceof Error ? error.message : 'Error en la conversión')
      setProgreso(0)
      setMensajeProgreso('')
    } finally {
      setConvirtiendo(false)
    }
  }

  // Función para descargar archivo
  const descargarArchivo = (base64: string, filename: string, mimeType: string): boolean => {
    try {
      // Convertir base64 a blob
      const byteCharacters = atob(base64)
      const byteNumbers = new Array(byteCharacters.length)
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
      }
      const byteArray = new Uint8Array(byteNumbers)
      const blob = new Blob([byteArray], { type: mimeType })

      // Crear URL y descargar
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      console.log(`✅ Archivo descargado: ${filename}`)
      return true

    } catch (error) {
      console.error('❌ Error descargando archivo:', error)
      return false
    }
  }

  // Función para resetear
  const resetear = () => {
    setArchivoSeleccionado(null)
    setConvirtiendo(false)
    setProgreso(0)
    setMensajeProgreso('')
    setResultado(null)
    setError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <FileText className="w-8 h-8 text-blue-600" />
                <h1 className="text-3xl font-bold text-gray-900">Convertir PDF a Excel</h1>
              </div>
              <p className="text-gray-600">
                Extrae tablas y datos de archivos PDF y conviértelos a Excel automáticamente
              </p>
            </div>

            {/* Card Principal */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              {/* Zona de Carga */}
              <div className="mb-8">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                  <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Selecciona tu archivo PDF
                  </h3>
                  
                  <p className="text-gray-600 mb-6">
                    Arrastra y suelta tu archivo PDF aquí o haz clic para seleccionar
                  </p>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="pdf-input"
                  />
                  
                  <label
                    htmlFor="pdf-input"
                    className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    Seleccionar PDF
                  </label>

                  <p className="text-sm text-gray-500 mt-4">
                    Máximo 50MB • Formatos: PDF
                  </p>
                </div>

                {/* Archivo Seleccionado */}
                {archivoSeleccionado && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div className="flex-1">
                        <p className="font-medium text-green-900">{archivoSeleccionado.name}</p>
                        <p className="text-sm text-green-700">
                          {(archivoSeleccionado.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        onClick={resetear}
                        className="text-green-600 hover:text-green-800"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Botón Convertir */}
              <div className="text-center mb-8">
                <button
                  onClick={convertirPDFaExcel}
                  disabled={!archivoSeleccionado || convirtiendo}
                  className={`
                    inline-flex items-center px-8 py-4 text-lg font-medium rounded-lg transition-all
                    ${archivoSeleccionado && !convirtiendo
                      ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }
                  `}
                >
                  {convirtiendo ? (
                    <>
                      <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                      Convirtiendo...
                    </>
                  ) : (
                    <>
                      <FileText className="w-6 h-6 mr-3" />
                      Convertir a Excel
                    </>
                  )}
                </button>
              </div>

              {/* Barra de Progreso */}
              {convirtiendo && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Progreso</span>
                    <span className="text-sm text-gray-500">{progreso}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${progreso}%` }}
                    ></div>
                  </div>
                  {mensajeProgreso && (
                    <p className="text-sm text-gray-600 mt-2 text-center">{mensajeProgreso}</p>
                  )}
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="font-medium text-red-900">Error en la conversión</p>
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Resultado */}
              {resultado && resultado.success && (
                <div className="space-y-6">
                  {/* Mensaje de Éxito */}
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-900">¡Conversión exitosa!</p>
                        <p className="text-sm text-green-700">{resultado.mensaje}</p>
                      </div>
                    </div>
                  </div>

                  {/* Estadísticas */}
                  {resultado.estadisticas && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {resultado.estadisticas.filasTablas}
                        </div>
                        <div className="text-sm text-blue-800">Filas extraídas</div>
                      </div>
                      
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {resultado.estadisticas.tienePrecios}
                        </div>
                        <div className="text-sm text-green-800">Con precios</div>
                      </div>
                      
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {resultado.estadisticas.tieneStock}
                        </div>
                        <div className="text-sm text-purple-800">Con stock</div>
                      </div>
                      
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">
                          {resultado.estadisticas.campos.length}
                        </div>
                        <div className="text-sm text-orange-800">Campos detectados</div>
                      </div>
                    </div>
                  )}

                  {/* Campos Detectados */}
                  {resultado.estadisticas?.campos && resultado.estadisticas.campos.length > 0 && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Campos detectados:</h4>
                      <div className="flex flex-wrap gap-2">
                        {resultado.estadisticas.campos.map((campo, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                          >
                            {campo}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Botón Descargar */}
                  <div className="text-center">
                    <button
                      onClick={() => {
                        if (resultado?.excel) {
                          descargarArchivo(
                            resultado.excel,
                            resultado.nombreArchivo || 'conversion.xlsx',
                            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                          )
                        }
                      }}
                      className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Descargar Excel
                    </button>
                  </div>
                </div>
              )}

              {/* Información Adicional */}
              <div className="mt-8 p-6 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-3">¿Cómo funciona?</h4>
                <ul className="text-sm text-blue-800 space-y-2">
                  <li>• <strong>Extracción de texto:</strong> Usa OCR avanzado para leer el contenido del PDF</li>
                  <li>• <strong>Detección de tablas:</strong> Identifica automáticamente tablas y estructuras de datos</li>
                  <li>• <strong>Parseo inteligente:</strong> Extrae códigos, descripciones, precios y stock</li>
                  <li>• <strong>Generación Excel:</strong> Crea un archivo Excel con los datos extraídos</li>
                </ul>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
