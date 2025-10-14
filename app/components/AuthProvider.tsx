'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Verificar si hay sesión activa
    const session = localStorage.getItem('acubat_session')
    
    if (session) {
      try {
        const sessionData = JSON.parse(session)
        // Verificar si la sesión no ha expirado (24 horas)
        const loginTime = new Date(sessionData.loginTime)
        const now = new Date()
        const hoursDiff = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60)
        
        if (hoursDiff < 24) {
          setIsAuthenticated(true)
        } else {
          // Sesión expirada
          localStorage.removeItem('acubat_session')
          setIsAuthenticated(false)
        }
      } catch {
        // Sesión inválida
        localStorage.removeItem('acubat_session')
        setIsAuthenticated(false)
      }
    } else {
      setIsAuthenticated(false)
    }
  }, [])

  useEffect(() => {
    // Redirigir según el estado de autenticación
    if (isAuthenticated === false && pathname !== '/login') {
      router.push('/login')
    } else if (isAuthenticated === true && pathname === '/login') {
      router.push('/')
    }
  }, [isAuthenticated, pathname, router])

  // Mostrar loading mientras se verifica la autenticación
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando sesión...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
