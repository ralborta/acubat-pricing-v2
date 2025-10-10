import { ConfiguracionSistema } from '@/lib/types'

export const DEFAULT_CONFIG: ConfiguracionSistema = {
  modo: 'produccion',
  iva: 21,
  markups: {
    mayorista: 22,
    directa: 60,
    distribucion: 20
  },
  factoresVarta: {
    factorBase: 40,
    capacidad80Ah: 35
  },
  promociones: false,
  comisiones: {
    mayorista: 5,
    directa: 8,
    distribucion: 6
  },
  descuentoProveedor: 0,
  proveedores: {},
  ultimaActualizacion: new Date().toISOString()
}


