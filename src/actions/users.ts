'use server';

import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { revalidatePath } from 'next/cache';

export async function getUsers() {
  try {
    return await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        roles: true,
        createdAt: true
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

export async function createUser(data: { name: string, email: string, passwordHash?: string, roles?: any[] }) {
  try {
    // Default password for new users if not provided
    const password = data.passwordHash || 'Mudar@123';
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash: hashedPassword,
        roles: data.roles || ['DESENVOLVEDOR']
      }
    });

    revalidatePath('/dashboard/users');
    return { success: true, user };
  } catch (error: any) {
    console.error('Error creating user:', error);
    if (error.code === 'P2002') {
      return { success: false, error: 'Email já cadastrado.' };
    }
    return { success: false, error: 'Erro ao criar usuário.' };
  }
}

export async function deleteUser(id: string) {
  try {
    await prisma.user.delete({
      where: { id }
    });
    revalidatePath('/dashboard/users');
    return { success: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    return { success: false, error: 'Erro ao deletar usuário.' };
  }
}
