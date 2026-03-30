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
import { TimeTracker } from '@/components/task/TimeTracker';
import { ObservationSection } from '@/components/task/ObservationSection';
import { TaskHistory } from '@/components/task/TaskHistory';
import { TaskTitleEditor } from '@/components/task/TaskTitleEditor';
import { ExtraAssigneeManager } from '@/components/task/ExtraAssigneeManager';
import { QualityReportContainer } from '@/components/task/QualityReportContainer';
import { TaskGovernance } from '@/components/task/TaskGovernance';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// Reescreve URLs de imagens Taskrow para usar nosso proxy local (necessário pois img tags não podem enviar headers auth)
function rewriteTaskrowImages(html: string): string {
  if (!html) return html;
  // Cobre todas as variantes: https://host/File/..., /File/... e File/... (relativa)
  return html.replace(
    /src=["'](?:https?:\/\/[^/]+\/|\/)?File\/TaskImageByGuid\/\?identification=([^&"']+)&(?:amp;)?mimeType=([^&"']+)(?:[^"']*)["']/gi,
    (_match, identification, mimeType) => {
      const id = decodeURIComponent(identification);
      const mime = decodeURIComponent(mimeType);
      const proxied = `/api/taskrow/image?identification=${encodeURIComponent(id)}&mimeType=${encodeURIComponent(mime)}`;
      return `src="${proxied}"`;
    }
  );
}

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

  const numericId = taskId;
  // Busca do nosso novo Proxy Backend que já faz o merge da lista + TaskDetail Oficial
  const url = `http://localhost:3000/api/taskrow/task/${numericId}`;
  
  const res = await fetch(url, { cache: 'no-store' });

  if (!res.ok) throw new Error(`Erro API Proxied: ${res.status}`);

  const payload = await res.json();
  if (!payload.success) throw new Error(payload.error || 'Tarefa não encontrada');
  
  const rootTask = payload.summary;
  // payload.summary é um KanbanTask: { id, title, column, rawData, assignee, client, ... }
  // Os campos detalhados do Taskrow estão dentro de rawData
  const raw = rootTask?.rawData || {};
  
  return {
    id: rootTask?.id || taskId,
    title: raw.taskTitle || raw.title || rootTask?.title || 'Sem título',
    status: raw.pipelineStep || rootTask?.statusOriginal || 'A Fazer',
    priority: raw.priority || raw.Priority || rootTask?.priority || 'Normal',
    client: raw.clientDisplayName || raw.clientNickName || rootTask?.client || 'Geral',
    owner: raw.ownerUserLogin || rootTask?.assignee || 'Não Alocado',
    creationUser: raw.creationUserLogin || 'Usuário',
    job: `#${raw.jobNumber || 'N/A'} ${raw.jobTitle || raw.jobDisplayTitle || ''}`.trim(),
    hoursTracked: Math.floor(Math.random() * 20), 
    hoursEstimated: Math.floor(Math.random() * 40) + 10,
    createdDate: raw.creationDate || raw.created_at || 'Data desconhecida',
    dueDate: raw.dueDate || raw.due_date || rootTask?.dueDate || 'Nenhuma',
    details: payload.details?.TaskData || null,
    
    // Dados de fallback do rawData
    briefing: raw.taskItemComment || raw.TaskItemComment || raw.taskDescription || null,
    rawAttachments: raw.attachments || raw.Attachments || raw.TaskAttachments || [],
    detailError: payload.detailError || null,
  };
}

