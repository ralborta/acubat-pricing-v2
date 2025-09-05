// Sistema inteligente de detección de columnas sin IA
export interface ColumnaDetectada {
  nombre: string
  tipo: 'codigo' | 'precio' | 'categoria' | 'modelo' | 'desconocido'
  confianza: number // 0-100
  patrones: string[]
}

export interface ArchivoAnalizado {
  columnas: ColumnaDetectada[]
  formato: 'csv' | 'excel' | 'json'
  totalFilas: number
}

/**
 * Analiza un archivo y detecta automáticamente el tipo de cada columna
 */
export function analizarArchivo(datos: any[]): ArchivoAnalizado {
  if (!datos || datos.length === 0) {
    return { columnas: [], formato: 'csv', totalFilas: 0 }
  }

  const primeraFila = datos[0]
  const nombresColumnas = Object.keys(primeraFila)
  
  const columnas: ColumnaDetectada[] = nombresColumnas.map(nombre => {
    const muestraDatos = datos.slice(0, Math.min(10, datos.length)).map(fila => fila[nombre])
    return detectarTipoColumna(nombre, muestraDatos)
  })

  return {
    columnas,
    formato: 'csv',
    totalFilas: datos.length
  }
}

/**
 * Detecta el tipo de una columna basándose en su nombre y contenido
 */
function detectarTipoColumna(nombreColumna: string, muestraDatos: any[]): ColumnaDetectada {
  const nombre = nombreColumna.toLowerCase().trim()
  const patrones: string[] = []
  let confianza = 0
  let tipo: ColumnaDetectada['tipo'] = 'desconocido'

  // 1. ANÁLISIS POR NOMBRE DE COLUMNA
  const analisisNombre = analizarNombreColumna(nombre)
  confianza += analisisNombre.confianza
  patrones.push(...analisisNombre.patrones)
  if (analisisNombre.tipo !== 'desconocido') {
    tipo = analisisNombre.tipo
  }

  // 2. ANÁLISIS POR CONTENIDO
  const analisisContenido = analizarContenidoColumna(muestraDatos)
  confianza += analisisContenido.confianza
  patrones.push(...analisisContenido.patrones)
  if (analisisContenido.tipo !== 'desconocido' && analisisContenido.confianza > 50) {
    tipo = analisisContenido.tipo
    confianza = Math.max(confianza, analisisContenido.confianza)
  }

  // 3. ANÁLISIS COMBINADO
  const analisisCombinado = analizarCombinado(nombre, muestraDatos)
  confianza += analisisCombinado.confianza
  patrones.push(...analisisCombinado.patrones)
  if (analisisCombinado.tipo !== 'desconocido' && analisisCombinado.confianza > 70) {
    tipo = analisisCombinado.tipo
    confianza = Math.max(confianza, analisisCombinado.confianza)
  }

  return {
    nombre: nombreColumna,
    tipo: confianza > 30 ? tipo : 'desconocido',
    confianza: Math.min(100, confianza),
    patrones: [...new Set(patrones)]
  }
}

/**
 * Analiza el nombre de la columna para detectar patrones
 */
function analizarNombreColumna(nombre: string): { tipo: ColumnaDetectada['tipo'], confianza: number, patrones: string[] } {
  const patrones: string[] = []
  let confianza = 0
  let tipo: ColumnaDetectada['tipo'] = 'desconocido'

  // Patrones para CÓDIGO
  if (nombre.includes('codigo') || nombre.includes('code')) {
    patrones.push('nombre_codigo')
    confianza += 40
    tipo = 'codigo'
  }
  if (nombre.includes('sku') || nombre.includes('referencia') || nombre.includes('ref')) {
    patrones.push('nombre_sku')
    confianza += 35
    tipo = 'codigo'
  }
  if (nombre.includes('id') || nombre.includes('identificador')) {
    patrones.push('nombre_id')
    confianza += 30
    tipo = 'codigo'
  }

  // Patrones para PRECIO
  if (nombre.includes('precio') || nombre.includes('price')) {
    patrones.push('nombre_precio')
    confianza += 40
    tipo = 'precio'
  }
  if (nombre.includes('costo') || nombre.includes('cost')) {
    patrones.push('nombre_costo')
    confianza += 35
    tipo = 'precio'
  }
  if (nombre.includes('valor') || nombre.includes('value')) {
    patrones.push('nombre_valor')
    confianza += 30
    tipo = 'precio'
  }
  if (nombre.includes('neto') || nombre.includes('bruto')) {
    patrones.push('nombre_neto')
    confianza += 25
    tipo = 'precio'
  }

  // Patrones para CATEGORÍA
  if (nombre.includes('tipo') || nombre.includes('type')) {
    patrones.push('nombre_tipo')
    confianza += 40
    tipo = 'categoria'
  }
  if (nombre.includes('categoria') || nombre.includes('category')) {
    patrones.push('nombre_categoria')
    confianza += 40
    tipo = 'categoria'
  }
  if (nombre.includes('clase') || nombre.includes('class')) {
    patrones.push('nombre_clase')
    confianza += 35
    tipo = 'categoria'
  }
  if (nombre.includes('grupo') || nombre.includes('group')) {
    patrones.push('nombre_grupo')
    confianza += 30
    tipo = 'categoria'
  }

  // Patrones para MODELO
  if (nombre.includes('modelo') || nombre.includes('model')) {
    patrones.push('nombre_modelo')
    confianza += 40
    tipo = 'modelo'
  }
  if (nombre.includes('parte') || nombre.includes('part')) {
    patrones.push('nombre_parte')
    confianza += 35
    tipo = 'modelo'
  }
  if (nombre.includes('item') || nombre.includes('articulo')) {
    patrones.push('nombre_item')
    confianza += 30
    tipo = 'modelo'
  }

  return { tipo, confianza, patrones }
}

