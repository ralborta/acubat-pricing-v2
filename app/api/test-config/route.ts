import { NextRequest, NextResponse } from 'next/server'

// 🎯 FUNCIÓN PARA OBTENER CONFIGURACIÓN CON FALLBACK ROBUSTO (COPIA DE LA FUNCIÓN PRINCIPAL)
async function obtenerConfiguracion() {
  try {
    // 🚀 PRIMER INTENTO: Cargar desde Supabase con timeout
    console.log('🔍 Intentando cargar configuración desde Supabase...');
    const configPromise = (async () => {
      const { default: configManager } = await import('../../../lib/configManagerSupabase');
      const configManagerInstance = new configManager();
      return await configManagerInstance.getCurrentConfig();
    })();
    
    // Timeout de 10 segundos para la configuración
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout obteniendo configuración')), 10000)
    );
    
    const config = await Promise.race([configPromise, timeoutPromise]);
    console.log('✅ Configuración cargada desde Supabase:', config);
    return config;
    
  } catch (error) {
    console.error('❌ Error cargando desde Supabase:', error);
    
    try {
      // 🔄 SEGUNDO INTENTO: Cargar desde archivo local
      console.log('🔍 Intentando cargar configuración desde archivo local...');
      const fs = await import('fs');
      const path = await import('path');
      
      const configPath = path.join(process.cwd(), 'config', 'configuracion.json');
      const configData = fs.readFileSync(configPath, 'utf8');
      const config = JSON.parse(configData);
      
      console.log('✅ Configuración cargada desde archivo local:', config);
      return config;
      
    } catch (localError) {
      console.error('❌ Error cargando desde archivo local:', localError);
      
      try {
        // 🔄 TERCER INTENTO: Cargar desde ConfigManager local
        console.log('🔍 Intentando cargar configuración desde ConfigManager local...');
        const configManager = await import('../../../lib/configManagerLocal');
        const config = await configManager.default.getCurrentConfig();
        
        console.log('✅ Configuración cargada desde ConfigManager local:', config);
        return config;
        
      } catch (managerError) {
        console.error('❌ Error cargando desde ConfigManager local:', managerError);
        console.log('⚠️ Usando valores por defecto como último recurso');
        
        // ÚLTIMO RECURSO: Valores por defecto hardcodeados
        return {
          iva: 21,
          markups: { mayorista: 22, directa: 60, distribucion: 20 },
          factoresVarta: { factorBase: 40, capacidad80Ah: 35 },
          promociones: false,
          comisiones: { mayorista: 5, directa: 8, distribucion: 6 }
        };
      }
    }
  }
}

export async function GET() {
  try {
    console.log('🧪 INICIANDO PRUEBA DE CONFIGURACIÓN...')
    
    const config = await obtenerConfiguracion();
    
    // Probar cálculo de pricing con la configuración cargada
    const precioBase = 100000;
    const canal = 'mayorista';
    
    const iva = config.iva || 21;
    const markup = config.markups?.mayorista || 22;
    const comision = config.comisiones?.mayorista || 5;
    
    const precioConIva = precioBase * (1 + iva / 100);
    const precioConMarkup = precioConIva * (1 + markup / 100);
    const precioFinal = precioConMarkup * (1 + comision / 100);
    
    const resultado = {
      configuracion: config,
      prueba_calculo: {
        precioBase,
        canal,
        iva,
        markup,
        comision,
        precioConIva: Math.round(precioConIva),
        precioConMarkup: Math.round(precioConMarkup),
        precioFinal: Math.round(precioFinal)
      },
      fuente_configuracion: config.ultimaActualizacion ? 'Base de datos' : 'Valores por defecto',
      timestamp: new Date().toISOString()
    };
    
    console.log('✅ PRUEBA COMPLETADA:', resultado);
    
    return NextResponse.json({
      success: true,
      message: 'Prueba de configuración completada exitosamente',
      data: resultado
    });
    
  } catch (error) {
    console.error('❌ Error en prueba de configuración:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido',
      data: null
    }, { status: 500 });
  }
}
