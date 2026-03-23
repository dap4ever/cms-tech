import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prismaClient = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { taskId, seconds, manualHours, estimation } = await req.json();

    if (!taskId) {
      return NextResponse.json({ error: 'taskId é obrigatório' }, { status: 400 });
    }

    // Calcula horas trackeadas. manualHours (horas decimais) sobrepõe se existir
    let finalTracked = "0";
    if (manualHours && !isNaN(parseFloat(manualHours))) {
      finalTracked = String(parseFloat(manualHours) * 3600);
    } else if (seconds) {
      finalTracked = String(seconds);
    }

    const dataToUpdate: any = {
      trackedTime: finalTracked
    };

    if (estimation && estimation !== '--') {
      dataToUpdate.estimationHr = String(estimation);
    }

    const updated = await (prismaClient as any).taskAssignment.update({
      where: { taskId },
      data: dataToUpdate
    });

    return NextResponse.json({ success: true, assignment: updated });
  } catch (error: any) {
    console.error('API /api/tasks/assignments/time Error:', error);
    if (error.code === 'P2025') {
       return NextResponse.json({ error: 'Tarefa não encontrada no banco. Atribua-a a alguém primeiro.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
