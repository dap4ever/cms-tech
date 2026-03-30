import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    const { avatarUrl, name } = await request.json();

    const updateData: any = {};
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
    if (name !== undefined) updateData.name = name;

    const updatedUser = await (prisma as any).user.update({
      where: { id: session.userId as string },
      data: updateData,
      select: {
          id: true,
          name: true,
          email: true,
          roles: true,
          avatarUrl: true,
          mustChangePassword: true
      }
    });

    return NextResponse.json({
      success: true,
      user: updatedUser
    });

  } catch (error: any) {
    console.error('[User Profile API] Error:', error.message);
    return NextResponse.json({ success: false, error: 'Erro interno ao atualizar perfil' }, { status: 500 });
  }
}
