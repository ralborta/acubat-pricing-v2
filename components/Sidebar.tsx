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
    id: 'historial',
    label: 'Historial',
    icon: FileText,
    description: 'Ver sesiones de pricing'
  },
  {
    id: 'reportes',
    label: 'Reportes',
    icon: BarChart3,
    description: 'Análisis y reportes de pricing',
    hasSubmenu: true,
    submenu: [
      { id: 'reportes', label: 'Dashboard de Reportes', description: 'Vista general de reportes' },
      { id: 'reportes/rentabilidad', label: 'Análisis de Rentabilidad', description: 'Análisis de rentabilidad por producto' },
      { id: 'reportes/comparativo', label: 'Comparativo de Sesiones', description: 'Comparar sesiones de pricing' },
      { id: 'reportes/proveedor', label: 'Análisis por Proveedor', description: 'Análisis detallado por proveedor' },
      { id: 'reportes/temporal', label: 'Tendencias Temporales', description: 'Análisis de tendencias en el tiempo' },
      { id: 'reportes/financiero', label: 'Reporte Financiero', description: 'Análisis financiero completo' },
      { id: 'reportes/alertas', label: 'Centro de Alertas', description: 'Productos que requieren atención' }
    ]
  },
  {
    id: 'simulaciones',
    label: 'Simulaciones',
    icon: Phone,
    description: 'Ejecutar simulaciones de pricing'
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
    id: 'ayuda',
    label: 'Ayuda',
    icon: HelpCircle,
    description: 'Centro de ayuda'
  }
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [activeItem, setActiveItem] = useState('dashboard')
  const [expandedMenus, setExpandedMenus] = useState<string[]>([])
  const router = useRouter()

  const toggleSubmenu = (menuId: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuId) 
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    )
  }

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
                <span>acubat</span>
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
          const hasSubmenu = item.hasSubmenu && item.submenu
          const isExpanded = expandedMenus.includes(item.id)
          
          return (
            <div key={item.id}>
              <button
                onClick={() => {
                  if (hasSubmenu) {
                    toggleSubmenu(item.id)
                  } else {
                    setActiveItem(item.id)
                    // Navegar a la página correspondiente
                    if (item.id === 'dashboard') {
                      router.push('/')
                    } else {
                      router.push(`/${item.id}`)
                    }
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
                  <div className="flex-1 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{item.label}</div>
                      <div className={`text-xs ${isActive ? 'text-blue-100' : 'text-gray-500'}`}>
                        {item.description}
                      </div>
                    </div>
                    {hasSubmenu && (
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                    )}
                  </div>
                )}
              </button>
              
              {/* Submenu */}
              {hasSubmenu && isExpanded && !collapsed && (
                <div className="ml-4 mt-1 space-y-1">
                  {item.submenu?.map((subItem) => (
                    <button
                      key={subItem.id}
                      onClick={() => {
                        setActiveItem(subItem.id)
                        router.push(`/${subItem.id}`)
                      }}
                      className={`
                        w-full text-left p-2 rounded-lg transition-all duration-200 flex items-center gap-3
                        ${activeItem === subItem.id 
                          ? 'bg-blue-100 text-blue-700 font-medium' 
                          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        }
                      `}
                    >
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <div>
                        <div className="font-medium text-sm">{subItem.label}</div>
                        <div className={`text-xs ${activeItem === subItem.id ? 'text-blue-600' : 'text-gray-500'}`}>
                          {subItem.description}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={() => {
            if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
              // Limpiar localStorage y redirigir a login
              localStorage.clear()
              window.location.href = '/login'
            }
          }}
          className="w-full p-3 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors duration-200 flex items-center gap-3 justify-center mb-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {!collapsed && <span>Cerrar Sesión</span>}
        </button>
      </div>

      {/* Collapse Button */}
      <div className="px-4 pb-4">
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
