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
    "descuentoProveedor": 0,
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

-- Tabla de transacciones para conciliación
CREATE TABLE IF NOT EXISTS transacciones (
  id SERIAL PRIMARY KEY,
  transaccion_id VARCHAR(255) NOT NULL,
  fecha DATE NOT NULL,
  monto DECIMAL(12,2) NOT NULL,
  descripcion TEXT,
  referencia VARCHAR(255),
  tipo VARCHAR(50) NOT NULL, -- 'venta' o 'compra'
  archivo_origen VARCHAR(255),
  conciliada BOOLEAN DEFAULT false,
  banco_conciliado VARCHAR(255),
  coincidencia_id VARCHAR(255),
  fecha_conciliacion TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de movimientos bancarios
CREATE TABLE IF NOT EXISTS movimientos_bancarios (
  id SERIAL PRIMARY KEY,
  movimiento_id VARCHAR(255) NOT NULL,
  banco VARCHAR(255) NOT NULL,
  fecha DATE NOT NULL,
  monto DECIMAL(12,2) NOT NULL,
  descripcion TEXT,
  referencia VARCHAR(255),
  archivo_origen VARCHAR(255),
  conciliado BOOLEAN DEFAULT false,
  transaccion_conciliada_id INTEGER REFERENCES transacciones(id),
  fecha_conciliacion TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de conciliaciones
CREATE TABLE IF NOT EXISTS conciliaciones (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  banco VARCHAR(255) NOT NULL,
  total_transacciones INTEGER NOT NULL,
  transacciones_conciliadas INTEGER NOT NULL,
  transacciones_pendientes INTEGER NOT NULL,
  porcentaje DECIMAL(5,2) NOT NULL,
  tiempo_procesamiento INTEGER, -- en milisegundos
  configuracion_usada JSONB,
  fecha_inicio TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_fin TIMESTAMP WITH TIME ZONE,
  estado VARCHAR(50) DEFAULT 'en_progreso', -- 'en_progreso', 'completado', 'error'
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de configuración de bancos
CREATE TABLE IF NOT EXISTS bancos_config (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  codigo VARCHAR(50) NOT NULL,
  activo BOOLEAN DEFAULT true,
  orden INTEGER NOT NULL,
  tolerancia_monto DECIMAL(10,4) DEFAULT 0.01,
  tolerancia_dias INTEGER DEFAULT 1,
  formato_archivo VARCHAR(50) DEFAULT 'excel',
  columnas_mapping JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE config ENABLE ROW LEVEL SECURITY;
ALTER TABLE equivalencias_varta ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_bancarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE conciliaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE bancos_config ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad (permitir todo por ahora)
CREATE POLICY "Allow all operations on config" ON config FOR ALL USING (true);
CREATE POLICY "Allow all operations on equivalencias_varta" ON equivalencias_varta FOR ALL USING (true);
CREATE POLICY "Allow all operations on productos" ON productos FOR ALL USING (true);
CREATE POLICY "Allow all operations on simulaciones" ON simulaciones FOR ALL USING (true);
CREATE POLICY "Allow all operations on transacciones" ON transacciones FOR ALL USING (true);
CREATE POLICY "Allow all operations on movimientos_bancarios" ON movimientos_bancarios FOR ALL USING (true);
CREATE POLICY "Allow all operations on conciliaciones" ON conciliaciones FOR ALL USING (true);
CREATE POLICY "Allow all operations on bancos_config" ON bancos_config FOR ALL USING (true);

-- Índices para optimizar consultas de conciliación
CREATE INDEX IF NOT EXISTS idx_transacciones_fecha ON transacciones(fecha);
CREATE INDEX IF NOT EXISTS idx_transacciones_monto ON transacciones(monto);
CREATE INDEX IF NOT EXISTS idx_transacciones_conciliada ON transacciones(conciliada);
CREATE INDEX IF NOT EXISTS idx_movimientos_banco ON movimientos_bancarios(banco);
CREATE INDEX IF NOT EXISTS idx_movimientos_fecha ON movimientos_bancarios(fecha);
CREATE INDEX IF NOT EXISTS idx_movimientos_monto ON movimientos_bancarios(monto);
CREATE INDEX IF NOT EXISTS idx_conciliaciones_banco ON conciliaciones(banco);
CREATE INDEX IF NOT EXISTS idx_conciliaciones_fecha ON conciliaciones(fecha_inicio);

-- Insertar configuración inicial de bancos
INSERT INTO bancos_config (nombre, codigo, activo, orden, tolerancia_monto, tolerancia_dias) VALUES
('Santander', 'SAN', true, 1, 0.01, 1),
('Galicia', 'GAL', true, 2, 0.01, 1),
('BBVA', 'BBVA', true, 3, 0.01, 1)
ON CONFLICT DO NOTHING;
