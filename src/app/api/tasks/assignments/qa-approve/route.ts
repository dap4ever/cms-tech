import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prismaClient = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { taskId } = await req.json();

    if (!taskId) {
      return NextResponse.json({ error: 'taskId é obrigatório' }, { status: 400 });
    }

    const updated = await (prismaClient as any).taskAssignment.update({
      where: { taskId },
      data: { 
        qaApproved: true
      }
    });

    return NextResponse.json({ success: true, assignment: updated });
  } catch (error: any) {
    console.error('API /api/tasks/assignments/qa-approve Error:', error);
    return NextResponse.json({ error: 'Erro interno ao aprovar QA da tarefa' }, { status: 500 });
  }
}
