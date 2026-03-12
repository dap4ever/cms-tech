"use client";

import { useState, useEffect } from 'react';
import { GitPullRequest, Plus, Filter } from 'lucide-react';
import styles from './projects.module.css';

const columns = [
  { id: 'todo', title: 'A Fazer' },
  { id: 'inProgress', title: 'Em Andamento' },
  { id: 'inReview', title: 'Em Revisão' },
  { id: 'done', title: 'Concluído' },
];

export default function InternalProjects() {
  const [tasks, setTasks] = useState<any[]>([]); // Inicialmente vazio, será populado pelas tarefas aprovadas da triagem.

  useEffect(() => {
    // Carrega do navegador (Simulando uma API local apenas de Projetos Internos da F2F)
    const saved = localStorage.getItem('f2f_internal_projects');
    if (saved) {
      try {
        setTasks(JSON.parse(saved));
      } catch(e) {}
    }
  }, []);

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
            return (
              <div key={col.id} className={styles.kanbanColumn}>
                <div className={styles.columnHeader}>
                  <span className={styles.columnTitle}>{col.title}</span>
                  <span className={styles.columnCount}>{columnTasks.length}</span>
                </div>
                <div className={styles.columnContent}>
                  {columnTasks.map(task => (
                    <div className={styles.taskCard} key={task.id}>
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
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}
