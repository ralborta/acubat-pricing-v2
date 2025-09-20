'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Settings, 
  Building2, 
  Plus, 
  Trash2, 
  Edit,
  Save,
  RotateCcw
} from 'lucide-react'

interface BancoConfig {
  id: string
  nombre: string
  codigo: string
  activo: boolean
  orden: number
  toleranciaMonto: number
  toleranciaDias: number
  formatoArchivo: string
  columnas: {
    fecha: string
    monto: string
    descripcion: string
    referencia: string
  }
}

interface ConfiguracionGeneral {
  conciliacionAutomatica: boolean
  notificaciones: boolean
  backupAutomatico: boolean
  diasRetencion: number
  formatoReporte: string
}

export default function ConfiguracionPage() {
  const [bancos, setBancos] = useState<BancoConfig[]>([])
  const [configuracion, setConfiguracion] = useState<ConfiguracionGeneral>({
    conciliacionAutomatica: false,
    notificaciones: true,
    backupAutomatico: true,
    diasRetencion: 30,
    formatoReporte: 'excel'
  })
  const [editandoBanco, setEditandoBanco] = useState<string | null>(null)
  const [nuevoBanco, setNuevoBanco] = useState<Partial<BancoConfig>>({
    nombre: '',
    codigo: '',
    activo: true,
    orden: 0,
    toleranciaMonto: 0.01,
    toleranciaDias: 1,
    formatoArchivo: 'excel',
    columnas: {
      fecha: 'fecha',
      monto: 'monto',
      descripcion: 'descripcion',
      referencia: 'referencia'
    }
  })

  useEffect(() => {
    cargarConfiguracion()
  }, [])

  const cargarConfiguracion = () => {
    // Simular datos de configuración
    setBancos([
      {
        id: '1',
        nombre: 'Santander',
        codigo: 'SAN',
        activo: true,
        orden: 1,
        toleranciaMonto: 0.01,
        toleranciaDias: 1,
        formatoArchivo: 'excel',
        columnas: {
          fecha: 'fecha',
          monto: 'monto',
          descripcion: 'descripcion',
          referencia: 'referencia'
        }
      },
      {
        id: '2',
        nombre: 'Galicia',
        codigo: 'GAL',
        activo: true,
        orden: 2,
        toleranciaMonto: 0.01,
        toleranciaDias: 1,
        formatoArchivo: 'excel',
        columnas: {
          fecha: 'fecha',
          monto: 'monto',
          descripcion: 'descripcion',
          referencia: 'referencia'
        }
      },
      {
        id: '3',
        nombre: 'BBVA',
        codigo: 'BBVA',
        activo: true,
        orden: 3,
        toleranciaMonto: 0.01,
        toleranciaDias: 1,
        formatoArchivo: 'excel',
        columnas: {
          fecha: 'fecha',
          monto: 'monto',
          descripcion: 'descripcion',
          referencia: 'referencia'
        }
      }
    ])
  }

  const agregarBanco = () => {
    if (nuevoBanco.nombre && nuevoBanco.codigo) {
      const banco: BancoConfig = {
        id: Date.now().toString(),
        nombre: nuevoBanco.nombre!,
        codigo: nuevoBanco.codigo!,
        activo: nuevoBanco.activo || true,
        orden: bancos.length + 1,
        toleranciaMonto: nuevoBanco.toleranciaMonto || 0.01,
        toleranciaDias: nuevoBanco.toleranciaDias || 1,
        formatoArchivo: nuevoBanco.formatoArchivo || 'excel',
        columnas: nuevoBanco.columnas || {
          fecha: 'fecha',
          monto: 'monto',
          descripcion: 'descripcion',
          referencia: 'referencia'
        }
      }
      
      setBancos(prev => [...prev, banco])
      setNuevoBanco({
        nombre: '',
        codigo: '',
        activo: true,
        orden: 0,
        toleranciaMonto: 0.01,
        toleranciaDias: 1,
        formatoArchivo: 'excel',
        columnas: {
          fecha: 'fecha',
          monto: 'monto',
          descripcion: 'descripcion',
          referencia: 'referencia'
        }
      })
    }
  }

  const eliminarBanco = (id: string) => {
    setBancos(prev => prev.filter(banco => banco.id !== id))
  }

  const toggleBancoActivo = (id: string) => {
    setBancos(prev => prev.map(banco => 
      banco.id === id ? { ...banco, activo: !banco.activo } : banco
    ))
  }

  const actualizarOrden = (id: string, nuevoOrden: number) => {
    setBancos(prev => prev.map(banco => 
      banco.id === id ? { ...banco, orden: nuevoOrden } : banco
    ).sort((a, b) => a.orden - b.orden))
  }

  const guardarConfiguracion = () => {
    // TODO: Implementar guardado en base de datos
    console.log('Guardando configuración:', { bancos, configuracion })
  }

  const resetearConfiguracion = () => {
    cargarConfiguracion()
    setConfiguracion({
      conciliacionAutomatica: false,
      notificaciones: true,
      backupAutomatico: true,
      diasRetencion: 30,
      formatoReporte: 'excel'
    })
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          ⚙️ Configuración de Conciliación
        </h1>
        <p className="text-gray-600">
          Configura los bancos y parámetros del sistema de conciliación
        </p>
      </div>

      {/* Configuración General */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Configuración General
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="conciliacion-automatica">Conciliación Automática</Label>
                <Switch
                  id="conciliacion-automatica"
                  checked={configuracion.conciliacionAutomatica}
                  onCheckedChange={(checked) => 
                    setConfiguracion(prev => ({ ...prev, conciliacionAutomatica: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="notificaciones">Notificaciones</Label>
                <Switch
                  id="notificaciones"
                  checked={configuracion.notificaciones}
                  onCheckedChange={(checked) => 
                    setConfiguracion(prev => ({ ...prev, notificaciones: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="backup-automatico">Backup Automático</Label>
                <Switch
                  id="backup-automatico"
                  checked={configuracion.backupAutomatico}
                  onCheckedChange={(checked) => 
                    setConfiguracion(prev => ({ ...prev, backupAutomatico: checked }))
                  }
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="dias-retencion">Días de Retención</Label>
                <Input
                  id="dias-retencion"
                  type="number"
                  value={configuracion.diasRetencion}
                  onChange={(e) => 
                    setConfiguracion(prev => ({ ...prev, diasRetencion: parseInt(e.target.value) }))
                  }
                />
              </div>
              
              <div>
                <Label htmlFor="formato-reporte">Formato de Reporte</Label>
                <Select 
                  value={configuracion.formatoReporte} 
                  onValueChange={(value) => 
                    setConfiguracion(prev => ({ ...prev, formatoReporte: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuración de Bancos */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Building2 className="h-5 w-5 mr-2" />
              Bancos Configurados
            </div>
            <Button onClick={guardarConfiguracion} className="flex items-center">
              <Save className="h-4 w-4 mr-2" />
              Guardar Cambios
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Lista de Bancos */}
          <div className="space-y-4 mb-6">
            {bancos.map((banco) => (
              <div key={banco.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-600">#{banco.orden}</span>
                    <Building2 className="h-5 w-5 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{banco.nombre}</h3>
                    <p className="text-sm text-gray-600">
                      Código: {banco.codigo} • Tolerancia: ${banco.toleranciaMonto} • {banco.toleranciaDias} días
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={banco.activo}
                    onCheckedChange={() => toggleBancoActivo(banco.id)}
                  />
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setEditandoBanco(banco.id)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => eliminarBanco(banco.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Agregar Nuevo Banco */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Agregar Nuevo Banco</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nombre-banco">Nombre del Banco</Label>
                <Input
                  id="nombre-banco"
                  value={nuevoBanco.nombre || ''}
                  onChange={(e) => setNuevoBanco(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Ej: Banco Nación"
                />
              </div>
              <div>
                <Label htmlFor="codigo-banco">Código</Label>
                <Input
                  id="codigo-banco"
                  value={nuevoBanco.codigo || ''}
                  onChange={(e) => setNuevoBanco(prev => ({ ...prev, codigo: e.target.value }))}
                  placeholder="Ej: BNA"
                />
              </div>
              <div>
                <Label htmlFor="tolerancia-monto">Tolerancia de Monto</Label>
                <Input
                  id="tolerancia-monto"
                  type="number"
                  step="0.01"
                  value={nuevoBanco.toleranciaMonto || 0.01}
                  onChange={(e) => setNuevoBanco(prev => ({ ...prev, toleranciaMonto: parseFloat(e.target.value) }))}
                />
              </div>
              <div>
                <Label htmlFor="tolerancia-dias">Tolerancia de Días</Label>
                <Input
                  id="tolerancia-dias"
                  type="number"
                  value={nuevoBanco.toleranciaDias || 1}
                  onChange={(e) => setNuevoBanco(prev => ({ ...prev, toleranciaDias: parseInt(e.target.value) }))}
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={agregarBanco} className="flex items-center">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Banco
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Acciones */}
      <div className="flex justify-end space-x-4">
        <Button variant="outline" onClick={resetearConfiguracion} className="flex items-center">
          <RotateCcw className="h-4 w-4 mr-2" />
          Resetear
        </Button>
        <Button onClick={guardarConfiguracion} className="flex items-center">
          <Save className="h-4 w-4 mr-2" />
          Guardar Configuración
        </Button>
      </div>
    </div>
  )
}
