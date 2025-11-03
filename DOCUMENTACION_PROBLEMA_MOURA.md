# Documentación: Problema y Solución - Archivos Moura

## 📋 Descripción del Problema

### Problema Principal
El sistema estaba rechazando archivos de Moura con el error:
```
"No se encontró una hoja válida con datos de productos"
```

### Causa Raíz
Los filtros previos eran **demasiado estrictos** y descartaban datos válidos **ANTES** de que llegaran a la IA:

1. **Validación de hojas muy restrictiva**: Se requería un `score` alto y no descartada
2. **Filtros de productos agresivos**: Se descartaban filas con palabras como "total", "subtotal" incluso si eran parte de nombres de productos válidos
3. **No reconocía columnas específicas de Moura**: "Descripción Modelo SAP" no estaba en los candidatos de headers
4. **Primera columna no se usaba como identificador**: Si no había columna "Producto" explícita, la primera columna con códigos (M18FD, M18SD) no se reconocía

### Archivo Problemático
- **Ejemplo**: `MouraYA_Agosto_2025.xlsx`
- **Estructura**: 
  - Primera columna: "Descripción Modelo SAP" (M18FD, M18SD, etc.) → debe ser identificador
  - Columna "Contado": precio en ARS
  - NO hay columna "Producto" explícita

---

## 🔧 Ajustes Realizados

### 1. Agregado de Candidatos de Headers para Moura
**Archivo**: `lib/utils/smart-header.ts`

```typescript
const HEADER_CANDIDATES = [
  // ... existentes
  'descripcion modelo sap',    // ✅ NUEVO: Para Moura
  'descripción modelo sap',    // ✅ NUEVO: Para Moura (con acento)
  'contado',                   // ✅ NUEVO: Columna de precio común
]
```

### 2. Validación de Hojas Relajada
**Archivo**: `app/api/pricing/procesar-archivo/route.ts`

**ANTES**:
```typescript
const hojasValidas = diagnosticoHojas.filter(h => !h.descartada && h.filas > 0)
```

**DESPUÉS**:
```typescript
// Solo descartar hojas completamente vacías (< 1 fila)
const hojasValidas = diagnosticoHojas.filter(h => h.filas > 0)
```

### 3. Lógica Flexible para Primera Columna
**Archivo**: `app/api/pricing/procesar-archivo/route.ts`

```typescript
// Si tiene precio Y primera columna tiene valores, es válida
if (tienePrecio && datosHoja.length >= 2) {
  const primeraCol = headersHoja[0]
  const tieneValoresEnPrimera = datosHoja.some((row: any) => {
    const valor = String(row[primeraCol] || '').trim()
    return valor && valor.length > 0 && !valor.toLowerCase().includes('total')
  })
  if (tieneValoresEnPrimera) {
    score = Math.max(score, 4)
    descartada = false
  }
}

// Si tiene código/modelo identificador y datos, NO descartar
if ((codigo || modelo) && datosHoja.length >= 2) {
  descartada = false
  score = Math.max(score, 3)
}
```

### 4. Detección Específica para Moura
**Archivo**: `app/api/pricing/procesar-archivo/route.ts`

```typescript
// 🎯 DETECTAR SI ES MOURA para ajustar detección
const esMoura = file.name.toLowerCase().includes('moura')

// Para MOURA, buscar "Descripción Modelo SAP" como modelo
let modelo = esMoura 
  ? headersHoja.find(h => H(h).includes('descripcion modelo sap') || ...)
  : headersHoja.find(h => H(h).includes('modelo'))

// 🛠️ AJUSTE CLAVE SOLO MOURA: si NO hay código pero SÍ hay "Descripción Modelo SAP", usala como identificador
if (esMoura && !codigo && modelo) {
  console.log(`🧩 MOURA: usando "Descripción Modelo SAP" como código/ID de producto`)
  codigo = modelo
}
```

### 5. Filtro de Productos Relajado
**Archivo**: `app/api/pricing/procesar-archivo/route.ts`

**ANTES** (demasiado estricto):
```typescript
const datosFiltrados = datosHoja.filter((producto: any, index: number) => {
  if (!isProductRow(producto)) return false
  
  // Descartar si tiene "total" en cualquier columna
  const tieneTotal = valores.some(v => v.includes('total'))
  if (tieneTotal) return false
  
  // ... más filtros agresivos
})
```

**DESPUÉS** (relajado - solo obviamente inválidos):
```typescript
const datosFiltrados = datosHoja.filter((producto: any, index: number) => {
  const valores = Object.values(producto).map(v => String(v || '').toLowerCase())
  
  // 1. Solo descartar filas completamente vacías
  if (valores.every(v => !v || v.trim() === '' || v === '0')) return false
  
  // 2. Solo descartar "TOTAL"/"SUBTOTAL" explícito al final (índice > 5)
  const tieneTotalExplicito = valores.some(v => v.trim() === 'total' || v.trim() === 'subtotal')
  if (tieneTotalExplicito && index > 5) return false
  
  // 3. Solo descartar notas/contacto con muy pocos campos
  const esNotaContacto = valores.some(v => 
    (v.includes('tel:') || v.includes('email:') || v.includes('@')) && 
    valores.filter(v => v.trim()).length < 3
  )
  if (esNotaContacto) return false
  
  // ✅ TODO LO DEMÁS se deja pasar - la IA decidirá si es válido
  return true
})
```

