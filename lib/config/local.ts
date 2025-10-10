import { ConfiguracionSistema } from '@/lib/types'
import { DEFAULT_CONFIG } from './defaults'

const STORAGE_KEY = 'acubat_config'

export const localConfig = {
  async load(): Promise<ConfiguracionSistema> {
    if (typeof window === 'undefined') return DEFAULT_CONFIG
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return DEFAULT_CONFIG
      return JSON.parse(stored)
    } catch {
      return DEFAULT_CONFIG
    }
  },
  async save(config: ConfiguracionSistema): Promise<ConfiguracionSistema> {
    const toSave = { ...config, ultimaActualizacion: new Date().toISOString() }
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
    }
    return toSave
  },
  async reset(): Promise<ConfiguracionSistema> {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
    }
    return DEFAULT_CONFIG
  }
}


