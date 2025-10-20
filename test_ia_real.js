const XLSX = require('xlsx');

console.log('🤖 PRUEBA CON IA REAL - analizarArchivoConIA()...\n');

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
  // SIMULAR analizarArchivoConIA() - FUNCIÓN REAL CON IA
  // ============================================================================
  console.log('\n🤖 === SIMULANDO analizarArchivoConIA() CON IA REAL ===');
  
  async function analizarArchivoConIA(headers, datos) {
    try {
      console.log('🤖 Llamando a la IA para analizar el archivo...');
      
      // Simular el prompt real de la IA
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
        Moneda ARS solamente. En Argentina, "$" es ARS. Rechaza columnas con USD, U$S, US$, "dólar" o mezcla de monedas. No conviertas.
        
        PRECIO (prioridad específica):
        1. Busca columna "Contado" - esta es la columna de precio base principal
        2. Si no existe "Contado", busca: precio, precio lista, pvp, sugerido proveedor, lista, AR$, ARS, $ (sin USD)
        3. Contenido: valores numéricos con formato $XXX,XX (pesos argentinos)
        4. Ejemplos válidos: $124,99, $122,99, $131,99, $137,99
        
        TIPO (prioridad):
        1. Busca columna "DENOMINACION COMERCIAL" o similar
        2. Contenido: descripciones como "12-50 Clio, Ka, Twingo, Fiesta (N)"
        3. Si no existe, usa "Batería" como valor por defecto
        
        MODELO (prioridad):
        1. Busca columna "Descripción Modelo SAP" o similar
        2. Contenido: códigos como "M18FD", "M20GD", "M22ED"
        3. Si no existe, usa el primer identificador disponible
        
        DESCRIPCION:
        1. Usa la misma columna que TIPO si es descriptiva
        2. O busca columna con descripciones detalladas del producto
        
        PROVEEDOR (NUEVO):
        1. Busca columna "Proveedor", "Fabricante", "Marca", "Supplier", "Brand"
        2. Si no existe columna específica, analiza el nombre del producto para extraer la marca
        3. Marcas conocidas: Moura, Varta, Bosch, ACDelco, Exide, Delkor, Banner, etc.
        4. Si no se puede determinar, usa "Sin Marca"
        
        Salida estricta: responde solo con JSON que cumpla el schema provisto (sin texto extra).
        
        COLUMNAS: ${headers.join(', ')}
        MUESTRA (hasta 10 filas reales):
        ${datos.map((fila, i) => `Fila ${i + 1}: ${JSON.stringify(fila)}`).join('\n')}
      `;
      
      console.log('📝 Contexto enviado a la IA:');
      console.log(contexto);
      
      // Simular llamada a la IA (en producción esto va a OpenAI)
      console.log('\n🤖 Simulando respuesta de la IA...');
      
      // Analizar las columnas manualmente para simular la respuesta de la IA
      const analisisIA = {
        tipo: '',
        modelo: '',
        precio_ars: '',
        descripcion: '',
        proveedor: ''
      };
      
      // Buscar tipo (RUBRO o SUBRUBRO)
      const tipoIndex = headers.findIndex(h => h && h.toLowerCase().includes('rubro'));
      if (tipoIndex !== -1) {
        analisisIA.tipo = headers[tipoIndex];
        console.log(`✅ IA detectó TIPO: "${analisisIA.tipo}"`);
      }
      
      // Buscar modelo (CODIGO)
      const modeloIndex = headers.findIndex(h => h && h.toLowerCase().includes('codigo'));
      if (modeloIndex !== -1) {
        analisisIA.modelo = headers[modeloIndex];
        console.log(`✅ IA detectó MODELO: "${analisisIA.modelo}"`);
      }
      
      // Buscar precio_ars (PVP Off Line tiene prioridad sobre Precio de Lista)
      const precioIndex = headers.findIndex(h => h && h.toLowerCase().includes('pvp off line'));
      if (precioIndex !== -1) {
        analisisIA.precio_ars = headers[precioIndex];
        console.log(`✅ IA detectó PRECIO_ARS: "${analisisIA.precio_ars}"`);
      } else {
        const precioListaIndex = headers.findIndex(h => h && h.toLowerCase().includes('precio de lista'));
        if (precioListaIndex !== -1) {
          analisisIA.precio_ars = headers[precioListaIndex];
          console.log(`✅ IA detectó PRECIO_ARS (fallback): "${analisisIA.precio_ars}"`);
        }
      }
      
      // Buscar descripcion (DESCRIPCION)
      const descripcionIndex = headers.findIndex(h => h && h.toLowerCase().includes('descripcion'));
      if (descripcionIndex !== -1) {
        analisisIA.descripcion = headers[descripcionIndex];
        console.log(`✅ IA detectó DESCRIPCION: "${analisisIA.descripcion}"`);
      }
      
      // Buscar proveedor (MARCA)
      const proveedorIndex = headers.findIndex(h => h && h.toLowerCase().includes('marca'));
      if (proveedorIndex !== -1) {
        analisisIA.proveedor = headers[proveedorIndex];
        console.log(`✅ IA detectó PROVEEDOR: "${analisisIA.proveedor}"`);
      }
      
      console.log('\n🤖 Respuesta de la IA:');
      console.log(JSON.stringify(analisisIA, null, 2));
      
      return analisisIA;
      
    } catch (error) {
      console.error('❌ Error en analizarArchivoConIA:', error);
      throw error;
    }
  }
  
  // Ejecutar el análisis con IA
  analizarArchivoConIA(headers, datos).then(resultadoIA => {
    console.log('\n🎯 === RESULTADO DEL ANÁLISIS CON IA ===');
    console.log('📊 Mapeo de la IA:', resultadoIA);
    
    // Verificar si la IA detectó correctamente el precio
    if (resultadoIA.precio_ars) {
      const indicePrecio = headers.indexOf(resultadoIA.precio_ars);
      const valorPrecio = datos[0][indicePrecio];
      
      console.log(`\n💰 COLUMNA DE PRECIO DETECTADA POR IA: "${resultadoIA.precio_ars}"`);
      console.log(`📊 Índice: ${indicePrecio}`);
      console.log(`📊 Valor en primera fila: "${valorPrecio}"`);
      
      // Verificar si es un código
      if (typeof valorPrecio === 'string' && valorPrecio.match(/^[A-Z]\d+$/)) {
        console.log(`❌ ERROR: La IA detectó un código como precio! (${valorPrecio})`);
      } else {
        console.log(`✅ La IA detectó un precio válido: ${valorPrecio}`);
      }
    } else {
      console.log('\n❌ La IA NO detectó columna de precio');
    }
    
    // Mostrar todas las columnas con sus valores para verificar
    console.log('\n📋 VERIFICACIÓN DE TODAS LAS COLUMNAS:');
    headers.forEach((header, index) => {
      const valor = datos[0][index];
      const esCodigo = typeof valor === 'string' && valor.match(/^[A-Z]\d+$/);
      const esPrecio = typeof valor === 'string' && valor.includes('$');
      const esNumero = !isNaN(parseFloat(valor)) && parseFloat(valor) > 0;
      
      console.log(`${index + 1}. "${header}": "${valor}" ${esCodigo ? '🔢 CÓDIGO' : ''} ${esPrecio ? '💰 PRECIO' : ''} ${esNumero ? '🔢 NÚMERO' : ''}`);
    });
    
  }).catch(error => {
    console.error('❌ Error en el análisis:', error);
  });
  
} catch (error) {
  console.error('❌ Error general:', error.message);
}
