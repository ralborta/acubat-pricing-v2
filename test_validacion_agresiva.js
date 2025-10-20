// Test directo de la validación agresiva
const XLSX = require('xlsx');

async function testValidacionAgresiva() {
    console.log('🔍 TEST VALIDACIÓN AGRESIVA - VERIFICAR HEADERS Y MAPEO');
    console.log('=====================================================');
    
    try {
        // Leer el archivo real
        const archivoPath = '/Users/ralborta/Downloads/Lista de Precios Herramientas Manuales LQ N°9- 150825 (1).xlsx';
        const workbook = XLSX.readFile(archivoPath);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        
        // Detección inteligente de headers (como en el código real)
        let datos = XLSX.utils.sheet_to_json(worksheet);
        let headers = Object.keys(datos[0] || {});
        
        console.log('📋 HEADERS DETECTADOS:');
        headers.forEach((header, i) => {
            console.log(`  ${i}: "${header}"`);
        });
        
        // Verificar si hay título en primera fila
        const primeraFila = datos[0];
        const esTitulo = primeraFila && Object.values(primeraFila).some(valor => 
            typeof valor === 'string' && 
            (valor.includes('LISTA DE PRECIOS') || 
             valor.includes('Vigencia') || 
             valor.includes('HERRAMIENTAS') ||
             valor.length > 50)
        );
        
        const tieneEmptyColumns = headers.filter(h => h.startsWith('__EMPTY')).length > 5;
        
        if (esTitulo || tieneEmptyColumns) {
            console.log('🔍 Detectado título o estructura compleja, usando segunda fila como headers');
            datos = XLSX.utils.sheet_to_json(worksheet, { range: 1 });
            headers = Object.keys(datos[0] || {});
            console.log('✅ Headers corregidos:');
            headers.forEach((header, i) => {
                console.log(`  ${i}: "${header}"`);
            });
        }
        
        // Simular validación agresiva
        console.log('\n🔧 SIMULANDO VALIDACIÓN AGRESIVA:');
        
        const columnMapping = {
            producto: '',
            precio: '',
            tipo: '',
            modelo: '',
            marca: '',
            codigo: '',
            contado: '',
            descripcion: '',
            pdv: '',
            precio_1: '',
            precio_2: '',
            pvp: '',
            pvp_off_line: '',
            proveedor: ''
        };
        
        // Buscar PVP Off Line
        const pvpOffLineColumn = headers.find(h => h && h.toLowerCase().includes('pvp off line'));
        console.log(`🔍 Buscando PVP Off Line: ${pvpOffLineColumn ? `ENCONTRADO: "${pvpOffLineColumn}"` : 'NO ENCONTRADO'}`);
        
        if (pvpOffLineColumn) {
            const valorPrecio = datos[0]?.[pvpOffLineColumn];
            console.log(`  Valor en PVP Off Line: "${valorPrecio}"`);
            columnMapping.precio = pvpOffLineColumn;
            console.log(`✅ Precio forzado a: "${pvpOffLineColumn}"`);
        }
        
        // Buscar CODIGO
        const codigoColumn = headers.find(h => h && h.toLowerCase().includes('codigo'));
        console.log(`🔍 Buscando CODIGO: ${codigoColumn ? `ENCONTRADO: "${codigoColumn}"` : 'NO ENCONTRADO'}`);
        
        if (codigoColumn) {
            const valorModelo = datos[0]?.[codigoColumn];
            console.log(`  Valor en CODIGO: "${valorModelo}"`);
            columnMapping.modelo = codigoColumn;
            console.log(`✅ Modelo forzado a: "${codigoColumn}"`);
        }
        
        // Buscar RUBRO
        const rubroColumn = headers.find(h => h && h.toLowerCase().includes('rubro'));
        console.log(`🔍 Buscando RUBRO: ${rubroColumn ? `ENCONTRADO: "${rubroColumn}"` : 'NO ENCONTRADO'}`);
        
        if (rubroColumn) {
            const valorTipo = datos[0]?.[rubroColumn];
            console.log(`  Valor en RUBRO: "${valorTipo}"`);
            columnMapping.tipo = rubroColumn;
            console.log(`✅ Tipo forzado a: "${rubroColumn}"`);
        }
        
        // Buscar MARCA
        const marcaColumn = headers.find(h => h && h.toLowerCase().includes('marca'));
        console.log(`🔍 Buscando MARCA: ${marcaColumn ? `ENCONTRADO: "${marcaColumn}"` : 'NO ENCONTRADO'}`);
        
        if (marcaColumn) {
            const valorMarca = datos[0]?.[marcaColumn];
            console.log(`  Valor en MARCA: "${valorMarca}"`);
            columnMapping.marca = marcaColumn;
            columnMapping.proveedor = marcaColumn;
            console.log(`✅ Marca forzada a: "${marcaColumn}"`);
        }
        
        // Buscar DESCRIPCION
        const descripcionColumn = headers.find(h => h && h.toLowerCase().includes('descripcion'));
        console.log(`🔍 Buscando DESCRIPCION: ${descripcionColumn ? `ENCONTRADO: "${descripcionColumn}"` : 'NO ENCONTRADO'}`);
        
        if (descripcionColumn) {
            const valorDescripcion = datos[0]?.[descripcionColumn];
            console.log(`  Valor en DESCRIPCION: "${valorDescripcion}"`);
            columnMapping.descripcion = descripcionColumn;
            console.log(`✅ Descripción forzada a: "${descripcionColumn}"`);
        }
        
        console.log('\n🎯 MAPEO FINAL:');
        console.log(JSON.stringify(columnMapping, null, 2));
        
        // Simular extracción de datos del primer producto
        if (datos[0]) {
            console.log('\n📊 EXTRACCIÓN DE DATOS DEL PRIMER PRODUCTO:');
            const producto = datos[0];
            
            const tipo = columnMapping.tipo ? producto[columnMapping.tipo] : 'BATERIA';
            const modelo = columnMapping.modelo ? producto[columnMapping.modelo] : 'N/A';
            const descripcion = columnMapping.descripcion ? producto[columnMapping.descripcion] : modelo;
            const proveedor = columnMapping.marca ? producto[columnMapping.marca] : 'Sin Marca';
            
            console.log(`TIPO: "${tipo}"`);
            console.log(`MODELO: "${modelo}"`);
            console.log(`DESCRIPCION: "${descripcion}"`);
            console.log(`PROVEEDOR: "${proveedor}"`);
            
            // Buscar precio
            if (columnMapping.precio) {
                const precioBase = producto[columnMapping.precio];
                console.log(`PRECIO BASE (${columnMapping.precio}): "${precioBase}"`);
            } else {
                console.log('PRECIO BASE: NO ENCONTRADO');
            }
        }
        
    } catch (error) {
        console.error('❌ Error en test:', error);
    }
}

testValidacionAgresiva();
