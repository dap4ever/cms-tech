'use client';
import { useState } from 'react';
import { Check, Edit2 } from 'lucide-react';
import styles from '@/app/taskrow/task/[id]/task.module.css';

export function TaskTitleEditor({ taskId, defaultTitle, originalTitle }: { taskId: string, defaultTitle: string, originalTitle: string }) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(defaultTitle);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/tasks/assignments/title', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, title })
      });
      if (res.ok) {
        setIsEditing(false);
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
          <button onClick={handleSave} disabled={saving} style={{ background: 'var(--accent-primary)', color: 'white', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}>
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
    </div>
  );
}
