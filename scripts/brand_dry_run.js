/*
  Dry-run de detección de marca por hoja (solo lectura).
  Uso:
    node scripts/brand_dry_run.js \
      "/abs/path/archivo1.xlsx" \
      "/abs/path/archivo2.xlsx"

  - Si OPENAI_API_KEY está definido, usa IA (gpt-4o-mini) para mejorar.
  - Si no, usa heurísticas por nombre de archivo/hoja + tokens en columnas de texto.
*/

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const BRAND_LEX = [
  'lusqtoff', 'lq', 'liqui moly', 'liqui', 'moly', 'moura', 'varta',
  'motul', 'shell', 'elf', 'bosch', 'makita', 'dewalt', 'stanley',
  'ngk', 'pirelli', 'metzeler', 'yuasa', 'agv', 'protork', 'riffel'
];

async function callLLM(model, contexto) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not set');
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      max_tokens: 300,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'Responde SOLO con JSON válido con las claves: marca, confianza, fuente.' },
        { role: 'user', content: contexto },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}`);
  const j = await res.json();
  return JSON.parse(j.choices[0].message.content);
}

async function detectarMarcaConIA(nombreArchivo, nombreHoja, headers, datos) {
  // Heurística rápida por nombre
  const quickText = `${nombreArchivo} ${nombreHoja}`.toLowerCase();
  const quickHit = BRAND_LEX.find((b) => quickText.includes(b));
  if (quickHit) {
    return { marca: quickHit.toUpperCase(), confianza: 75, fuente: 'filename/sheet', ia_used: false };
  }

  if (!process.env.OPENAI_API_KEY) {
    return { marca: '', confianza: 0, fuente: 'heuristica_sin_ia', ia_used: false };
  }

  const contexto = `Eres un extractor de marcas. Devuelve SOLO JSON con {"marca":string,"confianza":number,"fuente":string}. Si no ves una marca clara, marca="" y confianza=0.
Archivo: ${nombreArchivo}
Hoja: ${nombreHoja}
HEADERS: ${JSON.stringify(headers)}
MUESTRA(<=10): ${JSON.stringify(datos.slice(0, 10))}`;

  try {
    const r = await callLLM('gpt-4o-mini', contexto);
    return {
      marca: String(r.marca || '').toUpperCase(),
      confianza: Number(r.confianza || 0),
      fuente: String(r.fuente || 'ia'),
      ia_used: true,
    };
  } catch (e) {
    return { marca: '', confianza: 0, fuente: `ia_error:${e.message}`, ia_used: true };
  }
}

async function analyzeFile(absPath) {
  if (!fs.existsSync(absPath)) return { file: absPath, missing: true };
  const name = path.basename(absPath);
  const wb = XLSX.readFile(absPath, { cellDates: false });
  const out = { file: name, sheets: [] };
  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(ws, { defval: '' });
    if (!json.length) {
      out.sheets.push({ sheet: sheetName, marca: '', confianza: 0, fuente: 'vacia' });
      continue;
    }
    const headers = Object.keys(json[0]);
    const muestra = json.slice(0, 50);
    const det = await detectarMarcaConIA(name, sheetName, headers, muestra);
    out.sheets.push({ sheet: sheetName, ...det });
  }
  return out;
}

(async () => {
  const files = process.argv.slice(2);
  if (!files.length) {
    console.error('Usage: node scripts/brand_dry_run.js "/abs/path/file.xlsx" ...');
    process.exit(1);
  }
  const results = [];
  for (const f of files) {
    // Expand ~ if present
    const abs = f.startsWith('~') ? path.join(process.env.HOME || '', f.slice(1)) : f;
    results.push(await analyzeFile(abs));
  }
  console.log(JSON.stringify(results, null, 2));
})().catch((e) => {
  console.error('ERR', e);
  process.exit(1);
});


