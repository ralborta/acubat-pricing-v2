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

-- Política para permitir lectura (ajustar según necesidades de seguridad)
CREATE POLICY "Permitir lectura de historial" ON config_historial
  FOR SELECT USING (true);

-- Política para permitir inserción (ajustar según necesidades de seguridad)
CREATE POLICY "Permitir inserción de historial" ON config_historial
  FOR INSERT WITH CHECK (true);

