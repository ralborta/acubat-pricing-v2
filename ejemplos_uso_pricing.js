// 🎯 EJEMPLOS DE USO DEL SISTEMA DE PRICING ACUBAT
// Este archivo muestra cómo usar el sistema de pricing en diferentes escenarios

const { 
  calcularPricingCorrecto, 
  procesarArchivoExcel,
  probarSistemaPricing,
  CONFIGURACION_PRICING 
} = require('./sistema_pricing_completo');

// ============================================================================
// 📋 EJEMPLO 1: CÁLCULO INDIVIDUAL DE PRODUCTOS
// ============================================================================

async function ejemploCalculoIndividual() {
  console.log('\n📋 EJEMPLO 1: Cálculo Individual de Productos');
  console.log('=' .repeat(60));
  
  // Producto de ejemplo
  const producto = {
    modelo: "12X65",
    marca: "Moura",
    canal: "Retail",
    costo: 25000,
    precio_lista: 35000
  };
  
  // Equivalencia Varta
  const equivalencia = {
    modelo: "12X65",
    equivalente_varta: "VA60DD/E",
    precio_varta: 46920
  };
  
  console.log('🔋 Producto:', producto);
  console.log('🔗 Equivalencia:', equivalencia);
  
  // Calcular pricing
  const resultado = await calcularPricingCorrecto(producto, [equivalencia]);
  
  console.log('\n✅ RESULTADO:');
  console.log(`   Precio Final: $${resultado.precio_final.toLocaleString('es-AR')}`);
  console.log(`   Margen: ${resultado.margen.toFixed(1)}%`);
  console.log(`   Rentabilidad: ${resultado.rentabilidad}`);
  console.log(`   Tipo Cálculo: ${resultado.tipo_calculo}`);
}

// ============================================================================
// 📊 EJEMPLO 2: PROCESAMIENTO DE ARCHIVO EXCEL
// ============================================================================

async function ejemploProcesamientoArchivo() {
  console.log('\n📊 EJEMPLO 2: Procesamiento de Archivo Excel');
  console.log('=' .repeat(60));
  
  // Simular datos de archivo Excel
  const datosExcel = [
    {
      "CODIGO": "M18FD",
      "TIPO": "12X45",
      "MARCA": "Moura",
      "CANAL": "Retail",
      "COSTO": 20000,
      "PRECIO_LISTA": 28000
    },
    {
      "CODIGO": "M22ED", 
      "TIPO": "12X50",
      "MARCA": "Varta",
      "CANAL": "Mayorista",
      "COSTO": 25000,
      "PRECIO_LISTA": 35000
    },
    {
      "CODIGO": "M20GD",
      "TIPO": "12X65",
      "MARCA": "Moura",
      "CANAL": "Lista",
      "COSTO": 30000,
      "PRECIO_LISTA": 42000
    }
  ];
  
  // Equivalencias Varta
  const equivalencias = [
    { modelo: "12X45", equivalente_varta: "VA45BD", precio_varta: 42800 },
    { modelo: "12X50", equivalente_varta: "VA50GD", precio_varta: 45600 },
    { modelo: "12X65", equivalente_varta: "VA60DD/E", precio_varta: 46920 }
  ];
  
  console.log('📁 Datos del archivo:', datosExcel.length, 'productos');
  
  // Procesar cada producto
  const resultados = [];
  for (const producto of datosExcel) {
    const resultado = await calcularPricingCorrecto({
      modelo: producto.TIPO,
      marca: producto.MARCA,
      canal: producto.CANAL,
      costo: producto.COSTO,
      precio_lista: producto.PRECIO_LISTA
    }, equivalencias);
    
    resultados.push(resultado);
  }
  
  // Mostrar resumen
  console.log('\n📈 RESUMEN DE RESULTADOS:');
  resultados.forEach((resultado, index) => {
    console.log(`\n${index + 1}. ${resultado.modelo} (${resultado.marca} - ${resultado.canal_normalizado})`);
    console.log(`   Precio Final: $${resultado.precio_final.toLocaleString('es-AR')}`);
    console.log(`   Margen: ${resultado.margen.toFixed(1)}%`);
    console.log(`   Rentabilidad: ${resultado.rentabilidad}`);
  });
  
  // Estadísticas
  const rentables = resultados.filter(r => r.rentabilidad === "RENTABLE").length;
  const noRentables = resultados.filter(r => r.rentabilidad === "NO RENTABLE").length;
  const margenPromedio = resultados.reduce((sum, r) => sum + r.margen, 0) / resultados.length;
  
  console.log('\n📊 ESTADÍSTICAS:');
  console.log(`   Total productos: ${resultados.length}`);
  console.log(`   Rentables: ${rentables}`);
  console.log(`   No rentables: ${noRentables}`);
  console.log(`   Margen promedio: ${margenPromedio.toFixed(1)}%`);
}

