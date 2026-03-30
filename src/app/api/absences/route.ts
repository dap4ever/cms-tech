import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    const absences = await (prisma as any).absence.findMany({
      include: {
        user: {
          select: { id: true, name: true }
        }
      },
      orderBy: { start: 'asc' }
    });

    return NextResponse.json({ success: true, absences });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    const { userId, start, end, type } = await request.json();

    if (!userId || !start || !end || !type) {
      return NextResponse.json({ success: false, error: 'Dados incompletos' }, { status: 400 });
    }

    const newAbsence = await (prisma as any).absence.create({
      data: {
        userId,
        start: new Date(start),
        end: new Date(end),
        type
      }
    });

    return NextResponse.json({ success: true, absence: newAbsence });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
