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
export function resolverColumnaPrecio(headers: string[]): string | null {
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

  // ⚠️ NOTA: El fallback de "Contado" se maneja en getPrecioSeguro() SOLO para MOURA
  // No se aplica aquí para evitar que afecte a otros proveedores

  console.warn(`⚠️ NO se encontró columna de precio. Headers disponibles:`, headers);
  return null;
}

/** Obtiene una celda por "intención" (precio) de una fila */
export function getCellPrecioFlexible(row: Row): any {
  const headers = Object.keys(row || {});
  const col = resolverColumnaPrecio(headers);
  return col ? row[col] : undefined;
}

