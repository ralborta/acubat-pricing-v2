/**
 * Detección inteligente de fila de encabezados en Excel
 * Resuelve el problema de __EMPTY_* cuando los headers no están en la primera fila
 */

import * as XLSX from 'xlsx';
import { normHeader } from './headers';

const HEADER_CANDIDATES = [
  'precio de lista',
  'precio lista',
  'precio',
  'precio unitario',
  'precio base',
  'pvp off line',
  'contado',
  'codigo baterias',
  'codigo',
  'código',
  'descripcion modelo sap', // Para Moura
  'descripción modelo sap', // Para Moura
  'tipo',
  'modelo',
  'descripcion',
  'marca',
  'familia',
  'rubro',
  'stock',
  'disponibilidad',
];

/**
 * Verifica si una fila parece ser una fila de encabezados
 */
function isHeaderRow(cells: string[]): boolean {
  const norm = cells.map(c => normHeader(String(c || '')));
  let hits = 0;
  
  for (const cand of HEADER_CANDIDATES) {
    const normCand = normHeader(cand);
    if (norm.some(c => c.includes(normCand) || normCand.includes(c))) {
      hits++;
    }
  }
  
  // Si matchea al menos 2-3 "conceptos", la consideramos fila header
  return hits >= 2;
}

/**
 * Busca la fila que contiene los encabezados reales
 * Busca en las primeras 20 filas
 */
function findHeaderRow(aoa: any[][]): { rowIdx: number; headers: string[] } | null {
  for (let i = 0; i < Math.min(20, aoa.length); i++) {
    const row = (aoa[i] || []).map(v => (v == null ? '' : String(v)));
    
    if (isHeaderRow(row)) {
      // Completar vacíos para evitar __EMPTY_*
      const headers = row.map((h, idx) => {
        const clean = String(h || '').trim();
        return clean ? clean : `col_${idx + 1}`;
      });
      
      console.log(`✅ Fila de encabezados detectada en fila ${i + 1}:`, headers);
      return { rowIdx: i, headers };
    }
  }
  
  return null;
}

/**
 * Lee una hoja de Excel con detección inteligente de encabezados
 * Resuelve el problema de __EMPTY_* en archivos XLS viejos
 */
export function readWithSmartHeader(ws: XLSX.WorkSheet): any[] {
  // 1) Leer en modo matriz para detectar encabezados
  const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as any[][];
  
  if (!aoa || aoa.length === 0) {
    console.warn('⚠️ Hoja vacía');
    return [];
  }
  
  const hdr = findHeaderRow(aoa);

  if (!hdr) {
    // Fallback: seguimos con el método estándar pero avisamos
    console.warn('⚠️ No se detectó fila de encabezados, usando primera fila como headers');
    return XLSX.utils.sheet_to_json(ws, { defval: '' });
  }

  // 2) Re-leer con headers detectados y range desde esa fila
  const range = XLSX.utils.decode_range(ws['!ref']!);
  range.s.r = hdr.rowIdx + 1; // datos empiezan después de headers
  const ref = XLSX.utils.encode_range(range);

  const data = XLSX.utils.sheet_to_json(ws, {
    header: hdr.headers,
    range: ref,
    defval: ''
  });

  console.log(`✅ Datos leídos: ${data.length} filas desde fila ${hdr.rowIdx + 2}`);
  return data;
}

/**
 * Verifica si una fila es una fila de producto (no TOTAL, no vacía, etc)
 */
export function isProductRow(row: Record<string, any>): boolean {
  if (!row) return false;
  
  const values = Object.values(row);
  const strings = values.map(v => String(v || '').toLowerCase().trim());
  
  // Descartar si tiene "total" en cualquier columna
  if (strings.some(v => v.includes('total'))) {
    return false;
  }
  
  // Descartar si tiene "subtotal"
  if (strings.some(v => v.includes('subtotal'))) {
    return false;
  }
  
  // Descartar si todas las columnas están vacías
  if (strings.every(v => !v || v === '0')) {
    return false;
  }
  
  // Descartar si parece ser un separador (línea con solo guiones o ===)
  if (strings.some(v => /^[-=_]{3,}$/.test(v))) {
    return false;
  }
  
  return true;
}

