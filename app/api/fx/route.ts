import { NextResponse } from 'next/server'
import { getBlueRate, getFxMeta, saveFxCache, getFxCache } from '@/lib/fx'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    let fx = await getBlueRate()
    if (!fx) {
      // Fallback a caché persistida
      fx = await getFxCache()
      if (!fx) {
        const meta = getFxMeta()
        const url = new URL(req.url)
        const debug = url.searchParams.get('debug') === '1'
        return NextResponse.json({ success: false, error: 'FX no disponible', meta: debug ? meta : undefined }, { status: 502 })
      }
      return NextResponse.json({ success: true, fx, meta: { ...getFxMeta(), cached: true } })
    }
    await saveFxCache(fx)
    const meta = getFxMeta()
    return NextResponse.json({ success: true, fx, meta })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'FX error' }, { status: 500 })
  }
}


