import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@/lib/auth';

const prismaClient = new PrismaClient();

export async function POST(req: Request) {
  try {
    const session = await getSession() as any;
    if (!session || !session.userId || (!session.roles?.includes('GESTOR') && !session.roles?.includes('ADMIN'))) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const { taskId } = await req.json();

    if (!taskId) {
      return NextResponse.json({ error: 'taskId é obrigatório' }, { status: 400 });
    }

    const updated = await (prismaClient as any).taskAssignment.update({
      where: { taskId },
      data: { 
        qaApproved: false
      }
    });

    return NextResponse.json({ success: true, assignment: updated });
  } catch (error: any) {
    console.error('API /api/tasks/assignments/qa-revert Error:', error);
    return NextResponse.json({ error: 'Erro interno ao reverter QA da tarefa' }, { status: 500 });
  }
}
