// Sistema simple de detección de columnas con IA
export interface MapeoColumnas {
  producto: string
  precio: string
  tipo: string
  modelo?: string
  descripcion?: string
  marca?: string  // ✅ Marca para LUSQTOFF
  codigo?: string  // ✅ Código para LUSQTOFF
  pdv?: string
  pvp?: string
  pvp_off_line?: string  // ✅ PVP Off Line para LUSQTOFF
  precio_1?: string  // ✅ Precio 1 para LIQUI MOLY
  precio_2?: string  // ✅ Precio 2 para LIQUI MOLY
  contado?: string
  proveedor?: string  // ✅ Proveedor detectado por IA
}

/**
 * Detecta columnas usando IA simple con soporte para headers múltiples
 */
export function detectarColumnas(headers: string[]): MapeoColumnas {
  console.log('🔍 Detectando columnas con IA simple...')
  console.log('📋 Headers recibidos:', headers)
  
  // Mapeo simple basado en nombres comunes
  const mapeo: MapeoColumnas = {
    producto: '',
    precio: '',
    tipo: '',
    modelo: ''
  }
  
  // 🎯 DETECCIÓN INTELIGENTE DE HEADERS MÚLTIPLES
  // Buscar en todas las filas para encontrar los headers reales
  const todasLasFilas = headers.flatMap(h => h.split('\n').map(line => line.trim())).filter(Boolean)
  console.log('🔍 Todas las filas analizadas:', todasLasFilas)
  
  // Buscar patrones de headers en cualquier fila
  const buscarHeaderEnFilas = (patrones: string[], nombre: string) => {
    for (const fila of todasLasFilas) {
      if (patrones.some(pattern => fila.toLowerCase().includes(pattern))) {
        console.log(`✅ Header '${nombre}' encontrado en fila: "${fila}"`)
        return fila
      }
    }
    return ''
  }
  
  // Buscar columna de producto
  const productoPatterns = ['producto', 'nombre', 'descripcion', 'item', 'articulo', 'motorbike', 'engine']
  mapeo.producto = buscarHeaderEnFilas(productoPatterns, 'producto') || headers[0] || ''
  
  // Buscar columna de marca (específico para LUSQTOFF)
  const marcaPatterns = ['marca', 'brand', 'fabricante', 'manufacturer']
  mapeo.marca = buscarHeaderEnFilas(marcaPatterns, 'marca') || ''
  
  // Buscar columna de código (específico para LUSQTOFF)
  const codigoPatterns = ['codigo', 'code', 'sku', 'referencia', 'ref', 'articulo', 'unitaro']
  mapeo.codigo = buscarHeaderEnFilas(codigoPatterns, 'codigo') || ''
  
  // Buscar columna de precio
  const precioPatterns = ['precio', 'costo', 'valor', 'price', 'cost', 'pvp', 'pdv', 'lista', 'venta', 'publico', 'final']
  mapeo.precio = buscarHeaderEnFilas(precioPatterns, 'precio') || headers[1] || ''
  
  // Buscar columna de contado (prioridad alta)
  const contadoPatterns = ['contado', 'cash', 'efectivo']
  mapeo.contado = buscarHeaderEnFilas(contadoPatterns, 'contado') || ''
  
  // Buscar columna de tipo
  const tipoPatterns = ['tipo', 'categoria', 'clase', 'grupo', 'category', 'funcion', 'función']
  mapeo.tipo = buscarHeaderEnFilas(tipoPatterns, 'tipo') || headers[2] || ''
  
  // Buscar columna de modelo (opcional)
  const modeloPatterns = ['modelo', 'model', 'codigo', 'sku', 'referencia']
  mapeo.modelo = buscarHeaderEnFilas(modeloPatterns, 'modelo') || ''
  
  // Buscar columna de descripción (opcional)
  const descripcionPatterns = ['descripcion', 'description', 'detalle', 'comentario', 'funcion', 'función']
  mapeo.descripcion = buscarHeaderEnFilas(descripcionPatterns, 'descripcion') || ''
  
  // Buscar columna PDV (opcional)
  const pdvPatterns = ['pdv', 'precio_detalle', 'precio_detalle_venta']
  mapeo.pdv = buscarHeaderEnFilas(pdvPatterns, 'pdv') || ''
  
  // Buscar columna PVP (opcional)
  const pvpPatterns = ['pvp', 'precio_venta_publico', 'precio_publico']
  mapeo.pvp = buscarHeaderEnFilas(pvpPatterns, 'pvp') || ''
  
  // Buscar columna PVP Off Line (específico para LUSQTOFF)
  const pvpOffLinePatterns = ['pvp off line', 'pvp_off_line', 'pvp off', 'off line', 'offline']
  mapeo.pvp_off_line = buscarHeaderEnFilas(pvpOffLinePatterns, 'pvp_off_line') || ''
  
  // Buscar columna PRECIO 1 (específico para LIQUI MOLY)
  const precio1Patterns = ['precio 1', 'precio_1', 'precio unitario cont', 'precio con iva', 'en caja con iva', 'caja']
  mapeo.precio_1 = buscarHeaderEnFilas(precio1Patterns, 'precio_1') || ''
  
  // Buscar columna PRECIO 2 (específico para LIQUI MOLY)
  const precio2Patterns = ['precio 2', 'precio_2', 'pago a 30', 'pago a 30 dias', 'caja sin', 'dias']
  mapeo.precio_2 = buscarHeaderEnFilas(precio2Patterns, 'precio_2') || ''
  
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
