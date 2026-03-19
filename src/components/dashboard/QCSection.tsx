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
    <div className={`${styles.premiumContainer} ${styles.qcGrid}`}>
      {/* Client Selection Sidebar */}
      <aside className={styles.sidebar}>
        <div style={{ padding: '0 8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
           <Target size={16} color="var(--premium-purple)" />
           <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.1em' }}>Projetos Ativos</span>
        </div>
        <div className={styles.clientList}>
          {clients.map((c, i) => {
            const { total: t, done: d } = calculateProgress(c);
            const isSelected = i === activeIndex;
            return (
              <div 
                key={c.id} 
                className={`${styles.clientItem} ${isSelected ? styles.activeClient : ''}`}
                onClick={() => setActiveIndex(i)}
                style={{ position: 'relative' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div 
                    style={{ 
                      width: '32px', height: '32px', borderRadius: '10px', 
                      background: isSelected ? `linear-gradient(135deg, ${c.color}, var(--premium-purple))` : c.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.7rem', fontWeight: 800, color: 'white',
                      boxShadow: isSelected ? `0 4px 10px ${c.color}66` : 'none'
                    }}
                  >
                    {c.id}
                  </div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {c.name}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)', opacity: 0.6 }}>
                      {d} / {t} pendências
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </aside>

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
                <button 
                  onClick={handleReset}
                  className={styles.iconBtn} 
                  style={{ color: 'var(--status-error)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 700 }}
                >
                  <RefreshCcw size={14} /> Resetar Auditoria
                </button>
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
          {activeClient.topicos.map((topic) => (
            <div key={topic.id} className={styles.glassCard} style={{ marginBottom: '20px', overflow: 'hidden' }}>
              <div 
                className={styles.topicHeader}
                onClick={() => updateTopic(topic.id, { open: !topic.open })}
                style={{ border: 'none', borderRadius: '0' }}
              >
                <div style={{ color: 'var(--premium-purple)' }}>
                  {topic.open ? <ChevronDown size={20} strokeWidth={3} /> : <ChevronRight size={20} strokeWidth={3} />}
                </div>
                <input 
                  className={styles.premiumInput}
                  style={{ flex: 1, background: 'transparent !important', border: 'none !important', boxShadow: 'none !important', fontSize: '1rem', fontWeight: 700 }}
                  value={topic.name}
                  onChange={(e) => updateTopic(topic.id, { name: e.target.value })}
                  onClick={(e) => e.stopPropagation()}
                />
                <button 
                  className={styles.iconBtn} 
                  onClick={(e) => { e.stopPropagation(); deleteTopic(topic.id); }}
                  style={{ opacity: 0.3 }}
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {topic.open && (
                <div style={{ padding: '0 20px 20px' }}>
                  {topic.ajustes.map((adj, idx) => (
                    <div key={adj.id} className={styles.adjItem} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ paddingTop: '4px' }}>
                        <div 
                          onClick={() => updateAdjustment(topic.id, adj.id, { done: !adj.done })}
                          style={{ 
                            width: '24px', height: '24px', borderRadius: '6px', 
                            border: `2px solid ${adj.done ? 'var(--status-success)' : 'var(--border-color)'}`,
                            background: adj.done ? 'var(--status-success)' : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', transition: 'all 0.2s'
                          }}
                        >
                          {adj.done && <CheckCircle2 size={16} color="white" />}
                        </div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                           <input 
                              className={styles.premiumInput}
                              style={{ flex: 1, fontWeight: 700 }}
                              value={adj.title}
                              onChange={(e) => updateAdjustment(topic.id, adj.id, { title: e.target.value })}
                              placeholder="Título do ajuste ou verificação..."
                           />
                           <button className={styles.iconBtn} onClick={() => deleteAdjustment(topic.id, adj.id)} style={{ opacity: 0.3 }}>
                              <Trash2 size={14} />
                           </button>
                        </div>
                        <textarea 
                          className={styles.premiumInput}
                          style={{ width: '100%', minHeight: '60px', color: 'var(--text-secondary)', marginBottom: '12px' }}
                          value={adj.desc}
                          onChange={(e) => updateAdjustment(topic.id, adj.id, { desc: e.target.value })}
                          placeholder="Notas técnicas ou observações..."
                        />
                        
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          {adj.img ? (
                            <div style={{ position: 'relative', width: '160px', height: '100px', borderRadius: '12px', overflow: 'hidden', border: '2px solid var(--border-color)' }}>
                              <img src={adj.img} alt="Evidência" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              <button 
                                onClick={() => updateAdjustment(topic.id, adj.id, { img: null })}
                                style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.6)', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', cursor: 'pointer', padding: '8px 16px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', border: '1px dashed var(--border-color)' }}>
                               <ImageIcon size={14} /> Adicionar Evidência Visual
                               <input type="file" accept="image/*" hidden onChange={(e) => handleImageUpload(topic.id, adj.id, e.target.files?.[0] || null)} />
                            </label>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <button 
                    className={styles.textBtn} 
                    onClick={() => addAdjustment(topic.id)}
                    style={{ marginTop: '20px', color: 'var(--premium-purple)', fontWeight: 800, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <Plus size={16} strokeWidth={3} /> ADICIONAR ITEM DE VERIFICAÇÃO
                  </button>
                </div>
              )}
            </div>
          ))}
          
          <button 
            className={styles.premiumButton} 
            onClick={addTopic}
            style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '12px' }}
          >
            <Layout size={20} /> CRIAR NOVO GRUPO DE AUDITORIA
          </button>
        </section>

        <section style={{ marginTop: '48px' }}>
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
