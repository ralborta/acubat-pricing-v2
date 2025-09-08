// 🎯 SISTEMA DE PRICING ACUBAT - CÓDIGO COMPLETO
// Este archivo contiene toda la lógica de cálculo de precios

const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');

// ============================================================================
// 🔧 CONFIGURACIÓN DEL SISTEMA
// ============================================================================

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Configuración por defecto del sistema
let CONFIGURACION_PRICING = {
  iva: 21, // IVA 21%
  aumento_varta: 40, // 40% de aumento para productos Varta
  markups_otras_marcas: {
    "Retail": 1.70,      // 70% de ganancia para minorista
    "Mayorista": 1.40,   // 40% de ganancia para mayorista
    "Online": 1.60,      // 60% de ganancia para online
    "Distribuidor": 1.30 // 30% de ganancia para distribuidor
  },
  
  // Reglas de rentabilidad mínima
  reglasRentabilidad: [
    { marca: "Varta", canal: "Retail", margen_minimo: 60 },
    { marca: "Varta", canal: "Mayorista", margen_minimo: 40 },
    { marca: "Varta", canal: "Online", margen_minimo: 80 },
    { marca: "Varta", canal: "Distribuidor", margen_minimo: 35 },
    { marca: "Otros", canal: "Retail", margen_minimo: 50 },
    { marca: "Otros", canal: "Mayorista", margen_minimo: 25 },
    { marca: "Otros", canal: "Online", margen_minimo: 70 },
    { marca: "Otros", canal: "Distribuidor", margen_minimo: 20 }
  ]
};

// ============================================================================
// 🎯 EQUIVALENCIAS VARTA (Tabla de referencia)
// ============================================================================

const EQUIVALENCIAS_VARTA = {
  // Tipos de baterías y sus códigos Varta equivalentes
  "12X45": "VA45BD",
  "12X50": "VA50GD", 
  "12X65": "VA60DD/E",
  "12X65 REF": "VA60DD/E",
  "12X65 ALTA": "VA60HD/E",
  "12X75": "VA70ND/E",
  "12X75 REF": "VA70ND/E",
  "12X75 ALTA": "VA70ND/E",
  "12X80 BORA": "VA80DD/E",
  "12X90 SPRINTER": "VA90LD/E",
  "12X90 HILUX": "VA90LD/E",
  "12X110": "VPA100LE",
  "12X180": "VA180TD",
  "12X220": "VA200TD",
  "12X40 (H FIT)": "VA40DD/E",
  "12X50 (H CIVIC)": "VA50GD",
  "12X85 HILUX": "VA85DD/E",
  "TRACT. CESPED": "VA6V25DD/E",
  "L2": "VA60DD/E",
  "L3": "VA72DD/E"
};

// Precios base de Varta (en USD, se convierten a ARS)
const PRECIOS_VARTA_NETOS = {
  "VA45BD": 42.80,
  "VA50GD": 45.60,
  "VA60DD/E": 46.92,
  "VA60HD/E": 51.50,
  "VA70ND/E": 57.75,
  "VA80DD/E": 62.30,
  "VA85DD/E": 66.80,
  "VA90LD/E": 78.87,
  "VPA100LE": 93.86,
  "VA180TD": 129.32,
  "VA200TD": 160.42,
  "VA40DD/E": 38.50,
  "VA6V25DD/E": 22.40,
  "VA72DD/E": 58.90
};

// ============================================================================
// 🔧 FUNCIONES AUXILIARES
// ============================================================================

/**
 * Carga la configuración actualizada desde Supabase
 */
