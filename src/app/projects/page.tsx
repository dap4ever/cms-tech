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
  MoreHorizontal 
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

// --- Component ---
export default function InternalProjects() {
  const { user, isGestor, isGerente, isDev, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'kanban' | 'sprint'>('kanban');
  const [tasks, setTasks] = useState<any[]>([]);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, taskId: string | null }>({ x: 0, y: 0, taskId: null });



  useEffect(() => {
    const handleClick = () => setContextMenu({ ...contextMenu, taskId: null });
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [contextMenu]);

  const handleContextMenu = (e: React.MouseEvent, taskId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, taskId });
  };

  const handleReturnToInbox = (taskId: string) => {
    const updated = tasks.filter(t => t.id !== taskId);
    setTasks(updated);
    localStorage.setItem('f2f_internal_projects', JSON.stringify(updated));
    setContextMenu({ ...contextMenu, taskId: null });
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
        const mappedTasks = data.assignments.map((a: any) => ({
          id: a.taskId,
          title: a.title,
          client: a.client,
          column: a.column || 'todo',
          assignee: a.user?.name || 'U',
          priority: 'high', // mock por enquanto
          trackedTime: '0h',
          estimation: a.estimationHr || '--',
          qaApproved: a.qaApproved || false,
          qaDelivery: a.qaApproved ? 'Aprovado' : 'Pendente',
          dueDate: '--',
          createdAt: new Date(a.createdAt).toLocaleDateString('pt-BR')
        }));
        setTasks(mappedTasks);
      }
    } catch (e) {
      console.error(e);
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
    const client = task.client || 'Sem Cliente';
    if (!acc[client]) acc[client] = [];
    acc[client].push(task);
    return acc;
  }, {});

  const calculateTotalTime = (tasksInGroup: any[]) => {
    let totalMinutes = 0;
    tasksInGroup.forEach(t => {
      const time = t.trackedTime || '0h';
      const match = time.match(/(\d+)h\s*(\d*)m?/);
      if (match) {
        totalMinutes += parseInt(match[1]) * 60 + (parseInt(match[2]) || 0);
      }
    });

    // Add API estimations
    tasksInGroup.forEach(t => {
       if (t.estimation !== '--') {
          const mApi = t.estimation.match(/(\d+)h\s*(\d*)m?/);
          if (mApi) {
             const h = parseInt(mApi[1]) || 0;
             const m = parseInt(mApi[2]) || 0;
             totalMinutes += (h * 60) + m;
          } else if (t.estimation.includes('m')) {
             totalMinutes += parseInt(t.estimation);
          }
       }
    });

    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h}h ${m > 0 ? m + 'm' : ''}`;
  };

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
           <button className={styles.btnSecondary}><Filter size={16} /></button>
           {isAdmin && (
             <button className={styles.btnPrimary}><Plus size={16} /> Nova Tarefa</button>
           )}
        </div>
      </header>

      <main>
        {activeTab === 'kanban' && (
          <section className={styles.kanbanBoard}>
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
                        className={styles.taskCard}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onContextMenu={(e) => handleContextMenu(e, task.id)}
                        onClick={() => handleTaskClick(task)}
                      >
                        <div className={styles.taskHeader}>
                           <span className={styles.taskId}>{task.id}</span>
                           <div className={`${styles.taskPriority} ${task.priority === 'high' ? styles.priorityHigh : styles.priorityLow}`}></div>
                        </div>
                        <h3 className={styles.taskTitle}>{task.title}</h3>
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
          </section>
        )}

        {activeTab === 'sprint' && (
          <section className={styles.sprintBoard}>
            {Object.entries(groupedTasks).map(([client, clientTasks]: [string, any]) => (
              <div key={client} className={styles.clientGroup}>
                <div className={styles.groupHeader}>
                   <div className={styles.clientInfo}>
                      <ChevronDown size={18} color="var(--text-secondary)" />
                      <span className={styles.clientBadge}>[F] {client}</span>
                      <span className={styles.clientName}>{client}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '12px' }}>{clientTasks.length} tarefas</span>
                   </div>
                   <div style={{ display: 'flex', gap: '16px' }}>
                      {isAdmin && (
                        <button className={styles.textBtn} style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--accent-primary)' }}>+ TAREFA</button>
                      )}
                      <button className={styles.iconBtn}><MoreHorizontal size={18} /></button>
                   </div>
                </div>
                <table className={styles.sprintTable}>
                   <thead>
                      <tr>
                         <th style={{ width: '40%' }}>Nome</th>
                         <th>Responsável</th>
                         <th>Status</th>
                         <th>Criada</th>
                         <th>QA</th>
                         <th>Vencimento</th>
                         <th>Estimativa</th>
                         <th>Tracked</th>
                      </tr>
                   </thead>
                   <tbody>
                      {clientTasks.map((t: any) => (
                        <tr 
                          key={t.id} 
                          onContextMenu={(e) => handleContextMenu(e, t.id)}
                          onClick={() => handleTaskClick(t)}
                        >
                           <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                 <CheckCircle2 size={16} color={t.column === 'done' ? 'var(--status-success)' : 'var(--text-secondary)'} />
                                 <span style={{ fontWeight: 600 }}>{t.title}</span>
                              </div>
                           </td>
                           <td>
                              <div className={styles.assigneeCircle} title={t.assignee}>{t.assignee?.[0] || 'U'}</div>
                           </td>
                           <td>
                              <span className={`${styles.statusBadge} ${STATUS_MAP[t.column].class}`}>
                                 {STATUS_MAP[t.column].label}
                              </span>
                           </td>
                           <td style={{ color: 'var(--text-secondary)' }}>{t.createdAt}</td>
                           <td style={{ color: 'var(--text-secondary)' }}>{t.qaDelivery}</td>
                           <td style={{ color: t.dueDate === 'Hoje' ? '#f87171' : 'var(--text-secondary)' }}>{t.dueDate}</td>
                           <td style={{ textAlign: 'center' }}><Clock size={14} style={{ display: 'inline', opacity: 0.5 }} /></td>
                           <td style={{ fontWeight: 700, color: 'var(--accent-secondary)' }}>{t.trackedTime}</td>
                        </tr>
                      ))}
                      <tr className={styles.summaryRow}>
                        <td colSpan={8}>
                           Total: <span className={styles.totalLabel}>{calculateTotalTime(clientTasks)}</span>
                        </td>
                      </tr>
                   </tbody>
                </table>
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
          </div>
        )}
      </main>
    </div>
  );
}
