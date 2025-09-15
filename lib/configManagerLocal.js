// ConfigManager para localStorage (compatible con Railway)
class ConfigManagerLocal {
  constructor() {
    this.storageKey = 'acubat_config';
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
      comisiones: {
        mayorista: 5,
        directa: 8,
        distribucion: 6
      },
      descuentoProveedor: 0, // ✅ Nuevo: % Descuento de proveedor (default: 0)
      ultimaActualizacion: new Date().toISOString()
    };
  }

  // Cargar configuración desde localStorage
  async loadConfig() {
    try {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
          const config = JSON.parse(stored);
          console.log('✅ Configuración cargada desde localStorage');
          return config;
        }
      }
      
      console.log('📝 Usando configuración por defecto');
      return this.defaultConfig;
    } catch (error) {
      console.error('❌ Error cargando configuración:', error);
      return this.defaultConfig;
    }
  }

  // Guardar configuración en localStorage
  async saveConfig(config) {
    try {
      const configToSave = {
        ...config,
        ultimaActualizacion: new Date().toISOString()
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem(this.storageKey, JSON.stringify(configToSave));
        console.log('✅ Configuración guardada en localStorage');
      }
      
      return configToSave;
    } catch (error) {
      console.error('❌ Error guardando configuración:', error);
      throw error;
    }
  }

  // Obtener configuración actual
  async getCurrentConfig() {
    return await this.loadConfig();
  }

  // Resetear a configuración por defecto
  async resetConfig() {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(this.storageKey);
        console.log('🔄 Configuración reseteada a valores por defecto');
      }
      return this.defaultConfig;
    } catch (error) {
      console.error('❌ Error reseteando configuración:', error);
      throw error;
    }
  }

  // Actualizar configuración específica
  async updateConfig(updates) {
    try {
      const currentConfig = await this.getCurrentConfig();
      const newConfig = {
        ...currentConfig,
        ...updates,
        ultimaActualizacion: new Date().toISOString()
      };
      
      return await this.saveConfig(newConfig);
    } catch (error) {
      console.error('❌ Error actualizando configuración:', error);
      throw error;
    }
  }

  // Obtener configuración específica
  async getConfigValue(key) {
    try {
      const config = await this.getCurrentConfig();
      return config[key];
    } catch (error) {
      console.error(`❌ Error obteniendo configuración ${key}:`, error);
      return null;
    }
  }

  // Verificar si la configuración existe
  async configExists() {
    try {
      if (typeof window !== 'undefined') {
        return localStorage.getItem(this.storageKey) !== null;
      }
      return false;
    } catch (error) {
      console.error('❌ Error verificando configuración:', error);
      return false;
    }
  }

  // Validar configuración
  validateConfig(config) {
    try {
      const errors = [];
      
      // Validar IVA
      if (typeof config.iva !== 'number' || config.iva < 0 || config.iva > 100) {
        errors.push('IVA debe ser un número entre 0 y 100');
      }
      
      // Validar markups
      if (config.markups) {
        const markups = config.markups;
        if (typeof markups.mayorista !== 'number' || markups.mayorista < 0) {
          errors.push('Markup mayorista debe ser un número positivo');
        }
        if (typeof markups.directa !== 'number' || markups.directa < 0) {
          errors.push('Markup directa debe ser un número positivo');
        }
        if (typeof markups.distribucion !== 'number' || markups.distribucion < 0) {
          errors.push('Markup distribución debe ser un número positivo');
        }
      }
      
      // Validar comisiones
      if (config.comisiones) {
        const comisiones = config.comisiones;
        if (typeof comisiones.mayorista !== 'number' || comisiones.mayorista < 0 || comisiones.mayorista > 100) {
          errors.push('Comisión mayorista debe ser un número entre 0 y 100');
        }
        if (typeof comisiones.directa !== 'number' || comisiones.directa < 0 || comisiones.directa > 100) {
          errors.push('Comisión directa debe ser un número entre 0 y 100');
        }
        if (typeof comisiones.distribucion !== 'number' || comisiones.distribucion < 0 || comisiones.distribucion > 100) {
          errors.push('Comisión distribución debe ser un número entre 0 y 100');
        }
      }
      
      return {
        isValid: errors.length === 0,
        errors: errors
      };
    } catch (error) {
      console.error('❌ Error validando configuración:', error);
      return {
        isValid: false,
        errors: ['Error interno de validación']
      };
    }
  }
}

// Instancia global del configManager
const configManager = new ConfigManagerLocal();

module.exports = configManager;
