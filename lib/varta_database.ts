// Base de datos de equivalencias Varta
export interface EquivalenciaVarta {
  modelo_original: string
  modelo_varta: string
  precio_varta: number
  categoria: string
  disponible: boolean
}

// Base de datos simulada de equivalencias Varta
const equivalenciasVarta: EquivalenciaVarta[] = [
  {
    modelo_original: "AC12-100",
    modelo_varta: "V12-100",
    precio_varta: 125.50,
    categoria: "Automotriz",
    disponible: true
  },
  {
    modelo_original: "AC12-120",
    modelo_varta: "V12-120",
    precio_varta: 145.75,
    categoria: "Automotriz",
    disponible: true
  },
  {
    modelo_original: "AC12-150",
    modelo_varta: "V12-150",
    precio_varta: 175.25,
    categoria: "Automotriz",
    disponible: true
  },
  {
    modelo_original: "AC12-200",
    modelo_varta: "V12-200",
    precio_varta: 225.80,
    categoria: "Automotriz",
    disponible: true
  },
  {
    modelo_original: "AC6-100",
    modelo_varta: "V6-100",
    precio_varta: 95.30,
    categoria: "Motocicletas",
    disponible: true
  },
  {
    modelo_original: "AC6-120",
    modelo_varta: "V6-120",
    precio_varta: 115.45,
    categoria: "Motocicletas",
    disponible: true
  },
  {
    modelo_original: "AC6-150",
    modelo_varta: "V6-150",
    precio_varta: 135.60,
    categoria: "Motocicletas",
    disponible: true
  },
  {
    modelo_original: "AC6-200",
    modelo_varta: "V6-200",
    precio_varta: 165.90,
    categoria: "Motocicletas",
    disponible: true
  },
  {
    modelo_original: "AC24-100",
    modelo_varta: "V24-100",
    precio_varta: 185.40,
    categoria: "Marino",
    disponible: true
  },
  {
    modelo_original: "AC24-120",
    modelo_varta: "V24-120",
    precio_varta: 205.55,
    categoria: "Marino",
    disponible: true
  },
  {
    modelo_original: "AC24-150",
    modelo_varta: "V24-150",
    precio_varta: 235.70,
    categoria: "Marino",
    disponible: true
  },
  {
    modelo_original: "AC24-200",
    modelo_varta: "V24-200",
    precio_varta: 275.85,
    categoria: "Marino",
    disponible: true
  }
]

/**
 * Busca una equivalencia Varta para un modelo específico
 * @param marca - La marca del producto (ej: 'Varta')
 * @param tipo - El tipo de producto (ej: 'Automotriz')
 * @param modelo - El modelo del producto (ej: 'AC12-100')
 * @param capacidad - La capacidad del producto (ej: '100Ah')
 * @returns La equivalencia Varta si existe, null si no se encuentra
 */
export function buscarEquivalenciaVarta(marca: string, tipo: string, modelo: string, capacidad?: string): EquivalenciaVarta | null {
  try {
    // Normalizar el modelo para búsqueda (mayúsculas, sin espacios)
    const modeloNormalizado = modelo.trim().toUpperCase()
    const tipoNormalizado = tipo.trim().toUpperCase()
    
    console.log(`🔍 Búsqueda de equivalencia Varta:`)
    console.log(`   - Marca: ${marca}`)
    console.log(`   - Tipo: ${tipo}`)
    console.log(`   - Modelo: ${modelo}`)
    console.log(`   - Capacidad: ${capacidad || 'N/A'}`)
    
    // Buscar coincidencia exacta por modelo
    let equivalencia = equivalenciasVarta.find(
      eq => eq.modelo_original.toUpperCase() === modeloNormalizado
    )
    
    // Si no hay coincidencia exacta, buscar por tipo y modelo
    if (!equivalencia) {
      equivalencia = equivalenciasVarta.find(
        eq => eq.modelo_original.toUpperCase().includes(modeloNormalizado) &&
              eq.categoria.toUpperCase() === tipoNormalizado
      )
    }
    
    // Si aún no hay coincidencia, buscar por patrón
    if (!equivalencia) {
      const patron = modeloNormalizado.replace(/\d+/g, '\\d+')
      const regex = new RegExp(patron, 'i')
      equivalencia = equivalenciasVarta.find(
        eq => regex.test(eq.modelo_original) &&
              eq.categoria.toUpperCase() === tipoNormalizado
      )
    }
    
    console.log(`   - Resultado: ${equivalencia ? '✅ Encontrada' : '❌ No encontrada'}`)
    
    return equivalencia || null
  } catch (error) {
    console.error('❌ Error buscando equivalencia Varta:', error)
    return null
  }
}

/**
 * Obtiene todas las equivalencias Varta disponibles
 * @returns Array con todas las equivalencias
 */
export function obtenerTodasLasEquivalencias(): EquivalenciaVarta[] {
  return [...equivalenciasVarta]
}

/**
 * Obtiene equivalencias por categoría
 * @param categoria - La categoría a filtrar
 * @returns Array con las equivalencias de la categoría
 */
export function obtenerEquivalenciasPorCategoria(categoria: string): EquivalenciaVarta[] {
  return equivalenciasVarta.filter(eq => 
    eq.categoria.toLowerCase() === categoria.toLowerCase()
  )
}

/**
 * Verifica si un modelo tiene equivalencia Varta
 * @param modeloOriginal - El modelo a verificar
 * @returns true si tiene equivalencia, false si no
 */
export function tieneEquivalenciaVarta(modeloOriginal: string): boolean {
  return buscarEquivalenciaVarta(modeloOriginal) !== null
}

/**
 * Obtiene estadísticas de la base de datos
 * @returns Objeto con estadísticas
 */
export function obtenerEstadisticasVarta() {
  const total = equivalenciasVarta.length
  const disponibles = equivalenciasVarta.filter(eq => eq.disponible).length
  const categorias = [...new Set(equivalenciasVarta.map(eq => eq.categoria))]
  
  return {
    total,
    disponibles,
    noDisponibles: total - disponibles,
    categorias: categorias.length,
    listaCategorias: categorias
  }
}
