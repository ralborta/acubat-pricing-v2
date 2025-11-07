'use client'

import { useState, useRef } from 'react'
import { ArrowUpTrayIcon, DocumentTextIcon, PlayIcon, CheckCircleIcon, ChevronDownIcon, ChevronUpIcon, TableCellsIcon, CurrencyDollarIcon, DocumentIcon } from '@heroicons/react/24/outline'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import ProcessVisualizer from '@/components/ProcessVisualizer'
import { exportarAExcel } from '../../lib/excel-export'
import { formatCurrency, formatNumber, formatPercentage } from '../../lib/formatters'
import * as XLSX from 'xlsx'
import { useConfiguracion } from '../hooks/useConfiguracion'

interface Producto {
  id: number
  producto: string
  tipo: string
  modelo: string
  descripcion?: string // Descripción del producto (FUNCIÓN/APLICACIÓN)
  proveedor?: string  // ✅ Proveedor detectado por IA
  precio_base_original?: number  // ✅ Precio base original (antes del descuento)
  precio_base_minorista: number  // ✅ Precio base para Minorista (con descuento)
  precio_base_mayorista: number  // ✅ Precio base para Mayorista (con descuento)
  descuento_proveedor?: number  // ✅ % Descuento de proveedor aplicado
  costo_estimado_minorista: number  // ✅ Costo estimado para Minorista
  costo_estimado_mayorista: number  // ✅ Costo estimado para Mayorista
  equivalencia_varta?: {
    encontrada: boolean
    codigo?: string
    precio_varta?: number
    descripcion?: string
    razon?: string
  }
  minorista: {
    precio_neto: number
    precio_final: number
    rentabilidad: string
    markup_aplicado: string  // ✅ Markup real usado
  }
  mayorista: {
    precio_neto: number
    precio_final: number
    rentabilidad: string
    markup_aplicado: string  // ✅ Markup real usado
  }
}

interface Resultado {
  success: boolean
  archivo: string
  timestamp: string
  fx_info?: {
    buy: number
    sell: number
    date: string
    source?: string
  } | null
  estadisticas: {
    total_productos: number
    productos_rentables: number
    margen_promedio: string
  }
  productos: Producto[]
}

// 🎯 Helper para mostrar labels de tipo sin hardcodear "Batería"
function getTipoLabel(tipo: string | null | undefined): string {
  if (!tipo) return '—';
  const s = String(tipo).toUpperCase().trim();
  const labels: Record<string, string> = {
    'BATERIA': 'Batería',
    'ADITIVOS': 'Aditivos',
    'ADITIVOS_NAFTA': 'Aditivos Nafta',
    'ADITIVOS_DIESEL': 'Aditivos Diesel',
    'HERRAMIENTAS': 'Herramientas'
  };
  // Si es un tipo sanitizado, usar el label; si no, mostrar el tipo tal cual
  return labels[s] || s.replace(/_/g, ' '); // Reemplazar guiones bajos por espacios si no está en labels
}

