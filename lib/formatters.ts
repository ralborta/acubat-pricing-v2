/**
 * 🎯 FUNCIONES DE FORMATEO PARA ARGENTINA
 * 
 * En Argentina se usa:
 * - Punto (.) como separador de miles
 * - Coma (,) como separador decimal
 * 
 * Ejemplos:
 * - $1.234.567,89 (un millón doscientos treinta y cuatro mil quinientos sesenta y siete con ochenta y nueve centavos)
 * - $1.000 (mil pesos)
 */

/**
 * Formatea un número como moneda argentina
 * @param amount - El número a formatear
 * @param showDecimals - Si mostrar decimales (default: false)
 * @returns String formateado como moneda argentina
 */
export function formatCurrency(amount: number | string, showDecimals: boolean = false): string {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '$0'
  }
  
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0
  }).format(amount)
}

/**
 * Formatea un número con separadores de miles argentinos
 * @param amount - El número a formatear
 * @param showDecimals - Si mostrar decimales (default: false)
 * @returns String formateado con separadores argentinos
 */
export function formatNumber(amount: number | string, showDecimals: boolean = false): string {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '0'
  }
  
  return new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0
  }).format(amount)
}

/**
 * Formatea un porcentaje
 * @param amount - El número a formatear como porcentaje
 * @param decimals - Número de decimales (default: 1)
 * @returns String formateado como porcentaje
 */
export function formatPercentage(amount: number | string, decimals: number = 1): string {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '0%'
  }
  
  return `${amount.toFixed(decimals)}%`
}

/**
 * Parsea un string de número en formato argentino a número
 * @param value - String con el número en formato argentino
 * @returns Número parseado o 0 si no es válido
 */
export function parseArgentineNumber(value: string): number {
  if (!value || typeof value !== 'string') {
    return 0
  }
  
  // Limpiar el string: quitar puntos (separadores de miles) y reemplazar coma por punto
  const valorLimpio = value.replace(/\./g, '').replace(',', '.')
  const valor = parseFloat(valorLimpio)
  
  return isNaN(valor) ? 0 : valor
}

/**
 * Valida si un string está en formato de número argentino
 * @param value - String a validar
 * @returns true si es un número válido en formato argentino
 */
export function isValidArgentineNumber(value: string): boolean {
  if (!value || typeof value !== 'string') {
    return false
  }
  
  // Patrón para números argentinos: 1.234.567,89 o 1.234.567
  const argentineNumberPattern = /^\d{1,3}(\.\d{3})*(,\d{1,2})?$/
  return argentineNumberPattern.test(value.trim())
}
