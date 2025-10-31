/**
 * Resuelve columnas de precio con sinónimos + prioridad + bloqueo de columnas incorrectas
 * Evita que "TIPO", "CÓDIGO", "MODELO" se confundan con precio
 */

import { normHeader } from './headers';

type Row = Record<string, any>;

// Alias de precio (sin incluir "contado" que será fallback)
const PRECIO_ALIASES = [
  'precio de lista',
  'precio lista',
  'precio',
  'p. lista',
  'p lista',
  'precio unitario',
  'precio base',
  'p lista s/iva',
  'precio s/iva',
  'precio 1',
  'pdv',
  'pvp',
];

// Alias de fallback cuando no se encuentra precio principal
const PRECIO_FALLBACK_ALIASES = [
  'contado',
  'cash',
  'efectivo',
];

const BLOQUEADAS = [
  'tipo', 
  'codigo baterias', 
  'codigo', 
  'modelo', 
  'denominacion comercial',
  'descripcion', 
  'familia', 
  'categoria', 
  'alto', 
  'ancho', 
  'largo', 
  'cca',
  'capacidad',
  'voltaje',
  'sku',
  'marca',
];

function wordEq(a: string, b: string): boolean {
  // Igualdad por palabra completa
  const re = new RegExp(`(^|\\b)${b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\b|$)`);
  return re.test(a);
}

/** Devuelve el nombre de la columna que corresponde a "Precio de Lista" o null */
// 🛑 CORRECCIÓN: Añadir 'esMoura' como parámetro
export function resolverColumnaPrecio(headers: string[], esMoura: boolean = false): string | null {
  if (!headers?.length) return null;

  const normMap = new Map<string, string>(); // norm -> original
  const normHeaders = headers.map(h => {
    const n = normHeader(h);
    normMap.set(n, h);
    return n;
  });

  // 1) Match exacto por alias normalizado (PRIORIDAD: buscar primero precios principales)
  for (const alias of PRECIO_ALIASES) {
    const nAlias = normHeader(alias);
    const foundIdx = normHeaders.findIndex(h => h === nAlias);
    if (foundIdx >= 0) {
      const original = normMap.get(normHeaders[foundIdx])!;
      console.log(`✅ Columna precio encontrada (match exacto): "${original}" (alias: "${alias}")`);
      return original;
    }
  }

  // 2) Match por palabra completa (evita que "tipo" matchee "precio")
  for (const alias of PRECIO_ALIASES) {
    const nAlias = normHeader(alias);
    const foundIdx = normHeaders.findIndex(h => wordEq(h, nAlias));
    if (foundIdx >= 0) {
      const original = normMap.get(normHeaders[foundIdx])!;
      console.log(`✅ Columna precio encontrada (match palabra): "${original}" (alias: "${alias}")`);
      return original;
    }
  }

  // 3) Match fuerte por tokens (precio & lista presentes)
  const strong = normHeaders.find(h => {
    if (BLOQUEADAS.includes(h)) return false;
    return /\bprecio\b/.test(h) && (/\blista\b/.test(h) || /\bunitario\b/.test(h) || /\bbase\b/.test(h));
  });
  if (strong) {
    const original = normMap.get(strong)!;
    console.log(`✅ Columna precio encontrada (match fuerte): "${original}"`);
    return original;
  }

  // 4) FALLBACK: Si no se encontró precio principal, buscar "Contado" y sinónimos (SOLO MOURA)
  // 🛑 CORRECCIÓN: Envolver toda la lógica de fallback en 'if (esMoura)'
  if (esMoura) {
    console.log(`⚠️ No se encontró columna de precio principal, buscando fallback "Contado" (MOURA)...`);
    for (const alias of PRECIO_FALLBACK_ALIASES) {
      const nAlias = normHeader(alias);
      const foundIdx = normHeaders.findIndex(h => h === nAlias);
      if (foundIdx >= 0) {
        const original = normMap.get(normHeaders[foundIdx])!;
        console.log(`✅ Columna precio encontrada (fallback match exacto): "${original}" (alias: "${alias}")`);
        return original;
      }
    }

    // 5) FALLBACK: Match por palabra completa en alias de fallback (SOLO MOURA)
    for (const alias of PRECIO_FALLBACK_ALIASES) {
      const nAlias = normHeader(alias);
      const foundIdx = normHeaders.findIndex(h => wordEq(h, nAlias));
      if (foundIdx >= 0) {
        const original = normMap.get(normHeaders[foundIdx])!;
        console.log(`✅ Columna precio encontrada (fallback match palabra): "${original}" (alias: "${alias}")`);
        return original;
      }
    }
  } // <-- Fin del 'if (esMoura)'

  console.warn(`⚠️ NO se encontró columna de precio (ni principal ni fallback). Headers disponibles:`, headers);
  return null;
}

/** Obtiene una celda por "intención" (precio) de una fila */
export function getCellPrecioFlexible(row: Row, esMoura: boolean = false): any {
  const headers = Object.keys(row || {});
  const col = resolverColumnaPrecio(headers, esMoura);
  return col ? row[col] : undefined;
}

