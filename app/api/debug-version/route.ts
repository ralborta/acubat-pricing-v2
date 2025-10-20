import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    version: '2.0.0-multi-sheet-fix',
    timestamp: new Date().toISOString(),
    features: [
      'Multi-sheet processing',
      'Dynamic header detection', 
      'Aggressive validation',
      'Debug logging'
    ],
    debug: {
      multiSheetEnabled: true,
      aggressiveValidation: true,
      debugLogging: true
    }
  })
}
