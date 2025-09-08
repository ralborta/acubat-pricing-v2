# 🎯 **DOCUMENTACIÓN TÉCNICA - SISTEMA DE PRICING ACUBAT**

## 📋 **DESCRIPCIÓN GENERAL**

El Sistema de Pricing Acubat es una herramienta completa para el cálculo automático de precios de baterías automotrices en diferentes canales de venta. El sistema procesa archivos Excel/CSV, aplica reglas de pricing configurables y genera análisis de rentabilidad.

---

## 🏗️ **ARQUITECTURA DEL SISTEMA**

### **Componentes Principales:**

1. **Motor de Cálculo** (`calcularPricingCorrecto`)
2. **Procesador de Archivos** (`procesarArchivoExcel`)
3. **Gestor de Configuración** (`cargarConfiguracionPricing`)
4. **Normalizadores** (`normalizarMarca`, `normalizarCanal`)
5. **Calculadores de Rentabilidad** (`calcularRentabilidad`)

### **Flujo de Datos:**

```
Archivo Excel/CSV → Procesamiento → Normalización → Cálculo → Análisis → Resultados
```

---

## 🧮 **LÓGICA DE CÁLCULO**

### **1. 📋 CANAL LISTA/PVP**

**Propósito:** Precio de venta al público sugerido por el proveedor

**Fórmula:**
```
Precio Final = Precio Lista × (1 + IVA/100)
```

**Características:**
- ✅ **SIN redondeo** - mantiene precio exacto
- ✅ Usa precio del proveedor como base
- ✅ Solo aplica IVA
- ✅ Margen calculado sobre costo

**Ejemplo:**
```
Precio Lista: $35.000
IVA: 21%
Precio Final: $35.000 × 1.21 = $42.350
```

### **2. 🏪 CANAL MINORISTA (RETAIL)**

**Propósito:** Venta al público con margen comercial

**Fórmula:**
```
Precio Neto = Costo × Markup
Precio Final = (Precio Neto × (1 + IVA/100)) redondeado a $10
```

**Características:**
- ✅ **Con redondeo** a múltiplos de $10
- ✅ Usa costo como base
- ✅ Markup configurable (default: +70%)
- ✅ Margen calculado sobre precio neto

**Ejemplo:**
```
Costo: $25.000
Markup: 1.70 (+70%)
Precio Neto: $25.000 × 1.70 = $42.500
IVA: 21%
Precio con IVA: $42.500 × 1.21 = $51.425
Precio Final: $51.430 (redondeado)
```

### **3. 🏢 CANAL MAYORISTA**

**Propósito:** Venta al por mayor con margen reducido

**Fórmula:**
```
Precio Neto = Precio Varta × Markup
Precio Final = (Precio Neto × (1 + IVA/100)) redondeado a $10
```

**Características:**
- ✅ **Con redondeo** a múltiplos de $10
- ✅ Usa precio Varta como base
- ✅ Markup menor (default: +40%)
- ✅ Margen calculado sobre precio neto

**Ejemplo:**
```
Precio Varta: $46.920
Markup: 1.40 (+40%)
Precio Neto: $46.920 × 1.40 = $65.688
IVA: 21%
Precio con IVA: $65.688 × 1.21 = $79.482
Precio Final: $79.480 (redondeado)
```

---

## ⚙️ **CONFIGURACIÓN DEL SISTEMA**

### **Parámetros Configurables:**

```javascript
CONFIGURACION_PRICING = {
  iva: 21,                    // IVA en porcentaje
  aumento_varta: 40,          // Aumento para productos Varta
  markups_otras_marcas: {
    "Retail": 1.70,           // +70% para minorista
    "Mayorista": 1.40,        // +40% para mayorista
    "Online": 1.60,           // +60% para online
    "Distribuidor": 1.30      // +30% para distribuidor
  },
  reglasRentabilidad: [...]   // Reglas de margen mínimo
}
```

### **Reglas de Rentabilidad:**

```javascript
reglasRentabilidad: [
  { marca: "Varta", canal: "Retail", margen_minimo: 60 },
  { marca: "Varta", canal: "Mayorista", margen_minimo: 40 },
  { marca: "Otros", canal: "Retail", margen_minimo: 50 },
  { marca: "Otros", canal: "Mayorista", margen_minimo: 25 }
]
```

---

## 🔗 **EQUIVALENCIAS VARTA**

### **Sistema de Equivalencias:**

El sistema utiliza una tabla de equivalencias para mapear productos de otras marcas a códigos Varta:

```javascript
EQUIVALENCIAS_VARTA = {
  "12X45": "VA45BD",
  "12X50": "VA50GD",
  "12X65": "VA60DD/E",
  "12X75": "VA70ND/E",
  "12X90 HILUX": "VA90LD/E"
}
```

### **Precios Base Varta:**