export default function CargaPage() {
  const [opcionSeleccionada, setOpcionSeleccionada] = useState<'base' | 'pricing' | 'simulacion' | null>(null)
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null)
  const [archivoNombre, setArchivoNombre] = useState<string>('')
  const [procesando, setProcesando] = useState(false)
  const [progreso, setProgreso] = useState(0)
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [error, setError] = useState<string>('')
  const [procesosCompletados, setProcesosCompletados] = useState<boolean[]>([false, false, false, false])
  const [mostrarTodosProductos, setMostrarTodosProductos] = useState(false)
  const [showProcessVisualizer, setShowProcessVisualizer] = useState(false)
  const [productosAMostrar, setProductosAMostrar] = useState<Producto[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { configuracion } = useConfiguracion()
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState<string>('')
  const [preciosEnUSD, setPreciosEnUSD] = useState<boolean>(false)
  
  // Estados para conversión PDF
  const [convirtiendoPDF, setConvirtiendoPDF] = useState(false)
  const [progresoConversion, setProgresoConversion] = useState(0)
  const [mensajeConversion, setMensajeConversion] = useState('')



  // Función para formatear tamaño de archivo
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Función para exportar a Excel
  const handleExportarExcel = () => {
    if (!resultado) return

    // Preparar datos para Excel
    const productosExcel = resultado.productos.map((producto, index) => ({
      id: index + 1,
      producto: (producto as any).producto_id || producto.modelo || producto.producto,
      tipo: producto.tipo,
      modelo: producto.modelo || (producto as any).producto_id || producto.producto,
      proveedor: producto.proveedor || proveedorSeleccionado || 'Sin Marca',
      precio_base_minorista: producto.precio_base_minorista || 0,
      precio_base_mayorista: producto.precio_base_mayorista || 0,
      costo_estimado_minorista: producto.costo_estimado_minorista || 0,
      costo_estimado_mayorista: producto.costo_estimado_mayorista || 0,
      equivalencia_varta: producto.equivalencia_varta,
      margen_minorista: producto.minorista?.rentabilidad ? parseFloat(producto.minorista.rentabilidad.replace('%', '')) : 0,
      margen_mayorista: producto.mayorista?.rentabilidad ? parseFloat(producto.mayorista.rentabilidad.replace('%', '')) : 0,
      rentabilidad: producto.minorista?.rentabilidad || '0%',
      observaciones: `Precio final Minorista: $${producto.minorista?.precio_final || 0}, Mayorista: $${producto.mayorista?.precio_final || 0}`
    }))

    const estadisticasExcel = {
      total_productos: resultado.estadisticas.total_productos,
      productos_rentables: resultado.estadisticas.productos_rentables,
      con_equivalencia: resultado.productos.filter(p => p.equivalencia_varta?.encontrada).length,
      margen_promedio: resultado.estadisticas.margen_promedio
    }

    // Exportar a Excel
    const nombreArchivo = `reporte_${(proveedorSeleccionado || 'sin_marca')}_${archivoNombre.replace(/\.[^/.]+$/, '')}`
    exportarAExcel(productosExcel, nombreArchivo)
  }

  // Función para exportar SOLO costos base por marca
  const handleExportarCostosBasePorMarca = () => {
    if (!resultado) return

    // Preparar datos con las 6 columnas necesarias para TODOS los productos
    const costosBase = resultado.productos.map((producto, index) => {
      return {
        'ID': index + 1,
        'Producto': (producto as any).producto_id || producto.modelo || producto.producto,
        'Tipo': producto.tipo,
        'Modelo': producto.modelo,
        'Proveedor': producto.proveedor || proveedorSeleccionado || 'Sin Marca',  // ✅ PROVEEDOR DETECTADO O FORZADO
        'Costo': producto.costo_estimado_minorista || 0  // ✅ SOLO EL COSTO
      }
    })

    // Generar Excel directamente con solo las 6 columnas
    const nombreArchivo = `costos_rentabilidad_${(proveedorSeleccionado || 'sin_marca')}_${archivoNombre.replace(/\.[^/.]+$/, '')}.xlsx`
    
    // Crear workbook y worksheet
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(costosBase)
    
    // Ajustar ancho de columnas
    worksheet['!cols'] = [
      { wch: 5 },   // ID
      { wch: 20 },  // Producto
      { wch: 15 },  // Tipo
      { wch: 20 },  // Modelo
      { wch: 15 },  // Proveedor
      { wch: 20 }   // Costo
    ]
    
    // Agregar hoja al workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Costos Rentabilidad')
    
    // Generar y descargar archivo
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = nombreArchivo
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    // Mostrar mensaje de confirmación
    alert(`✅ Archivo generado!\n\n📁 Se creó: ${nombreArchivo}\n📊 Productos incluidos: ${resultado.productos.length}`)
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

  // Función para convertir PDF a Excel (usando nuevo API route)
  const convertirPDFaExcel = async (archivoPDF: File) => {
    console.log('🚀 Iniciando conversión con nuevo API:', archivoPDF.name)
    setConvirtiendoPDF(true)
    setProgresoConversion(0)
    setMensajeConversion('Iniciando conversión...')
    
    try {
      // Crear FormData
      const formData = new FormData()
      formData.append('file', archivoPDF)
      
      // Actualizar progreso
      setProgresoConversion(20)
      setMensajeConversion('Enviando archivo al servidor...')
      
      // Llamar al nuevo API route
      const response = await fetch('/api/pdf-to-excel', {
        method: 'POST',
        body: formData
      })
      
      setProgresoConversion(50)
      setMensajeConversion('Procesando PDF y extrayendo datos...')
      
      const resultado = await response.json()
      
      setProgresoConversion(80)
      setMensajeConversion('Generando archivo Excel...')
      
      if (resultado.success && resultado.excel) {
        // Descargar archivo Excel
        const descargaExitosa = descargarArchivo(
          resultado.excel,
          resultado.nombreSugerido || 'conversion.xlsx',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        
        if (descargaExitosa) {
          setProgresoConversion(100)
          setMensajeConversion('¡Conversión completada exitosamente!')
          console.log('✅ Conversión exitosa:', resultado.estadisticas)
          
          // Mostrar resumen
          setTimeout(() => {
            alert(`✅ Conversión completada!\n\n📊 Resumen:\n- Productos extraídos: ${resultado.estadisticas?.filasTablas || 0}\n- Archivo: ${resultado.nombreSugerido}\n- Método: ${resultado.estadisticas?.metodo || 'CloudConvert'}`)
          }, 500)
        } else {
          throw new Error('Error al descargar el archivo')
        }
      } else {
        throw new Error(resultado.error || 'Error desconocido en la conversión')
      }
      
    } catch (error) {
      console.error('❌ Error en conversión:', error)
      setMensajeConversion(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`)
      
      // Mostrar error al usuario
      setTimeout(() => {
        alert(`❌ Error en la conversión:\n\n${error instanceof Error ? error.message : 'Error desconocido'}\n\nPor favor, verifica que el PDF contenga datos de productos.`)
      }, 500)
      
    } finally {
      // Limpiar estados
      setTimeout(() => {
        setConvirtiendoPDF(false)
        setProgresoConversion(0)
        setMensajeConversion('')
      }, 2000)
    }
  }

  // Manejar selección de archivo
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setArchivoSeleccionado(file)
      setArchivoNombre(file.name)
      setError('')
      setResultado(null)
      setProcesosCompletados([false, false, false, false])
      setMostrarTodosProductos(false)
    }
  }

  // Simular procesos de carga
  const simularProcesos = async () => {
    setProcesosCompletados([false, false, false, false])
    
    // Proceso 1: Validación del archivo
    await new Promise(resolve => setTimeout(resolve, 800))
    setProcesosCompletados([true, false, false, false])
    setProgreso(25)
    
    // Proceso 2: Lectura de datos
    await new Promise(resolve => setTimeout(resolve, 1000))
    setProcesosCompletados([true, true, false, false])
    setProgreso(50)
    
    // Proceso 3: Aplicación de pricing
    await new Promise(resolve => setTimeout(resolve, 1200))
    setProcesosCompletados([true, true, true, false])
    setProgreso(75)
    
    // Proceso 4: Generación de resultados
    await new Promise(resolve => setTimeout(resolve, 600))
    setProcesosCompletados([true, true, true, true])
    setProgreso(100)
  }

  // Procesar archivo
  const procesarArchivo = async () => {
    if (!archivoSeleccionado) return

    setProcesando(true)
    setProgreso(0)
    setError('')
    
    try {
      // Mostrar visualizador de proceso
      setShowProcessVisualizer(true)
      
      // Simular progreso del visualizador mientras se procesa
      // VELOCIDAD: 6 segundos por paso para demo profesional (48 segundos total)
      const simularProgreso = () => {
        let paso = 0
        const interval = setInterval(() => {
          paso++
          if (paso <= 8) {
            // Simular progreso del paso actual
            setProgreso((paso / 8) * 100)
          } else {
            clearInterval(interval)
          }
        }, 6000) // 6 segundos por paso - Total 48 segundos para demo profesional
        
        return interval
      }
      
      const progresoInterval = simularProgreso()
      
      // Llamada real a la API
      const formData = new FormData()
      formData.append('file', archivoSeleccionado)
      if (proveedorSeleccionado) {
        formData.append('proveedorSeleccionado', proveedorSeleccionado)
      }
      if (preciosEnUSD) {
        formData.append('preciosEnUSD', 'true')
      }
      
      // Obtener configuración actual del localStorage
      const configuracionActual = localStorage.getItem('acubat_config')
      if (configuracionActual) {
        formData.append('configuracion', configuracionActual)
        console.log('🎯 Enviando configuración al servidor:', JSON.parse(configuracionActual))
      }
      
      const response = await fetch('/api/pricing/procesar-archivo', {
        method: 'POST',
        body: formData
      })
      
      // Limpiar el intervalo de progreso
      clearInterval(progresoInterval)
      
      if (!response.ok) {
        throw new Error('Error al procesar el archivo')
      }
      
      const data = await response.json()
      
      // 🔍 DEBUG: Verificar qué se recibió del backend
      console.log('🔍 ========== DEBUG FRONTEND: RESPUESTA DEL BACKEND ==========')
      console.log('   - success:', data.success)
      console.log('   - total productos:', data.productos?.length || 0)
      if (data.productos && data.productos.length > 0) {
        const primerProducto = data.productos[0]
        console.log('   - Primer producto recibido:')
        console.log('     * producto:', primerProducto.producto, '(tipo:', typeof primerProducto.producto + ')')
        console.log('     * descripcion:', primerProducto.descripcion, '(tipo:', typeof primerProducto.descripcion + ')')
        console.log('     * proveedor:', primerProducto.proveedor, '(tipo:', typeof primerProducto.proveedor + ')')
        console.log('     * modelo:', primerProducto.modelo)
        
        // Verificar los primeros 5 productos
        data.productos.slice(0, 5).forEach((p: any, idx: number) => {
          console.log(`   - Producto ${idx + 1}: producto="${p.producto}", descripcion="${p.descripcion || '(vacío)'}", proveedor="${p.proveedor}"`)
        })
      }
      console.log('🔍 ============================================================\n')
      
      if (data.success) {
        setResultado(data)
        try {
          if (data.fx_info) {
            localStorage.setItem('acubat_fx', JSON.stringify(data.fx_info))
            window.dispatchEvent(new Event('acubat_fx_update'))
          }
        } catch {}
        // Filtro visual: ocultar filas con ambos precios base 0
        const headerTokens = ['precio','unitario','contado','cont','caja','pago','dia','dias','iva']
        const visibles = (data.productos || []).filter((p: any) => {
          const baseMin = Number(p?.precio_base_minorista || 0)
          const baseMay = Number(p?.precio_base_mayorista || 0)
          const finalMin = Number(p?.minorista?.precio_final || 0)
          const finalMay = Number(p?.mayorista?.precio_final || 0)
          const texto = `${p?.producto || ''} ${p?.modelo || ''}`
            .toLowerCase()
            .normalize('NFD')
            .replace(/\p{Diacritic}/gu, '')
            .replace(/[.]/g, '')
          const esHeaderTexto = headerTokens.filter(t => texto.includes(t)).length >= 2
          // Ocultar si no hay ningún precio útil y además parece ser texto de encabezado
          const hayPrecio = (baseMin > 0) || (baseMay > 0) || (finalMin > 0) || (finalMay > 0)
          return hayPrecio || !esHeaderTexto
        })
        setProductosAMostrar(visibles)
        setProgreso(100) // Completar al 100%
      } else {
        setError(data.error || 'Error desconocido')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setProcesando(false)
    }
  }

  // Callback cuando se complete el proceso visual
  const handleProcessComplete = () => {
    setShowProcessVisualizer(false)
    setProcesando(false)
  }

  // Descargar resultados como Excel (CSV) - SOLO DATOS ÚTILES
  const downloadResults = () => {
    if (!resultado) return

    const headers = [
      'Producto',
      'Tipo', 
      'Modelo',
      'Precio Base',
      'Desc. Proveedor',
      'Canal',
      'Precio Neto',
      'IVA',
      'Precio Final',
      'Markup',
      'Rentabilidad'
    ]

    // Crear filas separadas para Minorista y Mayorista
    const csvRows: string[] = []
    
    resultado.productos.forEach(producto => {
      // Fila Minorista
      csvRows.push([
        ((producto as any).producto_id || producto.modelo || producto.producto) || 'N/A',
        getTipoLabel(producto.tipo),
        producto.modelo || 'N/A',
        producto.precio_base_minorista || 0,
        (producto.descuento_proveedor || 0) + '%',
        'Minorista',
        producto.minorista.precio_neto || 0,
        (producto.minorista.precio_final || 0) - (producto.minorista.precio_neto || 0),
        producto.minorista.precio_final || 0,
        producto.minorista.markup_aplicado || '0%',
        producto.minorista.rentabilidad || '0%'
      ].join(','))
      
      // Fila Mayorista
      csvRows.push([
        '', // Producto vacío para mantener alineación
        '', // Tipo vacío para mantener alineación
        '', // Modelo vacío para mantener alineación
        producto.precio_base_mayorista || 0,
        (producto.descuento_proveedor || 0) + '%',
        'Mayorista',
        producto.mayorista.precio_neto || 0,
        (producto.mayorista.precio_final || 0) - (producto.mayorista.precio_neto || 0),
        producto.mayorista.precio_final || 0,
        producto.mayorista.markup_aplicado || '0%',
        producto.mayorista.rentabilidad || '0%'
      ].join(','))
    })

    const csvContent = [
      headers.join(','),
      ...csvRows
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `pricing_resultados_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Obtener productos para mostrar (4 iniciales o todos)
  const productosParaMostrar = productosAMostrar.length > 0 ? 
    (mostrarTodosProductos ? productosAMostrar : productosAMostrar.slice(0, 12)) : []

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Sistema de Pricing Acubat
            </h1>
            <p className="text-gray-600">
              Sistema profesional para gestión de pricing de baterías con análisis completo de rentabilidad
            </p>
            {resultado?.fx_info && (
              <div className="mt-4 inline-flex items-center px-3 py-2 rounded-md border text-sm bg-yellow-50 border-yellow-200 text-yellow-800">
                <span className="font-medium mr-2">Tipo de cambio:</span>
                <span>Compra {formatCurrency(resultado.fx_info.buy, false)} · Venta {formatCurrency(resultado.fx_info.sell, false)}</span>
                <span className="mx-2">|</span>
                <span>{new Date(resultado.fx_info.date).toLocaleString()}</span>
                {resultado.fx_info.source && <span className="ml-2 text-yellow-700">({resultado.fx_info.source})</span>}
              </div>
            )}
          </div>

          {/* Selección de Opciones */}
          {!opcionSeleccionada && (
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Opción 1: Archivos de Base */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center hover:shadow-md transition-shadow cursor-pointer" onClick={() => setOpcionSeleccionada('base')}>
                  <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <TableCellsIcon className="w-10 h-10 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">
                    Archivos de Base
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Carga tu tabla de equivalencias Varta y lista de precios base para el sistema
                  </p>
                  <div className="text-sm text-blue-600 font-medium">
                    Cargar Equivalencias + Precios Base
                  </div>
                </div>

                {/* Opción 2: Calcular Pricing */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center hover:shadow-md transition-shadow cursor-pointer" onClick={() => setOpcionSeleccionada('pricing')}>
                  <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <CurrencyDollarIcon className="w-10 h-10 text-green-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">
                    Calcular Pricing
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Procesa archivos de baterías y obtén pricing profesional por canal
                  </p>
                  <div className="text-sm text-green-600 font-medium">
                    Calcular Pricing por Canal
                  </div>
                </div>

                {/* Opción 3: Archivos Simulación */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center hover:shadow-md transition-shadow cursor-pointer" onClick={() => setOpcionSeleccionada('simulacion')}>
                  <div className="mx-auto w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                    <DocumentTextIcon className="w-10 h-10 text-purple-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-3">
                    Archivos Simulación
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Carga archivos para revisión y validación sin procesamiento
                  </p>
                  <div className="text-sm text-purple-600 font-medium">
                    Cargar y Validar Archivos
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Opción 1: Archivos de Base */}
          {opcionSeleccionada === 'base' && (
            <div className="max-w-4xl mx-auto">
              <div className="mb-6">
                <button
                  onClick={() => setOpcionSeleccionada(null)}
                  className="inline-flex items-center px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-md transition-colors duration-200"
                >
                  ← Volver a Opciones
                </button>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="text-center mb-6">
                  <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                    <TableCellsIcon className="w-8 h-8 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    📋 Cargar Archivos de Base
                  </h2>
                  <p className="text-gray-600 text-sm">
                    Carga tu tabla de equivalencias Varta y lista de precios base
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Convertir a Excel */}
                  <div className="border-2 border-dashed border-blue-200 rounded-lg p-6 text-center">
                    <div className="mx-auto w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-3">
                      <TableCellsIcon className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center justify-center">
                      Convertir a Excel
                      <span className="ml-2 inline-flex items-center px-2 py-1 text-xs font-bold text-white bg-green-500 rounded-full">
                        NUEVO
                      </span>
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      {/* Descripción removida */}
                    </p>
                    {/* Botón Cargar PDF */}
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setArchivoSeleccionado(file)
                          setArchivoNombre(file.name)
                          console.log('PDF cargado:', file.name)
                        }
                      }}
                      className="hidden"
                      id="cargar-pdf-input"
                    />
                    <label
                      htmlFor="cargar-pdf-input"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors duration-200 cursor-pointer mb-3 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                    >
                      <ArrowUpTrayIcon className="w-4 h-4 mr-2" />
                      Cargar PDF
                    </label>
                    
                    {/* Botón Convertir PDF a Excel */}
                    <button
                      onClick={() => {
                        if (archivoSeleccionado && archivoSeleccionado.type === 'application/pdf') {
                          console.log('Iniciando conversión de:', archivoSeleccionado.name)
                          convertirPDFaExcel(archivoSeleccionado)
                        } else {
                          alert('Por favor, carga un archivo PDF primero')
                        }
                      }}
                      disabled={!archivoSeleccionado || archivoSeleccionado.type !== 'application/pdf' || convirtiendoPDF}
                      className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 cursor-pointer shadow-lg hover:shadow-xl transform hover:scale-105 ${
                        !archivoSeleccionado || archivoSeleccionado.type !== 'application/pdf' || convirtiendoPDF
                          ? 'bg-gray-400 cursor-not-allowed transform-none' 
                          : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white'
                      }`}
                    >
                      {convirtiendoPDF ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Convirtiendo...
                        </>
                      ) : (
                        <>
                          <DocumentIcon className="w-4 h-4 mr-2" />
                          Convertir PDF a Excel
                        </>
                      )}
                    </button>
                    
                    {/* Barra de progreso de conversión */}
                    {convirtiendoPDF && (
                      <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-blue-800">Progreso de Conversión</span>
                          <span className="text-sm font-bold text-blue-600">{progresoConversion}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 mb-3 shadow-inner">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500 ease-out shadow-lg"
                            style={{ width: `${progresoConversion}%` }}
                          ></div>
                        </div>
                        <p className="text-sm text-blue-700 font-medium text-center">{mensajeConversion}</p>
                      </div>
                    )}
                  </div>

                  {/* Lista de Precios Base */}
                  <div className="border-2 border-dashed border-green-200 rounded-lg p-6 text-center">
                    <div className="mx-auto w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-3">
                      <CurrencyDollarIcon className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Lista de Precios Base
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                      Precios Varta de referencia
                    </p>
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setArchivoSeleccionado(file)
                          setArchivoNombre(file.name)
                        }
                      }}
                      className="hidden"
                      id="precios-input"
                    />
                    <label
                      htmlFor="precios-input"
                      className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition-colors duration-200 cursor-pointer"
                    >
                      <ArrowUpTrayIcon className="w-4 h-4 mr-2" />
                      Cargar Excel
                    </label>
                  </div>
                </div>

                <div className="mt-6 text-center">
                  {archivoSeleccionado && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                      <p className="text-green-800 text-sm">
                        ✅ Archivo cargado: <strong>{archivoNombre}</strong>
                      </p>
                    </div>
                  )}
                  <button 
                    onClick={() => {
                      if (archivoSeleccionado) {
                        setOpcionSeleccionada('pricing')
                      } else {
                        alert('Por favor, carga un archivo primero')
                      }
                    }}
                    disabled={!archivoSeleccionado}
                    className={`inline-flex items-center px-6 py-3 font-medium rounded-md transition-colors duration-200 ${
                      archivoSeleccionado 
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <CheckCircleIcon className="w-5 h-5 mr-2" />
                    {archivoSeleccionado ? 'Continuar a Pricing' : 'Cargar Archivo Primero'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Opción 2: Calcular Pricing (TU PANTALLA ACTUAL - SIN CAMBIOS) */}
          {opcionSeleccionada === 'pricing' && (
            <div className="max-w-6xl">
              <div className="mb-6">
                <button
                  onClick={() => setOpcionSeleccionada(null)}
                  className="inline-flex items-center px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-md transition-colors duration-200"
                >
                  ← Volver a Opciones
                </button>
              </div>

              {/* Botón de Carga */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <div className="text-center">
                  <div className="mb-4">
                    <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                      <ArrowUpTrayIcon className="w-8 h-8 text-blue-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                      Cargar Archivo Excel
                    </h2>
                    <p className="text-gray-600 text-sm">
                      Selecciona tu archivo de baterías para procesar
                    </p>
                  </div>

                  {/* Input de archivo oculto */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {/* Botón de selección */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors duration-200"
                  >
                    <ArrowUpTrayIcon className="w-4 h-4 mr-2" />
                    Seleccionar Archivo
                  </button>
                </div>

                {/* Archivo seleccionado */}
                {archivoSeleccionado && (
                  <div className="mt-4 p-4 bg-green-50 rounded-md border border-green-200">
                    <div className="flex items-center space-x-3">
                      <DocumentTextIcon className="w-5 h-5 text-green-600" />
                      <div className="text-left">
                        <h3 className="text-sm font-medium text-green-800">
                          Archivo Seleccionado
                        </h3>
                        <p className="text-green-700 text-sm">{archivoNombre}</p>
                        <p className="text-green-600 text-xs">
                          Tamaño: {formatFileSize(archivoSeleccionado.size)} | 
                          Tipo: {archivoSeleccionado.type || 'No especificado'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Proveedor para aplicar configuración (resaltado) */}
                <div className="mt-4 text-left rounded-lg border border-indigo-300 bg-indigo-50 p-4">
                  <label className="block text-sm font-semibold text-indigo-900 mb-2">
                    Proveedor para aplicar variables
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                    <select
                      value={proveedorSeleccionado}
                      onChange={(e) => setProveedorSeleccionado(e.target.value)}
                      className="block w-full rounded-md border-indigo-300 bg-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    >
                      <option value="">Detectar automáticamente</option>
                      {Object.keys(configuracion?.proveedores || {}).map((prov) => (
                        <option key={prov} value={prov}>{prov}</option>
                      ))}
                    </select>
                    <p className="text-xs text-indigo-700 md:col-span-2">
                      Elegí un proveedor para aplicar sus descuentos preconfigurados a esta corrida de pricing.
                    </p>
                  </div>

                  {/* Checkbox para precios en USD */}
                  <div className="mt-4 flex items-center">
                    <input
                      id="preciosEnUSD"
                      type="checkbox"
                      checked={preciosEnUSD}
                      onChange={(e) => setPreciosEnUSD(e.target.checked)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="preciosEnUSD" className="ml-2 block text-sm text-gray-700">
                      💵 Los precios están en USD (se convertirán a ARS usando el tipo de cambio Blue)
                    </label>
                  </div>
                </div>
              </div>

              {/* Botón de Procesar */}
              {archivoSeleccionado && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                  <div className="text-center">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      ¿Listo para procesar?
                    </h3>
                    
                    {/* Botón de procesar con badge de proveedor */}
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={procesarArchivo}
                        disabled={procesando}
                        className={`relative overflow-hidden inline-flex items-center px-6 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                          procesando 
                            ? 'bg-gray-400 cursor-not-allowed text-white' 
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                      >
                        {procesando ? (
                          <>
                            <span className="relative z-10">Procesando...</span>
                            {/* Progress bar */}
                            <div 
                              className="absolute inset-0 bg-green-500 transition-all duration-300 ease-out"
                              style={{ width: `${progreso}%` }}
                            />
                          </>
                        ) : (
                          <>
                            <PlayIcon className="w-4 h-4 mr-2" />
                            Procesar Archivo
                          </>
                        )}
                      </button>
                      {proveedorSeleccionado && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-200">
                          Marca: {proveedorSeleccionado}
                        </span>
                      )}
                    </div>

                    {/* Barra de progreso */}
                    {procesando && (
                      <div className="mt-4">
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-green-500 h-2 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${progreso}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-600 mt-2">
                          Progreso: {progreso}%
                        </p>
                      </div>
                    )}

                    {/* Procesos con checkmarks */}
                    {procesando && (
                      <div className="mt-6 grid grid-cols-2 gap-3 max-w-sm mx-auto">
                        <div className={`flex items-center space-x-2 p-2 rounded-md text-xs transition-all duration-300 ${
                          procesosCompletados[0] ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
                        }`}>
                          <CheckCircleIcon className={`w-4 h-4 ${
                            procesosCompletados[0] ? 'text-green-600' : 'text-gray-400'
                          }`} />
                          <span className={`font-medium ${
                            procesosCompletados[0] ? 'text-green-800' : 'text-gray-600'
                          }`}>
                            Validación
                          </span>
                        </div>

                        <div className={`flex items-center space-x-2 p-2 rounded-md text-xs transition-all duration-300 ${
                          procesosCompletados[1] ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
                        }`}>
                          <CheckCircleIcon className={`w-4 h-4 ${
                            procesosCompletados[1] ? 'text-green-600' : 'text-gray-400'
                          }`} />
                          <span className={`font-medium ${
                            procesosCompletados[1] ? 'text-green-800' : 'text-gray-600'
                          }`}>
                            Lectura
                          </span>
                        </div>

                        <div className={`flex items-center space-x-2 p-2 rounded-md text-xs transition-all duration-300 ${
                          procesosCompletados[2] ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
                        }`}>
                          <CheckCircleIcon className={`w-4 h-4 ${
                            procesosCompletados[2] ? 'text-green-600' : 'text-gray-400'
                          }`} />
                          <span className={`font-medium ${
                            procesosCompletados[2] ? 'text-green-800' : 'text-gray-600'
                          }`}>
                            Pricing
                          </span>
                        </div>

                        <div className={`flex items-center space-x-2 p-2 rounded-md text-xs transition-all duration-300 ${
                          procesosCompletados[3] ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
                        }`}>
                          <CheckCircleIcon className={`w-4 h-4 ${
                            procesosCompletados[3] ? 'text-green-600' : 'text-gray-400'
                          }`} />
                          <span className={`font-medium ${
                            procesosCompletados[3] ? 'text-green-800' : 'text-gray-600'
                          }`}>
                            Resultados
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Error</h3>
                      <div className="mt-1 text-sm text-red-700">{error}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Resultados */}
              {resultado && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="text-center mb-6">
                    <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                      <CheckCircleIcon className="w-6 h-6 text-green-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                      ¡Procesamiento Completado!
                    </h2>
                    <p className="text-gray-600 text-sm">
                      Archivo procesado exitosamente con {resultado.estadisticas.total_productos} productos
                    </p>
                    { (proveedorSeleccionado || (resultado.productos?.[0]?.proveedor)) && (
                      <div className="mt-3">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 border border-indigo-200">
                          Marca seleccionada: {proveedorSeleccionado || resultado.productos?.[0]?.proveedor}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Estadísticas */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600 mb-1">
                          {resultado.estadisticas.total_productos}
                        </div>
                        <div className="text-blue-800 text-sm font-medium">Total Productos</div>
                      </div>
                    </div>

                    <div className="bg-green-50 p-4 rounded-md border border-green-200">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600 mb-1">
                          {resultado.estadisticas.productos_rentables}
                        </div>
                        <div className="text-green-800 text-sm font-medium">Rentables</div>
                      </div>
                    </div>

                    <div className="bg-purple-50 p-4 rounded-md border border-purple-200">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600 mb-1">
                          {resultado.estadisticas.productos_rentables}
                        </div>
                        <div className="text-purple-800 text-sm font-medium">Con Equivalencia</div>
                      </div>
                    </div>

                    <div className="bg-indigo-50 p-4 rounded-md border border-indigo-200">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-indigo-600 mb-1">
                          {resultado.estadisticas.margen_promedio}
                        </div>
                        <div className="text-indigo-800 text-sm font-medium">Margen Promedio</div>
                      </div>
                    </div>
                  </div>

                  {/* Botones de descarga */}
                  <div className="text-center mb-6">
                    <div className="flex flex-wrap gap-3 justify-center">
                      <button
                        onClick={handleExportarExcel}
                        className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-md transition-colors duration-200"
                      >
                        📊 Descargar Excel con Resultados
                      </button>
                      <button
                        onClick={handleExportarCostosBasePorMarca}
                        className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-md transition-colors duration-200"
                      >
                        💰 Costos / Rentabilidad
                      </button>
                    </div>
                  </div>

                  {/* Vista Previa de Productos Procesados */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        Productos Procesados por Canal
                      </h3>
                      <div className="text-sm text-gray-500">
                        Mostrando {productosParaMostrar.length} de {productosAMostrar.length} productos
                      </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-white border border-gray-200 rounded-md overflow-hidden">
                        <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                          <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                      CODIGO
                    </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                              TIPO
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                              MODELO
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                              DESCRIPCIÓN
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                              PRECIO BASE
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                              DESC. PROVEEDOR
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                              CANAL
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                              PRECIO CANAL
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                              MARGEN ADICIONAL
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                              PRECIO NETO
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                              MARKUP %
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                              MARGEN %
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {productosParaMostrar.map((producto) => (
                            <>
                              {/* Fila Minorista */}
                              <tr key={`${producto.id}-minorista`} className="hover:bg-blue-50 transition-colors">
                                <td className="px-4 py-3 whitespace-nowrap bg-gray-50">
                                  <div className="text-sm font-semibold text-gray-900">{(producto as any).producto_id || producto.modelo || producto.producto || '—'}</div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap bg-gray-50">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    ⚡ {getTipoLabel(producto.tipo)}
                                  </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap bg-gray-50">
                                  <div className="text-sm font-medium text-gray-900">{producto.modelo}</div>
                                  {producto.equivalencia_varta?.encontrada && (
                                    <div className="text-xs text-green-600">
                                      ✅ Varta: {producto.equivalencia_varta.codigo}
                                    </div>
                                  )}
                                </td>
                                <td className="px-4 py-3 bg-gray-50">
                                  <div className="text-sm text-gray-700 max-w-xs">
                                    {producto.descripcion || '—'}
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap bg-gray-50">
                                  <div className="text-sm font-semibold text-gray-900">
                                    {formatCurrency(producto.precio_base_minorista)}
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap bg-gray-50">
                                  <div className="text-sm font-semibold text-orange-600">
                                    {producto.descuento_proveedor || 0}%
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    Minorista
                                  </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">
                                    {formatCurrency(producto.minorista.precio_neto)}
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">
                                    {formatCurrency(producto.minorista.precio_final - producto.minorista.precio_neto)}
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="text-sm font-semibold text-gray-900">
                                    {formatCurrency(producto.minorista.precio_final)}
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="text-sm font-semibold text-blue-600">{producto.minorista.markup_aplicado || '0%'}</div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="text-sm font-semibold text-blue-600">{producto.minorista.rentabilidad}</div>
                                </td>
                              </tr>
                              
                              {/* Fila Mayorista */}
                              <tr key={`${producto.id}-mayorista`} className="hover:bg-green-50 transition-colors">
                                <td className="px-4 py-3 whitespace-nowrap bg-gray-50">
                                  <div className="text-sm font-semibold text-gray-900">{(producto as any).producto_id || producto.modelo || producto.producto || '—'}</div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap bg-gray-50">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    ⚡ {getTipoLabel(producto.tipo)}
                                  </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap bg-gray-50">
                                  <div className="text-sm font-medium text-gray-900">{producto.modelo}</div>
                                  {producto.equivalencia_varta?.encontrada && (
                                    <div className="text-xs text-green-600">
                                      ✅ Varta: {producto.equivalencia_varta.codigo}
                                    </div>
                                  )}
                                </td>
                                <td className="px-4 py-3 bg-gray-50">
                                  <div className="text-sm text-gray-700 max-w-xs">
                                    {producto.descripcion || '—'}
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap bg-gray-50">
                                  <div className="text-sm font-semibold text-gray-900">
                                    {formatCurrency(producto.precio_base_mayorista)}
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap bg-gray-50">
                                  <div className="text-sm font-semibold text-orange-600">
                                    {producto.descuento_proveedor || 0}%
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Mayorista
                                  </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">
                                    {formatCurrency(producto.mayorista.precio_neto)}
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="text-sm text-gray-900">
                                    {formatCurrency(producto.mayorista.precio_final - producto.mayorista.precio_neto)}
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="text-sm font-semibold text-gray-900">
                                    {formatCurrency(producto.mayorista.precio_final)}
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="text-sm font-semibold text-green-600">
                                    {producto.mayorista.markup_aplicado || '0%'}
                                  </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <div className="text-sm font-semibold text-green-600">{producto.mayorista.rentabilidad}</div>
                                </td>
                              </tr>
                            </>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Botón de expansión */}
                    {resultado.productos.length > 12 && (
                      <div className="text-center mt-4">
                        <button
                          onClick={() => setMostrarTodosProductos(!mostrarTodosProductos)}
                          className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-md transition-colors duration-200"
                        >
                          {mostrarTodosProductos ? (
                            <>
                              <ChevronUpIcon className="w-4 h-4 mr-2" />
                              Ocultar Productos
                            </>
                          ) : (
                            <>
                              <ChevronDownIcon className="w-4 h-4 mr-2" />
                              Ver Todos los Productos ({resultado.productos.length})
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Información del sistema */}
                  <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                    <div className="text-center">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">
                        Sistema de Pricing Acubat v1.0.0
                      </h4>
                      <p className="text-gray-600 text-xs">
                        Sistema de Pricing Profesional - Optimizado para máximo rendimiento
                      </p>
                      <div className="mt-3 flex flex-wrap justify-center gap-2">
                        {[
                          'Procesamiento Excel',
                          'Cálculo Minorista (configuración DB)',
                          'Cálculo Mayorista (configuración DB)',
                          'Rentabilidad Automática',
                          'Redondeo Inteligente',
                          'Exportación CSV'
                        ].map((func: string, index: number) => (
                          <span key={index} className="bg-white px-2 py-1 rounded text-xs text-gray-700 border border-gray-200">
                            {func}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Opción 3: Archivos Simulación */}
          {opcionSeleccionada === 'simulacion' && (
            <div className="max-w-4xl mx-auto">
              <div className="mb-6">
                <button
                  onClick={() => setOpcionSeleccionada(null)}
                  className="inline-flex items-center px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-md transition-colors duration-200"
                >
                  ← Volver a Opciones
                </button>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="text-center mb-6">
                  <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                    <DocumentTextIcon className="w-8 h-8 text-purple-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Archivos Simulación
                  </h2>
                  <p className="text-gray-600 text-sm">
                    Carga archivos para revisión y validación sin procesamiento
                  </p>
                </div>

                {/* Botón de Carga */}
                <div className="text-center">
                  <div className="mb-4">
                    <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                      <ArrowUpTrayIcon className="w-8 h-8 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Cargar Archivo Excel
                    </h3>
                    <p className="text-gray-600 text-sm">
                      Selecciona tu archivo para revisión
                    </p>
                  </div>

                  {/* Input de archivo oculto */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {/* Botón de selección */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-md transition-colors duration-200"
                  >
                    <ArrowUpTrayIcon className="w-4 h-4 mr-2" />
                    Seleccionar Archivo
                  </button>
                </div>

                {/* Archivo seleccionado */}
                {archivoSeleccionado && (
                  <div className="mt-4 p-4 bg-purple-50 rounded-md border border-purple-200">
                    <div className="flex items-center space-x-3">
                      <DocumentTextIcon className="w-5 h-5 text-purple-600" />
                      <div className="text-left">
                        <h3 className="text-sm font-medium text-purple-800">
                          Archivo Seleccionado
                        </h3>
                        <p className="text-purple-700 text-sm">{archivoNombre}</p>
                        <p className="text-purple-600 text-xs">
                          Tamaño: {formatFileSize(archivoSeleccionado.size)} | 
                          Tipo: {archivoSeleccionado.type || 'No especificado'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Mensaje de simulación */}
                {archivoSeleccionado && (
                  <div className="mt-6 text-center">
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                      <div className="flex items-center justify-center space-x-2">
                        <CheckCircleIcon className="w-5 h-5 text-blue-600" />
                        <span className="text-blue-800 text-sm font-medium">
                          Archivo cargado correctamente para simulación
                        </span>
                      </div>
                      <p className="text-blue-600 text-xs mt-2">
                        Este archivo está listo para revisión. No se procesará ni calculará pricing.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Visualizador de Proceso */}
      <ProcessVisualizer
        isVisible={showProcessVisualizer}
        onComplete={handleProcessComplete}
        fileName={archivoNombre || 'Archivo'}
        progreso={progreso}
      />
    </div>
  )
}

