// ConfigManager para Supabase (servidor)
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

class ConfigManagerSupabase {
  constructor() {
    this.defaultConfig = {
      modo: 'produccion',
      iva: 21,
      markups: {
        mayorista: 22,
        directa: 60,
        distribucion: 20
      },
      factoresVarta: {
        factorBase: 40,
        capacidad80Ah: 35
      },
      promociones: false,
      promocionesHabilitado: false,
      comisiones: {
        mayorista: 5,
        directa: 8,
        distribucion: 6
      },
      descuentoProveedor: 0, // ✅ Nuevo: % Descuento de proveedor (default: 0)
      // ✅ Overrides por proveedor
      proveedores: {},
      ultimaActualizacion: new Date().toISOString()
    };
  }

  // Cargar configuración desde Supabase
  async loadConfig() {
    try {
      console.log('🔍 Cargando configuración desde Supabase...');
      console.log('🔗 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
      console.log('🔑 Service Role Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Presente' : 'Ausente');
      
      const { data, error } = await supabase
        .from('config')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      console.log('📊 Respuesta de Supabase:');
      console.log('   - Data:', data);
      console.log('   - Error:', error);

      if (error) {
        console.error('❌ Error cargando configuración:', error);
        console.log('🔄 Usando configuración por defecto');
        return this.defaultConfig;
      }

      if (data && data.config_data) {
        console.log('✅ CONFIGURACIÓN CARGADA DESDE SUPABASE:');
        console.log('   - IVA:', data.config_data.iva + '%');
        console.log('   - Markup Minorista:', data.config_data.markups?.directa + '%');
        console.log('   - Markup Mayorista:', data.config_data.markups?.mayorista + '%');
        console.log('   - Markup Distribución:', data.config_data.markups?.distribucion + '%');
        console.log('   - Promociones:', data.config_data.promociones ? 'Activas' : 'Inactivas');
        console.log('   - Última actualización:', data.config_data.ultimaActualizacion);
        return data.config_data;
      }

      console.log('⚠️ No hay configuración en Supabase, usando valores por defecto');
      console.log('🔧 Configuración por defecto:', this.defaultConfig);
      return this.defaultConfig;
    } catch (error) {
      console.error('❌ Error en loadConfig:', error);
      console.log('🔄 Usando configuración por defecto debido al error');
      return this.defaultConfig;
    }
  }

  // Guardar configuración en Supabase
  async saveConfig(config) {
    try {
      console.log('💾 Guardando configuración en Supabase...');
      
      const configToSave = {
        ...config,
        ultimaActualizacion: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('config')
        .insert({
          config_data: configToSave,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('❌ Error guardando configuración:', error);
        throw error;
      }

      console.log('✅ Configuración guardada en Supabase');
      return configToSave;
    } catch (error) {
      console.error('❌ Error en saveConfig:', error);
      throw error;
    }
  }

  // Obtener configuración actual
  async getCurrentConfig() {
    return await this.loadConfig();
  }

  // Resetear configuración
  async resetConfig() {
    try {
      console.log('🔄 Reseteando configuración en Supabase...');
      
      const { error } = await supabase
        .from('config')
        .delete()
        .neq('id', 0); // Eliminar todas las configuraciones

      if (error) {
        console.error('❌ Error reseteando configuración:', error);
        throw error;
      }

      console.log('✅ Configuración reseteada en Supabase');
      return this.defaultConfig;
    } catch (error) {
      console.error('❌ Error en resetConfig:', error);
      throw error;
    }
  }
}

export default ConfigManagerSupabase;
