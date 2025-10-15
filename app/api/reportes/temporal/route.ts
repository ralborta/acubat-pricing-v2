import { NextRequest, NextResponse } from 'next/server'
import { HistorialPricing } from '../../../../lib/supabase-historial'

export async function GET(request: NextRequest) {
  try {
    console.log('📅 Generando tendencias temporales...')
    
    // Obtener todas las sesiones
    const sesiones = await HistorialPricing.obtenerSesiones(1000)
    
    if (sesiones.length === 0) {
      return NextResponse.json({
        success: true,
        datos: {
          tendencias_diarias: [],
          tendencias_semanales: [],
          tendencias_mensuales: [],
          estadisticas_generales: {
            total_dias_activos: 0,
            promedio_sesiones_por_dia: 0,
            promedio_productos_por_dia: 0,
            dia_mas_activo: '',
            mes_mas_activo: '',
            crecimiento_sesiones: 0,
            crecimiento_productos: 0,
            crecimiento_rentabilidad: 0
          },
          patrones: {
            dias_semana: [],
            horas_dia: [],
            estacionalidad: []
          }
        }
      })
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

    // Calcular estadísticas generales
    const totalDiasActivos = tendenciasDiariasArray.length
    const promedioSesionesPorDia = totalDiasActivos > 0 
      ? tendenciasDiariasArray.reduce((sum, dia) => sum + dia.sesiones, 0) / totalDiasActivos 
      : 0
    const promedioProductosPorDia = totalDiasActivos > 0 
      ? tendenciasDiariasArray.reduce((sum, dia) => sum + dia.productos, 0) / totalDiasActivos 
      : 0

    const diaMasActivo = tendenciasDiariasArray.length > 0 
      ? tendenciasDiariasArray.reduce((max, dia) => dia.sesiones > max.sesiones ? dia : max, tendenciasDiariasArray[0]).fecha
      : ''

    const mesMasActivo = tendenciasMensualesArray.length > 0 
      ? tendenciasMensualesArray.reduce((max, mes) => mes.sesiones > max.sesiones ? mes : max, tendenciasMensualesArray[0]).fecha
      : ''

    // Calcular crecimientos (comparar primer y último período)
    const crecimientoSesiones = tendenciasDiariasArray.length >= 2 
      ? ((tendenciasDiariasArray[tendenciasDiariasArray.length - 1].sesiones - tendenciasDiariasArray[0].sesiones) / tendenciasDiariasArray[0].sesiones) * 100
      : 0

    const crecimientoProductos = tendenciasDiariasArray.length >= 2 
      ? ((tendenciasDiariasArray[tendenciasDiariasArray.length - 1].productos - tendenciasDiariasArray[0].productos) / tendenciasDiariasArray[0].productos) * 100
      : 0

    const crecimientoRentabilidad = tendenciasDiariasArray.length >= 2 
      ? tendenciasDiariasArray[tendenciasDiariasArray.length - 1].rentabilidad_promedio - tendenciasDiariasArray[0].rentabilidad_promedio
      : 0

    // Calcular patrones
    const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
    const patronesDiasSemana = diasSemana.map(dia => ({
      dia,
      sesiones: 0
    }))

    const patronesHorasDia = Array.from({ length: 24 }, (_, i) => ({
      hora: i,
      sesiones: 0
    }))

    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
    const patronesEstacionalidad = meses.map((mes, index) => ({
      mes,
      sesiones: 0
    }))

    // Analizar patrones
    sesionesDetalladas.forEach(sesion => {
      const fecha = new Date(sesion.fecha_procesamiento)
      const diaSemana = fecha.getDay()
      const hora = fecha.getHours()
      const mes = fecha.getMonth()

      patronesDiasSemana[diaSemana].sesiones += 1
      patronesHorasDia[hora].sesiones += 1
      patronesEstacionalidad[mes].sesiones += 1
    })

    const datos = {
      tendencias_diarias: tendenciasDiariasArray,
      tendencias_semanales: tendenciasSemanalesArray,
      tendencias_mensuales: tendenciasMensualesArray,
      estadisticas_generales: {
        total_dias_activos: totalDiasActivos,
        promedio_sesiones_por_dia: promedioSesionesPorDia,
        promedio_productos_por_dia: promedioProductosPorDia,
        dia_mas_activo: diaMasActivo,
        mes_mas_activo: mesMasActivo,
        crecimiento_sesiones: crecimientoSesiones,
        crecimiento_productos: crecimientoProductos,
        crecimiento_rentabilidad: crecimientoRentabilidad
      },
      patrones: {
        dias_semana: patronesDiasSemana,
        horas_dia: patronesHorasDia.filter(h => h.sesiones > 0).sort((a, b) => b.sesiones - a.sesiones),
        estacionalidad: patronesEstacionalidad.filter(m => m.sesiones > 0).sort((a, b) => b.sesiones - a.sesiones)
      }
    }

    console.log('✅ Tendencias temporales generadas:', {
      dias_activos: totalDiasActivos,
      sesiones_totales: sesionesDetalladas.length,
      crecimiento_sesiones: crecimientoSesiones.toFixed(1) + '%',
      dia_mas_activo: diaMasActivo
    })
    
    return NextResponse.json({
      success: true,
      datos: datos
    })
    
  } catch (error) {
    console.error('❌ Error generando tendencias temporales:', error)
    return NextResponse.json({ 
      error: 'Error generando tendencias temporales',
      detalles: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}
