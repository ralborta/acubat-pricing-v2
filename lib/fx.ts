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

const FX_URL = process.env.FX_URL || 'https://tu-app.railway.app/rates/blue'
const FX_TIMEOUT_MS = Number(process.env.FX_TIMEOUT_MS || 1500)
const FX_CACHE_TTL_MS = Number(process.env.FX_CACHE_TTL_MS || 10 * 60 * 1000) // 10 min

let fxCache: CacheEntry | null = null
let lastFxMeta: FxMeta | null = null

export async function getBlueRate(): Promise<FxInfo | null> {
  const now = Date.now()
  if (fxCache && now - fxCache.ts < FX_CACHE_TTL_MS) {
    return fxCache.fx
  }

  async function fetchOnce(): Promise<FxInfo | null> {
    const controller = new AbortController()
    const to = setTimeout(() => controller.abort(), FX_TIMEOUT_MS)
    try {
      const res = await fetch(FX_URL, { signal: controller.signal })
      clearTimeout(to)
      if (!res.ok) {
        lastFxMeta = { url: FX_URL, ok: false, status: res.status, ts: new Date().toISOString() }
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
      lastFxMeta = { url: FX_URL, ok: true, status: 200, ts: new Date().toISOString() }
      return fx
    } catch (e) {
      clearTimeout(to)
      lastFxMeta = { url: FX_URL, ok: false, error: (e as any)?.message || 'unknown', ts: new Date().toISOString() }
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


