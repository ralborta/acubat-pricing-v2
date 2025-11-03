# 📋 CÓMO REVISAR LOS LOGS PARA DIAGNÓSTICO

## 1️⃣ LOGS DEL FRONTEND (Navegador)

### Pasos:
1. Abre tu aplicación en el navegador
2. Presiona **F12** o **clic derecho → Inspeccionar**
3. Ve a la pestaña **"Console"**
4. Sube y procesa un archivo (ej: YUASA)
5. Busca los mensajes que empiezan con:
   - `🔍 ========== DEBUG FRONTEND: RESPUESTA DEL BACKEND ==========`
   - Verás los valores de `producto`, `descripcion`, `proveedor` para los primeros 5 productos

### Qué copiar:
- Todo el bloque desde `🔍 ========== DEBUG FRONTEND` hasta `🔍 ============================================================`

---

## 2️⃣ LOGS DEL BACKEND (Vercel)

### Opción A: Dashboard Web de Vercel
1. Ve a: https://vercel.com/dashboard
2. Selecciona tu proyecto **acubat-pricing-v2**
3. Haz clic en el último **Deployment** (el más reciente)
4. Ve a la pestaña **"Functions"** o **"Runtime Logs"**
5. Busca las llamadas a `/api/pricing/procesar-archivo`
6. Verás los logs del servidor con:
   - `🔍 [PRODUCTO X] VALORES FINALES ANTES DE CREAR OBJETO`
   - `🔍 ========== DEBUG: PRODUCTOS ANTES DE ENVIAR RESPUESTA ==========`

### Opción B: Vercel CLI (más fácil)
Si tienes Vercel CLI instalado:
```bash
vercel logs --follow
```
Esto muestra los logs en tiempo real mientras procesas un archivo.

---

## 3️⃣ QUÉ BUSCAR EN LOS LOGS

### ✅ Si todo funciona bien, deberías ver:

**Backend (antes de crear objeto):**
```
🔍 [PRODUCTO 1] VALORES FINALES ANTES DE CREAR OBJETO:
   - descripcion_val: "BATERIA YUASA 6N2-2A" (tipo: string, longitud: 19)
   - proveedor: "YUASA"
   - marcaEncontradaEnDescripcion: "YUASA"
```

**Backend (antes de enviar):**
```
🔍 ========== DEBUG: PRODUCTOS ANTES DE ENVIAR RESPUESTA ==========
   - Primer producto (índice 0):
     * producto: "YUASA" (tipo: string)
     * descripcion: "BATERIA YUASA 6N2-2A" (tipo: string, longitud: 19)
     * proveedor: "YUASA"
```

**Frontend (recibido):**
```
🔍 ========== DEBUG FRONTEND: RESPUESTA DEL BACKEND ==========
   - Primer producto recibido:
     * producto: "YUASA" (tipo: string)
     * descripcion: "BATERIA YUASA 6N2-2A" (tipo: string)
```

### ❌ Si hay problema, buscar:
- `descripcion_val: ""` → Problema en extracción
- `descripcion: ""` en resultadoProducto → Problema al crear objeto
- `descripcion: undefined` en respuesta → Problema en serialización
- `descripcion: ""` en frontend pero con valor en backend → Problema en transporte

---

## 4️⃣ COPIAR Y ENVIAR LOGS

Para ayudarme a diagnosticar, copia y envía:

1. **Logs del Frontend** (consola del navegador) - TODO el bloque DEBUG
2. **Logs del Backend** (Vercel) - Busca específicamente:
   - Los mensajes de `🔍 [PRODUCTO 1] VALORES FINALES`
   - El bloque `🔍 ========== DEBUG: PRODUCTOS ANTES DE ENVIAR RESPUESTA`

---

## 🔧 SI NO VES LOGS EN VERCEL:

1. Verifica que el deployment sea exitoso
2. Asegúrate de estar mirando el deployment correcto (el más reciente)
3. Intenta hacer un nuevo procesamiento mientras miras los logs
4. Los logs pueden tardar unos segundos en aparecer

---

## 📸 ALTERNATIVA: Screenshots

Si no puedes copiar los logs, puedes:
1. Hacer un screenshot de la consola del navegador (F12 → Console)
2. Hacer un screenshot de los logs de Vercel (si los ves)
3. Enviarme las imágenes

