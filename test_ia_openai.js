const XLSX = require('xlsx');

console.log('🤖 PRUEBA CON IA REAL DE OPENAI - analizarArchivoConIA()...\n');

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
  // USAR LA FUNCIÓN REAL analizarArchivoConIA() CON OPENAI
  // ============================================================================
  console.log('\n🤖 === LLAMANDO A LA IA REAL DE OPENAI ===');
  
  // Importar la función real del código
  const { analizarArchivoConIA } = require('./app/api/pricing/procesar-archivo/route.ts');
  
  // Ejecutar la función real con la IA de OpenAI
  analizarArchivoConIA(headers, datos).then(resultadoIA => {
    console.log('\n🎯 === RESULTADO DE LA IA REAL DE OPENAI ===');
    console.log('📊 Mapeo de la IA real:', resultadoIA);
    
    // Verificar si la IA detectó correctamente el precio
    if (resultadoIA.precio_ars) {
      const indicePrecio = headers.indexOf(resultadoIA.precio_ars);
      const valorPrecio = datos[0][indicePrecio];
      
      console.log(`\n💰 COLUMNA DE PRECIO DETECTADA POR IA REAL: "${resultadoIA.precio_ars}"`);
      console.log(`📊 Índice: ${indicePrecio}`);
      console.log(`📊 Valor en primera fila: "${valorPrecio}"`);
      
      // Verificar si es un código
      if (typeof valorPrecio === 'string' && valorPrecio.match(/^[A-Z]\d+$/)) {
        console.log(`❌ ERROR: La IA real detectó un código como precio! (${valorPrecio})`);
      } else {
        console.log(`✅ La IA real detectó un precio válido: ${valorPrecio}`);
      }
    } else {
      console.log('\n❌ La IA real NO detectó columna de precio');
    }
    
    // Verificar si detectó código como modelo
    if (resultadoIA.modelo) {
      const indiceModelo = headers.indexOf(resultadoIA.modelo);
      const valorModelo = datos[0][indiceModelo];
      
      console.log(`\n🔢 COLUMNA DE MODELO DETECTADA POR IA REAL: "${resultadoIA.modelo}"`);
      console.log(`📊 Índice: ${indiceModelo}`);
      console.log(`📊 Valor en primera fila: "${valorModelo}"`);
      
      // Verificar si es un código
      if (typeof valorModelo === 'string' && valorModelo.match(/^[A-Z]\d+$/)) {
        console.log(`✅ La IA real detectó correctamente un código como modelo: ${valorModelo}`);
      } else {
        console.log(`❌ La IA real NO detectó un código como modelo: ${valorModelo}`);
      }
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
    console.error('❌ Error en el análisis con IA real:', error);
  });
  
} catch (error) {
  console.error('❌ Error general:', error.message);
}
