'use client'

import { useState, useEffect } from 'react'
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastProps {
  type: ToastType
  title: string
  message?: string
  duration?: number
  onClose: () => void
}

const Toast: React.FC<ToastProps> = ({ type, title, message, duration = 5000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration])

  const handleClose = () => {
    setIsLeaving(true)
    setTimeout(() => {
      setIsVisible(false)
      onClose()
    }, 300)
  }

  const getToastStyles = () => {
    const baseStyles = "fixed top-4 right-4 z-50 max-w-sm w-full bg-white rounded-xl shadow-2xl border border-gray-100 transform transition-all duration-300 ease-out"
    
    if (isLeaving) {
      return `${baseStyles} translate-x-full opacity-0 scale-95`
    }
    
    return `${baseStyles} translate-x-0 opacity-100 scale-100`
  }

  const getIcon = () => {
    const iconClasses = "w-6 h-6 flex-shrink-0"
    
    switch (type) {
      case 'success':
        return <CheckCircleIcon className={`${iconClasses} text-green-500`} />
      case 'error':
        return <XCircleIcon className={`${iconClasses} text-red-500`} />
      case 'warning':
        return <ExclamationTriangleIcon className={`${iconClasses} text-yellow-500`} />
      case 'info':
        return <InformationCircleIcon className={`${iconClasses} text-blue-500`} />
      default:
        return <CheckCircleIcon className={`${iconClasses} text-green-500`} />
    }
  }

  const getBorderColor = () => {
    switch (type) {
      case 'success':
        return 'border-l-4 border-l-green-500'
      case 'error':
        return 'border-l-4 border-l-red-500'
      case 'warning':
        return 'border-l-4 border-l-yellow-500'
      case 'info':
        return 'border-l-4 border-l-blue-500'
      default:
        return 'border-l-4 border-l-green-500'
    }
  }

  if (!isVisible) return null

  return (
    <div className={getToastStyles()}>
      <div className={`p-4 ${getBorderColor()}`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          
          <div className="ml-3 flex-1">
            <h3 className={`text-sm font-semibold ${
              type === 'success' ? 'text-green-800' :
              type === 'error' ? 'text-red-800' :
              type === 'warning' ? 'text-yellow-800' :
              'text-blue-800'
            }`}>
              {title}
            </h3>
            
            {message && (
              <p className={`mt-1 text-sm ${
                type === 'success' ? 'text-green-700' :
                type === 'error' ? 'text-red-700' :
                type === 'warning' ? 'text-yellow-700' :
                'text-blue-700'
              }`}>
                {message}
              </p>
            )}
          </div>
          
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={handleClose}
              className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                type === 'success' ? 'text-green-400 hover:text-green-500 focus:ring-green-500' :
                type === 'error' ? 'text-red-400 hover:text-red-500 focus:ring-red-500' :
                type === 'warning' ? 'text-yellow-400 hover:text-yellow-500 focus:ring-yellow-500' :
                'text-blue-400 hover:text-blue-500 focus:ring-blue-500'
              }`}
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className={`h-1 rounded-b-xl ${
        type === 'success' ? 'bg-green-500' :
        type === 'error' ? 'bg-red-500' :
        type === 'warning' ? 'bg-yellow-500' :
        'bg-blue-500'
      }`}>
        <div 
          className={`h-full rounded-b-xl transition-all duration-300 ease-linear ${
            type === 'success' ? 'bg-green-400' :
            type === 'error' ? 'bg-red-400' :
            type === 'warning' ? 'bg-yellow-400' :
            'bg-blue-400'
          }`}
          style={{
            width: isLeaving ? '0%' : '100%',
            transition: isLeaving ? 'width 0.3s ease-in' : 'width 5s linear'
          }}
        />
      </div>
    </div>
  )
}

export default Toast
