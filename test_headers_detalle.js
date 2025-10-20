// Test para verificar los headers específicos de las hojas 4 y 5
const XLSX = require('xlsx');

async function testHeadersDetalle() {
    console.log('🔍 TEST HEADERS DETALLE - VERIFICAR HEADERS DE HOJAS 4 Y 5');
    console.log('=========================================================');
    
    try {
        const archivoPath = '/Users/ralborta/Downloads/Acubat/Lista Moura 04 (1).xlsx';
        const workbook = XLSX.readFile(archivoPath);
        
        // Analizar hoja 4
        console.log('\n--- HOJA 4: "Table 4" ---');
        const worksheet4 = workbook.Sheets['Table 4'];
        let datos4 = XLSX.utils.sheet_to_json(worksheet4);
        
        console.log('📋 Headers originales:', Object.keys(datos4[0] || {}));
        console.log('📊 Primera fila:', datos4[0]);
        
        // Aplicar corrección
        datos4 = XLSX.utils.sheet_to_json(worksheet4, { range: 1 });
        console.log('📋 Headers corregidos:', Object.keys(datos4[0] || {}));
        console.log('📊 Primera fila corregida:', datos4[0]);
        
        // Buscar columnas de precio
        const headers4 = Object.keys(datos4[0] || {});
        const precioLista4 = headers4.find(h => h && h.toLowerCase().includes('precio de lista'));
        const precioUnitario4 = headers4.find(h => h && h.toLowerCase().includes('precio unitario'));
        const precio4 = headers4.find(h => h && h.toLowerCase().includes('precio'));
        
        console.log('🔍 Búsqueda de precio:');
        console.log(`  - "precio de lista": ${precioLista4 ? `"${precioLista4}"` : 'NO'}`);
        console.log(`  - "precio unitario": ${precioUnitario4 ? `"${precioUnitario4}"` : 'NO'}`);
        console.log(`  - "precio": ${precio4 ? `"${precio4}"` : 'NO'}`);
        
        // Mostrar todas las columnas que contienen "precio"
        const columnasConPrecio = headers4.filter(h => h && h.toLowerCase().includes('precio'));
        console.log(`  - Todas las columnas con "precio":`, columnasConPrecio);
        
        // Analizar hoja 5
        console.log('\n--- HOJA 5: "Table 5" ---');
        const worksheet5 = workbook.Sheets['Table 5'];
        let datos5 = XLSX.utils.sheet_to_json(worksheet5);
        
        console.log('📋 Headers originales:', Object.keys(datos5[0] || {}));
        console.log('📊 Primera fila:', datos5[0]);
        
        // Aplicar corrección
        datos5 = XLSX.utils.sheet_to_json(worksheet5, { range: 1 });
        console.log('📋 Headers corregidos:', Object.keys(datos5[0] || {}));
        console.log('📊 Primera fila corregida:', datos5[0]);
        
        // Buscar columnas de precio
        const headers5 = Object.keys(datos5[0] || {});
        const precioLista5 = headers5.find(h => h && h.toLowerCase().includes('precio de lista'));
        const precioUnitario5 = headers5.find(h => h && h.toLowerCase().includes('precio unitario'));
        const precio5 = headers5.find(h => h && h.toLowerCase().includes('precio'));
        
        console.log('🔍 Búsqueda de precio:');
        console.log(`  - "precio de lista": ${precioLista5 ? `"${precioLista5}"` : 'NO'}`);
        console.log(`  - "precio unitario": ${precioUnitario5 ? `"${precioUnitario5}"` : 'NO'}`);
        console.log(`  - "precio": ${precio5 ? `"${precio5}"` : 'NO'}`);
        
        // Mostrar todas las columnas que contienen "precio"
        const columnasConPrecio5 = headers5.filter(h => h && h.toLowerCase().includes('precio'));
        console.log(`  - Todas las columnas con "precio":`, columnasConPrecio5);
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

testHeadersDetalle();
