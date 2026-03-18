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
  Zap
} from 'lucide-react';
import { fetchClickUpData } from '../../app/dashboard/actions';
import styles from './dashboard-sections.module.css';

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
  const [alerts, setAlerts] = useState<string[]>([]);
  
  useEffect(() => {
    // Load config from localStorage
    setToken(localStorage.getItem('cu-token') || '');
    setWorkspace(localStorage.getItem('cu-ws') || '');
    const now = new Date();
    setMonth(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
    
    // Load cached data
    const cached = localStorage.getItem(`dash-data-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
    if (cached) setData(JSON.parse(cached));
  }, []);

  const handleSync = async () => {
    if (!token || !workspace) {
      alert('Por favor, configure o Token e Workspace ID primeiro.');
      return;
    }
    
    setIsSyncing(true);
    setAlerts([]);
    
    const [y, m] = month.split('-');
    const start = new Date(parseInt(y), parseInt(m)-1, 1).getTime();
    const end = new Date(parseInt(y), parseInt(m), 0, 23, 59, 59, 999).getTime();
    
    try {
      const endpoint = `/team/${workspace}/time_entries?start_date=${start}&end_date=${end}&limit=500`;
      const result = await fetchClickUpData(endpoint, token);
      
      if (result.error) {
        alert(`Erro: ${result.error}\n${result.detail || ''}`);
        setIsSyncing(false);
        return;
      }
      
      // Process data (simplified version of HTML logic)
      const processed: Record<string, any> = {};
      Object.keys(CLIENT_LIMITS).forEach(k => {
        processed[k] = { ...CLIENT_LIMITS[k], ms: 0, tasks: [] };
      });
      
      result.data.forEach((entry: any) => {
        const dur = parseInt(entry.duration) || 0;
        const listName = entry.task?.list?.name?.toLowerCase() || '';
        
        // Auto-detect client by name
        Object.keys(CLIENT_LIMITS).forEach(cid => {
          if (listName.includes(CLIENT_LIMITS[cid].name.toLowerCase())) {
            processed[cid].ms += dur;
          }
        });
      });
      
      setData(processed);
      localStorage.setItem(`dash-data-${month}`, JSON.stringify(processed));
    } catch (e) {
      alert('Falha na sincronização.');
    } finally {
      setIsSyncing(false);
    }
  }

  const msToH = (ms: number) => Math.round(ms / 3600000 * 10) / 10;

  return (
    <div className={styles.sectionContainer}>
      <header className={styles.dashHeader}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '8px' }}>
            <span style={{ color: 'var(--accent-secondary)' }}>⏱ Dashboard</span> de Horas
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Consumo mensal de horas por cliente (ClickUp)</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
           <input type="month" className={styles.input} value={month} onChange={e => setMonth(e.target.value)} />
           <button className={`${styles.button} ${styles.primaryButton}`} style={{ background: 'var(--accent-secondary)' }} onClick={handleSync} disabled={isSyncing}>
              {isSyncing ? <RefreshCw size={16} className={styles.spin} /> : <Zap size={16} />}
              {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
           </button>
        </div>
      </header>

      <div className={styles.configBar}>
         <div className={styles.field}>
            <label>API Token</label>
            <input type="password" className={styles.input} value={token} onChange={e => { setToken(e.target.value); localStorage.setItem('cu-token', e.target.value); }} placeholder="pk_..." />
         </div>
         <div className={styles.field}>
            <label>Workspace ID</label>
            <input className={styles.input} value={workspace} onChange={e => { setWorkspace(e.target.value); localStorage.setItem('cu-ws', e.target.value); }} placeholder="1234567" />
         </div>
      </div>

      <div className={styles.grid}>
        {Object.values(data).filter(c => c.limit).map(c => {
          const h = msToH(c.ms);
          const pct = Math.min(Math.round((h / c.limit) * 100), 100);
          const isOver = h > c.limit;
          const isWarn = !isOver && (h / c.limit) >= 0.8;
          const statusClass = isOver ? styles.over : isWarn ? styles.warn : styles.ok;
          
          return (
            <div key={c.name} className={`${styles.card} ${styles.dashCard}`}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                 <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{c.name}</span>
                 <span className={`${styles.statusBadge} ${statusClass}`}>{isOver ? 'Excedido' : isWarn ? 'Atenção' : 'OK'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '12px' }}>
                 <span style={{ fontSize: '2rem', fontWeight: 800 }}>{h}h</span>
                 <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>/ {c.limit}h</span>
              </div>
              <div className={styles.progressBar}>
                 <div className={`${styles.progressFill} ${statusClass}`} style={{ width: `${pct}%` }}></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.75rem', fontWeight: 600 }}>
                 <span style={{ color: isOver ? 'var(--status-error)' : isWarn ? 'var(--status-warning)' : 'var(--status-success)' }}>
                   {isOver ? `+${Math.abs(c.limit - h).toFixed(1)}h excedido` : `${(c.limit - h).toFixed(1)}h restantes`}
                 </span>
                 <span style={{ color: 'var(--text-secondary)' }}>{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {!Object.keys(data).length && (
         <div style={{ padding: '48px', textAlign: 'center', background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
            Clique em <strong>Sincronizar</strong> para carregar os dados do ClickUp para o mês selecionado.
         </div>
      )}

      <style jsx>{`
        .dashHeader { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
        .configBar { display: flex; gap: 16px; background: var(--bg-surface); padding: 16px; border-radius: var(--radius-md); margin-bottom: 32px; border: 1px solid var(--border-color); }
        .field { flex: 1; display: flex; flex-direction: column; gap: 4px; }
        .field label { font-size: 0.7rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; }
        .dashCard { position: relative; overflow: hidden; border-top: 3px solid transparent; }
        .ok { background: var(--status-success) !important; color: white !important; }
        .warn { background: var(--status-warning) !important; color: black !important; }
        .over { background: var(--status-error) !important; color: white !important; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .progressBar { height: 6px; background: var(--bg-surface-hover); border-radius: 3px; overflow: hidden; }
        .progressFill { height: 100%; border-radius: 3px; transition: width 0.7s cubic-bezier(0.16, 1, 0.3, 1); }
        .statusBadge { padding: 3px 8px; border-radius: 50px; font-size: 0.7rem; font-weight: 700; }
      `}</style>
    </div>
  );
}
