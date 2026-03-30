import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { taskId, qcMetadata } = await request.json();

    if (!taskId) {
      return NextResponse.json({ error: 'ID da tarefa é obrigatório' }, { status: 400 });
    }

    const assignment = await (prisma as any).taskAssignment.update({
      where: { taskId },
      data: { qcMetadata }
    });

    return NextResponse.json({ success: true, assignment });
  } catch (error: any) {
    console.error('Error updating QC metadata:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
