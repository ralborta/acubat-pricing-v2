const XLSX = require('xlsx');
const path = require('path');

async function testBackendCompleto() {
  try {
    console.log('🔍 TEST COMPLETO: Simulando flujo del backend...\n');
    
    const filePath = '/Users/ralborta/Downloads/Acubat/Lista Moura 04 (1).xlsx';
    const workbook = XLSX.readFile(filePath);
    
    console.log('📋 HOJAS DISPONIBLES:', workbook.SheetNames);
    
    // 🎯 SIMULAR EXACTAMENTE EL ALGORITMO DEL BACKEND
    const diagnosticoHojas = [];
    
    for (let i = 0; i < workbook.SheetNames.length; i++) {
      const sheetName = workbook.SheetNames[i];
      const worksheet = workbook.Sheets[sheetName];
      
      console.log(`\n🔍 Analizando hoja "${sheetName}":`);
      
      // Leer datos de la hoja
      let datosHoja = XLSX.utils.sheet_to_json(worksheet);
      
      if (datosHoja.length === 0) {
        console.log(`  ❌ Hoja vacía`);
        diagnosticoHojas.push({ nombre: sheetName, filas: 0, descartada: true, razon: 'Hoja vacía' });
        continue;
      }
      
      // Aplicar detección dinámica de headers
      const matriz = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
      let headerRowIndex = -1;
      const indicadores = ['pvp off line', 'precio de lista', 'precio unitario', 'código', 'codigo', 'descripcion', 'descripción', 'rubro', 'marca'];
      
      for (let r = 0; r < Math.min(matriz.length, 40); r++) {
        const fila = (matriz[r] || []).map(c => String(c || '').toLowerCase());
        const noVacios = fila.filter(x => x.trim() !== '').length;
        const tieneIndicador = indicadores.some(ind => fila.some(cell => cell.includes(ind)));
        
        if (tieneIndicador && noVacios >= 3) {
          headerRowIndex = r;
          break;
        }
      }
      
      if (headerRowIndex < 0) headerRowIndex = 0;
      
      const datosHojaCorregidos = XLSX.utils.sheet_to_json(worksheet, { range: headerRowIndex });
      const headersHoja = Object.keys(datosHojaCorregidos[0] || {});
      
      console.log(`  📋 Headers detectados (fila ${headerRowIndex}):`, headersHoja.slice(0, 5));
      
      // Buscar columnas clave
      const pvpOffLine = headersHoja.find(h => h && h.toLowerCase().includes('pvp off line'));
      const precioLista = headersHoja.find(h => h && h.toLowerCase().includes('precio de lista'));
      const precioUnitario = headersHoja.find(h => h && h.toLowerCase().includes('precio unitario'));
      const codigo = headersHoja.find(h => h && h.toLowerCase().includes('codigo'));
      const marca = headersHoja.find(h => h && h.toLowerCase().includes('marca'));
      const descripcion = headersHoja.find(h => h && h.toLowerCase().includes('descripcion'));
      const rubro = headersHoja.find(h => h && h.toLowerCase().includes('rubro'));
      
      const tienePrecio = pvpOffLine || precioLista || precioUnitario;
      
      // Calcular score
      let score = 0;
      if (pvpOffLine) score += 5;
      else if (precioLista) score += 4;
      else if (precioUnitario) score += 3;
      
      if (codigo) score += 3;
      if (marca) score += 3;
      if (descripcion) score += 2;
      if (rubro) score += 1;
      
      if (datosHojaCorregidos.length >= 10) score += 5;
      else if (datosHojaCorregidos.length >= 5) score += 3;
      else if (datosHojaCorregidos.length >= 2) score += 1;
      
      if (datosHojaCorregidos.length < 2) score = 0;
      
      const columnasClave = [tienePrecio, codigo, marca, descripcion, rubro].filter(Boolean).length;
      if (columnasClave >= 3) score += 2;
      if (columnasClave >= 4) score += 3;
      
      // 🎯 FLEXIBILIDAD: Si tiene código y datos, es válida aunque no tenga precio
      if (codigo && datosHojaCorregidos.length >= 5) {
        score = Math.max(score, 3);
      }
      
      // 🎯 LÓGICA FLEXIBLE: Descartar solo si no tiene datos o score muy bajo
      const descartada = score < 2 || datosHojaCorregidos.length < 2;
      
      console.log(`  📊 Score: ${score} (${datosHojaCorregidos.length} filas) - ${descartada ? 'DESCARTADA' : 'VÁLIDA'}`);
      
      diagnosticoHojas.push({ 
        nombre: sheetName, 
        filas: datosHojaCorregidos.length, 
        headers: headersHoja.slice(0, 10), 
        pvpOffLine, 
        precioLista, 
        precioUnitario, 
        descartada,
        score,
        razon: descartada ? (score < 2 ? 'Score muy bajo' : 'Sin datos') : 'Válida'
      });
    }
    
    // 🎯 PROCESAR TODAS LAS HOJAS VÁLIDAS (COMO EN EL BACKEND)
    const hojasValidas = diagnosticoHojas.filter(h => !h.descartada && h.filas > 0);
    
    console.log('\n📊 DIAGNÓSTICO FINAL:');
    diagnosticoHojas.forEach(h => {
      console.log(`  ${h.descartada ? '❌' : '✅'} ${h.nombre}: ${h.filas} filas, score ${h.score} (${h.razon})`);
    });
    
    if (hojasValidas.length === 0) {
      console.log('❌ No se encontró una hoja válida con datos de productos');
      return;
    }
    
    console.log(`\n✅ HOJAS VÁLIDAS ENCONTRADAS: ${hojasValidas.length}`);
    console.log(`📊 Procesando hojas:`, hojasValidas.map(h => `${h.nombre}(${h.filas})`));
    
    // 🎯 SIMULAR EL PROCESAMIENTO DE CADA HOJA (COMO EN EL BACKEND)
    let todosLosProductos = [];
    let todosLosHeaders = [];
    
    for (const hojaInfo of hojasValidas) {
      const worksheet = workbook.Sheets[hojaInfo.nombre];
      console.log(`\n🔍 Procesando hoja: ${hojaInfo.nombre}`);
      
      // Aplicar la misma detección dinámica de headers
      const matriz = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
      let headerRowIndex = -1;
      const indicadores = ['pvp off line', 'precio de lista', 'precio unitario', 'código', 'codigo', 'descripcion', 'descripción', 'rubro', 'marca'];
      
      for (let r = 0; r < Math.min(matriz.length, 40); r++) {
        const fila = (matriz[r] || []).map(c => String(c || '').toLowerCase());
        const noVacios = fila.filter(x => x.trim() !== '').length;
        const tieneIndicador = indicadores.some(ind => fila.some(cell => cell.includes(ind)));
        if (tieneIndicador && noVacios >= 3) {
          headerRowIndex = r;
          break;
        }
      }
      
      if (headerRowIndex < 0) headerRowIndex = 0;
      
      const datosHoja = XLSX.utils.sheet_to_json(worksheet, { range: headerRowIndex });
      const headersHoja = Object.keys(datosHoja[0] || {});
      
      console.log(`  📋 Headers detectados:`, headersHoja.slice(0, 5));
      
      // Filtrar productos válidos de esta hoja
      const datosFiltrados = datosHoja.filter((producto) => {
        const valores = Object.values(producto).map(v => String(v || '').toLowerCase());
        const esNota = valores.some(v => v.includes('nota') || v.includes('tel:') || v.includes('bornes') || v.includes('precios para la compra'));
        const esTitulo = valores.some(v => v.includes('sistema de pricing') || v.includes('optimizado para máximo rendimiento'));
        const esVacio = valores.every(v => v.trim() === '');
        return !esNota && !esTitulo && !esVacio;
      });
      
      console.log(`  📊 Productos válidos en ${hojaInfo.nombre}: ${datosFiltrados.length} de ${datosHoja.length}`);
      
      // Agregar a la lista total
      todosLosProductos = [...todosLosProductos, ...datosFiltrados];
      todosLosHeaders = headersHoja; // Usar headers de la última hoja procesada
    }
    
    console.log(`\n🎯 TOTAL FINAL: ${todosLosProductos.length} productos de ${hojasValidas.length} hojas`);
    
    // Mostrar algunos productos de cada hoja para verificar
    console.log('\n📋 MUESTRA DE PRODUCTOS POR HOJA:');
    let contador = 0;
    for (const hojaInfo of hojasValidas) {
      const productosHoja = todosLosProductos.slice(contador, contador + hojaInfo.filas);
      console.log(`\n🔍 ${hojaInfo.nombre} (${productosHoja.length} productos):`);
      productosHoja.slice(0, 3).forEach((p, i) => {
        console.log(`  ${i + 1}. ${JSON.stringify(p, null, 2).slice(0, 200)}...`);
      });
      contador += hojaInfo.filas;
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testBackendCompleto();