async function cargarConfiguracionPricing() {
  if (!supabase) {
    console.warn('⚠️ Supabase no configurado, usando configuración por defecto');
    return CONFIGURACION_PRICING;
  }

  try {
    const { data, error } = await supabase
      .from('config')
      .select('config_data')
      .eq('id', 1)
      .maybeSingle();

    if (error) {
      console.error('❌ Error cargando configuración desde Supabase:', error);
      return CONFIGURACION_PRICING;
    }

    if (data && data.config_data) {
      const config = data.config_data;
      console.log('✅ Configuración cargada desde Supabase:', config);
      
      // Actualizar configuración con valores de Supabase
      CONFIGURACION_PRICING = {
        ...CONFIGURACION_PRICING,
        iva: config.iva || 21,
        markups_otras_marcas: {
          "Retail": 1 + (config.markups?.directa || 60) / 100,
          "Mayorista": 1 + (config.markups?.mayorista || 22) / 100,
          "Online": 1 + (config.markups?.distribucion || 20) / 100,
          "Distribuidor": 1 + (config.markups?.distribucion || 20) / 100
        },
        aumento_varta: config.factoresVarta?.factorBase || 40
      };
      
      return CONFIGURACION_PRICING;
    }

    return CONFIGURACION_PRICING;
  } catch (error) {
    console.error('❌ Error cargando configuración:', error);
    return CONFIGURACION_PRICING;
  }
}

/**
 * Normaliza el nombre de la marca
 */
function normalizarMarca(marca) {
  if (!marca) return "Otros";
  const marcaLower = marca.toLowerCase().trim();
  if (marcaLower.includes('varta')) return "Varta";
  return "Otros";
}

/**
 * Normaliza el canal de venta
 */
function normalizarCanal(canal) {
  if (!canal) return "Retail";
  const canalLower = canal.toLowerCase().trim();
  if (canalLower.includes('mayorista') || canalLower.includes('mayor')) return "Mayorista";
  if (canalLower.includes('online') || canalLower.includes('web')) return "Online";
  if (canalLower.includes('distribuidor') || canalLower.includes('dist')) return "Distribuidor";
  if (canalLower.includes('lista') || canalLower.includes('pvp')) return "Lista";
  return "Retail";
}

/**
 * Aplica redondeo inteligente según el canal
 */
function aplicarRedondeo(precio, canal = "Retail") {
  switch (canal) {
    case "Retail":
      return Math.round(precio / 10) * 10; // Múltiplos de $10
    case "Mayorista":
      return Math.round(precio / 10) * 10; // Múltiplos de $10
    case "Online":
      return Math.round(precio / 10) * 10; // Múltiplos de $10
    case "Distribuidor":
      return Math.round(precio / 10) * 10; // Múltiplos de $10
    case "Lista":
      return precio; // Sin redondeo para lista/PVP
    default:
      return Math.round(precio / 10) * 10;
  }
}

/**
 * Calcula la rentabilidad según las reglas del sistema
 */
function calcularRentabilidad(margen, marca, canal) {
  const regla = CONFIGURACION_PRICING.reglasRentabilidad.find(r => 
    r.marca === marca && r.canal === canal
  );
  
  if (!regla) return { rentabilidad: "NO DEFINIDO", alerta: "Sin regla definida" };
  
  return {
    rentabilidad: margen >= regla.margen_minimo ? "RENTABLE" : "NO RENTABLE",
    alerta: margen < regla.margen_minimo ? `Margen bajo (${regla.margen_minimo}% mínimo)` : ""
  };
}

// ============================================================================
// 🎯 FUNCIÓN PRINCIPAL: CÁLCULO DE PRICING
// ============================================================================

/**
 * FUNCIÓN PRINCIPAL: Calcula el pricing correcto para un producto
 * @param {Object} producto - Datos del producto
 * @param {Array} equivalencias - Tabla de equivalencias Varta
 * @returns {Object} Producto con pricing calculado
 */