export default async function TaskDetail(props: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ from?: string }>
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const { id } = params;
  const isFromProjects = searchParams.from === 'projects';
  
  let task: any = null;
  let errorMsg = null;
  let dbAssignment = null;

  const session = await getSession() as any;
  const isAdminOrGestor = session && (session.roles?.includes('GESTOR') || session.roles?.includes('ADMINISTRADOR'));
  const currentUser = session ? { id: session.userId as string, name: session.name as string, roles: (session.roles || []) as string[] } : { id: '', name: 'Anônimo', roles: [] };

  try {
    task = await getTaskData(id);
    dbAssignment = await (prisma as any).taskAssignment.findUnique({
      where: { taskId: id },
      include: { users: { select: { id: true, name: true, avatarUrl: true, roles: true } } }
    });

    const [allDbUsers, allSprints, timeEntries] = await Promise.all([
      (prisma as any).user.findMany({
         where: { NOT: { email: 'gestor@cms.tech' } },
         select: { id: true, name: true, roles: true },
         orderBy: { name: 'asc' }
      }),
      (prisma as any).sprint.findMany({
         orderBy: { startDate: 'asc' }
      }),
      (prisma as any).timeEntry.findMany({
         where: { taskId: id },
         include: { user: { select: { id: true, name: true, avatarUrl: true, roles: true } } },
         orderBy: { updatedAt: 'desc' },
      }),
    ]);

    task.allProjectUsers = allDbUsers;
    task.allSprints = allSprints;
    task.timeEntries = timeEntries;

  } catch (err: any) {
    errorMsg = err.message || 'Erro ao processar dados da tarefa';
  }

  if (errorMsg && !task) {
    return <div className={styles.errorContainer}>Erro: {errorMsg}</div>;
  }

  if (!task) notFound();

  // Interligação DB -> UI (Mescla Mock do Taskrow com Dados Reais da F2F Tech)
  if (dbAssignment) {
    task.originalTitle = task.title;
    if (dbAssignment.title && dbAssignment.title !== task.title) {
      task.title = dbAssignment.title;
    }
    
    if (dbAssignment.users && dbAssignment.users.length > 0) {
      task.dbUsers = dbAssignment.users;
    }

    if (dbAssignment.trackedTime) {
      const ms = parseFloat(dbAssignment.trackedTime);
      task.hoursTracked = isNaN(ms) ? 0 : parseFloat((ms / 3600).toFixed(1));
    }

    // Se há entradas na tabela TimeEntry, o total é a soma delas
    if (task.timeEntries && task.timeEntries.length > 0) {
      const sumHours = task.timeEntries.reduce((s: number, e: any) => s + e.hours, 0);
      task.hoursTracked = parseFloat(sumHours.toFixed(1));
    }

    if (dbAssignment.estimationHr) {
      task.hoursEstimated = parseFloat(dbAssignment.estimationHr) || 0;
    }
  }

  const progressPercentage = (task.hoursTracked / task.hoursEstimated) * 100 || 0;
  const isOverBudget = progressPercentage > 100;

  const backUrl = isFromProjects || dbAssignment ? "/projects" : "/taskrow";
  const backLabel = isFromProjects || dbAssignment ? "Voltar para Projetos" : "Voltar para o Caixa de Entrada";

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link href={backUrl} className={styles.backButton}>
          <ArrowLeft size={16} /> {backLabel}
        </Link>
        <div className={styles.titleSection}>
          <span className={styles.taskId}>{task.id}</span>
          <TaskTitleEditor taskId={task.id} defaultTitle={task.title} originalTitle={task.originalTitle || task.title} />
        </div>
        <div className={styles.metaBadges}>
          <span className={styles.badgeSolid}>{task.status}</span>
          <span className={styles.badgeOutline}><AlertCircle size={12}/> {task.priority}</span>
          <span className={styles.badgeOutline}><Briefcase size={12}/> Job {task.job || 'N/A'}</span>
        </div>
      </header>

      <div className={styles.grid}>
        {/* Coluna Principal da Descrição e Chat */}
        <div className={styles.mainCol}>
          
          {dbAssignment && dbAssignment.qcMetadata && (
            <QualityReportContainer 
              taskId={task.id} 
              initialTopics={dbAssignment.qcMetadata} 
            />
          )}

          {dbAssignment && (
            <ObservationSection 
              taskId={task.id} 
              historyItems={task.details?.NewTaskItems || []} 
              initialObservation={dbAssignment.localObservation || ""}
              initialImages={dbAssignment.localImages || []}
              initialAiSummary={dbAssignment.aiSummary || ""}
            />
          )}

          {/* Anexos Principais (Galeria) */}
          {/* Anexos Principais (Galeria do RawData ou TaskDetail) */}
          {(task.details?.TaskAttachments?.length > 0 || task.rawAttachments?.length > 0) && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Anexos da Tarefa</h2>
              <div className={styles.gallery}>
                 {(task.details?.TaskAttachments || task.rawAttachments || []).map((att: any, idx: number) => {
                    const mime = att.MimeType || att.mimeType || att.mime_type || 'image/png';
                    const name = att.Name || att.name || `Anexo_${idx}`;
                    const ident = att.Identification || att.identification;
                    const isImage = mime.startsWith('image/');
                    
                    // Se for direto do WP Media (url S3/local disponível)
                    const directUrl = att.url || att.Url;
                    
                    // Se precisar passar pelo proxy do Taskrow via guid
                    const proxyUrl = `/api/taskrow/image?identification=${encodeURIComponent(ident || '')}&mimeType=${encodeURIComponent(mime)}`;
                    const imageUrl = directUrl || proxyUrl;
                    const downloadUrl = directUrl || `${proxyUrl}&download=1`;

                    return (
                      <div key={idx} className={styles.attachmentItem}>
                         {isImage ? (
                           <a href={imageUrl} target="_blank" rel="noopener noreferrer" className={styles.imagePreview}>
                              <img src={imageUrl} alt={name} />
                           </a>
                         ) : (
                           <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className={styles.fileIcon}>📄</a>
                         )}
                         <div className={styles.attachmentMeta}>
                            <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className={styles.attachmentName}>
                               {name}
                            </a>
                            <span className={styles.attachmentSize}>{att.SizeInKB || att.size_in_kb ? `${att.SizeInKB || att.size_in_kb} KB` : ''}</span>
                         </div>
                      </div>
                    );
                 })}
              </div>
            </div>
          )}

          {/* Chat Timeline (NewTaskItems ou Briefing de fallback) */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Histórico e Atualizações</h2>
            {task.detailError && (
              <div style={{ backgroundColor: '#ffcccc', color: '#cc0000', padding: '10px', borderRadius: '4px', marginBottom: '15px', fontSize: '14px' }}>
                <strong>Aviso de Integração:</strong> Não foi possível puxar o histórico completo. {task.detailError}
              </div>
            )}
            
            {task.details?.NewTaskItems?.length > 0 ? (
               <TaskHistory items={task.details.NewTaskItems} taskOwner={task.owner} />
            ) : task.briefing ? (
               <TaskHistory items={[{
                 TaskItemType: 'Briefing Inicial',
                 TaskItemDate: task.createdDate,
                 UserLogin: task.creationUser,
                 TaskItemComment: task.briefing
               }]} taskOwner={task.owner} />
            ) : (
               <p className={styles.emptyHistory}>Nenhum comentário ou atualização registrado.</p>
            )}
          </div>
        </div>

        {/* Coluna Sidebar Lateral de Informações Técnicas */}
        <div className={styles.sideCol}>
          <TimeTracker 
            taskId={task.id} 
            initialHoursEstimated={task.hoursEstimated}
            initialHoursTracked={task.hoursTracked}
            currentUser={currentUser}
            timeEntries={task.timeEntries || []}
          />

          <TaskGovernance 
            taskId={task.id}
            initialColumn={dbAssignment?.column || 'todo'}
            initialSprintId={dbAssignment?.sprintId || null}
            initialPriority={dbAssignment?.priority || 'normal'}
            initialQAApproved={dbAssignment?.qaApproved || false}
            sprints={task.allSprints || []}
            isAdminOrGestor={isAdminOrGestor}
          />

          <div className={styles.card} style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 className={styles.sideTitle} style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                 Equipe Alocada
              </h3>
              <ExtraAssigneeManager 
                taskId={task.id} 
                taskTitle={task.title} 
                taskClient={task.client} 
                allUsers={task.allProjectUsers || []} 
              />
            </div>
            
            <div className={styles.userList}>
              {/* Prioriza usuários do banco, mas se vazio, mostra o dono do Taskrow */}
              {task.dbUsers && task.dbUsers.length > 0 ? (
                task.dbUsers.map((u: any) => (
                  <div key={u.id} className={styles.premiumUserRow}>
                    <div className={styles.avatarGlass}>
                        {u.avatarUrl ? (
                          <img src={u.avatarUrl} alt={u.name} className={styles.avatarImage} />
                        ) : (
                          u.name.substring(0,2).toUpperCase()
                        )}
                    </div>
                    <div className={styles.userInfo}>
                      <span className={styles.userNamePremium}>{u.name}</span>
                      <span className={styles.userRoleBadge}>
                         {u.roles?.includes('GESTOR') ? 'Gestor' : 'Dev Tech'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles.premiumUserRow}>
                  <div className={styles.avatarGlass}>
                    {task.owner.substring(0,2).toUpperCase()}
                  </div>
                  <div className={styles.userInfo}>
                    <span className={styles.userNamePremium}>{task.owner}</span>
                    <span className={styles.userRoleBadge}>Owner Taskrow</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className={styles.card}>
            <h3 className={styles.sideTitle}>Contador de Esforço (Horas)</h3>
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
                className={`${styles.progressBarFill}${isOverBudget ? ` ${styles.progressBarFillOver}` : ''}`}
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              ></div>
            </div>
            {/* Breakdown por usuário */}
            {task.timeEntries && task.timeEntries.length > 0 && (
              <div className={styles.effortBreakdown}>
                {task.timeEntries.map((entry: any) => (
                  <div key={entry.id} className={styles.effortRow}>
                    <div className={styles.effortAvatar}>
                      {entry.user.avatarUrl
                        ? <img src={entry.user.avatarUrl} alt={entry.user.name} className={styles.avatarImage} />
                        : entry.user.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className={styles.effortUserInfo}>
                      <span className={styles.effortUserName}>{entry.user.name}</span>
                      <span className={styles.effortBarOuter}>
                        <span
                          className={styles.effortBarInner}
                          style={{ width: `${task.hoursEstimated > 0 ? Math.min((entry.hours / task.hoursEstimated) * 100, 100) : 0}%` }}
                        />
                      </span>
                    </div>
                    <span className={styles.effortHours}>{entry.hours}h</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.card}>
            <h3 className={styles.sideTitle}>Metadados</h3>
            <ul className={styles.metaList}>
              <li>
                <Calendar size={14} className={styles.metaIcon} />
                <span>Prazo: {task.dueDate && task.dueDate !== 'Nenhuma' ? new Date(task.dueDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'Sem prazo'}</span>
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
