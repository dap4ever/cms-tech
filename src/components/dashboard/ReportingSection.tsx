'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Plus, 
  Trash2, 
  ChevronRight,
  Target,
  FileSearch,
  Calendar,
  Layers,
  Clock,
  Zap,
  RefreshCcw
} from 'lucide-react';
import { useDashboardStore } from '../../hooks/dashboard/useDashboardStore';
import styles from './dashboard-premium.module.css';

// --- Types & Constants ---
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

interface ReportData {
  month: string;
  year: string;
  domains: string;
  area: string;
  fee: string;
  tasks: ReportTask[];
  steps: ReportStep[];
}

const RMO = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const YEARS = ['2024', '2025', '2026', '2027'];

// --- Helper Functions ---
function parseDuration(s: string): number {
  if (!s) return 0;
  const clean = s.replace(/\s/g, '').toLowerCase();
  const hm = clean.match(/^(\d+)h(\d+)(min)?$/);
  if (hm) return parseInt(hm[1]) * 60 + parseInt(hm[2]);
  const hOnly = clean.match(/^(\d+)h$/);
  if (hOnly) return parseInt(hOnly[1]) * 60;
  const mOnly = clean.match(/^(\d+)min$/);
  if (mOnly) return parseInt(mOnly[1]);
  return 0;
}

function formatDuration(m: number): string {
  if (!m) return '0h';
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return mm ? `${h}h${mm.toString().padStart(2, '0')}min` : `${h}h`;
}

