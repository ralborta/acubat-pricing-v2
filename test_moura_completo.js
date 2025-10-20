// Test completo para analizar el archivo Moura con múltiples hojas
const XLSX = require('xlsx');

async function testMouraCompleto() {
    console.log('🔍 TEST MOURA COMPLETO - ANÁLISIS DETALLADO DE TODAS LAS HOJAS');
    console.log('================================================================');
    
    try {
        // Leer el archivo Moura real
        const archivoPath = '/Users/ralborta/Downloads/Acubat/Lista Moura 04 (1).xlsx';
        const workbook = XLSX.readFile(archivoPath);
        
        console.log('📋 HOJAS DISPONIBLES EN EL ARCHIVO:');
        workbook.SheetNames.forEach((sheetName, index) => {
            console.log(`  ${index + 1}: "${sheetName}"`);
        });
        
        console.log('\n🔍 ANÁLISIS DETALLADO DE CADA HOJA:');
        console.log('=====================================');
        
        let mejorHoja = null;
        let mejorScore = 0;
        let totalProductosEncontrados = 0;
        
        for (let i = 0; i < workbook.SheetNames.length; i++) {
            const sheetName = workbook.SheetNames[i];
            const worksheet = workbook.Sheets[sheetName];
            
            console.log(`\n--- HOJA ${i + 1}: "${sheetName}" ---`);
            
            // Leer datos de la hoja
            let datosHoja = XLSX.utils.sheet_to_json(worksheet);
            
            if (datosHoja.length === 0) {
                console.log('❌ Hoja vacía - NO TIENE DATOS');
                continue;
            }
            
            console.log(`📊 Filas totales en la hoja: ${datosHoja.length}`);
            
            // Aplicar detección inteligente de headers
            let headersHoja = Object.keys(datosHoja[0] || {});
            console.log(`📋 Headers originales:`, headersHoja);
            
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
            
            // También verificar si la primera fila tiene muchos valores vacíos (indica título)
            const valoresPrimeraFila = Object.values(primeraFila || {});
            const valoresVacios = valoresPrimeraFila.filter(v => !v || v === '').length;
            const tieneMuchosVacios = valoresVacios > valoresPrimeraFila.length * 0.5;
            
            console.log(`🔍 Análisis de título:`);
            console.log(`  - esTitulo: ${esTitulo}`);
            console.log(`  - tieneEmptyColumns: ${tieneEmptyColumns}`);
            console.log(`  - tieneMuchosVacios: ${tieneMuchosVacios}`);
            
            if (esTitulo || tieneEmptyColumns || tieneMuchosVacios) {
                console.log(`🔧 APLICANDO CORRECCIÓN: Usando segunda fila como headers`);
                datosHoja = XLSX.utils.sheet_to_json(worksheet, { range: 1 });
                headersHoja = Object.keys(datosHoja[0] || {});
                console.log(`✅ Headers corregidos:`, headersHoja);
            }
            
            // Buscar columnas clave
            const pvpOffLine = headersHoja.find(h => h && h.toLowerCase().includes('pvp off line'));
            const codigo = headersHoja.find(h => h && h.toLowerCase().includes('codigo'));
            const marca = headersHoja.find(h => h && h.toLowerCase().includes('marca'));
            const descripcion = headersHoja.find(h => h && h.toLowerCase().includes('descripcion'));
            const rubro = headersHoja.find(h => h && h.toLowerCase().includes('rubro'));
            
            console.log(`🎯 COLUMNAS CLAVE ENCONTRADAS:`);
            console.log(`  - PVP Off Line: ${pvpOffLine ? `"${pvpOffLine}"` : 'NO'}`);
            console.log(`  - CODIGO: ${codigo ? `"${codigo}"` : 'NO'}`);
            console.log(`  - MARCA: ${marca ? `"${marca}"` : 'NO'}`);
            console.log(`  - DESCRIPCION: ${descripcion ? `"${descripcion}"` : 'NO'}`);
            console.log(`  - RUBRO: ${rubro ? `"${rubro}"` : 'NO'}`);
            
            // Calcular score
            let score = 0;
            if (pvpOffLine) score += 5;
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
            const columnasClave = [pvpOffLine, codigo, marca, descripcion, rubro].filter(Boolean).length;
            if (columnasClave >= 3) score += 2;
            if (columnasClave >= 4) score += 3;
            
            console.log(`📊 SCORE: ${score} (${datosHoja.length} filas, ${columnasClave}/5 columnas clave)`);
            
            // Analizar productos en esta hoja
            console.log(`\n📦 PRODUCTOS ENCONTRADOS EN ESTA HOJA:`);
            let productosValidos = 0;
            
            datosHoja.forEach((fila, index) => {
                // Verificar si la fila tiene datos válidos
                const tieneDatos = Object.values(fila).some(valor => 
                    valor && valor !== '' && valor !== null && valor !== undefined
                );
                
                if (tieneDatos) {
                    productosValidos++;
                    
                    // Mostrar información del producto
                    console.log(`  Producto ${productosValidos}:`);
                    
                    if (codigo && fila[codigo]) {
                        console.log(`    Código: "${fila[codigo]}"`);
                    }
                    if (descripcion && fila[descripcion]) {
                        console.log(`    Descripción: "${fila[descripcion]}"`);
                    }
                    if (marca && fila[marca]) {
                        console.log(`    Marca: "${fila[marca]}"`);
                    }
                    if (rubro && fila[rubro]) {
                        console.log(`    Rubro: "${fila[rubro]}"`);
                    }
                    if (pvpOffLine && fila[pvpOffLine]) {
                        console.log(`    Precio: "${fila[pvpOffLine]}"`);
                    }
                    
                    // Mostrar todas las columnas para debug
                    console.log(`    Todas las columnas:`, fila);
                }
            });
            
            console.log(`📊 Total productos válidos en esta hoja: ${productosValidos}`);
            totalProductosEncontrados += productosValidos;
            
            if (score > mejorScore) {
                mejorScore = score;
                mejorHoja = {
                    name: sheetName,
                    worksheet: worksheet,
                    datos: datosHoja,
                    headers: headersHoja,
                    score: score,
                    productos: productosValidos
                };
                console.log(`🎯 NUEVA MEJOR HOJA! (Score: ${score})`);
            }
        }
        
        console.log('\n🎯 RESUMEN FINAL:');
        console.log('=================');
        console.log(`📊 Total de productos encontrados en todas las hojas: ${totalProductosEncontrados}`);
        
        if (mejorHoja) {
            console.log(`✅ MEJOR HOJA SELECCIONADA: "${mejorHoja.name}"`);
            console.log(`📊 Score: ${mejorHoja.score}`);
            console.log(`📋 Headers: ${mejorHoja.headers.length}`);
            console.log(`📦 Productos válidos: ${mejorHoja.productos}`);
            console.log(`📝 Headers finales:`, mejorHoja.headers);
            
            // Mostrar muestra de productos de la mejor hoja
            console.log(`\n📦 MUESTRA DE PRODUCTOS DE LA MEJOR HOJA:`);
            mejorHoja.datos.slice(0, 5).forEach((fila, i) => {
                console.log(`  Producto ${i + 1}:`, fila);
            });
        } else {
            console.log('❌ No se encontró una hoja válida');
        }
        
    } catch (error) {
        console.error('❌ Error en test:', error);
        console.log('\n💡 POSIBLES CAUSAS:');
        console.log('  - El archivo no existe en la ruta especificada');
        console.log('  - El archivo está corrupto');
        console.log('  - No tienes permisos para leer el archivo');
        console.log('\n🔧 SOLUCIÓN:');
        console.log('  - Verifica que el archivo esté en: /Users/ralborta/Downloads/Lista Moura 04 (1).xlsx');
        console.log('  - O proporciona la ruta correcta del archivo');
    }
}

testMouraCompleto();
