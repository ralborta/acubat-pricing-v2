import { NextRequest, NextResponse } from 'next/server'

interface Transaccion {
  id: string
  fecha: string
  monto: number
  descripcion: string
  referencia: string
  tipo: 'transacciones' | 'bancario'
  conciliada?: boolean
  bancoConciliado?: string
  coincidencia?: string
}

interface ConciliacionResultado {
  banco: string
  totalTransacciones: number
  conciliadas: number
  pendientes: number
  porcentaje: number
  detalles: Transaccion[]
  tiempoProcesamiento: number
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { bancos, transacciones, movimientosBancarios } = await request.json()

    if (!bancos || !Array.isArray(bancos) || bancos.length === 0) {
      return NextResponse.json({ error: 'No se proporcionaron bancos' }, { status: 400 })
    }

    if (!transacciones || !Array.isArray(transacciones)) {
      return NextResponse.json({ error: 'No se proporcionaron transacciones' }, { status: 400 })
    }

    if (!movimientosBancarios || !Array.isArray(movimientosBancarios)) {
      return NextResponse.json({ error: 'No se proporcionaron movimientos bancarios' }, { status: 400 })
    }

    console.log(`🔄 Iniciando conciliación con ${bancos.length} bancos`)
    console.log(`📊 Transacciones: ${transacciones.length}`)
    console.log(`🏦 Movimientos bancarios: ${movimientosBancarios.length}`)

    const resultados: ConciliacionResultado[] = []
    let transaccionesPendientes = [...transacciones]

    // Procesar cada banco secuencialmente
    for (let i = 0; i < bancos.length; i++) {
      const banco = bancos[i]
      const inicioTiempo = Date.now()
      
      console.log(`\n🏦 Procesando banco ${i + 1}/${bancos.length}: ${banco.nombre}`)

      // Filtrar movimientos del banco actual
      const movimientosBanco = movimientosBancarios.filter((mov: any) => 
        mov.banco === banco.nombre || mov.banco === banco.codigo
      )

      console.log(`📋 Movimientos del banco: ${movimientosBanco.length}`)

      // Algoritmo de conciliación
      const transaccionesConciliadas: Transaccion[] = []
      const transaccionesNoConciliadas: Transaccion[] = []

      for (const transaccion of transaccionesPendientes) {
        let conciliada = false
        let mejorCoincidencia = null
        let mejorScore = 0

        // Buscar coincidencias en movimientos bancarios
        for (const movimiento of movimientosBanco) {
          const score = calcularScoreConciliacion(transaccion, movimiento, banco)
          
          if (score > mejorScore && score >= 0.8) { // Umbral de coincidencia
            mejorScore = score
            mejorCoincidencia = movimiento
          }
        }

        if (mejorCoincidencia) {
          // Marcar como conciliada
          const transaccionConciliada = {
            ...transaccion,
            conciliada: true,
            bancoConciliado: banco.nombre,
            coincidencia: mejorCoincidencia.id || mejorCoincidencia.referencia
          }
          transaccionesConciliadas.push(transaccionConciliada)
          conciliada = true
        } else {
          // Mantener como pendiente
          transaccionesNoConciliadas.push(transaccion)
        }
      }

      const tiempoProcesamiento = Date.now() - inicioTiempo
      const totalTransacciones = transaccionesPendientes.length
      const conciliadas = transaccionesConciliadas.length
      const pendientes = transaccionesNoConciliadas.length
      const porcentaje = totalTransacciones > 0 ? (conciliadas / totalTransacciones) * 100 : 0

      const resultado: ConciliacionResultado = {
        banco: banco.nombre,
        totalTransacciones,
        conciliadas,
        pendientes,
        porcentaje: Math.round(porcentaje * 100) / 100,
        detalles: transaccionesConciliadas,
        tiempoProcesamiento
      }

      resultados.push(resultado)

      // Actualizar transacciones pendientes para el siguiente banco
      transaccionesPendientes = transaccionesNoConciliadas

      console.log(`✅ Banco ${banco.nombre} completado:`)
      console.log(`   - Conciliadas: ${conciliadas}/${totalTransacciones} (${porcentaje.toFixed(1)}%)`)
      console.log(`   - Pendientes: ${pendientes}`)
      console.log(`   - Tiempo: ${tiempoProcesamiento}ms`)
    }

