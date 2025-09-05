'use client'

import { useState } from 'react'
import { Phone, Play, Pause, Square, BarChart3, Clock, TrendingUp, CheckCircle } from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'

export default function Simulaciones() {
  const [simulations, setSimulations] = useState([
    {
      id: 1,
      name: 'Simulación Q1 2024',
      description: 'Análisis de precios para el primer trimestre',
      status: 'completed',
      startDate: '2024-01-01',
      endDate: '2024-03-31',
      totalProducts: 150,
      averageMargin: 28.5,
      progress: 100
    },
    {
      id: 2,
      name: 'Simulación Q2 2024',
      description: 'Análisis de precios para el segundo trimestre',
      status: 'in_progress',
      startDate: '2024-04-01',
      endDate: '2024-06-30',
      totalProducts: 120,
      averageMargin: 32.1,
      progress: 65
    },
    {
      id: 3,
      name: 'Simulación Competencia',
      description: 'Análisis de precios vs competencia',
      status: 'pending',
      startDate: '2024-07-01',
      endDate: '2024-07-31',
      totalProducts: 80,
      averageMargin: 0,
      progress: 0
    }
  ])

  const [newSimulation, setNewSimulation] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: ''
  })

  const startSimulation = (id: number) => {
    setSimulations(prev => prev.map(sim => 
      sim.id === id ? { ...sim, status: 'in_progress', progress: 0 } : sim
    ))
  }

  const pauseSimulation = (id: number) => {
    setSimulations(prev => prev.map(sim => 
      sim.id === id ? { ...sim, status: 'paused' } : sim
    ))
  }

  const stopSimulation = (id: number) => {
    setSimulations(prev => prev.map(sim => 
      sim.id === id ? { ...sim, status: 'stopped', progress: 0 } : sim
    ))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'paused': return 'bg-yellow-100 text-yellow-800'
      case 'stopped': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'in_progress': return <Play className="h-4 w-4" />
      case 'paused': return <Pause className="h-4 w-4" />
      case 'stopped': return <Square className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Simulaciones</h1>
            <p className="text-gray-600">Ejecuta y gestiona simulaciones de pricing</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Simulaciones</p>
                  <p className="text-2xl font-semibold text-gray-900">{simulations.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completadas</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {simulations.filter(s => s.status === 'completed').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Play className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">En Progreso</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {simulations.filter(s => s.status === 'in_progress').length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pendientes</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {simulations.filter(s => s.status === 'pending').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Simulations List */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Simulaciones Disponibles</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {simulations.map((simulation) => (
                <div key={simulation.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-medium text-gray-900">{simulation.name}</h4>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(simulation.status)}`}>
                          {getStatusIcon(simulation.status)}
                          <span className="ml-1 capitalize">{simulation.status.replace('_', ' ')}</span>
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3">{simulation.description}</p>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Período:</span>
                          <div className="font-medium">{simulation.startDate} - {simulation.endDate}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Productos:</span>
                          <div className="font-medium">{simulation.totalProducts}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Margen Promedio:</span>
                          <div className="font-medium">{simulation.averageMargin}%</div>
                        </div>
                      </div>

                      {simulation.status === 'in_progress' && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                            <span>Progreso</span>
                            <span>{simulation.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${simulation.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      {simulation.status === 'pending' && (
                        <button
                          onClick={() => startSimulation(simulation.id)}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Iniciar
                        </button>
                      )}
                      
                      {simulation.status === 'in_progress' && (
                        <>
                          <button
                            onClick={() => pauseSimulation(simulation.id)}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700"
                          >
                            <Pause className="h-4 w-4 mr-1" />
                            Pausar
                          </button>
                          <button
                            onClick={() => stopSimulation(simulation.id)}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                          >
                            <Square className="h-4 w-4 mr-1" />
                            Detener
                          </button>
                        </>
                      )}
                      
                      {simulation.status === 'completed' && (
                        <button className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                          <TrendingUp className="h-4 w-4 mr-1" />
                          Ver Resultados
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