// ============================================================================
// 🎯 EJEMPLO 3: COMPARACIÓN DE CANALES
// ============================================================================

async function ejemploComparacionCanales() {
  console.log('\n🎯 EJEMPLO 3: Comparación de Canales');
  console.log('=' .repeat(60));
  
  const producto = {
    modelo: "12X75",
    marca: "Moura",
    costo: 30000,
    precio_lista: 42000
  };
  
  const equivalencia = {
    modelo: "12X75",
    equivalente_varta: "VA70ND/E",
    precio_varta: 57750
  };
  
  const canales = ["Retail", "Mayorista", "Lista"];
  
  console.log('🔋 Producto base:', producto.modelo, `($${producto.costo} costo)`);
  
  for (const canal of canales) {
    const productoConCanal = { ...producto, canal };
    const resultado = await calcularPricingCorrecto(productoConCanal, [equivalencia]);
    
    console.log(`\n📊 ${canal.toUpperCase()}:`);
    console.log(`   Precio Final: $${resultado.precio_final.toLocaleString('es-AR')}`);
    console.log(`   Margen: ${resultado.margen.toFixed(1)}%`);
    console.log(`   Rentabilidad: ${resultado.rentabilidad}`);
    console.log(`   Cálculo: ${resultado.tipo_calculo}`);
  }
}

// ============================================================================
// 🔧 EJEMPLO 4: CONFIGURACIÓN PERSONALIZADA
// ============================================================================

async function ejemploConfiguracionPersonalizada() {
  console.log('\n🔧 EJEMPLO 4: Configuración Personalizada');
  console.log('=' .repeat(60));
  
  // Mostrar configuración actual
  console.log('⚙️ Configuración actual:');
  console.log('   IVA:', CONFIGURACION_PRICING.iva + '%');
  console.log('   Aumento Varta:', CONFIGURACION_PRICING.aumento_varta + '%');
  console.log('   Markups:');
  Object.entries(CONFIGURACION_PRICING.markups_otras_marcas).forEach(([canal, markup]) => {
    const porcentaje = ((markup - 1) * 100).toFixed(0);
    console.log(`     ${canal}: +${porcentaje}%`);
  });
  
  // Ejemplo de cómo cambiar configuración
  console.log('\n🔄 Ejemplo de cambio de configuración:');
  console.log('   // Cambiar IVA a 25%');
  console.log('   CONFIGURACION_PRICING.iva = 25;');
  console.log('   ');
  console.log('   // Cambiar markup minorista a 80%');
  console.log('   CONFIGURACION_PRICING.markups_otras_marcas["Retail"] = 1.80;');
  console.log('   ');
  console.log('   // Cambiar aumento Varta a 50%');
  console.log('   CONFIGURACION_PRICING.aumento_varta = 50;');
}

// ============================================================================
// 📈 EJEMPLO 5: ANÁLISIS DE RENTABILIDAD
// ============================================================================

