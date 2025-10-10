import cron from 'node-cron';
import { DateTime } from 'luxon';
import fileStorage from './fileStorage.js';

class BusinessScheduler {
  constructor() {
    this.schedules = new Map();
    this.isOpen = false;
    this.currentSchedule = null;
  }

  // Crear un nuevo horario de negocio
  createSchedule(scheduleData) {
    const {
      name,
      timezone = 'America/Argentina/Buenos_Aires',
      byDay = ['MO', 'TU', 'WE', 'TH', 'FR'], // Lunes a Viernes por defecto
      start = '09:00',
      end = '18:00',
      rdates = [], // Fechas especiales (incluir)
      exdates = [] // Fechas a excluir
    } = scheduleData;

    const schedule = {
      id: Date.now().toString(),
      name,
      timezone,
      byDay,
      start,
      end,
      rdates,
      exdates,
      cronExpression: this.generateCronExpression(byDay, start, end),
      createdAt: DateTime.now().setZone(timezone)
    };

    this.schedules.set(schedule.id, schedule);
    this.scheduleJobs(schedule);
    
    return schedule;
  }

  // Generar expresión cron basada en días y horarios
  generateCronExpression(byDay, start, end) {
    const dayMap = {
      'MO': '1', // Lunes
      'TU': '2', // Martes
      'WE': '3', // Miércoles
      'TH': '4', // Jueves
      'FR': '5', // Viernes
      'SA': '6', // Sábado
      'SU': '0'  // Domingo
    };

    const days = byDay.map(day => dayMap[day]).join(',');
    const [startHour, startMinute] = start.split(':');
    const [endHour, endMinute] = end.split(':');

    return {
      open: `${startMinute} ${startHour} * * ${days}`,
      close: `${endMinute} ${endHour} * * ${days}`
    };
  }

  // Programar jobs de apertura y cierre
  scheduleJobs(schedule) {
    const { cronExpression } = schedule;

    // Job de ejecución de pricing
    cron.schedule(cronExpression.open, () => {
      this.executePricingProcess(schedule);
    }, {
      timezone: schedule.timezone
    });

    // Job de finalización de pricing (opcional, para limpieza)
    cron.schedule(cronExpression.close, () => {
      this.finishPricingProcess(schedule);
    }, {
      timezone: schedule.timezone
    });

    // Programar fechas especiales (RDATE)
    this.scheduleSpecialDates(schedule);

    console.log(`✅ HORARIO DE PRICING PROGRAMADO: ${schedule.name}`);
    console.log(`   Ejecución: ${schedule.start} - Finalización: ${schedule.end}`);
    console.log(`   Días: ${schedule.byDay.join(', ')}`);
    console.log(`   Proceso: Análisis automático de pricing`);
  }

  // Programar fechas especiales
  scheduleSpecialDates(schedule) {
    schedule.rdates.forEach(dateStr => {
      const date = DateTime.fromISO(dateStr).setZone(schedule.timezone);
      const [startHour, startMinute] = schedule.start.split(':');
      const [endHour, endMinute] = schedule.end.split(':');

      // Ejecución de pricing en fecha especial
      const pricingTime = date.set({ hour: parseInt(startHour), minute: parseInt(startMinute) });
      if (pricingTime > DateTime.now()) {
        setTimeout(() => {
          this.executePricingProcess(schedule);
        }, pricingTime.diff(DateTime.now()).toMillis());
      }

      // Finalización de pricing en fecha especial (opcional)
      const finishTime = date.set({ hour: parseInt(endHour), minute: parseInt(endMinute) });
      if (finishTime > DateTime.now()) {
        setTimeout(() => {
          this.finishPricingProcess(schedule);
        }, finishTime.diff(DateTime.now()).toMillis());
      }
    });
  }

