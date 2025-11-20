# Instrucciones para Crear la Tabla de Historial

## Problema
Si ves el error: `Could not find the table 'public.config_historial'`, significa que la tabla no existe en tu base de datos de Supabase.

## Solución: Crear la Tabla

### Paso 1: Ir a Supabase
1. Abre tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Selecciona tu proyecto

### Paso 2: Abrir SQL Editor
1. En el menú lateral, haz clic en **"SQL Editor"**
2. Haz clic en **"New query"** para crear una nueva consulta

### Paso 3: Ejecutar el Script
Copia y pega el siguiente script SQL:

```sql
-- Tabla de historial de configuraciones
CREATE TABLE IF NOT EXISTS config_historial (
  id SERIAL PRIMARY KEY,
  config_data JSONB NOT NULL,
  version VARCHAR(255) NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para búsquedas rápidas por fecha
CREATE INDEX IF NOT EXISTS idx_config_historial_created_at ON config_historial(created_at DESC);

-- Índice para búsquedas por versión
CREATE INDEX IF NOT EXISTS idx_config_historial_version ON config_historial(version);

-- Habilitar RLS (Row Level Security)
ALTER TABLE config_historial ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura
CREATE POLICY "Permitir lectura de historial" ON config_historial
  FOR SELECT USING (true);

-- Política para permitir inserción
CREATE POLICY "Permitir inserción de historial" ON config_historial
  FOR INSERT WITH CHECK (true);
```

### Paso 4: Ejecutar
1. Haz clic en el botón **"Run"** o presiona `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)
2. Deberías ver un mensaje de éxito

### Paso 5: Verificar
1. Vuelve a la aplicación
2. Intenta cargar el historial nuevamente
3. El error debería desaparecer

## Nota
Una vez creada la tabla, el sistema guardará automáticamente cada configuración en el historial cuando hagas cambios.

