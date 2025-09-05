import fs from 'fs';
import path from 'path';

class SimpleFileStorage {
  constructor() {
    this.storageFile = path.join(process.cwd(), 'data', 'pendingFiles.json');
    this.resultsDir = path.join(process.cwd(), 'data', 'results');
    this.ensureDirectories();
  }

  // Crear directorios si no existen
  ensureDirectories() {
    const dataDir = path.dirname(this.storageFile);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(this.resultsDir)) {
      fs.mkdirSync(this.resultsDir, { recursive: true });
    }
  }

  // Guardar archivo subido
  async saveFile(fileData) {
    try {
      const files = await this.getPendingFiles();
      
      const newFile = {
        id: Date.now().toString(),
        nombre: fileData.nombre,
        contenido: fileData.contenido, // base64
        fechaSubida: new Date().toISOString(),
        procesado: false,
        usuario: fileData.usuario || 'admin@acubat.com',
        tipo: fileData.tipo || 'csv',
        tamano: fileData.tamano || 0
      };

      files.push(newFile);
      await this.savePendingFiles(files);

      console.log(`📁 Archivo guardado: ${newFile.nombre} (ID: ${newFile.id})`);
      return newFile;
    } catch (error) {
      console.error('❌ Error guardando archivo:', error);
      throw error;
    }
  }

  // Obtener archivos pendientes
  async getPendingFiles() {
    try {
      if (!fs.existsSync(this.storageFile)) {
        return [];
      }
      
      const data = fs.readFileSync(this.storageFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('❌ Error leyendo archivos pendientes:', error);
      return [];
    }
  }

  // Guardar lista de archivos pendientes
  async savePendingFiles(files) {
    try {
      fs.writeFileSync(this.storageFile, JSON.stringify(files, null, 2));
    } catch (error) {
      console.error('❌ Error guardando archivos pendientes:', error);
      throw error;
    }
  }

  // Marcar archivo como procesado
  async markAsProcessed(fileId, resultado) {
    try {
      const files = await this.getPendingFiles();
      const fileIndex = files.findIndex(f => f.id === fileId);
      
      if (fileIndex !== -1) {
        files[fileIndex].procesado = true;
        files[fileIndex].fechaProcesado = new Date().toISOString();
        files[fileIndex].resultado = resultado;
        
        await this.savePendingFiles(files);
        
        // Guardar resultado en archivo separado
        await this.saveResult(fileId, resultado);
        
        console.log(`✅ Archivo marcado como procesado: ${files[fileIndex].nombre}`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Error marcando archivo como procesado:', error);
      return false;
    }
  }

  // Guardar resultado del procesamiento
  async saveResult(fileId, resultado) {
    try {
      const resultFile = path.join(this.resultsDir, `${fileId}_resultado.json`);
      fs.writeFileSync(resultFile, JSON.stringify(resultado, null, 2));
      
      console.log(`📋 Resultado guardado: ${resultFile}`);
    } catch (error) {
      console.error('❌ Error guardando resultado:', error);
    }
  }

  // Obtener archivos no procesados
  async getUnprocessedFiles() {
    const files = await this.getPendingFiles();
    return files.filter(f => !f.procesado);
  }

  // Obtener archivo por ID
  async getFileById(fileId) {
    const files = await this.getPendingFiles();
    return files.find(f => f.id === fileId);
  }

  // Eliminar archivo procesado
  async deleteProcessedFile(fileId) {
    try {
      const files = await this.getPendingFiles();
      const filteredFiles = files.filter(f => f.id !== fileId);
      await this.savePendingFiles(filteredFiles);
      
      console.log(`🗑️ Archivo eliminado: ${fileId}`);
      return true;
    } catch (error) {
      console.error('❌ Error eliminando archivo:', error);
      return false;
    }
  }

  // Limpiar archivos antiguos (más de 30 días)
  async cleanupOldFiles() {
    try {
      const files = await this.getPendingFiles();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentFiles = files.filter(f => {
        const fileDate = new Date(f.fechaSubida);
        return fileDate > thirtyDaysAgo;
      });
      
      if (recentFiles.length < files.length) {
        await this.savePendingFiles(recentFiles);
        console.log(`🧹 Limpieza: ${files.length - recentFiles.length} archivos antiguos eliminados`);
      }
    } catch (error) {
      console.error('❌ Error en limpieza:', error);
    }
  }
}

// Instancia global del storage
const fileStorage = new SimpleFileStorage();

export default fileStorage;
