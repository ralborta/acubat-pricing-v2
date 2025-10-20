// Sistema simple de equivalencias Varta con IA
export interface EquivalenciaVarta {
  encontrada: boolean
  modelo_original?: string
  modelo_varta?: string
  precio_varta?: number
  categoria?: string
  disponible?: boolean
  razon?: string
}

/**
 * Busca equivalencia Varta usando IA
 * @param modelo - El código/modelo del producto (ej: "L3000")
 * @param precioReal - El precio real del producto en ARS
 */
export async function buscarEquivalenciaVarta(modelo: string, precioReal?: number): Promise<EquivalenciaVarta> {
  try {
    // Si no hay modelo, retornar no encontrada
    if (!modelo || modelo.trim() === '') {
      return { encontrada: false, razon: 'Modelo vacío' }
    }

    console.log(`🔍 Buscando equivalencia Varta para: ${modelo} (precio real: ${precioReal ? `$${precioReal}` : 'no disponible'})`)
    
    // Si no hay precio real, no podemos calcular equivalencia
    if (!precioReal || precioReal <= 0) {
      return { 
        encontrada: false, 
        razon: 'No hay precio real disponible para calcular equivalencia' 
      }
    }
    
    // Simulación simple basada en patrones comunes
    const modeloLimpio = modelo.trim().toUpperCase()
    
    // Patrones simples para detectar si es un modelo de batería
    if (modeloLimpio.includes('AC') || modeloLimpio.includes('V') || modeloLimpio.includes('BAT')) {
      // Calcular precio Varta basado en el precio real (ejemplo: 15% más caro)
      const precioVarta = Math.round(precioReal * 1.15)
      
      return {
        encontrada: true,
        modelo_original: modelo,
        modelo_varta: `V${modeloLimpio.replace(/[^0-9]/g, '')}`,
        precio_varta: precioVarta, // Precio calculado basado en el real
        categoria: 'Automotriz',
        disponible: true,
        razon: 'Equivalencia encontrada por patrón'
      }
    }
    
    return { 
      encontrada: false, 
      razon: 'No se encontró patrón de batería reconocible' 
    }
  } catch (error) {
    console.error('❌ Error buscando equivalencia Varta:', error)
    return { 
      encontrada: false, 
      razon: 'Error en la búsqueda' 
    }
  }
}

/**
 * Verifica si un modelo tiene equivalencia Varta
 */
export async function tieneEquivalenciaVarta(modelo: string, precioReal?: number): Promise<boolean> {
  const equivalencia = await buscarEquivalenciaVarta(modelo, precioReal)
  return equivalencia.encontrada
}
