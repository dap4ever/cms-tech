import { NextResponse } from 'next/server';
import { 
  TaskrowRawTask, 
  KanbanTask, 
  ALLOWED_JOBS, 
  mapStatusToColumn, 
  mapPriority 
} from '@/lib/taskrow';

// Helper: Calcula StartDate exato (hoje menos 2 meses)
function getStartDateMinus2Months(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 2);
  return d.toISOString();
}

/**
 * Endpoint de Importação (Camada 1).
 * Só repassa dados que obedecem restrições de JobID e Data de 2 meses.
 */
export async function GET(request: Request) {
  const host = process.env.TASKROW_HOST || '';
  const token = process.env.TASKROW_TOKEN || '';

  if (!host || !token || host === 'seu-host.taskrow.com') {
    return NextResponse.json({
      success: true,
      message: "API Proxy ativo com MOCK (Camada 1 Aplicada).",
      tasks: getMockedSystemTasks()
    });
  }

  try {
    const baseUrl = `https://${host}`;
    const headers = {
      '__identifier': token,
      'Content-Type': 'application/json'
    };

    // 1. OBTENDO MAPA DE USUÁRIOS PARA OWNER RESOLUTION
    let userMap: Record<number, string> = {};
    try {
      const userRes = await fetch(`${baseUrl}/api/v1/User/ListUsers`, { headers, method: 'GET' });
      if (userRes.ok) {
        const users = await userRes.json();
        // Assumindo que retorna Array de { UserID, UserLogin }
        const userArray = Array.isArray(users) ? users : (users.Entity || users.data || []);
        userArray.forEach((u: any) => {
          if (u.UserID && u.UserLogin) {
            userMap[u.UserID] = u.UserLogin;
          }
        });
      }
    } catch(e) { console.warn("Erro ao buscar mapa de usuários", e); }


    const allRawTasks: TaskrowRawTask[] = [];
    const startDate = getStartDateMinus2Months();

    // 2. BUSCANDO TODAS AS TAREFAS ABERTAS COM PAGINAÇÃO POR OFFSET
    let currentOffset = 0;
    let hasMoreItems = true;
    const MAX_PAGES = 10; // Evitar loop infinito (2000 tasks)
    let requestsCount = 0;

    while (hasMoreItems && requestsCount < MAX_PAGES) {
      requestsCount++;
      const bodyPayload = {
        Closed: false,
        Offset: currentOffset
      };

      const res = await fetch(`${baseUrl}/api/v2/search/tasks/advancedsearch`, {
        method: 'POST',
        headers,
        body: JSON.stringify(bodyPayload)
      });

      if (!res.ok) {
        console.warn(`[Proxy] Falha na busca global (Status: ${res.status}) no offset ${currentOffset}`);
        break;
      }

      const payload = await res.json();
      let pageTasks: TaskrowRawTask[] = [];
      
      if (Array.isArray(payload.Data)) pageTasks = payload.Data;
      else if (Array.isArray(payload.data)) pageTasks = payload.data;
      else if (Array.isArray(payload)) pageTasks = payload;
      
      allRawTasks.push(...pageTasks);

      // Usando o campo NextOffset oficial documentado
      if (payload.NextOffset || payload.nextOffset) {
         currentOffset = payload.NextOffset || payload.nextOffset;
      } else {
         hasMoreItems = false;
      }
    }

    // 3. MAPEAR E SANITIZAR COMO KANBANTASK
    // Removemos os filtros rígidos "Tech" daqui (Isso é feito no FrontEnd agora pela Camada 2).
    const mappedTasks: KanbanTask[] = allRawTasks.map(task => {
      const id = task.taskID || task.TaskID || Math.floor(Math.random() * 99999);
      const title = task.taskTitle || task.title || 'Sem título';
      
      // Tentando resolver Owner
      let rawOwner = task.ownerUserLogin || '';
      if (!rawOwner && task.ownerUserID && userMap[task.ownerUserID]) {
        rawOwner = userMap[task.ownerUserID];
      }

      const assigneeLogin = rawOwner.toLowerCase();
      const assigneeUI = rawOwner ? rawOwner.substring(0, 2).toUpperCase() : '??';
      const statusOriginal = task.pipelineStep || 'A Fazer';

      return {
        id: `TR-${id}`,
        title: title,
        column: mapStatusToColumn(statusOriginal),
        statusOriginal: statusOriginal,
        priority: mapPriority(task.priority || task.Priority),
        tags: [task.clientNickname || 'Geral'], // 'Tech' vai virar visual via classes/dataset no React
        client: task.clientNickname || 'Geral',
        assignee: assigneeUI,
        assigneeLogin: assigneeLogin,
        pr: null, 
        prActive: false,
        dueDate: task.dueDate || task.due_date || '',
        createdDate: task.createdDate || task.created_at || task.dateCreated || new Date().toISOString(),
        rawData: task
      };
    });

    return NextResponse.json({
      success: true,
      count: mappedTasks.length,
      tasks: mappedTasks
    });

  } catch (error: any) {
    console.error('Taskrow API Proxy Error (v0.4):', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Mocks atualizados suportando formato de Camada 2
function getMockedSystemTasks(): KanbanTask[] {
  return [
    {
      id: "TR-5042",
      title: "Desenvolvimento Homepage",
      column: "inProgress",
      statusOriginal: "execução",
      priority: "high",
      tags: ["GLP"],
      client: "GLP",
      assignee: "IG", 
      assigneeLogin: "ingrid",
      pr: "#42",
      prActive: true,
      dueDate: "2026-03-15T00:00:00Z",
      createdDate: "2026-03-01T00:00:00Z",
      rawData: {}
    },
    {
      id: "TR-8931",
      title: "Aprovação de Layout Chego Lá",
      column: "todo",
      statusOriginal: "Aguardando",
      priority: "medium",
      tags: ["Chego Lá"],
      client: "Chego Lá",
      assignee: "DA",
      assigneeLogin: "dani",
      pr: null,
      prActive: false,
      dueDate: "2026-03-20T00:00:00Z",
      createdDate: "2026-03-10T00:00:00Z",
      rawData: {}
    },
     {
      id: "TR-1025",
      title: "[TECH] Configurar SEO Inicial",
      column: "inReview",
      statusOriginal: "homolog",
      priority: "medium",
      tags: ["Merz IDT (Tech e SEO)"],
      client: "Merz IDT (Tech e SEO)",
      assignee: "RA",
      assigneeLogin: "raissa",
      pr: null,
      prActive: false,
      dueDate: "2026-04-01T00:00:00Z",
      createdDate: "2026-03-11T00:00:00Z",
      rawData: {}
    }
  ];
}
