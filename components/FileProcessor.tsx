'use client'

import { useState, forwardRef, useImperativeHandle } from 'react'
import { FileText, BarChart3, TrendingUp, Download, Eye, Trash2, CheckCircle, AlertCircle, DollarSign } from 'lucide-react'
import PricingAnalysis from './PricingAnalysis'

interface ProcessedFile {
  id: string
  name: string
  type: string
  size: number
  status: 'processing' | 'completed' | 'error'
  progress: number
  results?: {
    totalRows: number
    validRows: number
    errors: number
    summary: string
    // Datos reales del backend
    backendData?: any
    productos?: any[]
    estadisticas?: any
  }
  processedAt?: Date
}

export interface FileProcessorRef {
  processFile: (file: File) => Promise<void>
}

const FileProcessor = forwardRef<FileProcessorRef>((props, ref) => {
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([])
  const [selectedFile, setSelectedFile] = useState<ProcessedFile | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [showPricingAnalysis, setShowPricingAnalysis] = useState(false)
  const [currentFileName, setCurrentFileName] = useState('')

  // Exponer la función processFile al componente padre
  useImperativeHandle(ref, () => ({
    processFile: async (file: File) => {
      try {
        console.log('🚀 Iniciando procesamiento de archivo:', file.name)
        
        const newFile: ProcessedFile = {
          id: Date.now().toString(),
          name: file.name,
          type: file.type || 'unknown',
          size: file.size,
          status: 'processing',
          progress: 0
        }

        setProcessedFiles(prev => [...prev, newFile])

        // Crear FormData para enviar al backend
        const formData = new FormData()
        formData.append('file', file)  // Corregido: debe ser 'file', no 'archivo'
        
        console.log('📁 Archivo a enviar:', {
          nombre: file.name,
          tamaño: file.size,
          tipo: file.type,
          formDataEntries: Array.from(formData.entries())
        })
        
        console.log('🚀 Enviando archivo al backend...', file.name)
        
        // Enviar archivo al backend para procesamiento REAL
        const response = await fetch('/api/pricing/procesar-archivo', {
          method: 'POST',
          body: formData,
        })
        
        console.log('📡 Respuesta del backend:', response.status, response.statusText)
        
        if (!response.ok) {
          const errorText = await response.text()
          console.error('❌ Error del servidor:', errorText)
          throw new Error(`Error del servidor: ${response.status} - ${errorText}`)
        }
        
        const data = await response.json()
        console.log('✅ Datos recibidos del backend:', data)
        
        // Guardar resultados REALES del backend
        const results = {
          totalRows: data.estadisticas?.total_productos || 0,
          validRows: data.estadisticas?.productos_rentables || 0,
          errors: data.estadisticas?.productos_no_rentables || 0,
          summary: `Archivo procesado exitosamente. ${data.estadisticas?.total_productos || 0} productos analizados.`,
          // Datos adicionales del backend
          backendData: data,
          productos: data.productos || [],
          estadisticas: data.estadisticas || {}
        }
        
        setProcessedFiles(prev => prev.map(f => 
          f.id === newFile.id ? { 
            ...f, 
            status: 'completed', 
            progress: 100, 
            results,
            processedAt: new Date()
          } : f
        ))
        
      } catch (error) {
        console.error('❌ Error procesando archivo:', error)
        
        // Marcar como error - buscar el archivo por nombre ya que newFile puede no estar definido
        setProcessedFiles(prev => prev.map(f => 
          f.name === file.name ? { ...f, status: 'error', progress: 0, results: undefined, processedAt: new Date() } : f
        ))
      }
    }
  }))

  const generateSummary = (fileName: string) => {
    const summaries = [
      `Análisis completado para ${fileName}. Se encontraron patrones de pricing interesantes.`,
      `Procesamiento exitoso de ${fileName}. Los datos muestran tendencias de mercado claras.`,
      `${fileName} analizado correctamente. Se identificaron oportunidades de optimización.`,
      `Archivo ${fileName} procesado. Los resultados indican estabilidad en los precios.`
    ]
    return summaries[Math.floor(Math.random() * summaries.length)]
  }

  const deleteFile = (id: string) => {
    setProcessedFiles(prev => prev.filter(f => f.id !== id))
    if (selectedFile?.id === id) {
      setSelectedFile(null)
      setShowResults(false)
    }
  }

  const viewResults = (file: ProcessedFile) => {
    setSelectedFile(file)
    setShowResults(true)
  }

  const downloadResults = (file: ProcessedFile) => {
    // Simular descarga
    const element = document.createElement('a')
    const content = `Resultados de ${file.name}\n\n${file.results?.summary}\n\nTotal filas: ${file.results?.totalRows}\nVálidas: ${file.results?.validRows}\nErrores: ${file.results?.errors}`
    const blob = new Blob([content], { type: 'text/plain' })
    element.href = URL.createObjectURL(blob)
    element.download = `resultados_${file.name}.txt`
    element.click()
  }

  return (
    <div className="space-y-6">
      {/* Archivos Procesados */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Archivos Procesados</h3>
        </div>
        
        {processedFiles.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p>No hay archivos procesados aún</p>
            <p className="text-sm">Los archivos que subas aparecerán aquí después del procesamiento</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {processedFiles.map((file) => (
              <div key={file.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <FileText className="h-8 w-8 text-blue-500" />
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{file.name}</h4>
                      <p className="text-sm text-gray-500">
                        {file.type} • {(file.size / 1024).toFixed(1)} KB
                      </p>
                      {file.processedAt && (
                        <p className="text-xs text-gray-400">
                          Procesado: {file.processedAt.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {/* Estado */}
                    <div className="flex items-center">
                      {file.status === 'processing' && (
                        <div className="flex items-center text-blue-600">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                          <span className="text-sm">Procesando...</span>
                        </div>
                      )}
                      {file.status === 'completed' && (
                        <div className="flex items-center text-green-600">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          <span className="text-sm">Completado</span>
                        </div>
                      )}
                      {file.status === 'error' && (
                        <div className="flex items-center text-red-600">
                          <AlertCircle className="h-4 w-4 mr-2" />
                          <span className="text-sm">Error</span>
                        </div>
                      )}
                    </div>

                    {/* Barra de progreso mejorada */}
                    {file.status === 'processing' && (
                      <div className="w-32">
                        <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out shadow-lg"
                            style={{ width: `${file.progress}%` }}
                          >
                            <div className="w-full h-full bg-gradient-to-r from-blue-400 to-purple-500 rounded-full animate-pulse"></div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs font-medium text-blue-600">{file.progress}%</span>
                          <span className="text-xs text-gray-500">Procesando...</span>
                        </div>
                      </div>
                    )}

                    {/* Acciones */}
                    {file.status === 'completed' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => viewResults(file)}
                          className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Ver
                        </button>
                        <button
                          onClick={() => {
                            setCurrentFileName(file.name)
                            setShowPricingAnalysis(true)
                          }}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-purple-600 hover:bg-purple-700"
                        >
                          <DollarSign className="h-3 w-3 mr-1" />
                          Análisis de Precios
                        </button>
                        <button
                          onClick={() => downloadResults(file)}
                          className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Descargar
                        </button>
                      </div>
                    )}

                    <button
                      onClick={() => deleteFile(file.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resultados Detallados */}
      {showResults && selectedFile && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Resultados: {selectedFile.name}
            </h3>
            <button
              onClick={() => setShowResults(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          <div className="p-6">
            {selectedFile.results && (
              <div className="space-y-6">
                {/* Resumen */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Resumen del Análisis</h4>
                  <p className="text-blue-800">{selectedFile.results.summary}</p>
                </div>

                {/* Estadísticas */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-gray-900">{selectedFile.results.totalRows}</div>
                    <div className="text-sm text-gray-600">Total de Filas</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-900">{selectedFile.results.validRows}</div>
                    <div className="text-sm text-green-600">Filas Válidas</div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-red-900">{selectedFile.results.errors}</div>
                    <div className="text-sm text-red-600">Errores</div>
                  </div>
                </div>

                {/* Gráfico de ejemplo */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-4">Distribución de Datos</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Datos válidos</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${(selectedFile.results.validRows / selectedFile.results.totalRows) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {((selectedFile.results.validRows / selectedFile.results.totalRows) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Errores</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-red-500 h-2 rounded-full"
                            style={{ width: `${(selectedFile.results.errors / selectedFile.results.totalRows) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {((selectedFile.results.errors / selectedFile.results.totalRows) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => downloadResults(selectedFile)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Descargar Resultados
                  </button>
                  <button
                    onClick={() => setShowResults(false)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Análisis de Precios */}
      <PricingAnalysis
        isVisible={showPricingAnalysis}
        onClose={() => setShowPricingAnalysis(false)}
        fileName={currentFileName}
        productos={processedFiles.find(f => f.name === currentFileName)?.results?.productos}
      />
    </div>
  )
})

FileProcessor.displayName = 'FileProcessor'

export default FileProcessor
