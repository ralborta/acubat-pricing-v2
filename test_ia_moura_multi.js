const XLSX = require('xlsx');
const OpenAI = require('openai');

(async () => {
  try {
    const archivoPath = '/Users/ralborta/Downloads/Acubat/Lista Moura 04 (1).xlsx';
    const workbook = XLSX.readFile(archivoPath);
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    console.log('📋 Hojas:', workbook.SheetNames);

    for (let i = 0; i < workbook.SheetNames.length; i++) {
      const name = workbook.SheetNames[i];
      const worksheet = workbook.Sheets[name];

      // Leer hoja
      let datos = XLSX.utils.sheet_to_json(worksheet);
      if (datos.length === 0) {
        console.log(`\n[${i + 1}] ${name}: vacía`);
        continue;
      }

      // Detección inteligente de headers (misma lógica del backend)
      let headers = Object.keys(datos[0] || {});
      const primera = datos[0] || {};
      const esTitulo = Object.values(primera).some(v =>
        typeof v === 'string' && (
          v.includes('LISTA') ||
          v.includes('PRECIOS') ||
          v.includes('Vigencia') ||
          v.includes('HERRAMIENTAS') ||
          v.includes('PRODUCTOS') ||
          v.includes('MOURA') ||
          v.length > 50
        )
      );
      const manyEmpty = headers.filter(h => h && h.startsWith('__EMPTY')).length > 5;
      const vacios = Object.values(primera).filter(v => !v || v === '').length;
      const muchosVacios = vacios > (Object.values(primera).length || 1) * 0.5;

      let necesitaCorreccion = esTitulo || manyEmpty || muchosVacios;
      const tienePrecioPrimera = headers.some(
        h => h && h.toLowerCase().includes('precio') && !h.startsWith('__EMPTY')
      );
      if (!tienePrecioPrimera) necesitaCorreccion = true;

      if (necesitaCorreccion) {
        datos = XLSX.utils.sheet_to_json(worksheet, { range: 1 });
        headers = Object.keys(datos[0] || {});
        const emptyAfter = headers.filter(h => h && h.startsWith('__EMPTY')).length;
        if (emptyAfter > 5) {
          datos = XLSX.utils.sheet_to_json(worksheet, { range: 2 });
          headers = Object.keys(datos[0] || {});
        }
      }

      // Construir prompt de producción simplificado (column names only)
      const sample = datos.slice(0, 10);
      const prompt = `Eres un asistente que identifica nombres de columnas en planillas de precios.\n\nREGLAS OBLIGATORIAS:\n- Devuelve SOLO nombres de columnas, NO valores de datos\n- Moneda ARS solamente. Rechaza USD.\n\nPRECIO (prioridad):\n1) 'PVP Off Line'\n2) 'Precio de Lista'\n3) 'Precio Unitario'\n\nMODELO: 'CODIGO' o similar\nTIPO: 'RUBRO' o similar\nDESCRIPCION: 'DESCRIPCION'\nPROVEEDOR: 'MARCA'\n\nEjemplo JSON válido:\n{\"tipo\":\"RUBRO\",\"modelo\":\"CODIGO\",\"precio_ars\":\"PVP Off Line\",\"descripcion\":\"DESCRIPCION\",\"proveedor\":\"MARCA\"}\n\nCOLUMNAS: ${headers.join(', ')}\nMUESTRA (10 filas): ${JSON.stringify(sample)}\n\nResponde solo con JSON (sin markdown, sin backticks).`;

      const resp = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1
      });

      let text = (resp.choices?.[0]?.message?.content || '').replace(/```[a-z]*\n?|```/g, '').trim();
      let json;
      try {
        json = JSON.parse(text);
      } catch (e) {
        console.log(`\n[${i + 1}] ${name}: IA devolvió no-JSON =>`, text);
        continue;
      }

      console.log(`\n[${i + 1}] ${name}:`);
      console.log('Headers:', headers);
      console.log('IA mapeo:', json);

      const precioCol = json.precio_ars || json.precio || json.contado || '';
      console.log('PrecioCol:', precioCol || 'NO');
      console.log('Filas:', datos.length);
      if (precioCol && headers.includes(precioCol)) {
        const vals = datos.slice(0, 3).map(r => r[precioCol]);
        console.log('Muestra precio:', vals);
      }
    }
  } catch (err) {
    console.error('Error test IA:', err.message);
    process.exit(1);
  }
})();


