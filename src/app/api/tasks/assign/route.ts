import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { taskId, title, client, targetUserId } = await request.json();

    if (!taskId || !targetUserId) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    // Upsert assignment: se já existe, acumula o usuário conectando-o; senão, cria e conecta.
    const assignment = await (prisma as any).taskAssignment.upsert({
      where: { taskId },
      update: { title, client, users: { connect: { id: targetUserId } } },
      create: { taskId, title, client, users: { connect: { id: targetUserId } } }
    });

    return NextResponse.json({ success: true, assignment });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
