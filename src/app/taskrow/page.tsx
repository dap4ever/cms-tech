"use client";

import { useEffect, useState } from 'react';
import { GitPullRequest, Plus, Filter, Loader2, AlertCircle, 
  Calendar,
  Briefcase,
  Trash2,
  CheckCircle,
  PlayCircle
} from 'lucide-react';
import styles from './projects.module.css';
import { KanbanTask } from '@/lib/taskrow';
import clientsData from '../../../docs/TASKROW_CLIENTS_EXPORT.json';
import jobsData from '../../../docs/TASKROW_JOBS_EXPORT.json';
import usersData from '../../../docs/TASKROW_USERS_EXPORT.json';
import groupsData from '../../../docs/TASKROW_GROUPS_EXPORT.json';

const columns = [
  { id: 'todo', title: 'A Fazer' },
  { id: 'inProgress', title: 'Em Andamento' },
  { id: 'inReview', title: 'Em Revisão' },
  { id: 'done', title: 'Concluído' },
];

import Link from 'next/link';
import { applyTechHeuristicsClass } from '@/lib/taskrow';
import { useAuth } from '@/context/AuthContext';

export default function Projects() {
  const { user, isGestor, isAdmin } = useAuth();
  const [tasks, setTasks] = useState<KanbanTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMSG, setErrorMSG] = useState<string | null>(null);
  const [approvedTasks, setApprovedTasks] = useState<Set<string>>(new Set());
  
  // Novos estados para atribuição
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [taskAssignments, setTaskAssignments] = useState<Record<string, string[]>>({});
  const [selectedDevs, setSelectedDevs] = useState<Record<string, string>>({});
  const [selectedPriorities, setSelectedPriorities] = useState<Record<string, string>>({});
  const [sprints, setSprints] = useState<any[]>([]);
  const [activeSprintId, setActiveSprintId] = useState<string | null>(null);
  const [pendingApproval, setPendingApproval] = useState<Record<string, boolean>>({});

  // Estados dos Filtros (Camada 2)
  const [showingFilters, setShowingFilters] = useState(true); 
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClient, setFilterClient] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [filterGroup, setFilterGroup] = useState('');


  useEffect(() => {
    // Carregar aprovadas do localStorage (fallback legado)
    const savedInternal = localStorage.getItem('f2f_internal_projects');
    if (savedInternal) {
       try {
          const parsed = JSON.parse(savedInternal);
          const ids = new Set(parsed.map((t: any) => t.id));
          setApprovedTasks(ids as Set<string>);
       } catch (e) {}
    }

    async function fetchData() {
      try {
        // 1. Busca Tarefas do Taskrow
        const tasksRes = await fetch('/api/taskrow/tasks');
        const tasksData = await tasksRes.json();
        
        if (tasksData.success) {
          setTasks(tasksData.tasks);
        } else {
          setErrorMSG(tasksData.error || 'Erro ao carregar tarefas');
        }

        // 2. Busca Usuários do sistema (apenas se for Gestor/Admin)
        if (isAdmin || isGestor) {
          const usersRes = await fetch('/api/users');
          const usersData = await usersRes.json();
          if (usersData.success) setAllUsers(usersData.users);
        }

        // 3. Busca Atribuições do Banco
        const assignRes = await fetch('/api/tasks/assignments');
        const assignData = await assignRes.json();
        if (assignData.success) {
          const mapping: Record<string, string[]> = {};
          const failsMapping: Record<string, boolean> = {};
          assignData.assignments.forEach((a: any) => {
            if (a.users && a.users.length > 0) {
              mapping[a.taskId] = a.users.map((u:any) => u.id);
            }
            if (!a.qaApproved && a.qcMetadata && Array.isArray(a.qcMetadata) && a.qcMetadata.length > 0) {
              failsMapping[a.taskId] = true;
            }
          });
          setTaskAssignments(mapping);
          (window as any)._failsMap = failsMapping; // Mantendo simples para o arquivo legado
        }

        // 4. Busca Sprints
        const sprintsRes = await fetch('/api/sprints');
        const sprintsData = await sprintsRes.json();
        if (sprintsData.success) {
          setSprints(sprintsData.sprints);
          
          // Identificar sprint ativa (hoje entre startDate e endDate)
          const now = new Date();
          const active = sprintsData.sprints.find((s: any) => {
            const start = new Date(s.startDate);
            const end = new Date(s.endDate);
            return now >= start && now <= end;
          });
          if (active) setActiveSprintId(active.id);
        }

      } catch (err: any) {
        setErrorMSG(err.message || 'Falha na conexão com a API');
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [isAdmin, isGestor]);

  const getPriorityClass = (priority: string) => {
    switch(priority) {
      case 'high': return styles.priorityHigh;
      case 'medium': return styles.priorityMedium;
      default: return styles.priorityLow;
    }
  };

  // ==========================================
  // LÓGICA DE FILTRAGEM E ORDENAÇÃO (Camada 2)
  // ==========================================
  const filteredTasks = tasks.filter(task => {
    // 0. Ocultar as que já foram aprovadas (Ocultar apenas para DEVS, Gestor/Admin vê tudo)
    if (!isAdmin && !isGestor && approvedTasks.has(task.id)) return false;

    // 1. Regra de Atribuição (NOVO)
    // Se for Desenvolvedor (e não Admin/Gestor), vê apenas o que está assinado para ele no banco
    const isDeveloperOnly = !isAdmin && !isGestor;
    const assignedUserIds = taskAssignments[task.id] || [];

    if (isDeveloperOnly) {
      if (!user?.id || !assignedUserIds.includes(user.id)) return false;
    } else {
      // Para Gestores: Se não houver filtros ativos, foca nos Tech Owners (padrão)
      const hasStrictFilters = searchTerm || filterClient || filterUser || filterGroup;
      if (!hasStrictFilters) {
        const rawLogin = task.rawData?.ownerUserLogin || task.rawData?.OwnerUserLogin || task.assigneeLogin || '';
        const login = rawLogin.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        const isTechOwner = login.includes('ingrid') || login.includes('raissa') || login.includes('kaique');
        if (!isTechOwner) return false;
      }
    }

    // 2. Filtro de Grupo Taskrow (Novo)
    if (filterGroup) {
       const functionGroup = String(task.rawData?.functionGroupName || task.rawData?.FunctionGroupName || task.rawData?.groupName || task.rawData?.GroupName || '').toLowerCase();
       if (!functionGroup.includes(filterGroup.toLowerCase())) return false;
    }

    // 3. Filtro de Usuário Taskrow (Novo)
    if (filterUser) {
       const rawLogin = String(task.rawData?.ownerUserLogin || task.rawData?.OwnerUserLogin || task.assigneeLogin || '').toLowerCase();
       if (!rawLogin.includes(filterUser.toLowerCase())) return false;
    }

    // 4. Filtro de Busca (Title, Client, TaskID)
    if (searchTerm) {
       const term = searchTerm.toLowerCase();
       const mId = task.id.toLowerCase();
       const mTitle = task.title.toLowerCase();
       const mClient = task.client.toLowerCase();
       if (!mId.includes(term) && !mTitle.includes(term) && !mClient.includes(term)) return false;
    }

    // 3. Filtro de Empresa (Cliente) via ClientNickname (Precedência do Documento)
    if (filterClient) {
       const cNick = String(task.rawData?.clientNickName || task.rawData?.clientNickname || task.rawData?.jobClientNickName || task.rawData?.clientDisplayName || task.client || '').toLowerCase();
       if (cNick !== filterClient.toLowerCase() && !cNick.includes(filterClient.toLowerCase())) return false;
    }





    return true;
  }).sort((a, b) => {
    // Ordenação exigida pela DOC PHP: Data Entrega Ascendente
    const da = new Date(a.dueDate).getTime();
    const db = new Date(b.dueDate).getTime();
    if(da === db) {
      // desempate id
      return parseInt(a.id.replace(/\D/g,'') || '0') - parseInt(b.id.replace(/\D/g,'') || '0');
    }
    return da - db;
  });

  const handleApprove = async (task: KanbanTask) => {
    const targetUserId = selectedDevs[task.id];
    const priority = selectedPriorities[task.id] || 'normal';
    
    if (!targetUserId) {
      alert('Selecione um desenvolvedor para atribuir esta tarefa.');
      return;
    }

    try {
      const res = await fetch('/api/tasks/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: task.id,
          title: task.title,
          client: task.client,
          targetUserId,
          sprintId: activeSprintId,
          priority
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao salvar atribuição');
      }

      // Atualiza estado local adicionando no array
      setTaskAssignments(prev => {
        const currentIds = prev[task.id] || [];
        if (!currentIds.includes(targetUserId)) {
          return { ...prev, [task.id]: [...currentIds, targetUserId] };
        }
        return prev;
      });
      setPendingApproval(prev => { const n = { ...prev }; delete n[task.id]; return n; });
      setApprovedTasks(prev => {
         const next = new Set(prev);
         next.add(task.id);
         return next;
      });

      // Feedback opcional (localstorage mantido como redundância para a aba de projetos legada)
      const savedInternal = localStorage.getItem('f2f_internal_projects');
      let existing = [];
      if (savedInternal) try { existing = JSON.parse(savedInternal); } catch (e) {}
      if (!existing.some((t: any) => t.id === task.id)) {
         existing.push({ ...task, column: 'todo', internalStatus: 'A Fazer' });
         localStorage.setItem('f2f_internal_projects', JSON.stringify(existing));
      }

    } catch (err: any) {
      alert('Erro: ' + err.message);
    }
  };

  const handleUnassign = async (taskId: string) => {
    if (!confirm('Deseja DESATRIBUIR esta tarefa? Ela será removida do banco de dados e do Kanban.')) return;

    try {
      const res = await fetch(`/api/tasks/assign?taskId=${taskId}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Erro ao desatribuir tarefa');

      // Atualiza estado local
      setTaskAssignments(prev => {
        const next = { ...prev };
        delete next[taskId];
        return next;
      });
      setApprovedTasks(prev => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
      
      // Remover do localStorage tab projetos legada se houver
      const savedInternal = localStorage.getItem('f2f_internal_projects');
      if (savedInternal) {
         let existing = JSON.parse(savedInternal);
         existing = existing.filter((t:any) => t.id !== taskId);
         localStorage.setItem('f2f_internal_projects', JSON.stringify(existing));
      }

    } catch (err: any) {
      alert('Erro: ' + err.message);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterClient('');
    setFilterUser('');
    setFilterGroup('');
  }

  return (
    <div>
      <header className={styles.pageHeader}>
        <div className={styles.titleArea}>
          <h1 className={styles.pageTitle}>Caixa de Entrada Taskrow</h1>
          <span className={styles.sprintBadge}>Todas as demandas gerais</span>
        </div>
        <div className={styles.headerActions}>
          <button className={`${styles.btnSecondary} ${showingFilters ? styles.btnActive : ''}`} 
            onClick={() => setShowingFilters(!showingFilters)} disabled={isLoading}>
            <Filter size={16} style={{ marginRight: 8, display: 'inline' }} />
            Filtros
          </button>
          <button className={styles.btnPrimary} disabled={isLoading}>
            <Plus size={16} style={{ marginRight: 8, display: 'inline' }} />
            Nova Tarefa
          </button>
        </div>
      </header>

      {showingFilters && (
        <div className={styles.filterBar}>
            <input 
              type="text" 
              placeholder="Buscar por ID, Título..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.filterInput}
            />

            <select className={styles.filterSelect} value={filterClient} onChange={(e) => setFilterClient(e.target.value)}>
              <option value="">Por empresa</option>
              {clientsData.sort((a:any, b:any) => a.ClientName.localeCompare(b.ClientName)).map((c: any) => 
                 <option key={c.ClientID} value={c.ClientNickName}>{c.ClientName}</option>
              )}
            </select>
            
            <select className={styles.filterSelect} value={filterUser} onChange={(e) => setFilterUser(e.target.value)}>
              <option value="">Por Responsável</option>
              {usersData.filter((u:any) => !u.Inactive).sort((a:any, b:any) => a.FullName.localeCompare(b.FullName)).map((u: any) => 
                 <option key={u.UserID} value={u.UserLogin}>{u.FullName}</option>
              )}
            </select>

            <select className={styles.filterSelect} value={filterGroup} onChange={(e) => setFilterGroup(e.target.value)}>
              <option value="">Por Grupo</option>
              {groupsData.FunctionGroups.sort().map((g: string) => 
                 <option key={g} value={g}>{g}</option>
              )}
            </select>
            
            <button className={styles.clearBtn} onClick={clearFilters}>Limpar Filtros</button>
        </div>
      )}

      {errorMSG && (
        <div className={styles.errorMessage}>
          Aviso: {errorMSG}. Exibindo as últimas informações cacheadas ou limite de API excedido.
        </div>
      )}

      {isLoading ? (
        <div className={styles.loadingContainer}>
          <Loader2 className={styles.loadingIcon} size={48} />
          <p>Sincronizando tarefas com o Taskrow...</p>
        </div>
      ) : (
        <>
          <div className={styles.metricsBar}>
            <div className={styles.metricCard}>
              <div className={styles.metricValue}>{filteredTasks.length}</div>
              <div className={styles.metricLabel}>Demandas Listadas</div>
            </div>
            <div className={styles.metricCard}>
               <div className={styles.metricValue}>
                 {filteredTasks.filter(t => new Date(t.dueDate) < new Date() && new Date(t.dueDate).getFullYear() > 2000).length}
               </div>
               <div className={styles.metricLabel}>Tarefas Atrasadas</div>
            </div>
            <div className={styles.metricCard}>
               <div className={styles.metricValue}>
                 {filteredTasks.filter(t => new Date(t.dueDate) >= new Date() && new Date(t.dueDate).getTime() <= new Date().getTime() + 7*24*60*60*1000).length}
               </div>
               <div className={styles.metricLabel}>Para os próximos 7 dias</div>
            </div>
          </div>

          <div className={styles.taskTable}>
            <div className={styles.tableHead}>
              <div>Tarefa</div>
              <div>Empresa / Projeto</div>
              <div>Solicitação</div>
              <div>Responsável / Prioridade</div>
              <div>Fase / Etapa</div>
              <div>Prazo</div>
              <div>Ação</div>
            </div>
            
            {filteredTasks.map(task => {
              const reqBadge = task.rawData?.requestTypeAcronym ? `[${task.rawData?.requestTypeAcronym}]` : '[TEC]';
              const reqName = task.rawData?.requestTypeName || 'Solicitação de Tecnologia';
              const jobTitle = task.rawData?.jobTitle || task.rawData?.JobTitle || task.client;
              const isLate = new Date(task.dueDate) < new Date();
              const datePillClass = `${styles.datePill} ${!isLate ? styles.onTime : ''}`;
              const assignedIds = taskAssignments[task.id] || [];
              const isTaskAssigned = assignedIds.length > 0;
              const isPending = pendingApproval[task.id];
              const assignedUser = isTaskAssigned ? allUsers.find(u => u.id === assignedIds[0]) : null;

              return (
                <div key={task.id} style={{textDecoration: 'none', color: 'inherit'}}>
                  <div className={styles.taskRow} onClick={() => window.location.href = `/taskrow/task/${task.id}`}>
                    <div className={styles.cellCol}>
                      <div className={styles.cellTitle}>
                        <GitPullRequest size={14} style={{color:'var(--text-secondary)'}}/>
                        {task.id.replace('TR-','#')} | {task.title}
                        {(window as any)._failsMap?.[task.id] && (
                           <AlertCircle size={14} color="#ef4444" style={{ marginLeft: 8 }} />
                        )}
                      </div>
                      <div className={styles.cellSubtitle}>
                         {task.id} {task.title}
                      </div>
                    </div>

                    <div className={styles.cellCol}>
                      <div className={styles.cellTitle}>{task.client}</div>
                      <div className={styles.cellSubtitle}>#{task.rawData?.jobNumber || task.rawData?.JobNumber || '00'} {jobTitle}</div>
                    </div>

                    <div className={styles.cellCol}>
                      <div className={styles.cellTitle}>
                        <span style={{color: '#f59e0b', marginRight: 4}}>{reqBadge}</span> {reqName}
                      </div>
                      <div className={styles.cellSubtitle}>
                        {task.tags.join(', ')}
                      </div>
                    </div>

                    <div className={styles.cellCol}>
                      <div className={styles.cellTitle}>
                         {task.rawData?.ownerUserLogin || task.assigneeLogin}
                      </div>
                      <div className={styles.cellSubtitle}>
                         Tecnologia  
                         <span className={getPriorityClass(task.priority)} style={{display: 'inline-block', width: 8, height: 8, borderRadius: '50%', marginLeft: 8}}></span>
                      </div>
                    </div>

                    <div className={styles.cellCol}>
                      <div className={styles.cellTitle} style={{fontWeight: 500}}>
                         {task.statusOriginal}
                      </div>
                    </div>

                    <div className={styles.cellCol}>
                      <div className={datePillClass}>
                        {new Date(task.dueDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                      </div>
                    </div>

                    <div className={styles.cellCol} onClick={(e) => e.stopPropagation()}>
                       { (isAdmin || isGestor) ? (
                         isTaskAssigned ? (
                           <div className={styles.assignActionGroup}>
                             <div className={styles.assignedBadge}>
                               <CheckCircle size={14} />
                               {assignedUser?.name || 'Atribuída'}
                             </div>
                             <button
                               className={styles.deleteBtn}
                               onClick={() => handleUnassign(task.id)}
                               title="Desatribuir e remover do Projetos"
                             >
                               <Trash2 size={14} />
                             </button>
                           </div>
                         ) : isPending ? (
                           <div className={styles.assignActionGroup}>
                             <select
                               className={styles.devSelect}
                               value={selectedDevs[task.id] || ''}
                               onChange={(e) => setSelectedDevs(prev => ({ ...prev, [task.id]: e.target.value }))}
                               style={{ width: '130px' }}
                             >
                               <option value="">Atribuir a...</option>
                               {allUsers.filter(u => u.roles.includes('DESENVOLVEDOR')).map(u => (
                                 <option key={u.id} value={u.id}>{u.name}</option>
                               ))}
                             </select>
                             <select
                               className={styles.devSelect}
                               value={selectedPriorities[task.id] || 'normal'}
                               onChange={(e) => setSelectedPriorities(prev => ({ ...prev, [task.id]: e.target.value }))}
                               style={{ width: '90px', marginLeft: '4px' }}
                             >
                               <option value="low">Baixa</option>
                               <option value="normal">Normal</option>
                               <option value="high">Alta</option>
                               <option value="critical">Crítica</option>
                             </select>
                             <button
                               className={styles.approveBtn}
                               onClick={() => handleApprove(task)}
                               title="Confirmar Atribuição e mover para Projetos"
                             >
                               <CheckCircle size={14} /> Atribuir
                             </button>
                             <button
                               className={styles.cancelApproveBtn}
                               onClick={() => setPendingApproval(prev => { const n = {...prev}; delete n[task.id]; return n; })}
                               title="Cancelar"
                             >
                               ✕
                             </button>
                           </div>
                         ) : (
                           <div className={styles.assignActionGroup}>
                             <button
                               className={styles.approveStartBtn}
                               onClick={() => setPendingApproval(prev => ({ ...prev, [task.id]: true }))}
                             >
                               <PlayCircle size={14} /> Aprovar para Início
                             </button>
                           </div>
                         )
                       ) : (
                         <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                           <div className={styles.assignedBadge}>
                             <CheckCircle size={14} /> Assinada para você
                           </div>
                           {(taskAssignments[task.id] && taskAssignments[task.id].length > 0) && (
                             <button
                               className={styles.deleteBtn}
                               onClick={() => handleUnassign(task.id)}
                               title="Desatribuir e excluir do Projetos"
                               style={{ background: 'transparent' }}
                             >
                               <Trash2 size={14} />
                             </button>
                           )}
                         </div>
                       )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
