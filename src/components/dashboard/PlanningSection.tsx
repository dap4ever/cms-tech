'use client';

import React, { useState } from 'react';
import { 
  Bot, 
  Zap, 
  BookOpen, 
  Terminal, 
  Settings, 
  HardDrive,
  Plus,
  Filter,
  Trash2,
  Calendar,
  Clock,
  MoreVertical
} from 'lucide-react';
import { useDashboardStore, PlanningItem } from '../../hooks/dashboard/useDashboardStore';
import styles from './dashboard-sections.module.css';

const CAT_ICONS: Record<string, any> = {
  'IA & Chatbot': Bot,
  'Automação': Zap,
  'Treinamento': BookOpen,
  'DevOps': Terminal,
  'Processos': Settings,
  'Infraestrutura': HardDrive,
};

export function PlanningSection() {
  const { planning, addPlanningItem, updatePlanningItem, deletePlanningItem, isLoaded } = useDashboardStore();
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCat, setFilterCat] = useState('');

  if (!isLoaded) return <div>Carregando planejamento...</div>;

  const filtered = planning.filter(m => 
    (!filterStatus || m.status === filterStatus) && 
    (!filterCat || m.cat === filterCat)
  );

  const stats = {
    Total: planning.length,
    Backlog: planning.filter(m => m.status === 'Backlog').length,
    Planejado: planning.filter(m => m.status === 'Planejado').length,
    'Em Andamento': planning.filter(m => m.status === 'Em Andamento').length,
    'Concluído': planning.filter(m => m.status === 'Concluído').length,
  };

  const handleNew = () => {
    const newItem: PlanningItem = {
      id: Date.now(),
      cat: 'IA & Chatbot',
      pri: 'Prioridade Alta',
      title: 'Nova Melhoria',
      desc: 'Descrição da melhoria...',
      dur: '1 mês',
      tri: 'Q2 2026',
      status: 'Backlog'
    };
    addPlanningItem(newItem);
  };

  return (
    <div className={styles.sectionContainer}>
      <header style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '8px' }}>
          <span style={{ color: 'var(--status-warning)' }}>📈 Planejamento</span> Tech
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Melhorias e iniciativas estratégicas da área de tecnologia
        </p>
      </header>

      <section className={styles.statsRow}>
        {Object.entries(stats).map(([k, v]) => (
          <div key={k} className={styles.statCard}>
            <span className={styles.statNum}>{v}</span>
            <span className={styles.statLabel}>{k}</span>
          </div>
        ))}
      </section>

      <div className={styles.filterBar}>
        <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
          <select className={styles.input} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">Todos os Status</option>
            <option>Backlog</option>
            <option>Planejado</option>
            <option>Em Andamento</option>
            <option>Concluído</option>
          </select>
          <select className={styles.input} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
            <option value="">Todas as Categorias</option>
            <option>IA & Chatbot</option>
            <option>Automação</option>
            <option>Treinamento</option>
            <option>DevOps</option>
            <option>Processos</option>
            <option>Infraestrutura</option>
          </select>
        </div>
        <button className={`${styles.button} ${styles.primaryButton}`} onClick={handleNew} style={{ background: 'var(--status-warning)' }}>
          <Plus size={16} /> Nova Melhoria
        </button>
      </div>

      <div className={styles.grid}>
        {filtered.map(item => {
          const Icon = CAT_ICONS[item.cat] || Settings;
          return (
            <div key={item.id} className={styles.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <span className={`${styles.badge} ${getCatClass(item.cat)}`}>{item.cat}</span>
                  <span className={`${styles.badge} ${getPriClass(item.pri)}`}>{item.pri}</span>
                </div>
                <button className={styles.deleteBtn} onClick={() => deletePlanningItem(item.id)}>
                   <Trash2 size={14} />
                </button>
              </div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '8px' }}>{item.title}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.6 }}>
                {item.desc}
              </p>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  <Clock size={12} /> {item.dur}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  <Calendar size={12} /> {item.tri}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                <span className={`${styles.statusBadge} ${getStatusClass(item.status)}`}>{item.status}</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                   {/* Simplified Actions for brevity */}
                   <button className={styles.iconBtn}><MoreVertical size={14} /></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .statsRow { display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
        .statCard { flex: 1; min-width: 120px; background: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px; display: flex; flex-direction: column; align-items: center; }
        .statNum { font-size: 1.5rem; font-weight: 800; color: var(--text-primary); }
        .statLabel { font-size: 0.7rem; font-weight: 600; color: var(--text-secondary); text-transform: uppercase; }
        .filterBar { display: flex; gap: 12px; margin-bottom: 24px; align-items: center; }
        .statusBadge { padding: 4px 10px; border-radius: var(--radius-sm); font-size: 0.75rem; font-weight: 600; }
        .iconBtn { padding: 4px; color: var(--text-secondary); opacity: 0.6; }
        .iconBtn:hover { opacity: 1; }
        .deleteBtn { color: var(--text-secondary); opacity: 0.6; }
        .deleteBtn:hover { opacity: 1; color: var(--status-error); }
      `}</style>
    </div>
  );
}

// Helpers for dynamic classes
function getCatClass(v: string) {
  const map: Record<string, string> = {
    'IA & Chatbot': 'bg-indigo-500/10 text-indigo-400',
    'Automação': 'bg-emerald-500/10 text-emerald-400',
    'Treinamento': 'bg-amber-500/10 text-amber-400',
    'DevOps': 'bg-sky-500/10 text-sky-400',
    'Processos': 'bg-purple-500/10 text-purple-400',
    'Infraestrutura': 'bg-cyan-500/10 text-cyan-400'
  };
  return map[v] || 'bg-gray-500/10 text-gray-400';
}

function getPriClass(v: string) {
  const map: Record<string, string> = {
    'Prioridade Alta': 'bg-rose-500/10 text-rose-400',
    'Prioridade Média': 'bg-orange-500/10 text-orange-400',
    'Prioridade Baixa': 'bg-emerald-500/10 text-emerald-400'
  };
  return map[v] || 'bg-gray-500/10 text-gray-400';
}

function getStatusClass(v: string) {
  const map: Record<string, string> = {
    'Backlog': 'bg-sky-500/10 text-sky-400',
    'Planejado': 'bg-amber-500/10 text-amber-400',
    'Em Andamento': 'bg-orange-500/10 text-orange-400',
    'Concluído': 'bg-emerald-500/10 text-emerald-400'
  };
  return map[v] || 'bg-gray-500/10 text-gray-400';
}
