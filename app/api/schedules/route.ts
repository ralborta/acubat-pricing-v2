import { NextRequest, NextResponse } from 'next/server';
import businessScheduler from '@/lib/scheduler';

// GET - Obtener todos los horarios
export async function GET() {
  try {
    const schedules = businessScheduler.getAllSchedules();
    const isOpen = businessScheduler.isPricingRunning();
    const currentSchedule = businessScheduler.getCurrentPricingSchedule();

    return NextResponse.json({
      success: true,
      data: {
        schedules,
        isOpen,
        currentSchedule
      }
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error al obtener horarios' },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo horario
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validar datos requeridos
    if (!body.name || !body.byDay || !body.start || !body.end) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // Crear el horario
    const schedule = businessScheduler.createSchedule(body);

    return NextResponse.json({
      success: true,
      data: schedule,
      message: 'Horario creado exitosamente'
    }, { status: 201 });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error al crear horario' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar horario existente
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.id) {
      return NextResponse.json(
        { success: false, error: 'ID de horario requerido' },
        { status: 400 }
      );
    }

    const updatedSchedule = businessScheduler.updateSchedule(body.id, body);
    
    if (!updatedSchedule) {
      return NextResponse.json(
        { success: false, error: 'Horario no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedSchedule,
      message: 'Horario actualizado exitosamente'
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error al actualizar horario' },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar horario
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID de horario requerido' },
        { status: 400 }
      );
    }

    const deleted = businessScheduler.removeSchedule(id);
    
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Horario no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Horario eliminado exitosamente'
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Error al eliminar horario' },
      { status: 500 }
    );
  }
}
