// Test directo del API en producción
const FormData = require('form-data');
const fs = require('fs');

async function testAPIProduccion() {
    console.log('🔍 TEST API PRODUCCIÓN - VERIFICAR RESPUESTA REAL');
    console.log('================================================');
    
    try {
        // Crear FormData con el archivo real
        const formData = new FormData();
        const archivoPath = '/Users/ralborta/Downloads/Lista de Precios Herramientas Manuales LQ N°9- 150825 (1).xlsx';
        
        formData.append('file', fs.createReadStream(archivoPath));
        formData.append('configuracion', '{}');
        formData.append('proveedorSeleccionado', '');
        
        console.log('📁 Enviando archivo a API de producción...');
        
        // Llamar al API de producción
        const response = await fetch('https://acubat-pricing-v2.vercel.app/api/pricing/procesar-archivo', {
            method: 'POST',
            body: formData,
            headers: formData.getHeaders() // Agregar headers correctos para FormData
        });
        
        console.log('📊 Status de respuesta:', response.status);
        console.log('📋 Headers de respuesta:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
            const errorText = await response.text();
            console.log('❌ Error en respuesta:', errorText);
            return;
        }
        
        const data = await response.json();
        
        console.log('\n🎯 RESPUESTA DEL API:');
        console.log('✅ Success:', data.success);
        console.log('📁 Archivo:', data.archivo);
        console.log('📊 Total productos:', data.productos?.length || 0);
        
        if (data.productos && data.productos.length > 0) {
            console.log('\n🔍 PRIMEROS 3 PRODUCTOS:');
            data.productos.slice(0, 3).forEach((producto, i) => {
                console.log(`\n--- PRODUCTO ${i + 1} ---`);
                console.log(`PRODUCTO: "${producto.producto}"`);
                console.log(`TIPO: "${producto.tipo}"`);
                console.log(`MODELO: "${producto.modelo}"`);
                console.log(`PROVEEDOR: "${producto.proveedor}"`);
                console.log(`PRECIO BASE: $${producto.precio_base_original || producto.precio_base_minorista || 0}`);
            });
            
            // Verificar si los datos son correctos
            const primerProducto = data.productos[0];
            const datosCorrectos = 
                primerProducto.producto?.includes('LLAVE COMBINADA') &&
                primerProducto.modelo === 'L3000' &&
                primerProducto.proveedor === 'LUSQTOFF' &&
                (primerProducto.precio_base_original || primerProducto.precio_base_minorista) > 1000;
            
            console.log('\n🎯 ANÁLISIS DE CORRECCIÓN:');
            console.log(`✅ ¿Descripción correcta? ${primerProducto.producto?.includes('LLAVE COMBINADA') ? 'SÍ' : 'NO'}`);
            console.log(`✅ ¿Modelo correcto? ${primerProducto.modelo === 'L3000' ? 'SÍ' : 'NO'}`);
            console.log(`✅ ¿Proveedor correcto? ${primerProducto.proveedor === 'LUSQTOFF' ? 'SÍ' : 'NO'}`);
            console.log(`✅ ¿Precio correcto? ${(primerProducto.precio_base_original || primerProducto.precio_base_minorista) > 1000 ? 'SÍ' : 'NO'}`);
            console.log(`🎯 ¿DATOS CORRECTOS EN GENERAL? ${datosCorrectos ? 'SÍ' : 'NO'}`);
            
            if (!datosCorrectos) {
                console.log('\n❌ PROBLEMA DETECTADO:');
                console.log('   - El API está devolviendo datos incorrectos');
                console.log('   - Los fixes no se están aplicando en producción');
                console.log('   - Puede haber un problema de deployment o cache');
            } else {
                console.log('\n✅ DATOS CORRECTOS:');
                console.log('   - El API está funcionando correctamente');
                console.log('   - El problema puede estar en el frontend o cache del navegador');
            }
        }
        
    } catch (error) {
        console.error('❌ Error en test:', error);
    }
}

testAPIProduccion();
