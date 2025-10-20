const XLSX = require('xlsx');
const fs = require('fs');

console.log('🔍 ANALIZANDO ARCHIVO EXCEL...\n');

try {
  // Leer el archivo Excel
  const workbook = XLSX.readFile('./archivo_analisis.xlsx');
  
  // Obtener nombres de las hojas
  const sheetNames = workbook.SheetNames;
  console.log('📋 Hojas disponibles:', sheetNames);
  
  // Analizar la primera hoja
  const firstSheetName = sheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  console.log(`\n📊 Analizando hoja: "${firstSheetName}"`);
  
  // Convertir a JSON para análisis
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  console.log(`\n📏 Dimensiones: ${jsonData.length} filas`);
  
  // Analizar las primeras 10 filas para ver la estructura
  console.log('\n🔍 PRIMERAS 10 FILAS:');
  for (let i = 0; i < Math.min(10, jsonData.length); i++) {
    console.log(`Fila ${i + 1}:`, jsonData[i]);
  }
  
  // Buscar la fila de headers (primera fila con datos consistentes)
  let headerRow = 0;
  for (let i = 0; i < Math.min(20, jsonData.length); i++) {
    const row = jsonData[i];
    if (row && row.length > 5 && row.some(cell => typeof cell === 'string' && cell.length > 0)) {
      headerRow = i;
      break;
    }
  }
  
  console.log(`\n📋 Fila de headers detectada: ${headerRow + 1}`);
  const headers = jsonData[headerRow];
  console.log('🔑 Headers encontrados:', headers);
  
  // Analizar tipos de datos en cada columna
  console.log('\n🔍 ANÁLISIS DE COLUMNAS:');
  headers.forEach((header, index) => {
    if (header && typeof header === 'string') {
      console.log(`\nColumna ${index + 1}: "${header}"`);
      
      // Analizar primeras 5 filas de datos de esta columna
      const sampleData = [];
      for (let i = headerRow + 1; i < Math.min(headerRow + 6, jsonData.length); i++) {
        const value = jsonData[i]?.[index];
        if (value !== undefined && value !== null && value !== '') {
          sampleData.push(value);
        }
      }
      
      console.log(`  Muestra de datos:`, sampleData);
      
      // Detectar tipo de columna
      const headerLower = header.toLowerCase();
      let tipoDetectado = 'Desconocido';
      
      if (headerLower.includes('codigo') || headerLower.includes('code') || headerLower.includes('sku')) {
        tipoDetectado = 'CÓDIGO';
      } else if (headerLower.includes('precio') || headerLower.includes('price') || headerLower.includes('pvp') || headerLower.includes('costo')) {
        tipoDetectado = 'PRECIO';
      } else if (headerLower.includes('marca') || headerLower.includes('brand') || headerLower.includes('fabricante')) {
        tipoDetectado = 'MARCA';
      } else if (headerLower.includes('producto') || headerLower.includes('descripcion') || headerLower.includes('nombre')) {
        tipoDetectado = 'PRODUCTO';
      } else if (headerLower.includes('tipo') || headerLower.includes('categoria') || headerLower.includes('clase')) {
        tipoDetectado = 'TIPO';
      }
      
      console.log(`  Tipo detectado: ${tipoDetectado}`);
      
      // Verificar si contiene códigos (formato L + números)
      const tieneCodigos = sampleData.some(val => 
        typeof val === 'string' && val.match(/^[A-Z]\d+$/)
      );
      if (tieneCodigos) {
        console.log(`  ⚠️  CONTIENE CÓDIGOS (L3000, etc.)`);
      }
      
      // Verificar si contiene precios (números con $ o formato monetario)
      const tienePrecios = sampleData.some(val => {
        if (typeof val === 'number') return val > 100;
        if (typeof val === 'string') {
          const cleanVal = val.replace(/[$,]/g, '');
          const numVal = parseFloat(cleanVal);
          return !isNaN(numVal) && numVal > 100;
        }
        return false;
      });
      if (tienePrecios) {
        console.log(`  💰 CONTIENE PRECIOS`);
      }
    }
  });
  
  console.log('\n✅ Análisis completado');
  
} catch (error) {
  console.error('❌ Error analizando archivo:', error.message);
}
