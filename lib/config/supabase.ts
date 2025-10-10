import { createClient } from '@supabase/supabase-js'
import { ConfiguracionSistema } from '@/lib/types'
import { DEFAULT_CONFIG } from './defaults'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Solo crear cliente si hay credenciales; en cliente nunca debe usarse service role
const supabase = (typeof window === 'undefined' && supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null

export const supabaseConfig = {
  async load(): Promise<ConfiguracionSistema> {
    if (!supabase) return DEFAULT_CONFIG
    const { data, error } = await supabase
      .from('config')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) return DEFAULT_CONFIG
    if (data && data.config_data) return data.config_data as ConfiguracionSistema
    return DEFAULT_CONFIG
  },
  async save(config: ConfiguracionSistema): Promise<ConfiguracionSistema> {
    if (!supabase) return DEFAULT_CONFIG
    const toSave = { ...config, ultimaActualizacion: new Date().toISOString() }
    // Upsert por id fijo 1 si existe, si no inserta
    const { data: existing } = await supabase
      .from('config')
      .select('id')
      .eq('id', 1)
      .maybeSingle()

    if (existing?.id) {
      await supabase
        .from('config')
        .update({ config_data: toSave, updated_at: new Date().toISOString() })
        .eq('id', 1)
    } else {
      await supabase
        .from('config')
        .insert({ id: 1, config_data: toSave, created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    }
    return toSave
  },
  async reset(): Promise<ConfiguracionSistema> {
    if (!supabase) return DEFAULT_CONFIG
    await supabase.from('config').delete().neq('id', 0)
    return DEFAULT_CONFIG
  }
}


