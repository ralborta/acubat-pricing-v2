'use client'

import { 
  Phone, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  Users, 
  BarChart3 
} from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import KPICard from '@/components/KPICard'
import ChartCard from '@/components/ChartCard'
import LineChart from '@/components/LineChart'
import DoughnutChart from '@/components/DoughnutChart'

const kpiData = [
  {
    title: 'Total de Productos',
    value: '0',
    change: 'Sin datos',
    changeType: 'neutral' as const,
    progress: 0,
    icon: Phone,
    iconColor: 'text-gray-400'
  },
  {
    title: 'Margen Promedio',
    value: '0%',
    change: 'Sin datos',
    changeType: 'neutral' as const,
    progress: 0,
    icon: Clock,
    iconColor: 'text-gray-400'
  },
  {
    title: 'Tasa de Éxito',
    value: '0%',
    change: 'Sin datos',
    changeType: 'neutral' as const,
    progress: 0,
    icon: TrendingUp,
    iconColor: 'text-gray-400'
  },
  {
    title: 'Productos Críticos',
    value: '0',
    change: 'Sin datos',
    changeType: 'neutral' as const,
    progress: 0,
    icon: AlertTriangle,
    iconColor: 'text-gray-400'
  },
  {
    title: 'Simulaciones',
    value: '0',
    change: 'Sin datos',
    changeType: 'neutral' as const,
    progress: 0,
    icon: Users,
    iconColor: 'text-gray-400'
  },
  {
    title: 'Tiempo Total',
    value: '0h 0m',
    change: 'Sin datos',
    changeType: 'neutral' as const,
    progress: 0,
    icon: BarChart3,
    iconColor: 'text-gray-400'
  }
]

export default function Dashboard() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-600">Resumen de actividad de la plataforma de pricing</p>
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 text-sm">
                <strong>Estado:</strong> Sin datos disponibles. Los indicadores se actualizarán cuando comiences a procesar archivos de pricing.
              </p>
            </div>
          </div>
          
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {kpiData.map((kpi, index) => (
              <KPICard
                key={index}
                title={kpi.title}
                value={kpi.value}
                change={kpi.change}
                changeType={kpi.changeType}
                progress={kpi.progress}
                icon={kpi.icon}
                iconColor={kpi.iconColor}
              />
            ))}
          </div>
          
          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard
              title="Productos por Día"
              subtitle="Últimos 7 días de actividad"
            >
              <LineChart />
            </ChartCard>
            
            <ChartCard
              title="Distribución de Márgenes"
              subtitle="Estado de rentabilidad por producto"
            >
              <DoughnutChart />
            </ChartCard>
          </div>
        </main>
      </div>
    </div>
  )
}