### 6. isProductRow Relajado
**Archivo**: `lib/utils/smart-header.ts`

**ANTES**:
```typescript
// Descartar si tiene "total" en cualquier columna
if (strings.some(v => v.includes('total'))) {
  return false;
}
```

**DESPUÉS**:
```typescript
// RELAJADO: No descartar por "total" o "subtotal" automáticamente
// Puede ser parte del nombre de un producto. La IA decidirá.
```

---

## 📁 Código Completo

### Flujo Completo desde Carga de Archivo

El código completo está en:
- **`app/api/pricing/procesar-archivo/route.ts`** (líneas 389-1786)
- **`lib/utils/smart-header.ts`** (líneas 1-134)
- **`app/lib/pricing_mapper.ts`** (para mapeo con IA)

### Flujo Simplificado

```
1. POST /api/pricing/procesar-archivo
   ↓
2. Leer archivo Excel (buffer)
   ↓
3. Para cada hoja:
   a. readWithSmartHeader() → detecta headers automáticamente
   b. Calcular score (flexible, no descarta fácilmente)
   c. Filtrar filas obviamente inválidas (muy relajado)
   ↓
4. Consolidar productos de todas las hojas
   ↓
5. mapColumnsStrict() → IA mapea columnas
   - Detecta: identificador, modelo, marca, precio, tipo, descripción
   - Usa vendor hints (MOURA, LIQUI MOLY, etc.)
   - Fallbacks hardcodeados si IA falla
   ↓
6. Procesar cada producto:
   - Extraer ID (primera columna si no hay otro)
   - Extraer precio (Contado, PVP Off Line, etc.)
   - Extraer tipo y descripción
   - Calcular pricing (minorista/mayorista)
   ↓
7. Retornar resultados
```

### Puntos Clave del Código

#### Lectura de Archivo
```typescript
const buffer = await file.arrayBuffer()
const workbook = XLSX.read(buffer, { type: 'buffer', cellText: false, cellDates: false })
```

#### Detección de Headers Inteligente
```typescript
const datosHoja = readWithSmartHeader(worksheet) // Detecta headers en cualquier fila
```

#### Validación Flexible de Hojas
```typescript
// Solo descartar si está completamente vacía
let descartada = datosHoja.length < 1

// Si tiene precio y datos, NO descartar
if (tienePrecio && datosHoja.length >= 2) {
  descartada = false
  score = Math.max(score, 4)
}

// Si tiene código/modelo y datos, NO descartar
if ((codigo || modelo) && datosHoja.length >= 2) {
  descartada = false
  score = Math.max(score, 3)
}
```

#### Mapeo con IA
```typescript
const { result } = await mapColumnsStrict({
  columnas: headers,
  muestra: datos.slice(0, 10),
  nombreArchivo: file.name,
  vendorHint: vendorHint || undefined, // "MOURA", "LIQUI MOLY", etc.
  model: 'gpt-4o-mini'
})
```

#### Extracción de Datos
```typescript
// ID: usa primera columna si no hay otro identificador
let id_val = idCol ? String(getCellFlexible(producto, idCol) ?? '').trim() : '';

// Si no hay ID, usar primera columna con valores
if (!id_val) {
  const primeraCol = headers[0]
  id_val = String(producto[primeraCol] || '').trim()
}

// Precio: buscar en "Contado", "PVP Off Line", etc.
const precioBase = getPrecioSeguro(producto, proveedor) || 
                   parseLocaleNumber(producto[columnMapping.precio])
```

---

## ✅ Resultado

### Antes
- ❌ Error: "No se encontró una hoja válida con datos de productos"
- ❌ Filtros descartaban datos válidos antes de llegar a la IA
- ❌ No reconocía "Descripción Modelo SAP" como identificador
- ❌ Requería columna "Producto" explícita

### Después
- ✅ Procesa todas las hojas con datos (filas > 0)
- ✅ Filtros relajados, la IA decide qué es válido
- ✅ Reconoce "Descripción Modelo SAP" como identificador para Moura
- ✅ Usa primera columna como identificador si no hay otro
- ✅ Detecta "Contado" como precio correctamente

---

## 🎯 Resumen de Cambios

1. **HEADER_CANDIDATES**: Agregado "descripcion modelo sap" y "contado"
2. **Validación de hojas**: Solo requiere `filas > 0` (no score ni descartada)
3. **Lógica Moura**: Usa "Descripción Modelo SAP" como identificador si no hay código
4. **Primera columna**: Se valida y se usa como identificador si tiene valores
5. **Filtros relajados**: Solo descarta obviamente inválidos (vacías, separadores, notas)
6. **isProductRow relajado**: No descarta por "total" automáticamente

---

## 📝 Notas Importantes

- **La IA procesa MÁS datos ahora**: Los filtros previos no eliminan datos válidos
- **Fallbacks robustos**: Si la IA falla, hay fallbacks hardcodeados
- **Vendor hints**: El sistema detecta proveedor del nombre de archivo y ajusta comportamiento
- **Primera columna**: Si no hay "Producto", la primera columna se usa como identificador automáticamente

