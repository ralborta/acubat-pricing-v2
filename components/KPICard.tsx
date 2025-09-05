'use client'

import { LucideIcon } from 'lucide-react'

interface KPICardProps {
  title: string
  value: string
  change: string
  changeType: 'positive' | 'negative' | 'neutral'
  progress: number
  icon: LucideIcon
  iconColor?: string
}

export default function KPICard({ 
  title, 
  value, 
  change, 
  changeType, 
  progress, 
  icon: Icon,
  iconColor = 'text-gray-400'
}: KPICardProps) {
  const getChangeColor = () => {
    switch (changeType) {
      case 'positive':
        return 'text-green-600'
      case 'negative':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getProgressColor = () => {
    switch (changeType) {
      case 'positive':
        return 'bg-green-500'
      case 'negative':
        return 'bg-red-500'
      default:
        return 'bg-acubat-blue'
    }
  }

  return (
    <div className="kpi-card">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      
      <div className="mb-2">
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className={`text-sm font-medium ${getChangeColor()}`}>
          {change}
        </div>
      </div>
      
      <div className="progress-bar">
        <div 
          className={`progress-fill ${getProgressColor()}`}
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  )
}