async function calcularPricingCorrecto(producto, equivalencias) {
  // Cargar configuración actualizada desde Supabase
  const config = await cargarConfiguracionPricing();
  
  const modelo = producto.modelo;
  const marca = normalizarMarca(producto.marca);
  const canal = normalizarCanal(producto.canal);
  const costo = parseFloat(producto.costo) || 0;
  const precioLista = parseFloat(producto.precio_lista) || null;
  
  console.log(`\n🔍 Procesando: ${modelo} (${marca} - ${canal})`);
  
  // Buscar equivalencia en la tabla
  const equivalencia = equivalencias.find(eq => eq.modelo === modelo);
  
  if (!equivalencia) {
    return {
      ...producto,
      error: `No se encontró equivalencia para modelo: ${modelo}`,
      precio_final: 0,
      margen: 0,
      rentabilidad: "ERROR"
    };
  }
  
  // Obtener precio base de Varta
  const precioBaseVarta = parseFloat(equivalencia.precio_varta);
  
  if (isNaN(precioBaseVarta) || precioBaseVarta <= 0) {
    return {
      ...producto,
      error: `Precio Varta inválido para modelo: ${modelo}`,
      precio_final: 0,
      margen: 0,
      rentabilidad: "ERROR"
    };
  }
  
  let precioFinal;
  let margen;
  let tipoCalculo;
  let precioNeto;
  
  console.log(`   💰 Precio Base Varta: $${precioBaseVarta}`);
  console.log(`   💰 Costo: $${costo}`);
  console.log(`   💰 Precio Lista: $${precioLista || 'N/A'}`);
  
  // ============================================================================
  // 🎯 NUEVO SISTEMA DE PRICING POR CANAL
  // ============================================================================
  
  if (canal === "Lista" || canal === "pvp") {
    // ============================================================================
    // 📋 LISTA/PVP: Precio sugerido del proveedor + IVA (SIN redondeo)
    // ============================================================================
    
    if (precioLista && precioLista > 0) {
      precioNeto = precioLista;
      precioFinal = precioLista * (1 + config.iva / 100);
      margen = ((precioLista - costo) / costo) * 100;
      tipoCalculo = "Lista/PVP (sin redondeo)";
    } else {
      precioNeto = precioBaseVarta;
      precioFinal = precioBaseVarta * (1 + config.iva / 100);
      margen = ((precioBaseVarta - costo) / costo) * 100;
      tipoCalculo = "Lista/PVP desde Varta (sin redondeo)";
    }
    
    console.log(`   📋 LISTA/PVP:`);
    console.log(`      Neto: $${precioNeto.toFixed(2)}`);
    console.log(`      Final: $${precioFinal.toFixed(2)}`);
    console.log(`      Rentabilidad: ${margen.toFixed(1)}%`);
    
  } else if (canal === "Retail" || canal === "minorista") {
    // ============================================================================
    // 🏪 MINORISTA: Costo + markup + IVA + redondeo
    // ============================================================================
    
    const markupMinorista = config.markups_otras_marcas["Retail"] || 1.70;
    precioNeto = costo * markupMinorista;
    const precioConIva = precioNeto * (1 + config.iva / 100);
    precioFinal = aplicarRedondeo(precioConIva, canal);
    
    // ✅ FÓRMULA CORRECTA: (Precio Neto - Costo) / Precio Neto * 100
    margen = ((precioNeto - costo) / precioNeto) * 100;
    tipoCalculo = `Minorista (+${((markupMinorista - 1) * 100).toFixed(0)}% + redondeo)`;
    
    console.log(`   🏪 MINORISTA:`);
    console.log(`      Costo: $${costo}`);
    console.log(`      +${((markupMinorista - 1) * 100).toFixed(0)}%: $${costo} × ${markupMinorista} = $${precioNeto.toFixed(2)}`);
    console.log(`      +IVA (${config.iva}%): $${precioNeto.toFixed(2)} × ${(1 + config.iva/100).toFixed(2)} = $${precioConIva.toFixed(2)}`);
    console.log(`      Redondeado: $${precioFinal}`);
    console.log(`      Rentabilidad: ${margen.toFixed(1)}%`);
    
  } else if (canal === "Mayorista" || canal === "mayorista") {
    // ============================================================================
    // 🏢 MAYORISTA: Precio Varta + markup + IVA + redondeo
    // ============================================================================
    
    const markupMayorista = config.markups_otras_marcas["Mayorista"] || 1.40;
    precioNeto = precioBaseVarta * markupMayorista;
    const precioConIva = precioNeto * (1 + config.iva / 100);
    precioFinal = aplicarRedondeo(precioConIva, canal);
    
    // ✅ FÓRMULA CORRECTA: (Precio Neto - Precio Varta) / Precio Neto * 100
    margen = ((precioNeto - precioBaseVarta) / precioNeto) * 100;
    tipoCalculo = `Mayorista (Varta +${((markupMayorista - 1) * 100).toFixed(0)}% + redondeo)`;
    
    console.log(`   🏢 MAYORISTA:`);
    console.log(`      Precio Varta: $${precioBaseVarta}`);
    console.log(`      +${((markupMayorista - 1) * 100).toFixed(0)}%: $${precioBaseVarta} × ${markupMayorista} = $${precioNeto.toFixed(2)}`);
    console.log(`      +IVA (${config.iva}%): $${precioNeto.toFixed(2)} × ${(1 + config.iva/100).toFixed(2)} = $${precioConIva.toFixed(2)}`);
    console.log(`      Redondeado: $${precioFinal}`);
    console.log(`      Rentabilidad: ${margen.toFixed(1)}%`);
    
  } else {
    // ============================================================================
    // 🔄 CANAL NO RECONOCIDO: Usar lógica legacy
    // ============================================================================
    
    if (marca === "Varta") {
      const aumento = precioBaseVarta * (config.aumento_varta / 100);
      precioNeto = precioBaseVarta;
      precioFinal = precioBaseVarta + aumento;
      margen = config.aumento_varta;
      tipoCalculo = `Aumento ${config.aumento_varta}% (legacy)`;
    } else {
      const markup = config.markups_otras_marcas[canal] || 1.15;
      precioNeto = precioBaseVarta;
      precioFinal = precioBaseVarta * markup;
      margen = ((precioFinal - precioBaseVarta) / precioBaseVarta) * 100;
      tipoCalculo = `Markup ${canal} (legacy)`;
    }
    
    console.log(`   🔄 LEGACY (${canal}):`);
    console.log(`      Precio Final: $${precioFinal.toFixed(2)}`);
    console.log(`      Rentabilidad: ${margen.toFixed(1)}%`);
  }
  
  // ============================================================================
  // 🎯 VALIDAR RENTABILIDAD
  // ============================================================================
  
  const { rentabilidad, alerta } = calcularRentabilidad(margen, marca, canal);
  
  return {
    ...producto,
    modelo: modelo,
    marca_original: producto.marca,
    marca_normalizada: marca,
    canal_normalizado: canal,
    equivalente_varta: equivalencia.equivalente_varta,
    precio_base_varta: precioBaseVarta,
    precio_neto: precioNeto,
    precio_final: precioFinal,
    margen: margen,
    rentabilidad: rentabilidad,
    alerta: alerta,
    tipo_calculo: tipoCalculo,
    configuracion_usada: {
      aumento_varta: config.aumento_varta,
      markup_canal: marca === "Varta" ? null : config.markups_otras_marcas[canal],
      iva: config.iva
    }
  };
}

