import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPassword, createToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    console.log('Login attempt for email:', email);

    if (!email || !password) {
      return NextResponse.json({ error: 'Email e senha são obrigatórios' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log('User not found in DB for email:', email);
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    console.log('User found in DB:', user.email, 'with roles:', user.roles);

    const isPasswordValid = await verifyPassword(password, user.passwordHash);

    if (!isPasswordValid) {
      console.log('Invalid password for user:', email);
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 });
    }

    console.log('Login successful for user:', email);

    const token = await createToken({
      userId: user.id,
      email: user.email,
      roles: user.roles,
      name: user.name,
    });

    const response = NextResponse.json({ 
      success: true, 
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name, 
        roles: user.roles,
        avatarUrl: (user as any).avatarUrl,
        mustChangePassword: (user as any).mustChangePassword
      } 
    });

    // Seta o cookie de sessão
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 1 dia
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ 
      error: 'Erro interno no servidor', 
      details: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
}
