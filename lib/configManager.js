// ConfigManager para localStorage (compatible con Vercel)
class ConfigManager {
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
      ultimaActualizacion: new Date().toISOString()
    };
  }

  // Cargar configuración desde localStorage
  async loadConfig() {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('acubat-config');
        if (stored) {
          const config = JSON.parse(stored);
          console.log('✅ Configuración cargada desde localStorage');
          return config;
        }
      }
      
      console.log('📁 No hay configuración guardada, usando valores por defecto');
      return this.defaultConfig;
    } catch (error) {
      console.error('❌ Error cargando configuración:', error);
      return this.defaultConfig;
    }
  }

  // Guardar configuración en localStorage
  async saveConfig(config) {
    try {
      // Asegurar que promociones siempre esté desactivado
      const configToSave = {
        ...config,
        promociones: false,
        promocionesHabilitado: false,
        ultimaActualizacion: new Date().toISOString()
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem('acubat-config', JSON.stringify(configToSave));
        console.log('✅ Configuración guardada en localStorage');
      }
      
      return configToSave;
    } catch (error) {
      console.error('❌ Error guardando configuración:', error);
      throw error;
    }
  }

  // Resetear a configuración por defecto
  async resetConfig() {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('acubat-config');
        console.log('🔄 Configuración reseteada a valores por defecto');
      }
      
      return this.defaultConfig;
    } catch (error) {
      console.error('❌ Error reseteando configuración:', error);
      throw error;
    }
  }

  // Obtener configuración actual
  async getCurrentConfig() {
    return await this.loadConfig();
  }

  // Actualizar configuración específica
  async updateConfig(updates) {
    try {
      const currentConfig = await this.loadConfig();
      const updatedConfig = {
        ...currentConfig,
        ...updates
      };

      // Asegurar que promociones siempre esté desactivado
      updatedConfig.promociones = false;
      updatedConfig.promocionesHabilitado = false;

      return await this.saveConfig(updatedConfig);
    } catch (error) {
      console.error('❌ Error actualizando configuración:', error);
      throw error;
    }
  }

  // Validar configuración
  validateConfig(config) {
    const errors = [];

    // Validar IVA
    if (typeof config.iva !== 'number' || config.iva < 0 || config.iva > 100) {
      errors.push('IVA debe ser un número entre 0 y 100');
    }

    // Validar markups
    Object.entries(config.markups).forEach(([key, value]) => {
      if (typeof value !== 'number' || value < 0 || value > 1000) {
        errors.push(`Markup ${key} debe ser un número entre 0 y 1000`);
      }
    });

    // Validar factores Varta
    Object.entries(config.factoresVarta).forEach(([key, value]) => {
      if (typeof value !== 'number' || value < 0 || value > 100) {
        errors.push(`Factor Varta ${key} debe ser un número entre 0 y 100`);
      }
    });

    // Validar comisiones
    Object.entries(config.comisiones).forEach(([key, value]) => {
      if (typeof value !== 'number' || value < 0 || value > 100) {
        errors.push(`Comisión ${key} debe ser un número entre 0 y 100`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Instancia global del config manager
const configManager = new ConfigManager();

export default configManager;
