const XLSX = require('xlsx');
const OpenAI = require('openai');

console.log('🔍 TEST INFORMACIÓN COMPLETA - Verificando qué información entrega la IA...\n');

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
  console.log('\n🤖 === EMULANDO IA CON PROMPT DE PRODUCCIÓN ===');
  
  // Crear cliente de OpenAI
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'sk-test'
  });
  
  // Usar el PROMPT EXACTO del código de producción
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
    3. Contenido: valores numéricos con símbolo $ y formato argentino (punto para miles, coma para decimales)
    4. Ejemplos válidos: $ 2.690, $ 4.490, $ 1.256,33, $ 2.500,50
    5. IMPORTANTE: Los valores se redondean (sin decimales) para el procesamiento
    6. DEVUELVE EL NOMBRE DE LA COLUMNA, NO EL VALOR
    
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
  
  console.log('📝 Enviando prompt a OpenAI...');
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
    console.log('\n🤖 === RESPUESTA DE LA IA ===');
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
      // SIMULAR EL PROCESAMIENTO DEL CÓDIGO DE PRODUCCIÓN
      // ============================================================================
      console.log('\n🔍 === SIMULANDO PROCESAMIENTO DEL CÓDIGO DE PRODUCCIÓN ===');
      
      // Simular el mapeo que devuelve la IA
      let columnMapping = {
        tipo: mapeo.tipo || '',
        modelo: mapeo.modelo || '',
        precio: mapeo.precio || mapeo.precio_ars || '',
        descripcion: mapeo.descripcion || '',
        proveedor: mapeo.proveedor || ''
      };
      
      console.log('🔧 RESULTADO INICIAL DE LA IA:', columnMapping);
      
      // ============================================================================
      // VALIDACIÓN AGRESIVA: FORZAR COLUMNAS CORRECTAS
      // ============================================================================
      console.log('\n🔍 === VALIDACIÓN AGRESIVA: FORZAR COLUMNAS CORRECTAS ===');
      
      // Validar y corregir precio - FORZAR "PVP Off Line" si existe
      if (datos[0]) {
        const pvpOffLineColumn = headers.find(h => h && h.toLowerCase().includes('pvp off line'))
        if (pvpOffLineColumn) {
          const valorPrecio = datos[0][headers.indexOf(pvpOffLineColumn)]
          console.log(`🔍 FORZANDO PRECIO: Columna '${pvpOffLineColumn}' contiene: '${valorPrecio}'`)
          
          // Verificar que contiene un precio válido (no un código)
          if (typeof valorPrecio === 'string' && valorPrecio.includes('$')) {
            columnMapping.precio = pvpOffLineColumn
            console.log(`✅ Precio forzado a: "${pvpOffLineColumn}"`)
          } else {
            console.log(`❌ La columna PVP Off Line no contiene precio válido`)
          }
        } else {
          console.log(`❌ No se encontró columna "PVP Off Line"`)
        }
      }
      
      // Validar y corregir modelo - FORZAR "CODIGO" si existe
      if (datos[0]) {
        const codigoColumn = headers.find(h => h && h.toLowerCase().includes('codigo'))
        if (codigoColumn) {
          const valorModelo = datos[0][headers.indexOf(codigoColumn)]
          console.log(`🔍 FORZANDO MODELO: Columna '${codigoColumn}' contiene: '${valorModelo}'`)
          
          // Verificar que contiene un código válido
          if (typeof valorModelo === 'string' && valorModelo.match(/^[A-Z]\d+$/)) {
            columnMapping.modelo = codigoColumn
            console.log(`✅ Modelo forzado a: "${codigoColumn}"`)
          } else {
            console.log(`❌ La columna CODIGO no contiene código válido`)
          }
        } else {
          console.log(`❌ No se encontró columna "CODIGO"`)
        }
      }
      
      // Validar y corregir tipo - FORZAR "RUBRO" si existe
      if (datos[0]) {
        const rubroColumn = headers.find(h => h && h.toLowerCase().includes('rubro'))
        if (rubroColumn) {
          columnMapping.tipo = rubroColumn
          console.log(`✅ Tipo forzado a: "${rubroColumn}"`)
        }
      }
      
      // Validar y corregir descripcion - FORZAR "DESCRIPCION" si existe
      if (datos[0]) {
        const descripcionColumn = headers.find(h => h && h.toLowerCase().includes('descripcion'))
        if (descripcionColumn) {
          columnMapping.descripcion = descripcionColumn
          console.log(`✅ Descripción forzada a: "${descripcionColumn}"`)
        }
      }
      
      // Validar y corregir proveedor - FORZAR "MARCA" si existe
      if (datos[0]) {
        const marcaColumn = headers.find(h => h && h.toLowerCase().includes('marca'))
        if (marcaColumn) {
          columnMapping.proveedor = marcaColumn
          console.log(`✅ Proveedor forzado a: "${marcaColumn}"`)
        }
      }
      
      console.log('🔧 RESULTADO DESPUÉS DE VALIDACIÓN AGRESIVA:', columnMapping);
      
      // ============================================================================
      // SIMULAR EL PROCESAMIENTO DE PRODUCTOS
      // ============================================================================
      console.log('\n🔍 === SIMULANDO PROCESAMIENTO DE PRODUCTOS ===');
      
      // Procesar los primeros 3 productos como ejemplo
      for (let i = 0; i < Math.min(3, datos.length); i++) {
        const producto = datos[i];
        console.log(`\n📦 PRODUCTO ${i + 1}:`);
        
        // Extraer datos usando el mapeo
        const tipo = columnMapping.tipo ? producto[headers.indexOf(columnMapping.tipo)] : 'N/A'
        const modelo = columnMapping.modelo ? producto[headers.indexOf(columnMapping.modelo)] : 'N/A'
        const precio = columnMapping.precio ? producto[headers.indexOf(columnMapping.precio)] : 'N/A'
        const descripcion = columnMapping.descripcion ? producto[headers.indexOf(columnMapping.descripcion)] : 'N/A'
        const proveedor = columnMapping.proveedor ? producto[headers.indexOf(columnMapping.proveedor)] : 'N/A'
        
        console.log(`   - Tipo: "${tipo}" (columna: ${columnMapping.tipo})`)
        console.log(`   - Modelo: "${modelo}" (columna: ${columnMapping.modelo})`)
        console.log(`   - Precio: "${precio}" (columna: ${columnMapping.precio})`)
        console.log(`   - Descripción: "${descripcion}" (columna: ${columnMapping.descripcion})`)
        console.log(`   - Proveedor: "${proveedor}" (columna: ${columnMapping.proveedor})`)
        
        // Verificar si el precio es válido
        if (typeof precio === 'string' && precio.includes('$')) {
          console.log(`   ✅ Precio válido: ${precio}`)
        } else if (typeof precio === 'string' && precio.match(/^[A-Z]\d+$/)) {
          console.log(`   ❌ ERROR: Precio es un código: ${precio}`)
        } else {
          console.log(`   ⚠️ Precio no válido: ${precio}`)
        }
        
        // Verificar si el modelo es un código
        if (typeof modelo === 'string' && modelo.match(/^[A-Z]\d+$/)) {
          console.log(`   ✅ Modelo es un código válido: ${modelo}`)
        } else {
          console.log(`   ⚠️ Modelo no es un código: ${modelo}`)
        }
      }
      
      // ============================================================================
      // RESULTADO FINAL
      // ============================================================================
      console.log('\n🎯 === RESULTADO FINAL ===');
      
      // Verificar si el precio está correcto
      if (columnMapping.precio === 'PVP Off Line') {
        console.log('✅ ¡PERFECTO! El precio está mapeado correctamente a "PVP Off Line"');
      } else {
        console.log('❌ PROBLEMA: El precio no está mapeado correctamente');
        console.log('   Esperado: "PVP Off Line"');
        console.log('   Obtenido:', columnMapping.precio);
      }
      
      // Verificar si el modelo está correcto
      if (columnMapping.modelo === 'CODIGO') {
        console.log('✅ ¡PERFECTO! El modelo está mapeado correctamente a "CODIGO"');
      } else {
        console.log('❌ PROBLEMA: El modelo no está mapeado correctamente');
        console.log('   Esperado: "CODIGO"');
        console.log('   Obtenido:', columnMapping.modelo);
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
