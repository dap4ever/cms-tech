"use client";

import { useState } from 'react';
import { Check, Sparkles, Rocket } from 'lucide-react';
import styles from './SkillsModal.module.css';

const SKILL_OPTIONS = [
  { id: 'frontend',    label: 'Front-end',         description: 'HTML, CSS, React, Vue, Angular' },
  { id: 'backend',     label: 'Back-end',           description: 'Node.js, PHP, Python, Java, .NET' },
  { id: 'mysql',       label: 'MySQL',              description: 'Banco de dados relacional MySQL' },
  { id: 'mariadb',     label: 'MariaDB',            description: 'Banco de dados relacional MariaDB' },
  { id: 'postgresql',  label: 'PostgreSQL',         description: 'Banco de dados relacional PostgreSQL' },
  { id: 'ux_ui',       label: 'UX / UI',            description: 'Figma, prototipação, design systems' },
  { id: 'mobile',      label: 'Mobile',             description: 'React Native, Flutter, iOS, Android' },
  { id: 'qa',          label: 'QA / Testes',        description: 'Testes automatizados, Cypress, Jest' },
  { id: 'devops',      label: 'DevOps / Infra',     description: 'Docker, CI/CD, AWS, Linux' },
  { id: 'data',        label: 'Dados / BI',         description: 'Power BI, SQL avançado, ETL' },
];

interface SkillsModalProps {
  onComplete: (skills: string[]) => void;
}

export function SkillsModal({ onComplete }: SkillsModalProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const toggle = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const handleSave = async () => {
    if (selected.length === 0) return;
    setSaving(true);
    try {
      await fetch('/api/user/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skills: selected }),
      });
      onComplete(selected);
    } catch {
      alert('Erro ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <div className={styles.iconWrap}>
            <Sparkles size={28} />
          </div>
          <h2 className={styles.title}>Bem-vindo ao CMS Tech! 🎉</h2>
          <p className={styles.subtitle}>
            Selecione suas <strong>áreas de expertise</strong> para que o sistema possa sugerir as demandas
            mais adequadas ao seu perfil.
          </p>
        </div>

        <div className={styles.grid}>
          {SKILL_OPTIONS.map(skill => {
            const isSelected = selected.includes(skill.id);
            return (
              <button
                key={skill.id}
                className={`${styles.skillCard} ${isSelected ? styles.skillSelected : ''}`}
                onClick={() => toggle(skill.id)}
              >
                <div className={styles.checkCircle}>
                  {isSelected && <Check size={12} strokeWidth={3} />}
                </div>
                <span className={styles.skillLabel}>{skill.label}</span>
                <span className={styles.skillDesc}>{skill.description}</span>
              </button>
            );
          })}
        </div>

        <div className={styles.footer}>
          <span className={styles.counter}>{selected.length} selecionada{selected.length !== 1 ? 's' : ''}</span>
          <button
            className={styles.saveBtn}
            onClick={handleSave}
            disabled={selected.length === 0 || saving}
          >
            {saving
              ? 'Salvando...'
              : <><Rocket size={16} /> Começar a trabalhar</>}
          </button>
        </div>
      </div>
    </div>
  );
}
