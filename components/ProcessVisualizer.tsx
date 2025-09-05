'use client'

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  Circle,
  Loader2,
  Play,
  Pause,
  RotateCcw,
  Zap,
  FileText,
  ArrowLeftRight,
  Calculator,
  Percent,
  TrendingUp,
  BarChart3,
  DollarSign,
  Upload,
  Clock,
  CheckCircle2
} from "lucide-react";

// ==========================
// Tipos y Interfaces
// ==========================
type PVStatus = 'pending' | 'active' | 'completed';

interface PVStep {
  id: number;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  status: PVStatus;
  details?: string[];
}

interface ProcessVisualizerProps {
  isVisible: boolean;
  onComplete: () => void;
  fileName: string;
  progreso: number;
}

// ==========================
// Componentes de UI
// ==========================
function Card({ title, subtitle, children, className = "" }: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative p-5 rounded-2xl border bg-white shadow-sm hover:shadow-md transition-all duration-300 ${className}`}>
      <div className="mb-4">
        {subtitle && <div className="text-sm text-gray-500">{subtitle}</div>}
        <h3 className="text-lg font-semibold tracking-tight text-gray-900">{title}</h3>
      </div>
      {children}
    </div>
  );
}

// ==========================
// Visualizador Principal
// ==========================
export default function ProcessVisualizer({ isVisible, onComplete, fileName, progreso }: ProcessVisualizerProps) {
  const [steps, setSteps] = useState<PVStep[]>([
    {
      id: 1,
      title: 'Toma Lista de Precios',
      description: 'Cargando archivo de precios base',
      icon: FileText,
      status: 'pending',
      details: ['Leyendo archivo Excel/CSV', 'Validando estructura de datos', 'Extrayendo productos y precios']
    },
    {
      id: 2,
      title: 'Genera Tabla de Equivalencia',
      description: 'Creando equivalencias entre marcas',
      icon: ArrowLeftRight,
      status: 'pending',
      details: ['Mapeando productos Moura', 'Buscando equivalentes Varta', 'Estableciendo relaciones de capacidad']
    },
    {
      id: 3,
      title: 'Calcula Precios Mayoristas',
      description: 'Aplicando markups por canal',
      icon: Calculator,
      status: 'pending',
      details: ['Aplicando markup mayorista (+22%)', 'Aplicando markup directa (+60%)', 'Validando coherencia de precios']
    },
    {
      id: 4,
      title: 'Calcula IVA',
      description: 'Aplicando impuesto al valor agregado',
      icon: Percent,
      status: 'pending',
      details: ['Calculando IVA 21%', 'Aplicando sobre precios con markup', 'Desglosando montos por producto']
    },
    {
      id: 5,
      title: 'Calcula Markup Final',
      description: 'Aplicando márgenes de rentabilidad',
      icon: TrendingUp,
      status: 'pending',
      details: ['Ajustando precios por canal', 'Aplicando redondeo inteligente', 'Optimizando márgenes']
    },
    {
      id: 6,
      title: 'Calcula Rentabilidad',
      description: 'Analizando viabilidad económica',
      icon: BarChart3,
      status: 'pending',
      details: ['Evaluando márgenes por canal', 'Calculando rentabilidad por producto', 'Identificando productos críticos']
    },
    {
      id: 7,
      title: 'Define Precios Finales',
      description: 'Estableciendo precios de venta',
      icon: DollarSign,
      status: 'pending',
      details: ['Confirmando precios por canal', 'Validando coherencia general', 'Aplicando reglas de negocio']
    },
    {
      id: 8,
      title: 'Prepara Datos para Transferencia',
      description: 'Generando archivo de resultados',
      icon: Upload,
      status: 'pending',
      details: ['Formateando resultados', 'Generando Excel de salida', 'Preparando para descarga']
    },
  ]);

  const [currentStep, setCurrentStep] = useState(0);

  // Conectar con el progreso real
  useEffect(() => {
    if (isVisible && progreso > 0) {
      // Calcular paso actual basado en progreso
      const pasoCalculado = Math.floor((progreso / 100) * steps.length);
      setCurrentStep(Math.min(pasoCalculado, steps.length - 1));
      
      // Si progreso es 100%, completar
      if (progreso >= 100) {
        setTimeout(() => {
          onComplete();
        }, 1000);
      }
    }
  }, [isVisible, progreso, steps.length, onComplete]);

  // Actualizar estados de los pasos
  useEffect(() => {
    setSteps(prev => prev.map((step, index) => {
      if (index < currentStep) {
        return { ...step, status: 'completed' as PVStatus };
      } else if (index === currentStep) {
        return { ...step, status: 'active' as PVStatus };
      } else {
        return { ...step, status: 'pending' as PVStatus };
      }
    }));
  }, [currentStep]);

  const totalProgress = progreso;

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden border border-gray-100"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight">Proceso de Pricing Acubat</h2>
                  <div className="flex items-center gap-2 mt-2 text-blue-100">
                    <FileText className="h-4 w-4" />
                    <span className="font-medium">{fileName}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-white/20 px-3 py-2 rounded-xl backdrop-blur-sm">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm font-medium">Procesando...</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onComplete()}
                      className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl backdrop-blur-sm transition-colors"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-sm font-medium">Completar</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contenido Principal */}
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-[280px,1fr] gap-8">
              {/* Donut Circular */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="w-48 h-48 rounded-full border-8 border-gray-200 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-5xl font-bold tabular-nums text-gray-800">
                        {Math.round(totalProgress)}%
                      </div>
                      <div className="text-sm text-gray-500 font-medium">
                        Paso {currentStep + 1} de {steps.length}
                      </div>
                    </div>
                  </div>
                  {/* Barra de progreso circular */}
                  <div className="absolute inset-0 w-48 h-48">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        className="text-gray-200"
                      />
                      <motion.circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        className="text-blue-500"
                        strokeDasharray="251.2"
                        strokeDashoffset="251.2"
                        initial={{ strokeDashoffset: 251.2 }}
                        animate={{ strokeDashoffset: 251.2 - (251.2 * totalProgress / 100) }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                    </svg>
                  </div>
                </div>

                {/* Leyenda */}
                <div className="mt-6 flex items-center justify-center gap-4 text-xs text-gray-500">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-emerald-500"></span>
                    Completado
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-indigo-500"></span>
                    Activo
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-gray-300"></span>
                    Pendiente
                  </span>
                </div>
              </div>

              {/* Lista de Pasos */}
              <div className="space-y-4">
                {steps.map((step, i) => (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1, duration: 0.3 }}
                    className={`relative p-4 rounded-2xl border-2 transition-all duration-500 ${
                      step.status === 'completed'
                        ? 'border-emerald-500 bg-emerald-50 shadow-lg'
                        : step.status === 'active'
                        ? 'border-indigo-500 bg-indigo-50 shadow-xl scale-105'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    {/* Indicador de Estado */}
                    <div className={`absolute -top-2 -left-2 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                      step.status === 'completed'
                        ? 'bg-emerald-500 text-white shadow-lg'
                        : step.status === 'active'
                        ? 'bg-indigo-500 text-white shadow-lg animate-pulse'
                        : 'bg-gray-300 text-gray-600'
                    }`}>
                      {step.status === 'completed' ? (
                        <CheckCircle2 className="h-5 w-5" />
                      ) : (
                        <span className="text-sm font-bold">{step.id}</span>
                      )}
                    </div>

                    {/* Contenido del Paso */}
                    <div className="ml-8">
                      <div className="flex items-center gap-3 mb-2">
                        <step.icon className={`h-6 w-6 transition-colors duration-300 ${
                          step.status === 'completed'
                            ? 'text-emerald-600'
                            : step.status === 'active'
                            ? 'text-indigo-600'
                            : 'text-gray-400'
                        }`} />
                        <h3 className={`text-lg font-semibold transition-colors duration-300 ${
                          step.status === 'completed'
                            ? 'text-emerald-800'
                            : step.status === 'active'
                            ? 'text-indigo-800'
                            : 'text-gray-700'
                        }`}>
                          {step.title}
                        </h3>
                      </div>

                      <p className={`text-sm transition-colors duration-300 ${
                        step.status === 'completed'
                          ? 'text-emerald-700'
                          : step.status === 'active'
                          ? 'text-indigo-700'
                          : 'text-gray-500'
                      }`}>
                        {step.description}
                      </p>

                      {/* Detalles del Paso */}
                      {step.status === 'active' && step.details && (
                        <motion.ul
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          transition={{ delay: 0.2, duration: 0.3 }}
                          className="mt-3 text-xs text-indigo-700 space-y-1"
                        >
                          {step.details.map((detail, idx) => (
                            <motion.li
                              key={idx}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.3 + idx * 0.1, duration: 0.2 }}
                              className="flex items-center gap-2"
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
                              {detail}
                            </motion.li>
                          ))}
                        </motion.ul>
                      )}
                    </div>

                    {/* Línea de Conexión */}
                    {i < steps.length - 1 && (
                      <div className={`absolute left-6 top-full w-0.5 h-6 transition-all duration-500 ${
                        step.status === 'completed' ? 'bg-emerald-500' : 'bg-gray-200'
                      }`}></div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 p-6 border-t border-gray-100">
            <div className="text-center">
              <motion.p
                key={currentStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="text-sm text-gray-600 font-medium"
              >
                {currentStep < steps.length - 1
                  ? `Procesando paso ${currentStep + 1} de ${steps.length}...`
                  : '¡Proceso completado exitosamente! 🎉'
                }
              </motion.p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
