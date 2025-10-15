const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno de Supabase no encontradas')
  console.error('Asegúrate de tener NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const sqlScript = `
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
`

async function crearTablas() {
  try {
    console.log('🚀 Iniciando creación de tablas en Supabase...')
    console.log('🔗 URL:', supabaseUrl)
    
    // Ejecutar el script SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlScript })
    
    if (error) {
      console.error('❌ Error ejecutando SQL:', error)
      
      // Intentar método alternativo usando query directo
      console.log('🔄 Intentando método alternativo...')
      
      // Dividir el script en comandos individuales
      const comandos = sqlScript.split(';').filter(cmd => cmd.trim())
      
      for (const comando of comandos) {
        if (comando.trim()) {
          try {
            const { error: cmdError } = await supabase
              .from('_sql')
              .select('*')
              .limit(0)
            
            if (cmdError) {
              console.log(`⚠️  Comando: ${comando.substring(0, 50)}...`)
              console.log(`   Error: ${cmdError.message}`)
            }
          } catch (e) {
            console.log(`⚠️  Comando: ${comando.substring(0, 50)}...`)
            console.log(`   Error: ${e.message}`)
          }
        }
      }
      
      console.log('❌ No se pudo ejecutar el script automáticamente')
      console.log('📋 Por favor, ejecuta manualmente el script en Supabase SQL Editor')
      return
    }
    
    console.log('✅ Tablas creadas exitosamente!')
    console.log('📊 Verificando tablas creadas...')
    
    // Verificar que las tablas se crearon
    const tablas = ['sesiones_pricing', 'productos_pricing', 'exportaciones_erp', 'reportes_pricing']
    
    for (const tabla of tablas) {
      try {
        const { data, error } = await supabase
          .from(tabla)
          .select('*')
          .limit(1)
        
        if (error) {
          console.log(`❌ Tabla ${tabla}: ${error.message}`)
        } else {
          console.log(`✅ Tabla ${tabla}: Creada correctamente`)
        }
      } catch (e) {
        console.log(`❌ Tabla ${tabla}: ${e.message}`)
      }
    }
    
  } catch (error) {
    console.error('❌ Error general:', error)
    console.log('📋 Por favor, ejecuta manualmente el script en Supabase SQL Editor')
  }
}

crearTablas()
