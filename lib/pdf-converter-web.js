// 🚀 CONVERSOR PDF A EXCEL - VERSIÓN SIMPLIFICADA
// Librería para crear plantillas Excel basadas en PDFs
// SIN APIs, SIN backend, 100% frontend

// Importar librerías web-friendly
import * as XLSX from 'xlsx';

// 🎯 FUNCIÓN PRINCIPAL: CREAR PLANTILLA EXCEL BASADA EN PDF
export async function convertirPDFaExcelWeb(archivoPDF) {
  try {
    console.log('🚀 Iniciando creación de plantilla Excel basada en PDF...');
    
    // 📊 CREAR DATOS DE EJEMPLO BASADOS EN EL NOMBRE DEL ARCHIVO
    const nombreArchivo = archivoPDF.name.replace('.pdf', '').toUpperCase();
    
    // Crear datos de ejemplo para la plantilla (más completos)
    const categorias = ['Automotriz', 'Marina', 'Industrial', 'Residencial', 'Comercial'];
    const voltajes = ['6V', '12V', '24V', '48V', 'N/A'];
    const capacidades = ['35Ah', '45Ah', '60Ah', '70Ah', '100Ah', '150Ah', '200Ah', 'N/A'];
    
    const datosExtraidos = [];
    
    // Generar 20 productos de ejemplo con datos variados
    for (let i = 1; i <= 20; i++) {
      const categoria = categorias[i % categorias.length];
      const voltaje = categoria === 'Accesorios' ? 'N/A' : voltajes[i % voltajes.length];
      const capacidad = categoria === 'Accesorios' ? 'N/A' : capacidades[i % capacidades.length];
      
      // Generar precios realistas
      let precioBase;
      if (categoria === 'Automotriz') precioBase = 120000 + (i * 5000);
      else if (categoria === 'Marina') precioBase = 180000 + (i * 8000);
      else if (categoria === 'Industrial') precioBase = 250000 + (i * 12000);
      else if (categoria === 'Residencial') precioBase = 80000 + (i * 3000);
      else precioBase = 15000 + (i * 2000);
      
      datosExtraidos.push({
        codigo: `PROD${String(i).padStart(3, '0')}`,
        descripcion: `${categoria} ${nombreArchivo} - Modelo ${i}`,
        precio_lista: precioBase,
        categoria: categoria,
        voltaje: voltaje,
        capacidad: capacidad,
        stock: Math.floor(Math.random() * 50) + 10,
        proveedor: `Proveedor ${String.fromCharCode(65 + (i % 26))}`,
        fecha_actualizacion: new Date().toLocaleDateString()
      });
    }
    
    console.log(`✅ Plantilla creada con ${datosExtraidos.length} productos de ejemplo`);
    
    // 📈 GENERAR EXCEL USANDO XLSX
    console.log('📈 Generando archivo Excel...');
    
    // Crear workbook
    const workbook = XLSX.utils.book_new();
    
    // Crear hoja de productos
    const worksheet = XLSX.utils.json_to_sheet(datosExtraidos);
    
    // Aplicar estilos y formatos
    worksheet['!cols'] = [
      { width: 15 }, // código
      { width: 45 }, // descripción
      { width: 15 }, // precio_lista
      { width: 20 }, // categoría
      { width: 10 }, // voltaje
      { width: 10 }, // capacidad
      { width: 10 }, // stock
      { width: 20 }, // proveedor
      { width: 20 }  // fecha_actualizacion
    ];
    
    // Agregar hoja al workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Productos');
    
    // Crear hoja de resumen
    const resumen = [
      { metrica: 'Total Productos', valor: datosExtraidos.length },
      { metrica: 'Archivo Original', valor: archivoPDF.name },
      { metrica: 'Fecha de Creación', valor: new Date().toLocaleDateString() },
      { metrica: 'Tipo', valor: 'Plantilla de Ejemplo' }
    ];
    
    const worksheetResumen = XLSX.utils.json_to_sheet(resumen);
    XLSX.utils.book_append_sheet(workbook, worksheetResumen, 'Resumen');
    
    // Crear hoja de instrucciones
    const instrucciones = [
      { paso: 1, instruccion: 'Reemplaza los datos de ejemplo con tus productos reales' },
      { paso: 2, instruccion: 'Mantén el formato de columnas para compatibilidad' },
      { paso: 3, instruccion: 'Guarda el archivo y úsalo en el siguiente proceso' }
    ];
    
    const worksheetInstrucciones = XLSX.utils.json_to_sheet(instrucciones);
    XLSX.utils.book_append_sheet(workbook, worksheetInstrucciones, 'Instrucciones');
    
    // Generar archivo Excel
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    
    console.log('✅ Archivo Excel generado exitosamente');
    
    return {
      success: true,
      data: {
        buffer: excelBuffer,
        filename: `plantilla_${nombreArchivo}_${Date.now()}.xlsx`,
        productos: datosExtraidos.length,
        resumen: resumen,
        textoCompleto: ['Plantilla creada automáticamente']
      }
    };
    
  } catch (error) {
    console.error('❌ Error en creación de plantilla Excel:', error);
    return {
      success: false,
      error: `Error en creación: ${error instanceof Error ? error.message : 'Error desconocido'}`
    };
  }
}

// 🎯 FUNCIÓN AUXILIAR: DESCARGAR ARCHIVO
export function descargarArchivo(buffer, filename, tipoMIME) {
  try {
    // Crear blob
    const blob = new Blob([buffer], { type: tipoMIME });
    
    // Crear URL y descargar
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    console.log(`✅ Archivo descargado: ${filename}`);
    return true;
    
  } catch (error) {
    console.error('❌ Error descargando archivo:', error);
    return false;
  }
}

// 🎯 FUNCIÓN AUXILIAR: VALIDAR ARCHIVO PDF
export function validarArchivoPDF(archivo) {
  if (!archivo) {
    return { valido: false, error: 'No se seleccionó ningún archivo' };
  }
  
  if (!archivo.type.includes('pdf') && !archivo.name.toLowerCase().endsWith('.pdf')) {
    return { valido: false, error: 'El archivo debe ser un PDF' };
  }
  
  if (archivo.size > 50 * 1024 * 1024) { // 50MB máximo
    return { valido: false, error: 'El archivo es demasiado grande (máximo 50MB)' };
  }
  
  return { valido: true, archivo };
}

// 📋 EXPORTAR FUNCIONES
export default {
  convertirPDFaExcelWeb,
  descargarArchivo,
  validarArchivoPDF
};
