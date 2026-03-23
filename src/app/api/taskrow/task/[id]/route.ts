import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

/**
 * API de detalhe de tarefa — /api/taskrow/task/[id]
 * 
 * Busca os dados completos da tarefa via a lista do advancedsearch (rawData).
 * Tenta enriquecer com o TaskDetail oficial do Taskrow quando possível.
 * 
 * Se o TaskDetail estiver bloqueado (403), retorna os dados do rawData mesmo assim.
 */
export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
  const host = process.env.TASKROW_HOST || '';
  const token = process.env.TASKROW_TOKEN || '';
  
  if (!host || !token) return NextResponse.json({ success: false, error: 'Sem credentials' });

  try {
    const params = await props.params;
    const taskTrId = params.id; // Ex: TR-215149
    const taskNumber = taskTrId.replace(/\D/g, '');

    // 1. Busca a tarefa na lista do advancedsearch via nosso próprio proxy
    const baseUrl = new URL(request.url);
    const listEndpoint = `${baseUrl.protocol}//${baseUrl.host}/api/taskrow/tasks`;
    
    let rootTask: any = null;
    
    // Primeiro tenta achar na lista aberta
    const res1 = await fetch(listEndpoint);
    const data1 = await res1.json();
    if (data1.success && data1.tasks?.length > 0) {
      rootTask = data1.tasks.find((t: any) => t.id === taskTrId) || null;
    }
    
    // Se não achou, busca com includeClosed e filtrando por número
    if (!rootTask) {
      const res2 = await fetch(`${listEndpoint}?includeClosed=true&q=${taskNumber}`);
      const data2 = await res2.json();
      if (data2.success && data2.tasks?.length > 0) {
        rootTask = data2.tasks.find((t: any) => t.id === taskTrId) || data2.tasks[0];
      }
    }

    if (!rootTask) {
      return NextResponse.json({ success: false, error: 'Tarefa não encontrada' });
    }

    // 2. Tenta enriquecer com TaskDetail (pode falhar com 403 se token não tem permissão)
    const rawData = rootTask.rawData || {};
    let urlDataParsed: any = {};
    try { if (rawData.urlData) urlDataParsed = JSON.parse(rawData.urlData); } catch(e) {}

    const cNick = urlDataParsed.ClientNickName || rawData.clientNickName || rawData.clientNickname;
    const jNum = urlDataParsed.JobNumber || rawData.jobNumber || rawData.JobNumber;
    const tNum = urlDataParsed.TaskNumber || rawData.taskNumber || rawData.TaskNumber;

    let detailedData = null;
    let detailError = null;

    if (cNick && jNum && tNum) {
      try {
        const connId = crypto.randomUUID ? crypto.randomUUID() : 'conn-' + Date.now();
        const detailUrl = new URL(`https://${host}/api/v1/Task/TaskDetail`);
        detailUrl.searchParams.set('clientNickname', cNick);
        detailUrl.searchParams.set('jobNumber', String(jNum));
        detailUrl.searchParams.set('taskNumber', String(tNum));
        detailUrl.searchParams.set('connectionID', connId);
        
        console.log(`[Proxy] Solicitando TaskDetail: ${detailUrl.toString()}`);

        const dRes = await fetch(detailUrl.toString(), {
          method: 'GET',
          headers: { '__identifier': token }
        });
        
        if (dRes.ok) {
          const dText = await dRes.text();
          try { detailedData = JSON.parse(dText); } catch(e) {}
        } else {
          detailError = `API Retornou Status ${dRes.status} (Bloqueio de Permissão para este Token)`;
          console.warn(`[Proxy] Falha TaskDetail: Status ${dRes.status}`);
        }
      } catch(e: any) {
        detailError = `Erro na requisição: ${e.message}`;
      }
    } else {
      detailError = "Faltam parâmetros de cliente/job para buscar detalhes adicionais.";
    }

    return NextResponse.json({
      success: true,
      summary: rootTask,
      details: detailedData,
      detailError: detailError
    });

  } catch(e: any) {
    return NextResponse.json({ success: false, error: e.message });
  }
}

export async function PUT(request: Request, props: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  if (session.roles?.includes('DESENVOLVEDOR') && !session.roles?.includes('GESTOR') && !session.roles?.includes('ADMINISTRADOR')) {
    return NextResponse.json({ error: 'Desenvolvedores não têm permissão para editar tasks' }, { status: 403 });
  }

  // Lógica mockada para PUT - Sucesso para Gestor/Gerente
  return NextResponse.json({ success: true, message: 'Tarefa atualizada com sucesso.' });
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  if (session.roles?.includes('DESENVOLVEDOR') && !session.roles?.includes('GESTOR') && !session.roles?.includes('ADMINISTRADOR')) {
    return NextResponse.json({ error: 'Apenas Gestores e Gerentes podem excluir tarefas' }, { status: 403 });
  }

  // Lógica mockada para DELETE
  return NextResponse.json({ success: true, message: 'Tarefa excluída com sucesso.' });
}