```javascript
PRECIOS_VARTA_NETOS = {
  "VA45BD": 42.80,
  "VA50GD": 45.60,
  "VA60DD/E": 46.92,
  "VA70ND/E": 57.75,
  "VA90LD/E": 78.87
}
```

---

## 📊 **CÁLCULO DE MARGENES**

### **Fórmulas de Margen:**

#### **Para Canal Minorista:**
```
Margen = ((Precio Neto - Costo) / Precio Neto) × 100
```

#### **Para Canal Mayorista:**
```
Margen = ((Precio Neto - Precio Varta) / Precio Neto) × 100
```

#### **Para Canal Lista/PVP:**
```
Margen = ((Precio Lista - Costo) / Costo) × 100
```

### **Validación de Rentabilidad:**

```javascript
function calcularRentabilidad(margen, marca, canal) {
  const regla = reglasRentabilidad.find(r => 
    r.marca === marca && r.canal === canal
  );
  
  return {
    rentabilidad: margen >= regla.margen_minimo ? "RENTABLE" : "NO RENTABLE",
    alerta: margen < regla.margen_minimo ? `Margen bajo (${regla.margen_minimo}% mínimo)` : ""
  };
}
```

---

## 🔧 **FUNCIONES PRINCIPALES**

### **1. `calcularPricingCorrecto(producto, equivalencias)`**

**Parámetros:**
- `producto`: Objeto con datos del producto
- `equivalencias`: Array de equivalencias Varta

**Retorna:**
```javascript
{
  modelo: "12X65",
  marca_normalizada: "Moura",
  canal_normalizado: "Retail",
  precio_final: 51430,
  margen: 41.2,
  rentabilidad: "RENTABLE",
  tipo_calculo: "Minorista (+70% + redondeo)",
  configuracion_usada: { ... }
}
```

### **2. `procesarArchivoExcel(buffer)`**

**Parámetros:**
- `buffer`: Buffer del archivo Excel/CSV

**Retorna:**
```javascript
{
  headers: ["CODIGO", "TIPO", "MARCA", "CANAL", "COSTO", "PRECIO_LISTA"],
  rows: [
    { CODIGO: "M18FD", TIPO: "12X45", MARCA: "Moura", ... },
    { CODIGO: "M22ED", TIPO: "12X50", MARCA: "Varta", ... }
  ]
}
```

### **3. `cargarConfiguracionPricing()`**

**Funcionalidad:**
- Carga configuración desde Supabase
- Fallback a configuración por defecto
- Actualiza parámetros del sistema

---

## 📁 **FORMATO DE ARCHIVOS**

### **Estructura Requerida:**

```csv
CODIGO,TIPO,MARCA,CANAL,COSTO,PRECIO_LISTA
M18FD,12X45,Moura,Retail,20000,28000
M22ED,12X50,Varta,Mayorista,25000,35000
M20GD,12X65,Moura,Lista,30000,42000
```

### **Columnas Obligatorias:**

- **CODIGO**: Identificador único del producto
- **TIPO**: Tipo de batería (debe tener equivalencia Varta)
- **MARCA**: Marca del producto (Varta, Moura, etc.)
- **CANAL**: Canal de venta (Retail, Mayorista, Lista, Online)
- **COSTO**: Costo del producto en pesos argentinos
- **PRECIO_LISTA**: Precio sugerido por el proveedor

### **Formatos Soportados:**

- ✅ **Excel**: `.xlsx`, `.xls`
- ✅ **CSV**: `.csv`
- ❌ **PDF, Word, etc.**

---

## 🚀 **EJEMPLOS DE USO**

### **Ejemplo 1: Cálculo Individual**

```javascript
const producto = {
  modelo: "12X65",
  marca: "Moura",
  canal: "Retail",
  costo: 25000,
  precio_lista: 35000
};

const equivalencia = {
  modelo: "12X65",
  equivalente_varta: "VA60DD/E",
  precio_varta: 46920
};

const resultado = await calcularPricingCorrecto(producto, [equivalencia]);
console.log(`Precio Final: $${resultado.precio_final}`);
```

### **Ejemplo 2: Procesamiento de Archivo**

```javascript
const fs = require('fs');
const buffer = fs.readFileSync('productos.xlsx');
const { headers, rows } = await procesarArchivoExcel(buffer);

const equivalencias = await cargarEquivalencias();
const resultados = [];

for (const row of rows) {
  const producto = {
    modelo: row.TIPO,
    marca: row.MARCA,
    canal: row.CANAL,
    costo: row.COSTO,
    precio_lista: row.PRECIO_LISTA
  };
  
  const resultado = await calcularPricingCorrecto(producto, equivalencias);
  resultados.push(resultado);
}
```

### **Ejemplo 3: Análisis de Rentabilidad**

