import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prismaClient = new PrismaClient();

export async function POST(req: Request) {
  try {
    const { taskId, title } = await req.json();
    if (!taskId || !title) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });

    const updated = await (prismaClient as any).taskAssignment.update({
      where: { taskId },
      data: { title }
    });

    return NextResponse.json({ success: true, assignment: updated });
  } catch (error: any) {
    if (error.code === 'P2025') return NextResponse.json({ error: 'Atribuição não encontrada' }, { status: 404 });
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
