import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// POST /api/tasks/assignments/ai-summary  → save AI-generated summary to DB
export async function POST(req: Request) {
  const session = await getSession() as any;
  if (!session?.userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { taskId, aiSummary } = await req.json();
  if (!taskId || !aiSummary) {
    return NextResponse.json({ error: 'taskId e aiSummary são obrigatórios' }, { status: 400 });
  }

  const updated = await (prisma as any).taskAssignment.updateMany({
    where: { taskId },
    data: { aiSummary },
  });

  return NextResponse.json({ success: true, updatedCount: updated.count });
}
