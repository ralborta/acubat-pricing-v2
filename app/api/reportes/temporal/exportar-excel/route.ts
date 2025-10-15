import { NextRequest, NextResponse } from 'next/server'
import { HistorialPricing } from "@/lib/supabase-historial"
import * as XLSX from 'xlsx'

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Exportando tendencias temporales a Excel...')
    
    // Obtener datos temporales
    const sesiones = await HistorialPricing.obtenerSesiones(1000)
    
    if (sesiones.length === 0) {
      return NextResponse.json({ error: 'No hay datos para exportar' }, { status: 400 })
    }

    // Procesar sesiones para obtener estadísticas detalladas
    const sesionesDetalladas = []
    for (const sesion of sesiones) {
      try {
        const estadisticas = await HistorialPricing.obtenerEstadisticasSesion(sesion.id)
        const productos = await HistorialPricing.obtenerProductosSesion(sesion.id)
        
        const valorTotal = productos.reduce((sum, p) => sum + (p.minorista_precio_final || 0), 0)
        const proveedoresUnicos = new Set(productos.map(p => p.proveedor)).size
        const conVarta = productos.filter(p => p.equivalencia_varta?.encontrada).length
        
        sesionesDetalladas.push({
          id: sesion.id,
          fecha_procesamiento: sesion.fecha_procesamiento,
          total_productos: estadisticas.total_productos,
          rentabilidad_promedio: estadisticas.rentabilidad_promedio_minorista,
          valor_total: valorTotal,
          proveedores_unicos: proveedoresUnicos,
          con_varta: conVarta
        })
      } catch (error) {
        console.warn(`Error procesando sesión ${sesion.id}:`, error)
      }
    }

    // Ordenar por fecha
    sesionesDetalladas.sort((a, b) => 
      new Date(a.fecha_procesamiento).getTime() - new Date(b.fecha_procesamiento).getTime()
    )

    // Agrupar por día
    const tendenciasDiarias: any = {}
    sesionesDetalladas.forEach(sesion => {
      const fecha = new Date(sesion.fecha_procesamiento).toISOString().split('T')[0]
      if (!tendenciasDiarias[fecha]) {
        tendenciasDiarias[fecha] = {
          fecha,
          sesiones: 0,
          productos: 0,
          rentabilidad_promedio: 0,
          valor_total: 0,
          proveedores_unicos: 0,
          con_varta: 0
        }
      }
      
      tendenciasDiarias[fecha].sesiones += 1
      tendenciasDiarias[fecha].productos += sesion.total_productos
      tendenciasDiarias[fecha].rentabilidad_promedio += sesion.rentabilidad_promedio
      tendenciasDiarias[fecha].valor_total += sesion.valor_total
      tendenciasDiarias[fecha].proveedores_unicos = Math.max(tendenciasDiarias[fecha].proveedores_unicos, sesion.proveedores_unicos)
      tendenciasDiarias[fecha].con_varta += sesion.con_varta
    })

    // Calcular promedios para días con múltiples sesiones
    Object.values(tendenciasDiarias).forEach((dia: any) => {
      if (dia.sesiones > 1) {
        dia.rentabilidad_promedio = dia.rentabilidad_promedio / dia.sesiones
      }
    })

    const tendenciasDiariasArray = Object.values(tendenciasDiarias).sort((a: any, b: any) => 
      new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
    )

    // Agrupar por semana
    const tendenciasSemanales: any = {}
    tendenciasDiariasArray.forEach((dia: any) => {
      const fecha = new Date(dia.fecha)
      const inicioSemana = new Date(fecha)
      inicioSemana.setDate(fecha.getDate() - fecha.getDay())
      const semanaKey = inicioSemana.toISOString().split('T')[0]
      
      if (!tendenciasSemanales[semanaKey]) {
        tendenciasSemanales[semanaKey] = {
          fecha: semanaKey,
          sesiones: 0,
          productos: 0,
          rentabilidad_promedio: 0,
          valor_total: 0,
          proveedores_unicos: 0,
          con_varta: 0
        }
      }
      
      tendenciasSemanales[semanaKey].sesiones += dia.sesiones
      tendenciasSemanales[semanaKey].productos += dia.productos
      tendenciasSemanales[semanaKey].rentabilidad_promedio += dia.rentabilidad_promedio
      tendenciasSemanales[semanaKey].valor_total += dia.valor_total
      tendenciasSemanales[semanaKey].proveedores_unicos = Math.max(tendenciasSemanales[semanaKey].proveedores_unicos, dia.proveedores_unicos)
      tendenciasSemanales[semanaKey].con_varta += dia.con_varta
    })

    // Calcular promedios para semanas
    Object.values(tendenciasSemanales).forEach((semana: any) => {
      if (semana.sesiones > 1) {
        semana.rentabilidad_promedio = semana.rentabilidad_promedio / semana.sesiones
      }
    })

    const tendenciasSemanalesArray = Object.values(tendenciasSemanales).sort((a: any, b: any) => 
      new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
    )

    // Agrupar por mes
    const tendenciasMensuales: any = {}
    tendenciasDiariasArray.forEach((dia: any) => {
      const fecha = new Date(dia.fecha)
      const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
      
      if (!tendenciasMensuales[mesKey]) {
        tendenciasMensuales[mesKey] = {
          fecha: mesKey,
          sesiones: 0,
          productos: 0,
          rentabilidad_promedio: 0,
          valor_total: 0,
          proveedores_unicos: 0,
          con_varta: 0
        }
      }
      
      tendenciasMensuales[mesKey].sesiones += dia.sesiones
      tendenciasMensuales[mesKey].productos += dia.productos
      tendenciasMensuales[mesKey].rentabilidad_promedio += dia.rentabilidad_promedio
      tendenciasMensuales[mesKey].valor_total += dia.valor_total
      tendenciasMensuales[mesKey].proveedores_unicos = Math.max(tendenciasMensuales[mesKey].proveedores_unicos, dia.proveedores_unicos)
      tendenciasMensuales[mesKey].con_varta += dia.con_varta
    })

    // Calcular promedios para meses
    Object.values(tendenciasMensuales).forEach((mes: any) => {
      if (mes.sesiones > 1) {
        mes.rentabilidad_promedio = mes.rentabilidad_promedio / mes.sesiones
      }
    })

    const tendenciasMensualesArray = Object.values(tendenciasMensuales).sort((a: any, b: any) => 
      new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
    )

    // Preparar datos para Excel
    const tendenciasDiariasExcel = tendenciasDiariasArray.map((dia: any) => ({
      'Fecha': new Date(dia.fecha).toLocaleDateString('es-AR'),
      'Sesiones': dia.sesiones,
      'Productos': dia.productos,
      'Rentabilidad Promedio (%)': dia.rentabilidad_promedio.toFixed(2),
      'Valor Total': dia.valor_total,
      'Proveedores Únicos': dia.proveedores_unicos,
      'Con Varta': dia.con_varta
    }))

    const tendenciasSemanalesExcel = tendenciasSemanalesArray.map((semana: any) => ({
      'Semana Inicio': new Date(semana.fecha).toLocaleDateString('es-AR'),
      'Sesiones': semana.sesiones,
      'Productos': semana.productos,
      'Rentabilidad Promedio (%)': semana.rentabilidad_promedio.toFixed(2),
      'Valor Total': semana.valor_total,
      'Proveedores Únicos': semana.proveedores_unicos,
      'Con Varta': semana.con_varta
    }))

    const tendenciasMensualesExcel = tendenciasMensualesArray.map((mes: any) => ({
      'Mes': mes.fecha,
      'Sesiones': mes.sesiones,
      'Productos': mes.productos,
      'Rentabilidad Promedio (%)': mes.rentabilidad_promedio.toFixed(2),
      'Valor Total': mes.valor_total,
      'Proveedores Únicos': mes.proveedores_unicos,
      'Con Varta': mes.con_varta
    }))

    // Calcular patrones
    const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
    const patronesDiasSemana = diasSemana.map(dia => ({
      'Día de la Semana': dia,
      'Sesiones': 0
    }))

    const patronesHorasDia = Array.from({ length: 24 }, (_, i) => ({
      'Hora': `${i}:00`,
      'Sesiones': 0
    }))

    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
    const patronesEstacionalidad = meses.map((mes, index) => ({
      'Mes': mes,
      'Sesiones': 0
    }))

    // Analizar patrones
    sesionesDetalladas.forEach(sesion => {
      const fecha = new Date(sesion.fecha_procesamiento)
      const diaSemana = fecha.getDay()
      const hora = fecha.getHours()
      const mes = fecha.getMonth()

      patronesDiasSemana[diaSemana].Sesiones += 1
      patronesHorasDia[hora].Sesiones += 1
      patronesEstacionalidad[mes].Sesiones += 1
    })

    // Estadísticas generales
    const totalDiasActivos = tendenciasDiariasArray.length
    const promedioSesionesPorDia = totalDiasActivos > 0 
      ? tendenciasDiariasArray.reduce((sum: number, dia: any) => sum + dia.sesiones, 0) / totalDiasActivos 
      : 0
    const promedioProductosPorDia = totalDiasActivos > 0 
      ? tendenciasDiariasArray.reduce((sum: number, dia: any) => sum + dia.productos, 0) / totalDiasActivos 
      : 0

    const diaMasActivo = tendenciasDiariasArray.length > 0 
      ? (tendenciasDiariasArray as any[]).reduce((max: any, dia: any) => dia.sesiones > max.sesiones ? dia : max, (tendenciasDiariasArray as any[])[0]).fecha
      : ''

    const mesMasActivo = tendenciasMensualesArray.length > 0 
      ? (tendenciasMensualesArray as any[]).reduce((max: any, mes: any) => mes.sesiones > max.sesiones ? mes : max, (tendenciasMensualesArray as any[])[0]).fecha
      : ''

    const crecimientoSesiones = tendenciasDiariasArray.length >= 2 
      ? (((tendenciasDiariasArray as any[])[tendenciasDiariasArray.length - 1].sesiones - (tendenciasDiariasArray as any[])[0].sesiones) / (tendenciasDiariasArray as any[])[0].sesiones) * 100
      : 0

    const crecimientoProductos = tendenciasDiariasArray.length >= 2 
      ? (((tendenciasDiariasArray as any[])[tendenciasDiariasArray.length - 1].productos - (tendenciasDiariasArray as any[])[0].productos) / (tendenciasDiariasArray as any[])[0].productos) * 100
      : 0

    const crecimientoRentabilidad = tendenciasDiariasArray.length >= 2 
      ? (tendenciasDiariasArray as any[])[tendenciasDiariasArray.length - 1].rentabilidad_promedio - (tendenciasDiariasArray as any[])[0].rentabilidad_promedio
      : 0

    const estadisticasGenerales = [
      { 'Métrica': 'Total Días Activos', 'Valor': totalDiasActivos },
      { 'Métrica': 'Promedio Sesiones por Día', 'Valor': promedioSesionesPorDia.toFixed(2) },
      { 'Métrica': 'Promedio Productos por Día', 'Valor': promedioProductosPorDia.toFixed(2) },
      { 'Métrica': 'Día Más Activo', 'Valor': new Date(diaMasActivo).toLocaleDateString('es-AR') },
      { 'Métrica': 'Mes Más Activo', 'Valor': mesMasActivo },
      { 'Métrica': 'Crecimiento Sesiones (%)', 'Valor': crecimientoSesiones.toFixed(2) },
      { 'Métrica': 'Crecimiento Productos (%)', 'Valor': crecimientoProductos.toFixed(2) },
      { 'Métrica': 'Crecimiento Rentabilidad (%)', 'Valor': crecimientoRentabilidad.toFixed(2) },
      { 'Métrica': 'Fecha de Generación', 'Valor': new Date().toLocaleString('es-AR') }
    ]

    // Crear workbook con múltiples hojas
    const workbook = XLSX.utils.book_new()

    // Hoja 1: Tendencias Diarias
    const wsDiarias = XLSX.utils.json_to_sheet(tendenciasDiariasExcel)
    XLSX.utils.book_append_sheet(workbook, wsDiarias, 'Tendencias Diarias')

    // Hoja 2: Tendencias Semanales
    const wsSemanales = XLSX.utils.json_to_sheet(tendenciasSemanalesExcel)
    XLSX.utils.book_append_sheet(workbook, wsSemanales, 'Tendencias Semanales')

    // Hoja 3: Tendencias Mensuales
    const wsMensuales = XLSX.utils.json_to_sheet(tendenciasMensualesExcel)
    XLSX.utils.book_append_sheet(workbook, wsMensuales, 'Tendencias Mensuales')

    // Hoja 4: Patrones por Día de la Semana
    const wsDiasSemana = XLSX.utils.json_to_sheet(patronesDiasSemana)
    XLSX.utils.book_append_sheet(workbook, wsDiasSemana, 'Patrones Días Semana')

    // Hoja 5: Patrones por Hora
    const wsHoras = XLSX.utils.json_to_sheet(patronesHorasDia.filter(h => h.Sesiones > 0).sort((a, b) => b.Sesiones - a.Sesiones))
    XLSX.utils.book_append_sheet(workbook, wsHoras, 'Patrones por Hora')

    // Hoja 6: Estacionalidad
    const wsEstacionalidad = XLSX.utils.json_to_sheet(patronesEstacionalidad.filter(m => m.Sesiones > 0).sort((a, b) => b.Sesiones - a.Sesiones))
    XLSX.utils.book_append_sheet(workbook, wsEstacionalidad, 'Estacionalidad')

    // Hoja 7: Estadísticas Generales
    const wsGenerales = XLSX.utils.json_to_sheet(estadisticasGenerales)
    XLSX.utils.book_append_sheet(workbook, wsGenerales, 'Estadísticas Generales')

    // Generar archivo Excel
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    console.log('✅ Excel de tendencias temporales generado exitosamente:', {
      hojas: workbook.SheetNames.length,
      dias_activos: totalDiasActivos,
      sesiones_totales: sesionesDetalladas.length,
      crecimiento_sesiones: crecimientoSesiones.toFixed(1) + '%'
    })

    // Retornar archivo Excel
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="reporte_tendencias_${new Date().toISOString().split('T')[0]}.xlsx"`
      }
    })
    
  } catch (error) {
    console.error('❌ Error exportando Excel de tendencias temporales:', error)
    return NextResponse.json({ 
      error: 'Error exportando tendencias temporales a Excel',
      detalles: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
