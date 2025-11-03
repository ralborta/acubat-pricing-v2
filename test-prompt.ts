#!/usr/bin/env node
/**
 * Script de prueba para verificar el JSON generado por mapColumnsStrict
 * 
 * Uso: 
 *   npx tsx test-prompt.ts <ruta-al-archivo.xlsx>
 *   O con ts-node: npx ts-node test-prompt.ts <ruta-al-archivo.xlsx>
 * 
 * Ejemplo: 
 *   npx tsx test-prompt.ts "./test-files/yuasa.xlsx"
 */

import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

// Cargar variables de entorno
try {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const match = trimmed.match(/^([^#=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim().replace(/^["']|["']$/g, '');
          if (key && value && !process.env[key]) {
            process.env[key] = value;
          }
        }
      }
    });
    console.log('✅ Variables de entorno cargadas desde .env.local');
    if (process.env.OPENAI_API_KEY) {
      console.log('✅ OPENAI_API_KEY encontrada (longitud:', process.env.OPENAI_API_KEY.length, 'caracteres)');
    } else {
      console.warn('⚠️ OPENAI_API_KEY no encontrada en .env.local');
    }
  } else {
    console.warn('⚠️ Archivo .env.local no existe');
  }
} catch (e: any) {
  console.warn('⚠️ Error cargando .env.local:', e.message);
}

// Importar dinámicamente para evitar problemas de compilación
async function runTest() {
  const { mapColumnsStrict } = await import('./app/lib/pricing_mapper');
  return mapColumnsStrict;
}

async function testPrompt(filePath: string) {
  console.log('🔍 Leyendo archivo:', filePath);
  
  if (!fs.existsSync(filePath)) {
    console.error('❌ El archivo no existe:', filePath);
    process.exit(1);
  }

  // Leer archivo Excel
  const workbook = XLSX.readFile(filePath, {
    type: 'buffer',
    raw: false,
    cellDates: true,
    cellText: false,
    dense: true,
    sheetStubs: true,
  });

  console.log('📘 Hojas encontradas:', workbook.SheetNames);

  if (workbook.SheetNames.length === 0) {
    console.error('❌ El archivo no tiene hojas');
    process.exit(1);
  }

  // Buscar hoja con datos, priorizar hoja YUASA si existe
  let sheetName = workbook.SheetNames[0];
  const yuasaSheet = workbook.SheetNames.find(s => s.toLowerCase().includes('yuasa'));
  if (yuasaSheet) {
    sheetName = yuasaSheet;
    console.log('✅ Encontrada hoja YUASA:', sheetName);
  } else {
    // Buscar primera hoja con datos
    for (const name of workbook.SheetNames) {
      const ws = workbook.Sheets[name];
      const data = XLSX.utils.sheet_to_json(ws, { defval: '' });
      if (data.length > 0) {
        sheetName = name;
        break;
      }
    }
  }
  const worksheet = workbook.Sheets[sheetName];
  
  console.log('\n📄 Procesando hoja:', sheetName);

  // Leer datos (usar método similar al del sistema)
  const datos = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false });
  
  if (datos.length === 0) {
    console.error('❌ La hoja está vacía');
    process.exit(1);
  }

  // Extraer headers
  const headers = Object.keys(datos[0] as any).filter(h => h && !h.startsWith('__'));
  
  console.log('\n📋 Headers encontrados:', headers);
  console.log('\n📊 Muestra de datos (primeras 3 filas):');
  console.log(JSON.stringify(datos.slice(0, 3), null, 2));

  // Preparar muestra para la IA (primeras 10 filas)
  const muestra = datos.slice(0, 10).map((row: any) => {
    const cleaned: any = {};
    for (const key of Object.keys(row)) {
      if (!key.startsWith('__')) {
        cleaned[key] = row[key];
      }
    }
    return cleaned;
  });

  console.log('\n🧠 Ejecutando mapColumnsStrict...');
  console.log('   - Headers:', headers.length);
  console.log('   - Muestra:', muestra.length, 'filas');
  console.log('   - Nombre archivo:', path.basename(filePath));
  
  try {
    // Inferir vendor hint
    const fileName = path.basename(filePath).toLowerCase();
    let vendorHint = '';
    if (fileName.includes('moura')) vendorHint = 'MOURA';
    else if (fileName.includes('liqui') || fileName.includes('aditivos')) vendorHint = 'ADITIVOS|LIQUI MOLY';
    else if (fileName.includes('varta')) vendorHint = 'VARTA';
    else if (fileName.includes('yuasa')) vendorHint = 'YUASA';

    console.log('   - Vendor Hint:', vendorHint || 'Ninguno');

    const mapColumnsStrictFn = await runTest();
    
    // Ejecutar con umbrales más bajos para ver el resultado
    let result;
    try {
      const response = await mapColumnsStrictFn({
        columnas: headers,
        muestra: muestra,
        nombreArchivo: path.basename(filePath),
        vendorHint: vendorHint || undefined,
        model: 'gpt-4o-mini',
        minConfidence: 0.5,  // Bajar umbral para ver resultado
        minPriceMax: 50000  // Bajar umbral para ver resultado
      });
      result = response.result;
    } catch (e: any) {
      console.warn('⚠️ Error en mapColumnsStrict, pero intentando mostrar resultado parcial...');
      // Si hay un error pero el JSON se generó, intentar extraerlo del mensaje
      if (e.message && e.message.includes('Post-check')) {
        console.warn('⚠️ Post-check falló, pero el JSON puede estar disponible');
        throw e; // Relanzar para que el usuario vea el error completo
      }
      throw e;
    }

    console.log('\n✅ JSON GENERADO POR LA IA:');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(JSON.stringify(result, null, 2));
    console.log('═══════════════════════════════════════════════════════════════');

    // Resumen
    console.log('\n📊 RESUMEN:');
    console.log('   - Tipo:', result.tipo || 'NULL');
    console.log('   - Modelo:', result.modelo || 'NULL');
    console.log('   - Precio ARS:', result.precio_ars || 'NULL');
    console.log('   - Descripción:', result.descripcion || 'NULL');
    console.log('   - Identificador:', result.identificador || 'NULL');
    console.log('   - Marca:', result.marca || 'NULL');
    console.log('   - Confianza:', result.confianza);

    // Verificar si hay evidencia de descripción y marca
    if (result.evidencia) {
      console.log('\n🔍 EVIDENCIA:');
      if ((result.evidencia as any).descripcion) {
        console.log('   - Descripción:', JSON.stringify((result.evidencia as any).descripcion));
      } else {
        console.log('   - Descripción: NO HAY EVIDENCIA EN EL SCHEMA');
      }
      if ((result.evidencia as any).marca) {
        console.log('   - Marca:', JSON.stringify((result.evidencia as any).marca));
      } else {
        console.log('   - Marca: NO HAY EVIDENCIA EN EL SCHEMA');
      }
    }

  } catch (error: any) {
    console.error('\n❌ ERROR al ejecutar mapColumnsStrict:');
    console.error(error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Ejecutar
const filePath = process.argv[2];
if (!filePath) {
  console.error('❌ Por favor, proporciona la ruta del archivo Excel');
  console.error('Uso: npx tsx test-prompt.ts <ruta-al-archivo.xlsx>');
  process.exit(1);
}

testPrompt(filePath).catch(err => {
  console.error('❌ Error fatal:', err);
  process.exit(1);
});

