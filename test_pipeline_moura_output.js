const XLSX = require('xlsx');
const OpenAI = require('openai');

function normalizarPrecioArs(valor) {
  if (valor == null) return 0;
  const s = String(valor).trim();
  // eliminar símbolo y espacios
  let t = s.replace(/\$/g, '').replace(/ARS|AR\$|\s/g, '');
  // formato argentino: punto miles, coma decimales
  // quitar puntos de miles y cambiar coma por punto
  t = t.replace(/\./g, '').replace(/,/g, '.');
  const n = parseFloat(t);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

(async () => {
  try {
    const archivoPath = '/Users/ralborta/Downloads/Acubat/Lista Moura 04 (1).xlsx';
    const wb = XLSX.readFile(archivoPath);
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    console.log('📋 Hojas:', wb.SheetNames);

    let mejor = null;
    for (let i = 0; i < wb.SheetNames.length; i++) {
      const name = wb.SheetNames[i];
      const ws = wb.Sheets[name];
      // Leer como matriz para detectar una fila de encabezados real dentro de secciones
      const matrix = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      if (!Array.isArray(matrix) || matrix.length === 0) continue;

      // Buscar fila que tenga indicadores de encabezado
      const headerIndicators = ['pvp off line', 'precio de lista', 'precio unitario', 'código', 'codigo', 'descripcion', 'rubro', 'marca'];
      let headerRowIndex = -1;
      for (let r = 0; r < Math.min(matrix.length, 40); r++) {
        const row = (matrix[r] || []).map(c => String(c || '').toLowerCase());
        const nonEmpty = row.filter(x => x.trim() !== '').length;
        const hasIndicator = headerIndicators.some(ind => row.some(cell => cell.includes(ind)));
        if (hasIndicator && nonEmpty >= 3) { headerRowIndex = r; break; }
      }

      // Si no encontramos, usar heurísticas previas (fila 1 o 2 si hace falta)
      if (headerRowIndex < 0) {
        headerRowIndex = 0;
      }

      let datos = XLSX.utils.sheet_to_json(ws, { range: headerRowIndex });
      if (datos.length === 0) continue;
      let headers = Object.keys(datos[0] || {});

      // headers ya fue elegido desde headerRowIndex dinámico

      const pvp = headers.find(h => h && h.toLowerCase().includes('pvp off line'));
      const precioLista = headers.find(h => h && h.toLowerCase().includes('precio de lista'));
      const precioUnitario = headers.find(h => h && h.toLowerCase().includes('precio unitario'));
      const codigo = headers.find(h => h && h.toLowerCase().includes('codigo'));
      const marca = headers.find(h => h && h.toLowerCase().includes('marca'));
      const descripcion = headers.find(h => h && h.toLowerCase().includes('descripcion'));
      const rubro = headers.find(h => h && h.toLowerCase().includes('rubro'));

      // Solo considerar hojas que tengan una columna de precio válida en headers
      const tienePrecioHeader = Boolean(pvp || precioLista || precioUnitario);
      if (!tienePrecioHeader) {
        continue;
      }

      let score = 0;
      if (pvp) score += 5; else if (precioLista) score += 4; else if (precioUnitario) score += 3;
      if (codigo) score += 3;
      if (marca) score += 3;
      if (descripcion) score += 2;
      if (rubro) score += 1;
      if (datos.length >= 10) score += 5; else if (datos.length >= 5) score += 3; else if (datos.length >= 2) score += 1;
      const claves = [pvp || precioLista || precioUnitario, codigo, marca, descripcion, rubro].filter(Boolean).length;
      if (claves >= 3) score += 2;
      if (claves >= 4) score += 3;

      if (!mejor || score > mejor.score) {
        mejor = { name, datos, headers, score };
      }
    }

    if (!mejor) {
      console.log('❌ No se encontró hoja válida.');
      process.exit(0);
    }

    console.log(`\n🎯 Hoja seleccionada: ${mejor.name} (score=${mejor.score}, filas=${mejor.datos.length})`);

    // Llamar IA para mapeo sobre la hoja seleccionada
    const sample = mejor.datos.slice(0, 10);
    const prompt = `Eres un asistente que identifica nombres de columnas en planillas de precios.\n\nREGLAS OBLIGATORIAS:\n- Devuelve SOLO nombres de columnas, NO valores de datos\n- Moneda ARS. Rechaza USD.\n\nPRECIO (prioridad): 1) 'PVP Off Line' 2) 'Precio de Lista' 3) 'Precio Unitario'\nMODELO: 'CODIGO'\nTIPO: 'RUBRO'\nDESCRIPCION: 'DESCRIPCION'\nPROVEEDOR: 'MARCA'\n\nRespuesta JSON:\n{\"tipo\":\"RUBRO\",\"modelo\":\"CODIGO\",\"precio_ars\":\"PVP Off Line\",\"descripcion\":\"DESCRIPCION\",\"proveedor\":\"MARCA\"}\n\nCOLUMNAS: ${mejor.headers.join(', ')}\nMUESTRA: ${JSON.stringify(sample)}\n\nSolo JSON.`;

    const resp = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1
    });
    let text = (resp.choices?.[0]?.message?.content || '').replace(/```[a-z]*\n?|```/g, '').trim();
    let mapeo;
    try { mapeo = JSON.parse(text); } catch { console.log('❌ IA no-JSON:', text); process.exit(0); }

    console.log('🧠 IA mapeo:', mapeo);

    // Resolver columna de precio con fallback a headers reales si la IA devuelve una inexistente
    let colPrecio = mapeo.precio_ars || mapeo.precio || mapeo.contado || '';
    const candidatosPrecio = ['pvp off line', 'precio de lista', 'precio unitario'];
    const headersLower = mejor.headers.map(h => (h || '').toLowerCase());
    if (!colPrecio || !mejor.headers.includes(colPrecio)) {
      const encontrada = candidatosPrecio
        .map(p => mejor.headers.find(h => (h || '').toLowerCase().includes(p)))
        .find(Boolean);
      if (encontrada) colPrecio = encontrada;
    }
    const colModelo = mapeo.modelo || 'CODIGO';
    const colTipo = mapeo.tipo || 'RUBRO';
    const colDesc = mapeo.descripcion || 'DESCRIPCION';
    const colMarca = mapeo.proveedor || mapeo.marca || 'MARCA';

    const productos = mejor.datos.map((row, idx) => {
      const precioBase = normalizarPrecioArs(row[colPrecio]);
      return {
        id: idx + 1,
        producto: row[colDesc] || row[colModelo] || row[colTipo] || 'N/A',
        tipo: row[colTipo] || 'BATERIA',
        modelo: row[colModelo] || 'N/A',
        proveedor: row[colMarca] || 'Sin Marca',
        precio_base_original: precioBase,
      };
    }).filter(p => p.precio_base_original > 0);

    console.log(`📦 Productos parseados: ${productos.length}`);
    console.log('🧪 Muestra productos:', productos.slice(0, 5));
  } catch (err) {
    console.error('❌ Error pipeline:', err.message);
    process.exit(1);
  }
})();


