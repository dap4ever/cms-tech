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
  ExternalLink
} from 'lucide-react';
import { useDashboardStore, QCClient, QCTopic, QCAdjustment } from '../../hooks/dashboard/useDashboardStore';
import styles from './dashboard-sections.module.css';

export function QCSection() {
  const { clients, updateClient, isLoaded } = useDashboardStore();
  const [activeIndex, setActiveIndex] = useState(0);

  if (!isLoaded || clients.length === 0) {
    return <div className={styles.loading}>Carregando clientes...</div>;
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
      name: 'Novo Tópico',
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
    reader.onload = (e) => {
      const result = e.target?.result as string;
      // In a real app we'd compress here, but for now we'll store the base64
      updateAdjustment(topicId, adjId, { img: result });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className={styles.qcWrapper}>
      <aside className={styles.sidebar}>
        <h3 className={styles.sidebarTitle}>Clientes</h3>
        <div className={styles.clientList}>
          {clients.map((c, i) => {
            const { total: t, done: d } = calculateProgress(c);
            return (
              <div 
                key={c.id} 
                className={`${styles.clientItem} ${i === activeIndex ? styles.activeClient : ''}`}
                onClick={() => setActiveIndex(i)}
              >
                <div className={styles.clientAvatar} style={{ backgroundColor: c.color }}>
                  {c.id}
                </div>
                <div className={styles.clientInfo}>
                  <span className={styles.clientName}>{c.name}</span>
                  <span className={styles.clientProgress}>{d}/{t} ajustes</span>
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      <main className={styles.mainContent}>
        <header className={styles.qcHeader}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <div 
                className={styles.clientAvatar} 
                style={{ backgroundColor: activeClient.color, width: '48px', height: '48px', borderRadius: '12px' }}
              >
                {activeClient.id}
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{activeClient.name}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                  <div style={{ flex: 1, maxWidth: '200px', height: '6px', background: 'var(--bg-surface-hover)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'var(--status-success)', transition: 'width 0.3s' }}></div>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    {pct}% — {done}/{total}
                  </span>
                </div>
              </div>
              <button className={`${styles.button} ${styles.dangerButton}`} onClick={handleReset}>
                <RefreshCcw size={14} /> Resetar
              </button>
           </div>
        </header>

        <section className={styles.topicsGrid}>
          {activeClient.topicos.map((topic) => (
            <div key={topic.id} className={styles.card}>
              <div 
                className={styles.topicHeader}
                onClick={() => updateTopic(topic.id, { open: !topic.open })}
              >
                {topic.open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                <input 
                  className={styles.topicInput}
                  value={topic.name}
                  onChange={(e) => updateTopic(topic.id, { name: e.target.value })}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Nome do Tópico"
                />
                <button className={styles.deleteBtn} onClick={(e) => { e.stopPropagation(); deleteTopic(topic.id); }}>
                  <Trash2 size={16} />
                </button>
              </div>

              {topic.open && (
                <div className={styles.topicBody}>
                  {topic.ajustes.map((adj, idx) => (
                    <div key={adj.id} className={styles.adjRow}>
                      <input 
                        type="checkbox" 
                        checked={adj.done}
                        onChange={(e) => updateAdjustment(topic.id, adj.id, { done: e.target.checked })}
                      />
                      <span className={styles.adjNum}>{(idx + 1).toString().padStart(2, '0')}</span>
                      <div className={styles.adjHeader}>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                          <input 
                            className={styles.adjInput}
                            value={adj.title}
                            onChange={(e) => updateAdjustment(topic.id, adj.id, { title: e.target.value })}
                            placeholder="Título do ajuste"
                          />
                          <button className={styles.deleteBtn} onClick={() => deleteAdjustment(topic.id, adj.id)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <textarea 
                          className={styles.adjTextarea}
                          value={adj.desc}
                          onChange={(e) => updateAdjustment(topic.id, adj.id, { desc: e.target.value })}
                          placeholder="Descrição detalhada..."
                        />
                        <div className={styles.imageUploadBox}>
                          {adj.img ? (
                            <div className={styles.imagePreviewWrapper}>
                              <img src={adj.img} alt="Preview" className={styles.imagePreview} />
                              <button className={styles.removeImageBtn} onClick={() => updateAdjustment(topic.id, adj.id, { img: null })}>
                                <X size={12} />
                              </button>
                            </div>
                          ) : (
                            <label className={styles.uploadLabel}>
                              <ImageIcon size={16} />
                              <span>Upload Imagem</span>
                              <input 
                                type="file" 
                                accept="image/*" 
                                hidden 
                                onChange={(e) => handleImageUpload(topic.id, adj.id, e.target.files?.[0] || null)}
                              />
                            </label>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <button className={styles.addAdjBtn} onClick={() => addAdjustment(topic.id)}>
                    <Plus size={14} /> Novo Ajuste
                  </button>
                </div>
              )}
            </div>
          ))}
          <button className={`${styles.button} ${styles.primaryButton}`} onClick={addTopic} style={{ width: '100%', justifyContent: 'center', marginTop: '16px' }}>
            <Plus size={18} /> Novo Tópico
          </button>
        </section>

        <section style={{ marginTop: '32px' }}>
           <h4 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '8px' }}>
             Observações Gerais
           </h4>
           <textarea 
             className={styles.adjTextarea}
             style={{ minHeight: '120px' }}
             value={activeClient.obs}
             onChange={(e) => updateClient({ ...activeClient, obs: e.target.value })}
             placeholder="Anotações gerais para este cliente..."
           />
        </section>
      </main>

      <style jsx>{`
        .qcHeader { padding-bottom: 12px; margin-bottom: 24px; border-bottom: 1px solid var(--border-color); }
        .dangerButton { color: var(--status-error); border: 1px solid transparent; }
        .dangerButton:hover { background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.2); }
        .topicInput { background: transparent; border: none; font-weight: 700; color: inherit; flex: 1; outline: none; }
        .deleteBtn { color: var(--text-secondary); opacity: 0.6; transition: opacity 0.2s; }
        .deleteBtn:hover { opacity: 1; color: var(--status-error); }
        .topicBody { padding: 8px 0; }
        .adjRow { display: flex; gap: 12px; padding: 16px 0; border-bottom: 1px solid var(--border-color); align-items: flex-start; }
        .adjRow:last-child { border-bottom: none; }
        .adjNum { font-size: 0.75rem; font-weight: 800; color: var(--text-secondary); opacity: 0.5; margin-top: 4px; font-family: monospace; }
        .adjHeader { flex: 1; }
        .adjInput { background: transparent; border: none; font-weight: 600; color: var(--text-primary); flex: 1; outline: none; font-size: 0.9rem; }
        .adjTextarea { width: 100%; background: var(--bg-main); border: 1px solid var(--border-color); border-radius: var(--radius-sm); color: var(--text-secondary); padding: 8px 12px; font-size: 0.85rem; outline: none; resize: vertical; margin-bottom: 8px; }
        .adjTextarea:focus { border-color: var(--accent-primary); }
        .imageUploadBox { display: flex; gap: 8px; flex-wrap: wrap; }
        .uploadLabel { display: flex; align-items: center; gap: 8px; font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); background: var(--bg-main); border: 1px dashed var(--border-color); padding: 6px 12px; border-radius: var(--radius-md); cursor: pointer; transition: all 0.2s; }
        .uploadLabel:hover { border-color: var(--accent-primary); color: var(--accent-primary); }
        .imagePreviewWrapper { position: relative; width: 120px; height: 80px; border-radius: var(--radius-md); overflow: hidden; border: 1px solid var(--border-color); }
        .imagePreview { width: 100%; height: 100%; object-fit: cover; }
        .removeImageBtn { position: absolute; top: 4px; right: 4px; background: rgba(0,0,0,0.6); color: white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); }
        .addAdjBtn { display: flex; align-items: center; gap: 8px; font-size: 0.8rem; font-weight: 700; color: var(--accent-primary); margin-top: 12px; }
      `}</style>
    </div>
  );
}
