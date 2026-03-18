'use client';

import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Trash2, 
  Plus, 
  ArrowRight,
  Printer,
  ChevronRight,
  Info
} from 'lucide-react';
import styles from './dashboard-sections.module.css';

interface ReportTask {
  id: number;
  proj: string;
  title: string;
  desc: string;
  dur: string;
}

interface ReportStep {
  id: number;
  proj: string;
  desc: string;
}

const CLIENT_CONFIGS: Record<string, any> = {
  abrafati: { name: 'Abrafati', fee: 'Fee Mensal - Abrafati', domains: 'abrafati.com.br | tintadequalidade.com.br', area: 'Área Tech | F2F', projs: ['ABRAFATI', 'TINTA DE QUALIDADE'] },
  glp: { name: 'GLP', fee: 'Fee Mensal - GLP', domains: 'glp.com.br', area: 'Área Tech | F2F', projs: ['GLP'] }
};

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export function ReportingSection() {
  const [activeClient, setActiveClient] = useState('abrafati');
  const [month, setMonth] = useState(MONTHS[new Date().getMonth()]);
  const [year, setYear] = useState('2026');
  const [tasks, setTasks] = useState<ReportTask[]>([]);
  const [steps, setSteps] = useState<ReportStep[]>([]);
  
  const clientConfig = CLIENT_CONFIGS[activeClient];

  const addTask = () => {
    setTasks([...tasks, { id: Date.now(), proj: clientConfig.projs[0], title: '', desc: '', dur: '' }]);
  };

  const addStep = () => {
    setSteps([...steps, { id: Date.now(), proj: clientConfig.projs[0], desc: '' }]);
  };

  const handleDownload = () => {
    // Ported logic from HTML rbuildHTML would go here
    // For now, let's just trigger a toast or alert
    alert('Relatório gerado com sucesso! (Funcionalidade de download sendo finalizada)');
  };

  return (
    <div className={styles.sectionContainer}>
      <header style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '8px' }}>
          <span style={{ color: 'var(--status-warning)' }}>📄 Relatórios</span> Mensais
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Gere relatórios em HTML prontos para salvar como PDF
        </p>
      </header>

      <div className={styles.tabsContainer}>
        {Object.keys(CLIENT_CONFIGS).map(k => (
          <button 
            key={k} 
            className={`${styles.tab} ${activeClient === k ? styles.activeTab : ''}`}
            onClick={() => setActiveClient(k)}
          >
            {CLIENT_CONFIGS[k].name}
          </button>
        ))}
      </div>

      <div className={styles.card}>
        <h3 className={styles.subTitle}>📋 Cabeçalho</h3>
        <div className={styles.formGrid}>
           <div className={styles.field}>
              <label>Área</label>
              <input className={styles.input} defaultValue={clientConfig.area} />
           </div>
           <div className={styles.field}>
              <label>Domínios</label>
              <input className={styles.input} defaultValue={clientConfig.domains} />
           </div>
           <div className={styles.field}>
              <label>Mês</label>
              <select className={styles.input} value={month} onChange={e => setMonth(e.target.value)}>
                {MONTHS.map(m => <option key={m}>{m}</option>)}
              </select>
           </div>
           <div className={styles.field}>
              <label>Ano</label>
              <select className={styles.input} value={year} onChange={e => setYear(e.target.value)}>
                {['2024', '2025', '2026', '2027'].map(y => <option key={y}>{y}</option>)}
              </select>
           </div>
        </div>
      </div>

      <div className={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 className={styles.subTitle}>✅ Atividades ({tasks.length})</h3>
          <button className={styles.addBtn} onClick={addTask}>+ Atividade</button>
        </div>
        <div className={styles.tasksList}>
          {tasks.map((t, i) => (
            <div key={t.id} className={styles.reportTaskItem}>
               <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <select className={styles.input} style={{ width: '120px' }}>
                    {clientConfig.projs.map((p: string) => <option key={p}>{p}</option>)}
                    <option>OUTRO</option>
                  </select>
                  <input className={styles.input} style={{ flex: 1 }} placeholder="Título da tarefa..." />
                  <button className={styles.deleteBtn} onClick={() => setTasks(tasks.filter(item => item.id !== t.id))}>
                    <Trash2 size={16} />
                  </button>
               </div>
               <textarea className={styles.input} style={{ width: '100%', marginBottom: '8px' }} placeholder="Descrição detalhada..." rows={2} />
               <div style={{ width: '120px' }}>
                  <label style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-secondary)' }}>Duração</label>
                  <input className={styles.input} placeholder="Ex: 4h" />
               </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 className={styles.subTitle}>🔜 Próximos Passos ({steps.length})</h3>
          <button className={styles.addBtn} onClick={addStep}>+ Próximo Passo</button>
        </div>
        <div className={styles.tasksList}>
          {steps.map(s => (
            <div key={s.id} style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
               <select className={styles.input} style={{ width: '120px' }}>
                  {clientConfig.projs.map((p: string) => <option key={p}>{p}</option>)}
               </select>
               <input className={styles.input} style={{ flex: 1 }} placeholder="Descreva o próximo passo..." />
               <button className={styles.deleteBtn} onClick={() => setSteps(steps.filter(item => item.id !== s.id))}>
                  <Trash2 size={16} />
               </button>
            </div>
          ))}
        </div>
      </div>

      <footer className={styles.stickyFooter}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
          <Info size={14} />
          <span>O relatório será gerado em HTML para impressão como PDF.</span>
        </div>
        <button className={`${styles.button} ${styles.primaryButton}`} style={{ background: 'var(--status-warning)', color: 'black' }} onClick={handleDownload}>
           <Download size={18} /> Baixar Relatório
        </button>
      </footer>

      <style jsx>{`
        .subTitle { font-size: 0.85rem; font-weight: 800; color: var(--text-primary); text-transform: uppercase; letter-spacing: 0.1em; }
        .formGrid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-top: 16px; }
        .field { display: flex; flex-direction: column; gap: 4px; }
        .field label { font-size: 0.7rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; }
        .addBtn { font-size: 0.8rem; font-weight: 700; color: var(--status-warning); border: 1.5px dashed var(--border-color); padding: 4px 12px; border-radius: 8px; }
        .reportTaskItem { border: 1px solid var(--border-color); padding: 12px; border-radius: 8px; background: var(--bg-main); margin-bottom: 12px; }
        .deleteBtn { color: var(--status-error); opacity: 0.6; }
        .deleteBtn:hover { opacity: 1; }
        .stickyFooter { position: sticky; bottom: 0; background: rgba(9, 9, 11, 0.9); backdrop-filter: blur(8px); padding: 16px 0; border-top: 1px solid var(--border-color); display: flex; align-items: center; justify-content: flex-end; z-index: 10; margin-top: 40px; }
        .activeTab { background: var(--status-warning) !important; color: black !important; }
      `}</style>
    </div>
  );
}
