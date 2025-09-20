'use client'

import { useState } from 'react';
import { formatCurrency, formatNumber, formatPercentage } from '../../lib/formatters';
import { useConfiguracion } from '../hooks/useConfiguracion';
import { aplicarConfiguracionPricing } from '../lib/pricing_mapper';

export default function PricingDemo() {
  const { configuracion, loading } = useConfiguracion();
  const [precioBase, setPrecioBase] = useState(100000);
  const [canal, setCanal] = useState<'mayorista' | 'directa' | 'distribucion'>('mayorista');
  const [resultado, setResultado] = useState<any>(null);

  const calcularPricing = async () => {
    if (!configuracion) return;
    
    const resultado = await aplicarConfiguracionPricing(precioBase, canal);
    setResultado(resultado);
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!configuracion) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">❌ No se pudo cargar la configuración del sistema</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        🧮 Demo de Pricing con Configuración del Sistema
      </h3>
      
      {/* Configuración Actual */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">⚙️ Configuración Actual</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">IVA:</span> {configuracion.iva}%
          </div>
          <div>
            <span className="font-medium">Markup Mayorista:</span> {configuracion.markups.mayorista}%
          </div>
          <div>
            <span className="font-medium">Markup Directa:</span> {configuracion.markups.directa}%
          </div>
          <div>
            <span className="font-medium">Markup Distribución:</span> {configuracion.markups.distribucion}%
          </div>
        </div>
      </div>

      {/* Calculadora */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-3">🧮 Calculadora de Pricing</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Precio Base (ARS)
            </label>
            <input
              type="number"
              value={precioBase}
              onChange={(e) => setPrecioBase(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="100000"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Canal de Venta
            </label>
            <select
              value={canal}
              onChange={(e) => setCanal(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="mayorista">Mayorista</option>
              <option value="directa">Directa</option>
              <option value="distribucion">Distribución</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={calcularPricing}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Calcular
            </button>
          </div>
        </div>
      </div>

      {/* Resultado */}
      {resultado && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-medium text-green-900 mb-3">📊 Resultado del Cálculo</h4>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Precio Base:</span> {formatCurrency(precioBase)}
            </div>
            <div>
              <span className="font-medium">IVA ({resultado.iva}%):</span> {formatCurrency(resultado.precioConIva)}
            </div>
            <div>
              <span className="font-medium">Markup ({resultado.markup}%):</span> {formatCurrency(resultado.precioConMarkup)}
            </div>
            <div>
              <span className="font-medium">Comisión ({resultado.comision}%):</span> {formatCurrency(resultado.precioFinal)}
            </div>
          </div>
          
          <div className="mt-3 p-3 bg-white rounded border">
            <div className="text-lg font-bold text-green-600">
              💰 Precio Final: {formatCurrency(resultado.precioFinal)}
            </div>
          </div>
        </div>
      )}

      {/* Nota */}
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          💡 <strong>Nota:</strong> Los cambios en la configuración del sistema se aplican inmediatamente 
          en todos los cálculos de pricing. Modifica los valores en la página de configuración para ver 
          cómo cambian los resultados aquí.
        </p>
      </div>
    </div>
  );
}
