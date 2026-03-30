"use client";

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, UserPlus, Loader2, Sparkles, Users, AlertCircle, RefreshCw } from 'lucide-react';
import styles from '@/app/taskrow/task/[id]/task.module.css';

type Tab = 'ai' | 'manual';

interface Suggestion {
  id: string;
  name: string;
  avatarUrl: string | null;
  skills: string[];
  activeTasks: number;
  estimatedRemainingHours: number;
  daysUntilDeadline: number | null;
  nearestSprintName: string | null;
  score: number;
  reason: string;
  aiPowered: boolean;
  isAbsent: boolean;
  absenceType: string | null;
  absenceUntil: string | null;
}

interface ExtraAssigneeManagerProps {
  taskId: string;
  taskTitle: string;
  taskClient: string;
  allUsers: any[];
}

export function ExtraAssigneeManager({ taskId, taskTitle, taskClient, allUsers }: ExtraAssigneeManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('ai');
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const hasFetched = useRef(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Busca automática ao abrir pela primeira vez na aba IA
  useEffect(() => {
    if (isOpen && !hasFetched.current) {
      hasFetched.current = true;
      fetchSuggestions();
    }
  }, [isOpen]);

  const fetchSuggestions = async () => {
    setIsFetching(true);
    setFetchError(null);
    try {
      const res = await fetch('/api/tasks/suggest-assignees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, taskTitle }),
      });
      const data = await res.json();
      if (data.success) {
        setSuggestions(data.suggestions);
      } else {
        setFetchError(data.error || 'Erro ao buscar sugestões');
      }
    } catch {
      setFetchError('Erro de conexão. Tente novamente.');
    } finally {
      setIsFetching(false);
    }
  };

  const handleRetry = () => {
    hasFetched.current = true;
    fetchSuggestions();
  };

  const handleAddUser = async (userId: string) => {
    setIsAdding(userId);
    setIsOpen(false);
    try {
      const res = await fetch('/api/tasks/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, title: taskTitle, client: taskClient, targetUserId: userId }),
      });
      const data = await res.json();
      if (data.success) {
        window.location.reload();
      } else {
        alert('Erro ao adicionar responsável: ' + data.error);
      }
    } catch {
      alert('Erro de conexão ao adicionar responsável.');
    } finally {
      setIsAdding(null);
    }
  };

  const isGlobalAdding = isAdding !== null;

  return (
    <div className={styles.assigneeDropdownWrapper} ref={wrapperRef}>
      <button
        className={styles.addAssigneeBtn}
        onClick={() => setIsOpen(v => !v)}
        disabled={isGlobalAdding}
      >
        {isGlobalAdding
          ? <Loader2 size={13} className={styles.spinner} />
          : <UserPlus size={13} />
        }
        <span>Adicionar Responsável</span>
        <ChevronDown size={12} className={isOpen ? styles.chevronOpen : ''} />
      </button>

      {isOpen && (
        <div className={styles.assigneeDropdown}>

          {/* Tabs */}
          <div className={styles.tabBar}>
            <button
              className={`${styles.tab} ${activeTab === 'ai' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('ai')}
            >
              <Sparkles size={12} />
              Sugestão IA
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'manual' ? styles.tabActive : ''}`}
              onClick={() => setActiveTab('manual')}
            >
              <Users size={12} />
              Manual
            </button>
          </div>

          {/* ── Aba IA ── */}
          {activeTab === 'ai' && (
            <div className={styles.aiTabContent}>

              {/* Carregando */}
              {isFetching && (
                <div className={styles.aiLoadingState}>
                  <Loader2 size={22} className={styles.spinner} />
                  <span>Analisando skills, cargas e prazos...</span>
                  <small>Isso pode levar alguns segundos</small>
                </div>
              )}

              {/* Erro */}
              {!isFetching && fetchError && (
                <div className={styles.aiErrorState}>
                  <AlertCircle size={15} />
                  <span>{fetchError}</span>
                  <button className={styles.retryBtn} onClick={handleRetry}>
                    <RefreshCw size={11} /> Tentar novamente
                  </button>
                </div>
              )}

              {/* Lista de sugestões */}
              {!isFetching && !fetchError && suggestions && (
                <>
                  {/* Label IA ou fallback */}
                  <div className={styles.aiPoweredLabel}>
                    <Sparkles size={10} />
                    {suggestions[0]?.aiPowered
                      ? 'Rankeado por IA · skills, carga e prazos'
                      : 'Rankeado por carga de trabalho'
                    }
                  </div>

                  {suggestions.length === 0 && (
                    <div className={styles.assigneeDropdownEmpty}>
                      Nenhum desenvolvedor disponível.
                    </div>
                  )}

                  <div className={styles.aiSuggestionList}>
                    {suggestions.map((s, i) => {
                      const barClass = s.score >= 8 ? styles.scoreBarHigh : s.score >= 5 ? styles.scoreBarMed : styles.scoreBarLow;
                      const labelClass = s.score >= 8 ? styles.scoreLabelHigh : s.score >= 5 ? styles.scoreLabelMed : styles.scoreLabelLow;
                      return (
                        <div
                          key={s.id}
                          className={[
                            styles.aiSuggestionCard,
                            i === 0 && !s.isAbsent ? styles.aiSuggestionCardTop : '',
                            s.isAbsent ? styles.aiSuggestionCardAbsent : '',
                          ].join(' ')}
                        >
                          {/* Posição */}
                          <span className={styles.rankPosition}>{i + 1}º</span>

                          {/* Avatar */}
                          <div className={styles.suggestionAvatar}>
                            {s.avatarUrl
                              ? <img src={s.avatarUrl} alt={s.name} className={styles.assigneeItemAvatarImg} />
                              : s.name.substring(0, 2).toUpperCase()
                            }
                          </div>

                          {/* Conteúdo */}
                          <div className={styles.suggestionContent}>
                            {/* Nome + badges */}
                            <div className={styles.suggestionTopRow}>
                              <div className={styles.suggestionNameRow}>
                                <span className={styles.suggestionName}>{s.name}</span>
                                {i === 0 && !s.isAbsent && (
                                  <span className={styles.topBadge}>⭐ Recomendado</span>
                                )}
                                {s.isAbsent && (
                                  <span className={styles.absenceBadge}>🏖 Ausente</span>
                                )}
                              </div>
                            </div>

                            {/* Barra de score (apenas para não ausentes) */}
                            {!s.isAbsent && (
                              <div className={styles.scoreBarWrapper}>
                                <span className={`${styles.scoreBarLabel} ${labelClass}`}>{s.score}</span>
                                <div className={styles.scoreBarOuter}>
                                  <div
                                    className={`${styles.scoreBarInner} ${barClass}`}
                                    style={{ width: `${(s.score / 10) * 100}%` }}
                                  />
                                </div>
                              </div>
                            )}

                            {/* Skills */}
                            {s.skills.length > 0 && (
                              <div className={styles.skillChips}>
                                {s.skills.slice(0, 4).map(sk => (
                                  <span key={sk} className={styles.skillChip}>{sk}</span>
                                ))}
                              </div>
                            )}

                            {/* Ausência ou carga */}
                            {s.isAbsent ? (
                              <p className={styles.absenceInfo}>
                                {s.absenceType ?? 'Ausência'} · retorna em {s.absenceUntil}
                              </p>
                            ) : (
                              <div className={styles.workloadRow}>
                                <span className={s.activeTasks === 0 ? styles.workloadFree : styles.workloadBusy}>
                                  {s.activeTasks === 0 ? '● Livre' : `● ${s.activeTasks} tarefa${s.activeTasks > 1 ? 's' : ''}`}
                                </span>
                                {s.estimatedRemainingHours > 0 && (
                                  <span className={styles.workloadHours}>· {s.estimatedRemainingHours}h restantes</span>
                                )}
                                {s.daysUntilDeadline !== null && s.daysUntilDeadline <= 5 && (
                                  <span className={styles.deadlineWarning}>· prazo em {s.daysUntilDeadline}d</span>
                                )}
                              </div>
                            )}

                            {/* Motivo da IA */}
                            {!s.isAbsent && s.reason && (
                              <p className={styles.aiReason}>"{s.reason}"</p>
                            )}

                            {/* Botão adicionar */}
                            <button
                              className={styles.suggestionAddBtn}
                              onClick={() => handleAddUser(s.id)}
                              disabled={s.isAbsent || isGlobalAdding}
                              title={s.isAbsent ? 'Desenvolvedor ausente' : 'Adicionar como responsável'}
                            >
                              {isAdding === s.id
                                ? <><Loader2 size={11} className={styles.spinner} /> Adicionando...</>
                                : '+ Adicionar'
                              }
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Aba Manual ── */}
          {activeTab === 'manual' && (
            <div>
              <div className={styles.assigneeDropdownHeader}>Selecionar pessoa</div>
              {allUsers.length === 0 ? (
                <div className={styles.assigneeDropdownEmpty}>Nenhum usuário disponível</div>
              ) : (
                allUsers.map(u => (
                  <button
                    key={u.id}
                    className={styles.assigneeDropdownItem}
                    onClick={() => handleAddUser(u.id)}
                    disabled={isGlobalAdding}
                  >
                    <div className={styles.assigneeItemAvatar}>
                      {u.avatarUrl
                        ? <img src={u.avatarUrl} alt={u.name} className={styles.assigneeItemAvatarImg} />
                        : u.name.substring(0, 2).toUpperCase()
                      }
                    </div>
                    <span className={styles.assigneeItemName}>{u.name}</span>
                  </button>
                ))
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
}