// ============================================================================
// 🎯 FUNCIÓN PARA PROCESAR ARCHIVOS EXCEL/CSV
// ============================================================================

/**
 * Procesa un archivo Excel o CSV y extrae los datos
 * @param {Buffer} buffer - Buffer del archivo
 * @returns {Object} Headers y filas de datos
 */
async function procesarArchivoExcel(buffer) {
  try {
    const workbook = new ExcelJS.Workbook();
    
    // Intentar cargar como Excel primero
    try {
      await workbook.xlsx.load(buffer);
    } catch (excelError) {
      // Si falla Excel, intentar como CSV
      console.log('📝 Intentando procesar como CSV...');
      const csvContent = buffer.toString('utf8');
      const lines = csvContent.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        throw new Error('Archivo vacío o sin contenido válido');
      }
      
      const headers = lines[0].split(',').map(h => h.trim());
      const rows = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
          const values = line.split(',').map(v => v.trim());
          const rowData = {};
          
          headers.forEach((header, index) => {
            if (header && values[index]) {
              rowData[header] = values[index];
            }
          });
          
          if (Object.keys(rowData).length > 0) {
            rows.push(rowData);
          }
        }
      }
      
      return { headers, rows };
    }
    
    // Procesar como Excel
    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      throw new Error('No se encontró ninguna hoja en el archivo');
    }
    
    const headers = [];
    const rows = [];
    
    // Obtener headers
    worksheet.getRow(1).eachCell((cell, colNumber) => {
      headers[colNumber - 1] = cell.value;
    });
    
    // Obtener filas de datos
    for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      const rowData = {};
      
      headers.forEach((header, index) => {
        if (header) {
          rowData[header] = row.getCell(index + 1).value;
        }
      });
      
      if (Object.keys(rowData).length > 0) {
        rows.push(rowData);
      }
    }
    
    return { headers, rows };
    
  } catch (error) {
    console.error('❌ Error procesando archivo:', error);
    throw new Error(`Error procesando archivo: ${error.message}`);
  }
}