async function ejemploAnalisisRentabilidad() {
  console.log('\n📈 EJEMPLO 5: Análisis de Rentabilidad');
  console.log('=' .repeat(60));
  
  const productos = [
    { modelo: "12X45", marca: "Moura", canal: "Retail", costo: 20000, precio_lista: 28000 },
    { modelo: "12X50", marca: "Varta", canal: "Mayorista", costo: 25000, precio_lista: 35000 },
    { modelo: "12X65", marca: "Moura", canal: "Online", costo: 30000, precio_lista: 42000 },
    { modelo: "12X75", marca: "Varta", canal: "Distribuidor", costo: 35000, precio_lista: 49000 }
  ];
  
  const equivalencias = [
    { modelo: "12X45", equivalente_varta: "VA45BD", precio_varta: 42800 },
    { modelo: "12X50", equivalente_varta: "VA50GD", precio_varta: 45600 },
    { modelo: "12X65", equivalente_varta: "VA60DD/E", precio_varta: 46920 },
    { modelo: "12X75", equivalente_varta: "VA70ND/E", precio_varta: 57750 }
  ];
  
  console.log('🔍 Analizando rentabilidad de', productos.length, 'productos...');
  
  const resultados = [];
  for (const producto of productos) {
    const resultado = await calcularPricingCorrecto(producto, equivalencias);
    resultados.push(resultado);
  }
  
  // Análisis por marca
  const porMarca = {};
  resultados.forEach(r => {
    if (!porMarca[r.marca_normalizada]) {
      porMarca[r.marca_normalizada] = { total: 0, rentables: 0, margenPromedio: 0 };
    }
    porMarca[r.marca_normalizada].total++;
    if (r.rentabilidad === "RENTABLE") porMarca[r.marca_normalizada].rentables++;
    porMarca[r.marca_normalizada].margenPromedio += r.margen;
  });
  
  // Calcular promedios
  Object.keys(porMarca).forEach(marca => {
    porMarca[marca].margenPromedio /= porMarca[marca].total;
  });
  
  console.log('\n📊 ANÁLISIS POR MARCA:');
  Object.entries(porMarca).forEach(([marca, datos]) => {
    const porcentajeRentables = (datos.rentables / datos.total * 100).toFixed(1);
    console.log(`\n   ${marca}:`);
    console.log(`     Total productos: ${datos.total}`);
    console.log(`     Rentables: ${datos.rentables} (${porcentajeRentables}%)`);
    console.log(`     Margen promedio: ${datos.margenPromedio.toFixed(1)}%`);
  });
  
  // Análisis por canal
  const porCanal = {};
  resultados.forEach(r => {
    if (!porCanal[r.canal_normalizado]) {
      porCanal[r.canal_normalizado] = { total: 0, rentables: 0, margenPromedio: 0 };
    }
    porCanal[r.canal_normalizado].total++;
    if (r.rentabilidad === "RENTABLE") porCanal[r.canal_normalizado].rentables++;
    porCanal[r.canal_normalizado].margenPromedio += r.margen;
  });
  
  // Calcular promedios
  Object.keys(porCanal).forEach(canal => {
    porCanal[canal].margenPromedio /= porCanal[canal].total;
  });
  
  console.log('\n📊 ANÁLISIS POR CANAL:');
  Object.entries(porCanal).forEach(([canal, datos]) => {
    const porcentajeRentables = (datos.rentables / datos.total * 100).toFixed(1);
    console.log(`\n   ${canal}:`);
    console.log(`     Total productos: ${datos.total}`);
    console.log(`     Rentables: ${datos.rentables} (${porcentajeRentables}%)`);
    console.log(`     Margen promedio: ${datos.margenPromedio.toFixed(1)}%`);
  });
}

// ============================================================================
// 🚀 FUNCIÓN PRINCIPAL PARA EJECUTAR TODOS LOS EJEMPLOS
// ============================================================================

async function ejecutarTodosLosEjemplos() {
  console.log('🎯 EJEMPLOS DE USO DEL SISTEMA DE PRICING ACUBAT');
  console.log('=' .repeat(80));
  
  try {
    await ejemploCalculoIndividual();
    await ejemploProcesamientoArchivo();
    await ejemploComparacionCanales();
    await ejemploConfiguracionPersonalizada();
    await ejemploAnalisisRentabilidad();
    
    console.log('\n🎉 ¡TODOS LOS EJEMPLOS COMPLETADOS EXITOSAMENTE!');
    console.log('=' .repeat(80));
    
  } catch (error) {
    console.error('❌ Error ejecutando ejemplos:', error);
  }
}

// ============================================================================
// 🎯 EXPORTAR FUNCIONES
// ============================================================================

module.exports = {
  ejemploCalculoIndividual,
  ejemploProcesamientoArchivo,
  ejemploComparacionCanales,
  ejemploConfiguracionPersonalizada,
  ejemploAnalisisRentabilidad,
  ejecutarTodosLosEjemplos
};

// ============================================================================
// 🚀 EJECUTAR EJEMPLOS SI SE LLAMA DIRECTAMENTE
// ============================================================================

if (require.main === module) {
  ejecutarTodosLosEjemplos().catch(console.error);
}
