const XLSX = require('xlsx');
const OpenAI = require('openai');

console.log('🔍 TEST PROMPT EXACTO - Emulando IA con prompt de producción...\n');

try {
  // Leer el archivo Excel
  const workbook = XLSX.readFile('./archivo_analisis.xlsx');
  const worksheet = workbook.Sheets['LISTA DE PRECIOS HM N°9'];
  
  // Convertir a JSON
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  // Encontrar headers (fila 2)
  const headers = jsonData[1]; // Fila 2 (índice 1)
  console.log('📋 Headers encontrados:', headers);
  
  // Obtener datos de muestra (primeras 10 filas de datos)
  const datos = jsonData.slice(2, 12); // Filas 3-12 (10 filas de datos)
  console.log('📊 Datos de muestra (10 filas):', datos);
  
  // ============================================================================
  // USAR EL PROMPT EXACTO DEL CÓDIGO DE PRODUCCIÓN
  // ============================================================================
  console.log('\n🤖 === EMULANDO IA CON PROMPT EXACTO DE PRODUCCIÓN ===');
  
  // Crear cliente de OpenAI
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'sk-test'
  });
  
  // Usar el PROMPT EXACTO del código de producción (copiado línea por línea)
  const contexto = `
    Eres especialista senior en pricing de baterías automotrices en Argentina.
    Usa únicamente las COLUMNAS y la MUESTRA provistas en este turno (ignora cualquier conocimiento previo).
    Debes mapear exactamente qué columna corresponde a:
    tipo (familia/categoría: p.ej. "Batería", "Ca Ag Blindada", "J.I.S.")
    modelo (código identificador: p.ej. "M18FD", "M20GD", "M22ED")
    precio_ars (precio en pesos argentinos - columna "Contado" tiene prioridad)
    descripcion (descripción comercial del producto)
    proveedor (nombre del proveedor/fabricante: p.ej. "Moura", "Varta", "Bosch", "ACDelco")
    
    REGLAS OBLIGATORIAS:
    - Devuelve SOLO nombres de columnas, NO valores de datos
    - Moneda ARS solamente. En Argentina, "$" es ARS. Rechaza columnas con USD, U$S, US$, "dólar" o mezcla de monedas. No conviertas.
    
    PRECIO (prioridad específica):
    1. Busca columna "PVP Off Line" - esta es la columna de precio base principal
    2. Si no existe "PVP Off Line", busca: "Contado", precio, precio lista, pvp, sugerido proveedor, lista, AR$, ARS, $ (sin USD)
    3. Contenido: valores numéricos con formato $XXX,XX (pesos argentinos)
    4. Ejemplos válidos: $124,99, $122,99, $131,99, $137,99
    5. DEVUELVE EL NOMBRE DE LA COLUMNA, NO EL VALOR
    
    TIPO (prioridad):
    1. Busca columna "RUBRO" o similar
    2. Contenido: descripciones como "HTAS. MANUALES", "COMBINADAS"
    3. Si no existe, usa "RUBRO" como valor por defecto
    4. DEVUELVE EL NOMBRE DE LA COLUMNA, NO EL VALOR
    
    MODELO (prioridad):
    1. Busca columna "CODIGO" o similar
    2. Contenido: códigos como "L3000", "L3001", "L3002"
    3. Si no existe, usa el primer identificador disponible
    4. DEVUELVE EL NOMBRE DE LA COLUMNA, NO EL VALOR
    
    DESCRIPCION:
    1. Busca columna "DESCRIPCION" o similar
    2. Contenido: descripciones detalladas del producto
    3. DEVUELVE EL NOMBRE DE LA COLUMNA, NO EL VALOR
    
    PROVEEDOR (NUEVO):
    1. Busca columna "MARCA" o similar
    2. Contenido: marcas como "LUSQTOFF", "MOURA", "VARTA"
    3. Si no existe columna específica, analiza el nombre del producto para extraer la marca
    4. DEVUELVE EL NOMBRE DE LA COLUMNA, NO EL VALOR
    
    EJEMPLO DE RESPUESTA CORRECTA:
    {
      "tipo": "RUBRO",
      "modelo": "CODIGO", 
      "precio_ars": "PVP Off Line",
      "descripcion": "DESCRIPCION",
      "proveedor": "MARCA"
    }
    
    ⚠️ CRÍTICO: NUNCA devuelvas valores como "L3000", "$ 2.690", "LUSQTOFF". 
    ⚠️ SIEMPRE devuelve NOMBRES DE COLUMNAS como "CODIGO", "PVP Off Line", "MARCA".
    
    Salida estricta: responde solo con JSON que cumpla el schema provisto (sin texto extra, sin markdown, sin backticks).
    
    COLUMNAS: ${headers.join(', ')}
    MUESTRA (hasta 10 filas reales):
    ${JSON.stringify(datos.slice(0, 10), null, 2)}
    
    Responde SOLO con este JSON simple:
    {
      "tipo": "nombre_columna",
      "modelo": "nombre_columna", 
      "precio": "nombre_columna",
      "contado": "nombre_columna",
      "descripcion": "nombre_columna",
      "proveedor": "nombre_columna_o_analisis"
    }
  `;
  
  console.log('📝 Enviando prompt EXACTO de producción a OpenAI...');
  console.log('🔑 API Key:', process.env.OPENAI_API_KEY ? 'Configurada' : 'NO configurada');
  
  // Hacer la llamada real a OpenAI
  openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: contexto
      }
    ],
    temperature: 0.1,
    max_tokens: 1000
  }).then(response => {
    console.log('\n🤖 === RESPUESTA DE LA IA CON PROMPT DE PRODUCCIÓN ===');
    console.log('📝 Respuesta cruda:', response.choices[0].message.content);
    
    try {
      // Limpiar la respuesta de la IA (quitar backticks y markdown)
      let respuestaLimpia = response.choices[0].message.content.trim()
      if (respuestaLimpia.startsWith('```json')) {
        respuestaLimpia = respuestaLimpia.replace(/^```json\s*/, '').replace(/\s*```$/, '')
      } else if (respuestaLimpia.startsWith('```')) {
        respuestaLimpia = respuestaLimpia.replace(/^```\s*/, '').replace(/\s*```$/, '')
      }
      
      console.log('🧹 Respuesta limpia:', respuestaLimpia);
      
      // Parsear la respuesta
      let mapeo = JSON.parse(respuestaLimpia);
      console.log('🧠 GPT analizó el archivo:', mapeo);
      
      // ============================================================================
      // ANALIZAR LA RESPUESTA DE LA IA
      // ============================================================================
      console.log('\n🔍 === ANÁLISIS DE LA RESPUESTA DE LA IA ===');
      
      // Verificar si devolvió nombres de columnas o valores
      console.log('📊 Análisis de cada campo:');
      
      // Analizar tipo
      if (mapeo.tipo) {
        const esNombreColumna = headers.includes(mapeo.tipo)
        console.log(`   - tipo: "${mapeo.tipo}" ${esNombreColumna ? '✅ (nombre de columna)' : '❌ (valor, no nombre de columna)'}`)
      }
      
      // Analizar modelo
      if (mapeo.modelo) {
        const esNombreColumna = headers.includes(mapeo.modelo)
        console.log(`   - modelo: "${mapeo.modelo}" ${esNombreColumna ? '✅ (nombre de columna)' : '❌ (valor, no nombre de columna)'}`)
      }
      
      // Analizar precio_ars
      if (mapeo.precio_ars) {
        const esNombreColumna = headers.includes(mapeo.precio_ars)
        console.log(`   - precio_ars: "${mapeo.precio_ars}" ${esNombreColumna ? '✅ (nombre de columna)' : '❌ (valor, no nombre de columna)'}`)
      }
      
      // Analizar precio (del JSON simple)
      if (mapeo.precio) {
        const esNombreColumna = headers.includes(mapeo.precio)
        console.log(`   - precio: "${mapeo.precio}" ${esNombreColumna ? '✅ (nombre de columna)' : '❌ (valor, no nombre de columna)'}`)
      }
      
      // Analizar descripcion
      if (mapeo.descripcion) {
        const esNombreColumna = headers.includes(mapeo.descripcion)
        console.log(`   - descripcion: "${mapeo.descripcion}" ${esNombreColumna ? '✅ (nombre de columna)' : '❌ (valor, no nombre de columna)'}`)
      }
      
      // Analizar proveedor
      if (mapeo.proveedor) {
        const esNombreColumna = headers.includes(mapeo.proveedor)
        console.log(`   - proveedor: "${mapeo.proveedor}" ${esNombreColumna ? '✅ (nombre de columna)' : '❌ (valor, no nombre de columna)'}`)
      }
      
      // ============================================================================
      // VERIFICAR SI LA IA DEVOLVIÓ VALORES EN LUGAR DE NOMBRES DE COLUMNAS
      // ============================================================================
      console.log('\n🔍 === VERIFICACIÓN DE VALORES VS NOMBRES DE COLUMNAS ===');
      
      // Verificar si devolvió códigos como precio
      if (mapeo.precio_ars && mapeo.precio_ars.match(/^[A-Z]\d+$/)) {
        console.log(`❌ PROBLEMA: La IA devolvió un código como precio: "${mapeo.precio_ars}"`)
      }
      if (mapeo.precio && mapeo.precio.match(/^[A-Z]\d+$/)) {
        console.log(`❌ PROBLEMA: La IA devolvió un código como precio: "${mapeo.precio}"`)
      }
      
      // Verificar si devolvió precios como valores
      if (mapeo.precio_ars && mapeo.precio_ars.includes('$')) {
        console.log(`❌ PROBLEMA: La IA devolvió un valor de precio: "${mapeo.precio_ars}"`)
      }
      if (mapeo.precio && mapeo.precio.includes('$')) {
        console.log(`❌ PROBLEMA: La IA devolvió un valor de precio: "${mapeo.precio}"`)
      }
      
      // Verificar si devolvió descripciones como valores
      if (mapeo.descripcion && mapeo.descripcion.includes('(') && mapeo.descripcion.includes(')')) {
        console.log(`❌ PROBLEMA: La IA devolvió una descripción como valor: "${mapeo.descripcion}"`)
      }
      
      // Verificar si devolvió marcas como valores
      if (mapeo.proveedor && mapeo.proveedor.match(/^[A-Z]+$/)) {
        console.log(`❌ PROBLEMA: La IA devolvió una marca como valor: "${mapeo.proveedor}"`)
      }
      
      // ============================================================================
      // RESULTADO FINAL
      // ============================================================================
      console.log('\n🎯 === RESULTADO FINAL ===');
      
      const problemas = []
      if (mapeo.precio_ars && !headers.includes(mapeo.precio_ars)) problemas.push('precio_ars no es nombre de columna')
      if (mapeo.precio && !headers.includes(mapeo.precio)) problemas.push('precio no es nombre de columna')
      if (mapeo.modelo && !headers.includes(mapeo.modelo)) problemas.push('modelo no es nombre de columna')
      if (mapeo.tipo && !headers.includes(mapeo.tipo)) problemas.push('tipo no es nombre de columna')
      if (mapeo.descripcion && !headers.includes(mapeo.descripcion)) problemas.push('descripcion no es nombre de columna')
      if (mapeo.proveedor && !headers.includes(mapeo.proveedor)) problemas.push('proveedor no es nombre de columna')
      
      if (problemas.length === 0) {
        console.log('✅ ¡PERFECTO! La IA devolvió solo nombres de columnas')
      } else {
        console.log('❌ PROBLEMAS ENCONTRADOS:')
        problemas.forEach(p => console.log(`   - ${p}`))
      }
      
    } catch (parseError) {
      console.error('❌ Error parseando respuesta de la IA:', parseError);
      console.log('📝 Respuesta cruda:', response.choices[0].message.content);
    }
    
  }).catch(error => {
    console.error('❌ Error llamando a OpenAI:', error.message);
    if (error.message.includes('API key')) {
      console.log('💡 Sugerencia: Configura OPENAI_API_KEY en tu .env');
    }
  });
  
} catch (error) {
  console.error('❌ Error general:', error.message);
}
