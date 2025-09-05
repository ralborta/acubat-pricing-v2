-- Configuración de Supabase para AcuBat Pricing Platform v2.0

-- Tabla de configuración del sistema
CREATE TABLE IF NOT EXISTS config (
  id SERIAL PRIMARY KEY,
  config_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_config_created_at ON config(created_at DESC);

-- Insertar configuración inicial
INSERT INTO config (config_data) VALUES (
  '{
    "modo": "produccion",
    "iva": 21,
    "markups": {
      "mayorista": 22,
      "directa": 60,
      "distribucion": 20
    },
    "factoresVarta": {
      "factorBase": 40,
      "capacidad80Ah": 35
    },
    "promociones": false,
    "promocionesHabilitado": false,
    "comisiones": {
      "mayorista": 5,
      "directa": 8,
      "distribucion": 6
    },
    "ultimaActualizacion": "2024-01-15T10:00:00.000Z"
  }'::jsonb
) ON CONFLICT DO NOTHING;

-- Tabla de equivalencias Varta
CREATE TABLE IF NOT EXISTS equivalencias_varta (
  id SERIAL PRIMARY KEY,
  modelo_original VARCHAR(255) NOT NULL,
  modelo_varta VARCHAR(255) NOT NULL,
  precio_varta DECIMAL(10,2) NOT NULL,
  categoria VARCHAR(100),
  disponible BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_equivalencias_modelo_original ON equivalencias_varta(modelo_original);
CREATE INDEX IF NOT EXISTS idx_equivalencias_modelo_varta ON equivalencias_varta(modelo_varta);

-- Tabla de productos procesados
CREATE TABLE IF NOT EXISTS productos (
  id SERIAL PRIMARY KEY,
  producto VARCHAR(255) NOT NULL,
  tipo VARCHAR(100),
  modelo VARCHAR(255),
  precio_base_minorista DECIMAL(10,2),
  precio_base_mayorista DECIMAL(10,2),
  costo_estimado_minorista DECIMAL(10,2),
  costo_estimado_mayorista DECIMAL(10,2),
  margen_minorista DECIMAL(5,2),
  margen_mayorista DECIMAL(5,2),
  rentabilidad VARCHAR(50),
  equivalencia_varta JSONB,
  observaciones TEXT,
  fecha_procesamiento TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  archivo_origen VARCHAR(255)
);

-- Tabla de simulaciones
CREATE TABLE IF NOT EXISTS simulaciones (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  archivo_original VARCHAR(255),
  total_productos INTEGER,
  productos_procesados INTEGER,
  errores INTEGER,
  configuracion_usada JSONB,
  fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  usuario_id VARCHAR(255)
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE config ENABLE ROW LEVEL SECURITY;
ALTER TABLE equivalencias_varta ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulaciones ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad (permitir todo por ahora)
CREATE POLICY "Allow all operations on config" ON config FOR ALL USING (true);
CREATE POLICY "Allow all operations on equivalencias_varta" ON equivalencias_varta FOR ALL USING (true);
CREATE POLICY "Allow all operations on productos" ON productos FOR ALL USING (true);
CREATE POLICY "Allow all operations on simulaciones" ON simulaciones FOR ALL USING (true);
