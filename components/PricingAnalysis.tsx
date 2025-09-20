'use client'

import { useState } from 'react'
import { formatCurrency, formatNumber, formatPercentage } from '../lib/formatters'
import { 
  DollarSign, 
  TrendingUp, 
  ShoppingCart, 
  Store, 
  Truck, 
  Globe, 
  BarChart3,
  Download,
  Eye,
  Filter,
  Search,
  Zap
} from 'lucide-react'

interface ProductPricing {
  id: string
  sku: string
  name: string
  category: string
  cost: number
  listPrice: number
  markup: number
  margin: number
  channels: {
    online: number
    retail: number
    wholesale: number
    distributor: number
  }
  profitability: 'high' | 'medium' | 'low'
  recommendations: string[]
}

// Interfaz para datos del backend
interface BackendProduct {
  sku: string
  nombre: string
  marca: string
  canal: string
  costo: number
  precio_base: number
  markup_aplicado: number
  precio_redondeado: number
  margen: number
  rentabilidad: string
  precios_canales: {
    Retail?: number
    Mayorista?: number
    Online?: number
    Distribuidor?: number
  }
}

interface PricingAnalysisProps {
  isVisible: boolean
  onClose: () => void
  fileName: string
  productos?: any[] // Datos reales del backend
}

export default function PricingAnalysis({ isVisible, onClose, fileName, productos }: PricingAnalysisProps) {
  const [selectedProduct, setSelectedProduct] = useState<ProductPricing | null>(null)
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'markup' | 'margin' | 'profitability'>('name')

  // Función para convertir datos del backend al formato esperado
  const convertBackendData = (backendProducts: BackendProduct[]): ProductPricing[] => {
    return backendProducts.map((p, index) => ({
      id: (index + 1).toString(),
      sku: p.sku || `SKU-${index + 1}`,
      name: p.nombre,
      category: p.marca,
      cost: p.costo,
      listPrice: p.precio_redondeado,
      markup: p.markup_aplicado,
      margin: p.margen,
      channels: {
        online: p.precios_canales.Online || 0,
        retail: p.precios_canales.Retail || 0,
        wholesale: p.precios_canales.Mayorista || 0,
        distributor: p.precios_canales.Distribuidor || 0
      },
      profitability: p.rentabilidad === 'RENTABLE' ? 'high' : p.margen > 30 ? 'medium' : 'low',
      recommendations: generateRecommendations(p)
    }))
  }

  // Función para generar recomendaciones basadas en datos reales
  const generateRecommendations = (product: BackendProduct): string[] => {
    const recommendations = []
    
    if (product.rentabilidad === 'NO RENTABLE') {
      recommendations.push('Margen bajo, considerar aumentar precio')
      recommendations.push('Revisar estrategia de pricing para este canal')
    } else {
      recommendations.push('Margen saludable, mantener precios actuales')
    }
    
    if (product.margen < 30) {
      recommendations.push('Evaluar competencia en el mercado')
    }
    
    if (product.margen > 80) {
      recommendations.push('Excelente rentabilidad, considerar expansión')
    }
    
    return recommendations.length > 0 ? recommendations : ['Análisis completo realizado']
  }

  // Usar productos del backend si están disponibles, sino usar datos de ejemplo
  const [products] = useState<ProductPricing[]>(() => {
    // Si tenemos productos del backend, los convertimos al formato esperado
    if (productos && productos.length > 0) {
      return convertBackendData(productos)
    }
    
    // Datos de ejemplo si no hay productos del backend
    return [
      {
        id: '1',
        sku: 'PROD-001',
        name: 'Batería Varta 60Ah',
        category: 'Varta',
        cost: 15000,
        listPrice: 27000,
        markup: 1.8,
        margin: 80,
        channels: {
          online: 30000,
          retail: 27000,
          wholesale: 22500,
          distributor: 21000
        },
        profitability: 'high',
        recommendations: [
          'Excelente margen, mantener precios',
          'Considerar expansión a otros canales'
        ]
      },
      {
        id: '2',
        sku: 'PROD-002',
        name: 'Batería Varta 100Ah',
        category: 'Varta',
        cost: 25000,
        listPrice: 37500,
        markup: 1.5,
        margin: 50,
        channels: {
          online: 50000,
          retail: 45000,
          wholesale: 37500,
          distributor: 35000
        },
        profitability: 'high',
        recommendations: [
          'Margen saludable, precios óptimos',
          'Promocionar en canales mayoristas'
        ]
      }
    ]
  })

  const filteredProducts = products
    .filter(product => 
      filterCategory === 'all' || product.category === filterCategory
    )
    .filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name)
        case 'markup': return b.markup - a.markup
        case 'margin': return b.margin - a.margin
        case 'profitability': return a.profitability.localeCompare(b.profitability)
        default: return 0
      }
    })

  const getProfitabilityColor = (profitability: string) => {
    switch (profitability) {
      case 'high': return 'text-green-600 bg-green-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getProfitabilityLabel = (profitability: string) => {
    switch (profitability) {
      case 'high': return 'Alta'
      case 'medium': return 'Media'
      case 'low': return 'Baja'
      default: return 'N/A'
    }
  }

  const downloadAnalysis = () => {
    const content = `Análisis de Precios - ${fileName}\n\n${filteredProducts.map(p => 
      `${p.sku} | ${p.name} | Costo: $${p.cost} | Precio: $${p.listPrice} | Markup: ${p.markup}% | Margen: ${p.margin}%`
    ).join('\n')}`
    
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analisis_precios_${fileName}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] overflow-hidden">
        {/* Header Mejorado */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <BarChart3 className="h-8 w-8 mr-3 text-blue-600" />
              Análisis Completo de Precios
            </h2>
            <p className="text-gray-600">Archivo: {fileName}</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={downloadAnalysis}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Contenido */}
        <div className="flex h-[calc(90vh-80px)]">
          {/* Lista de Productos */}
          <div className="w-2/3 border-r border-gray-200 overflow-y-auto">
            {/* Filtros y Búsqueda Mejorados */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="Buscar productos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">Todas las categorías</option>
                    <option value="Varta">Varta</option>
                    <option value="Otros">Otras marcas</option>
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Ordenar por:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="name">Nombre</option>
                    <option value="markup">Markup</option>
                    <option value="margin">Margen</option>
                    <option value="profitability">Rentabilidad</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Tabla de Productos Mejorada */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                      PRODUCTO
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                      TIPO
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                      MODELO
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                      PRECIO BASE
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                      CANAL
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                      PRECIO CANAL
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                      MARGEN ADICIONAL
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                      PRECIO NETO
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                      MARKUP %
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                      MARGEN %
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProducts.map((product) => (
                    <>
                      {/* Fila Minorista */}
                      <tr 
                        key={`${product.id}-retail`}
                        className={`hover:bg-blue-50 cursor-pointer transition-colors ${
                          selectedProduct?.id === product.id ? 'bg-blue-100' : ''
                        }`}
                        onClick={() => setSelectedProduct(product)}
                      >
                        <td className="px-4 py-3 whitespace-nowrap bg-gray-50">
                          <div className="text-sm font-semibold text-gray-900">{product.sku}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap bg-gray-50">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <Zap className="h-3 w-3 mr-1" />
                            Batería
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap bg-gray-50">
                          <div className="text-sm font-medium text-gray-900">{product.sku}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap bg-gray-50">
                          <div className="text-sm font-semibold text-gray-900">
                            {formatCurrency(product.cost)}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Minorista
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(product.channels.retail)}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatCurrency(product.channels.retail - product.cost)}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            {formatCurrency(product.channels.retail)}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-semibold text-blue-600">
                            +{product.markup}%
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-semibold text-blue-600">
                            {formatPercentage(product.margin)}
                          </div>
                        </td>
                      </tr>
                      
                      {/* Fila Mayorista */}
                      <tr 
                        key={`${product.id}-wholesale`}
                        className={`hover:bg-green-50 cursor-pointer transition-colors ${
                          selectedProduct?.id === product.id ? 'bg-green-100' : ''
                        }`}
                        onClick={() => setSelectedProduct(product)}
                      >
                        <td className="px-4 py-3 whitespace-nowrap bg-gray-50">
                          <div className="text-sm font-semibold text-gray-900">{product.sku}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap bg-gray-50">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <Zap className="h-3 w-3 mr-1" />
                            Batería
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap bg-gray-50">
                          <div className="text-sm font-medium text-gray-900">{product.sku}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap bg-gray-50">
                          <div className="text-sm font-semibold text-gray-900">
                            {formatCurrency(product.cost)}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Mayorista
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatCurrency(product.channels.wholesale)}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatCurrency(product.channels.wholesale - product.cost)}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            {formatCurrency(product.channels.wholesale)}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-semibold text-green-600">
                            +{(product.channels.wholesale / product.cost - 1) * 100}%
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm font-semibold text-green-600">
                            {formatPercentage((product.channels.wholesale - product.cost) / product.channels.wholesale * 100)}
                          </div>
                        </td>
                      </tr>
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Detalle del Producto Mejorado */}
          <div className="w-1/3 overflow-y-auto bg-gray-50">
            {selectedProduct ? (
              <div className="p-6">
                {/* Información del Producto */}
                <div className="mb-6 bg-white rounded-lg p-4 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <Zap className="h-5 w-5 mr-2 text-blue-600" />
                    {selectedProduct.name}
                  </h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span className="font-medium">SKU:</span> 
                      <span className="text-gray-900">{selectedProduct.sku}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Categoría:</span> 
                      <span className="text-gray-900">{selectedProduct.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Costo:</span> 
                      <span className="text-gray-900">${selectedProduct.cost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Precio de Lista:</span> 
                      <span className="text-gray-900">${selectedProduct.listPrice.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Análisis de Pricing */}
                <div className="mb-6 bg-white rounded-lg p-4 shadow-sm">
                  <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2 text-blue-600" />
                    Análisis de Pricing
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="text-sm text-blue-600">Markup</div>
                      <div className="text-lg font-semibold text-blue-900">{selectedProduct.markup.toFixed(1)}x</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3">
                      <div className="text-sm text-green-600">Margen</div>
                      <div className="text-lg font-semibold text-green-900">{formatPercentage(selectedProduct.margin)}</div>
                    </div>
                  </div>
                </div>

                {/* Precios por Canales */}
                <div className="mb-6 bg-white rounded-lg p-4 shadow-sm">
                  <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                    <Store className="h-4 w-4 mr-2 text-green-600" />
                    Precios por Canales
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                      <div className="flex items-center">
                        <Globe className="h-4 w-4 text-blue-500 mr-2" />
                        <span className="text-sm text-gray-600">Online</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">${selectedProduct.channels.online.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                      <div className="flex items-center">
                        <Store className="h-4 w-4 text-blue-500 mr-2" />
                        <span className="text-sm text-gray-600">Retail</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">${selectedProduct.channels.retail.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                      <div className="flex items-center">
                        <Truck className="h-4 w-4 text-green-500 mr-2" />
                        <span className="text-sm text-gray-600">Mayorista</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">${selectedProduct.channels.wholesale.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-orange-50 rounded">
                      <div className="flex items-center">
                        <ShoppingCart className="h-4 w-4 text-orange-500 mr-2" />
                        <span className="text-sm text-gray-600">Distribuidor</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">${selectedProduct.channels.distributor.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Recomendaciones */}
                <div className="mb-6 bg-white rounded-lg p-4 shadow-sm">
                  <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2 text-blue-600" />
                    Recomendaciones
                  </h4>
                  <div className="space-y-2">
                    {selectedProduct.recommendations.map((rec, index) => (
                      <div key={index} className="flex items-start p-2 bg-gray-50 rounded">
                        <TrendingUp className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => downloadAnalysis()}
                    className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500">
                <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p>Selecciona un producto para ver el análisis detallado</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
