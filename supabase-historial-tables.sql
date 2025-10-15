-- Tablas para historial de procesos de pricing
-- Ejecutar en Supabase SQL Editor

-- Tabla de sesiones de pricing (cada carga de archivo)
CREATE TABLE IF NOT EXISTS sesiones_pricing (
  id SERIAL PRIMARY KEY,
  nombre_sesion VARCHAR(255) NOT NULL,
  archivo_original VARCHAR(255) NOT NULL,
  fecha_procesamiento TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  usuario_id VARCHAR(255),
  configuracion_usada JSONB NOT NULL,
  estadisticas JSONB NOT NULL,
  estado VARCHAR(50) DEFAULT 'completado',
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de productos procesados (detalle de cada producto)
CREATE TABLE IF NOT EXISTS productos_pricing (
  id SERIAL PRIMARY KEY,
  sesion_id INTEGER REFERENCES sesiones_pricing(id) ON DELETE CASCADE,
  producto VARCHAR(255) NOT NULL,
  tipo VARCHAR(100),
  modelo VARCHAR(255),
  proveedor VARCHAR(100),
  precio_base_original DECIMAL(10,2),
  precio_base_minorista DECIMAL(10,2),
  precio_base_mayorista DECIMAL(10,2),
  descuento_proveedor DECIMAL(5,2),
  costo_estimado_minorista DECIMAL(10,2),
  costo_estimado_mayorista DECIMAL(10,2),
  minorista_precio_neto DECIMAL(10,2),
  minorista_precio_final DECIMAL(10,2),
  minorista_rentabilidad DECIMAL(5,2),
  minorista_markup_aplicado DECIMAL(5,2),
  mayorista_precio_neto DECIMAL(10,2),
  mayorista_precio_final DECIMAL(10,2),
  mayorista_rentabilidad DECIMAL(5,2),
  mayorista_markup_aplicado DECIMAL(5,2),
  equivalencia_varta JSONB,
  validacion_moneda JSONB,
  fecha_procesamiento TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de exportaciones a ERP
CREATE TABLE IF NOT EXISTS exportaciones_erp (
  id SERIAL PRIMARY KEY,
  sesion_id INTEGER REFERENCES sesiones_pricing(id) ON DELETE CASCADE,
  nombre_exportacion VARCHAR(255) NOT NULL,
  tipo_exportacion VARCHAR(50) NOT NULL, -- 'minorista', 'mayorista', 'ambos'
  formato_exportacion VARCHAR(50) NOT NULL, -- 'excel', 'csv', 'json'
  archivo_generado VARCHAR(255),
  total_productos INTEGER,
  fecha_exportacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  estado VARCHAR(50) DEFAULT 'completado',
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de reportes generados
CREATE TABLE IF NOT EXISTS reportes_pricing (
  id SERIAL PRIMARY KEY,
  sesion_id INTEGER REFERENCES sesiones_pricing(id) ON DELETE CASCADE,
  nombre_reporte VARCHAR(255) NOT NULL,
  tipo_reporte VARCHAR(50) NOT NULL, -- 'rentabilidad', 'comparativo', 'tendencias'
  parametros_reporte JSONB,
  archivo_generado VARCHAR(255),
  fecha_generacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  estado VARCHAR(50) DEFAULT 'completado',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_sesiones_fecha ON sesiones_pricing(fecha_procesamiento);
CREATE INDEX IF NOT EXISTS idx_sesiones_usuario ON sesiones_pricing(usuario_id);
CREATE INDEX IF NOT EXISTS idx_productos_sesion ON productos_pricing(sesion_id);
CREATE INDEX IF NOT EXISTS idx_productos_proveedor ON productos_pricing(proveedor);
CREATE INDEX IF NOT EXISTS idx_exportaciones_sesion ON exportaciones_erp(sesion_id);
CREATE INDEX IF NOT EXISTS idx_reportes_sesion ON reportes_pricing(sesion_id);

-- Habilitar RLS (Row Level Security)
ALTER TABLE sesiones_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE exportaciones_erp ENABLE ROW LEVEL SECURITY;
ALTER TABLE reportes_pricing ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad (permitir todo por ahora)
CREATE POLICY "Allow all operations on sesiones_pricing" ON sesiones_pricing FOR ALL USING (true);
CREATE POLICY "Allow all operations on productos_pricing" ON productos_pricing FOR ALL USING (true);
CREATE POLICY "Allow all operations on exportaciones_erp" ON exportaciones_erp FOR ALL USING (true);
CREATE POLICY "Allow all operations on reportes_pricing" ON reportes_pricing FOR ALL USING (true);
