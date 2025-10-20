const XLSX = require('xlsx');
const OpenAI = require('openai');

console.log('🔍 TEST CASO PROBLEMÁTICO - Simulando cuando la IA devuelve código como precio...\n');

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
  // SIMULAR EL CASO PROBLEMÁTICO: IA devuelve código como precio
  // ============================================================================
  console.log('\n🤖 === SIMULANDO CASO PROBLEMÁTICO ===');
  
  // Simular que la IA devuelve código como precio (caso problemático)
  const mapeoProblematico = {
    tipo: 'RUBRO',
    modelo: 'CODIGO', 
    precio_ars: 'CODIGO', // ← PROBLEMA: IA devuelve código como precio
    descripcion: 'DESCRIPCION',
    proveedor: 'MARCA'
  };
  
  console.log('🧠 Mapeo problemático de la IA:', mapeoProblematico);
  
  // ============================================================================
  // SIMULAR LA VALIDACIÓN AGRESIVA DEL CÓDIGO DE PRODUCCIÓN
  // ============================================================================
  console.log('\n🔍 === SIMULANDO VALIDACIÓN AGRESIVA ===');
  
  // Simular el mapeo que devuelve la IA
  let columnMapping = {
    tipo: mapeoProblematico.tipo || '',
    modelo: mapeoProblematico.modelo || '',
    precio: mapeoProblematico.precio_ars || '',
    descripcion: mapeoProblematico.descripcion || '',
    proveedor: mapeoProblematico.proveedor || ''
  };
  
  console.log('🔧 RESULTADO INICIAL:', columnMapping);
  
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
  // SIMULAR LA SEGUNDA VALIDACIÓN (línea 741) QUE SOBRESCRIBE
  // ============================================================================
  console.log('\n🔍 === SEGUNDA VALIDACIÓN (línea 741) - ESTA SOBRESCRIBE ===');
  
  // 🚨 VALIDACIÓN CRÍTICA: Verificar que precio no esté mapeado a código
  if (columnMapping.precio && datos[0]) {
    const valorPrecio = datos[0][headers.indexOf(columnMapping.precio)]
    console.log(`🔍 VALIDACIÓN PRECIO: Columna '${columnMapping.precio}' contiene: '${valorPrecio}'`)
    if (typeof valorPrecio === 'string' && valorPrecio.match(/^[A-Z]\d+$/)) {
      console.log(`❌ ERROR: La columna de precio está mapeada a un código! Ignorando...`)
      columnMapping.precio = ''
    }
  }
  
  console.log('🔧 RESULTADO DESPUÉS DE SEGUNDA VALIDACIÓN:', columnMapping);
  
  // ============================================================================
  // RESULTADO FINAL
  // ============================================================================
  console.log('\n🎯 === RESULTADO FINAL ===');
  
  // Verificar si el precio está correcto
  if (columnMapping.precio === 'PVP Off Line') {
    console.log('✅ ¡PERFECTO! El precio está mapeado correctamente a "PVP Off Line"');
  } else if (columnMapping.precio === '') {
    console.log('❌ PROBLEMA: El precio fue eliminado por la segunda validación!');
    console.log('   Esto es lo que está pasando en producción');
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
  
} catch (error) {
  console.error('❌ Error general:', error.message);
}
