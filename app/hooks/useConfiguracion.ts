'use client'

import { useState, useEffect } from 'react';
import configManager from '../../lib/configManagerLocal';
import { ConfiguracionSistema, ApiResponse } from '../../lib/types';

// Función helper para asegurar que la configuración tenga el tipo correcto
const ensureConfigType = (config: any): ConfiguracionSistema => {
  return {
    modo: config.modo || 'produccion',
    iva: config.iva || 21,
    markups: {
      mayorista: config.markups?.mayorista || 22,
      directa: config.markups?.directa || 60,
      distribucion: config.markups?.distribucion || 20
    },
    factoresVarta: {
      factorBase: config.factoresVarta?.factorBase || 40,
      capacidad80Ah: config.factoresVarta?.capacidad80Ah || 35
    },
    promociones: config.promociones || false,
    comisiones: {
      mayorista: config.comisiones?.mayorista || 5,
      directa: config.comisiones?.directa || 8,
      distribucion: config.comisiones?.distribucion || 6
    },
    descuentoProveedor: config.descuentoProveedor || 0, // ✅ Nuevo: % Descuento de proveedor (default: 0)
    ultimaActualizacion: config.ultimaActualizacion || new Date().toISOString()
  };
};

export function useConfiguracion() {
  const [configuracion, setConfiguracion] = useState<ConfiguracionSistema | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar configuración inicial
  useEffect(() => {
    cargarConfiguracion();
  }, []);

  const cargarConfiguracion = async () => {
    try {
      setLoading(true);
      
      // 🚀 PRIMERO: Intentar cargar desde Supabase
      try {
        console.log('🔍 Cargando configuración desde Supabase...');
        const response = await fetch('/api/init-config');
        
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            const configTyped = ensureConfigType(result.data.config_data);
            setConfiguracion(configTyped);
            setError(null);
            console.log('✅ Configuración cargada desde Supabase:', configTyped);
            return;
          }
        }
      } catch (supabaseError) {
        console.warn('⚠️ Error cargando desde Supabase, usando localStorage:', supabaseError);
      }
      
      // 🔄 SEGUNDO: Fallback a localStorage
      console.log('🔍 Cargando configuración desde localStorage...');
      const config = await configManager.getCurrentConfig();
      const configTyped = ensureConfigType(config);
      setConfiguracion(configTyped);
      setError(null);
      console.log('✅ Configuración cargada desde localStorage:', configTyped);
    } catch (err) {
      setError('Error al cargar configuración');
      console.error('❌ Error cargando configuración:', err);
    } finally {
      setLoading(false);
    }
  };

  // Guardar nueva configuración
  const guardarConfiguracion = async (nuevaConfig: Partial<ConfiguracionSistema>): Promise<ApiResponse<ConfiguracionSistema>> => {
    try {
      setLoading(true);
      
      // Crear configuración completa
      const configCompleta = {
        ...configuracion,
        ...nuevaConfig,
        ultimaActualizacion: new Date().toISOString()
      };
      
      // 🚀 PRIMERO: Guardar en Supabase (base de datos)
      try {
        console.log('💾 Guardando configuración en Supabase...');
        const response = await fetch('/api/update-config', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(configCompleta)
        });
        
        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('✅ Configuración guardada en Supabase:', result);
      } catch (supabaseError) {
        console.warn('⚠️ Error guardando en Supabase, continuando con localStorage:', supabaseError);
      }
      
      // 🔄 SEGUNDO: Guardar en localStorage como respaldo
      const configGuardada = await configManager.saveConfig(configCompleta);
      const configTyped = ensureConfigType(configGuardada);
      setConfiguracion(configTyped);
      setError(null);
      
      // Notificar a otros componentes que la configuración cambió
      window.dispatchEvent(new CustomEvent('configuracionCambiada', { 
        detail: configTyped 
      }));
      
      console.log('✅ Configuración guardada en localStorage:', configTyped);
      return { success: true, data: configTyped };
    } catch (err) {
      const errorMsg = 'Error al guardar configuración';
      setError(errorMsg);
      console.error('❌ Error guardando configuración:', err);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // Resetear a configuración por defecto
  const resetearConfiguracion = async (): Promise<ApiResponse<ConfiguracionSistema>> => {
    try {
      setLoading(true);
      const configReset = await configManager.resetConfig();
      // Asegurar que el tipo sea correcto
      const configTyped = ensureConfigType(configReset);
      setConfiguracion(configTyped);
      setError(null);
      
      // Notificar cambio
      window.dispatchEvent(new CustomEvent('configuracionCambiada', { 
        detail: configTyped 
      }));
      
      return { success: true, data: configTyped };
    } catch (err) {
      const errorMsg = 'Error al resetear configuración';
      setError(errorMsg);
      console.error('❌ Error reseteando configuración:', err);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  // Escuchar cambios de configuración desde otros componentes
  useEffect(() => {
    const handleConfiguracionCambiada = (event: CustomEvent) => {
      setConfiguracion(event.detail);
    };

    window.addEventListener('configuracionCambiada', handleConfiguracionCambiada as EventListener);
    
    return () => {
      window.removeEventListener('configuracionCambiada', handleConfiguracionCambiada as EventListener);
    };
  }, []);

  return {
    configuracion,
    loading,
    error,
    guardarConfiguracion,
    resetearConfiguracion,
    cargarConfiguracion
  };
}