```javascript
const rentables = resultados.filter(r => r.rentabilidad === "RENTABLE");
const noRentables = resultados.filter(r => r.rentabilidad === "NO RENTABLE");
const margenPromedio = resultados.reduce((sum, r) => sum + r.margen, 0) / resultados.length;

console.log(`Rentables: ${rentables.length}`);
console.log(`No rentables: ${noRentables.length}`);
console.log(`Margen promedio: ${margenPromedio.toFixed(1)}%`);
```

---

## 🔍 **VALIDACIONES Y ERRORES**

### **Validaciones del Sistema:**

1. **Equivalencia Varta**: Debe existir para el modelo
2. **Precio Varta**: Debe ser válido y mayor a 0
3. **Datos numéricos**: Costo y precio deben ser números
4. **Canal válido**: Debe ser reconocido por el sistema

### **Manejo de Errores:**

```javascript
if (!equivalencia) {
  return {
    ...producto,
    error: `No se encontró equivalencia para modelo: ${modelo}`,
    precio_final: 0,
    margen: 0,
    rentabilidad: "ERROR"
  };
}
```

### **Alertas de Rentabilidad:**

```javascript
if (margen < regla.margen_minimo) {
  return {
    rentabilidad: "NO RENTABLE",
    alerta: `Margen bajo (${regla.margen_minimo}% mínimo)`
  };
}
```

---

## 📈 **ESTADÍSTICAS Y REPORTES**

### **Métricas Calculadas:**

- **Total de productos** procesados
- **Productos rentables** vs no rentables
- **Margen promedio** por marca y canal
- **Distribución** por canales de venta
- **Alertas** de rentabilidad

### **Ejemplo de Reporte:**

```javascript
const estadisticas = {
  total_productos: 150,
  productos_rentables: 120,
  productos_no_rentables: 30,
  margen_promedio: 45.2,
  por_marca: {
    "Varta": { cantidad: 80, margen_promedio: 52.1, rentables: 75 },
    "Moura": { cantidad: 70, margen_promedio: 38.3, rentables: 45 }
  },
  por_canal: {
    "Retail": { cantidad: 60, margen_promedio: 48.5, rentables: 55 },
    "Mayorista": { cantidad: 90, margen_promedio: 42.8, rentables: 65 }
  }
};
```

---

## 🔧 **CONFIGURACIÓN AVANZADA**

### **Personalización de Markups:**

```javascript
// Cambiar markup minorista a 80%
CONFIGURACION_PRICING.markups_otras_marcas["Retail"] = 1.80;

// Cambiar IVA a 25%
CONFIGURACION_PRICING.iva = 25;

// Cambiar aumento Varta a 50%
CONFIGURACION_PRICING.aumento_varta = 50;
```

### **Agregar Nuevas Reglas de Rentabilidad:**

```javascript
CONFIGURACION_PRICING.reglasRentabilidad.push({
  marca: "NuevaMarca",
  canal: "NuevoCanal",
  margen_minimo: 45
});
```

### **Configuración desde Supabase:**

```javascript
// La configuración se carga automáticamente desde Supabase
// Tabla: config
// Campo: config_data (JSON)
{
  "iva": 21,
  "markups": {
    "directa": 60,
    "mayorista": 22,
    "distribucion": 20
  },
  "factoresVarta": {
    "factorBase": 40
  }
}
```

---

## 🚨 **CONSIDERACIONES IMPORTANTES**

### **Limitaciones:**

1. **Archivos**: Máximo 10MB
2. **Equivalencias**: Deben existir en la tabla Varta
3. **Datos**: Solo números para costos y precios
4. **Canales**: Solo canales predefinidos

### **Recomendaciones:**

1. **Validar datos** antes del procesamiento
2. **Revisar equivalencias** regularmente
3. **Monitorear rentabilidad** de productos
4. **Actualizar configuración** según necesidades

### **Mantenimiento:**

1. **Actualizar precios Varta** mensualmente
2. **Revisar reglas de rentabilidad** trimestralmente
3. **Validar equivalencias** con nuevos productos
4. **Monitorear performance** del sistema

---

## 🎯 **CONCLUSIÓN**

El Sistema de Pricing Acubat proporciona una solución completa y automatizada para el cálculo de precios de baterías automotrices. Con su arquitectura modular, configuración flexible y análisis detallado de rentabilidad, permite optimizar la estrategia de precios en diferentes canales de venta.

**Características clave:**
- ✅ **Cálculo automático** de precios por canal
- ✅ **Configuración dinámica** desde base de datos
- ✅ **Análisis de rentabilidad** en tiempo real
- ✅ **Procesamiento masivo** de archivos
- ✅ **Validaciones robustas** y manejo de errores
- ✅ **Reportes detallados** y estadísticas

**¡El sistema está listo para uso en producción!** 🚀
