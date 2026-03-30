import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: session.userId as string },
      select: { skills: true, firstAccessDone: true },
    });

    return NextResponse.json({ success: true, skills: user?.skills ?? [], firstAccessDone: user?.firstAccessDone ?? false });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session?.userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    const { skills } = await req.json();
    if (!Array.isArray(skills)) return NextResponse.json({ error: 'skills deve ser um array' }, { status: 400 });

    await prisma.user.update({
      where: { id: session.userId as string },
      data: { skills, firstAccessDone: true },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
