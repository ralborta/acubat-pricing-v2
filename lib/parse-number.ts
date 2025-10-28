/**
 * Parsea un número desde cualquier formato locale (AR, US, etc.)
 * Maneja: puntos como miles, comas como decimal, negativos, paréntesis, monedas
 * 
 * Casos cubiertos:
 * - "USD 124,99" → 124.99
 * - "$ 17.998,56" → 17998.56
 * - "1.234.567,89" → 1234567.89
 * - "136.490" → 136490 (AR miles)
 * - "123.10" → 123.10 (US decimal)
 * - "($ 2.345,00)" → -2345
 * - 1234.56 (number) → 1234.56
 * - "12 345,67" (espacio miles) → 12345.67
 */
export function parseLocaleNumber(input: unknown): number | null {
  // Si ya es un número válido, retornar directo
  if (typeof input === 'number') {
    return Number.isFinite(input) ? input : null;
  }
  
  if (input == null || input === '') return null;

  // Convertir a string y normalizar
  let s = String(input)
    // Quitar espacios no-break y raros
    .replace(/\u00A0/g, ' ')
    .replace(/\u202F/g, ' ')
    // Quitar moneda y letras (dejamos dígitos, . , - ( ) y espacios)
    .replace(/[^\d.,\-\(\)\s]/g, '')
    .trim();

  if (!s) return null;

  // Detectar negativo por paréntesis
  let negative = false;
  if (/^\(.*\)$/.test(s)) {
    negative = true;
    s = s.slice(1, -1).trim();
  }

  // Quitar espacios intermedios (pueden ser separadores de miles)
  s = s.replace(/\s+/g, '');

  // Detectar separadores presentes
  const hasComma = s.includes(',');
  const hasDot = s.includes('.');

  const toNumber = (normalized: string): number | null => {
    const n = parseFloat(normalized);
    return Number.isFinite(n) ? (negative ? -n : n) : null;
  };

  // CASO 1: Tiene ambos (coma Y punto)
  if (hasComma && hasDot) {
    // El decimal es el separador que aparece más a la derecha
    const lastComma = s.lastIndexOf(',');
    const lastDot = s.lastIndexOf('.');
    
    if (lastComma > lastDot) {
      // Coma es decimal: "1.234,56" → "1234.56"
      const cleaned = s.replace(/\./g, '').replace(',', '.');
      return toNumber(cleaned);
    } else {
      // Punto es decimal: "1,234.56" → "1234.56"
      const cleaned = s.replace(/,/g, '');
      return toNumber(cleaned);
    }
  }

  // CASO 2: Solo coma (sin puntos)
  if (hasComma && !hasDot) {
    // Coma como decimal: "124,99" → "124.99"
    const cleaned = s.replace(',', '.');
    return toNumber(cleaned);
  }

  // CASO 3: Solo punto (sin comas) - CASO MÁS COMPLEJO
  if (!hasComma && hasDot) {
    const parts = s.split('.');
    
    // Si hay múltiples puntos → todos son miles
    if (parts.length > 2) {
      // "1.234.567" → "1234567"
      const cleaned = s.replace(/\./g, '');
      return toNumber(cleaned);
    }
    
    // Un solo punto: analizar parte fraccionaria
    const [intPart, fracPart = ''] = parts;
    
    if (fracPart.length === 3) {
      // Probablemente formato argentino miles: "136.490" → 136490
      const cleaned = s.replace('.', '');
      return toNumber(cleaned);
    }
    
    if (fracPart.length === 2 || fracPart.length === 1) {
      // Probablemente decimal US: "123.10" → 123.10
      return toNumber(s);
    }
    
    // Sin parte fraccionaria clara
    if (intPart.length > 3) {
      // Número grande sin decimales claros → asumir miles
      // "1234." → 1234
      const cleaned = s.replace(/\./g, '');
      return toNumber(cleaned);
    }
    
    // Caso ambiguo pequeño: parsear directo
    return toNumber(s);
  }

  // CASO 4: Sin separadores (número entero simple)
  const cleaned = s.replace(/[^\d\-]/g, '');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? (negative ? -n : n) : null;
}

