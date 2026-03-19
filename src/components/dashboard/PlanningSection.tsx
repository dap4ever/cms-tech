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
  MoreVertical,
  TrendingUp,
  ChevronDown
} from 'lucide-react';
import { useDashboardStore, PlanningItem } from '../../hooks/dashboard/useDashboardStore';
import styles from './dashboard-premium.module.css';

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

  if (!isLoaded) return <div>Carregando planejamento estratégico...</div>;

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
      title: 'Nova Iniciativa Estratégica',
      desc: 'Descreva aqui o impacto desta melhoria nos processos ou produtos...',
      dur: '1 mês',
      tri: 'Q2 2026',
      status: 'Backlog'
    };
    addPlanningItem(newItem);
  };

  return (
    <div className={styles.premiumContainer}>
      <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <TrendingUp size={20} color="var(--status-warning)" />
            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.1em' }}>Roadmap Estratégico</span>
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.02em' }}>Iniciativas de <span style={{ color: 'var(--status-warning)' }}>Expansão Tech</span></h2>
        </div>
        <button 
          className={styles.premiumButton} 
          onClick={handleNew} 
          style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', boxShadow: '0 4px 15px rgba(217, 119, 6, 0.3)' }}
        >
          <Plus size={18} strokeWidth={3} /> NOVA MELHORIA
        </button>
      </header>

      {/* Stats Dashboard */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '40px' }}>
        {Object.entries(stats).map(([k, v]) => (
          <div key={k} className={styles.glassCard} style={{ padding: '20px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.03)' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-primary)' }}>{v}</div>
            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' }}>{k}</div>
          </div>
        ))}
      </section>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', alignItems: 'center' }}>
        <div style={{ padding: '8px', background: 'var(--bg-surface)', borderRadius: '8px', color: 'var(--text-secondary)' }}>
           <Filter size={16} />
        </div>
        <div className={styles.glassCard} style={{ display: 'flex', gap: '2px', background: 'var(--bg-main)', padding: '2px' }}>
          {['', 'Backlog', 'Planejado', 'Em Andamento', 'Concluído'].map(s => (
            <button 
              key={s}
              onClick={() => setFilterStatus(s)}
              style={{
                padding: '8px 16px',
                fontSize: '0.75rem',
                fontWeight: 700,
                borderRadius: '6px',
                background: filterStatus === s ? 'var(--bg-surface-hover)' : 'transparent',
                color: filterStatus === s ? 'var(--text-primary)' : 'var(--text-secondary)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {s || 'TODOS'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '24px' }}>
        {filtered.map(item => {
          const Icon = CAT_ICONS[item.cat] || Settings;
          return (
            <div key={item.id} className={styles.glassCard} style={{ padding: '24px', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span className={`${styles.statusBadge} ${getCatStyle(item.cat)}`}>{item.cat}</span>
                  <span className={`${styles.statusBadge} ${getPriStyle(item.pri)}`}>{item.pri}</span>
                </div>
                <button className={styles.iconBtn} onClick={() => deletePlanningItem(item.id)} style={{ opacity: 0.3 }}>
                   <Trash2 size={14} />
                </button>
              </div>
              
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '12px', lineHeight: 1.3 }}>{item.title}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.6, minHeight: '48px' }}>
                {item.desc}
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Duração Est.</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={12} color="var(--status-warning)" /> {item.dur}
                  </div>
                </div>
                <div style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px' }}>Previsão</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={12} color="var(--status-warning)" /> {item.tri}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: getStatusColor(item.status) }}></div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: getStatusColor(item.status) }}>{item.status}</span>
                </div>
                <button className={styles.iconBtn} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '6px' }}>
                   <MoreVertical size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .iconBtn { background: transparent; border: none; cursor: pointer; transition: all 0.2s; color: var(--text-secondary); }
        .iconBtn:hover { transform: scale(1.1); color: var(--text-primary); }
        .statusBadge { padding: 4px 10px; border-radius: 6px; font-size: 0.65rem; fontWeight: 800; text-transform: uppercase; letter-spacing: 0.05em; }
      `}</style>
    </div>
  );
}

// Visual Helpers
function getCatStyle(v: string) {
  const map: Record<string, string> = {
    'IA & Chatbot': 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
    'Automação': 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    'Treinamento': 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    'DevOps': 'bg-sky-500/10 text-sky-400 border border-sky-500/20',
    'Processos': 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
    'Infraestrutura': 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
  };
  return map[v] || 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
}

function getPriStyle(v: string) {
  const map: Record<string, string> = {
    'Prioridade Alta': 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
    'Prioridade Média': 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
    'Prioridade Baixa': 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
  };
  return map[v] || 'bg-gray-500/10 text-gray-400';
}

function getStatusColor(v: string) {
  const map: Record<string, string> = {
    'Backlog': 'var(--text-secondary)',
    'Planejado': '#38bdf8',
    'Em Andamento': '#fbbf24',
    'Concluído': '#10b981'
  };
  return map[v] || 'var(--text-secondary)';
}
