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
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'kanban' | 'sprint'>('kanban');
  const [tasks, setTasks] = useState<any[]>([]);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);

  const isAdmin = user?.role === 'GESTOR' || user?.role === 'ADMINISTRADOR';

  useEffect(() => {
    const saved = localStorage.getItem('f2f_internal_projects');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure tasks have necessary fields for Sprint View
        setTasks(parsed.map((t: any) => ({
          ...t,
          client: t.client || 'Geral',
          trackedTime: t.trackedTime || '0h',
          estimation: t.estimation || '--',
          qaDelivery: t.qaDelivery || '--',
          dueDate: t.dueDate || '--',
          createdAt: t.createdAt || '18/03/26'
        })));
      } catch(e) {}
    }
  }, []);

  // --- Kanban Handlers ---
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDrop = (e: React.DragEvent, targetColId: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId') || draggedTaskId;
    if (taskId) {
      const updated = tasks.map(t => t.id === taskId ? { ...t, column: targetColId } : t);
      setTasks(updated);
      localStorage.setItem('f2f_internal_projects', JSON.stringify(updated));
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
           {isAdmin && (
             <button 
               className={`${styles.tabBtn} ${activeTab === 'sprint' ? styles.activeTabBtn : ''}`}
               onClick={() => setActiveTab('sprint')}
             >
               <ListTodo size={16} style={{ marginRight: 8, display: 'inline', verticalAlign: 'middle' }} />
               Sprint
             </button>
           )}
        </div>

        <div className={styles.headerActions}>
           <button className={styles.btnSecondary}><Filter size={16} /></button>
           <button className={styles.btnPrimary}><Plus size={16} /> Nova Tarefa</button>
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
                      <div key={task.id} className={styles.taskCard} draggable onDragStart={(e) => handleDragStart(e, task.id)}>
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
                      <button className={styles.textBtn} style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--accent-primary)' }}>+ TAREFA</button>
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
                        <tr key={t.id}>
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
      </main>

      <style jsx>{`
        .textBtn { background: transparent; border: none; cursor: pointer; }
        .iconBtn { background: transparent; border: none; cursor: pointer; color: var(--text-secondary); opacity: 0.6; }
      `}</style>
    </div>
  );
}
