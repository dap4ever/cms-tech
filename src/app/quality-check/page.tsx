'use client';

import React, { useEffect, useState } from 'react';
import { QCSection } from '../../components/dashboard/QCSection';
import { CheckCircle2, Clock } from 'lucide-react';
import styles from '../../components/dashboard/dashboard-premium.module.css';

export default function QualityCheckPage() {
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const res = await fetch('/api/tasks/assignments');
      const data = await res.json();
      if (data.assignments) {
        // Filtrar tarefas que estão em inReview e ainda não foram aprovadas
        const reviewTasks = data.assignments.filter((a: any) => a.column === 'inReview' && !a.qaApproved);
        setTasks(reviewTasks);
      }
    } catch (e) {
      console.error(e);
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

  return (
    <div>
      <h1 style={{ marginBottom: '24px', fontSize: '1.8rem', fontWeight: 800 }}>
        <span style={{ color: 'var(--accent-primary)' }}>QC</span> Quality Check
      </h1>

      {/* Demandas aguardando aprovação para prosseguir no Kanban */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={18} color="var(--status-warning)" /> Demandas Aguardando Qualidade
        </h2>
        
        {tasks.length === 0 ? (
          <div className={styles.glassCard} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Nenhuma demanda aguardando Quality Check no momento.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {tasks.map(t => (
              <div key={t.taskId} className={styles.glassCard} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>{t.taskId} - {t.client}</div>
                  <div style={{ fontSize: '1rem', fontWeight: 700 }}>{t.title}</div>
                  <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>Dev: <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{t.user?.name || 'Não atribuído'}</span></div>
                </div>
                <button 
                  onClick={() => handleApprove(t.taskId)}
                  style={{ background: 'var(--status-success)', color: 'white', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                   <CheckCircle2 size={18} /> Aprovar Qualidade
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <div style={{ height: '1px', background: 'var(--border-color)', margin: '32px 0' }}></div>

      <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>Auditoria de Projetos</h2>
      <QCSection />
    </div>
  );
}
