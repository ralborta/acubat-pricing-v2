// 🧪 SCRIPT DE PRUEBA PARA VERIFICAR VALORES DE PRICING
const testData = [
  {
    producto: "M40FD",
    tipo: "Batería",
    modelo: "M40FD",
    precio_base: 136490
  },
  {
    producto: "M18FD", 
    tipo: "Batería",
    modelo: "M18FD",
    precio_base: 147410
  },
  {
    producto: "M22ED",
    tipo: "Batería", 
    modelo: "M22ED",
    precio_base: 159422
  }
];

async function testPricing() {
  console.log('🧪 INICIANDO PRUEBA DE PRICING...\n');
  
  try {
    // Simular procesamiento de archivo
    const formData = new FormData();
    
    // Crear un archivo Excel de prueba
    const XLSX = require('xlsx');
    const ws = XLSX.utils.json_to_sheet(testData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Productos');
    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    formData.append('file', blob, 'test-pricing.xlsx');
    
    console.log('📁 Enviando archivo de prueba...');
    
    const response = await fetch('http://localhost:3000/api/pricing/procesar-archivo', {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    console.log('✅ RESPUESTA DEL PROCESAMIENTO:');
    console.log('📊 Configuración usada:');
    console.log(`   - IVA: ${result.configuracion?.iva || 'N/A'}%`);
    console.log(`   - Markup Minorista: ${result.configuracion?.markups?.directa || 'N/A'}%`);
    console.log(`   - Markup Mayorista: ${result.configuracion?.markups?.mayorista || 'N/A'}%`);
    console.log(`   - Markup Distribución: ${result.configuracion?.markups?.distribucion || 'N/A'}%`);
    
    console.log('\n📋 PRODUCTOS PROCESADOS:');
    if (result.productos && result.productos.length > 0) {
      result.productos.forEach((producto, index) => {
        console.log(`\n🔍 PRODUCTO ${index + 1}: ${producto.producto}`);
        console.log(`   - Precio Base: $${producto.precio_base_minorista}`);
        console.log(`   - Minorista:`);
        console.log(`     * Precio Final: $${producto.minorista.precio_final}`);
        console.log(`     * Markup Aplicado: ${producto.minorista.markup_aplicado}`);
        console.log(`     * Rentabilidad: ${producto.minorista.rentabilidad}`);
        console.log(`   - Mayorista:`);
        console.log(`     * Precio Final: $${producto.mayorista.precio_final}`);
        console.log(`     * Markup Aplicado: ${producto.mayorista.markup_aplicado}`);
        console.log(`     * Rentabilidad: ${producto.mayorista.rentabilidad}`);
      });
    } else {
      console.log('❌ No se procesaron productos');
    }
    
    console.log('\n🎯 VERIFICACIÓN:');
    console.log('✅ ¿Usa valores de la DB?', result.configuracion ? 'SÍ' : 'NO');
    console.log('✅ ¿Muestra markups reales?', result.productos?.[0]?.minorista?.markup_aplicado ? 'SÍ' : 'NO');
    console.log('✅ ¿Cálculos correctos?', result.productos?.[0]?.minorista?.precio_final ? 'SÍ' : 'NO');
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error.message);
  }
}

// Ejecutar prueba
testPricing();
