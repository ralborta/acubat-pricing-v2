/**
 * Función "precio seguro" para extraer precios de filas de Excel
 * - Usa resolver de columna (evita confusión con "Tipo", "Código", etc)
 * - Valida que sea numérico real
 * - Deja trazas útiles
 */

import { getCellPrecioFlexible } from './column-resolver';
import { parseLocaleNumber } from '../parse-number';

export function getPrecioSeguro(row: Record<string, any>): number | null {
  // 1) priorizar si la celda ya vino numérica (XLSX bien tipado)
  const bruto = getCellPrecioFlexible(row);
  
  if (bruto === undefined || bruto === null || bruto === '') {
    console.log(`❌ No se encontró valor en columna de precio`);
    return null;
  }
  
  console.log(`🔍 Valor bruto de columna precio: "${bruto}" (tipo: ${typeof bruto})`);
  
  if (typeof bruto === 'number' && Number.isFinite(bruto)) {
    if (bruto > 0 && bruto < 10_000_000) {
      console.log(`✅ Precio numérico directo: ${bruto}`);
      return bruto;
    }
    console.log(`❌ Precio fuera de rango: ${bruto}`);
    return null;
  }

  // 2) si viene string -> parse robusto
  const n = parseLocaleNumber(bruto);
  if (n == null) {
    console.log(`❌ No se pudo parsear: "${bruto}"`);
    return null;
  }

  // 3) guardrails de rango
  if (!(n > 0 && n < 10_000_000)) {
    console.log(`❌ Precio parseado fuera de rango: ${n}`);
    return null;
  }

  console.log(`✅ Precio parseado: ${n}`);
  return n;
}

