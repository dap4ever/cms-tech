"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { GitPullRequest, Plus, Filter, Inbox } from 'lucide-react';
import Link from 'next/link';
import styles from './projects.module.css';

const columns = [
  { id: 'todo', title: 'A Fazer' },
  { id: 'inProgress', title: 'Em Andamento' },
  { id: 'inReview', title: 'Em Revisão' },
  { id: 'done', title: 'Concluído' },
];

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  taskId: string | null;
}

export default function InternalProjects() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ visible: false, x: 0, y: 0, taskId: null });
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('f2f_internal_projects');
    if (saved) {
      try {
        setTasks(JSON.parse(saved));
      } catch(e) {}
    }
  }, []);

  // Fecha o menu ao clicar fora ou pressionar Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(prev => ({ ...prev, visible: false }));
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setContextMenu(prev => ({ ...prev, visible: false }));
      }
    };
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent, taskId: string) => {
    e.preventDefault();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, taskId });
  }, []);

  const handleReturnToInbox = useCallback(() => {
    if (!contextMenu.taskId) return;

    // Remove a tarefa do localStorage
    const saved = localStorage.getItem('f2f_internal_projects');
    if (saved) {
      try {
        const existing = JSON.parse(saved);
        const updated = existing.filter((t: any) => t.id !== contextMenu.taskId);
        localStorage.setItem('f2f_internal_projects', JSON.stringify(updated));
        setTasks(updated);
      } catch(e) {}
    }

    setContextMenu({ visible: false, x: 0, y: 0, taskId: null });
  }, [contextMenu.taskId]);

  // Handlers para Drag & Drop
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    setDragOverColumnId(colId);
  };

  const handleDragLeave = () => {
    setDragOverColumnId(null);
  };

  const handleDrop = (e: React.DragEvent, targetColId: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId') || draggedTaskId;
    
    if (taskId) {
      const updatedTasks = tasks.map(t => {
        if (t.id === taskId) {
          return { ...t, column: targetColId };
        }
        return t;
      });
      
      setTasks(updatedTasks);
      localStorage.setItem('f2f_internal_projects', JSON.stringify(updatedTasks));
    }
    
    setDraggedTaskId(null);
    setDragOverColumnId(null);
  };

  const getPriorityClass = (priority: string) => {
    switch(priority) {
      case 'high': return styles.priorityHigh;
      case 'medium': return styles.priorityMedium;
      default: return styles.priorityLow;
    }
  };

  return (
    <div>
      <header className={styles.pageHeader}>
        <div className={styles.titleArea}>
          <h1 className={styles.pageTitle}>Projetos Internos / Kanban Executivo</h1>
          <span className={styles.sprintBadge}>Demandas Aprovadas</span>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnSecondary}>
            <Filter size={16} style={{ marginRight: 8, display: 'inline' }} />
            Filtros
          </button>
          <button className={styles.btnPrimary}>
            <Plus size={16} style={{ marginRight: 8, display: 'inline' }} />
            Nova Tarefa
          </button>
        </div>
      </header>

      {tasks.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--text-secondary)' }}>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>Nenhuma tarefa internalizada ainda.</h2>
          <p>
            Vá até a <strong>Caixa de Entrada</strong> para revisar as demandas do Taskrow bruto e aprovar
            aquelas que sua equipe técnica irá trabalhar nesta sprint.
          </p>
        </div>
      ) : (
        <section className={styles.kanbanBoard}>
          {columns.map(col => {
            const columnTasks = tasks.filter(t => t.column === col.id);
            const isOver = dragOverColumnId === col.id;

            return (
              <div 
                key={col.id} 
                className={`${styles.kanbanColumn} ${isOver ? styles.columnDragOver : ''}`}
                onDragOver={(e) => handleDragOver(e, col.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, col.id)}
              >
                <div className={styles.columnHeader}>
                  <span className={styles.columnTitle}>{col.title}</span>
                  <span className={styles.columnCount}>{columnTasks.length}</span>
                </div>
                <div className={styles.columnContent}>
                  {columnTasks.map(task => (
                    <Link
                      key={task.id}
                      href={`/projects/task/${task.id}?from=projects`}
                      className={`${styles.taskCard} ${draggedTaskId === task.id ? styles.cardDragging : ''}`}
                      draggable
                      onDragStart={(e: React.DragEvent) => handleDragStart(e, task.id)}
                      onDragEnd={() => setDraggedTaskId(null)}
                      onContextMenu={(e: React.MouseEvent) => handleContextMenu(e, task.id)}
                    >
                      <div className={styles.taskHeader}>
                        <span className={styles.taskId}>{task.id}</span>
                        <div className={`${styles.taskPriority} ${getPriorityClass(task.priority)}`}></div>
                      </div>
                      <h3 className={styles.taskTitle}>{task.title}</h3>
                      <div className={styles.taskTags}>
                        {task.tags?.map((tag: string, idx: number) => (
                          <span key={idx} className={styles.tag}>{tag}</span>
                        ))}
                      </div>
                      <div className={styles.taskFooter}>
                        <div className={styles.taskAssignee} title={'Responsável'}>
                          {task.assignee}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* Menu de Contexto Customizado */}
      {contextMenu.visible && (
        <div
          ref={contextMenuRef}
          className={styles.contextMenu}
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button className={styles.contextMenuItem} onClick={handleReturnToInbox}>
            <Inbox size={14} />
            Devolver à Caixa de Entrada
          </button>
        </div>
      )}
    </div>
  );
}
