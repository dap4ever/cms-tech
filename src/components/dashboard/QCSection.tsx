'use client';

import React, { useState } from 'react';
import { 
  CheckCircle2, 
  ChevronRight, 
  ChevronDown, 
  Trash2, 
  Plus, 
  Image as ImageIcon, 
  X, 
  RefreshCcw,
  Layout,
  Target,
  Zap
} from 'lucide-react';
import { useDashboardStore, QCClient, QCTopic, QCAdjustment } from '../../hooks/dashboard/useDashboardStore';
import { QCEditor } from './QCEditor';
import styles from './dashboard-premium.module.css';

export function QCSection() {
  const { clients, updateClient, isLoaded } = useDashboardStore();
  const [activeIndex, setActiveIndex] = useState(0);

  if (!isLoaded || clients.length === 0) {
    return <div className={styles.loading}>Carregando ambientes...</div>;
  }

  const activeClient = clients[activeIndex];

  const calculateProgress = (client: QCClient) => {
    let total = 0;
    let done = 0;
    client.topicos.forEach(t => {
      total += t.ajustes.length;
      t.ajustes.forEach(a => { if (a.done) done++; });
    });
    return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
  };

  const { total, done, pct } = calculateProgress(activeClient);

  // --- Handlers ---
  const handleReset = () => {
    if (confirm(`Resetar todos os tópicos de ${activeClient.name}?`)) {
      updateClient({ ...activeClient, topicos: [], obs: '' });
    }
  };

  const addTopic = () => {
    const newTopic: QCTopic = {
      id: Date.now(),
      name: 'Novo Grupo de Ajustes',
      open: true,
      ajustes: []
    };
    updateClient({ ...activeClient, topicos: [...activeClient.topicos, newTopic] });
  };

  const updateTopic = (topicId: number, data: Partial<QCTopic>) => {
    const topicos = activeClient.topicos.map(t => 
      t.id === topicId ? { ...t, ...data } : t
    );
    updateClient({ ...activeClient, topicos });
  };

  const deleteTopic = (topicId: number) => {
    if (confirm('Remover este tópico?')) {
      const topicos = activeClient.topicos.filter(t => t.id !== topicId);
      updateClient({ ...activeClient, topicos });
    }
  };

  const addAdjustment = (topicId: number) => {
    const newAdj: QCAdjustment = {
      id: Date.now(),
      title: '',
      desc: '',
      done: false,
      img: null
    };
    const topicos = activeClient.topicos.map(t => 
      t.id === topicId ? { ...t, ajustes: [...t.ajustes, newAdj] } : t
    );
    updateClient({ ...activeClient, topicos });
  };

  const updateAdjustment = (topicId: number, adjId: number, data: Partial<QCAdjustment>) => {
    const topicos = activeClient.topicos.map(t => {
      if (t.id === topicId) {
        return {
          ...t,
          ajustes: t.ajustes.map(a => a.id === adjId ? { ...a, ...data } : a)
        };
      }
      return t;
    });
    updateClient({ ...activeClient, topicos });
  };

  const deleteAdjustment = (topicId: number, adjId: number) => {
    const topicos = activeClient.topicos.map(t => {
      if (t.id === topicId) {
        return { ...t, ajustes: t.ajustes.filter(a => a.id !== adjId) };
      }
      return t;
    });
    updateClient({ ...activeClient, topicos });
  };

  const handleImageUpload = (topicId: number, adjId: number, file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onprogress = (e) => { /* loading state could go here */ };
    reader.onload = (e) => {
      const result = e.target?.result as string;
      updateAdjustment(topicId, adjId, { img: result });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className={styles.qcGrid}>
      {/* Projetos Ativos - Horizontal Tabs */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', borderBottom: '1px solid var(--border-color)', marginBottom: '8px' }}>
         {clients.map((c, i) => {
            const isSelected = i === activeIndex;
            return (
              <button
                key={c.id}
                onClick={() => setActiveIndex(i)}
                className={`${styles.iconBtn} ${isSelected ? styles.activeTab : ''}`}
                style={{ 
                  padding: '8px 16px', 
                  borderRadius: '12px', 
                  fontSize: '0.85rem', 
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: isSelected ? 'rgba(124, 58, 237, 0.1)' : 'transparent',
                  border: isSelected ? '1px solid rgba(124, 58, 237, 0.2)' : '1px solid transparent',
                  color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                  whiteSpace: 'nowrap'
                }}
              >
                <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: c.color }}></div>
                {c.name}
              </button>
            );
         })}
      </div>

      {/* Main Content Area */}
      <main className={styles.mainContent}>
        <div className={styles.glassCard} style={{ padding: '24px', marginBottom: '24px' }}>
          <header style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '16px' }}>
            <div 
              style={{ 
                width: '56px', height: '56px', borderRadius: '16px', 
                background: `linear-gradient(135deg, ${activeClient.color}, var(--premium-purple))`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.2rem', fontWeight: 900, color: 'white',
                boxShadow: `0 8px 24px ${activeClient.color}44`
              }}
            >
              {activeClient.id}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{activeClient.name}</h2>
              </div>
              <div style={{ marginTop: '12px' }}>
                <div className={styles.progressContainer}>
                  <div className={styles.progressFill} style={{ width: `${pct}%` }}></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-secondary)' }}>
                     {done} de {total} itens verificados
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>{pct}%</span>
                </div>
              </div>
            </div>
          </header>
        </div>

        <section>
          <QCEditor 
            topics={activeClient.topicos} 
            onChange={(topicos) => updateClient({ ...activeClient, topicos })}
            onReset={handleReset}
            title="Grupos de Auditoria"
          />
          
          <div style={{ marginTop: '48px' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
               <Zap size={16} color="var(--status-warning)" />
               <h4 style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.1em' }}>Relato Final do Consultor</h4>
             </div>
             <textarea 
               className={styles.premiumInput}
               style={{ width: '100%', minHeight: '140px', lineHeight: 1.6 }}
               value={activeClient.obs}
               onChange={(e) => updateClient({ ...activeClient, obs: e.target.value })}
               placeholder="Digite aqui as conclusões gerais da auditoria para este cliente..."
             />
          </div>
        </section>
      </main>

      <style jsx>{`
        .clientList { display: flex; flex-direction: column; gap: 4px; }
        .iconBtn { background: transparent; border: none; cursor: pointer; padding: 4px; transition: all 0.2s; }
        .iconBtn:hover { transform: scale(1.1); }
        .textBtn { background: transparent; border: none; cursor: pointer; transition: opacity 0.2s; }
        .textBtn:hover { opacity: 0.8; }
        .mainContent { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}
