"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Pause, RotateCcw, Save, Timer, Sparkles, Check, X, Loader2, Pencil } from 'lucide-react';
import styles from '@/app/taskrow/task/[id]/task.module.css';

interface TimeEntry {
  id: string;
  userId: string;
  hours: number;
  user: { id: string; name: string; avatarUrl?: string; roles: string[] };
}

interface CurrentUser {
  id: string;
  name: string;
  roles: string[];
}

interface TimeTrackerProps {
  taskId: string;
  initialHoursEstimated?: number;
  initialHoursTracked?: number;
  currentUser: CurrentUser;
  timeEntries?: TimeEntry[];
}

export function TimeTracker({
  taskId,
  initialHoursEstimated = 0,
  initialHoursTracked = 0,
  currentUser,
  timeEntries: initialEntries = [],
}: TimeTrackerProps) {
  const router = useRouter();
  const isPrivileged = currentUser.roles?.includes('GESTOR') || currentUser.roles?.includes('ADMINISTRADOR');

  const myEntry = initialEntries.find(e => e.userId === currentUser.id);

  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [manualHours, setManualHours] = useState(
    myEntry ? String(myEntry.hours) : (initialHoursTracked > 0 ? String(initialHoursTracked) : '')
  );
  const [estimation, setEstimation] = useState(initialHoursEstimated > 0 ? String(initialHoursEstimated) : '');
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<{ id: string; userId: string; hours: string } | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleAiEvent = (e: any) => {
      if (e.detail?.taskId === taskId) setAiRecommendation(e.detail.estimationHr);
    };
    window.addEventListener('ai_estimation_ready', handleAiEvent);
    return () => window.removeEventListener('ai_estimation_ready', handleAiEvent);
  }, [taskId]);

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => setSeconds(prev => prev + 1), 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isActive]);

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggle = () => setIsActive(!isActive);
  const handleReset = () => {
    if (confirm('Deseja zerar o cronometro?')) { setSeconds(0); setIsActive(false); }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const hoursValue = manualHours && !isNaN(parseFloat(manualHours))
        ? parseFloat(manualHours)
        : parseFloat((seconds / 3600).toFixed(2));

      const safeJson = async (response: Response) => {
        const text = await response.text();
        return text ? JSON.parse(text) : {};
      };

      const res = await fetch('/api/tasks/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, hours: hoursValue }),
      });
      const data = await safeJson(res);
      if (!res.ok || !data.success) { alert('Erro ao salvar: ' + (data.error || 'Falha ao registrar horas.')); return; }

      if (estimation && estimation !== '--') {
        const estimationRes = await fetch('/api/tasks/assignments/time', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskId, estimation }),
        });

        const estimationData = await safeJson(estimationRes);
        if (!estimationRes.ok || estimationData.error) {
          alert('Horas salvas, mas houve erro ao atualizar a estimativa.');
          return;
        }
      }

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      router.refresh();
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar progresso.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingEntry) return;
    setIsSavingEdit(true);
    try {
      const hoursValue = parseFloat(editingEntry.hours);
      if (isNaN(hoursValue) || hoursValue < 0) { alert('Valor invalido'); return; }
      const safeJson = async (response: Response) => {
        const text = await response.text();
        return text ? JSON.parse(text) : {};
      };
      const res = await fetch('/api/tasks/time-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, hours: hoursValue, targetUserId: editingEntry.userId }),
      });
      const data = await safeJson(res);
      if (!res.ok || !data.success) { alert('Erro: ' + (data.error || 'Falha ao salvar edição.')); return; }
      setEditingEntry(null);
      router.refresh();
    } catch (err) {
      alert('Erro de conexao.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const otherEntries = initialEntries.filter(e => e.userId !== currentUser.id);

  return (
    <div className={styles.timeTrackerCard}>
      <div className={styles.trackerHeader}>
        <div className={styles.trackerTitle}>Rastreamento de Tempo</div>
        <Timer size={16} className={styles.metaIcon} />
      </div>

      <div className={styles.timerDisplay}>{formatTime(seconds)}</div>

      <div className={styles.trackerControls}>
        <button
          className={`${styles.controlBtn} ${isActive ? styles.btnPause : styles.btnStart}`}
          onClick={handleToggle}
        >
          {isActive ? <Pause size={18} /> : <Play size={18} />}
          {isActive ? 'Pausar' : 'Iniciar'}
        </button>
        <button className={`${styles.controlBtn} ${styles.btnReset}`} onClick={handleReset}>
          <RotateCcw size={18} />
        </button>
      </div>

      <div className={styles.trackerInputs}>
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>Minhas Horas Trabalhadas</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              className={styles.trackerInput}
              style={{ flex: 1 }}
              placeholder="Ex: 2.5"
              value={manualHours}
              onChange={e => setManualHours(e.target.value)}
              disabled={isSaving}
            />
            <button onClick={handleSave} className={styles.miniSaveBtn} title="Registrar horas agora" disabled={isSaving}>
              {isSaving ? <Loader2 size={14} className={styles.spinner} /> : <Save size={14} />}
            </button>
          </div>
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>Estimativa (Horas)</label>
          <input
            type="text"
            className={styles.trackerInput}
            placeholder="Ex: 10"
            value={estimation}
            onChange={e => setEstimation(e.target.value)}
            disabled={isSaving}
          />
          {aiRecommendation && (
            <div style={{ marginTop: '10px', background: 'linear-gradient(135deg, rgba(168,85,247,0.12), rgba(139,92,246,0.06))', border: '1px solid rgba(168,85,247,0.4)', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 10px', background: 'rgba(168,85,247,0.15)', borderBottom: '1px solid rgba(168,85,247,0.2)' }}>
                <Sparkles size={12} color="#a855f7" />
                <span style={{ fontSize: '0.65rem', color: '#a855f7', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>IA estimou</span>
              </div>
              <div style={{ padding: '8px 10px' }}>
                <p style={{ margin: '0 0 4px 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Voce concorda com <strong style={{ color: 'var(--text-primary)' }}>{aiRecommendation}</strong>?
                </p>
                <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                  <button
                    onClick={() => { setEstimation(aiRecommendation); setAiRecommendation(null); }}
                    style={{ flex: 1, background: '#a855f7', color: 'white', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                  >
                    <Check size={13} /> Confirmar
                  </button>
                  <button
                    onClick={() => setAiRecommendation(null)}
                    style={{ background: 'transparent', border: '1px solid rgba(168,85,247,0.3)', color: 'var(--text-secondary)', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <X size={13} /> Ignorar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          className={`${styles.saveBtn} ${isSaving ? styles.saveBtnLoading : ''}`}
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving
            ? <><Loader2 size={16} className={styles.spinner} /> Salvando...</>
            : <><Save size={18} /> Salvar Progresso</>}
        </button>

        {isSaving && (
          <div className={styles.savingStatus}>
            <span className={styles.savingDot} />
            Processando, aguarde...
          </div>
        )}
        {showSuccess && <div className={styles.saveSuccess}>Progresso salvo com sucesso!</div>}

        {isPrivileged && otherEntries.length > 0 && (
          <div className={styles.teamHoursSection}>
            <div className={styles.teamHoursTitle}>Horas da Equipe</div>
            {otherEntries.map(entry => (
              <div key={entry.id} className={styles.teamHoursRow}>
                <div className={styles.teamHoursAvatar}>
                  {entry.user.avatarUrl
                    ? <img src={entry.user.avatarUrl} alt={entry.user.name} className={styles.avatarImage} />
                    : entry.user.name.substring(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className={styles.teamHoursName}>{entry.user.name}</div>
                  {editingEntry?.id === entry.id ? (
                    <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                      <input
                        type="text"
                        value={editingEntry.hours}
                        onChange={e => setEditingEntry({ ...editingEntry, hours: e.target.value })}
                        className={styles.trackerInput}
                        style={{ width: '70px', padding: '4px 8px', fontSize: '0.8rem' }}
                        autoFocus
                      />
                      <button
                        onClick={handleSaveEdit}
                        disabled={isSavingEdit}
                        style={{ background: '#a855f7', color: 'white', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                        {isSavingEdit ? <Loader2 size={12} className={styles.spinner} /> : <Check size={12} />}
                      </button>
                      <button
                        onClick={() => setEditingEntry(null)}
                        style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer' }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className={styles.teamHoursValue}>{entry.hours}h</div>
                  )}
                </div>
                {editingEntry?.id !== entry.id && (
                  <button
                    onClick={() => setEditingEntry({ id: entry.id, userId: entry.userId, hours: String(entry.hours) })}
                    className={styles.teamHoursEditBtn}
                    title="Editar horas"
                  >
                    <Pencil size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
