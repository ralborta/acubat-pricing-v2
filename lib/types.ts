// Tipos centralizados para el sistema de pricing
// Versión limpia y estandarizada

export interface ConfiguracionSistema {
  modo: string;
  iva: number;
  markups: {
    mayorista: number;
    directa: number;
    distribucion: number;
  };
  factoresVarta: {
    factorBase: number;
    capacidad80Ah: number;
  };
  promociones: boolean;
  comisiones: {
    mayorista: number;
    directa: number;
    distribucion: number;
  };
  descuentoProveedor: number; // ✅ Nuevo: % Descuento de proveedor (default: 0)
  // ✅ Overrides por proveedor (ej. { "Varta": { descuentoProveedor: 5 } })
  proveedores: Record<string, ProveedorOverrides>;
  ultimaActualizacion: string;
}

export interface ConfiguracionAgente {
  diasOperacion: string[];
  agenteSeleccionado: string;
  horarioDesde: string;
  horarioHasta: string;
  fechasSeleccionadas: string[];
}

// Tipos para funcionalidades adicionales (no parte del core)
export interface ConfiguracionRentabilidad {
  margenMinimo: number;
  criterios: {
    mayorista: number;
    directa: number;
  };
}

export interface ConfiguracionPromociones {
  activo: boolean;
  porcentaje: number;
  aplicaDesde: number;
}

export interface ConfiguracionComisionesAdicionales {
  otros: {
    descuentoEfectivo: number;
    descuentoVolumen: number;
    umbralVolumen: number;
  };
}

// Tipo para respuestas de API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Tipos auxiliares
export interface ProveedorOverrides {
  // Por ahora solo soportamos descuento por proveedor.
  // Se puede extender luego (markups, factores, etc.).
  descuentoProveedor?: number;
}
