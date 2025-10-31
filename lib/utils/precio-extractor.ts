/**
 * Función "precio seguro" para extraer precios de filas de Excel
 * - Usa resolver de columna (evita confusión con "Tipo", "Código", etc)
 * - Valida que sea numérico real
 * - Deja trazas útiles
 */

import { getCellPrecioFlexible } from './column-resolver';
import { parseLocaleNumber } from '../parse-number';
import { normHeader } from './headers';

// Fallback posicional para proveedores específicos cuando headers son __EMPTY_*
const FALLBACK_POSICIONAL: Record<string, string[]> = {
  'MOURA': ['__EMPTY_15', 'col_15', '__EMPTY_14', 'col_14'], // columna 15-16 suele tener precio
};

export function getPrecioSeguro(row: Record<string, any>, proveedor?: string): number | null {
  // 1) Intentar con resolver de columnas (método principal)
  let bruto = getCellPrecioFlexible(row);
  
  // 2) Si no se encontró valor válido, buscar explícitamente en "Contado" como fallback SOLO PARA MOURA
  const esMoura = proveedor && proveedor.toUpperCase().includes('MOURA');
  if ((bruto === undefined || bruto === null || bruto === '') && esMoura) {
    console.log(`⚠️ No se encontró valor en columna de precio principal, buscando en "Contado" (SOLO MOURA)...`);
    const headers = Object.keys(row || {});
    const contadoPatterns = ['contado', 'cash', 'efectivo'];
    
    // Buscar columna "Contado" con normalización flexible
    for (const pattern of contadoPatterns) {
      const normPattern = normHeader(pattern);
      for (const header of headers) {
        if (header && typeof header === 'string') {
          const normHeaderName = normHeader(header);
          // Buscar match exacto o parcial
          if (normHeaderName === normPattern || normHeaderName.includes(normPattern)) {
            const valor = row[header];
            if (valor !== undefined && valor !== null && valor !== '') {
              bruto = valor;
              console.log(`✅ Valor encontrado en columna "Contado" (${header}): "${bruto}"`);
              break;
            }
          }
        }
      }
      if (bruto !== undefined && bruto !== null && bruto !== '') break;
    }
  }
  
  // 3) Fallback posicional si no se encontró y tenemos proveedor conocido
  if ((bruto === undefined || bruto === null || bruto === '') && proveedor) {
    const proveedorUpper = proveedor.toUpperCase();
    const fallbacks = FALLBACK_POSICIONAL[proveedorUpper];
    
    if (fallbacks) {
      console.log(`⚠️ No se encontró por nombre, intentando fallback posicional para ${proveedorUpper}`);
      for (const col of fallbacks) {
        if (row[col] !== undefined && row[col] !== null && row[col] !== '') {
          bruto = row[col];
          console.log(`✅ Valor encontrado en columna posicional '${col}': "${bruto}"`);
          break;
        }
      }
    }
  }
  
  if (bruto === undefined || bruto === null || bruto === '') {
    console.log(`❌ No se encontró valor en columna de precio (ni por nombre ni posicional ni contado)`);
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

