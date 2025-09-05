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
    value: '1,247',
    change: '+12% Mejorando',
    changeType: 'positive' as const,
    progress: 70,
    icon: Phone,
    iconColor: 'text-blue-500'
  },
  {
    title: 'Margen Promedio',
    value: '35.2%',
    change: '+5% Mejorando',
    changeType: 'positive' as const,
    progress: 60,
    icon: Clock,
    iconColor: 'text-green-500'
  },
  {
    title: 'Tasa de Éxito',
    value: '87%',
    change: '+8% Mejorando',
    changeType: 'positive' as const,
    progress: 85,
    icon: TrendingUp,
    iconColor: 'text-purple-500'
  },
  {
    title: 'Productos Críticos',
    value: '89',
    change: '-3% Necesita atención',
    changeType: 'negative' as const,
    progress: 20,
    icon: AlertTriangle,
    iconColor: 'text-orange-500'
  },
  {
    title: 'Simulaciones',
    value: '23',
    change: '-15% Mejorando',
    changeType: 'negative' as const,
    progress: 40,
    icon: Users,
    iconColor: 'text-indigo-500'
  },
  {
    title: 'Tiempo Total',
    value: '94h 12m',
    change: '+7% Mejorando',
    changeType: 'positive' as const,
    progress: 90,
    icon: BarChart3,
    iconColor: 'text-cyan-500'
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
