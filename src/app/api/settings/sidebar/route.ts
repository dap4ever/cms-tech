import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const settings = await prisma.globalSettings.findUnique({
      where: { id: 'global' },
    });
    return NextResponse.json(settings || { id: 'global', hiddenSidebarItems: [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getSession();
  
  // Apenas GESTOR pode alterar as configurações globais da Sidebar
  const isGestor = session?.roles?.includes('GESTOR') || (session as any)?.role === 'GESTOR';
  
  console.log('[Sidebar API] Session:', JSON.stringify(session));
  console.log('[Sidebar API] isGestor check:', isGestor);

  if (!session || !isGestor) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
  }

  try {
    const { hiddenSidebarItems } = await request.json();
    
    const settings = await prisma.globalSettings.upsert({
      where: { id: 'global' },
      update: { hiddenSidebarItems },
      create: { id: 'global', hiddenSidebarItems },
    });

    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
