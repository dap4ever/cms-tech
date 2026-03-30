import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET /api/tasks/time-entries?taskId=X  → list all entries for a task
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const taskId = searchParams.get('taskId');
  if (!taskId) return NextResponse.json({ error: 'taskId obrigatório' }, { status: 400 });

  const entries = await (prisma as any).timeEntry.findMany({
    where: { taskId },
    include: { user: { select: { id: true, name: true, avatarUrl: true, roles: true } } },
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json({ success: true, entries });
}

// POST /api/tasks/time-entries  → upsert current user's hours (admin/gestor can pass targetUserId)
export async function POST(req: Request) {
  const session = await getSession() as any;
  if (!session?.userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { taskId, hours, targetUserId } = await req.json();
  if (!taskId || hours === undefined) {
    return NextResponse.json({ error: 'taskId e hours são obrigatórios' }, { status: 400 });
  }

  const isPrivileged = session.roles?.includes('GESTOR') || session.roles?.includes('ADMINISTRADOR');
  const userId = (isPrivileged && targetUserId) ? targetUserId : session.userId as string;

  if (!isPrivileged && targetUserId && targetUserId !== session.userId) {
    return NextResponse.json({ error: 'Permissão negada: você só pode editar suas próprias horas.' }, { status: 403 });
  }

  const hoursValue = parseFloat(hours);
  if (isNaN(hoursValue) || hoursValue < 0) {
    return NextResponse.json({ error: 'Valor de horas inválido' }, { status: 400 });
  }

  const entry = await (prisma as any).timeEntry.upsert({
    where: { taskId_userId: { taskId, userId } },
    update: { hours: hoursValue },
    create: { taskId, userId, hours: hoursValue },
    include: { user: { select: { id: true, name: true, avatarUrl: true, roles: true } } },
  });

  // Atualiza trackedTime do TaskAssignment com a soma total das entradas
  const allEntries = await (prisma as any).timeEntry.findMany({ where: { taskId } });
  const totalSeconds = allEntries.reduce((sum: number, e: any) => sum + e.hours * 3600, 0);
  await (prisma as any).taskAssignment.updateMany({
    where: { taskId },
    data: { trackedTime: String(totalSeconds) },
  });

  return NextResponse.json({ success: true, entry });
}

// DELETE /api/tasks/time-entries?entryId=X  → remove an entry (own or admin/gestor)
export async function DELETE(req: Request) {
  const session = await getSession() as any;
  if (!session?.userId) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const entryId = searchParams.get('entryId');
  if (!entryId) return NextResponse.json({ error: 'entryId obrigatório' }, { status: 400 });

  const entry = await (prisma as any).timeEntry.findUnique({ where: { id: entryId } });
  if (!entry) return NextResponse.json({ error: 'Entrada não encontrada' }, { status: 404 });

  const isPrivileged = session.roles?.includes('GESTOR') || session.roles?.includes('ADMINISTRADOR');
  if (!isPrivileged && entry.userId !== session.userId) {
    return NextResponse.json({ error: 'Permissão negada' }, { status: 403 });
  }

  await (prisma as any).timeEntry.delete({ where: { id: entryId } });

  // Recalcula total
  const remaining = await (prisma as any).timeEntry.findMany({ where: { taskId: entry.taskId } });
  const totalSeconds = remaining.reduce((sum: number, e: any) => sum + e.hours * 3600, 0);
  await (prisma as any).taskAssignment.updateMany({
    where: { taskId: entry.taskId },
    data: { trackedTime: String(totalSeconds) },
  });

  return NextResponse.json({ success: true });
}
