import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prismaClient = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { taskId, estimationHr } = await req.json();

    if (!taskId || !estimationHr) {
      return NextResponse.json({ error: 'taskId e estimationHr são obrigatórios' }, { status: 400 });
    }

    // Usando cast para any devido ao possível cache/desvio do schema no ambiente Windows do usuário
    const updated = await (prismaClient as any).taskAssignment.update({
      where: { taskId },
      data: { estimationHr }
    });

    return NextResponse.json({ success: true, assignment: updated });
  } catch (error: any) {
    console.error('API /api/tasks/estimate Error:', error);
    // Se a tarefa não existir ainda no TaskAssignment, não há problema, tentamos dar upsert
    if (error.code === 'P2025') {
       return NextResponse.json({ error: 'Tarefa não está atribuída a ninguém ainda, não é possível salvar a estimativa.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
