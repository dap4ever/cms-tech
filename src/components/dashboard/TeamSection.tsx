'use client';

import React, { useState } from 'react';
import { 
  Users, 
  Calendar, 
  RefreshCcw, 
  UserPlus, 
  CalendarPlus,
  Trash2,
  Edit,
  ClipboardList,
  Clock,
  Briefcase
} from 'lucide-react';
import { useDashboardStore, TeamMember, Period } from '../../hooks/dashboard/useDashboardStore';
import styles from './dashboard-sections.module.css';

export function TeamSection() {
  const { team, periods, addTeamMember, updateTeamMember, deleteTeamMember, addPeriod, updatePeriod, deletePeriod, isLoaded } = useDashboardStore();
  const [activeTab, setActiveTab] = useState<'cron' | 'rev' | 'eq'>('cron');

  if (!isLoaded) return <div>Carregando equipe...</div>;

  const handleAddMember = () => {
    const nome = prompt('Nome do novo membro:');
    if (!nome) return;
    const newMember: TeamMember = {
      id: Date.now().toString(),
      name: nome,
      role: 'Desenvolvedor',
      color: '#7a6ab1',
      status: 'Trabalhando',
      turno: '09:00–18:00',
      cls: 'rb-pt'
    };
    addTeamMember(newMember);
  };

  const handleAddPeriod = () => {
    const title = prompt('Título do período (ex: Semana 12):');
    if (!title) return;
    const icon = prompt('Ícone (emoji):', '📅') || '📅';
    const newPeriod: Period = {
      id: Date.now(),
      icon,
      title,
      plantao: [],
      folga: [],
      notas: []
    };
    addPeriod(newPeriod);
  };

  const addNote = (periodId: number) => {
    const note = prompt('Nota de Passagem de Bastão:');
    if (!note) return;
    const p = periods.find(item => item.id === periodId);
    if (p) {
      updatePeriod({ ...p, notas: [...p.notas, note] });
    }
  };

  return (
    <div className={styles.sectionContainer}>
      <header className={styles.geHeader}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '8px' }}>
            <span style={{ color: 'var(--status-success)' }}>👥 Gestão</span> de Equipe
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Membros, turnos e cronograma de períodos especiais
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className={`${styles.button} ${styles.ghostButton}`} onClick={handleAddPeriod}>
             <CalendarPlus size={16} /> Período
          </button>
          <button className={`${styles.button} ${styles.primaryButton}`} style={{ background: 'var(--status-success)' }} onClick={handleAddMember}>
             <UserPlus size={16} /> Membro
          </button>
        </div>
      </header>

      <div className={styles.tabsContainer}>
        <button className={`${styles.tab} ${activeTab === 'cron' ? styles.activeTab : ''}`} onClick={() => setActiveTab('cron')}>
          <ClipboardList size={16} /> Cronograma
        </button>
        <button className={`${styles.tab} ${activeTab === 'rev' ? styles.activeTab : ''}`} onClick={() => setActiveTab('rev')}>
          <RefreshCcw size={16} /> Revezamento
        </button>
        <button className={`${styles.tab} ${activeTab === 'eq' ? styles.activeTab : ''}`} onClick={() => setActiveTab('eq')}>
          <Users size={16} /> Equipe
        </button>
      </div>

      <main>
        {activeTab === 'cron' && (
          <div className={styles.grid}>
            {periods.length === 0 ? (
               <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)', gridColumn: '1/-1' }}>
                 Nenhum período cadastrado.
               </div>
            ) : periods.map(p => (
              <div key={p.id} className={styles.card} style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', background: 'var(--bg-surface-hover)', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{p.icon} {p.title}</span>
                  <button className={styles.deleteBtn} onClick={() => deletePeriod(p.id)}><Trash2 size={14} /></button>
                </div>
                <div style={{ padding: '16px' }}>
                   <div className={styles.subSection}>
                      <label>👤 De Plantão</label>
                      <div className={styles.chipRow}>
                        {p.plantao.length ? p.plantao.map(m => <span key={m} className={styles.chip}>{m}</span>) : <span className={styles.emptyText}>Ninguém</span>}
                      </div>
                   </div>
                   <div className={styles.subSection}>
                      <label>🏖 De Folga</label>
                      <div className={styles.chipRow}>
                        {p.folga.length ? p.folga.map(m => <span key={m} className={styles.chip}>{m}</span>) : <span className={styles.emptyText}>Ninguém</span>}
                      </div>
                   </div>
                   <div className={styles.notesSection}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>📋 Passagem de Bastão</span>
                        <button className={styles.addNoteBtn} onClick={() => addNote(p.id)}>+ Nota</button>
                      </div>
                      {p.notas.map((n, i) => (
                        <div key={i} className={styles.noteItem}>
                          {n}
                          <button className={styles.noteDelete} onClick={() => {
                            const newNotas = p.notas.filter((_, idx) => idx !== i);
                            updatePeriod({ ...p, notas: newNotas });
                          }}>&times;</button>
                        </div>
                      ))}
                      {!p.notas.length && <div className={styles.emptyNotes}>Nenhuma nota registrada</div>}
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'rev' && (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Colaborador</th>
                  <th>Cargo</th>
                  <th>Turno</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {team.map(m => (
                  <tr key={m.id}>
                    <td><div style={{ fontWeight: 700 }}>{m.name}</div></td>
                    <td>{m.role}</td>
                    <td><div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} /> {m.turno}</div></td>
                    <td><span className={`${styles.statusBadge} ${getStatusClass(m.status)}`}>{m.status}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className={styles.iconBtn} onClick={() => deleteTeamMember(m.id)}><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'eq' && (
          <div className={styles.grid}>
             {team.map(m => (
               <div key={m.id} className={styles.card} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', textAlign: 'center' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.2rem', color: 'white' }}>
                    {m.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ fontWeight: 700 }}>{m.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{m.role}</div>
                  <span className={`${styles.statusBadge} ${getStatusClass(m.status)}`}>{m.status}</span>
                  <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
                    <button className={styles.iconBtn}><Edit size={14} /></button>
                    <button className={styles.iconBtn} onClick={() => deleteTeamMember(m.id)}><Trash2 size={14} /></button>
                  </div>
               </div>
             ))}
          </div>
        )}
      </main>

      <style jsx>{`
        .geHeader { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
        .tabsContainer { display: flex; background: var(--bg-main); border: 1px solid var(--border-color); padding: 4px; border-radius: 50px; width: fit-content; margin-bottom: 32px; gap: 4px; }
        .tab { padding: 8px 16px; border-radius: 50px; font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); display: flex; align-items: center; gap: 8px; transition: all 0.2s; }
        .activeTab { background: var(--status-success); color: white; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2); }
        .subSection { margin-bottom: 16px; }
        .subSection label { display: block; font-size: 0.65rem; font-weight: 800; text-transform: uppercase; color: var(--text-secondary); letter-spacing: 0.1em; margin-bottom: 8px; }
        .chipRow { display: flex; flex-wrap: wrap; gap: 6px; }
        .chip { background: var(--bg-main); border: 1px solid var(--border-color); padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; color: var(--text-primary); }
        .emptyText { font-size: 0.75rem; color: var(--text-secondary); font-style: italic; }
        .notesSection { border-top: 1px solid var(--border-color); padding-top: 12px; }
        .addNoteBtn { font-size: 0.75rem; font-weight: 700; color: var(--status-success); }
        .noteItem { background: var(--bg-main); padding: 8px 12px; border-radius: 8px; font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 6px; border-left: 3px solid var(--status-success); display: flex; justify-content: space-between; }
        .noteDelete { color: var(--status-error); opacity: 0.6; }
        .noteDelete:hover { opacity: 1; }
        .emptyNotes { font-size: 0.75rem; color: var(--text-secondary); text-align: center; padding: 12px; border: 1px dashed var(--border-color); border-radius: 8px; }
        .tableWrapper { border: 1px solid var(--border-color); border-radius: var(--radius-lg); overflow: hidden; }
        .table { width: 100%; border-collapse: collapse; font-size: 0.9rem; text-align: left; }
        .table th { background: var(--bg-surface-hover); padding: 12px 16px; font-size: 0.7rem; font-weight: 800; color: var(--text-secondary); text-transform: uppercase; }
        .table td { padding: 12px 16px; border-bottom: 1px solid var(--border-color); vertical-align: middle; }
        .statusBadge { padding: 2px 8px; border-radius: 50px; font-size: 0.7rem; font-weight: 700; }
        .deleteBtn { color: var(--status-error); opacity: 0.5; }
        .deleteBtn:hover { opacity: 1; }
        .iconBtn { padding: 6px; border: 1px solid var(--border-color); border-radius: 8px; color: var(--text-secondary); }
        .iconBtn:hover { border-color: var(--text-secondary); color: var(--text-primary); }
        .ghostButton { border: 1px solid var(--border-color); color: var(--text-secondary); }
        .ghostButton:hover { border-color: var(--text-primary); color: var(--text-primary); }
      `}</style>
    </div>
  );
}

function getStatusClass(s: string) {
  const map: Record<string, string> = {
    'Trabalhando': 'bg-emerald-500/10 text-emerald-400',
    'Folga': 'bg-amber-500/10 text-amber-400',
    'Férias': 'bg-rose-500/10 text-rose-400',
    'Licença': 'bg-sky-500/10 text-sky-400'
  };
  return map[s] || 'bg-gray-500/10 text-gray-400';
}
