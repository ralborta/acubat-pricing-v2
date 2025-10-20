const XLSX = require('xlsx');

console.log('🔍 PRUEBA COMPLETA DE DETECCIÓN DE COLUMNAS...\n');

try {
  // Leer el archivo Excel
  const workbook = XLSX.readFile('./archivo_analisis.xlsx');
  const worksheet = workbook.Sheets['LISTA DE PRECIOS HM N°9'];
  
  // Convertir a JSON
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  // Encontrar headers (fila 2)
  const headers = jsonData[1]; // Fila 2 (índice 1)
  console.log('📋 Headers encontrados:', headers);
  
  // Obtener datos de muestra (primera fila de datos)
  const primeraFilaDatos = jsonData[2]; // Fila 3 (índice 2)
  console.log('📊 Primera fila de datos:', primeraFilaDatos);
  
  // ============================================================================
  // PASO 1: SIMULAR lib/column-ai.ts - detectarColumnas()
  // ============================================================================
  console.log('\n🔍 === PASO 1: DETECCIÓN INICIAL (lib/column-ai.ts) ===');
  
  function detectarColumnas(headers) {
    console.log('🔍 Detectando columnas con IA simple...');
    console.log('📋 Headers recibidos:', headers);
    
    const mapeo = {
      producto: '',
      precio: '',
      tipo: '',
      modelo: '',
      codigo: '',
      marca: ''
    };
    
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
            }
          }
        }
      }
      console.log(`❌ Header '${nombre}' NO encontrado`);
      return '';
    };
    
    // Buscar columna de código
    const codigoPatterns = ['codigo', 'code', 'sku', 'referencia', 'ref', 'articulo', 'unitaro'];
    mapeo.codigo = buscarHeaderEnFilas(codigoPatterns, 'codigo');
    
    // Buscar columna de precio (PRIORIZAR PVP Off Line)
    const pvpOffLinePatterns = ['pvp off line', 'pvp_off_line', 'pvp off', 'off line', 'offline'];
    mapeo.precio = buscarHeaderEnFilas(pvpOffLinePatterns, 'pvp off line');
    
    // Si no se encontró PVP Off Line, buscar otros patrones de precio
    if (!mapeo.precio) {
      const precioPatterns = ['precio', 'costo', 'valor', 'price', 'cost', 'pvp', 'pdv', 'lista', 'venta', 'publico', 'final'];
      mapeo.precio = buscarHeaderEnFilas(precioPatterns, 'precio');
    }
    
    // Buscar columna de marca
    const marcaPatterns = ['marca', 'brand', 'fabricante', 'manufacturer', 'proveedor', 'supplier'];
    mapeo.marca = buscarHeaderEnFilas(marcaPatterns, 'marca');
    
    // Buscar columna de producto
    const productoPatterns = ['producto', 'nombre', 'descripcion', 'item', 'articulo'];
    mapeo.producto = buscarHeaderEnFilas(productoPatterns, 'producto');
    
    return mapeo;
  }
  
  const mapeoInicial = detectarColumnas(headers);
  console.log('\n📊 RESULTADO PASO 1 (detectarColumnas):');
  console.log('Mapeo inicial:', mapeoInicial);
  
  // ============================================================================
  // PASO 2: SIMULAR app/api/pricing/procesar-archivo/route.ts - Análisis de contenido
  // ============================================================================
  console.log('\n🔍 === PASO 2: ANÁLISIS DE CONTENIDO (procesar-archivo/route.ts) ===');
  
  function analizarContenido(headers, datos, mapeoInicial) {
    console.log('🔍 Analizando contenido de columnas...');
    
    let mapeo = { ...mapeoInicial };
    
    // Si no se detectó precio, buscar por contenido numérico
    if (!mapeo.precio) {
      console.log('⚠️ No se detectó columna de precio por nombre, buscando por contenido...');
      
      for (let i = 0; i < headers.length; i++) {
        const header = headers[i];
        if (!header || typeof header !== 'string') continue;
        
        const headerLower = header.toLowerCase();
        console.log(`\n🔍 Analizando columna ${i + 1}: "${header}"`);
        
        // Verificar si la columna contiene valores que parecen precios
        if (header && !headerLower.includes('codigo') && 
            !headerLower.includes('code') && 
            !headerLower.includes('sku') &&
            !headerLower.includes('referencia') &&
            !headerLower.includes('ref') &&
            !headerLower.includes('articulo') &&
            !headerLower.includes('unitaro') &&
            !headerLower.includes('marca') &&
            !headerLower.includes('brand') &&
            !headerLower.includes('fabricante') &&
            !headerLower.includes('manufacturer') &&
            !headerLower.includes('tipo') &&
            !headerLower.includes('categoria') &&
            !headerLower.includes('clase') &&
            !headerLower.includes('grupo') &&
            !headerLower.includes('category') &&
            !headerLower.includes('funcion') &&
            !headerLower.includes('función') &&
            !headerLower.includes('modelo') &&
            !headerLower.includes('model') &&
            !headerLower.includes('descripcion') &&
            !headerLower.includes('description') &&
            !headerLower.includes('detalle') &&
            !headerLower.includes('comentario')) {
          
          // Analizar contenido de la columna
          const sampleData = datos[i];
          console.log(`  📊 Muestra de datos: "${sampleData}" (tipo: ${typeof sampleData})`);
          
          if (sampleData !== undefined && sampleData !== null && sampleData !== '') {
            let valor = parseFloat(sampleData);
            
            if (isNaN(valor) && typeof sampleData === 'string') {
              const valorLimpio = sampleData.replace(/\./g, '').replace(',', '.');
              valor = parseFloat(valorLimpio);
            }
            
            console.log(`  📊 Valor parseado: ${valor}`);
            
            // Verificar que no sea un código
            const esCodigo = headerLower.includes('codigo') || 
                           headerLower.includes('code') || 
                           headerLower.includes('sku') ||
                           headerLower.includes('referencia') ||
                           headerLower.includes('ref') ||
                           headerLower.includes('articulo') ||
                           headerLower.includes('unitaro') ||
                           headerLower.includes('marca') ||
                           headerLower.includes('brand') ||
                           headerLower.includes('fabricante') ||
                           headerLower.includes('manufacturer') ||
                           headerLower.includes('tipo') ||
                           headerLower.includes('categoria') ||
                           headerLower.includes('clase') ||
                           headerLower.includes('grupo') ||
                           headerLower.includes('category') ||
                           headerLower.includes('funcion') ||
                           headerLower.includes('función') ||
                           headerLower.includes('modelo') ||
                           headerLower.includes('model') ||
                           headerLower.includes('descripcion') ||
                           headerLower.includes('description') ||
                           headerLower.includes('detalle') ||
                           headerLower.includes('comentario');
            
            if (valor > 1000 && valor < 1000000 && !esCodigo) {
              mapeo.precio = header;
              console.log(`✅ Precio detectado por ANÁLISIS DE CONTENIDO en '${header}': ${valor}`);
              break;
            } else if (esCodigo) {
              console.log(`❌ Ignorando columna '${header}' porque parece ser código, no precio`);
            } else {
              console.log(`❌ Valor ${valor} no está en rango de precios (1000-1000000)`);
            }
          }
        } else {
          console.log(`❌ Columna '${header}' excluida por contener palabras de código/descripción`);
        }
      }
    }
    
    return mapeo;
  }
  
  const mapeoConContenido = analizarContenido(headers, primeraFilaDatos, mapeoInicial);
  console.log('\n📊 RESULTADO PASO 2 (análisis de contenido):');
  console.log('Mapeo con contenido:', mapeoConContenido);
  
  // ============================================================================
  // PASO 3: SIMULAR búsqueda alternativa de precios
  // ============================================================================
  console.log('\n🔍 === PASO 3: BÚSQUEDA ALTERNATIVA DE PRECIOS ===');
  
  function busquedaAlternativa(headers, datos, mapeoActual) {
    console.log('🔍 Búsqueda alternativa de precios...');
    
    let mapeo = { ...mapeoActual };
    
    if (!mapeo.precio) {
      console.log('⚠️ No se encontró precio, iniciando búsqueda alternativa...');
      
      // Buscar en todas las columnas que no sean códigos
      for (let i = 0; i < headers.length; i++) {
        const header = headers[i];
        if (!header || typeof header !== 'string') continue;
        
        const headerLower = header.toLowerCase();
        const esCodigo = headerLower.includes('codigo') || 
                        headerLower.includes('code') || 
                        headerLower.includes('sku') ||
                        headerLower.includes('referencia') ||
                        headerLower.includes('ref') ||
                        headerLower.includes('articulo') ||
                        headerLower.includes('unitaro');
        
        if (!esCodigo) {
          const valor = datos[i];
          console.log(`🔍 Probando columna "${header}": ${valor}`);
          
          if (valor !== undefined && valor !== null && valor !== '') {
            let precio = parseFloat(valor);
            
            if (isNaN(precio) && typeof valor === 'string') {
              const valorLimpio = valor.replace(/\./g, '').replace(',', '.');
              precio = parseFloat(valorLimpio);
            }
            
            if (!isNaN(precio) && precio > 1000 && precio < 1000000) {
              mapeo.precio = header;
              console.log(`✅ Precio encontrado por búsqueda alternativa en '${header}': ${precio}`);
              break;
            }
          }
        }
      }
    }
    
    return mapeo;
  }
  
  const mapeoFinal = busquedaAlternativa(headers, primeraFilaDatos, mapeoConContenido);
  console.log('\n📊 RESULTADO PASO 3 (búsqueda alternativa):');
  console.log('Mapeo final:', mapeoFinal);
  
  // ============================================================================
  // RESUMEN FINAL
  // ============================================================================
  console.log('\n🎯 === RESUMEN FINAL ===');
  console.log('📋 Headers del archivo:', headers);
  console.log('📊 Primera fila de datos:', primeraFilaDatos);
  console.log('🔍 Mapeo final de columnas:', mapeoFinal);
  
  if (mapeoFinal.precio) {
    const indicePrecio = headers.indexOf(mapeoFinal.precio);
    console.log(`\n💰 COLUMNA DE PRECIO DETECTADA: "${mapeoFinal.precio}"`);
    console.log(`📊 Índice: ${indicePrecio}`);
    console.log(`📊 Valor en primera fila: "${primeraFilaDatos[indicePrecio]}"`);
    
    // Verificar si es un código
    const valorPrecio = primeraFilaDatos[indicePrecio];
    if (typeof valorPrecio === 'string' && valorPrecio.match(/^[A-Z]\d+$/)) {
      console.log(`❌ ERROR: La columna de precio contiene un código! (${valorPrecio})`);
    } else {
      console.log(`✅ La columna de precio contiene un valor válido: ${valorPrecio}`);
    }
  } else {
    console.log('\n❌ NO se detectó columna de precio');
  }
  
  // Mostrar todas las columnas con sus valores
  console.log('\n📋 TODAS LAS COLUMNAS CON SUS VALORES:');
  headers.forEach((header, index) => {
    const valor = primeraFilaDatos[index];
    console.log(`${index + 1}. "${header}": "${valor}"`);
  });
  
} catch (error) {
  console.error('❌ Error:', error.message);
}