/**
 * Analiza el contenido de la columna para detectar patrones
 */
function analizarContenidoColumna(datos: any[]): { tipo: ColumnaDetectada['tipo'], confianza: number, patrones: string[] } {
  const patrones: string[] = []
  let confianza = 0
  let tipo: ColumnaDetectada['tipo'] = 'desconocido'

  // Filtrar datos válidos
  const datosValidos = datos.filter(d => d !== null && d !== undefined && d !== '')
  if (datosValidos.length === 0) {
    return { tipo: 'desconocido', confianza: 0, patrones: [] }
  }

  // Patrones para CÓDIGO
  const patronCodigo = /^[A-Z]{2}\d+-\d+$/
  const patronCodigoSimple = /^[A-Z]+\d+$/
  const patronCodigoComplejo = /^[A-Z]{2,3}\d{2,4}[A-Z]?\d*$/
  
  const codigosDetectados = datosValidos.filter(d => 
    patronCodigo.test(d) || patronCodigoSimple.test(d) || patronCodigoComplejo.test(d)
  ).length

  if (codigosDetectados > datosValidos.length * 0.7) {
    patrones.push('contenido_codigo')
    confianza += 60
    tipo = 'codigo'
  }

  // Patrones para PRECIO
  const patronPrecio = /^\d+\.\d{2}$/
  const patronPrecioEntero = /^\d+$/
  const patronPrecioComplejo = /^\d{1,3}(,\d{3})*\.\d{2}$/
  
  const preciosDetectados = datosValidos.filter(d => 
    patronPrecio.test(d) || patronPrecioEntero.test(d) || patronPrecioComplejo.test(d)
  ).length

  if (preciosDetectados > datosValidos.length * 0.6) {
    patrones.push('contenido_precio')
    confianza += 50
    tipo = 'precio'
  }

  // Patrones para CATEGORÍA
  const categoriasConocidas = [
    'Automotriz', 'Marino', 'Motocicletas', 'Industrial', 'Residencial',
    'Comercial', 'Recreativo', 'Militar', 'Aeronáutico', 'Medico'
  ]
  
  const categoriasDetectadas = datosValidos.filter(d => 
    categoriasConocidas.some(cat => d.toLowerCase().includes(cat.toLowerCase()))
  ).length

  if (categoriasDetectadas > datosValidos.length * 0.5) {
    patrones.push('contenido_categoria')
    confianza += 55
    tipo = 'categoria'
  }

  // Patrones para MODELO
  const patronModelo = /^[A-Z]+\d+[A-Z]?\d*$/
  const patronModeloComplejo = /^[A-Z]{2,3}\d{2,4}[A-Z]?\d*[A-Z]?$/
  
  const modelosDetectados = datosValidos.filter(d => 
    patronModelo.test(d) || patronModeloComplejo.test(d)
  ).length

  if (modelosDetectados > datosValidos.length * 0.6) {
    patrones.push('contenido_modelo')
    confianza += 50
    tipo = 'modelo'
  }

  return { tipo, confianza, patrones }
}

/**
 * Análisis combinado de nombre y contenido
 */
function analizarCombinado(nombre: string, datos: any[]): { tipo: ColumnaDetectada['tipo'], confianza: number, patrones: string[] } {
  const patrones: string[] = []
  let confianza = 0
  let tipo: ColumnaDetectada['tipo'] = 'desconocido'

  // Si el nombre sugiere un tipo y el contenido lo confirma
  const analisisNombre = analizarNombreColumna(nombre)
  const analisisContenido = analizarContenidoColumna(datos)

  if (analisisNombre.tipo === analisisContenido.tipo && analisisNombre.tipo !== 'desconocido') {
    patrones.push('combinado_coincidencia')
    confianza += 80
    tipo = analisisNombre.tipo
  }

  // Si hay alta confianza en el contenido, priorizar eso
  if (analisisContenido.confianza > 70) {
    patrones.push('combinado_contenido_alto')
    confianza += 20
    tipo = analisisContenido.tipo
  }

  return { tipo, confianza, patrones }
}

/**
 * Obtiene el mapeo de columnas detectadas
 */
export function obtenerMapeoColumnas(archivoAnalizado: ArchivoAnalizado): Record<string, string> {
  const mapeo: Record<string, string> = {}
  
  archivoAnalizado.columnas.forEach(columna => {
    if (columna.tipo !== 'desconocido' && columna.confianza > 30) {
      mapeo[columna.tipo] = columna.nombre
    }
  })
  
  return mapeo
}

/**
 * Valida si el mapeo es completo
 */
export function validarMapeo(mapeo: Record<string, string>): { valido: boolean, faltantes: string[] } {
  const columnasRequeridas = ['codigo', 'precio', 'categoria', 'modelo']
  const faltantes = columnasRequeridas.filter(col => !mapeo[col])
  
  return {
    valido: faltantes.length === 0,
    faltantes
  }
}
