// Test para analizar archivos con múltiples hojas
const XLSX = require('xlsx');

async function testMultipleSheets() {
    console.log('🔍 TEST MÚLTIPLES HOJAS - ANALIZAR ESTRUCTURA');
    console.log('==============================================');
    
    try {
        // Leer el archivo con múltiples hojas
        const archivoPath = '/Users/ralborta/Downloads/Lista Moura 04 (1).xlsx';
        const workbook = XLSX.readFile(archivoPath);
        
        console.log('📋 HOJAS DISPONIBLES:');
        workbook.SheetNames.forEach((sheetName, index) => {
            console.log(`  ${index + 1}: "${sheetName}"`);
        });
        
        console.log('\n🔍 ANÁLISIS DE CADA HOJA:');
        
        for (let i = 0; i < workbook.SheetNames.length; i++) {
            const sheetName = workbook.SheetNames[i];
            const worksheet = workbook.Sheets[sheetName];
            
            console.log(`\n--- HOJA ${i + 1}: "${sheetName}" ---`);
            
            // Convertir a JSON para analizar
            const datos = XLSX.utils.sheet_to_json(worksheet);
            
            if (datos.length === 0) {
                console.log('❌ Hoja vacía');
                continue;
            }
            
            // Detección inteligente de headers (como en el código real)
            let headers = Object.keys(datos[0] || {});
            
            // Verificar si la primera fila es un título
            const primeraFila = datos[0];
            const esTitulo = primeraFila && Object.values(primeraFila).some(valor => 
                typeof valor === 'string' && 
                (valor.includes('LISTA') || 
                 valor.includes('PRECIOS') || 
                 valor.includes('MOURA') ||
                 valor.length > 50)
            );
            
            const tieneEmptyColumns = headers.filter(h => h.startsWith('__EMPTY')).length > 5;
            
            if (esTitulo || tieneEmptyColumns) {
                console.log('🔍 Detectado título o estructura compleja, usando segunda fila como headers');
                const datosCorregidos = XLSX.utils.sheet_to_json(worksheet, { range: 1 });
                headers = Object.keys(datosCorregidos[0] || {});
            }
            
            console.log(`📊 Filas de datos: ${datos.length}`);
            console.log(`📋 Headers detectados: ${headers.length}`);
            console.log('📝 Headers:');
            headers.forEach((header, j) => {
                console.log(`  ${j + 1}: "${header}"`);
            });
            
            // Buscar columnas clave
            const pvpOffLine = headers.find(h => h && h.toLowerCase().includes('pvp off line'));
            const codigo = headers.find(h => h && h.toLowerCase().includes('codigo'));
            const rubro = headers.find(h => h && h.toLowerCase().includes('rubro'));
            const marca = headers.find(h => h && h.toLowerCase().includes('marca'));
            const descripcion = headers.find(h => h && h.toLowerCase().includes('descripcion'));
            
            console.log('🎯 COLUMNAS CLAVE ENCONTRADAS:');
            console.log(`  PVP Off Line: ${pvpOffLine ? `"${pvpOffLine}"` : 'NO'}`);
            console.log(`  CODIGO: ${codigo ? `"${codigo}"` : 'NO'}`);
            console.log(`  RUBRO: ${rubro ? `"${rubro}"` : 'NO'}`);
            console.log(`  MARCA: ${marca ? `"${marca}"` : 'NO'}`);
            console.log(`  DESCRIPCION: ${descripcion ? `"${descripcion}"` : 'NO'}`);
            
            // Mostrar muestra de datos
            if (datos.length > 0) {
                console.log('📊 MUESTRA DE DATOS (primeras 3 filas):');
                datos.slice(0, 3).forEach((fila, k) => {
                    console.log(`  Fila ${k + 1}:`);
                    Object.entries(fila).slice(0, 5).forEach(([key, value]) => {
                        console.log(`    ${key}: "${value}"`);
                    });
                });
            }
        }
        
        // Determinar cuál hoja usar
        console.log('\n🎯 RECOMENDACIÓN DE HOJA:');
        let mejorHoja = null;
        let mejorScore = 0;
        
        for (let i = 0; i < workbook.SheetNames.length; i++) {
            const sheetName = workbook.SheetNames[i];
            const worksheet = workbook.Sheets[sheetName];
            const datos = XLSX.utils.sheet_to_json(worksheet);
            
            if (datos.length === 0) continue;
            
            let headers = Object.keys(datos[0] || {});
            
            // Aplicar detección inteligente
            const primeraFila = datos[0];
            const esTitulo = primeraFila && Object.values(primeraFila).some(valor => 
                typeof valor === 'string' && 
                (valor.includes('LISTA') || 
                 valor.includes('PRECIOS') || 
                 valor.includes('MOURA') ||
                 valor.length > 50)
            );
            
            if (esTitulo) {
                const datosCorregidos = XLSX.utils.sheet_to_json(worksheet, { range: 1 });
                headers = Object.keys(datosCorregidos[0] || {});
            }
            
            // Calcular score basado en columnas clave
            let score = 0;
            if (headers.find(h => h && h.toLowerCase().includes('pvp off line'))) score += 3;
            if (headers.find(h => h && h.toLowerCase().includes('codigo'))) score += 2;
            if (headers.find(h => h && h.toLowerCase().includes('marca'))) score += 2;
            if (headers.find(h => h && h.toLowerCase().includes('descripcion'))) score += 2;
            if (headers.find(h => h && h.toLowerCase().includes('rubro'))) score += 1;
            score += Math.min(datos.length, 10); // Bonus por cantidad de datos
            
            console.log(`  Hoja "${sheetName}": Score ${score} (${datos.length} filas)`);
            
            if (score > mejorScore) {
                mejorScore = score;
                mejorHoja = { index: i, name: sheetName, score, rows: datos.length };
            }
        }
        
        if (mejorHoja) {
            console.log(`\n✅ MEJOR HOJA: "${mejorHoja.name}" (Score: ${mejorHoja.score}, ${mejorHoja.rows} filas)`);
        } else {
            console.log('\n❌ No se encontró una hoja adecuada');
        }
        
    } catch (error) {
        console.error('❌ Error en test:', error);
    }
}

testMultipleSheets();
