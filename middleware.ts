import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'cms-tech-fallback-secret');

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Permite acesso total para API, Login e arquivos estáticos
  if (
    pathname.startsWith('/api') || 
    pathname === '/login' ||
    pathname.startsWith('/_next') ||
    pathname.includes('favicon.ico')
  ) {
    return NextResponse.next();
  }

  // 2. Verifica se o token de sessão existe
  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // 3. Verifica se o token é válido
    await jwtVerify(token, JWT_SECRET);
    return NextResponse.next();
  } catch (error) {
    // Token inválido ou expirado - limpa cookie e manda pro login
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('auth_token');
    return response;
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
