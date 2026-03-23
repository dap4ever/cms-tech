import { NextResponse } from 'next/server';
import { getSession, verifyPassword, hashPassword } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function PUT(request: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Senha atual e nova senha são obrigatórias' }, { status: 400 });
    }

    // Busca o usuário para verificar a senha atual
    const user = await prisma.user.findUnique({
      where: { id: session.userId as string },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const isPasswordValid = await verifyPassword(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Senha atual incorreta' }, { status: 400 });
    }

    // Atualiza para a nova senha e reseta a flag de primeiro acesso usando SQL bruto
    // para evitar erros se o Prisma Client estiver dessincronizado
    const newPasswordHash = await hashPassword(newPassword);
    
    await prisma.$executeRaw`
      UPDATE "User" 
      SET "passwordHash" = ${newPasswordHash}, "mustChangePassword" = false 
      WHERE id = ${user.id}
    `;

    console.log('[Password Update] SQL Success for user:', user.email);

    return NextResponse.json({ success: true, message: 'Senha atualizada com sucesso' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
