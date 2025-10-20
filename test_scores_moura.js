// Test rápido para verificar los scores de las hojas del archivo Moura
const XLSX = require('xlsx');

async function testScoresMoura() {
    console.log('🔍 TEST SCORES MOURA - VERIFICAR PUNTUACIÓN DE HOJAS');
    console.log('==================================================');
    
    try {
        const archivoPath = '/Users/ralborta/Downloads/Acubat/Lista Moura 04 (1).xlsx';
        const workbook = XLSX.readFile(archivoPath);
        
        console.log('📋 HOJAS DISPONIBLES:');
        workbook.SheetNames.forEach((sheetName, index) => {
            console.log(`  ${index + 1}: "${sheetName}"`);
        });
        
        let mejorHoja = null;
        let mejorScore = 0;
        
        for (let i = 0; i < workbook.SheetNames.length; i++) {
            const sheetName = workbook.SheetNames[i];
            const worksheet = workbook.Sheets[sheetName];
            
            console.log(`\n--- HOJA ${i + 1}: "${sheetName}" ---`);
            
            let datosHoja = XLSX.utils.sheet_to_json(worksheet);
            
            if (datosHoja.length === 0) {
                console.log('❌ Hoja vacía');
                continue;
            }
            
            // Aplicar detección inteligente de headers
            let headersHoja = Object.keys(datosHoja[0] || {});
            
            const primeraFila = datosHoja[0];
            const esTitulo = primeraFila && Object.values(primeraFila).some(valor => 
                typeof valor === 'string' && 
                (valor.includes('LISTA') || 
                 valor.includes('PRECIOS') || 
                 valor.includes('Vigencia') || 
                 valor.includes('HERRAMIENTAS') ||
                 valor.includes('PRODUCTOS') ||
                 valor.includes('MOURA') ||
                 valor.length > 50)
            );
            
            const tieneEmptyColumns = headersHoja.filter(h => h.startsWith('__EMPTY')).length > 5;
            const valoresPrimeraFila = Object.values(primeraFila || {});
            const valoresVacios = valoresPrimeraFila.filter(v => !v || v === '').length;
            const tieneMuchosVacios = valoresVacios > valoresPrimeraFila.length * 0.5;
            
            if (esTitulo || tieneEmptyColumns || tieneMuchosVacios) {
                console.log(`🔧 Aplicando corrección de headers`);
                datosHoja = XLSX.utils.sheet_to_json(worksheet, { range: 1 });
                headersHoja = Object.keys(datosHoja[0] || {});
            }
            
            // Buscar columnas clave
            const pvpOffLine = headersHoja.find(h => h && h.toLowerCase().includes('pvp off line'));
            const precioLista = headersHoja.find(h => h && h.toLowerCase().includes('precio de lista'));
            const precioUnitario = headersHoja.find(h => h && h.toLowerCase().includes('precio unitario'));
            const codigo = headersHoja.find(h => h && h.toLowerCase().includes('codigo'));
            const marca = headersHoja.find(h => h && h.toLowerCase().includes('marca'));
            const descripcion = headersHoja.find(h => h && h.toLowerCase().includes('descripcion'));
            const rubro = headersHoja.find(h => h && h.toLowerCase().includes('rubro'));
            
            // Calcular score
            let score = 0;
            const tienePrecio = pvpOffLine || precioLista || precioUnitario;
            
            if (pvpOffLine) score += 5;
            else if (precioLista) score += 4;
            else if (precioUnitario) score += 3;
            
            if (codigo) score += 3;
            if (marca) score += 3;
            if (descripcion) score += 2;
            if (rubro) score += 1;
            
            // Bonus por cantidad de datos
            if (datosHoja.length >= 10) score += 5;
            else if (datosHoja.length >= 5) score += 3;
            else if (datosHoja.length >= 2) score += 1;
            
            // Penalizar hojas con muy pocos datos
            if (datosHoja.length < 2) score = 0;
            
            // Bonus por tener múltiples columnas clave
            const columnasClave = [tienePrecio, codigo, marca, descripcion, rubro].filter(Boolean).length;
            if (columnasClave >= 3) score += 2;
            if (columnasClave >= 4) score += 3;
            
            console.log(`📊 Filas: ${datosHoja.length}`);
            console.log(`📊 Score: ${score}`);
            console.log(`🎯 Columnas clave: ${columnasClave}/5`);
            if (pvpOffLine) console.log(`  ✅ PVP Off Line: "${pvpOffLine}"`);
            else if (precioLista) console.log(`  ✅ Precio de Lista: "${precioLista}"`);
            else if (precioUnitario) console.log(`  ✅ Precio Unitario: "${precioUnitario}"`);
            else console.log(`  ❌ Precio: NO ENCONTRADO`);
            if (codigo) console.log(`  ✅ CODIGO: "${codigo}"`);
            if (marca) console.log(`  ✅ MARCA: "${marca}"`);
            if (descripcion) console.log(`  ✅ DESCRIPCION: "${descripcion}"`);
            if (rubro) console.log(`  ✅ RUBRO: "${rubro}"`);
            
            if (score > mejorScore) {
                mejorScore = score;
                mejorHoja = { name: sheetName, score, productos: datosHoja.length };
                console.log(`🎯 NUEVA MEJOR HOJA!`);
            }
        }
        
        console.log('\n🎯 RESULTADO FINAL:');
        console.log(`✅ MEJOR HOJA: "${mejorHoja.name}"`);
        console.log(`📊 Score: ${mejorHoja.score}`);
        console.log(`📦 Productos: ${mejorHoja.productos}`);
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

testScoresMoura();
