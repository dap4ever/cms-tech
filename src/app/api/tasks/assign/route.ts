import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { taskId, title, client, targetUserId, sprintId, priority } = await request.json();

    if (!taskId || !targetUserId) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    const assignment = await (prisma as any).taskAssignment.upsert({
      where: { taskId },
      update: { 
        title, 
        client, 
        sprintId: sprintId || undefined,
        priority: priority || undefined,
        users: { connect: { id: targetUserId } } 
      },
      create: { 
        taskId, 
        title, 
        client, 
        sprintId: sprintId || undefined,
        priority: priority || 'normal',
        users: { connect: { id: targetUserId } },
        status: 'ASSIGNED',
        column: 'todo'
      }
    });

    return NextResponse.json({ success: true, assignment });
  } catch (error: any) {
    console.error('API /api/tasks/assign Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json({ error: 'ID da tarefa é obrigatório' }, { status: 400 });
    }

    // Deletar o registro de atribuição. 
    // Isso remove os relacionamentos implicitamente se for uma relação definida no Prisma,
    // mas aqui a relação TaskAssignment -> User é M:N implícita, então o delete resolve.
    await (prisma as any).taskAssignment.delete({
      where: { taskId }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API /api/tasks/assign DELETE Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
