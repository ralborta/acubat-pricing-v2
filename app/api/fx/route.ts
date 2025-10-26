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
        return NextResponse.json({ success: false, error: 'FX no disponible', meta: meta || { error: 'No FX fetch attempted', ts: new Date().toISOString() } }, { status: 502 })
      }
      await saveFxCache(fx)
      return NextResponse.json({ success: true, ...fx, meta: { ...getFxMeta(), cached: true } })
    }
    await saveFxCache(fx)
    const meta = getFxMeta()
    return NextResponse.json({ success: true, ...fx, meta })
  } catch (e: any) {
    const meta = getFxMeta()
    return NextResponse.json({ success: false, error: e?.message || 'FX error', meta }, { status: 500 })
  }
}


