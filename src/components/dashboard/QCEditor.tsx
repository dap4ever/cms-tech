'use client';

import React from 'react';
import { 
  CheckCircle2, 
  ChevronRight, 
  ChevronDown, 
  Trash2, 
  Plus, 
  Image as ImageIcon, 
  X,
  Layout,
  RefreshCcw
} from 'lucide-react';
import { QCTopic, QCAdjustment } from '../../hooks/dashboard/useDashboardStore';
import styles from './dashboard-premium.module.css';

interface QCEditorProps {
  topics: QCTopic[];
  onChange: (topics: QCTopic[]) => void;
  onReset?: () => void;
  title?: string;
  showReset?: boolean;
}

export function QCEditor({ topics, onChange, onReset, title, showReset = true }: QCEditorProps) {
  
  const updateTopic = (topicId: number, data: Partial<QCTopic>) => {
    const newTopics = topics.map(t => 
      t.id === topicId ? { ...t, ...data } : t
    );
    onChange(newTopics);
  };

  const deleteTopic = (topicId: number) => {
    if (confirm('Remover este grupo de ajustes?')) {
      const newTopics = topics.filter(t => t.id !== topicId);
      onChange(newTopics);
    }
  };

  const addTopic = () => {
    const newTopic: QCTopic = {
      id: Date.now(),
      name: 'Novo Grupo de Ajustes',
      open: true,
      ajustes: []
    };
    onChange([...topics, newTopic]);
  };

  const addAdjustment = (topicId: number) => {
    const newAdj: QCAdjustment = {
      id: Date.now(),
      title: '',
      desc: '',
      done: false,
      img: null
    };
    const newTopics = topics.map(t => 
      t.id === topicId ? { ...t, ajustes: [...t.ajustes, newAdj] } : t
    );
    onChange(newTopics);
  };

  const updateAdjustment = (topicId: number, adjId: number, data: Partial<QCAdjustment>) => {
    const newTopics = topics.map(t => {
      if (t.id === topicId) {
        return {
          ...t,
          ajustes: t.ajustes.map(a => a.id === adjId ? { ...a, ...data } : a)
        };
      }
      return t;
    });
    onChange(newTopics);
  };

  const deleteAdjustment = (topicId: number, adjId: number) => {
    const newTopics = topics.map(t => {
      if (t.id === topicId) {
        return { ...t, ajustes: t.ajustes.filter(a => a.id !== adjId) };
      }
      return t;
    });
    onChange(newTopics);
  };

  const handleImageUpload = (topicId: number, adjId: number, file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      updateAdjustment(topicId, adjId, { img: result });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className={styles.qcEditorContainer}>
      {title && (
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>{title}</h3>
          {showReset && onReset && (
            <button 
              onClick={onReset}
              className={styles.iconBtn} 
              style={{ color: 'var(--status-error)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', fontWeight: 700 }}
            >
              <RefreshCcw size={12} /> Resetar
            </button>
          )}
        </header>
      )}

      <div style={{ display: 'grid', gap: '16px' }}>
        {topics.map((topic) => (
          <div key={topic.id} className={styles.glassCard} style={{ overflow: 'hidden', border: '1px solid rgba(255,255,255,0.03)' }}>
            <div 
              className={styles.topicHeader}
              onClick={() => updateTopic(topic.id, { open: !topic.open })}
              style={{ border: 'none', borderRadius: '0', padding: '12px 16px' }}
            >
              <div style={{ color: 'var(--premium-purple)' }}>
                {topic.open ? <ChevronDown size={18} strokeWidth={3} /> : <ChevronRight size={18} strokeWidth={3} />}
              </div>
              <input 
                className={styles.premiumInput}
                style={{ flex: 1, background: 'transparent', border: 'none', boxShadow: 'none', fontSize: '0.9rem', fontWeight: 700, padding: '4px 8px' }}
                value={topic.name}
                onChange={(e) => updateTopic(topic.id, { name: e.target.value })}
                onClick={(e) => e.stopPropagation()}
              />
              <button 
                className={styles.iconBtn} 
                onClick={(e) => { e.stopPropagation(); deleteTopic(topic.id); }}
                style={{ opacity: 0.3 }}
              >
                <Trash2 size={14} />
              </button>
            </div>

            {topic.open && (
              <div style={{ padding: '0 16px 16px' }}>
                <div style={{ display: 'grid', gap: '8px' }}>
                  {topic.ajustes.map((adj) => (
                    <div key={adj.id} className={styles.adjItem} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', padding: '12px 0' }}>
                      <div style={{ paddingTop: '4px' }}>
                        <div 
                          onClick={() => updateAdjustment(topic.id, adj.id, { done: !adj.done })}
                          style={{ 
                            width: '20px', height: '20px', borderRadius: '5px', 
                            border: `2px solid ${adj.done ? 'var(--status-success)' : 'var(--border-color)'}`,
                            background: adj.done ? 'var(--status-success)' : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', transition: 'all 0.2s'
                          }}
                        >
                          {adj.done && <CheckCircle2 size={14} color="white" />}
                        </div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                           <input 
                              className={styles.premiumInput}
                              style={{ flex: 1, fontWeight: 700, fontSize: '0.85rem' }}
                              value={adj.title}
                              onChange={(e) => updateAdjustment(topic.id, adj.id, { title: e.target.value })}
                              placeholder="Título do ajuste..."
                           />
                           <button className={styles.iconBtn} onClick={() => deleteAdjustment(topic.id, adj.id)} style={{ opacity: 0.3 }}>
                              <Trash2 size={12} />
                           </button>
                        </div>
                        <textarea 
                          className={styles.premiumInput}
                          style={{ width: '100%', minHeight: '40px', color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '8px' }}
                          value={adj.desc}
                          onChange={(e) => updateAdjustment(topic.id, adj.id, { desc: e.target.value })}
                          placeholder="Notas..."
                        />
                        
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          {adj.img ? (
                            <div style={{ position: 'relative', width: '120px', height: '70px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                              <img src={adj.img} alt="Evidência" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              <button 
                                onClick={() => updateAdjustment(topic.id, adj.id, { img: null })}
                                style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(0,0,0,0.6)', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ) : (
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', cursor: 'pointer', padding: '6px 12px', borderRadius: '6px', background: 'rgba(255,255,255,0.03)', border: '1px dashed var(--border-color)' }}>
                               <ImageIcon size={12} /> Evidência
                               <input type="file" accept="image/*" hidden onChange={(e) => handleImageUpload(topic.id, adj.id, e.target.files?.[0] || null)} />
                            </label>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button 
                  className={styles.textBtn} 
                  onClick={() => addAdjustment(topic.id)}
                  style={{ marginTop: '12px', color: 'var(--premium-purple)', fontWeight: 800, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={14} strokeWidth={3} /> ADICIONAR ITEM
                </button>
              </div>
            )}
          </div>
        ))}
        
        <button 
          className={styles.premiumButton} 
          onClick={addTopic}
          style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '8px', fontSize: '0.8rem', padding: '10px' }}
        >
          <Layout size={16} /> NOVO GRUPO DE AUDITORIA
        </button>
      </div>
    </div>
  );
}
