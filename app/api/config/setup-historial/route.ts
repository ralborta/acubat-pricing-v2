import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = (typeof window === 'undefined' && supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null

// POST - Crear tabla de historial si no existe
export async function POST(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({ 
        success: false, 
        error: 'Supabase no configurado' 
      }, { status: 500 })
    }

    // Verificar si la tabla ya existe
    const { data: existingTable, error: checkError } = await supabase
      .from('config_historial')
      .select('id')
      .limit(1)

    // Si la tabla existe, retornar éxito
    if (!checkError && existingTable !== null) {
      return NextResponse.json({ 
        success: true, 
        message: 'La tabla config_historial ya existe',
        alreadyExists: true
      })
    }

    // Si el error es que la tabla no existe, crearla usando RPC o SQL directo
    // Nota: En Supabase, necesitamos usar el SQL Editor o crear la tabla manualmente
    // Por ahora, retornamos instrucciones
    
    return NextResponse.json({ 
      success: false, 
      error: 'La tabla config_historial no existe. Por favor, ejecuta el script SQL en Supabase.',
      instructions: 'Ejecuta el contenido de supabase-config-historial.sql en el SQL Editor de Supabase'
    }, { status: 404 })

  } catch (error) {
    console.error('❌ Error verificando/creando tabla:', error)
    
    // Si el error es que la tabla no existe, dar instrucciones
    if (error instanceof Error && error.message.includes('could not find')) {
      return NextResponse.json({ 
        success: false, 
        error: 'La tabla config_historial no existe',
        instructions: 'Por favor, ejecuta el script SQL en Supabase SQL Editor. El archivo está en: supabase-config-historial.sql',
        sqlScript: `
-- Ejecuta este script en Supabase SQL Editor:

CREATE TABLE IF NOT EXISTS config_historial (
  id SERIAL PRIMARY KEY,
  config_data JSONB NOT NULL,
  version VARCHAR(255) NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_config_historial_created_at ON config_historial(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_config_historial_version ON config_historial(version);

ALTER TABLE config_historial ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura de historial" ON config_historial
  FOR SELECT USING (true);

CREATE POLICY "Permitir inserción de historial" ON config_historial
  FOR INSERT WITH CHECK (true);
        `
      }, { status: 404 })
    }
    
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

// GET - Verificar si la tabla existe
export async function GET() {
  try {
    if (!supabase) {
      return NextResponse.json({ 
        success: false, 
        exists: false,
        error: 'Supabase no configurado' 
      }, { status: 500 })
    }

    // Intentar hacer una consulta simple para verificar si la tabla existe
    const { data, error } = await supabase
      .from('config_historial')
      .select('id')
      .limit(1)

    if (error) {
      // Si el error es que la tabla no existe, retornar éxito con exists: false
      if (error.message.includes('could not find') || 
          error.message.includes('does not exist') ||
          error.code === 'PGRST116' ||
          error.code === '42P01') {
        return NextResponse.json({ 
          success: true, 
          exists: false,
          error: 'La tabla config_historial no existe',
          message: 'Por favor, ejecuta el script SQL en Supabase SQL Editor',
          sqlScript: `
-- Ejecuta este script en Supabase SQL Editor:

CREATE TABLE IF NOT EXISTS config_historial (
  id SERIAL PRIMARY KEY,
  config_data JSONB NOT NULL,
  version VARCHAR(255) NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_config_historial_created_at ON config_historial(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_config_historial_version ON config_historial(version);

ALTER TABLE config_historial ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura de historial" ON config_historial
  FOR SELECT USING (true);

CREATE POLICY "Permitir inserción de historial" ON config_historial
  FOR INSERT WITH CHECK (true);
          `
        })
      }
      // Para otros errores, lanzar excepción
      console.error('❌ Error verificando tabla:', error)
      throw error
    }

    return NextResponse.json({ 
      success: true, 
      exists: true,
      message: 'La tabla config_historial existe y está lista para usar'
    })
  } catch (error) {
    console.error('❌ Error verificando tabla:', error)
    // Retornar éxito pero indicar que no existe para evitar errores 500
    return NextResponse.json({ 
      success: true, 
      exists: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      message: 'No se pudo verificar la tabla. Por favor, verifica manualmente en Supabase.'
    })
  }
}

