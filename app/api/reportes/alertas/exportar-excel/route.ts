import { NextRequest, NextResponse } from 'next/server'
import { HistorialPricing } from "@/lib/supabase-historial"
import * as XLSX from 'xlsx'

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Exportando centro de alertas a Excel...')
    
    // Obtener datos de alertas
    const sesiones = await HistorialPricing.obtenerSesiones(1000)
    
    if (sesiones.length === 0) {
      return NextResponse.json({ error: 'No hay datos para exportar' }, { status: 400 })
    }

    // Obtener todos los productos
    const todosProductos = []
    for (const sesion of sesiones) {
      try {
        const productos = await HistorialPricing.obtenerProductosSesion(sesion.id)
        const productosConSesion = productos.map(p => ({
          ...p,
          sesion_id: sesion.id,
          fecha_procesamiento: sesion.fecha_procesamiento
        }))
        todosProductos.push(...productosConSesion)
      } catch (error) {
        console.warn(`Error obteniendo productos de sesión ${sesion.id}:`, error)
      }
    }

    // Generar alertas (misma lógica que la API)
    const alertas: any[] = []

    // 1. Alertas de rentabilidad negativa
    const productosRentabilidadNegativa = todosProductos.filter(p => 
      p.minorista_rentabilidad <= 0 || p.mayorista_rentabilidad <= 0
    )

    productosRentabilidadNegativa.forEach(producto => {
      alertas.push({
        'ID Alerta': `rent_neg_${producto.id}`,
        'Tipo': 'Rentabilidad Negativa',
        'Severidad': 'Alta',
        'Título': 'Rentabilidad Negativa Detectada',
        'Descripción': `El producto "${producto.producto}" tiene rentabilidad negativa en ${producto.minorista_rentabilidad <= 0 ? 'minorista' : 'mayorista'}`,
        'Producto': producto.producto,
        'Proveedor': producto.proveedor,
        'Sesión ID': producto.sesion_id,
        'Fecha': new Date(producto.fecha_procesamiento).toLocaleString('es-AR'),
        'Valor Actual': producto.minorista_rentabilidad <= 0 ? producto.minorista_rentabilidad : producto.mayorista_rentabilidad,
        'Valor Esperado': 0,
        'Acción Sugerida': 'Revisar precios base y márgenes aplicados. Considerar ajustar precios o descuentos.',
        'Precio Minorista': producto.minorista_precio_final,
        'Precio Mayorista': producto.mayorista_precio_final,
        'Rentabilidad Minorista (%)': producto.minorista_rentabilidad,
        'Rentabilidad Mayorista (%)': producto.mayorista_rentabilidad
      })
    })

    // 2. Alertas de precios fuera de rango
    const productosPrecioFueraRango = todosProductos.filter(p => {
      const precioMinorista = p.minorista_precio_final || 0
      const precioMayorista = p.mayorista_precio_final || 0
      return precioMinorista < 1000 || precioMinorista > 100000 || 
             precioMayorista < 1000 || precioMayorista > 100000
    })

    productosPrecioFueraRango.forEach(producto => {
      const precioMinorista = producto.minorista_precio_final || 0
      const precioMayorista = producto.mayorista_precio_final || 0
      const fueraRango = precioMinorista < 1000 || precioMinorista > 100000 || 
                        precioMayorista < 1000 || precioMayorista > 100000

      if (fueraRango) {
        alertas.push({
          'ID Alerta': `precio_rango_${producto.id}`,
          'Tipo': 'Precio Fuera de Rango',
          'Severidad': 'Media',
          'Título': 'Precio Fuera de Rango Normal',
          'Descripción': `El producto "${producto.producto}" tiene precios fuera del rango esperado (1,000 - 100,000 ARS)`,
          'Producto': producto.producto,
          'Proveedor': producto.proveedor,
          'Sesión ID': producto.sesion_id,
          'Fecha': new Date(producto.fecha_procesamiento).toLocaleString('es-AR'),
          'Valor Actual': precioMinorista,
          'Valor Esperado': 50000,
          'Acción Sugerida': 'Verificar cálculos de pricing y precios base. Revisar configuración de márgenes.',
          'Precio Minorista': precioMinorista,
          'Precio Mayorista': precioMayorista,
          'Rentabilidad Minorista (%)': producto.minorista_rentabilidad,
          'Rentabilidad Mayorista (%)': producto.mayorista_rentabilidad
        })
      }
    })

    // 3. Alertas de productos sin equivalencia Varta
    const productosSinVarta = todosProductos.filter(p => !p.equivalencia_varta?.encontrada)

    productosSinVarta.forEach(producto => {
      alertas.push({
        'ID Alerta': `sin_varta_${producto.id}`,
        'Tipo': 'Sin Equivalencia Varta',
        'Severidad': 'Baja',
        'Título': 'Sin Equivalencia Varta',
        'Descripción': `El producto "${producto.producto}" no tiene equivalencia Varta configurada`,
        'Producto': producto.producto,
        'Proveedor': producto.proveedor,
        'Sesión ID': producto.sesion_id,
        'Fecha': new Date(producto.fecha_procesamiento).toLocaleString('es-AR'),
        'Valor Actual': 'N/A',
        'Valor Esperado': 'N/A',
        'Acción Sugerida': 'Considerar agregar equivalencia Varta para mejorar cálculos de mayorista.',
        'Precio Minorista': producto.minorista_precio_final,
        'Precio Mayorista': producto.mayorista_precio_final,
        'Rentabilidad Minorista (%)': producto.minorista_rentabilidad,
        'Rentabilidad Mayorista (%)': producto.mayorista_rentabilidad
      })
    })

    // 4. Alertas de rentabilidad baja
    const productosRentabilidadBaja = todosProductos.filter(p => 
      p.minorista_rentabilidad > 0 && p.minorista_rentabilidad < 10
    )

    productosRentabilidadBaja.forEach(producto => {
      alertas.push({
        'ID Alerta': `rent_baja_${producto.id}`,
        'Tipo': 'Rentabilidad Baja',
        'Severidad': 'Media',
        'Título': 'Rentabilidad Baja',
        'Descripción': `El producto "${producto.producto}" tiene rentabilidad muy baja (${producto.minorista_rentabilidad.toFixed(1)}%)`,
        'Producto': producto.producto,
        'Proveedor': producto.proveedor,
        'Sesión ID': producto.sesion_id,
        'Fecha': new Date(producto.fecha_procesamiento).toLocaleString('es-AR'),
        'Valor Actual': producto.minorista_rentabilidad,
        'Valor Esperado': 20,
        'Acción Sugerida': 'Revisar márgenes aplicados. Considerar ajustar precios o buscar mejores condiciones de compra.',
        'Precio Minorista': producto.minorista_precio_final,
        'Precio Mayorista': producto.mayorista_precio_final,
        'Rentabilidad Minorista (%)': producto.minorista_rentabilidad,
        'Rentabilidad Mayorista (%)': producto.mayorista_rentabilidad
      })
    })

    // 5. Alertas de errores de procesamiento
    const productosConErrores = todosProductos.filter(p => 
      !p.producto || !p.proveedor || p.minorista_precio_final === 0 || p.mayorista_precio_final === 0
    )

    productosConErrores.forEach(producto => {
      alertas.push({
        'ID Alerta': `error_proc_${producto.id}`,
        'Tipo': 'Error de Procesamiento',
        'Severidad': 'Alta',
        'Título': 'Error de Procesamiento',
        'Descripción': `El producto "${producto.producto || 'Sin nombre'}" tiene datos faltantes o incorrectos`,
        'Producto': producto.producto || 'Sin nombre',
        'Proveedor': producto.proveedor || 'Sin proveedor',
        'Sesión ID': producto.sesion_id,
        'Fecha': new Date(producto.fecha_procesamiento).toLocaleString('es-AR'),
        'Valor Actual': 'N/A',
        'Valor Esperado': 'N/A',
        'Acción Sugerida': 'Revisar datos de entrada y configuración del sistema. Verificar mapeo de columnas.',
        'Precio Minorista': producto.minorista_precio_final || 0,
        'Precio Mayorista': producto.mayorista_precio_final || 0,
        'Rentabilidad Minorista (%)': producto.minorista_rentabilidad || 0,
        'Rentabilidad Mayorista (%)': producto.mayorista_rentabilidad || 0
      })
    })

    // Calcular estadísticas
    const totalAlertas = alertas.length
    const alertasAlta = alertas.filter(a => a.Severidad === 'Alta').length
    const alertasMedia = alertas.filter(a => a.Severidad === 'Media').length
    const alertasBaja = alertas.filter(a => a.Severidad === 'Baja').length
    const productosAfectados = new Set(alertas.map(a => a.Producto)).size
    const sesionesAfectadas = new Set(alertas.map(a => a['Sesión ID'])).size

    // Contar por tipo
    const tiposAlertas = {
      'Rentabilidad Negativa': alertas.filter(a => a.Tipo === 'Rentabilidad Negativa').length,
      'Precio Fuera de Rango': alertas.filter(a => a.Tipo === 'Precio Fuera de Rango').length,
      'Sin Equivalencia Varta': alertas.filter(a => a.Tipo === 'Sin Equivalencia Varta').length,
      'Error de Procesamiento': alertas.filter(a => a.Tipo === 'Error de Procesamiento').length,
      'Rentabilidad Baja': alertas.filter(a => a.Tipo === 'Rentabilidad Baja').length
    }

    // Resumen por severidad
    const resumenSeveridad = [
      { 'Severidad': 'Alta', 'Cantidad': alertasAlta, 'Porcentaje': totalAlertas > 0 ? ((alertasAlta / totalAlertas) * 100).toFixed(1) + '%' : '0%' },
      { 'Severidad': 'Media', 'Cantidad': alertasMedia, 'Porcentaje': totalAlertas > 0 ? ((alertasMedia / totalAlertas) * 100).toFixed(1) + '%' : '0%' },
      { 'Severidad': 'Baja', 'Cantidad': alertasBaja, 'Porcentaje': totalAlertas > 0 ? ((alertasBaja / totalAlertas) * 100).toFixed(1) + '%' : '0%' }
    ]

    // Resumen por tipo
    const resumenTipo = Object.entries(tiposAlertas).map(([tipo, cantidad]) => ({
      'Tipo de Alerta': tipo,
      'Cantidad': cantidad,
      'Porcentaje': totalAlertas > 0 ? ((cantidad / totalAlertas) * 100).toFixed(1) + '%' : '0%'
    }))

    // Estadísticas generales
    const estadisticasGenerales = [
      { 'Métrica': 'Total Alertas', 'Valor': totalAlertas },
      { 'Métrica': 'Alertas Alta Severidad', 'Valor': alertasAlta },
      { 'Métrica': 'Alertas Media Severidad', 'Valor': alertasMedia },
      { 'Métrica': 'Alertas Baja Severidad', 'Valor': alertasBaja },
      { 'Métrica': 'Productos Afectados', 'Valor': productosAfectados },
      { 'Métrica': 'Sesiones Afectadas', 'Valor': sesionesAfectadas },
      { 'Métrica': 'Total Productos Analizados', 'Valor': todosProductos.length },
      { 'Métrica': 'Porcentaje Productos con Alertas', 'Valor': todosProductos.length > 0 ? ((productosAfectados / todosProductos.length) * 100).toFixed(1) + '%' : '0%' },
      { 'Métrica': 'Fecha de Generación', 'Valor': new Date().toLocaleString('es-AR') }
    ]

    // Crear workbook con múltiples hojas
    const workbook = XLSX.utils.book_new()

    // Hoja 1: Todas las Alertas
    const wsAlertas = XLSX.utils.json_to_sheet(alertas)
    XLSX.utils.book_append_sheet(workbook, wsAlertas, 'Todas las Alertas')

    // Hoja 2: Alertas por Severidad
    const wsSeveridad = XLSX.utils.json_to_sheet(resumenSeveridad)
    XLSX.utils.book_append_sheet(workbook, wsSeveridad, 'Resumen por Severidad')

    // Hoja 3: Alertas por Tipo
    const wsTipo = XLSX.utils.json_to_sheet(resumenTipo)
    XLSX.utils.book_append_sheet(workbook, wsTipo, 'Resumen por Tipo')

    // Hoja 4: Solo Alertas de Alta Severidad
    const alertasAltaSeveridad = alertas.filter(a => a.Severidad === 'Alta')
    const wsAlta = XLSX.utils.json_to_sheet(alertasAltaSeveridad)
    XLSX.utils.book_append_sheet(workbook, wsAlta, 'Alertas Alta Severidad')

    // Hoja 5: Solo Alertas de Media Severidad
    const alertasMediaSeveridad = alertas.filter(a => a.Severidad === 'Media')
    const wsMedia = XLSX.utils.json_to_sheet(alertasMediaSeveridad)
    XLSX.utils.book_append_sheet(workbook, wsMedia, 'Alertas Media Severidad')

    // Hoja 6: Solo Alertas de Baja Severidad
    const alertasBajaSeveridad = alertas.filter(a => a.Severidad === 'Baja')
    const wsBaja = XLSX.utils.json_to_sheet(alertasBajaSeveridad)
    XLSX.utils.book_append_sheet(workbook, wsBaja, 'Alertas Baja Severidad')

    // Hoja 7: Estadísticas Generales
    const wsGenerales = XLSX.utils.json_to_sheet(estadisticasGenerales)
    XLSX.utils.book_append_sheet(workbook, wsGenerales, 'Estadísticas Generales')

    // Generar archivo Excel
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    console.log('✅ Excel de alertas generado exitosamente:', {
      hojas: workbook.SheetNames.length,
      total_alertas: totalAlertas,
      alertas_alta: alertasAlta,
      alertas_media: alertasMedia,
      alertas_baja: alertasBaja,
      productos_afectados: productosAfectados
    })

    // Retornar archivo Excel
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="centro_alertas_${new Date().toISOString().split('T')[0]}.xlsx"`
      }
    })
    
  } catch (error) {
    console.error('❌ Error exportando Excel de alertas:', error)
    return NextResponse.json({ 
      error: 'Error exportando centro de alertas a Excel',
      detalles: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
