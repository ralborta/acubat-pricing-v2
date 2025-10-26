import * as XLSX from "xlsx";

const USD_RE = /(USD|U\$S|\$US|DÓLAR|DOLAR)/i;

// Heurística numérica: muchos precios en rango "tipo USD"
function looksLikeUsdNumbers(nums: number[]) {
  if (nums.length < 8) return false;
  const filtered = nums.filter(n => Number.isFinite(n) && n > 0);
  if (filtered.length < 8) return false;
  // % de valores entre 1 y 500 aprox (precios comunes en USD)
  const within = filtered.filter(n => n >= 1 && n <= 500);
  return within.length / filtered.length >= 0.6;
}

// Lee primeras N filas sin pasar por sheet_to_json (usa cell.w / cell.v)
export function detectWorkbookIsUSD(workbook: XLSX.WorkBook, maxRows = 20): boolean {
  let sawUsdText = false;
  const nums: number[] = [];

  for (const sheetName of workbook.SheetNames) {
    const ws = workbook.Sheets[sheetName];
    if (!ws || !ws["!ref"]) continue;

    const range = XLSX.utils.decode_range(ws["!ref"]);
    const lastRow = Math.min(range.e.r, maxRows - 1);

    for (let r = range.s.r; r <= lastRow; r++) {
      for (let c = range.s.c; c <= range.e.c; c++) {
        const addr = XLSX.utils.encode_cell({ r, c });
        const cell = ws[addr];
        if (!cell) continue;

        // 1) Texto formateado original
        if (cell.w && USD_RE.test(cell.w)) {
          sawUsdText = true;
          console.log(`💵 USD detectado en celda ${addr}: "${cell.w}"`)
          break;
        }

        // 2) Formato de celda (z) a veces contiene el símbolo o patrón
        if (typeof cell.z === "string" && USD_RE.test(cell.z)) {
          sawUsdText = true;
          console.log(`💵 USD detectado en formato de celda ${addr}: "${cell.z}"`)
          break;
        }

        // 3) Si es numérica, la usamos para la heurística
        if (typeof cell.v === "number" && Number.isFinite(cell.v)) {
          nums.push(cell.v);
        }
      }
      if (sawUsdText) break;
    }
    if (sawUsdText) break;

    // 4) Pistas en el nombre de la hoja
    if (USD_RE.test(sheetName)) {
      sawUsdText = true;
      console.log(`💵 USD detectado en nombre de hoja: "${sheetName}"`)
      break;
    }
  }

  if (sawUsdText) return true;
  
  // Heurística numérica como último recurso
  const numericDetect = looksLikeUsdNumbers(nums);
  if (numericDetect) {
    console.log(`💵 USD detectado por heurística numérica (${nums.length} valores analizados)`)
  }
  
  return numericDetect;
}

