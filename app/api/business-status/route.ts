import { NextResponse } from 'next/server';
import businessScheduler from '@/lib/scheduler';

// GET - Verificar estado del negocio
export async function GET() {
  try {
    const isOpen = businessScheduler.isPricingRunning();
    const currentSchedule = businessScheduler.getCurrentPricingSchedule();
    const allSchedules = businessScheduler.getAllSchedules();
    
    // Obtener próximo horario de apertura si está cerrado
    let nextOpening = null;
    if (!isOpen && allSchedules.length > 0) {
      const firstSchedule = allSchedules[0];
      nextOpening = businessScheduler.getNextOpening(firstSchedule.id);
    }

    return NextResponse.json({
      success: true,
      data: {
        isOpen,
        currentSchedule,
        nextOpening: nextOpening ? nextOpening.toISO() : null,
        totalSchedules: allSchedules.length
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error al verificar estado del negocio' },
      { status: 500 }
    );
  }
}
