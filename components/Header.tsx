'use client'

import { Search, Bell, Settings, User, TrendingUp } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function Header() {
  const router = useRouter()
  
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
