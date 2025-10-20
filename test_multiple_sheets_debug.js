// Test para verificar que el sistema analice todas las hojas
const XLSX = require('xlsx');

async function testMultipleSheetsDebug() {
    console.log('🔍 TEST MÚLTIPLES HOJAS - DEBUG COMPLETO');
    console.log('=========================================');
    
    try {
        // Simular el archivo Moura (crear un archivo de prueba con múltiples hojas)
        console.log('📁 Creando archivo de prueba con múltiples hojas...');
        
        // Crear workbook con múltiples hojas
        const workbook = XLSX.utils.book_new();
        
        // Hoja 1: Título y datos de productos
        const hoja1 = [
            ['LISTA DE PRECIOS MOURA - VIGENCIA 2025'],
            ['MARCA', 'RUBRO', 'CODIGO', 'DESCRIPCION', 'PVP Off Line'],
            ['MOURA', 'BATERIAS', 'M001', 'BATERIA 12V 50AH', '$15.000'],
            ['MOURA', 'BATERIAS', 'M002', 'BATERIA 12V 70AH', '$18.500'],
            ['MOURA', 'BATERIAS', 'M003', 'BATERIA 12V 100AH', '$22.000']
        ];
        const ws1 = XLSX.utils.aoa_to_sheet(hoja1);
        XLSX.utils.book_append_sheet(workbook, ws1, 'Lista Principal');
        
        // Hoja 2: Solo títulos sin datos
        const hoja2 = [
            ['INFORMACIÓN GENERAL'],
            ['Proveedor: Moura'],
            ['Vigencia: 2025'],
            ['Contacto: info@moura.com']
        ];
        const ws2 = XLSX.utils.aoa_to_sheet(hoja2);
        XLSX.utils.book_append_sheet(workbook, ws2, 'Info General');
        
        // Hoja 3: Datos de productos pero sin PVP Off Line
        const hoja3 = [
            ['PRODUCTOS AUXILIARES'],
            ['CODIGO', 'DESCRIPCION', 'PRECIO', 'STOCK'],
            ['A001', 'CARGADOR 12V', '$5.000', '50'],
            ['A002', 'CABLES', '$2.500', '100']
        ];
        const ws3 = XLSX.utils.aoa_to_sheet(hoja3);
        XLSX.utils.book_append_sheet(workbook, ws3, 'Auxiliares');
        
        // Hoja 4: Datos de productos con PVP Off Line (mejor opción)
        const hoja4 = [
            ['PRODUCTOS PRINCIPALES'],
            ['MARCA', 'RUBRO', 'CODIGO', 'DESCRIPCION', 'PVP Off Line', 'STOCK'],
            ['MOURA', 'BATERIAS', 'M101', 'BATERIA 6V 200AH', '$25.000', '20'],
            ['MOURA', 'BATERIAS', 'M102', 'BATERIA 12V 150AH', '$30.000', '15'],
            ['MOURA', 'BATERIAS', 'M103', 'BATERIA 24V 100AH', '$35.000', '10']
        ];
        const ws4 = XLSX.utils.aoa_to_sheet(hoja4);
        XLSX.utils.book_append_sheet(workbook, ws4, 'Productos');
        
        // Guardar archivo de prueba
        const archivoPrueba = 'test_multiple_sheets.xlsx';
        XLSX.writeFile(workbook, archivoPrueba);
        console.log(`✅ Archivo de prueba creado: ${archivoPrueba}`);
        
        // Ahora simular el algoritmo de selección de hojas
        console.log('\n🔍 SIMULANDO ALGORITMO DE SELECCIÓN:');
        console.log('=====================================');
        
        let mejorHoja = null
        let mejorScore = 0
        
        for (let i = 0; i < workbook.SheetNames.length; i++) {
            const sheetName = workbook.SheetNames[i]
            const worksheet = workbook.Sheets[sheetName]
            
            console.log(`\n🔍 Analizando hoja "${sheetName}":`)
            
            // Leer datos de la hoja
            let datosHoja = XLSX.utils.sheet_to_json(worksheet)
            
            if (datosHoja.length === 0) {
                console.log(`  ❌ Hoja vacía`)
                continue
            }
            
            // Aplicar detección inteligente de headers
            let headersHoja = Object.keys(datosHoja[0] || {})
            
            const primeraFila = datosHoja[0]
            const esTitulo = primeraFila && Object.values(primeraFila).some(valor => 
                typeof valor === 'string' && 
                (valor.includes('LISTA') || 
                 valor.includes('PRECIOS') || 
                 valor.includes('Vigencia') || 
                 valor.includes('HERRAMIENTAS') ||
                 valor.includes('PRODUCTOS') ||
                 valor.includes('MOURA') ||
                 valor.length > 50)
            )
            
            const tieneEmptyColumns = headersHoja.filter(h => h.startsWith('__EMPTY')).length > 5
            
            // También verificar si la primera fila tiene muchos valores vacíos (indica título)
            const valoresPrimeraFila = Object.values(primeraFila || {})
            const valoresVacios = valoresPrimeraFila.filter(v => !v || v === '').length
            const tieneMuchosVacios = valoresVacios > valoresPrimeraFila.length * 0.5
            
            if (esTitulo || tieneEmptyColumns || tieneMuchosVacios) {
                console.log(`  🔍 Detectado título (esTitulo: ${esTitulo}, emptyColumns: ${tieneEmptyColumns}, muchosVacios: ${tieneMuchosVacios}), usando segunda fila como headers`)
                datosHoja = XLSX.utils.sheet_to_json(worksheet, { range: 1 })
                headersHoja = Object.keys(datosHoja[0] || {})
                console.log(`  ✅ Headers corregidos:`, headersHoja)
            }
            
            console.log(`  📋 Headers detectados:`, headersHoja)
            console.log(`  📊 Filas de datos: ${datosHoja.length}`)
            
            // Calcular score basado en columnas clave y cantidad de datos
            let score = 0
            const pvpOffLine = headersHoja.find(h => h && h.toLowerCase().includes('pvp off line'))
            const codigo = headersHoja.find(h => h && h.toLowerCase().includes('codigo'))
            const marca = headersHoja.find(h => h && h.toLowerCase().includes('marca'))
            const descripcion = headersHoja.find(h => h && h.toLowerCase().includes('descripcion'))
            const rubro = headersHoja.find(h => h && h.toLowerCase().includes('rubro'))
            
            if (pvpOffLine) {
                score += 3
                console.log(`    ✅ PVP Off Line: "${pvpOffLine}" (+3)`)
            } else {
                console.log(`    ❌ PVP Off Line: NO ENCONTRADO`)
            }
            
            if (codigo) {
                score += 2
                console.log(`    ✅ CODIGO: "${codigo}" (+2)`)
            } else {
                console.log(`    ❌ CODIGO: NO ENCONTRADO`)
            }
            
            if (marca) {
                score += 2
                console.log(`    ✅ MARCA: "${marca}" (+2)`)
            } else {
                console.log(`    ❌ MARCA: NO ENCONTRADO`)
            }
            
            if (descripcion) {
                score += 2
                console.log(`    ✅ DESCRIPCION: "${descripcion}" (+2)`)
            } else {
                console.log(`    ❌ DESCRIPCION: NO ENCONTRADO`)
            }
            
            if (rubro) {
                score += 1
                console.log(`    ✅ RUBRO: "${rubro}" (+1)`)
            } else {
                console.log(`    ❌ RUBRO: NO ENCONTRADO`)
            }
            
            score += Math.min(datosHoja.length, 10) // Bonus por cantidad de datos
            console.log(`    📊 Bonus por datos: +${Math.min(datosHoja.length, 10)}`)
            
            console.log(`  📊 SCORE TOTAL: ${score}`)
            
            if (score > mejorScore) {
                mejorScore = score
                mejorHoja = {
                    name: sheetName,
                    worksheet: worksheet,
                    datos: datosHoja,
                    headers: headersHoja,
                    score: score
                }
                console.log(`    🎯 NUEVA MEJOR HOJA!`)
            }
        }
        
        console.log('\n🎯 RESULTADO FINAL:')
        console.log('==================')
        
        if (mejorHoja) {
            console.log(`✅ HOJA SELECCIONADA: "${mejorHoja.name}"`)
            console.log(`📊 Score: ${mejorHoja.score}`)
            console.log(`📋 Headers: ${mejorHoja.headers.length}`)
            console.log(`📊 Filas: ${mejorHoja.datos.length}`)
            console.log(`📝 Headers:`, mejorHoja.headers)
            
            // Mostrar muestra de datos
            if (mejorHoja.datos.length > 0) {
                console.log('\n📊 MUESTRA DE DATOS:')
                mejorHoja.datos.slice(0, 3).forEach((fila, i) => {
                    console.log(`  Fila ${i + 1}:`, fila)
                })
            }
        } else {
            console.log('❌ No se encontró una hoja válida')
        }
        
        // Limpiar archivo de prueba
        const fs = require('fs');
        if (fs.existsSync(archivoPrueba)) {
            fs.unlinkSync(archivoPrueba);
            console.log(`\n🧹 Archivo de prueba eliminado: ${archivoPrueba}`);
        }
        
    } catch (error) {
        console.error('❌ Error en test:', error);
    }
}

testMultipleSheetsDebug();
