'use client'

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Doughnut } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend)

interface DoughnutChartProps {
  data?: number[]
  hasData?: boolean
}

export default function DoughnutChart({ data: chartData, hasData = false }: DoughnutChartProps) {
  const data = {
    labels: ['Óptimo (≥20%)', 'Advertencia (10-20%)', 'Crítico (<10%)'],
    datasets: [
      {
        data: hasData && chartData ? chartData : [0, 0, 0],
        backgroundColor: hasData ? [
          '#10b981', // Green
          '#f59e0b', // Yellow
          '#ef4444', // Red
        ] : [
          '#9ca3af', // Gray
          '#9ca3af', // Gray
          '#9ca3af', // Gray
        ],
        borderColor: hasData ? [
          '#10b981',
          '#f59e0b',
          '#ef4444',
        ] : [
          '#9ca3af',
          '#9ca3af',
          '#9ca3af',
        ],
        borderWidth: 2,
        cutout: '70%',
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
          font: {
            size: 12,
          },
          color: '#374151',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#3b82f6',
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            return `${context.label}: ${context.parsed}%`
          },
        },
      },
    },
  }

  return (
    <div className="h-64">
      <Doughnut data={data} options={options} />
    </div>
  )
}
