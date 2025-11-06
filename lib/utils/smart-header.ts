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
  'cuotas',
  'codigo baterias',
  'codigo',
  'código',
  'descripcion modelo sap', // Para Moura
  'descripción modelo sap', // Para Moura
  'denominacion comercial', // Para Moura
  'denominación comercial', // Para Moura
  'grupo bci', // Para Moura
  'c20',
  'c.a.',
  'c.c.a.',
  'borne',
  'largo',
  'ancho',
  'alto',
  'tipo',
  'modelo',
  'descripcion',
  'descripción',
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
  
  // Si matchea al menos 1 "concepto", la consideramos fila header (RELAJADO para Moura y otros formatos)
  // Nota: antes requería 2 hits, pero algunos archivos tienen headers menos estándar
  return hits >= 1;
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
 * Combina múltiples filas de encabezado en una sola
 * Útil para archivos con encabezados multi-fila (ej: LUSQTOFF)
 * Estrategia: Las filas posteriores completan/sobrescriben celdas vacías de las anteriores
 */
function combineMultiRowHeaders(aoa: any[][], startRow: number, maxRows: number = 3): string[] {
  const maxCols = Math.max(...aoa.slice(startRow, startRow + maxRows).map(row => row?.length || 0), 0);
  const combined: string[] = new Array(maxCols).fill('');
  
  // Combinar filas: Las filas posteriores completan/sobrescriben celdas vacías de las anteriores
  // Estrategia del ejemplo: Si una celda tiene valor, la usa (sobrescribe si la anterior estaba vacía)
  for (let rowOffset = 0; rowOffset < maxRows && startRow + rowOffset < aoa.length; rowOffset++) {
    const row = aoa[startRow + rowOffset] || [];
    
    for (let col = 0; col < maxCols; col++) {
      const cell = String(row[col] || '').trim();
      if (cell) {
        // Si la celda combinada está vacía, usar el valor de esta fila
        // Si ya tiene valor, la fila posterior sobrescribe (como en el ejemplo del usuario)
        // Esto funciona para LUSQTOFF donde fila 2 tiene "LINK, MARCA, CODIGO..." 
        // y fila 3 tiene "(unid), Vol. B (Unid), PVP Off Line..." en diferentes columnas
        combined[col] = cell;
      }
    }
  }
  
  // Limpiar: reemplazar strings vacíos con nombres de columna genéricos
  return combined.map((h, idx) => h || `col_${idx + 1}`);
}

/**
 * Lee una hoja de Excel con detección inteligente de encabezados
 * Resuelve el problema de __EMPTY_* en archivos XLS viejos
 * Soporta encabezados multi-fila (ej: LUSQTOFF)
 */