// --- Component ---
export function ReportingSection() {
  const { clients, isLoaded } = useDashboardStore();
  const [activeClientIdx, setActiveClientIdx] = useState(0);
  const [report, setReport] = useState<ReportData | null>(null);

  const client = clients[activeClientIdx];

  // Load report data from localStorage
  useEffect(() => {
    if (!client) return;
    const key = `dash-report-${client.id}`;
    const cached = localStorage.getItem(key);
    if (cached) {
      setReport(JSON.parse(cached));
    } else {
      const initial: ReportData = {
        month: RMO[new Date().getMonth()] || RMO[0],
        year: String(new Date().getFullYear()),
        domains: 'exemplo.com.br',
        area: 'Área Tech | F2F',
        fee: `Fee Mensal - ${client?.name || ''}`,
        tasks: [],
        steps: []
      };
      setReport(initial);
    }
  }, [client]);

  // Save report data
  const saveReport = (data: ReportData) => {
    if (!client?.id) return;
    setReport(data);
    localStorage.setItem(`dash-report-${client.id}`, JSON.stringify(data));
  };

  if (!isLoaded || !client || !client.id || !report) return <div className={styles.premiumContainer}>Carregando motor de relatórios...</div>;

  const totalMinutes = (report?.tasks || []).reduce((acc, t) => acc + parseDuration(t.dur), 0);
  
  const projects = [(client?.id || '').toUpperCase(), 'OUTRO'];
  const projectTotals = (report?.tasks || []).reduce((acc, t) => {
    const p = t.proj || 'Geral';
    acc[p] = (acc[p] || 0) + parseDuration(t.dur);
    return acc;
  }, {} as Record<string, number>);

  const handleDownload = () => {
    if (!client || !report) return;
    const html = buildProfessionalHTML(client, report);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    // Abrir em nova aba e disparar impressão
    const win = window.open(url, '_blank');
    if (win) {
       win.focus();
    }
  };

  return (
    <div className={`${styles.premiumContainer} ${styles.qcGrid}`}>
      <aside className={styles.sidebar}>
        <div style={{ padding: '0 8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
           <FileSearch size={16} color="var(--status-warning)" />
           <span style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.1em' }}>Relatórios Profissionais</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {clients.map((c, i) => (
            <div 
              key={c?.id || i} 
              className={`${styles.clientItem} ${i === activeClientIdx ? styles.activeClient : ''}`} 
              onClick={() => setActiveClientIdx(i)}
            >
              {c && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                   <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: c.color, fontSize: '0.6rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>{c.id}</div>
                   <span style={{ fontSize: '0.85rem', fontWeight: i === activeClientIdx ? 700 : 500 }}>{c.name}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </aside>

      <main>
        <div className={styles.glassCard} style={{ padding: '24px' }}>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
             <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: client.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900 }}>{client.id}</div>
                <div>
                   <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>{client.name}</h2>
                   <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Configure o relatório mensal para exportação</p>
                </div>
             </div>
             <button className={styles.premiumButton} onClick={handleDownload} style={{ background: 'linear-gradient(135deg, var(--status-warning), #d97706)' }}>
                <FileText size={18} /> GERAR PDF PROFISSIONAL
             </button>
          </header>

          {/* Cabeçalho Editor */}
          <section className={styles.glassCard} style={{ padding: '20px', marginBottom: '24px', background: 'rgba(255,255,255,0.02)' }}>
             <h3 style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--status-warning)', marginBottom: '16px', letterSpacing: '0.1em' }}>📋 Cabeçalho do Documento</h3>
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className={styles.inputGroup}>
                   <label>Título do Fee</label>
                   <input className={styles.premiumInput} value={report.fee} onChange={e => saveReport({ ...report, fee: e.target.value })} />
                </div>
                <div className={styles.inputGroup}>
                   <label>Área Responsável</label>
                   <input className={styles.premiumInput} value={report.area} onChange={e => saveReport({ ...report, area: e.target.value })} />
                </div>
                <div className={styles.inputGroup}>
                   <label>Domínios Atendidos</label>
                   <input className={styles.premiumInput} value={report.domains} onChange={e => saveReport({ ...report, domains: e.target.value })} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                   <div className={styles.inputGroup}>
                      <label>Mês</label>
                      <select className={styles.premiumInput} value={report.month} onChange={e => saveReport({ ...report, month: e.target.value })}>
                         {RMO.map(m => <option key={m}>{m}</option>)}
                      </select>
                   </div>
                   <div className={styles.inputGroup}>
                      <label>Ano</label>
                      <select className={styles.premiumInput} value={report.year} onChange={e => saveReport({ ...report, year: e.target.value })}>
                         {YEARS.map(y => <option key={y}>{y}</option>)}
                      </select>
                   </div>
                </div>
             </div>
          </section>

          {/* Atividades Editor */}
          <section style={{ marginBottom: '24px' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--accent-secondary)', letterSpacing: '0.1em' }}>✅ Atividades Realizadas ({report.tasks.length})</h3>
                <button className={styles.textBtn} onClick={() => report && client?.id && saveReport({ ...report, tasks: [...report.tasks, { id: Date.now(), proj: client.id.toUpperCase(), title: '', desc: '', dur: '' }] })} style={{ color: 'var(--accent-secondary)', fontWeight: 800, fontSize: '0.75rem' }}>+ ADICIONAR ATIVIDADE</button>
             </div>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {report.tasks.map((task, idx) => (
                   <div key={task.id} className={styles.glassCard} style={{ padding: '16px', background: 'rgba(255,255,255,0.01)' }}>
                      <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                         <select 
                            className={styles.premiumInput} 
                            style={{ width: '140px', fontSize: '0.75rem', fontWeight: 800 }}
                            value={task.proj}
                            onChange={e => {
                               const newTasks = [...report.tasks];
                               newTasks[idx].proj = e.target.value;
                               saveReport({ ...report, tasks: newTasks });
                            }}
                         >
                            {projects.map(p => <option key={p}>{p}</option>)}
                         </select>
                         <input 
                            className={styles.premiumInput} 
                            style={{ flex: 1, fontWeight: 700 }}
                            placeholder="Título da atividade..."
                            value={task.title}
                            onChange={e => {
                               const newTasks = [...report.tasks];
                               newTasks[idx].title = e.target.value;
                               saveReport({ ...report, tasks: newTasks });
                            }}
                         />
                         <button className={styles.iconBtn} onClick={() => {
                            const newTasks = report.tasks.filter(t => t.id !== task.id);
                            saveReport({ ...report, tasks: newTasks });
                         }}><Trash2 size={16} /></button>
                      </div>
                      <textarea 
                         className={styles.premiumInput} 
                         style={{ width: '100%', minHeight: '60px', marginBottom: '12px', fontSize: '0.85rem' }}
                         placeholder="Descrição detalhada..."
                         value={task.desc}
                         onChange={e => {
                            const newTasks = [...report.tasks];
                            newTasks[idx].desc = e.target.value;
                            saveReport({ ...report, tasks: newTasks });
                         }}
                      />
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                         <Clock size={14} color="var(--text-secondary)" />
                         <input 
                            className={styles.premiumInput} 
                            style={{ width: '100px', fontSize: '0.75rem' }}
                            placeholder="Ex: 2h 30min"
                            value={task.dur}
                            onChange={e => {
                               const newTasks = [...report.tasks];
                               newTasks[idx].dur = e.target.value;
                               saveReport({ ...report, tasks: newTasks });
                            }}
                         />
                      </div>
                   </div>
                ))}
             </div>
             
             {/* Totais Chips */}
             {report.tasks.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '16px' }}>
                   {Object.entries(projectTotals).map(([p, m]) => (
                      <div key={p} style={{ padding: '6px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', fontSize: '0.7rem' }}>
                         <span style={{ color: 'var(--text-secondary)', marginRight: '8px' }}>{p}</span>
                         <span style={{ fontWeight: 800 }}>{formatDuration(m)}</span>
                      </div>
                   ))}
                   <div style={{ padding: '6px 12px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-primary)', fontSize: '0.7rem', border: '1px solid rgba(99,102,241,0.2)' }}>
                         <span style={{ marginRight: '8px' }}>TOTAL</span>
                         <span style={{ fontWeight: 900 }}>{formatDuration(totalMinutes)}</span>
                   </div>
                </div>
             )}
          </section>

          {/* Próximos Passos Editor */}
          <section>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--status-success)', letterSpacing: '0.1em' }}>🔜 Próximos Passos ({report.steps.length})</h3>
                <button className={styles.textBtn} onClick={() => report && client?.id && saveReport({ ...report, steps: [...report.steps, { id: Date.now(), proj: client.id.toUpperCase(), desc: '' }] })} style={{ color: 'var(--status-success)', fontWeight: 800, fontSize: '0.75rem' }}>+ ADICIONAR PASO</button>
             </div>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {report.steps.map((step, idx) => (
                   <div key={step.id} style={{ display: 'flex', gap: '12px' }}>
                      <select 
                         className={styles.premiumInput} 
                         style={{ width: '120px', fontSize: '0.75rem' }}
                         value={step.proj}
                         onChange={e => {
                            const newSteps = [...report.steps];
                            newSteps[idx].proj = e.target.value;
                            saveReport({ ...report, steps: newSteps });
                         }}
                      >
                         {projects.map(p => <option key={p}>{p}</option>)}
                      </select>
                      <input 
                         className={styles.premiumInput} 
                         style={{ flex: 1 }}
                         placeholder="Descreva o próximo passo..."
                         value={step.desc}
                         onChange={e => {
                            const newSteps = [...report.steps];
                            newSteps[idx].desc = e.target.value;
                            saveReport({ ...report, steps: newSteps });
                         }}
                      />
                      <button className={styles.iconBtn} onClick={() => {
                         const newSteps = report.steps.filter(s => s.id !== step.id);
                         saveReport({ ...report, steps: newSteps });
                      }}><Trash2 size={16} /></button>
                   </div>
                ))}
             </div>
          </section>

          <footer style={{ marginTop: '40px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'right' }}>
             <button className={styles.textBtn} onClick={() => {
                if (confirm('Deseja resetar todos os dados deste relatório?')) {
                   const now = new Date();
                   saveReport({
                      month: RMO[now.getMonth()],
                      year: String(now.getFullYear()),
                      domains: '',
                      area: 'Área Tech | F2F',
                      fee: `Fee Mensal - ${client.name}`,
                      tasks: [],
                      steps: []
                   });
                }
             }} style={{ color: 'var(--status-error)', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
                <RefreshCcw size={12} /> LIMPAR TUDO
             </button>
          </footer>
        </div>
      </main>
      
      <style jsx>{`
         .inputGroup { display: flex; flex-direction: column; gap: 6px; }
         .inputGroup label { font-size: 0.65rem; font-weight: 800; color: var(--text-secondary); text-transform: uppercase; }
         .iconBtn { background: transparent; border: none; cursor: pointer; color: var(--text-secondary); opacity: 0.5; transition: all 0.2s; }
         .iconBtn:hover { opacity: 1; color: var(--status-error); }
         .textBtn { background: transparent; border: none; cursor: pointer; }
      `}</style>
    </div>
  );
}

// --- Professional HTML Generator ---
function buildProfessionalHTML(client: any, report: ReportData) {
  const LOGO_URL = 'https://agenciaf2f.com/wp-content/themes/agenciaf2f/assets/images/logos/logo.png';
  const totalMinutes = report.tasks.reduce((acc, t) => acc + parseDuration(t.dur), 0);
  
  const projectTotals = report.tasks.reduce((acc, t) => {
    const p = t.proj || 'Geral';
    acc[p] = (acc[p] || 0) + parseDuration(t.dur);
    return acc;
  }, {} as Record<string, number>);

  const tasksHTML = report.tasks.map((t, idx) => `
    <div class="tb ${idx < report.tasks.length - 1 ? 'tsep' : ''}">
      <div class="th">
        <span class="ttag">${t.proj}</span>
        <span class="tname">${t.title || '(sem título)'}</span>
      </div>
      ${t.desc ? `<div class="tdesc">${t.desc.replace(/\n/g, '<br>')}</div>` : ''}
      ${t.dur ? `<div class="tdur"><span class="dot"></span>Duração: <strong>${t.dur}</strong></div>` : ''}
    </div>
  `).join('');

  const summaryRows = Object.entries(projectTotals).map(([p, m]) => `
    <tr><td>${p}</td><td class="ri">${formatDuration(m)}</td></tr>
  `).join('') + `
    <tr class="tr"><td>TOTAL</td><td class="ri">${formatDuration(totalMinutes)}</td></tr>
  `;

  const stepsHTML = report.steps.map(st => `
    <div class="sb">
      <div class="sd"></div>
      <div>
        <div class="stag">${st.proj}</div>
        <div class="stxt">${st.desc || '(sem descrição)'}</div>
      </div>
    </div>
  `).join('');

  const css = `
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Poppins', "Segoe UI", Arial, sans-serif; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .pb2 { text-align: center; padding: 24px; background: #f5f0ff; border-bottom: 2px solid #d4c8f0; }
    .pb2 button { background: #5a00a8; color: #fff; border: none; border-radius: 10px; padding: 12px 32px; font-size: 15px; font-weight: 700; cursor: pointer; }
    .pb2 p { margin-top: 8px; font-size: 12px; color: #7c5fa8; }
    @media print { .pb2 { display: none; } }
    .cv { width: 210mm; min-height: 297mm; background: #f5f0ff; position: relative; overflow: hidden; display: flex; flex-direction: column; page-break-after: always; }
    .b1 { position: absolute; bottom: -100px; right: -100px; width: 480px; height: 480px; border-radius: 50%; background: rgba(90, 0, 168, 0.09); }
    .b2 { position: absolute; top: -80px; left: -80px; width: 340px; height: 340px; border-radius: 50%; background: rgba(90, 0, 168, 0.06); }
    .ci { position: relative; z-index: 1; padding: 64px 60px; display: flex; flex-direction: column; min-height: 297mm; }
    .clo { height: 52px; margin-bottom: 56px; }
    .clo img { height: 52px; width: auto; }
    .ce { font-size: 11px; font-weight: 600; color: #9980c8; text-transform: uppercase; letter-spacing: 0.14em; margin-bottom: 14px; }
    .ct { font-size: 44px; font-weight: 800; color: #5a00a8; line-height: 1.06; margin-bottom: 12px; }
    .cs { font-size: 22px; font-weight: 600; color: #1a0035; margin-bottom: 52px; }
    .cd { width: 56px; height: 5px; background: #5a00a8; border-radius: 3px; margin-bottom: 44px; }
    .cm { display: flex; flex-direction: column; gap: 12px; }
    .cr { display: flex; align-items: baseline; gap: 12px; }
    .ck { font-size: 11px; font-weight: 600; color: #9980c8; text-transform: uppercase; letter-spacing: 0.08em; min-width: 80px; }
    .cv2 { font-size: 14px; font-weight: 500; color: #1a0035; }
    .cf { margin-top: auto; padding-top: 40px; border-top: 1.5px solid #d4c8f0; display: flex; justify-content: space-between; align-items: center; }
    .cf img { height: 28px; width: auto; }
    .cpe { font-size: 18px; font-weight: 700; color: #5a00a8; }
    .pg { width: 210mm; min-height: 297mm; display: flex; flex-direction: column; page-break-after: always; }
    .ph { background: #5a00a8; padding: 30px 52px 24px; display: flex; align-items: center; justify-content: space-between; }
    .phl h2 { font-size: 19px; font-weight: 700; color: #fff; }
    .phl p { font-size: 12px; color: #c8a8f0; margin-top: 3px; }
    .phi { height: 32px; width: auto; }
    .pbd { padding: 32px 52px; flex: 1; }
    .sc { font-size: 11px; font-weight: 700; color: #9980c8; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid #ede8ff; }
    .in { font-size: 13px; color: #4a3566; line-height: 1.75; margin-bottom: 24px; }
    .tb { padding: 14px 0; }
    .tsep { border-bottom: 1px dashed #e8e0f5; }
    .th { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 7px; flex-wrap: wrap; }
    .ttag { display: inline-block; background: #f0ebff; color: #5a00a8; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; padding: 3px 10px; border-radius: 5px; white-space: nowrap; flex-shrink: 0; margin-top: 2px; }
    .tname { font-size: 14px; font-weight: 600; color: #1a0035; line-height: 1.4; }
    .tdesc { font-size: 13px; color: #4a3566; line-height: 1.7; margin: 8px 0; padding: 10px 14px; background: #faf8ff; border-left: 3px solid #d4c8f0; border-radius: 0 6px 6px 0; }
    .tdur { display: flex; align-items: center; gap: 7px; font-size: 12px; color: #5a00a8; font-weight: 500; margin-top: 8px; }
    .dot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: #5a00a8; flex-shrink: 0; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #5a00a8; color: #fff; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.07em; padding: 11px 16px; text-align: left; }
    td { padding: 11px 16px; font-size: 13px; color: #1a0035; border-bottom: 1px solid #f0eaff; }
    .ri { text-align: right; font-weight: 600; }
    .tr td { font-weight: 700; color: #5a00a8; background: #f5f0ff; }
    .sb { display: flex; gap: 13px; align-items: flex-start; padding: 12px 0; border-bottom: 1px dashed #e8e0f5; }
    .sd { width: 8px; height: 8px; border-radius: 50%; background: #5a00a8; flex-shrink: 0; margin-top: 5px; }
    .stag { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #9980c8; margin-bottom: 3px; }
    .stxt { font-size: 13px; color: #1a0035; line-height: 1.65; }
    .pft { padding: 14px 52px; border-top: 1px solid #f0eaff; display: flex; justify-content: space-between; align-items: center; }
    .pfl { font-size: 11px; color: #b8a8d8; }
    .pfr img { height: 22px; width: auto; }
  `;

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Relatório ${client.name} — ${report.month} ${report.year}</title>
      <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet">
      <style>${css}</style>
    </head>
    <body>
      <div class="pb2">
        <button onclick="window.print()">Imprimir / Salvar como PDF</button>
        <p>No diálogo de impressão, selecione <strong>"Salvar como PDF"</strong></p>
      </div>

      <div class="cv">
        <div class="b1"></div>
        <div class="b2"></div>
        <div class="ci">
          <div class="clo"><img src="${LOGO_URL}" alt="F2F"></div>
          <div class="ce">Relatório de Atividades</div>
          <div class="ct">Relatório<br>de Atividades</div>
          <div class="cs">${report.fee}</div>
          <div class="cd"></div>
          <div class="cm">
            <div class="cr"><span class="ck">Cliente</span><span class="cv2">${client.name}</span></div>
            <div class="cr"><span class="ck">Domínios</span><span class="cv2">${report.domains}</span></div>
            <div class="cr"><span class="ck">Área</span><span class="cv2">${report.area}</span></div>
          </div>
          <div class="cf">
            <div class="cpe">${report.month} | ${report.year}</div>
            <img src="${LOGO_URL}" alt="F2F">
          </div>
        </div>
      </div>

      <div class="pg">
        <div class="ph">
          <div class="phl">
            <h2>1. Relatório de Atividades</h2>
            <p>${client.name} | ${report.month} ${report.year}</p>
          </div>
          <img class="phi" src="${LOGO_URL}" alt="F2F">
        </div>
        <div class="pbd">
          <p class="in">Tarefas realizadas em ${report.month.toLowerCase()} — ${report.domains}:</p>
          ${report.tasks.length ? tasksHTML + `<p class="in" style="margin-top:20px">Total: <strong>${formatDuration(totalMinutes)}</strong></p>` : '<p class="in" style="color:#9980c8;font-style:italic">Nenhuma atividade registrada.</p>'}
        </div>
        <div class="pft">
          <span class="pfl">${report.month} ${report.year} — ${client.name}</span>
          <div class="pfr"><img src="${LOGO_URL}" alt="F2F"></div>
        </div>
      </div>

      <div class="pg">
        <div class="ph">
          <div class="phl">
            <h2>Resumo & Próximos Passos</h2>
            <p>${client.name} | ${report.month} ${report.year}</p>
          </div>
          <img class="phi" src="${LOGO_URL}" alt="F2F">
        </div>
        <div class="pbd">
          ${report.tasks.length ? `
            <div class="sc">Demandas — ${report.month}</div>
            <table style="margin-bottom:32px">
              <thead>
                <tr>
                  <th>Demandas</th>
                  <th class="ri">Duração</th>
                </tr>
              </thead>
              <tbody>
                ${summaryRows}
              </tbody>
            </table>
          ` : ''}
          <div class="sc">2. Próximos Passos</div>
          ${report.steps.length ? stepsHTML : '<p class="in" style="color:#9980c8;font-style:italic">Nenhum próximo passo registrado.</p>'}
        </div>
        <div class="pft">
          <span class="pfl">${report.month} ${report.year} — ${client.name}</span>
          <div class="pfr"><img src="${LOGO_URL}" alt="F2F"></div>
      </div>
      <script>
        window.onload = () => {
          setTimeout(() => {
            window.print();
          }, 500);
        };
      </script>
    </body>
    </html>
  `;
}
