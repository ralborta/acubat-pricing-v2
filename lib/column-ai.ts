// Sistema simple de detección de columnas con IA
export interface MapeoColumnas {
  producto: string
  precio: string
  tipo: string
  modelo?: string
}

/**
 * Detecta columnas usando IA simple
 */
export function detectarColumnas(headers: string[]): MapeoColumnas {
  console.log('🔍 Detectando columnas con IA simple...')
  
  // Mapeo simple basado en nombres comunes
  const mapeo: MapeoColumnas = {
    producto: '',
    precio: '',
    tipo: '',
    modelo: ''
  }
  
  // Buscar columna de producto
  const productoPatterns = ['producto', 'nombre', 'descripcion', 'item', 'articulo']
  mapeo.producto = headers.find(h => 
    productoPatterns.some(pattern => h.toLowerCase().includes(pattern))
  ) || headers[0] || ''
  
  // Buscar columna de precio
  const precioPatterns = ['precio', 'costo', 'valor', 'price', 'cost', 'pvp']
  mapeo.precio = headers.find(h => 
    precioPatterns.some(pattern => h.toLowerCase().includes(pattern))
  ) || headers[1] || ''
  
  // Buscar columna de tipo
  const tipoPatterns = ['tipo', 'categoria', 'clase', 'grupo', 'category']
  mapeo.tipo = headers.find(h => 
    tipoPatterns.some(pattern => h.toLowerCase().includes(pattern))
  ) || headers[2] || ''
  
  // Buscar columna de modelo (opcional)
  const modeloPatterns = ['modelo', 'model', 'codigo', 'sku', 'referencia']
  mapeo.modelo = headers.find(h => 
    modeloPatterns.some(pattern => h.toLowerCase().includes(pattern))
  ) || ''
  
  console.log('📊 Mapeo detectado:', mapeo)
  return mapeo
}

/**
 * Valida si el mapeo es completo
 */
export function validarMapeo(mapeo: MapeoColumnas): { valido: boolean, faltantes: string[] } {
  const faltantes: string[] = []
  
  if (!mapeo.producto) faltantes.push('producto')
  if (!mapeo.precio) faltantes.push('precio')
  if (!mapeo.tipo) faltantes.push('tipo')
  
  return {
    valido: faltantes.length === 0,
    faltantes
  }
}
