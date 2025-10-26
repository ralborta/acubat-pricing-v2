import { createClient } from '@supabase/supabase-js'
export interface FxInfo {
  pair?: string
  buy: number
  sell: number
  date: string
  source?: string
}

type CacheEntry = { fx: FxInfo | null; ts: number }
export interface FxMeta {
  url: string
  ok: boolean
  status?: number
  error?: string
  ts: string
}

const FX_URL = process.env.FX_URL
const FX_TIMEOUT_MS = Number(process.env.FX_TIMEOUT_MS || 5000)
const FX_CACHE_TTL_MS = Number(process.env.FX_CACHE_TTL_MS || 10 * 60 * 1000) // 10 min

let fxCache: CacheEntry | null = null
let lastFxMeta: FxMeta | null = null

// Opcional: persistencia en Supabase como fallback
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = (typeof window === 'undefined' && supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null
const FX_TABLE = 'fx_cache'

export async function getBlueRate(): Promise<FxInfo | null> {
  const now = Date.now()
  if (fxCache && now - fxCache.ts < FX_CACHE_TTL_MS) {
    return fxCache.fx
  }

  if (!FX_URL) {
    lastFxMeta = { url: '', ok: false, error: 'FX_URL not configured', ts: new Date().toISOString() }
    return null
  }

  const safeUrl = FX_URL // TS ya validó que no es undefined
  
  async function fetchOnce(): Promise<FxInfo | null> {
    const controller = new AbortController()
    const to = setTimeout(() => controller.abort(), FX_TIMEOUT_MS)
    try {
      const res = await fetch(safeUrl, { signal: controller.signal })
      clearTimeout(to)
      if (!res.ok) {
        lastFxMeta = { url: safeUrl, ok: false, status: res.status, ts: new Date().toISOString() }
        throw new Error(`FX HTTP ${res.status}`)
      }
      const data = await res.json()
      const fx: FxInfo = {
        pair: data.pair || 'USDARS_BLUE',
        buy: Number(data.buy || data.compra || 0),
        sell: Number(data.sell || data.venta || 0),
        date: String(data.date || data.fecha || new Date().toISOString()),
        source: String(data.source || 'Dólar Blue')
      }
      lastFxMeta = { url: safeUrl, ok: true, status: 200, ts: new Date().toISOString() }
      return fx
    } catch (e) {
      clearTimeout(to)
      lastFxMeta = { url: safeUrl, ok: false, error: (e as any)?.message || 'unknown', ts: new Date().toISOString() }
      return null
    }
  }

  // Un intento + un reintento si falla
  let fx = await fetchOnce()
  if (!fx) fx = await fetchOnce()
  if (fx) {
    fxCache = { fx, ts: now }
  }
  return fx
}

export function getFxMeta(): FxMeta | null {
  return lastFxMeta
}

export async function saveFxCache(fx: FxInfo): Promise<void> {
  if (!supabase) return
  try {
    await supabase
      .from(FX_TABLE)
      .upsert({
        id: 1,
        pair: fx.pair || 'USDARS_BLUE',
        buy: fx.buy,
        sell: fx.sell,
        date: fx.date,
        source: fx.source || 'Dólar Blue',
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })
  } catch {}
}

export async function getFxCache(): Promise<FxInfo | null> {
  if (!supabase) return null
  try {
    const { data, error } = await supabase
      .from(FX_TABLE)
      .select('pair,buy,sell,date,source')
      .eq('id', 1)
      .maybeSingle()
    if (error) return null
    if (data && typeof data.sell !== 'undefined' && typeof data.buy !== 'undefined') {
      return {
        pair: data.pair || 'USDARS_BLUE',
        buy: Number(data.buy),
        sell: Number(data.sell),
        date: String(data.date || new Date().toISOString()),
        source: String(data.source || 'Dólar Blue')
      }
    }
    return null
  } catch {
    return null
  }
}


