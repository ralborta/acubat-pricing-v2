import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ 
    message: '🚀 AcuBat API funcionando correctamente!',
    timestamp: new Date().toISOString(),
    status: 'OK'
  })
}
