import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // Busca todas as atribuições (o filtro por dev será feito no frontend ou via query param se necessário)
    // Para simplificar agora, trazemos todas e o frontend que conhece as roles filtra
    const assignments = await (prisma as any).taskAssignment.findMany({
      include: {
        users: {
          select: { id: true, name: true, email: true, avatarUrl: true }
        },
        sprint: true
      }
    });

    return NextResponse.json({ success: true, assignments });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
