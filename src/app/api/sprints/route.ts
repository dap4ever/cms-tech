import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { startOfWeek, addDays, format, addWeeks, isMonday, nextMonday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// GET /api/sprints - Lista as sprints
export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const sprints = await (prisma as any).sprint.findMany({
      orderBy: { startDate: 'desc' },
      include: {
        _count: {
          select: { tasks: true }
        }
      }
    });

    return NextResponse.json({ success: true, sprints });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/sprints/generate (usaremos a própria rota base com uma query ou apenas POST para criar a próxima)
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // 1. Achar a última sprint para saber de onde continuar
    const lastSprint = await (prisma as any).sprint.findFirst({
      orderBy: { endDate: 'desc' }
    });

    let startDate: Date;
    if (lastSprint) {
      // Inicia na próxima segunda após a última terminar
      startDate = nextMonday(lastSprint.endDate);
    } else {
      // Primeira sprint: se hoje for segunda, hoje. Senão, próxima segunda.
      const today = new Date();
      startDate = isMonday(today) ? today : nextMonday(today);
    }

    // Normalizar para o início do dia (00:00:00)
    startDate.setHours(0, 0, 0, 0);
    
    // Termina na sexta da mesma semana (4 dias depois da segunda)
    const endDate = addDays(startDate, 4);
    endDate.setHours(23, 59, 59, 999);

    // Nome amigável
    const name = `Sprint - ${format(startDate, "dd/MM", { locale: ptBR })} a ${format(endDate, "dd/MM", { locale: ptBR })}`;

    const newSprint = await (prisma as any).sprint.create({
      data: {
        name,
        startDate,
        endDate,
        status: 'FUTURE'
      }
    });

    return NextResponse.json({ success: true, sprint: newSprint });
  } catch (error: any) {
    console.error('Error generating sprint:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
