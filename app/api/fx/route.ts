import { NextResponse } from 'next/server'
import { getBlueRate } from '@/lib/fx'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const fx = await getBlueRate()
    if (!fx) {
      return NextResponse.json({ success: false, error: 'FX no disponible' }, { status: 502 })
    }
    return NextResponse.json({ success: true, fx })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'FX error' }, { status: 500 })
  }
}