  // Ejecutar proceso de pricing
  async executePricingProcess(schedule) {
    this.currentSchedule = schedule;
    
    console.log(`🚀 EJECUTANDO PROCESO DE PRICING AUTOMÁTICO`);
    console.log(`   Horario: ${schedule.name}`);
    console.log(`   Hora: ${DateTime.now().setZone(schedule.timezone).toFormat('HH:mm')}`);
    console.log(`   Timezone: ${schedule.timezone}`);
    
    try {
      // 1. Obtener archivos pendientes de procesamiento
      console.log(`   📁 Buscando archivos pendientes...`);
      const archivosPendientes = await fileStorage.getUnprocessedFiles();
      
      if (archivosPendientes.length === 0) {
        console.log(`   ℹ️ No hay archivos pendientes de procesamiento`);
        return;
      }
      
      console.log(`   📊 Archivos encontrados: ${archivosPendientes.length}`);
      
      // 2. Procesar cada archivo pendiente
      for (const archivo of archivosPendientes) {
        console.log(`\n   🔄 Procesando archivo: ${archivo.nombre}`);
        
        try {
          // Convertir base64 a buffer
          const buffer = Buffer.from(archivo.contenido, 'base64');
          
          // Crear FormData para la API
          const FormData = await import('form-data');
          const formData = new FormData();
          formData.append('file', buffer, {
            filename: archivo.nombre,
            contentType: archivo.tipo === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          });
          
          // Llamar a tu API de pricing existente
          const baseUrl = process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
          const url = `${baseUrl.replace(/\/$/, '')}/api/pricing/procesar-archivo`
          console.log(`   ⚙️ Llamando a API de pricing: ${url}`);
          const response = await fetch(url, {
            method: 'POST',
            body: formData
          });
          
          if (response.ok) {
            const resultado = await response.json();
            
            // Marcar archivo como procesado
            await fileStorage.markAsProcessed(archivo.id, resultado);
            
            console.log(`   ✅ Archivo procesado exitosamente: ${archivo.nombre}`);
            console.log(`   📊 Productos procesados: ${resultado.productos?.length || 0}`);
            
          } else {
            console.error(`   ❌ Error procesando archivo: ${archivo.nombre}`);
            console.error(`   📋 Respuesta: ${response.status} ${response.statusText}`);
          }
          
        } catch (error) {
          console.error(`   ❌ Error procesando archivo ${archivo.nombre}:`, error.message);
        }
      }
      
      console.log(`\n✅ PROCESO DE PRICING COMPLETADO EXITOSAMENTE`);
      console.log(`   📁 Archivos procesados: ${archivosPendientes.length}`);
      
    } catch (error) {
      console.error(`❌ ERROR EN PROCESO DE PRICING: ${error.message}`);
    }
  }

  // Finalizar proceso de pricing
  finishPricingProcess(schedule) {
    this.currentSchedule = null;
    
    console.log(`🏁 PROCESO DE PRICING FINALIZADO`);
    console.log(`   Horario: ${schedule.name}`);
    console.log(`   Hora: ${DateTime.now().setZone(schedule.timezone).toFormat('HH:mm')}`);
    console.log(`   Timezone: ${schedule.timezone}`);
    
    // Aquí puedes agregar lógica adicional:
    // - Limpiar archivos temporales
    // - Enviar notificaciones de finalización
    // - Generar logs de resumen
    // - etc.
  }

  // Verificar si hay un proceso de pricing ejecutándose
  isPricingRunning() {
    return this.currentSchedule !== null;
  }

  // Obtener horario actual de pricing
  getCurrentPricingSchedule() {
    return this.currentSchedule;
  }

  // Obtener todos los horarios
  getAllSchedules() {
    return Array.from(this.schedules.values());
  }

  // Eliminar un horario
  removeSchedule(scheduleId) {
    const schedule = this.schedules.get(scheduleId);
    if (schedule) {
      // Aquí podrías cancelar los jobs de cron si fuera necesario
      this.schedules.delete(scheduleId);
      console.log(`🗑️ Horario eliminado: ${schedule.name}`);
      return true;
    }
    return false;
  }

  // Actualizar un horario existente
  updateSchedule(scheduleId, updates) {
    const schedule = this.schedules.get(scheduleId);
    if (schedule) {
      const updatedSchedule = { ...schedule, ...updates };
      this.schedules.set(scheduleId, updatedSchedule);
      
      // Reprogramar jobs
      this.removeSchedule(scheduleId);
      this.createSchedule(updatedSchedule);
      
      return updatedSchedule;
    }
    return null;
  }

  // Obtener próximo horario de apertura
  getNextOpening(scheduleId) {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) return null;

    const now = DateTime.now().setZone(schedule.timezone);
    const [startHour, startMinute] = schedule.start.split(':');
    
    // Buscar próximo día de apertura
    for (let i = 0; i < 7; i++) {
      const nextDay = now.plus({ days: i });
      const dayOfWeek = nextDay.weekday;
      
      const dayMap = {
        1: 'MO', 2: 'TU', 3: 'WE', 4: 'TH', 5: 'FR', 6: 'SA', 7: 'SU'
      };
      
      if (schedule.byDay.includes(dayMap[dayOfWeek])) {
        const nextOpening = nextDay.set({ 
          hour: parseInt(startHour), 
          minute: parseInt(startMinute) 
        });
        
        if (nextOpening > now) {
          return nextOpening;
        }
      }
    }
    
    return null;
  }
}

// Instancia global del scheduler
const businessScheduler = new BusinessScheduler();

export default businessScheduler;
