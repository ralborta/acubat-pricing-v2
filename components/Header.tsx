'use client'

import { Search, Bell, Settings, User, TrendingUp, DollarSign } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function Header() {
  const router = useRouter()
  const [fx, setFx] = useState<{ buy: number; sell: number; date: string; source?: string } | null>(null)
  const [loadingFx, setLoadingFx] = useState<boolean>(true)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('acubat_fx')
      if (raw) setFx(JSON.parse(raw))
    } catch {}
    // Fetch inicial desde API
    fetch(`/api/fx?ts=${Date.now()}`, { cache: 'no-store' }).then(r => r.json()).then(d => {
      if (d?.success && typeof d.sell !== 'undefined' && typeof d.buy !== 'undefined') {
        const fxData = { buy: Number(d.buy), sell: Number(d.sell), date: d.date, source: d.source }
        setFx(fxData)
        try { localStorage.setItem('acubat_fx', JSON.stringify(fxData)) } catch {}
      }
    }).catch(() => {}).finally(() => setLoadingFx(false))
    // Suscribirse a actualizaciones inmediatas
    const handler = () => {
      try {
        const raw = localStorage.getItem('acubat_fx')
        if (raw) setFx(JSON.parse(raw))
      } catch {}
    }
    window.addEventListener('acubat_fx_update', handler as any)
    // Intervalo cada 30 minutos
    const iv = setInterval(() => {
      fetch(`/api/fx?ts=${Date.now()}`, { cache: 'no-store' }).then(r => r.json()).then(d => {
        if (d?.success && typeof d.sell !== 'undefined' && typeof d.buy !== 'undefined') {
          const fxData = { buy: Number(d.buy), sell: Number(d.sell), date: d.date, source: d.source }
          setFx(fxData)
          try { localStorage.setItem('acubat_fx', JSON.stringify(fxData)) } catch {}
        }
      }).catch(() => {})
    }, 30 * 60 * 1000)
    return () => {
      window.removeEventListener('acubat_fx_update', handler as any)
      clearInterval(iv)
    }
  }, [])
  
  const currentDate = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Logo and Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-acubat-purple rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">A</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">AcuBat</h1>
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-600">Pricing Platform</p>
              <span className="text-xs text-blue-600 font-medium">v2.5.1</span>
              <span className="text-xs text-blue-600 font-medium">Empliados®</span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-2xl mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar productos, simulaciones..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-acubat-blue focus:border-transparent"
            />
          </div>
        </div>

        {/* Right Side Controls */}
        <div className="flex items-center gap-4">
          {/* FX Banner */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-md border bg-yellow-50 border-yellow-200 text-yellow-800">
            <DollarSign className="w-4 h-4" />
            {loadingFx ? (
              <span className="text-sm">Tipo de cambio: obteniendo…</span>
            ) : fx ? (
              <span className="text-sm">
                Tipo de cambio: Compra <strong>${fx.buy.toLocaleString('es-AR')}</strong> · Venta <strong>${fx.sell.toLocaleString('es-AR')}</strong>
                <span className="ml-2 text-xs text-yellow-700">{new Date(fx.date).toLocaleString()}</span>
              </span>
            ) : (
              <span className="text-sm">Tipo de cambio: sin datos</span>
            )}
            <button
              className="ml-2 text-xs underline hover:no-underline"
              onClick={() => {
                setLoadingFx(true)
                fetch(`/api/fx?ts=${Date.now()}`, { cache: 'no-store' }).then(r => r.json()).then(d => {
                  if (d?.success && typeof d.sell !== 'undefined' && typeof d.buy !== 'undefined') {
                    const fxData = { buy: Number(d.buy), sell: Number(d.sell), date: d.date, source: d.source }
                    setFx(fxData)
                    try { localStorage.setItem('acubat_fx', JSON.stringify(fxData)) } catch {}
                  }
                }).catch(() => {}).finally(() => setLoadingFx(false))
              }}
            >
              Reintentar
            </button>
          </div>
          {/* Date and Update Button */}
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              {currentDate}
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-acubat-blue text-white rounded-lg hover:bg-acubat-blue/90 transition-colors">
              <TrendingUp className="w-4 h-4" />
              <span>Actualizar</span>
            </button>
          </div>

          {/* Icons */}
          <div className="flex items-center gap-3">
            <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <button 
              onClick={() => router.push('/configuracion')}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
              <User className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
