const XLSX = require('xlsx');
const OpenAI = require('openai');

console.log('🤖 PRUEBA COMPLETA CON IA REAL - Simulando flujo de producción...\n');

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
  // SIMULAR EXACTAMENTE EL FLUJO DE PRODUCCIÓN
  // ============================================================================
  console.log('\n🤖 === SIMULANDO FLUJO DE PRODUCCIÓN CON IA REAL ===');
  
  // Crear cliente de OpenAI
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'sk-test'
  });
  
  // Usar el MISMO prompt exacto del código de producción
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
    2. Si no existe "PVP Off Line", busca: precio, precio lista, pvp, sugerido proveedor, lista, AR$, ARS, $ (sin USD)
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
    console.log('\n🤖 Respuesta de OpenAI:');
    console.log(response.choices[0].message.content);
    
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
      
      // 🔧 VALIDACIÓN Y CORRECCIÓN: Si la IA devolvió valores en lugar de nombres de columnas
      console.log('🔍 Validando respuesta de la IA...');
      
      // Si la IA devolvió un array, tomar el primer elemento
      if (Array.isArray(mapeo)) {
        console.log('⚠️ La IA devolvió un array, tomando el primer elemento');
        mapeo = mapeo[0];
      }
      
      // Validar y corregir cada campo
      const mapeoCorregido = {};
      
      // Corregir tipo
      if (mapeo.tipo && typeof mapeo.tipo === 'string') {
        if (mapeo.tipo.includes('Batería') || mapeo.tipo.includes('batería')) {
          // Buscar columna de tipo en headers
          const tipoColumn = headers.find(h => h && (
            h.toLowerCase().includes('rubro') || 
            h.toLowerCase().includes('tipo') || 
            h.toLowerCase().includes('categoria') ||
            h.toLowerCase().includes('familia')
          ));
          mapeoCorregido.tipo = tipoColumn || 'RUBRO';
          console.log(`✅ Corregido tipo: "${mapeo.tipo}" → "${mapeoCorregido.tipo}"`);
        } else {
          mapeoCorregido.tipo = mapeo.tipo;
        }
      }
      
      // Corregir modelo
      if (mapeo.modelo && typeof mapeo.modelo === 'string') {
        if (mapeo.modelo.match(/^[A-Z]\d+$/)) {
          // Es un código, buscar columna de código
          const codigoColumn = headers.find(h => h && (
            h.toLowerCase().includes('codigo') || 
            h.toLowerCase().includes('code') || 
            h.toLowerCase().includes('sku') ||
            h.toLowerCase().includes('referencia')
          ));
          mapeoCorregido.modelo = codigoColumn || 'CODIGO';
          console.log(`✅ Corregido modelo: "${mapeo.modelo}" → "${mapeoCorregido.modelo}"`);
        } else {
          mapeoCorregido.modelo = mapeo.modelo;
        }
      }
      
      // Corregir precio_ars
      if (mapeo.precio_ars && typeof mapeo.precio_ars === 'string') {
        if (mapeo.precio_ars.includes('$')) {
          // Es un valor de precio, buscar columna de precio
          const precioColumn = headers.find(h => h && (
            h.toLowerCase().includes('pvp off line') ||
            h.toLowerCase().includes('precio') || 
            h.toLowerCase().includes('price') || 
            h.toLowerCase().includes('pvp')
          ));
          mapeoCorregido.precio_ars = precioColumn || 'PVP Off Line';
          console.log(`✅ Corregido precio_ars: "${mapeo.precio_ars}" → "${mapeoCorregido.precio_ars}"`);
        } else {
          mapeoCorregido.precio_ars = mapeo.precio_ars;
        }
      }
      
      // Corregir descripcion
      if (mapeo.descripcion && typeof mapeo.descripcion === 'string') {
        if (mapeo.descripcion.includes('(') && mapeo.descripcion.includes(')')) {
          // Es una descripción de producto, buscar columna de descripción
          const descColumn = headers.find(h => h && (
            h.toLowerCase().includes('descripcion') || 
            h.toLowerCase().includes('description') || 
            h.toLowerCase().includes('producto') ||
            h.toLowerCase().includes('nombre')
          ));
          mapeoCorregido.descripcion = descColumn || 'DESCRIPCION';
          console.log(`✅ Corregido descripcion: "${mapeo.descripcion}" → "${mapeoCorregido.descripcion}"`);
        } else {
          mapeoCorregido.descripcion = mapeo.descripcion;
        }
      }
      
      // Corregir proveedor
      if (mapeo.proveedor && typeof mapeo.proveedor === 'string') {
        if (mapeo.proveedor.match(/^[A-Z]+$/)) {
          // Es una marca, buscar columna de marca
          const marcaColumn = headers.find(h => h && (
            h.toLowerCase().includes('marca') || 
            h.toLowerCase().includes('brand') || 
            h.toLowerCase().includes('fabricante') ||
            h.toLowerCase().includes('proveedor')
          ));
          mapeoCorregido.proveedor = marcaColumn || 'MARCA';
          console.log(`✅ Corregido proveedor: "${mapeo.proveedor}" → "${mapeoCorregido.proveedor}"`);
        } else {
          mapeoCorregido.proveedor = mapeo.proveedor;
        }
      }
      
      console.log('🎯 Mapeo corregido:', mapeoCorregido);
      
      // Simular el mapeo final
      const mapeoFinal = {
        tipo: mapeoCorregido.tipo || '',
        modelo: mapeoCorregido.modelo || '',
        precio: mapeoCorregido.precio_ars || '',
        descripcion: mapeoCorregido.descripcion || '',
        proveedor: mapeoCorregido.proveedor || ''
      };
      
      console.log('🎯 Mapeo final para el sistema:', mapeoFinal);
      
      // Verificar si el precio está correcto
      if (mapeoFinal.precio === 'PVP Off Line') {
        console.log('✅ ¡PERFECTO! El precio está mapeado correctamente a "PVP Off Line"');
      } else {
        console.log('❌ PROBLEMA: El precio no está mapeado correctamente');
        console.log('   Esperado: "PVP Off Line"');
        console.log('   Obtenido:', mapeoFinal.precio);
      }
      
      // Verificar si el modelo está correcto
      if (mapeoFinal.modelo === 'CODIGO') {
        console.log('✅ ¡PERFECTO! El modelo está mapeado correctamente a "CODIGO"');
      } else {
        console.log('❌ PROBLEMA: El modelo no está mapeado correctamente');
        console.log('   Esperado: "CODIGO"');
        console.log('   Obtenido:', mapeoFinal.modelo);
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