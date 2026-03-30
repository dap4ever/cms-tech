'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Target, Flag, CheckCircle, RotateCcw, ShieldCheck } from 'lucide-react';
import styles from './TaskGovernance.module.css';

interface TaskGovernanceProps {
  taskId: string;
  initialColumn: string;
  initialSprintId: string | null;
  initialPriority: string;
  initialQAApproved: boolean;
  sprints: any[];
  isAdminOrGestor: boolean;
}

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Baixa', color: '#60a5fa' },
  { value: 'normal', label: 'Normal', color: '#94a3b8' },
  { value: 'high', label: 'Alta', color: '#f59e0b' },
  { value: 'critical', label: 'Crítica', color: '#ef4444' }
];

const STATUS_OPTIONS = [
  { value: 'todo', label: 'A Fazer' },
  { value: 'inProgress', label: 'Em Andamento' },
  { value: 'inReview', label: 'Em Revisao' },
  { value: 'done', label: 'Concluido' }
];

export function TaskGovernance({ 
  taskId, 
  initialColumn,
  initialSprintId, 
  initialPriority, 
  initialQAApproved,
  sprints,
  isAdminOrGestor 
}: TaskGovernanceProps) {
  const router = useRouter();
  const [column, setColumn] = useState(initialColumn || 'todo');
  const [sprintId, setSprintId] = useState(initialSprintId || '');
  const [priority, setPriority] = useState(initialPriority || 'normal');
  const [qaApproved, setQaApproved] = useState(initialQAApproved);
  const [loading, setLoading] = useState(false);

  const handleUpdateColumn = async (val: string) => {
    if (val === 'done' && !qaApproved) {
      alert('Esta demanda precisa ser aprovada no Quality Check para ser finalizada.');
      return;
    }

    const previousColumn = column;
    setColumn(val);
    setLoading(true);
    try {
      const res = await fetch('/api/tasks/assignments/column', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, column: val })
      });

      if (!res.ok) {
        throw new Error('Erro ao atualizar status');
      }

      router.refresh();
    } catch (e) {
      setColumn(previousColumn);
      alert('Erro ao atualizar status');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSprint = async (val: string) => {
    setSprintId(val);
    setLoading(true);
    try {
      await fetch('/api/tasks/assignments/sprint', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, sprintId: val })
      });
    } catch (e) {
      alert('Erro ao atualizar sprint');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePriority = async (val: string) => {
    setPriority(val);
    setLoading(true);
    try {
      await fetch('/api/tasks/assignments/priority', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, priority: val })
      });
    } catch (e) {
      alert('Erro ao atualizar prioridade');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleQA = async () => {
    const action = qaApproved ? 'qa-revert' : 'qa-approve';
    const confirmMsg = qaApproved ? 'Reverter a aprovação técnica?' : 'Aprovar a qualidade técnica desta demanda?';
    
    if (!confirm(confirmMsg)) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/assignments/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId })
      });
      if (res.ok) {
        setQaApproved(!qaApproved);
      }
    } catch (e) {
      alert('Erro ao processar status de QA');
    } finally {
      setLoading(false);
    }
  };

  if (!isAdminOrGestor) return null;

  return (
    <div className={styles.govCard}>
      <h3 className={styles.govTitle}>
        <ShieldCheck size={16} /> Gestão da Demanda
      </h3>
      
      <div className={styles.govField}>
        <label><Target size={14} /> Status no Fluxo</label>
        <select 
          value={column}
          onChange={(e) => handleUpdateColumn(e.target.value)}
          disabled={loading}
          className={styles.govSelect}
        >
          {STATUS_OPTIONS.map(status => (
            <option key={status.value} value={status.value}>{status.label}</option>
          ))}
        </select>
      </div>

      <div className={styles.govField}>
        <label><Target size={14} /> Ciclo de Sprint</label>
        <select 
          value={sprintId} 
          onChange={(e) => handleUpdateSprint(e.target.value)}
          disabled={loading}
          className={styles.govSelect}
        >
          <option value="">Backlog (Sem Sprint)</option>
          {sprints.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      <div className={styles.govField}>
        <label><Flag size={14} /> Importância</label>
        <select 
          value={priority} 
          onChange={(e) => handleUpdatePriority(e.target.value)}
          disabled={loading}
          className={styles.govSelect}
        >
          {PRIORITY_OPTIONS.map(p => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </div>

      <div className={styles.govActions}>
        <button 
          onClick={handleToggleQA}
          disabled={loading}
          className={qaApproved ? styles.revertBtn : styles.approveBtn}
        >
          {qaApproved ? (
            <><RotateCcw size={14} /> Reverter Aprovação QA</>
          ) : (
            <><CheckCircle size={14} /> Aprovar Qualidade QA</>
          )}
        </button>
      </div>
    </div>
  );
}
