'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Settings, 
  AlertTriangle, 
  ChevronRight,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  Clock,
  Zap,
  Info,
  Calendar
} from 'lucide-react';
import { fetchClickUpData } from '../../app/dashboard/actions';
import styles from './dashboard-premium.module.css';

const CLIENT_LIMITS: Record<string, any> = {
  'AL': { name: 'Alares', color: '#6366f1', limit: 300 },
  'CH': { name: 'Chegolá', color: '#0891b2', limit: 30 },
  'AB': { name: 'Abrafati', color: '#059669', limit: 49 },
  'F2': { name: 'F2F', color: '#d97706', limit: 15 },
  'GE': { name: 'GE Healthcare', color: '#db2777', limit: 15 },
  'MZ': { name: 'Merz', color: '#7c3aed', limit: 25 },
  'MD': { name: 'Medtronic', color: '#dc2626', limit: 80 },
  'GS': { name: 'Gaspers', color: '#2563eb', limit: 15 },
  'DV': { name: 'Diversihub', color: '#0f766e', limit: null }
};

export function HoursSection() {
  const [token, setToken] = useState('');
  const [workspace, setWorkspace] = useState('');
  const [month, setMonth] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [data, setData] = useState<Record<string, any>>({});
  
  useEffect(() => {
    setToken(localStorage.getItem('cu-token') || '');
    setWorkspace(localStorage.getItem('cu-ws') || '');
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    setMonth(currentMonth);
    
    const cached = localStorage.getItem(`dash-data-${currentMonth}`);
    if (cached) setData(JSON.parse(cached));
  }, []);

  const handleSync = async () => {
    if (!token || !workspace) {
      alert('Configuração de Token ou Workspace pendente.');
      return;
    }
    setIsSyncing(true);
    const [y, m] = month.split('-');
    const start = new Date(parseInt(y), parseInt(m)-1, 1).getTime();
    const end = new Date(parseInt(y), parseInt(m), 0, 23, 59, 59, 999).getTime();
    
    try {
      const endpoint = `/team/${workspace}/time_entries?start_date=${start}&end_date=${end}&limit=500`;
      const result = await fetchClickUpData(endpoint, token);
      
      if (result.error) {
        alert(`Erro ClickUp: ${result.error}`);
        return;
      }
      
      const processed: Record<string, any> = {};
      Object.keys(CLIENT_LIMITS).forEach(k => {
        processed[k] = { ...CLIENT_LIMITS[k], ms: 0 };
      });
      
      result.data.forEach((entry: any) => {
        const dur = parseInt(entry.duration) || 0;
        const listName = entry.task?.list?.name?.toLowerCase() || '';
        Object.keys(CLIENT_LIMITS).forEach(cid => {
          if (listName.includes(CLIENT_LIMITS[cid].name.toLowerCase())) {
            processed[cid].ms += dur;
          }
        });
      });
      
      setData(processed);
      localStorage.setItem(`dash-data-${month}`, JSON.stringify(processed));
    } catch (e) {
      alert('Falha na comunicação com ClickUp.');
    } finally {
      setIsSyncing(false);
    }
  }

  const msToH = (ms: number) => Math.round(ms / 3600000 * 10) / 10;

  return (
    <div className={styles.premiumContainer}>
      <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Clock size={18} color="var(--accent-secondary)" />
            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.1em' }}>Monitoramento de Horas</span>
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.02em' }}>Consumo de <span style={{ color: 'var(--accent-secondary)' }}>Verba Mensal</span></h2>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
           <div className={styles.glassCard} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', borderRadius: '12px' }}>
             <Calendar size={16} color="var(--text-secondary)" />
             <input type="month" className={styles.premiumInput} style={{ border: 'none !important', padding: '0 !important', background: 'transparent !important', width: 'auto' }} value={month} onChange={e => setMonth(e.target.value)} />
           </div>
           <button 
             className={styles.premiumButton} 
             style={{ background: 'linear-gradient(135deg, var(--accent-secondary), #0ea5e9)', boxShadow: '0 4px 15px rgba(67, 182, 178, 0.3)' }} 
             onClick={handleSync} 
             disabled={isSyncing}
           >
              {isSyncing ? <RefreshCw size={18} className={styles.spin} /> : <Zap size={18} />}
              {isSyncing ? 'ATUALIZANDO...' : 'SINCRONIZAR CLICKUP'}
           </button>
        </div>
      </header>

      {/* Config Bar */}
      <section className={styles.glassCard} style={{ padding: '20px', marginBottom: '40px', display: 'flex', gap: '24px', alignItems: 'center' }}>
         <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <label style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>ClickUp Token</label>
            <input type="password" className={styles.premiumInput} style={{ flex: 1 }} value={token} onChange={e => { setToken(e.target.value); localStorage.setItem('cu-token', e.target.value); }} />
         </div>
         <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '240px' }}>
            <label style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Team ID</label>
            <input className={styles.premiumInput} style={{ flex: 1 }} value={workspace} onChange={e => { setWorkspace(e.target.value); localStorage.setItem('cu-ws', e.target.value); }} />
         </div>
         <div style={{ padding: '8px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', color: 'var(--text-secondary)' }}>
           <Info size={16} />
         </div>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
        {Object.values(data).filter(c => c.limit).map(c => {
          const h = msToH(c.ms);
          const pct = Math.min(Math.round((h / c.limit) * 100), 100);
          const isOver = h > c.limit;
          const isWarn = !isOver && (h / c.limit) >= 0.8;
          const statusColor = isOver ? 'var(--status-error)' : isWarn ? 'var(--status-warning)' : 'var(--status-success)';
          
          return (
            <div key={c.name} className={styles.glassCard} style={{ padding: '24px', borderTop: `4px solid ${statusColor}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: statusColor, boxShadow: `0 0 10px ${statusColor}` }}></div>
                    <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>{c.name}</span>
                 </div>
                 <span style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', color: statusColor, letterSpacing: '0.05em' }}>
                   {isOver ? 'ESGOTADO' : isWarn ? 'CRÍTICO' : 'ESTÁVEL'}
                 </span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '20px' }}>
                 <span style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.02em' }}>{h}</span>
                 <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>/ {c.limit}h</span>
              </div>

              <div className={styles.progressContainer}>
                 <div className={styles.progressFill} style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${statusColor}, ${statusColor}99)` }}></div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                   {isOver ? <AlertTriangle size={14} color="var(--status-error)" /> : <Info size={14} color="var(--text-secondary)" />}
                   <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isOver ? 'var(--status-error)' : 'var(--text-secondary)' }}>
                     {isOver ? `${Math.abs(c.limit - h).toFixed(1)}h em excesso` : `${(c.limit - h).toFixed(1)}h disponíveis`}
                   </span>
                 </div>
                 <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {!Object.keys(data).length && (
         <div className={styles.glassCard} style={{ padding: '64px', textAlign: 'center' }}>
            <Zap size={32} color="var(--accent-secondary)" style={{ marginBottom: '16px', opacity: 0.5 }} />
            <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Os dados de consumo não foram carregados para este período.</p>
            <button className={styles.textBtn} onClick={handleSync} style={{ marginTop: '12px', color: 'var(--accent-secondary)', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.7rem' }}>SINCRONIZAR AGORA</button>
         </div>
      )}

      <style jsx>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function activeClientColor(base: string) {
  return base === 'var(--status-success)' ? '#34d399' : base === 'var(--status-warning)' ? '#fbbf24' : '#f87171';
}
