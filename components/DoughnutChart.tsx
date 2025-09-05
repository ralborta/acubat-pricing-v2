'use client'

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js'
import { Doughnut } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend)

const data = {
  labels: ['Óptimo (≥20%)', 'Advertencia (10-20%)', 'Crítico (<10%)'],
  datasets: [
    {
      data: [65, 25, 10],
      backgroundColor: [
        '#10b981', // Green
        '#f59e0b', // Orange
        '#ef4444', // Red
      ],
      borderColor: [
        '#10b981',
        '#f59e0b',
        '#ef4444',
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

export default function DoughnutChart() {
  return (
    <div className="h-64">
      <Doughnut data={data} options={options} />
    </div>
  )
}
