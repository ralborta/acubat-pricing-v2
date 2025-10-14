'use client'

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const data = {
  labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
  datasets: [
    {
      label: 'Productos',
      data: [0, 0, 0, 0, 0, 0, 0],
      borderColor: '#9ca3af',
      backgroundColor: 'rgba(156, 163, 175, 0.1)',
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#9ca3af',
      pointBorderColor: '#ffffff',
      pointBorderWidth: 2,
      pointRadius: 4,
    },
  ],
}

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: '#ffffff',
      bodyColor: '#ffffff',
      borderColor: '#3b82f6',
      borderWidth: 1,
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        color: '#6b7280',
        font: {
          size: 12,
        },
      },
    },
    y: {
      grid: {
        color: '#e5e7eb',
        borderDash: [5, 5],
      },
      ticks: {
        color: '#6b7280',
        font: {
          size: 12,
        },
        callback: function(value: any) {
          return value
        },
      },
      min: 0,
      max: 10,
    },
  },
  elements: {
    point: {
      hoverRadius: 6,
    },
  },
}

export default function LineChart() {
  return (
    <div className="h-64">
      <Line data={data} options={options} />
    </div>
  )
}