export function readWithSmartHeader(ws: XLSX.WorkSheet): any[] {
  // 1) Leer en modo matriz para detectar encabezados
  const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) as any[][];
  
  if (!aoa || aoa.length === 0) {
    console.warn('⚠️ Hoja vacía (AOA vacío)');
    return [];
  }
  
  console.log(`🔍 Buscando headers en hoja (${aoa.length} filas AOA)...`);
  
  // 🎯 NUEVO: Intentar detectar encabezados multi-fila (filas consecutivas con headers)
  let multiRowHeaderStart = -1;
  let multiRowHeaderCount = 0;
  
  for (let i = 0; i < Math.min(10, aoa.length); i++) {
    const row = (aoa[i] || []).map(v => (v == null ? '' : String(v)));
    if (isHeaderRow(row)) {
      if (multiRowHeaderStart < 0) {
        multiRowHeaderStart = i;
        multiRowHeaderCount = 1;
      } else if (i === multiRowHeaderStart + multiRowHeaderCount) {
        // Fila consecutiva con headers
        multiRowHeaderCount++;
      }
    }
  }
  
  // Si encontramos 2+ filas consecutivas con headers, usar combinación multi-fila
  if (multiRowHeaderCount >= 2 && multiRowHeaderStart >= 0) {
    console.log(`✅ Detectado encabezado multi-fila (${multiRowHeaderCount} filas) desde fila ${multiRowHeaderStart + 1}`);
    const combinedHeaders = combineMultiRowHeaders(aoa, multiRowHeaderStart, multiRowHeaderCount);
    console.log(`📋 Headers combinados:`, combinedHeaders.slice(0, 15));
    
    // Leer datos desde después de las filas de header
    const range = ws['!ref'] ? XLSX.utils.decode_range(ws['!ref']) : XLSX.utils.decode_range('A1:Z1000');
    range.s.r = multiRowHeaderStart + multiRowHeaderCount; // datos empiezan después de headers
    const ref = XLSX.utils.encode_range(range);
    
    try {
      const data = XLSX.utils.sheet_to_json(ws, {
        header: combinedHeaders,
        range: ref,
        defval: ''
      });
      
      console.log(`✅ Datos leídos (multi-fila): ${data.length} filas desde fila ${multiRowHeaderStart + multiRowHeaderCount + 1}`);
      return data;
    } catch (e: any) {
      console.warn(`⚠️ Error con multi-fila, intentando método estándar:`, e?.message);
    }
  }
  
  const hdr = findHeaderRow(aoa);

  if (!hdr) {
    // Fallback mejorado: buscar primera fila con datos no vacíos
    console.warn('⚠️ No se detectó fila de encabezados con candidatos estándar, buscando primera fila con datos...');
    console.log(`📋 Muestra de primeras 5 filas AOA:`, aoa.slice(0, 5).map((row, idx) => ({
      fila: idx + 1,
      columnas: row.slice(0, 5).map(c => String(c || '').substring(0, 30))
    })));
    
    // Buscar primera fila que tenga al menos 3 columnas no vacías (más estricto para headers)
    let primeraFilaConDatos = -1;
    for (let i = 0; i < Math.min(20, aoa.length); i++) {
      const row = aoa[i] || [];
      const noVacias = row.filter(c => c != null && String(c).trim() !== '').length;
      console.log(`  📊 Fila ${i + 1}: ${noVacias} columnas no vacías`, row.slice(0, 3).map(c => String(c || '').substring(0, 20)));
      
      if (noVacias >= 3) { // Al menos 3 columnas para ser considerado header
        primeraFilaConDatos = i;
        console.log(`✅ Primera fila con datos encontrada en fila ${i + 1} (${noVacias} columnas no vacías)`);
        break;
      }
    }
    
    if (primeraFilaConDatos >= 0) {
      // Usar esa fila como headers
      const headersFila = (aoa[primeraFilaConDatos] || []).map((h, idx) => {
        const clean = String(h || '').trim();
        return clean || `col_${idx + 1}`;
      });
      
      console.log(`📋 Headers extraídos (fila ${primeraFilaConDatos + 1}):`, headersFila.slice(0, 10));
      
      // Intentar leer con range
      try {
        const range = ws['!ref'] ? XLSX.utils.decode_range(ws['!ref']) : XLSX.utils.decode_range('A1:Z1000');
        range.s.r = primeraFilaConDatos + 1; // datos empiezan después de headers
        const ref = XLSX.utils.encode_range(range);
        
        const data = XLSX.utils.sheet_to_json(ws, {
          header: headersFila,
          range: ref,
          defval: ''
        });
        
        console.log(`✅ Datos leídos (fallback con range): ${data.length} filas desde fila ${primeraFilaConDatos + 2}`);
        return data;
      } catch (e: any) {
        console.warn(`⚠️ Error con range, intentando sin range:`, e?.message);
        // Intentar sin range
        const data = XLSX.utils.sheet_to_json(ws, {
          header: headersFila,
          defval: ''
        });
        console.log(`✅ Datos leídos (fallback sin range): ${data.length} filas`);
        return data;
      }
    }
    
    // Último fallback: método estándar - usar primera fila como headers SIN importar qué tenga
    console.warn('⚠️ Usando método estándar XLSX (primera fila como headers) - FALLBACK FINAL');
    try {
      const dataStd = XLSX.utils.sheet_to_json(ws, { defval: '' });
      console.log(`✅ Datos leídos (método estándar): ${dataStd.length} filas`);
      if (dataStd.length > 0) {
        console.log(`📋 Headers detectados (método estándar):`, Object.keys(dataStd[0] || {}).slice(0, 10));
      }
      return dataStd;
    } catch (e: any) {
      console.error(`❌ Error incluso con método estándar:`, e?.message);
      return [];
    }
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
  
  // Descartar si todas las columnas están vacías
  if (strings.every(v => !v || v === '0')) {
    return false;
  }
  
  // Descartar si parece ser un separador (línea con solo guiones o ===)
  if (strings.some(v => /^[-=_]{3,}$/.test(v))) {
    return false;
  }
  
  // RELAJADO: No descartar por "total" o "subtotal" automáticamente
  // Puede ser parte del nombre de un producto. La IA decidirá.
  
  return true;
}

