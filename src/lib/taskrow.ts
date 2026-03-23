// Tipagem baseada no TASKROW_API_CONSOLIDADO.md e documentacaoAPI.md

export interface TaskrowRawTask {
  taskID?: number;
  TaskID?: number;
  taskTitle?: string;
  title?: string;
  taskDescription?: string;
  description?: string;
  clientNickName?: string;
  clientNickname?: string;
  clientDisplayName?: string;
  pipelineStep?: string;
  priority?: string;
  Priority?: string;
  dueDate?: string;
  due_date?: string;
  createdDate?: string;
  created_at?: string;
  dateCreated?: string;
  ownerUserID?: number;
  ownerUserLogin?: string;
  attachments?: any[];
  Attachments?: any[];
  TaskAttachments?: any[];
  jobNumber?: number;
  taskNumber?: number;
  TaskNumber?: number;
}

export interface KanbanTask {
  id: string;         // taskrow taskID formatado, ex: "TR-1234"
  title: string;      // titulo da task
  column: string;     // status mapeado para o design do kanban
  statusOriginal: string; // status original para o filtro
  priority: string;   
  tags: string[];     
  client: string;     // Nome do cliente
  assignee: string;   // Iniciais do ownerUserLogin para UI
  assigneeLogin: string; // Login completo para o Filtro em tela (lowercase)
  pr: string | null;  
  prActive: boolean;
  dueDate: string;    // Armazenando Data de entrega para fallback do Kanban Sort
  createdDate: string; // Data de criação para fallback
  rawData: any;       
}

// Os 6 Projetos Permitidos pela Camada 1
export const ALLOWED_JOBS = [
  { client: 'GLP', jobNumber: 116, display: 'GLP' },
  { client: 'ChegoLa', jobNumber: 500, display: 'Chego Lá' },
  { client: 'ProjetoStella', jobNumber: 508, display: 'Merz IDT (Tech e SEO)' },
  { client: 'Medtronic', jobNumber: 581, display: 'Medtronic' },
  { client: 'F2FInstitucional', jobNumber: 450, display: 'F2F Mkt Institucional' },
  { client: 'ABRAFATI', jobNumber: 341, display: 'ABRAFATI' },
];

// O Grupo Tech agora é inferido puramente como uma Heurística Client-Side / Modelagem de Retorno, e não mais bloqueio do servidor.
// Mas exportaremos a utilidade para montar as propriedades em tela
export function applyTechHeuristicsClass(
  status: string = '', title: string = '', desc: string = '', owner: string = ''
): string {
  const s = status.toLowerCase();
  const t = title.toLowerCase();
  const d = desc.toLowerCase();
  const o = owner.toLowerCase();

  // INGRID, RAISSA e KAIQUE são do grupo Tech
  if (s.includes('tech') || t.includes('tech') || d.includes('tech') || o.includes('ingrid') || o.includes('raissa') || o.includes('kaique')) {
    return 'tech';
  }
  return '';
}

// Mapeamento simples de status Taskrow para as colunas do nosos Kanban UI (Camada Visual)
export function mapStatusToColumn(status: string = ''): string {
  const s = status.toLowerCase();
  if (s.includes('concluí') || s.includes('done') || s.includes('fechad') || s.includes('entregue') || s.includes('aprovado')) {
    return 'done';
  }
  if (s.includes('revis') || s.includes('review') || s.includes('homolog') || s.includes('qa')) {
    return 'inReview';
  }
  if (s.includes('andamento') || s.includes('progress') || s.includes('fazendo') || s.includes('tech') || s.includes('execução')) {
    return 'inProgress';
  }
  return 'todo'; // fallback
}

export function mapPriority(priority: string = ''): string {
  const p = priority.toLowerCase();
  if (p.includes('alta') || p.includes('urgente') || p.includes('high') || p.includes('crítica')) return 'high';
  if (p.includes('média') || p.includes('medium') || p.includes('normal')) return 'medium';
  return 'low';
}
