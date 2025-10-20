// Test para verificar el contenido real de las hojas 4 y 5
const XLSX = require('xlsx');

async function testHojasDetalle() {
    console.log('🔍 TEST HOJAS DETALLE - VERIFICAR CONTENIDO REAL');
    console.log('===============================================');
    
    try {
        const archivoPath = '/Users/ralborta/Downloads/Acubat/Lista Moura 04 (1).xlsx';
        const workbook = XLSX.readFile(archivoPath);
        
        // Analizar hoja 4
        console.log('\n--- HOJA 4: "Table 4" ---');
        const worksheet4 = workbook.Sheets['Table 4'];
        
        // Leer las primeras 5 filas para ver la estructura
        console.log('📋 Primera fila (headers):', XLSX.utils.sheet_to_json(worksheet4, { range: 0, header: 1 }));
        console.log('📋 Segunda fila:', XLSX.utils.sheet_to_json(worksheet4, { range: 1, header: 1 }));
        console.log('📋 Tercera fila:', XLSX.utils.sheet_to_json(worksheet4, { range: 2, header: 1 }));
        console.log('📋 Cuarta fila:', XLSX.utils.sheet_to_json(worksheet4, { range: 3, header: 1 }));
        console.log('📋 Quinta fila:', XLSX.utils.sheet_to_json(worksheet4, { range: 4, header: 1 }));
        
        // Buscar "Precio Unitario" en todas las filas
        console.log('\n🔍 Buscando "Precio Unitario" en hoja 4:');
        for (let i = 0; i < 10; i++) {
            const fila = XLSX.utils.sheet_to_json(worksheet4, { range: i, header: 1 });
            if (fila.length > 0) {
                const valores = Object.values(fila[0]);
                const tienePrecioUnitario = valores.some(v => v && v.toString().toLowerCase().includes('precio unitario'));
                if (tienePrecioUnitario) {
                    console.log(`  ✅ Fila ${i}:`, valores);
                }
            }
        }
        
        // Analizar hoja 5
        console.log('\n--- HOJA 5: "Table 5" ---');
        const worksheet5 = workbook.Sheets['Table 5'];
        
        // Leer las primeras 5 filas para ver la estructura
        console.log('📋 Primera fila (headers):', XLSX.utils.sheet_to_json(worksheet5, { range: 0, header: 1 }));
        console.log('📋 Segunda fila:', XLSX.utils.sheet_to_json(worksheet5, { range: 1, header: 1 }));
        console.log('📋 Tercera fila:', XLSX.utils.sheet_to_json(worksheet5, { range: 2, header: 1 }));
        console.log('📋 Cuarta fila:', XLSX.utils.sheet_to_json(worksheet5, { range: 3, header: 1 }));
        console.log('📋 Quinta fila:', XLSX.utils.sheet_to_json(worksheet5, { range: 4, header: 1 }));
        
        // Buscar "Precio de Lista" en todas las filas
        console.log('\n🔍 Buscando "Precio de Lista" en hoja 5:');
        for (let i = 0; i < 10; i++) {
            const fila = XLSX.utils.sheet_to_json(worksheet5, { range: i, header: 1 });
            if (fila.length > 0) {
                const valores = Object.values(fila[0]);
                const tienePrecioLista = valores.some(v => v && v.toString().toLowerCase().includes('precio de lista'));
                if (tienePrecioLista) {
                    console.log(`  ✅ Fila ${i}:`, valores);
                }
            }
        }
        
        // Buscar cualquier columna que contenga "precio"
        console.log('\n🔍 Buscando cualquier columna con "precio" en hoja 5:');
        for (let i = 0; i < 10; i++) {
            const fila = XLSX.utils.sheet_to_json(worksheet5, { range: i, header: 1 });
            if (fila.length > 0) {
                const valores = Object.values(fila[0]);
                const tienePrecio = valores.some(v => v && v.toString().toLowerCase().includes('precio'));
                if (tienePrecio) {
                    console.log(`  ✅ Fila ${i}:`, valores);
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

testHojasDetalle();
