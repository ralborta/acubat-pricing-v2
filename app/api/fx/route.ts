import { NextResponse } from 'next/server'
import { getBlueRate, getFxMeta } from '@/lib/fx'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const fx = await getBlueRate()
    if (!fx) {
      const meta = getFxMeta()
      const url = new URL(req.url)
      const debug = url.searchParams.get('debug') === '1'
      return NextResponse.json({ success: false, error: 'FX no disponible', meta: debug ? meta : undefined }, { status: 502 })
    }
    const meta = getFxMeta()
    return NextResponse.json({ success: true, fx, meta })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'FX error' }, { status: 500 })
  }
}


