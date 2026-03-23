"use client";

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Save, Timer } from 'lucide-react';
import styles from '@/app/taskrow/task/[id]/task.module.css';
import { useAuth } from '@/context/AuthContext';

interface TimeTrackerProps {
  taskId: string;
  initialHoursEstimated?: number;
}

export function TimeTracker({ taskId, initialHoursEstimated = 0 }: TimeTrackerProps) {
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [manualHours, setManualHours] = useState("");
  const [estimation, setEstimation] = useState(initialHoursEstimated.toString());
  const [showSuccess, setShowSuccess] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const { isDev } = useAuth();

  // Escutar evento da IA e carregar dados salvos
  useEffect(() => {
    const handleAiEvent = (e: any) => {
      if (e.detail?.taskId === taskId) {
        setAiRecommendation(e.detail.estimationHr);
      }
    };
    window.addEventListener('ai_estimation_ready', handleAiEvent);

    const saved = localStorage.getItem(`time_tracker_${taskId}`);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.seconds) setSeconds(data.seconds);
        if (data.estimation) setEstimation(data.estimation);
        if (data.manualHours) setManualHours(data.manualHours);
      } catch (e) {}
    }

    return () => {
      window.removeEventListener('ai_estimation_ready', handleAiEvent);
    };
  }, [taskId]);

  // Lógica do Timer
  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    } else if (!isActive && timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive]);

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggle = () => setIsActive(!isActive);
  
  const handleReset = () => {
    if (confirm("Deseja zerar o cronômetro?")) {
      setSeconds(0);
      setIsActive(false);
    }
  };

  const handleSave = async () => {
    try {
      const res = await fetch('/api/tasks/assignments/time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          seconds,
          estimation,
          manualHours
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        alert("Erro ao salvar o tempo: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar progresso de rastreamento.");
    }
  };

  return (
    <div className={styles.timeTrackerCard}>
      <div className={styles.trackerHeader}>
        <div className={styles.trackerTitle}>Rastreamento de Tempo</div>
        <Timer size={16} className={styles.metaIcon} />
      </div>

      <div className={styles.timerDisplay}>
        {formatTime(seconds)}
      </div>

      <div className={styles.trackerControls}>
        <button 
          className={`${styles.controlBtn} ${isActive ? styles.btnPause : styles.btnStart}`}
          onClick={handleToggle}
        >
          {isActive ? <Pause size={18} /> : <Play size={18} />}
          {isActive ? 'Pausar' : 'Iniciar'}
        </button>
        <button className={`${styles.controlBtn} styles.btnReset`} onClick={handleReset}>
          <RotateCcw size={18} />
        </button>
      </div>

      <div className={styles.trackerInputs}>
        <div className={styles.inputGroup}>
          <label className={styles.inputLabel}>Horas Trabalhadas (Opcional)</label>
          <input 
            type="text" 
            className={styles.trackerInput}
            placeholder="Ex: 2.5"
            value={manualHours}
            onChange={(e) => setManualHours(e.target.value)}
          />
        </div>

        {!isDev && (
          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>Nova Estimativa (Horas)</label>
            <input 
              type="text" 
              className={styles.trackerInput}
              placeholder="Ex: 10"
              value={estimation}
              onChange={(e) => setEstimation(e.target.value)}
            />
            {aiRecommendation && (
              <div style={{ marginTop: '8px', fontSize: '0.75rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span title="Recomendação da IA Tech Lead">✨</span> A IA recomendou: <strong>{aiRecommendation}</strong>
              </div>
            )}
          </div>
        )}

        <button className={styles.saveBtn} onClick={handleSave}>
          <Save size={18} /> Salvar Progresso
        </button>

        {showSuccess && <div className={styles.saveSuccess}>✓ Progresso salvo localmente!</div>}
      </div>
    </div>
  );
}
