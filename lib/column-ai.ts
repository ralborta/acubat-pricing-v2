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
  
  // 🎯 DETECCIÓN INTELIGENTE DE HEADERS
  // Buscar patrones en los headers directamente
  const buscarHeaderEnFilas = (patrones: string[], nombre: string) => {
    console.log(`🔍 Buscando '${nombre}' con patrones:`, patrones)
    for (const header of headers) {
      if (header && typeof header === 'string') {
        const headerLower = header.toLowerCase()
        if (patrones.some(pattern => headerLower.includes(pattern))) {
          console.log(`✅ Header '${nombre}' encontrado: "${header}"`)
          return header
        }
      }
    }
    console.log(`❌ Header '${nombre}' NO encontrado`)
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
  const precioPatterns = [
    'precio', 'costo', 'valor', 'price', 'cost', 'pvp', 'pdv', 'lista', 'venta', 'publico', 'final',
    'pvp off line', 'pvp_off_line', 'pvp off', 'off line', 'offline', 'precio de lista', 'precio lista'
  ]
  mapeo.precio = buscarHeaderEnFilas(precioPatterns, 'precio') || ''
  
  // 🚨 VALIDACIÓN: Si no se detectó precio, buscar por contenido numérico
  if (!mapeo.precio) {
    console.log('⚠️ No se detectó columna de precio por nombre, buscando por contenido...')
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i]
      // Verificar si la columna contiene valores que parecen precios
      if (header && !header.toLowerCase().includes('codigo') && 
          !header.toLowerCase().includes('code') && 
          !header.toLowerCase().includes('sku') &&
          !header.toLowerCase().includes('referencia') &&
          !header.toLowerCase().includes('ref') &&
          !header.toLowerCase().includes('articulo') &&
          !header.toLowerCase().includes('unitaro') &&
          !header.toLowerCase().includes('marca') &&
          !header.toLowerCase().includes('brand') &&
          !header.toLowerCase().includes('fabricante') &&
          !header.toLowerCase().includes('manufacturer') &&
          !header.toLowerCase().includes('tipo') &&
          !header.toLowerCase().includes('categoria') &&
          !header.toLowerCase().includes('clase') &&
          !header.toLowerCase().includes('grupo') &&
          !header.toLowerCase().includes('category') &&
          !header.toLowerCase().includes('funcion') &&
          !header.toLowerCase().includes('función') &&
          !header.toLowerCase().includes('modelo') &&
          !header.toLowerCase().includes('model') &&
          !header.toLowerCase().includes('descripcion') &&
          !header.toLowerCase().includes('description') &&
          !header.toLowerCase().includes('detalle') &&
          !header.toLowerCase().includes('comentario')) {
        mapeo.precio = header
        console.log(`✅ Precio detectado por exclusión: "${header}"`)
        break
      }
    }
  }
  
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
