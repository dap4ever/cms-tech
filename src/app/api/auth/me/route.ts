import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getSession();
    
    if (!session || !session.userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    console.log('[Auth Me] Validating session for ID:', session.userId);

    // Usando queryRaw para evitar problemas se o Prisma Client estiver dessincronizado
    const users = await prisma.$queryRaw<any[]>`
      SELECT id, email, name, roles, "avatarUrl", "mustChangePassword" FROM "User" WHERE id = ${String(session.userId)} LIMIT 1
    `;
    
    console.log('[Auth Me] Query result length:', users.length);
    const user = users[0];

    if (!user) {
      console.log('[Auth Me] User not found in DB for ID:', session.userId);
      return NextResponse.json({ success: false, error: 'Usuário não encontrado' }, { status: 404 });
    }

    console.log('[Auth Me] User found:', user.email, 'Roles:', JSON.stringify(user.roles));


    return NextResponse.json({
      success: true,
      user
    });

  } catch (error: any) {
    console.error('[Auth Me] Error:', error.message);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
