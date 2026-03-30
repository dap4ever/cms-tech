import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/auth';

const prismaClient = new PrismaClient();

export async function PATCH(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { taskId, priority } = await req.json();

    if (!taskId || !priority) {
      return NextResponse.json({ error: 'taskId e priority são obrigatórios' }, { status: 400 });
    }

    const updated = await (prismaClient as any).taskAssignment.update({
      where: { taskId },
      data: { 
        priority
      }
    });

    return NextResponse.json({ success: true, assignment: updated });
  } catch (error: any) {
    console.error('API /api/tasks/assignments/priority Error:', error);
    return NextResponse.json({ error: 'Erro interno ao atualizar prioridade da tarefa' }, { status: 500 });
  }
}
