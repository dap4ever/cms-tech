'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  GitPullRequest, 
  Plus, 
  Filter, 
  Inbox, 
  Kanban, 
  ListTodo, 
  ChevronDown, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  User, 
  MoreHorizontal,
  AlertCircle 
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import styles from './projects.module.css';

// --- Constants ---
const columns = [
  { id: 'todo', title: 'A Fazer' },
  { id: 'inProgress', title: 'Em Andamento' },
  { id: 'inReview', title: 'Em Revisão' },
  { id: 'done', title: 'Concluído' },
];

const STATUS_MAP: Record<string, { label: string; class: string }> = {
  todo: { label: 'TRIAGEM', class: styles.status_todo },
  inProgress: { label: 'EM ANDAMENTO', class: styles.status_inProgress },
  inReview: { label: 'EM APROVAÇÃO', class: styles.status_inReview },
  done: { label: 'FINALIZADO', class: styles.status_done },
};

const PRIORITY_MAP: Record<string, { label: string; color: string; bg: string }> = {
  low: { label: 'BAIXA', color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.1)' },
  normal: { label: 'NORMAL', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.1)' },
  high: { label: 'ALTA', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
  critical: { label: 'CRÍTICA', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' }
};

const normalizeTaskColumn = (column?: string | null) => {
  const normalized = (column || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

  if (!normalized) return 'todo';

  if (['todo', 'to_do', 'a fazer', 'afazer', 'triagem', 'backlog'].includes(normalized)) {
    return 'todo';
  }

  if (['inprogress', 'in_progress', 'progress', 'em andamento', 'emandamento'].includes(normalized)) {
    return 'inProgress';
  }

  if (['inreview', 'in_review', 'review', 'em revisao', 'emrevisao', 'em aprovacao', 'emaprovacao'].includes(normalized)) {
    return 'inReview';
  }

  if (['done', 'completed', 'complete', 'concluido', 'finalizado'].includes(normalized)) {
    return 'done';
  }

  return 'todo';
};

// --- Component ---
export default function InternalProjects() {
  const { user, isGestor, isGerente, isDev, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'kanban' | 'sprint'>('kanban');
  const [tasks, setTasks] = useState<any[]>([]);
  const [sprints, setSprints] = useState<any[]>([]);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, taskId: string | null }>({ x: 0, y: 0, taskId: null });

  useEffect(() => {
    fetchAssignments();
    fetchSprints();
  }, []);

  const fetchSprints = async () => {
    try {
      const res = await fetch('/api/sprints');
      const data = await res.json();
      if (data.success) setSprints(data.sprints);
    } catch (e) {
      console.error('Error fetching sprints:', e);
    }
  };
  useEffect(() => {
    const handleClick = () => setContextMenu({ ...contextMenu, taskId: null });
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [contextMenu]);

  const handleContextMenu = (e: React.MouseEvent, taskId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, taskId });
  };

  const handleReturnToInbox = async (taskId: string) => {
    if (!confirm('Deseja devolver esta tarefa para a Caixa de Entrada? Ela será removida do Kanban local.')) return;

    try {
      const res = await fetch(`/api/tasks/assign?taskId=${taskId}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Erro ao remover do banco');

      const updated = tasks.filter(t => t.id !== taskId);
      setTasks(updated);
      
      // Manter redundância localStorage para compatibilidade
      localStorage.setItem('f2f_internal_projects', JSON.stringify(updated));
      setContextMenu({ ...contextMenu, taskId: null });
    } catch (err: any) {
      alert('Erro: ' + err.message);
    }
  };

  const handleTaskClick = (task: any) => {
    const rawData = task.rawData || {};
    
    // O clientNickname correto vem do campo urlData do Taskrow
    let parsedUrlData: any = {};
    try {
      if (rawData.urlData) parsedUrlData = JSON.parse(rawData.urlData);
    } catch(e) {}
    
    const cNick = parsedUrlData.ClientNickName || rawData.clientNickName || rawData.clientNickname || task.client;
    const jNum = parsedUrlData.JobNumber || rawData.jobNumber || rawData.JobNumber;
    
    let url = `/taskrow/task/${task.id}`;
    if (cNick && jNum) {
      url += `?client=${encodeURIComponent(cNick)}&job=${jNum}`;
    }
    window.location.href = url;
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const res = await fetch('/api/tasks/assignments');
      const data = await res.json();
      if (data.assignments) {
        let mappedTasks = data.assignments.map((a: any) => {
          const topics = (a.qcMetadata as any[]) || [];
          const totalAdj = topics.reduce((acc, t) => acc + (t.adjustments?.length || 0), 0);
          const fixedAdj = topics.reduce((acc, t) => acc + (t.adjustments?.filter((adj: any) => adj.isFixed).length || 0), 0);

          let qaColor = 'transparent';
          if (a.qaApproved) {
            qaColor = '#10b881'; // Verde
          } else if (totalAdj > 0) {
            qaColor = '#ef4444'; // Vermelho
          } else if (a.column === 'inReview') {
            qaColor = '#f59e0b'; // Amarelo
          }

          return {
            id: a.taskId,
            title: a.title,
            client: a.client,
            sprintId: a.sprintId,
            sprintName: a.sprint?.name || 'Sem Sprint',
            column: normalizeTaskColumn(a.column),
            assignee: a.users && a.users.length > 0 ? a.users.map((u:any) => u.name).join(', ') : 'Não atribuído',
            assigneeIds: a.users ? a.users.map((u:any) => u.id) : [],
            priority: a.priority || 'normal',
            qaColor,
            trackedTime: a.trackedTime || '0h',
            estimation: a.estimationHr || '--',
            qaApproved: a.qaApproved || false,
            hasFails: !a.qaApproved && totalAdj > 0,
            qcTotal: totalAdj,
            qcFixed: fixedAdj,
            qaDelivery: a.qaApproved ? 'Aprovado' : 'Pendente',
            dueDate: '--',
            createdAt: new Date(a.createdAt).toLocaleDateString('pt-BR')
          };
        });

        if (!isAdmin && !isGestor && user?.id) {
           mappedTasks = mappedTasks.filter((t: any) => t.assigneeIds.includes(user.id));
        }

        setTasks(mappedTasks);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerateSprint = async () => {
    try {
      const res = await fetch('/api/sprints', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        fetchSprints();
        alert('Sprint gerada com sucesso para a próxima semana!');
      }
    } catch (e) {
      alert('Erro ao gerar sprint');
    }
  };

  const handleUpdateSprint = async (taskId: string, sprintId: string) => {
    try {
      const res = await fetch('/api/tasks/assignments/sprint', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, sprintId })
      });
      const data = await res.json();
      if (data.success) {
        fetchAssignments();
      }
    } catch (e) {
      alert('Erro ao atualizar sprint');
    }
  };

  const handleRevertQA = async (taskId: string) => {
    if (!confirm('Deseja reverter a aprovação de QA? A tarefa voltará para a fila de auditoria.')) return;
    try {
      const res = await fetch('/api/tasks/assignments/qa-revert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId })
      });
      if (res.ok) {
        fetchAssignments();
        setContextMenu({ ...contextMenu, taskId: null });
      }
    } catch (e) {
      alert('Erro ao reverter QA');
    }
  };

  const handleUpdatePriority = async (taskId: string, priority: string) => {
    try {
      const res = await fetch('/api/tasks/assignments/priority', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, priority })
      });
      if (res.ok) {
        fetchAssignments();
        setContextMenu({ ...contextMenu, taskId: null });
      }
    } catch (e) {
      alert('Erro ao atualizar prioridade');
    }
  };

  // --- Kanban Handlers ---
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDrop = async (e: React.DragEvent, targetColId: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId') || draggedTaskId;
    
    if (taskId) {
      const task = tasks.find(t => t.id === taskId);
      
      // Validação de QC: Não pode ir para Done se não tiver aprovação e estiver saindo de InReview
      if (targetColId === 'done' && task && !task.qaApproved) {
         alert('Esta demanda precisa ser aprovada no Quality Check para ser finalizada.');
         setDraggedTaskId(null);
         setDragOverColumnId(null);
         return;
      }

      // Otimista
      const updated = tasks.map(t => t.id === taskId ? { ...t, column: targetColId } : t);
      setTasks(updated);

      try {
        await fetch('/api/tasks/assignments/column', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ taskId, column: targetColId })
        });
      } catch (err) {
        alert('Erro ao mover tarefa no DB.');
      }
    }
    setDraggedTaskId(null);
    setDragOverColumnId(null);
  };

  // --- Sprint Logic ---
  const groupedTasks = tasks.reduce((acc: any, task) => {
    const sName = task.sprintName || 'Sem Sprint';
    if (!acc[sName]) acc[sName] = [];
    acc[sName].push(task);
    return acc;
  }, {});

  const normalizeSprintName = (name: string) =>
    name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();

  const now = new Date();
  const currentSprint = sprints.find((sprint) => {
    const start = new Date(sprint.startDate);
    const end = new Date(sprint.endDate);

    return now >= start && now <= end;
  });

  const isCriticalSprintName = (name: string) =>
    normalizeSprintName(name).includes('critic');

  const isCurrentSprintName = (name: string) =>
    Boolean(currentSprint && currentSprint.name === name);

  const sprintEntries = Object.entries(groupedTasks) as [string, any[]][];
  const criticalSprintEntry = sprintEntries.find(([sName]) =>
    isCriticalSprintName(sName)
  );
  const hasOpenCriticalTasks = Boolean(
    criticalSprintEntry?.[1].some((task) => task.column !== 'done')
  );

  const orderedSprintEntries = sprintEntries
    .sort(([nameA], [nameB]) => {
      const rankSprint = (name: string) => {
        if (hasOpenCriticalTasks && isCriticalSprintName(name)) {
          return 0;
        }

        if (isCurrentSprintName(name)) {
          return 1;
        }

        return 2;
      };

      const rankA = rankSprint(nameA);
      const rankB = rankSprint(nameB);

      if (rankA !== rankB) {
        return rankA - rankB;
      }

      const sprintA = sprints.find((sprint) => sprint.name === nameA);
      const sprintB = sprints.find((sprint) => sprint.name === nameB);

      if (sprintA?.startDate && sprintB?.startDate) {
        return new Date(sprintB.startDate).getTime() - new Date(sprintA.startDate).getTime();
      }

      return nameA.localeCompare(nameB, 'pt-BR');
    });

  const formatMinutes = (totalMinutes: number) => {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h}h${m > 0 ? ` ${m}m` : ''}`;
  };

  const parseTrackedTimeToMinutes = (value: string) => {
    const time = (value || '').trim();
    if (!time) return 0;

    if (/^\d+$/.test(time)) {
      return Math.floor(parseInt(time, 10) / 60);
    }

    const match = time.match(/(?:(\d+)h)?\s*(?:(\d+)m)?/i);
    if (match && (match[1] || match[2])) {
      return (parseInt(match[1] || '0', 10) * 60) + parseInt(match[2] || '0', 10);
    }

    const numeric = parseFloat(time);
    return Number.isNaN(numeric) ? 0 : Math.round(numeric * 60);
  };

  const parseEstimationToMinutes = (value: string) => {
    const time = (value || '').trim();
    if (!time || time === '--') return 0;

    const match = time.match(/(?:(\d+)h)?\s*(?:(\d+)m)?/i);
    if (match && (match[1] || match[2])) {
      return (parseInt(match[1] || '0', 10) * 60) + parseInt(match[2] || '0', 10);
    }

    const numeric = parseFloat(time);
    return Number.isNaN(numeric) ? 0 : Math.round(numeric * 60);
  };

  const calculateTrackedTime = (tasksInGroup: any[]) =>
    formatMinutes(
      tasksInGroup.reduce((totalMinutes, task) => (
        totalMinutes + parseTrackedTimeToMinutes(task.trackedTime || '0h')
      ), 0)
    );

  const calculateEstimatedTime = (tasksInGroup: any[]) =>
    formatMinutes(
      tasksInGroup.reduce((totalMinutes, task) => (
        totalMinutes + parseEstimationToMinutes(task.estimation || '--')
      ), 0)
    );

  const calculateTotalTime = (tasksInGroup: any[]) =>
    formatMinutes(
      tasksInGroup.reduce((totalMinutes, task) => (
        totalMinutes +
        parseTrackedTimeToMinutes(task.trackedTime || '0h') +
        parseEstimationToMinutes(task.estimation || '--')
      ), 0)
    );

  return (
    <div className={styles.premiumContainer}>
      <header className={styles.pageHeader}>
        <div className={styles.titleArea}>
          <div>
            <h1 className={styles.pageTitle}>Gestão de Projetos</h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Mapeamento de demandas e entregas técnicas</p>
          </div>
        </div>
        <div className={styles.tabSwitcher}>
           <button 
             className={`${styles.tabBtn} ${activeTab === 'kanban' ? styles.activeTabBtn : ''}`}
             onClick={() => setActiveTab('kanban')}
           >
             <Kanban size={16} style={{ marginRight: 8, display: 'inline', verticalAlign: 'middle' }} />
             Quadro
           </button>
           <button 
             className={`${styles.tabBtn} ${activeTab === 'sprint' ? styles.activeTabBtn : ''}`}
             onClick={() => setActiveTab('sprint')}
           >
             <ListTodo size={16} style={{ marginRight: 8, display: 'inline', verticalAlign: 'middle' }} />
             Sprint
           </button>
        </div>

        <div className={styles.headerActions}>
           {activeTab === 'sprint' && (isAdmin || isGestor) && (
             <button className={styles.btnSecondary} onClick={handleGenerateSprint} title="Gerar próxima Sprint semanal (Seg-Sex)">
               <Calendar size={16} style={{ marginRight: 8, display: 'inline' }} />
               Gerar Sprint
             </button>
           )}
           <button className={styles.btnSecondary}><Filter size={16} /></button>
           {isAdmin && (
             <button className={styles.btnPrimary}><Plus size={16} /> Nova Tarefa</button>
           )}
        </div>
      </header>

      <main className={styles.pageContent}>
        {activeTab === 'kanban' && (
          <section className={styles.kanbanViewport}>
            <div className={styles.kanbanBoard}>
              {columns.map(col => {
                const columnTasks = tasks.filter(t => t.column === col.id);
                return (
                  <div 
                    key={col.id} 
                    className={`${styles.kanbanColumn} ${dragOverColumnId === col.id ? styles.columnDragOver : ''}`}
                    onDragOver={(e) => { e.preventDefault(); setDragOverColumnId(col.id); }}
                    onDrop={(e) => handleDrop(e, col.id)}
                  >
                    <div className={styles.columnHeader}>
                      <span className={styles.columnTitle}>{col.title}</span>
                      <span className={styles.columnCount}>{columnTasks.length}</span>
                    </div>
                    <div className={styles.columnContent}>
                      {columnTasks.map(task => (
                        <div
                          key={task.id}
                          className={`${styles.taskCard} ${task.hasFails ? styles.cardHasFails : ''}`}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task.id)}
                          onContextMenu={(e) => handleContextMenu(e, task.id)}
                          onClick={() => handleTaskClick(task)}
                        >
                          <div className={styles.taskHeader}>
                             <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                               {task.hasFails && (
                                 <div className={styles.failBadge}>
                                   <AlertCircle size={10} />
                                   {task.qcFixed}/{task.qcTotal} AJUSTES
                                 </div>
                               )}
                             </div>
                             <div className={styles.taskPriority} style={{ backgroundColor: task.qaColor }}></div>
                          </div>
                          <h3 className={styles.taskTitle}>{task.title}</h3>
                          <div style={{ marginTop: '4px', marginBottom: '8px' }}>
                             <span style={{ 
                                fontSize: '0.6rem', 
                                fontWeight: 800, 
                                padding: '2px 8px', 
                                borderRadius: '4px', 
                                background: PRIORITY_MAP[task.priority]?.bg || 'rgba(255,255,255,0.05)',
                                color: PRIORITY_MAP[task.priority]?.color || 'var(--text-secondary)',
                                display: 'inline-block'
                             }}>
                                {PRIORITY_MAP[task.priority]?.label || 'NORMAL'}
                             </span>
                          </div>
                          
                          {task.hasFails && (
                            <div className={styles.cardProgressArea}>
                              <div className={styles.cardProgressBar}>
                                <div 
                                  className={styles.cardProgressFill} 
                                  style={{ width: `${(task.qcFixed / task.qcTotal) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          )}

                          <div className={styles.cardTimeInfo}>
                             <Clock size={12} />
                             <span>{task.trackedTime} / {task.estimation}</span>
                          </div>

                          <div className={styles.taskFooter}>
                             <div className={styles.assigneeCircle}>{task.assignee?.[0] || 'U'}</div>
                             <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{task.client}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {activeTab === 'sprint' && (
          <section className={styles.sprintBoard}>
            {orderedSprintEntries.map(([sName, sTasks]) => (
              <div key={sName} className={styles.clientGroup}>
                <div className={styles.groupHeader}>
                   <div className={styles.clientInfo}>
                      <ChevronDown size={18} color="var(--text-secondary)" />
                      <span className={styles.clientBadge} style={{ background: sName === 'Sem Sprint' ? 'var(--bg-secondary)' : 'var(--accent-primary)', color: sName === 'Sem Sprint' ? 'var(--text-secondary)' : '#fff' }}>
                        {sName === 'Sem Sprint' ? 'BACKLOG' : 'SPRINT'}
                      </span>
                      <span className={styles.clientName}>{sName}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '12px' }}>{sTasks.length} tarefas</span>
                   </div>
                   <div className={styles.sprintHeaderStats}>
                      <div className={styles.sprintStatChip}>
                        <span className={styles.sprintStatLabel}>Estimativa</span>
                        <strong className={styles.sprintStatValue}>{calculateEstimatedTime(sTasks)}</strong>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Esforço: <strong>{calculateTotalTime(sTasks)}</strong></span>
                      <div className={styles.sprintStatChip}>
                        <span className={styles.sprintStatLabel}>Tracked</span>
                        <strong className={styles.sprintStatValue}>{calculateTrackedTime(sTasks)}</strong>
                      </div>
                      <div className={styles.sprintStatChip}>
                        <span className={styles.sprintStatLabel}>Esforco Total</span>
                        <strong className={styles.sprintStatValue}>{calculateTotalTime(sTasks)}</strong>
                      </div>
                      <button className={styles.iconBtn}><MoreHorizontal size={18} /></button>
                   </div>
                </div>
                <div className={styles.sprintTableViewport}>
                <table className={styles.sprintTable}>
                   <colgroup>
                      <col style={{ width: '36%' }} />
                      <col style={{ width: '8%' }} />
                      <col style={{ width: '12%' }} />
                      <col style={{ width: '9rem' }} />
                      <col style={{ width: '17rem' }} />
                      <col style={{ width: '8%' }} />
                      <col style={{ width: '9rem' }} />
                      <col style={{ width: '8rem' }} />
                      <col style={{ width: '8rem' }} />
                   </colgroup>
                   <thead>
                      <tr>
                         <th>Nome</th>
                         <th>Responsável</th>
                         <th>Status</th>
                         <th>Criada</th>
                         <th>Sprint</th>
                         <th>QA</th>
                         <th>Vencimento</th>
                         <th>Estimativa</th>
                         <th>Tracked</th>
                      </tr>
                   </thead>
                   <tbody>
                       {sTasks.map((t: any) => (
                         <tr 
                           key={t.id} 
                           onContextMenu={(e) => handleContextMenu(e, t.id)}
                           onClick={(e) => {
                             if ((e.target as HTMLElement).tagName === 'SELECT') return;
                             handleTaskClick(t);
                           }}
                         >
                            <td>
                               <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <div className={styles.taskPriority} style={{ backgroundColor: t.qaColor, width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0 }}></div><CheckCircle2 size={16} color={t.column === 'done' ? 'var(--status-success)' : 'var(--text-secondary)'} />
                                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: 600 }}>{t.title}</span>
                                    <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>{t.client}</span>
                                  </div>
                               </div>
                            </td>
                            <td>
                               <div className={styles.assigneeCircle} title={t.assignee}>{t.assignee?.[0] || 'U'}</div>
                            </td>
                            <td>
                               <span className={`${styles.statusBadge} ${(STATUS_MAP[t.column] || STATUS_MAP['todo']).class}`}>
                                  {(STATUS_MAP[t.column] || STATUS_MAP['todo']).label}
                               </span>
                            </td>
                            <td>
                               <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                                 {t.createdAt}
                               </span>
                            </td>
                            <td>
                               {(isAdmin || isGestor) ? (
                                 <select 
                                   className={styles.sprintSelector}
                                   value={t.sprintId || ''}
                                   onChange={(e) => handleUpdateSprint(t.id, e.target.value)}
                                   onClick={(e) => e.stopPropagation()}
                                 >
                                    <option value="">Sem Sprint</option>
                                    {sprints.map(s => (
                                      <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                 </select>
                               ) : (
                                 <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{t.sprintName}</span>
                               )}
                             </td>
                             <td style={{ color: 'var(--text-secondary)' }}>{t.qaDelivery}</td>
                             <td style={{ color: t.dueDate === 'Hoje' ? '#f87171' : 'var(--text-secondary)' }}>{t.dueDate}</td>
                             <td style={{ fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{t.estimation}</td>
                             <td style={{ fontWeight: 700, color: 'var(--accent-secondary)', whiteSpace: 'nowrap' }}>{t.trackedTime}</td>
                         </tr>
                       ))}
                        <tr className={styles.summaryRow}>
                         <td colSpan={9} style={{ textAlign: 'right', paddingRight: '24px' }}>
                            <div className={styles.sprintSummaryContent}>
                              <span className={styles.sprintSummaryTitle}>Resumo da Sprint</span>
                              <div className={styles.sprintSummaryStats}>
                                <div className={styles.sprintStatChip}>
                                  <span className={styles.sprintStatLabel}>Tracked</span>
                                  <strong className={styles.sprintStatValue}>{calculateTrackedTime(sTasks)}</strong>
                                </div>
                                <div className={styles.sprintStatChip}>
                                  <span className={styles.sprintStatLabel}>Estimativa</span>
                                  <strong className={styles.sprintStatValue}>{calculateEstimatedTime(sTasks)}</strong>
                                </div>
                                <div className={styles.sprintStatChip}>
                                  <span className={styles.sprintStatLabel}>Esforco Total</span>
                                  <strong className={styles.sprintStatValue}>{calculateTotalTime(sTasks)}</strong>
                                </div>
                              </div>
                            </div>
                            Esforço da Sprint (Tracked + IA): <span className={styles.totalLabel}>{calculateTotalTime(sTasks)}</span>
                            <span style={{ marginRight: '12px' }}>Tracked total: <span className={styles.totalLabel}>{calculateTrackedTime(sTasks)}</span></span>
                         </td>
                       </tr>
                    </tbody>
                </table>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* Context Menu UI */}
        {contextMenu.taskId && (
          <div
            className={styles.contextMenu}
            style={{ top: contextMenu.y, left: contextMenu.x }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={styles.contextMenuItem}
              onClick={() => handleReturnToInbox(contextMenu.taskId!)}
            >
              <Inbox size={14} style={{ marginRight: 8 }} />
              Devolver para Caixa de Entrada
            </button>

            {(() => {
              const t = tasks.find(tsk => tsk.id === contextMenu.taskId);
              return t?.qaApproved && (
                <button
                  className={styles.contextMenuItem}
                  onClick={() => handleRevertQA(contextMenu.taskId!)}
                  style={{ color: 'var(--status-warning)', marginTop: '4px', borderTop: '1px solid var(--border-color)', borderRadius: '0 0 var(--radius-sm) var(--radius-sm)' }}
                >
                  <AlertCircle size={14} style={{ marginRight: 8 }} />
                  Reverter Aprovação QA
                </button>
              );
            })()}
          </div>
        )}
      </main>
    </div>
  );
}
