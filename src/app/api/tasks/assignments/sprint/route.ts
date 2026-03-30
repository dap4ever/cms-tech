import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { taskId, sprintId } = await request.json();

    if (!taskId) {
      return NextResponse.json({ error: 'ID da tarefa é obrigatório' }, { status: 400 });
    }

    const updated = await (prisma as any).taskAssignment.update({
      where: { taskId },
      data: { sprintId: sprintId || null }
    });

    return NextResponse.json({ success: true, assignment: updated });
  } catch (error: any) {
    console.error('API /api/tasks/assignments/sprint error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
