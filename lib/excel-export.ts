import * as XLSX from 'xlsx'

export interface Producto {
  id: number
  producto: string
  tipo: string
  modelo: string
  precio_base_minorista: number
  precio_base_mayorista: number
  costo_estimado_minorista: number
  costo_estimado_mayorista: number
  equivalencia_varta?: {
    encontrada: boolean
    modelo_varta?: string
    precio_varta?: number
  }
  margen_minorista?: number
  margen_mayorista?: number
  rentabilidad?: string
  observaciones?: string
}

export function exportarAExcel(productos: Producto[], nombreArchivo: string = 'productos_pricing.xlsx') {
  try {
    // Crear un nuevo workbook
    const workbook = XLSX.utils.book_new()
    
    // Preparar los datos para Excel
    const datosExcel = productos.map((producto, index) => ({
      'ID': producto.id,
      'Producto': producto.producto,
      'Tipo': producto.tipo,
      'Modelo': producto.modelo,
      'Precio Base Minorista': producto.precio_base_minorista,
      'Precio Base Mayorista': producto.precio_base_mayorista,
      'Costo Estimado Minorista': producto.costo_estimado_minorista,
      'Costo Estimado Mayorista': producto.costo_estimado_mayorista,
      'Equivalencia Varta': producto.equivalencia_varta?.encontrada ? 'Sí' : 'No',
      'Modelo Varta': producto.equivalencia_varta?.modelo_varta || '',
      'Precio Varta': producto.equivalencia_varta?.precio_varta || '',
      'Margen Minorista': producto.margen_minorista || '',
      'Margen Mayorista': producto.margen_mayorista || '',
      'Rentabilidad': producto.rentabilidad || '',
      'Observaciones': producto.observaciones || ''
    }))
    
    // Crear la hoja de trabajo
    const worksheet = XLSX.utils.json_to_sheet(datosExcel)
    
    // Ajustar el ancho de las columnas
    const columnWidths = [
      { wch: 5 },   // ID
      { wch: 30 },  // Producto
      { wch: 15 },  // Tipo
      { wch: 20 },  // Modelo
      { wch: 20 },  // Precio Base Minorista
      { wch: 20 },  // Precio Base Mayorista
      { wch: 20 },  // Costo Estimado Minorista
      { wch: 20 },  // Costo Estimado Mayorista
      { wch: 15 },  // Equivalencia Varta
      { wch: 20 },  // Modelo Varta
      { wch: 15 },  // Precio Varta
      { wch: 15 },  // Margen Minorista
      { wch: 15 },  // Margen Mayorista
      { wch: 15 },  // Rentabilidad
      { wch: 30 }   // Observaciones
    ]
    worksheet['!cols'] = columnWidths
    
    // Agregar la hoja al workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Productos Pricing')
    
    // Generar el archivo Excel
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
    
    // Crear blob y descargar
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = nombreArchivo
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    console.log('✅ Archivo Excel exportado exitosamente:', nombreArchivo)
    return true
  } catch (error) {
    console.error('❌ Error exportando a Excel:', error)
    return false
  }
}
