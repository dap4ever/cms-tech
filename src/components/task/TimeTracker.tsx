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
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const { isDev } = useAuth();

  // Carregar dados salvos
  useEffect(() => {
    const saved = localStorage.getItem(`time_tracker_${taskId}`);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.seconds) setSeconds(data.seconds);
        if (data.estimation) setEstimation(data.estimation);
        if (data.manualHours) setManualHours(data.manualHours);
      } catch (e) {}
    }
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

  const handleSave = () => {
    const data = {
      taskId,
      seconds,
      estimation,
      manualHours,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(`time_tracker_${taskId}`, JSON.stringify(data));
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
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