// ============================================================================
// 🎯 FUNCIÓN PRINCIPAL DE PRUEBA
// ============================================================================

/**
 * Función para probar el sistema con datos de ejemplo
 */
async function probarSistemaPricing() {
  console.log('🚀 PRUEBA DEL SISTEMA DE PRICING ACUBAT');
  console.log('=' .repeat(70));
  
  // Datos de ejemplo
  const productosEjemplo = [
    {
      modelo: "12X65",
      marca: "Moura",
      canal: "Retail",
      costo: 25000,
      precio_lista: 35000
    },
    {
      modelo: "12X75",
      marca: "Varta",
      canal: "Mayorista", 
      costo: 30000,
      precio_lista: 40000
    },
    {
      modelo: "12X90 HILUX",
      marca: "Moura",
      canal: "Lista",
      costo: 45000,
      precio_lista: 60000
    }
  ];
  
  // Equivalencias de ejemplo
  const equivalencias = [
    { modelo: "12X65", equivalente_varta: "VA60DD/E", precio_varta: 46920 },
    { modelo: "12X75", equivalente_varta: "VA70ND/E", precio_varta: 57750 },
    { modelo: "12X90 HILUX", equivalente_varta: "VA90LD/E", precio_varta: 78870 }
  ];
  
  console.log('\n🧪 Probando sistema con productos de ejemplo...');
  
  for (let i = 0; i < productosEjemplo.length; i++) {
    const producto = productosEjemplo[i];
    console.log(`\n${'='.repeat(50)}`);
    console.log(`🔋 PRODUCTO ${i + 1}: ${producto.modelo}`);
    
    const resultado = await calcularPricingCorrecto(producto, equivalencias);
    
    if (resultado.error) {
      console.log(`❌ Error: ${resultado.error}`);
    } else {
      console.log(`\n✅ RESULTADO FINAL:`);
      console.log(`   Precio Final: $${resultado.precio_final.toLocaleString('es-AR')}`);
      console.log(`   Margen: ${resultado.margen.toFixed(1)}%`);
      console.log(`   Rentabilidad: ${resultado.rentabilidad}`);
      console.log(`   Tipo Cálculo: ${resultado.tipo_calculo}`);
      if (resultado.alerta) {
        console.log(`   ⚠️ Alerta: ${resultado.alerta}`);
      }
    }
  }
  
  console.log('\n🎉 ¡PRUEBA COMPLETADA!');
  console.log('=' .repeat(70));
}

// ============================================================================
// 🎯 EXPORTAR FUNCIONES
// ============================================================================

module.exports = {
  calcularPricingCorrecto,
  procesarArchivoExcel,
  cargarConfiguracionPricing,
  normalizarMarca,
  normalizarCanal,
  aplicarRedondeo,
  calcularRentabilidad,
  probarSistemaPricing,
  CONFIGURACION_PRICING,
  EQUIVALENCIAS_VARTA,
  PRECIOS_VARTA_NETOS
};

// ============================================================================
// 🚀 EJECUTAR PRUEBA SI SE LLAMA DIRECTAMENTE
// ============================================================================

if (require.main === module) {
  probarSistemaPricing().catch(console.error);
}
