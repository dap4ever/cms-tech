import Link from 'next/link';
import { notFound } from 'next/navigation';
import { 
  ArrowLeft, 
  Clock, 
  User, 
  Tag, 
  AlertCircle, 
  Calendar,
  Briefcase
} from 'lucide-react';
import styles from './task.module.css';

// Função utilitária para buscar no server-side embutida na página para evitar a barreira do fetch interno em localhost no Next 14+
async function getTaskData(taskId: string) {
  const host = process.env.TASKROW_HOST || '';
  const token = process.env.TASKROW_TOKEN || '';

  if (!host || !token || host === 'seu-host.taskrow.com') {
    return {
      id: taskId,
      title: taskId === 'TR-1025' ? '[TECH] Implementar autenticação via GitHub' : `Tarefa Mockada ${taskId}`,
      description: `## Descrição Detalhada\n\nEsta é uma simulação de descrição da tarefa **${taskId}**.\n\nAqui entrarão detalhes vindos do \`TaskItemComment\` extraído do Taskrow.\n\n- Requisito 1\n- Requisito 2`,
      status: taskId === 'TR-1025' ? 'Em Andamento' : 'A Fazer',
      priority: 'Alta',
      client: 'F2F Tech',
      owner: 'INGRID B.',
      job: '4042',
      hoursTracked: 12,
      hoursEstimated: 40,
      createdDate: '2026-03-01T10:00:00Z',
      dueDate: '2026-03-20T18:00:00Z',
    };
  }

  const numericId = taskId.replace('TR-', '');
  const url = `https://${host}/api/v2/search/tasks/advancedsearch`;
  
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      '__identifier': token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ TaskIDs: [numericId] })
  });

  if (!res.ok) throw new Error(`Erro API Taskrow: ${res.status}`);

  const payload = await res.json();
  let rawTasks = [];
  if (Array.isArray(payload)) rawTasks = payload;
  else if (payload.data && Array.isArray(payload.data)) rawTasks = payload.data;
  else if (payload.items && Array.isArray(payload.items)) rawTasks = payload.items;

  if (rawTasks.length === 0) throw new Error('Tarefa não encontrada');
  
  const taskData = rawTasks[0];
  return {
    id: `TR-${taskData.taskID || taskData.TaskID}`,
    title: taskData.taskTitle || taskData.title || 'Sem título',
    description: taskData.taskDescription || taskData.description || 'Esta tarefa não possui descrição ou a permissão para leitura detalhada está bloqueada.',
    status: taskData.pipelineStep || 'A Fazer',
    priority: taskData.priority || taskData.Priority || 'Normal',
    client: taskData.clientNickname || 'Geral',
    owner: taskData.ownerUserLogin ? taskData.ownerUserLogin : 'Não Alocado',
    job: taskData.jobNumber || 'N/A',
    hoursTracked: Math.floor(Math.random() * 20), 
    hoursEstimated: Math.floor(Math.random() * 40) + 10,
    createdDate: taskData.creationDate || taskData.created_at || 'Data desconhecida',
    dueDate: taskData.dueDate || taskData.due_date || 'Nenhuma',
  };
}

export default async function TaskDetail({ params }: { params: { id: string } }) {
  let task = null;
  let errorMsg = null;

  try {
    task = await getTaskData(params.id);
  } catch (err: any) {
    errorMsg = err.message || 'Erro ao processar dados da tarefa';
  }

  if (errorMsg && !task) {
    return <div className={styles.errorContainer}>Erro: {errorMsg}</div>;
  }

  if (!task) notFound();

  const progressPercentage = Math.min((task.hoursTracked / task.hoursEstimated) * 100, 100) || 0;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link href="/projects" className={styles.backButton}>
          <ArrowLeft size={16} /> Voltar para o Quadro
        </Link>
        <div className={styles.titleSection}>
          <span className={styles.taskId}>{task.id}</span>
          <h1 className={styles.taskTitle}>{task.title}</h1>
        </div>
        <div className={styles.metaBadges}>
          <span className={styles.badgeSolid}>{task.status}</span>
          <span className={styles.badgeOutline}><AlertCircle size={12}/> {task.priority}</span>
          <span className={styles.badgeOutline}><Briefcase size={12}/> Job {task.job || 'N/A'}</span>
        </div>
      </header>

      <div className={styles.grid}>
        {/* Coluna Principal da Descrição */}
        <div className={styles.mainCol}>
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Descrição da Demanda</h2>
            <div className={styles.descriptionContent}>
              {/* Numa versão real com Markdown, usariamos {react-markdown} ou {dangerouslySetInnerHTML} */}
              <p>{task.description}</p>
            </div>
          </div>
        </div>

        {/* Coluna Sidebar Lateral de Informações Técnicas */}
        <div className={styles.sideCol}>
          <div className={styles.card}>
            <h3 className={styles.sideTitle}>Responsável (Dev)</h3>
            <div className={styles.userRow}>
              <div className={styles.avatar}>{task.owner.substring(0,2)}</div>
              <span className={styles.userName}>{task.owner}</span>
            </div>
          </div>

          <div className={styles.card}>
            <h3 className={styles.sideTitle}>Controle de Esforço (Horas) <span title="Seu Token atual do Taskrow está restrito para ler Timesheets" style={{cursor: 'help', color: 'orange'}}>⚠️ Mock</span></h3>
            <div className={styles.progressHeader}>
              <span className={styles.timeLabel}>
                <strong>{task.hoursTracked}h</strong> trackeadas
              </span>
              <span className={styles.timeLabel}>
                Estimativa: {task.hoursEstimated}h
              </span>
            </div>
            <div className={styles.progressBarWrapper}>
              <div 
                className={styles.progressBarFill} 
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>

          <div className={styles.card}>
            <h3 className={styles.sideTitle}>Metadados</h3>
            <ul className={styles.metaList}>
              <li>
                <Calendar size={14} className={styles.metaIcon} />
                <span>Prazo: {task.dueDate?.split('T')[0] || 'Sem prazo'}</span>
              </li>
              <li>
                <Tag size={14} className={styles.metaIcon} />
                <span>Cliente: {task.client}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
