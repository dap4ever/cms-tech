"use client";

import { GitPullRequest, Plus, Filter } from 'lucide-react';
import styles from './projects.module.css';

const columns = [
  { id: 'todo', title: 'A Fazer', count: 3 },
  { id: 'inProgress', title: 'Em Andamento', count: 2 },
  { id: 'inReview', title: 'Em Revisão', count: 2 },
  { id: 'done', title: 'Concluído', count: 5 },
];

const tasks = [
  {
    id: 'DEV-101',
    title: 'Implementar autenticação via GitHub',
    column: 'inProgress',
    priority: 'high',
    tags: ['Auth', 'Backend'],
    assignee: 'JD',
    pr: '#42',
    prActive: true
  },
  {
    id: 'DEV-102',
    title: 'Ajustar paleta Dark Mode nos gráficos',
    column: 'inProgress',
    priority: 'medium',
    tags: ['UI', 'Frontend'],
    assignee: 'MR',
    pr: null,
    prActive: false
  },
  {
    id: 'DEV-105',
    title: 'Criar webhook para integração com Slack',
    column: 'todo',
    priority: 'high',
    tags: ['Integration'],
    assignee: 'JD',
    pr: null,
    prActive: false
  },
  {
    id: 'DEV-103',
    title: 'Refatorar componente de Sidebar',
    column: 'inReview',
    priority: 'low',
    tags: ['Refactor'],
    assignee: 'CR',
    pr: '#41',
    prActive: true
  },
  {
    id: 'DEV-104',
    title: 'Adicionar testes E2E do fluxo de login',
    column: 'inReview',
    priority: 'medium',
    tags: ['QA', 'Cypress'],
    assignee: 'MR',
    pr: '#40',
    prActive: false
  }
];

export default function Projects() {
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
          <h1 className={styles.pageTitle}>Projetos / Kanban</h1>
          <span className={styles.sprintBadge}>Sprint 12 Atual</span>
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

      <section className={styles.kanbanBoard}>
        {columns.map(col => (
          <div key={col.id} className={styles.kanbanColumn}>
            <div className={styles.columnHeader}>
              <span className={styles.columnTitle}>{col.title}</span>
              <span className={styles.columnCount}>{col.count}</span>
            </div>
            <div className={styles.columnContent}>
              {tasks.filter(t => t.column === col.id).map(task => (
                <div key={task.id} className={styles.taskCard}>
                  <div className={styles.taskHeader}>
                    <span className={styles.taskId}>{task.id}</span>
                    <div className={`${styles.taskPriority} ${getPriorityClass(task.priority)}`}></div>
                  </div>
                  <h3 className={styles.taskTitle}>{task.title}</h3>
                  <div className={styles.taskTags}>
                    {task.tags.map(tag => (
                      <span key={tag} className={styles.tag}>{tag}</span>
                    ))}
                  </div>
                  <div className={styles.taskFooter}>
                    {task.pr ? (
                      <div className={`${styles.taskPr} ${task.prActive ? styles.taskPrActive : ''}`}>
                        <GitPullRequest size={12} />
                        {task.pr}
                      </div>
                    ) : (
                      <div></div>
                    )}
                    <div className={styles.taskAssignee}>{task.assignee}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
