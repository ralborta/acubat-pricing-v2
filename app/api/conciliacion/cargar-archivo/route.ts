import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const tipo = formData.get('tipo') as string // 'transacciones' o 'bancario'
    
    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 })
    }

    if (!tipo || !['transacciones', 'bancario'].includes(tipo)) {
      return NextResponse.json({ error: 'Tipo de archivo inválido' }, { status: 400 })
    }

    console.log(`📁 Procesando archivo ${tipo}:`, file.name, 'Tamaño:', file.size)

    // Leer archivo Excel
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const datos = XLSX.utils.sheet_to_json(worksheet)

    console.log(`📊 Datos leídos: ${datos.length} registros`)

    // Validar estructura del archivo según el tipo
    const headers = Object.keys(datos[0] || {})
    console.log('📋 Columnas encontradas:', headers)

    let validacion = { valido: true, errores: [] as string[] }

    if (tipo === 'transacciones') {
      // Validar columnas necesarias para transacciones
      const columnasRequeridas = ['fecha', 'monto', 'descripcion', 'referencia']
      const columnasFaltantes = columnasRequeridas.filter(col => 
        !headers.some(h => h.toLowerCase().includes(col.toLowerCase()))
      )
      
      if (columnasFaltantes.length > 0) {
        validacion.valido = false
        validacion.errores.push(`Columnas faltantes: ${columnasFaltantes.join(', ')}`)
      }
    } else if (tipo === 'bancario') {
      // Validar columnas necesarias para movimientos bancarios
      const columnasRequeridas = ['fecha', 'monto', 'descripcion', 'referencia']
      const columnasFaltantes = columnasRequeridas.filter(col => 
        !headers.some(h => h.toLowerCase().includes(col.toLowerCase()))
      )
      
      if (columnasFaltantes.length > 0) {
        validacion.valido = false
        validacion.errores.push(`Columnas faltantes: ${columnasFaltantes.join(', ')}`)
      }
    }

    if (!validacion.valido) {
      return NextResponse.json({ 
        error: 'Archivo inválido', 
        detalles: validacion.errores 
      }, { status: 400 })
    }

    // Procesar datos
    const datosProcesados = datos.map((registro: any, index: number) => {
      // Normalizar datos según el tipo
      const fecha = new Date(registro.fecha || registro.Fecha || registro.FECHA)
      const monto = parseFloat(registro.monto || registro.Monto || registro.MONTO || 0)
      const descripcion = registro.descripcion || registro.Descripcion || registro.DESCRIPCION || ''
      const referencia = registro.referencia || registro.Referencia || registro.REFERENCIA || ''

      return {
        id: `${tipo}_${Date.now()}_${index}`,
        fecha: fecha.toISOString().split('T')[0],
        monto,
        descripcion,
        referencia,
        tipo,
        archivo: file.name,
        procesado: new Date().toISOString()
      }
    })

    // TODO: Guardar en base de datos
    // Por ahora solo retornamos los datos procesados

    return NextResponse.json({
      success: true,
      tipo,
      archivo: file.name,
      registros: datosProcesados.length,
      datos: datosProcesados.slice(0, 10), // Solo primeros 10 para preview
      mensaje: `Archivo ${tipo} procesado exitosamente`
    })

  } catch (error) {
    console.error('❌ Error procesando archivo:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      detalles: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
