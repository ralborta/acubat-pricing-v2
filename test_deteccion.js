const XLSX = require('xlsx');

console.log('🔍 PROBANDO DETECCIÓN DE COLUMNAS...\n');

try {
  // Leer el archivo Excel
  const workbook = XLSX.readFile('./archivo_analisis.xlsx');
  const worksheet = workbook.Sheets['LISTA DE PRECIOS HM N°9'];
  
  // Convertir a JSON
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  // Encontrar headers (fila 2)
  const headers = jsonData[1]; // Fila 2 (índice 1)
  console.log('📋 Headers encontrados:', headers);
  
  // Simular la función detectarColumnas
  function detectarColumnas(headers) {
    console.log('\n🔍 SIMULANDO detectarColumnas...');
    console.log('📋 Headers recibidos:', headers);
    
    const mapeo = {
      producto: '',
      precio: '',
      tipo: '',
      modelo: ''
    };
    
    // Buscar patrones de precio (PRIORIZAR PVP Off Line)
    // Primero buscar patrones específicos de PVP Off Line
    const pvpOffLinePatterns = ['pvp off line', 'pvp_off_line', 'pvp off', 'off line', 'offline'];
    console.log('🔍 Patrones PVP Off Line:', pvpOffLinePatterns);
    
    const buscarHeaderEnFilas = (patrones, nombre) => {
      console.log(`🔍 Buscando '${nombre}' con patrones:`, patrones);
      for (const header of headers) {
        if (header && typeof header === 'string') {
          const headerLower = header.toLowerCase();
          console.log(`  - Probando header: "${header}" (lowercase: "${headerLower}")`);
          
          for (const pattern of patrones) {
            if (headerLower.includes(pattern)) {
              console.log(`    ✅ MATCH! Patrón "${pattern}" encontrado en "${header}"`);
              return header;
            } else {
              console.log(`    ❌ No match: "${pattern}" no está en "${headerLower}"`);
            }
          }
        }
      }
      console.log(`❌ Header '${nombre}' NO encontrado`);
      return '';
    };
    
    mapeo.precio = buscarHeaderEnFilas(pvpOffLinePatterns, 'pvp off line');
    
    // Si no se encontró PVP Off Line, buscar otros patrones de precio
    if (!mapeo.precio) {
      const precioPatterns = ['precio', 'costo', 'valor', 'price', 'cost', 'pvp', 'pdv', 'lista', 'venta', 'publico', 'final'];
      console.log('🔍 Patrones de precio genéricos:', precioPatterns);
      mapeo.precio = buscarHeaderEnFilas(precioPatterns, 'precio');
    }
    
    console.log('\n📊 RESULTADO FINAL:');
    console.log('Mapeo:', mapeo);
    
    return mapeo;
  }
  
  // Probar la detección
  const resultado = detectarColumnas(headers);
  
  // Mostrar datos de muestra
  console.log('\n📊 DATOS DE MUESTRA (primera fila de datos):');
  const primeraFilaDatos = jsonData[2]; // Fila 3 (índice 2)
  console.log('Fila de datos:', primeraFilaDatos);
  
  if (resultado.precio) {
    const indicePrecio = headers.indexOf(resultado.precio);
    console.log(`\n💰 Columna de precio detectada: "${resultado.precio}"`);
    console.log(`📊 Índice: ${indicePrecio}`);
    console.log(`📊 Valor en primera fila: "${primeraFilaDatos[indicePrecio]}"`);
  } else {
    console.log('\n❌ NO se detectó columna de precio');
  }
  
  // Buscar "PVP Off Line" manualmente
  console.log('\n🔍 BÚSQUEDA MANUAL DE "PVP Off Line":');
  const indicePVPOffLine = headers.indexOf('PVP Off Line');
  console.log(`Índice de "PVP Off Line": ${indicePVPOffLine}`);
  if (indicePVPOffLine !== -1) {
    console.log(`Valor en primera fila: "${primeraFilaDatos[indicePVPOffLine]}"`);
  }
  
} catch (error) {
  console.error('❌ Error:', error.message);
}
