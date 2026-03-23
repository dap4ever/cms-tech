'use client';

import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Calendar, 
  RefreshCcw, 
  UserPlus, 
  Trash2,
  Edit,
  ClipboardList,
  Clock,
  ChevronRight,
  MessageSquare,
  AlertCircle,
  CalendarDays,
  UserCheck
} from 'lucide-react';
import { useDashboardStore, TeamMember, Period, Absence } from '../../hooks/dashboard/useDashboardStore';
import { getUsers } from '@/actions/users';
import { useAuth } from '@/context/AuthContext';
import styles from './dashboard-premium.module.css';

// --- Constants ---
const MONTHS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

// --- Component ---
export function TeamSection() {
  const { user } = useAuth();
  const { 
    team, 
    periods, 
    addTeamMember, 
    updateTeamMember, 
    deleteTeamMember, 
    addPeriod, 
    updatePeriod, 
    deletePeriod, 
    isLoaded 
  } = useDashboardStore();

  const [activeTab, setActiveTab] = useState<'cron' | 'rev' | 'eq'>('eq');
  const [showAbsenceModal, setShowAbsenceModal] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [dbUsers, setDbUsers] = useState<any[]>([]);

  // Sync DB Users with Team Store
  React.useEffect(() => {
    async function sync() {
      const users = await getUsers();
      setDbUsers(users);
      
      // Auto-populate team if member from DB doesn't exist locally
      users.forEach((u: any) => {
        const exists = team.find(m => m.id === u.id);
        if (!exists) {
           addTeamMember({
              id: u.id,
              name: u.name,
              role: (u as any).roles?.[0] || 'Equipe',
              color: '#7c3aed',
              status: 'Disponível',
              turno: '09:00 - 18:00',
              cls: 'p-purple',
              absences: []
           });
        }
      });

      // Optional: Cleanup members that are no longer in DB
      team.forEach(m => {
        const inDb = users.find((u: any) => u.id === m.id);
        if (!inDb) deleteTeamMember(m.id);
      });
    }
    if (isLoaded) sync();
  }, [isLoaded, team.length]);

  // --- Helpers ---
  const isMemberAbsent = (member: TeamMember) => {
    const today = new Date();
    return (member.absences || []).some(a => {
      const start = new Date(a.start);
      const end = new Date(a.end);
      return today >= start && today <= end;
    });
  };

  const getMonthAbsence = (member: TeamMember, monthIdx: number) => {
    const year = 2026; // Current simulation year
    return (member.absences || []).some(a => {
      const startDate = new Date(a.start);
      return startDate.getMonth() === monthIdx && startDate.getFullYear() === year;
    });
  };

  const isAdmin = user?.roles?.includes('GESTOR') || user?.roles?.includes('ADMINISTRADOR');

  if (!isLoaded) return <div>Carregando ativos da equipe...</div>;

  // --- Handlers ---
  const handleRegisterAbsence = (memberId: string) => {
    if (!isAdmin) return;
    setSelectedMemberId(memberId);
    setShowAbsenceModal(true);
  };

  const submitAbsence = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const start = fd.get('start') as string;
    const end = fd.get('end') as string;
    const type = fd.get('type') as string;

    if (!selectedMemberId || !start || !end) return;

    const member = team.find(m => m.id === selectedMemberId);
    if (member) {
      const newAbsence: Absence = { id: Date.now().toString(), start, end, type };
      updateTeamMember({ ...member, absences: [...(member.absences || []), newAbsence] });
    }
    setShowAbsenceModal(false);
  };

  const deleteAbsence = (memberId: string, absenceId: string) => {
    const member = team.find(m => m.id === memberId);
    if (member) {
      updateTeamMember({ ...member, absences: member.absences.filter(a => a.id !== absenceId) });
    }
  };

  return (
    <div className={styles.premiumContainer}>
      <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-primary)' }}>Gestão de Equipe</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Recesso e revezamento do time</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {isAdmin && (
            <button className={styles.iconBtn} onClick={() => {}} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', padding: '10px 16px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
             <CalendarDays size={18} /> Registrar Ausência
            </button>
          )}
        </div>
      </header>

      {/* Tabs Switcher */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '40px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
         {[
           { id: 'cron', label: 'Cronograma' },
           { id: 'rev', label: 'Revezamento' },
           { id: 'eq', label: 'Equipe', icon: Users }
         ].map(t => (
           <button 
             key={t.id} 
             onClick={() => setActiveTab(t.id as any)}
             className={`${styles.tabItem} ${activeTab === t.id ? styles.activeTab : ''}`}
             style={{ 
                padding: '10px 24px', 
                borderRadius: '50px', 
                fontSize: '0.9rem', 
                fontWeight: 700, 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                background: activeTab === t.id ? 'var(--bg-surface-hover)' : 'transparent',
                color: activeTab === t.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                border: activeTab === t.id ? '1px solid var(--border-color)' : '1px solid transparent'
             }}
           >
             {t.id === 'eq' && <Users size={16} />} {t.label}
           </button>
         ))}
      </div>

      <main>
        {/* --- ABA EQUIPE (LISTA DE CARDS) --- */}
        {activeTab === 'eq' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
            {team.map(m => {
              const absent = isMemberAbsent(m);
              return (
                <div key={m.id} className={styles.glassCard} style={{ padding: '24px', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(124,58,237,0.1)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         <UserIcon size={24} />
                      </div>
                      <div>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{m.name}</h4>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{m.role}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                       <span style={{ 
                          padding: '4px 12px', 
                          borderRadius: '50px', 
                          fontSize: '0.7rem', 
                          fontWeight: 800, 
                          background: absent ? 'rgba(239, 68, 68, 0.1)' : 'rgba(124, 58, 237, 0.1)',
                          color: absent ? 'var(--status-error)' : 'var(--accent-primary)'
                       }}>
                         {absent ? 'Ausente' : 'Disponível'}
                       </span>
                       <button className={styles.iconBtn} onClick={() => handleRegisterAbsence(m.id)}><Edit size={16} /></button>
                       <button className={styles.iconBtn} onClick={() => deleteTeamMember(m.id)}><Trash2 size={16} /></button>
                    </div>
                  </div>

                  {m.absences?.length > 0 && (
                     <div>
                        <h5 style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>Períodos Registrados</h5>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                           {m.absences.map(a => (
                              <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', fontSize: '0.8rem' }}>
                                 <span style={{ fontWeight: 600 }}>{new Date(a.start).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} — {new Date(a.end).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} {new Date(a.end).getFullYear()}</span>
                                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '0.6rem', padding: '2px 8px', borderRadius: '4px', background: 'rgba(0,0,0,0.2)', color: 'var(--text-secondary)' }}>Recesso</span>
                                    <button className={styles.iconBtn} onClick={() => deleteAbsence(m.id, a.id)}><Trash2 size={14} /></button>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* --- ABA CRONOGRAMA (GRID MENSAL) --- */}
        {activeTab === 'cron' && (
          <div className={styles.glassCard} style={{ overflowX: 'auto', padding: '24px' }}>
             <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Calendar size={20} color="var(--accent-primary)" /> Cronograma 2026
             </h3>
             <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center' }}>
                <thead>
                   <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <th style={{ padding: '16px', textAlign: 'left', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)' }}>COLABORADOR</th>
                      {MONTHS.map(m => <th key={m} style={{ padding: '16px', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)' }}>{m}</th>)}
                   </tr>
                </thead>
                <tbody>
                   {team.map(m => (
                      <tr key={m.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                         <td style={{ padding: '20px 16px', textAlign: 'left' }}>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{m.name}</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{m.role}</div>
                         </td>
                         {MONTHS.map((_, i) => (
                            <td key={i} style={{ padding: '2px', height: '60px' }}>
                               {getMonthAbsence(m, i) && (
                                  <div style={{ borderRadius: '6px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '4px', fontSize: '0.65rem', fontWeight: 900, color: 'var(--status-warning)' }}>
                                     REC
                                  </div>
                               )}
                            </td>
                         ))}
                      </tr>
                   ))}
                </tbody>
             </table>
             <div style={{ marginTop: '24px', display: 'flex', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem' }}>
                   <div style={{ width: '24px', height: '14px', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)' }}></div> Recesso
                </div>
             </div>
          </div>
        )}

        {/* --- ABA REVEZAMENTO (CARDS ESTRATÉGICOS) --- */}
        {activeTab === 'rev' && (
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(500px, 1fr))', gap: '24px' }}>
              {periods.map(p => (
                 <div key={p.id} className={styles.glassCard} style={{ padding: '24px' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                       {p.icon} {p.title}
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                       <div>
                          <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--text-secondary)', marginBottom: '12px' }}>DE PLANTÃO ({p.plantao.length})</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                             {p.plantao.map(m => (
                                <span key={m} style={{ padding: '4px 12px', borderRadius: '50px', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', color: 'var(--accent-primary)', fontSize: '0.75rem', fontWeight: 600 }}>{m}</span>
                             ))}
                          </div>
                       </div>
                       <div>
                          <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--text-secondary)', marginBottom: '12px' }}>DE FOLGA ({p.folga.length})</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                             {p.folga.map(m => (
                                <span key={m} style={{ padding: '4px 12px', borderRadius: '50px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{m}</span>
                             ))}
                          </div>
                       </div>
                    </div>

                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                             <MessageSquare size={16} color="var(--accent-primary)" />
                             <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>Passagem de Bastão ({p.notas?.length || 0})</span>
                          </div>
                          <button 
                            className={styles.textBtn} 
                            onClick={() => {
                              const note = prompt('Nova nota de passagem:');
                              if (note) updatePeriod({ ...p, notas: [...(p.notas || []), note] });
                            }}
                            style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--accent-primary)' }}
                          >
                             + ADICIONAR NOTA
                          </button>
                       </div>
                       <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {p.notas?.map((n, idx) => (
                             <div key={idx} style={{ padding: '12px 16px', background: 'var(--bg-main)', borderRadius: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)', borderLeft: '3px solid var(--accent-primary)' }}>
                                {n}
                             </div>
                          ))}
                          {!p.notas?.length && <div style={{ textAlign: 'center', padding: '20px', fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>Nenhuma nota registrada</div>}
                       </div>
                    </div>
                 </div>
              ))}
           </div>
        )}
      </main>

      {/* MODAL DE AUSÊNCIA */}
      {showAbsenceModal && (
         <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div className={styles.glassCard} style={{ width: '400px', padding: '32px' }}>
               <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '24px' }}>Registrar Recesso</h3>
               <form onSubmit={submitAbsence} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="inputGroup">
                     <label>MEMBRO</label>
                     <input className={styles.premiumInput} style={{ width: '100%' }} value={team.find(m => m.id === selectedMemberId)?.name || ''} disabled />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                     <div className="inputGroup">
                        <label>INÍCIO</label>
                        <input name="start" type="date" className={styles.premiumInput} style={{ width: '100%' }} required />
                     </div>
                     <div className="inputGroup">
                        <label>TÉRMINO</label>
                        <input name="end" type="date" className={styles.premiumInput} style={{ width: '100%' }} required />
                     </div>
                  </div>
                  <div className="inputGroup">
                     <label>TIPO</label>
                     <select name="type" className={styles.premiumInput} style={{ width: '100%' }}>
                        <option value="recesso">Recesso</option>
                        <option value="folga">Folga</option>
                        <option value="ferias">Férias</option>
                     </select>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                     <button type="button" className={styles.iconBtn} onClick={() => setShowAbsenceModal(false)} style={{ flex: 1, padding: '12px', border: '1px solid var(--border-color)', borderRadius: '12px' }}>CANCELAR</button>
                     <button type="submit" className={styles.premiumButton} style={{ flex: 1 }}>SALVAR</button>
                  </div>
               </form>
            </div>
         </div>
      )}

      <style jsx>{`
        .inputGroup { display: flex; flex-direction: column; gap: 6px; }
        .inputGroup label { font-size: 0.65rem; font-weight: 900; color: var(--text-secondary); letter-spacing: 0.05em; }
        .textBtn { background: transparent; border: none; cursor: pointer; }
        .iconBtn { background: transparent; border: none; cursor: pointer; color: var(--text-secondary); opacity: 0.6; transition: 0.2s; }
        .iconBtn:hover { opacity: 1; color: var(--text-primary); }
      `}</style>
    </div>
  );
}

function UserIcon({ size }: { size: number }) {
  return <Users size={size} />;
}
