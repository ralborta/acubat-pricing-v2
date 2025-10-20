const XLSX = require('xlsx');
const OpenAI = require('openai');

console.log('🔍 TEST DEBUG PROFUNDO - Encontrando exactamente dónde está el problema...\n');

try {
  // Leer el archivo Excel
  const workbook = XLSX.readFile('./archivo_analisis.xlsx');
  const worksheet = workbook.Sheets['LISTA DE PRECIOS HM N°9'];
  
  // Convertir a JSON
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  // Encontrar headers (fila 2)
  const headers = jsonData[1]; // Fila 2 (índice 1)
  console.log('📋 Headers encontrados:', headers);
  
  // Obtener datos de muestra (primeras 5 filas de datos)
  const datos = jsonData.slice(2, 7); // Filas 3-7 (5 filas de datos)
  console.log('📊 Datos de muestra (5 filas):', datos);
  
  // ============================================================================
  // SIMULAR EXACTAMENTE EL FLUJO COMPLETO
  // ============================================================================
  console.log('\n🤖 === SIMULANDO FLUJO COMPLETO ===');
  
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
      // Limpiar la respuesta de la IA
      let respuestaLimpia = response.choices[0].message.content.trim()
      if (respuestaLimpia.startsWith('```json')) {
        respuestaLimpia = respuestaLimpia.replace(/^```json\s*/, '').replace(/\s*```$/, '')
      } else if (respuestaLimpia.startsWith('```')) {
        respuestaLimpia = respuestaLimpia.replace(/^```\s*/, '').replace(/\s*```$/, '')
      }
      
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
      // SIMULAR EL PROCESAMIENTO DE PRODUCTOS CON DEBUG EXTREMO
      // ============================================================================
      console.log('\n🔍 === SIMULANDO PROCESAMIENTO DE PRODUCTOS CON DEBUG EXTREMO ===');
      
      // Procesar los primeros 3 productos como ejemplo
      for (let i = 0; i < Math.min(3, datos.length); i++) {
        const producto = datos[i];
        console.log(`\n📦 PRODUCTO ${i + 1}:`);
        console.log(`   - Datos del producto:`, producto);
        
        // Extraer datos usando el mapeo CORREGIDO
        const tipo = columnMapping.tipo ? producto[headers.indexOf(columnMapping.tipo)] : 'BATERIA'
        const modelo = columnMapping.modelo ? producto[headers.indexOf(columnMapping.modelo)] : 'N/A'
        const descripcion = columnMapping.descripcion ? producto[headers.indexOf(columnMapping.descripcion)] : modelo
        const proveedor = columnMapping.proveedor ? producto[headers.indexOf(columnMapping.proveedor)] : 'Sin Marca'
        
        console.log(`   - Tipo: "${tipo}" (columna: ${columnMapping.tipo}, índice: ${headers.indexOf(columnMapping.tipo)})`)
        console.log(`   - Modelo: "${modelo}" (columna: ${columnMapping.modelo}, índice: ${headers.indexOf(columnMapping.modelo)})`)
        console.log(`   - Descripción: "${descripcion}" (columna: ${columnMapping.descripcion}, índice: ${headers.indexOf(columnMapping.descripcion)})`)
        console.log(`   - Proveedor: "${proveedor}" (columna: ${columnMapping.proveedor}, índice: ${headers.indexOf(columnMapping.proveedor)})`)
        
        // ============================================================================
        // SIMULAR LA BÚSQUEDA DE PRECIO CON DEBUG EXTREMO
        // ============================================================================
        console.log(`\n💰 BÚSQUEDA DE PRECIO DEL PRODUCTO ${i + 1}:`);
        console.log(`🔍 Mapeo de columnas disponible:`, columnMapping);
        
        let precioBase = 0;
        
        // Simular la lógica de búsqueda de precio
        const columnasPrecio = [
          { key: 'pvp_off_line', value: columnMapping.precio },
          { key: 'contado', value: columnMapping.contado },
          { key: 'precio', value: columnMapping.precio },
          { key: 'pdv', value: columnMapping.pdv },
          { key: 'pvp', value: columnMapping.pvp }
        ].filter(col => col.value);
        
        console.log(`🔍 Columnas de precio a buscar:`, columnasPrecio);
        
        for (const columna of columnasPrecio) {
          if (!columna.value) continue;
          
          const valor = producto[headers.indexOf(columna.value)];
          console.log(`🔍 Buscando en '${columna.key}' (${columna.value}): ${valor}`);
          console.log(`🔍 Tipo de valor: ${typeof valor}, Es string: ${typeof valor === 'string'}`);
          
          // Validación adicional: Verificar que no sea un código
          if (typeof valor === 'string' && valor.match(/^[A-Z]\d+$/)) {
            console.log(`❌ IGNORANDO valor '${valor}' porque parece ser un código (formato: letra + números)`);
            continue;
          }
          
          if (valor !== undefined && valor !== null && valor !== '') {
            // Limpiar valor
            let valorLimpio = String(valor)
              .replace(/\$/g, '')
              .replace(/[^\d.,]/g, '')
              .trim();
            
            console.log(`🔍 Valor original: "${valor}" -> Valor limpio: "${valorLimpio}"`);
            
            // Intentar parsear como número
            let precio = parseFloat(valorLimpio);
            
            // Detección de formato argentino
            if (!isNaN(precio)) {
              if (valorLimpio.includes('.') && valorLimpio.split('.')[1] && valorLimpio.split('.')[1].length === 3) {
                const valorArgentino = valorLimpio.replace('.', '');
                precio = parseFloat(valorArgentino);
                console.log(`🔍 Formato argentino detectado: ${valorLimpio} -> ${valorArgentino} -> ${precio}`);
              }
            }
            
            if (!isNaN(precio) && precio > 0) {
              precioBase = precio;
              console.log(`✅ Precio encontrado en '${columna.key}' (${columna.value}): ${precioBase}`);
              break;
            }
          }
        }
        
        console.log(`💰 PRECIO BASE FINAL: ${precioBase}`);
        
        // Verificar si el precio es válido
        if (precioBase > 0) {
          console.log(`✅ Precio válido: ${precioBase}`);
        } else {
          console.log(`❌ PROBLEMA: No se encontró precio válido`);
        }
      }
      
    } catch (parseError) {
      console.error('❌ Error parseando respuesta de la IA:', parseError);
      console.log('📝 Respuesta cruda:', response.choices[0].message.content);
    }
    
  }).catch(error => {
    console.error('❌ Error llamando a OpenAI:', error.message);
  });
  
} catch (error) {
  console.error('❌ Error general:', error.message);
}
