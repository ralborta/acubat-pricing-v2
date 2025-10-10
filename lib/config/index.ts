import { ConfiguracionSistema } from '@/lib/types'
import { DEFAULT_CONFIG } from './defaults'
import { localConfig } from './local'
import { supabaseConfig } from './supabase'

export type ConfigSource = 'supabase' | 'local'

// Resolver según entorno: en server intentamos Supabase; en cliente usamos local como fallback
async function loadConfigPreferred(): Promise<ConfiguracionSistema> {
  if (typeof window === 'undefined') {
    const fromDb = await supabaseConfig.load()
    if (fromDb) return fromDb
    return DEFAULT_CONFIG
  }
  return localConfig.load()
}

export const config = {
  async load(): Promise<ConfiguracionSistema> {
    const cfg = await loadConfigPreferred()
    return ensureType(cfg)
  },
  async save(next: Partial<ConfiguracionSistema>, source: ConfigSource = (typeof window === 'undefined' ? 'supabase' : 'local')): Promise<ConfiguracionSistema> {
    const current = await this.load()
    const merged = ensureType({ ...current, ...next, ultimaActualizacion: new Date().toISOString() })
    if (source === 'supabase') {
      const saved = await supabaseConfig.save(merged)
      // además persistir en local como cache si hay ventana
      if (typeof window !== 'undefined') await localConfig.save(saved)
      return saved
    }
    return localConfig.save(merged)
  },
  async reset(source: ConfigSource = (typeof window === 'undefined' ? 'supabase' : 'local')): Promise<ConfiguracionSistema> {
    if (source === 'supabase') {
      await supabaseConfig.reset()
      if (typeof window !== 'undefined') await localConfig.reset()
      return DEFAULT_CONFIG
    }
    return localConfig.reset()
  }
}

function ensureType(config: any): ConfiguracionSistema {
  return {
    modo: config?.modo ?? 'produccion',
    iva: Number(config?.iva ?? 21),
    markups: {
      mayorista: Number(config?.markups?.mayorista ?? 22),
      directa: Number(config?.markups?.directa ?? 60),
      distribucion: Number(config?.markups?.distribucion ?? 20)
    },
    factoresVarta: {
      factorBase: Number(config?.factoresVarta?.factorBase ?? 40),
      capacidad80Ah: Number(config?.factoresVarta?.capacidad80Ah ?? 35)
    },
    promociones: Boolean(config?.promociones ?? false),
    comisiones: {
      mayorista: Number(config?.comisiones?.mayorista ?? 5),
      directa: Number(config?.comisiones?.directa ?? 8),
      distribucion: Number(config?.comisiones?.distribucion ?? 6)
    },
    descuentoProveedor: Number(config?.descuentoProveedor ?? 0),
    proveedores: config?.proveedores ?? {},
    ultimaActualizacion: config?.ultimaActualizacion ?? new Date().toISOString()
  }
}


