'use client';

import React, { useEffect, useState } from 'react';
import { QCSection } from '../../components/dashboard/QCSection';
import { QCEditor } from '../../components/dashboard/QCEditor';
import { CheckCircle2, Clock, ChevronDown, ChevronUp, Layout } from 'lucide-react';
import { useDashboardStore, QCTopic } from '../../hooks/dashboard/useDashboardStore';
import styles from '../../components/dashboard/dashboard-premium.module.css';

export default function QualityCheckPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const { clients } = useDashboardStore();

  useEffect(() => {
    fetchAssignments();
  }, []);

  // Converte qualquer formato de qcMetadata para o formato do QCEditor (format A)
  // Aceita tanto { name, ajustes, done } quanto { title, adjustments, isFixed }
  const toEditorFormat = (raw: any[]): QCTopic[] => {
    if (!Array.isArray(raw)) return [];
    return raw.map((t: any, i: number) => ({
      id: typeof t.id === 'number' ? t.id : (i + 1) * 1000,
      name: t.name ?? t.title ?? '',
      open: t.open ?? true,
      ajustes: (t.ajustes ?? t.adjustments ?? []).map((a: any, j: number) => ({
        id: typeof a.id === 'number' ? a.id : (i + 1) * 1000 + j,
        title: a.title ?? a.description ?? '',
        desc: a.desc ?? a.description ?? '',
        done: a.done ?? a.isFixed ?? false,
        img: a.img ?? (Array.isArray(a.images) && a.images.length > 0 ? a.images[0] : null),
      })),
    }));
  };

  const fetchAssignments = async () => {
    try {
      const res = await fetch('/api/tasks/assignments');
      const data = await res.json();
      if (data.assignments) {
        // Filtrar tarefas que estão em inReview e ainda não foram aprovadas
        const reviewTasks = data.assignments.filter((a: any) => a.column === 'inReview' && !a.qaApproved);
        
        // Inicializar qcMetadata se vazio baseado no cliente; normalizar se já existe
        const initializedTasks = reviewTasks.map((t: any) => {
          if (!t.qcMetadata || (Array.isArray(t.qcMetadata) && t.qcMetadata.length === 0)) {
            const clientInfo = clients.find(c => t.client.toLowerCase().includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(t.client.toLowerCase()));
            return { ...t, qcMetadata: clientInfo?.topicos || [] };
          }
          // Normaliza para o formato do QCEditor independente de qual formato veio do banco
          return { ...t, qcMetadata: toEditorFormat(t.qcMetadata) };
        });

        setTasks(initializedTasks);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateQC = async (taskId: string, topics: QCTopic[]) => {
    // Atualiza estado local
    setTasks(prev => prev.map(t => t.taskId === taskId ? { ...t, qcMetadata: topics } : t));

    // Salva no banco
    try {
      await fetch('/api/tasks/assignments/qc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, qcMetadata: topics })
      });
    } catch (err) {
      console.error('Erro ao salvar QC:', err);
    }
  };

  const handleApprove = async (taskId: string) => {
    if (confirm('Aprovar a qualidade dessa tarefa? Ela será liberada para ser movida para Concluída.')) {
      try {
        await fetch('/api/tasks/assignments/qa-approve', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ taskId })
        });
        // Atualizar lista local
        setTasks(prev => prev.filter(t => t.taskId !== taskId));
      } catch (err) {
        alert('Erro ao aprovar tarefa.');
      }
    }
  };

  const handleReject = async (taskId: string) => {
    if (confirm('Deseja REPROVAR esta tarefa? Ela voltará para a fila do desenvolvedor com as falhas apontadas.')) {
      try {
        await fetch('/api/tasks/assignments/qa-reject', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ taskId })
        });
        // Atualizar lista local
        setTasks(prev => prev.filter(t => t.taskId !== taskId));
      } catch (err) {
        alert('Erro ao reprovar tarefa.');
      }
    }
  };

  return (
    <div style={{ paddingBottom: '100px' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 900, letterSpacing: '-0.02em' }}>
          <span style={{ 
            background: 'linear-gradient(135deg, var(--accent-primary), var(--premium-purple))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginRight: '12px'
          }}>TÉCNICO</span> 
          Quality Check
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: 500, marginTop: '8px' }}>
          Validação técnica e auditoria de UX das demandas concluídas
        </p>
      </header>

      <section style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'var(--status-warning)', width: '8px', height: '8px', borderRadius: '50%' }}></div>
            Fila de Auditoria ({tasks.length})
          </h2>
          <button onClick={fetchAssignments} className={styles.iconBtn} style={{ gap: '8px', fontSize: '0.8rem' }}>
            <Clock size={14} /> Sincronizar
          </button>
        </div>
        
        {tasks.length === 0 ? (
          <div className={styles.glassCard} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <CheckCircle2 size={40} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
            <p style={{ fontWeight: 600 }}>Tudo limpo por aqui!</p>
            <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>Nenhuma demanda aguardando QA no momento.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '20px' }}>
            {tasks.map(t => (
              <div key={t.taskId} className={styles.glassCard} style={{ overflow: 'hidden', border: expandedTaskId === t.taskId ? '1px solid var(--premium-purple)' : '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', background: 'rgba(255,255,255,0.01)' }}>
                  <div 
                    style={{ flex: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px' }}
                    onClick={() => setExpandedTaskId(expandedTaskId === t.taskId ? null : t.taskId)}
                  >
                    <div style={{ 
                      width: '40px', height: '40px', borderRadius: '12px', 
                      background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--text-primary)' 
                    }}>
                      {expandedTaskId === t.taskId ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '2px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {t.taskId} <span style={{ color: 'var(--border-color)', margin: '0 4px' }}>|</span> {t.client}
                      </div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{t.title}</div>
                      <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>
                        Executor: <span style={{ color: 'var(--accent-secondary)', fontWeight: 800 }}>{t.user?.name || 'Não atribuído'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button 
                      onClick={() => setExpandedTaskId(expandedTaskId === t.taskId ? null : t.taskId)}
                      style={{ 
                        background: 'transparent', border: '1px solid var(--border-color)', 
                        color: 'var(--text-primary)', padding: '10px 20px', borderRadius: '12px', 
                        fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' 
                      }}
                    >
                       <Layout size={16} /> {expandedTaskId === t.taskId ? 'Fechar' : 'Abrir Auditoria'}
                    </button>

                    <div style={{ width: '1px', height: '24px', background: 'var(--border-color)', margin: '0 4px' }}></div>
                    
                    <button 
                      onClick={() => handleReject(t.taskId)}
                      style={{ 
                        background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', 
                        color: 'rgb(239, 68, 68)', padding: '10px 16px', borderRadius: '12px', 
                        fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' 
                      }}
                    >
                       Reprovar
                    </button>

                    <button 
                      onClick={() => handleApprove(t.taskId)}
                      style={{ 
                        background: 'var(--status-success)', color: 'white', border: 'none', 
                        padding: '10px 24px', borderRadius: '12px', fontWeight: 800, 
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', 
                        fontSize: '0.85rem', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)' 
                      }}
                    >
                       Aprovar QA
                    </button>
                  </div>
                </div>

                {expandedTaskId === t.taskId && (
                  <div style={{ padding: '32px', borderTop: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.15)' }}>
                    <QCEditor 
                      topics={t.qcMetadata || []} 
                      onChange={(topics) => handleUpdateQC(t.taskId, topics)}
                      title="Apontamentos e Checklist de Qualidade"
                      showReset={false}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
