import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { taskId, localObservation, localImages } = await request.json();

    if (!taskId) {
      return NextResponse.json({ error: 'TaskId obrigatório' }, { status: 400 });
    }

    // @ts-ignore
    const updated = await prisma.taskAssignment.update({
      where: { taskId },
      data: {
        localObservation,
        localImages: localImages ? { set: localImages } : undefined
      }
    });

    return NextResponse.json({ success: true, assignment: updated });

  } catch (error: any) {
    console.error('Save Observation Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