    // Resumen final
    const totalConciliadas = resultados.reduce((sum, r) => sum + r.conciliadas, 0)
    const totalPendientes = transaccionesPendientes.length
    const totalTransacciones = transacciones.length
    const porcentajeGeneral = (totalConciliadas / totalTransacciones) * 100

    console.log(`\n🎯 CONCILIACIÓN COMPLETADA:`)
    console.log(`   - Total transacciones: ${totalTransacciones}`)
    console.log(`   - Conciliadas: ${totalConciliadas} (${porcentajeGeneral.toFixed(1)}%)`)
    console.log(`   - Pendientes: ${totalPendientes}`)
    console.log(`   - Bancos procesados: ${resultados.length}`)

    return NextResponse.json({
      success: true,
      resumen: {
        totalTransacciones,
        totalConciliadas,
        totalPendientes,
        porcentajeGeneral: Math.round(porcentajeGeneral * 100) / 100,
        bancosProcesados: resultados.length
      },
      resultados,
      transaccionesPendientes,
      mensaje: 'Conciliación completada exitosamente'
    })

  } catch (error) {
    console.error('❌ Error en conciliación:', error)
    return NextResponse.json({ 
      error: 'Error interno del servidor',
      detalles: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 })
  }
}

// Función para calcular el score de conciliación entre una transacción y un movimiento bancario
function calcularScoreConciliacion(
  transaccion: Transaccion, 
  movimiento: any, 
  banco: any
): number {
  let score = 0
  let factores = 0

  // Factor 1: Coincidencia exacta de monto (peso: 40%)
  const diferenciaMonto = Math.abs(transaccion.monto - (movimiento.monto || 0))
  const toleranciaMonto = banco.toleranciaMonto || 0.01
  
  if (diferenciaMonto <= toleranciaMonto) {
    score += 0.4
  } else {
    // Penalizar por diferencia de monto
    const penalizacion = Math.min(diferenciaMonto / transaccion.monto, 1)
    score += Math.max(0, 0.4 - penalizacion * 0.4)
  }
  factores++

  // Factor 2: Coincidencia de fecha (peso: 30%)
  const fechaTransaccion = new Date(transaccion.fecha)
  const fechaMovimiento = new Date(movimiento.fecha || movimiento.Fecha)
  const diferenciaDias = Math.abs(fechaTransaccion.getTime() - fechaMovimiento.getTime()) / (1000 * 60 * 60 * 24)
  const toleranciaDias = banco.toleranciaDias || 1
  
  if (diferenciaDias <= toleranciaDias) {
    score += 0.3
  } else {
    // Penalizar por diferencia de fecha
    const penalizacion = Math.min(diferenciaDias / 30, 1) // Máximo 30 días de penalización
    score += Math.max(0, 0.3 - penalizacion * 0.3)
  }
  factores++

  // Factor 3: Coincidencia de referencia (peso: 20%)
  const refTransaccion = (transaccion.referencia || '').toLowerCase()
  const refMovimiento = (movimiento.referencia || movimiento.Referencia || '').toLowerCase()
  
  if (refTransaccion && refMovimiento) {
    if (refTransaccion === refMovimiento) {
      score += 0.2
    } else if (refTransaccion.includes(refMovimiento) || refMovimiento.includes(refTransaccion)) {
      score += 0.1
    }
  }
  factores++

  // Factor 4: Coincidencia de descripción (peso: 10%)
  const descTransaccion = (transaccion.descripcion || '').toLowerCase()
  const descMovimiento = (movimiento.descripcion || movimiento.Descripcion || '').toLowerCase()
  
  if (descTransaccion && descMovimiento) {
    const palabrasComunes = descTransaccion.split(' ').filter(palabra => 
      descMovimiento.includes(palabra) && palabra.length > 3
    ).length
    const totalPalabras = descTransaccion.split(' ').length
    
    if (totalPalabras > 0) {
      score += (palabrasComunes / totalPalabras) * 0.1
    }
  }
  factores++

  return score
}
