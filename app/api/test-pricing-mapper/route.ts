import { NextRequest, NextResponse } from 'next/server';
import { mapColumnsStrict } from '../../lib/pricing_mapper';

export async function POST(request: NextRequest) {
  try {
    console.log('🧠 ========================================');
    console.log('🧠 TEST ENDPOINT: PRICING_MAPPER');
    console.log('🧠 ========================================');

    // 📋 DATOS DE PRUEBA REALES
    const columnas = [
      "TIPO", 
      "Denominacion Comercial", 
      "__EMPTY_2", 
      "Unidades por Pallet", 
      "Kg por Pallet"
    ];

    const hojas = ["ListaVarta", "Equivalencias"];

    const muestra = [
      { 
        "TIPO": "Ca Ag Blindada", 
        "Denominacion Comercial": "UB 670 Ag", 
        "__EMPTY_2": 188992, 
        "Unidades por Pallet": 24 
      },
      { 
        "TIPO": "J.I.S. Baterías", 
        "Denominacion Comercial": "VA40DD/E", 
        "__EMPTY_2": 156535, 
        "Unidades por Pallet": 20 
      }
    ];

    console.log('\n📋 DATOS DE ENTRADA:');
    console.log('   - Columnas:', columnas);
    console.log('   - Hojas:', hojas);
    console.log('   - Muestra:', JSON.stringify(muestra, null, 2));

    console.log('\n🚀 LLAMANDO A MAPCOLUMNSSTRICT...');

    // 🎯 LLAMADA AL MÓDULO
    const { result, attempts } = await mapColumnsStrict({ 
      columnas, 
      hojas, 
      muestra, 
      maxRetries: 1 
    });

    console.log('\n✅ RESULTADO EXITOSO:');
    console.log('🔄 Intentos realizados:', attempts);
    console.log('📋 Resultado completo:', JSON.stringify(result, null, 2));

    // 🔍 ANÁLISIS DEL RESULTADO
    console.log('\n🔍 ANÁLISIS DEL RESULTADO:');
    console.log('   - Tipo detectado:', result.tipo || 'NO DETECTADO');
    console.log('   - Modelo detectado:', result.modelo || 'NO DETECTADO');
    console.log('   - Precio detectado:', result.precio_ars || 'NO DETECTADO');
    console.log('   - Descripción detectada:', result.descripcion || 'NO DETECTADA');
    console.log('   - Evidencia:', result.evidencia || 'NO DISPONIBLE');
    console.log('   - Confianza:', result.confianza || 'NO DISPONIBLE');

    // ✅ VALIDACIÓN FINAL
    console.log('\n✅ VALIDACIÓN FINAL:');
    if (result.tipo && result.modelo && result.precio_ars) {
      console.log('🎯 TODAS LAS COLUMNAS PRINCIPALES DETECTADAS');
    } else {
      console.log('⚠️ FALTAN COLUMNAS PRINCIPALES');
    }

    console.log('\n🎉 TEST COMPLETADO EXITOSAMENTE!');

    return NextResponse.json({
      success: true,
      test: 'pricing_mapper',
      timestamp: new Date().toISOString(),
      input: { columnas, hojas, muestra },
      result: { result, attempts },
      analysis: {
        tipo_detectado: result.tipo || 'NO DETECTADO',
        modelo_detectado: result.modelo || 'NO DETECTADO',
        precio_detectado: result.precio_ars || 'NO DETECTADO',
        descripcion_detectada: result.descripcion || 'NO DETECTADA',
        evidencia: result.evidencia || 'NO DISPONIBLE',
        confianza: result.confianza || 'NO DISPONIBLE'
      }
    });

  } catch (error: any) {
    console.error('\n❌ ERROR EN EL TEST:');
    console.error('   - Mensaje:', error.message);
    console.error('   - Tipo:', error.constructor.name);
    console.error('   - Stack:', error.stack);

    return NextResponse.json({
      success: false,
      test: 'pricing_mapper',
      timestamp: new Date().toISOString(),
      error: {
        message: error.message,
        type: error.constructor.name,
        stack: error.stack
      }
    }, { status: 500 });
  }
}
