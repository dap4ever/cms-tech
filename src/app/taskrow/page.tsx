"use client";

import { useEffect, useState } from 'react';
import { GitPullRequest, Plus, Filter, Loader2, CheckCircle } from 'lucide-react';
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

export default function Projects() {
  const [tasks, setTasks] = useState<KanbanTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMSG, setErrorMSG] = useState<string | null>(null);
  const [approvedTasks, setApprovedTasks] = useState<Set<string>>(new Set());

  // Estados dos Filtros (Camada 2)
  const [showingFilters, setShowingFilters] = useState(true); // Na imagem os filtros estão visíveis
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClient, setFilterClient] = useState('');
  const [filterProject, setFilterProject] = useState('');


  useEffect(() => {
    // Carregar aprovadas do localStorage
    const savedInternal = localStorage.getItem('f2f_internal_projects');
    if (savedInternal) {
       try {
          const parsed = JSON.parse(savedInternal);
          const ids = new Set(parsed.map((t: any) => t.id));
          setApprovedTasks(ids as Set<string>);
       } catch (e) {}
    }

    async function fetchTasks() {
      try {
        const response = await fetch('/api/taskrow/tasks');
        const data = await response.json();
        
        if (data.success) {
          setTasks(data.tasks);
          
          // Fallback preenchendo valor default de Owner caso não seja manipulado depois
          if (data.tasks.some((t: KanbanTask) => t.assigneeLogin.includes('raissa'))) {
             // O Doc diz tenta preselecionar a raissa
             // setFilterOwner('raissa'); Removido auto preenchimento pesado para flexibilidade
          }

        } else {
          setErrorMSG(data.error || 'Erro desconhecido ao carregar tarefas');
        }
      } catch (err: any) {
        setErrorMSG(err.message || 'Falha na conexão com a API local');
      } finally {
        setIsLoading(false);
      }
    }

    fetchTasks();
  }, []);

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
    // 0. Ocultar as que já foram aprovadas (movidas para Projetos)
    if (approvedTasks.has(task.id)) return false;

    // 1. Filtro Fixo/Hardcoded: Mostrar APENAS demandas da Raissa, Ingrid e Kaique
    const rawLogin = task.rawData?.ownerUserLogin || task.rawData?.OwnerUserLogin || task.assigneeLogin || '';
    const login = rawLogin.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const isTechOwner = login.includes('ingrid') || login.includes('raissa') || login.includes('kaique');
    
    if (!isTechOwner) return false;

    // 2. Filtro de Busca (Title, Client, TaskID)
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

    // 4. Filtro de Projeto (Job) Mapeado contra JobID do RAW
    if (filterProject) {
       const jID = task.rawData?.jobID || task.rawData?.JobID;
       if (jID && jID.toString() !== filterProject) return false;
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

  const handleApprove = (task: KanbanTask) => {
    const savedInternal = localStorage.getItem('f2f_internal_projects');
    let existing = [];
    if (savedInternal) {
       try { existing = JSON.parse(savedInternal); } catch (e) {}
    }
    
    // Adiciona apenas se já não existir
    if (!existing.some((t: any) => t.id === task.id)) {
       existing.push({ ...task, column: 'todo', internalStatus: 'A Fazer' });
       localStorage.setItem('f2f_internal_projects', JSON.stringify(existing));
    }
    
    // Esconder da UI
    setApprovedTasks(prev => {
       const next = new Set(prev);
       next.add(task.id);
       return next;
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterClient('');
    setFilterProject('');
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

            {/* Por Empresa (Usando ClientNickName como valor de busca) */}
            <select className={styles.filterSelect} value={filterClient} onChange={(e) => setFilterClient(e.target.value)}>
              <option value="">Por empresa</option>
              {clientsData.sort((a:any, b:any) => a.ClientName.localeCompare(b.ClientName)).map((c: any) => 
                 <option key={c.ClientID} value={c.ClientNickName}>{c.ClientName}</option>
              )}
            </select>
            {/* Por Projeto */}
            <select className={styles.filterSelect} value={filterProject} onChange={(e) => setFilterProject(e.target.value)}>
              <option value="">Por projeto</option>
              {jobsData.sort((a:any, b:any) => a.JobDisplayTitle.localeCompare(b.JobDisplayTitle)).map((j: any) => 
                 <option key={j.JobID} value={j.JobID}>{j.JobDisplayTitle}</option>
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
          {/* Métricas como as do screenshot */}
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

          {/* Tabela de Listagem */}
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
              // Determina cores das tags
              const reqBadge = task.rawData?.requestTypeAcronym ? `[${task.rawData?.requestTypeAcronym}]` : '[TEC]';
              const reqName = task.rawData?.requestTypeName || 'Solicitação de Tecnologia';
              const jobTitle = task.rawData?.jobTitle || task.rawData?.JobTitle || task.client;
              const isLate = new Date(task.dueDate) < new Date();
              const datePillClass = `${styles.datePill} ${!isLate ? styles.onTime : ''}`;

              return (
                <div key={task.id} style={{textDecoration: 'none', color: 'inherit'}}>
                  <div className={styles.taskRow} onClick={() => window.location.href = `/taskrow/task/${task.id}`}>
                    {/* 1. Tarefa */}
                    <div className={styles.cellCol}>
                      <div className={styles.cellTitle}>
                        <GitPullRequest size={14} style={{color:'var(--text-secondary)'}}/>
                        {task.id.replace('TR-','#')} | {task.title}
                      </div>
                      <div className={styles.cellSubtitle}>
                         {task.id} {task.title}
                      </div>
                    </div>

                    {/* 2. Empresa / Projeto */}
                    <div className={styles.cellCol}>
                      <div className={styles.cellTitle}>{task.client}</div>
                      <div className={styles.cellSubtitle}>#{task.rawData?.jobNumber || task.rawData?.JobNumber || '00'} {jobTitle}</div>
                    </div>

                    {/* 3. Solicitação */}
                    <div className={styles.cellCol}>
                      <div className={styles.cellTitle}>
                        <span style={{color: '#f59e0b', marginRight: 4}}>{reqBadge}</span> {reqName}
                      </div>
                      <div className={styles.cellSubtitle}>
                        {task.tags.join(', ')}
                      </div>
                    </div>

                    {/* 4. Reponsável / Prioridade */}
                    <div className={styles.cellCol}>
                      <div className={styles.cellTitle}>
                         {task.rawData?.ownerUserLogin || task.assigneeLogin}
                      </div>
                      <div className={styles.cellSubtitle}>
                         Tecnologia  
                         <span className={getPriorityClass(task.priority)} style={{display: 'inline-block', width: 8, height: 8, borderRadius: '50%', marginLeft: 8}}></span>
                      </div>
                    </div>

                    {/* 5. Fase / Etapa */}
                    <div className={styles.cellCol}>
                      <div className={styles.cellTitle} style={{fontWeight: 500}}>
                         {task.statusOriginal}
                      </div>
                    </div>

                    {/* 6. Prazo */}
                    <div className={styles.cellCol}>
                      <div className={datePillClass}>
                        {new Date(task.dueDate).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                      </div>
                    </div>

                    {/* 7. Ação */}
                    <div className={styles.cellCol}>
                       <button 
                          className={styles.approveBtn} 
                          onClick={(e) => { e.stopPropagation(); handleApprove(task); }}
                          title="Aprovar para Início e mover para Meus Projetos"
                        >
                          <CheckCircle size={14} /> Aprovar
                        </button>
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
