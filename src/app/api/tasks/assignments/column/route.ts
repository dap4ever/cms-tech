import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prismaClient = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { taskId, column } = await req.json();

    if (!taskId || !column) {
      return NextResponse.json({ error: 'taskId e column são obrigatórios' }, { status: 400 });
    }

    const updated = await (prismaClient as any).taskAssignment.update({
      where: { taskId },
      data: { 
        column
      }
    });

    return NextResponse.json({ success: true, assignment: updated });
  } catch (error: any) {
    console.error('API /api/tasks/assignments/column Error:', error);
    return NextResponse.json({ error: 'Erro interno ao atualizar a coluna da tarefa' }, { status: 500 });
  }
}
