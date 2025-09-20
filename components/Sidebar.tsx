'use client'

import {
  Grid3X3,
  Upload,
  Phone,
  MessageSquare,
  BarChart3,
  Settings,
  FileText,
  HelpCircle,
  ChevronDown,
  Bell,
  Search,
  Building2
} from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const menuItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Grid3X3,
    description: 'Vista general del call center',
    active: true
  },
  {
    id: 'carga',
    label: 'Carga de Archivos',
    icon: Upload,
    description: 'Subir archivos Excel'
  },
  {
    id: 'conciliacion',
    label: 'Conciliación Bancaria',
    icon: Building2,
    description: 'Sistema de conciliación secuencial'
  },
  {
    id: 'simulaciones',
    label: 'Simulaciones',
    icon: Phone,
    description: 'Ejecutar simulaciones de pricing'
  },
  {
    id: 'rulesets',
    label: 'Rulesets',
    icon: MessageSquare,
    description: 'Gestionar reglas de pricing'
  },
  {
    id: 'publicaciones',
    label: 'Publicaciones',
    icon: BarChart3,
    description: 'Publicar resultados'
  },
  {
    id: 'configuracion',
    label: 'Configuración',
    icon: Settings,
    description: 'Configurar sistema'
  },
  {
    id: 'pdf-to-excel',
    label: 'PDF a Excel',
    icon: FileText,
    description: 'Convertir PDF a Excel'
  },
  {
    id: 'reportes',
    label: 'Reportes',
    icon: BarChart3,
    description: 'Generar reportes'
  },
  {
    id: 'ayuda',
    label: 'Ayuda',
    icon: HelpCircle,
    description: 'Centro de ayuda'
  }
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [activeItem, setActiveItem] = useState('dashboard')
  const router = useRouter()

  return (
    <div className={`bg-gray-100 h-screen flex flex-col transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}>
      {/* User Profile Section */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-semibold">
            A
          </div>
          {!collapsed && (
            <div className="flex-1">
              <div className="font-semibold text-gray-900">Administrador</div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>admin@acubat.com</span>
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <Bell className="w-4 h-4" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Search Bar */}
      {!collapsed && (
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-2 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = activeItem === item.id
          
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveItem(item.id)
                // Navegar a la página correspondiente
                if (item.id === 'dashboard') {
                  router.push('/')
                } else {
                  router.push(`/${item.id}`)
                }
              }}
              className={`
                w-full text-left p-3 rounded-lg transition-all duration-200 flex items-center gap-3
                ${isActive 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                }
                ${collapsed ? 'justify-center' : ''}
              `}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && (
                <div className="flex-1">
                  <div className="font-medium">{item.label}</div>
                  <div className={`text-xs ${isActive ? 'text-blue-100' : 'text-gray-500'}`}>
                    {item.description}
                  </div>
                </div>
              )}
            </button>
          )
        })}
      </nav>

      {/* Collapse Button */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full p-3 rounded-lg text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors duration-200 flex items-center gap-3 justify-center"
        >
          <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${collapsed ? 'rotate-90' : '-rotate-90'}`} />
          {!collapsed && <span>Colapsar</span>}
        </button>
      </div>
    </div>
  )
}
