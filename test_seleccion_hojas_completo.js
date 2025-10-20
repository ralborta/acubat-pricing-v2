// Test completo para verificar la selección de hojas del archivo Moura
const XLSX = require('xlsx');

async function testSeleccionHojasCompleto() {
    console.log('🔍 TEST SELECCIÓN DE HOJAS COMPLETO - MOURA');
    console.log('==========================================');
    
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
            
            // Leer datos de la hoja
            let datosHoja = XLSX.utils.sheet_to_json(worksheet);
            
            if (datosHoja.length === 0) {
                console.log('❌ Hoja vacía');
                continue;
            }
            
            console.log(`📊 Filas originales: ${datosHoja.length}`);
            console.log(`📋 Headers originales:`, Object.keys(datosHoja[0] || {}));
            
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
            
            console.log(`🔍 Análisis de título:`);
            console.log(`  - esTitulo: ${esTitulo}`);
            console.log(`  - tieneEmptyColumns: ${tieneEmptyColumns} (${headersHoja.filter(h => h.startsWith('__EMPTY')).length} __EMPTY)`);
            console.log(`  - tieneMuchosVacios: ${tieneMuchosVacios} (${valoresVacios}/${valoresPrimeraFila.length})`);
            
            if (esTitulo || tieneEmptyColumns || tieneMuchosVacios) {
                console.log(`🔧 Aplicando corrección de headers (segunda fila)`);
                datosHoja = XLSX.utils.sheet_to_json(worksheet, { range: 1 });
                headersHoja = Object.keys(datosHoja[0] || {});
                console.log(`📋 Headers corregidos:`, headersHoja);
                console.log(`📊 Filas después de corrección: ${datosHoja.length}`);
                
                // Si después de la corrección seguimos teniendo muchos __EMPTY, intentar con la tercera fila
                const emptyAfterCorrection = headersHoja.filter(h => h.startsWith('__EMPTY')).length;
                if (emptyAfterCorrection > 5) {
                    console.log(`🔧 Muchos __EMPTY después de corrección (${emptyAfterCorrection}), intentando con tercera fila`);
                    datosHoja = XLSX.utils.sheet_to_json(worksheet, { range: 2 });
                    headersHoja = Object.keys(datosHoja[0] || {});
                    console.log(`📋 Headers corregidos (tercera fila):`, headersHoja);
                    console.log(`📊 Filas después de tercera fila: ${datosHoja.length}`);
                }
            }
            
            // Calcular score basado en columnas clave y cantidad de datos
            let score = 0;
            const pvpOffLine = headersHoja.find(h => h && h.toLowerCase().includes('pvp off line'));
            const precioLista = headersHoja.find(h => h && h.toLowerCase().includes('precio de lista'));
            const precioUnitario = headersHoja.find(h => h && h.toLowerCase().includes('precio unitario'));
            const codigo = headersHoja.find(h => h && h.toLowerCase().includes('codigo'));
            const marca = headersHoja.find(h => h && h.toLowerCase().includes('marca'));
            const descripcion = headersHoja.find(h => h && h.toLowerCase().includes('descripcion'));
            const rubro = headersHoja.find(h => h && h.toLowerCase().includes('rubro'));
            
            const tienePrecio = pvpOffLine || precioLista || precioUnitario;
            
            console.log(`🎯 Detección de columnas clave:`);
            if (pvpOffLine) {
                score += 5;
                console.log(`  ✅ PVP Off Line: "${pvpOffLine}" (+5)`);
            } else if (precioLista) {
                score += 4;
                console.log(`  ✅ Precio de Lista: "${precioLista}" (+4)`);
            } else if (precioUnitario) {
                score += 3;
                console.log(`  ✅ Precio Unitario: "${precioUnitario}" (+3)`);
            } else {
                console.log(`  ❌ Precio: NO ENCONTRADO`);
            }
            
            if (codigo) {
                score += 3;
                console.log(`  ✅ CODIGO: "${codigo}" (+3)`);
            } else {
                console.log(`  ❌ CODIGO: NO ENCONTRADO`);
            }
            
            if (marca) {
                score += 3;
                console.log(`  ✅ MARCA: "${marca}" (+3)`);
            } else {
                console.log(`  ❌ MARCA: NO ENCONTRADO`);
            }
            
            if (descripcion) {
                score += 2;
                console.log(`  ✅ DESCRIPCION: "${descripcion}" (+2)`);
            } else {
                console.log(`  ❌ DESCRIPCION: NO ENCONTRADO`);
            }
            
            if (rubro) {
                score += 1;
                console.log(`  ✅ RUBRO: "${rubro}" (+1)`);
            } else {
                console.log(`  ❌ RUBRO: NO ENCONTRADO`);
            }
            
            // Bonus por cantidad de datos
            if (datosHoja.length >= 10) {
                score += 5;
                console.log(`  ✅ Datos >= 10: ${datosHoja.length} filas (+5)`);
            } else if (datosHoja.length >= 5) {
                score += 3;
                console.log(`  ✅ Datos >= 5: ${datosHoja.length} filas (+3)`);
            } else if (datosHoja.length >= 2) {
                score += 1;
                console.log(`  ✅ Datos >= 2: ${datosHoja.length} filas (+1)`);
            }
            
            // Penalizar hojas con muy pocos datos
            if (datosHoja.length < 2) {
                score = 0;
                console.log(`  ❌ Muy pocos datos: ${datosHoja.length} filas (score = 0)`);
            }
            
            // Bonus por tener múltiples columnas clave
            const columnasClave = [tienePrecio, codigo, marca, descripcion, rubro].filter(Boolean).length;
            if (columnasClave >= 3) {
                score += 2;
                console.log(`  ✅ Columnas clave >= 3: ${columnasClave}/5 (+2)`);
            }
            if (columnasClave >= 4) {
                score += 3;
                console.log(`  ✅ Columnas clave >= 4: ${columnasClave}/5 (+3)`);
            }
            
            console.log(`📊 SCORE FINAL: ${score}`);
            console.log(`🎯 Columnas clave encontradas: ${columnasClave}/5`);
            
            if (score > mejorScore) {
                mejorScore = score;
                mejorHoja = {
                    name: sheetName,
                    score: score,
                    productos: datosHoja.length,
                    columnasClave: columnasClave,
                    tienePrecio: tienePrecio,
                    precioColumn: pvpOffLine || precioLista || precioUnitario
                };
                console.log(`🎯 NUEVA MEJOR HOJA!`);
            }
        }
        
        console.log('\n🎯 RESULTADO FINAL:');
        console.log(`✅ MEJOR HOJA: "${mejorHoja.name}"`);
        console.log(`📊 Score: ${mejorHoja.score}`);
        console.log(`📦 Productos: ${mejorHoja.productos}`);
        console.log(`🎯 Columnas clave: ${mejorHoja.columnasClave}/5`);
        console.log(`💰 Tiene precio: ${mejorHoja.tienePrecio ? 'SÍ' : 'NO'}`);
        if (mejorHoja.precioColumn) {
            console.log(`💰 Columna de precio: "${mejorHoja.precioColumn}"`);
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

testSeleccionHojasCompleto();
