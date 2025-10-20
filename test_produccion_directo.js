// Test directo a producción para ver qué está pasando
const FormData = require('form-data');
const fs = require('fs');

async function testProduccionDirecto() {
  try {
    console.log('🔍 TEST DIRECTO A PRODUCCIÓN...\n');
    
    const filePath = '/Users/ralborta/Downloads/Acubat/Lista Moura 04 (1).xlsx';
    const fileBuffer = fs.readFileSync(filePath);
    
    const formData = new FormData();
    formData.append('file', fileBuffer, 'Lista Moura 04 (1).xlsx');
    
    console.log('📤 Enviando archivo a producción...');
    
    const response = await fetch('https://acubat-pricing-v2-g3aqjysel-nivel-41.vercel.app/api/pricing/procesar-archivo', {
      method: 'POST',
      body: formData
    });
    
    console.log('📊 Status:', response.status);
    console.log('📊 Headers:', Object.fromEntries(response.headers.entries()));
    
    const result = await response.json();
    
    console.log('\n📋 RESPUESTA DE PRODUCCIÓN:');
    console.log('📊 Total productos:', result.estadisticas?.total_productos);
    console.log('📊 Productos rentables:', result.estadisticas?.productos_rentables);
    console.log('📊 Con equivalencia Varta:', result.estadisticas?.con_equivalencia_varta);
    console.log('📊 Margen promedio:', result.estadisticas?.margen_promedio);
    
    if (result.productos) {
      console.log('\n📋 MUESTRA DE PRODUCTOS:');
      result.productos.slice(0, 3).forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.producto} - ${p.tipo} - ${p.modelo} - $${p.precio_base_original}`);
      });
    }
    
    if (result.error) {
      console.log('\n❌ ERROR:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testProduccionDirecto();
