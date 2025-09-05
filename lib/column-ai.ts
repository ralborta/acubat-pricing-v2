// Sistema simple de detección de columnas con IA
export interface MapeoColumnas {
  producto: string
  precio: string
  tipo: string
  modelo?: string
  descripcion?: string
  pdv?: string
  pvp?: string
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
  const precioPatterns = ['precio', 'costo', 'valor', 'price', 'cost', 'pvp', 'pdv', 'lista', 'venta', 'publico', 'final']
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
  
  // Buscar columna de descripción (opcional)
  const descripcionPatterns = ['descripcion', 'description', 'detalle', 'comentario']
  mapeo.descripcion = headers.find(h => 
    descripcionPatterns.some(pattern => h.toLowerCase().includes(pattern))
  ) || ''
  
  // Buscar columna PDV (opcional)
  const pdvPatterns = ['pdv', 'precio_detalle', 'precio_detalle_venta']
  mapeo.pdv = headers.find(h => 
    pdvPatterns.some(pattern => h.toLowerCase().includes(pattern))
  ) || ''
  
  // Buscar columna PVP (opcional)
  const pvpPatterns = ['pvp', 'precio_venta_publico', 'precio_publico']
  mapeo.pvp = headers.find(h => 
    pvpPatterns.some(pattern => h.toLowerCase().includes(pattern))
  ) || ''
  
  console.log('📊 Mapeo detectado:', mapeo)
  console.log('🔍 Headers analizados:', headers)
  console.log('🎯 Patrones de precio usados:', precioPatterns)
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
