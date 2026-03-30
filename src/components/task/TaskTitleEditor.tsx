'use client';
import { useState, useEffect } from 'react';
import { Check, Edit2, Sparkles, X } from 'lucide-react';
import styles from '@/app/taskrow/task/[id]/task.module.css';

export function TaskTitleEditor({ taskId, defaultTitle, originalTitle }: { taskId: string, defaultTitle: string, originalTitle: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(defaultTitle);
  const [saving, setSaving] = useState(false);
  const [aiSuggestedTitle, setAiSuggestedTitle] = useState<string | null>(null);

  useEffect(() => {
    const handleAiTitle = (e: any) => {
      if (e.detail?.taskId === taskId) {
        setAiSuggestedTitle(e.detail.suggestedTitle);
      }
    };
    window.addEventListener('ai_title_ready', handleAiTitle);
    return () => window.removeEventListener('ai_title_ready', handleAiTitle);
  }, [taskId]);

  const handleSave = async (titleToSave = title) => {
    setSaving(true);
    try {
      const res = await fetch('/api/tasks/assignments/title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, title: titleToSave })
      });
      if (res.ok) {
        setTitle(titleToSave);
        setIsEditing(false);
        setAiSuggestedTitle(null);
      } else {
        alert('Erro ao salvar o título');
      }
    } catch (e) {
      alert('Erro na requisição');
    }
    setSaving(false);
  };

  return (
    <div style={{ flex: 1 }}>
      {isEditing ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input 
            type="text" 
            value={title} 
            onChange={e => setTitle(e.target.value)} 
            style={{ fontSize: '1.5rem', fontWeight: 800, padding: '4px 8px', width: '100%', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '6px' }}
            autoFocus
          />
          <button onClick={() => handleSave()} disabled={saving} style={{ background: 'var(--accent-primary)', color: 'white', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}>
            <Check size={18} />
          </button>
        </div>
      ) : (
        <h1 className={styles.taskTitle} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => setIsEditing(true)}>
          {title} <Edit2 size={16} color="var(--text-secondary)" />
        </h1>
      )}
      
      {originalTitle && originalTitle !== title && (
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Título original (Taskrow): {originalTitle}
        </p>
      )}

      {aiSuggestedTitle && (
        <div style={{ marginTop: '12px', background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.12), rgba(139, 92, 246, 0.06))', border: '1px solid rgba(168, 85, 247, 0.4)', borderRadius: '10px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', background: 'rgba(168, 85, 247, 0.15)', borderBottom: '1px solid rgba(168, 85, 247, 0.2)' }}>
            <Sparkles size={14} color="#a855f7" />
            <span style={{ fontSize: '0.7rem', color: '#a855f7', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>IA sugeriu um título melhor</span>
          </div>
          <div style={{ padding: '10px 12px' }}>
            <p style={{ margin: '0 0 10px 0', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>&ldquo;{aiSuggestedTitle}&rdquo;</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => handleSave(aiSuggestedTitle)}
                disabled={saving}
                style={{ flex: 1, background: '#a855f7', color: 'white', border: 'none', padding: '7px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Check size={14} /> Aplicar título
              </button>
              <button
                onClick={() => setAiSuggestedTitle(null)}
                style={{ background: 'transparent', border: '1px solid rgba(168,85,247,0.3)', color: 'var(--text-secondary)', padding: '7px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <X size={14} /> Ignorar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
