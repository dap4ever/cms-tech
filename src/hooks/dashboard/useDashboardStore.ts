'use client';

import { useState, useEffect } from 'react';

// --- Types ---

export interface QCAdjustment {
  id: number;
  title: string;
  desc: string;
  done: boolean;
  img: string | null;
}

export interface QCTopic {
  id: number;
  name: string;
  open: boolean;
  ajustes: QCAdjustment[];
}

export interface QCClient {
  id: string;
  name: string;
  color: string;
  obs: string;
  topicos: QCTopic[];
}

export interface PlanningItem {
  id: number;
  cat: string;
  pri: string;
  title: string;
  desc: string;
  dur: string;
  tri: string;
  status: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  color: string;
  status: string;
  turno: string;
  cls: string;
}

export interface Period {
  id: number;
  icon: string;
  title: string;
  plantao: string[];
  folga: string[];
  notas: string[];
}

export interface HoursEntry {
  ms: number;
  tasks: { name: string; ms: number }[];
}

export type HoursData = Record<string, HoursEntry>;

// --- Constants ---

const STORAGE_KEYS = {
  QC_CLIENTS: 'hub-clients',
  PLANNING: 'hub-mel',
  TEAM: 'hub-eq',
  PERIODS: 'hub-per',
  HOURS: 'hub-dash-data', // Prefix for dash-data-{month}
};

const DEFAULT_CLIENTS: QCClient[] = [
  { id: 'AL', name: 'Alares', color: '#6366f1', obs: '', topicos: [] },
  { id: 'CH', name: 'Chegolá', color: '#0891b2', obs: '', topicos: [] },
  { id: 'AB', name: 'Abrafati', color: '#059669', obs: '', topicos: [] },
  { id: 'F2', name: 'F2F', color: '#d97706', obs: '', topicos: [] },
  { id: 'MD', name: 'Medtronic', color: '#dc2626', obs: '', topicos: [] },
  { id: 'MZ', name: 'Merz', color: '#7c3aed', obs: '', topicos: [] },
  { id: 'GE', name: 'GE Healthcare', color: '#db2777', obs: '', topicos: [] },
  { id: 'TR', name: 'Torrent', color: '#2563eb', obs: '', topicos: [] },
  { id: 'DV', name: 'Diversihub', color: '#0f766e', obs: '', topicos: [] },
];

const DEFAULT_PLANNING: PlanningItem[] = [
  { id: 1, cat: 'IA & Chatbot', pri: 'Prioridade Alta', title: 'Chatbot para suporte rápido', desc: 'Chatbot inteligente para dúvidas sobre demandas.', dur: '2 meses', tri: 'Q2 2026', status: 'Backlog' },
  { id: 2, cat: 'IA & Chatbot', pri: 'Prioridade Alta', title: 'IA para validação de briefing', desc: 'Sistema que valida briefings e identifica informações faltantes.', dur: '3 meses', tri: 'Q2 2026', status: 'Backlog' },
  { id: 3, cat: 'Automação', pri: 'Prioridade Alta', title: 'Automação de relatórios mensais', desc: 'Pipeline automatizado para relatórios de performance.', dur: '6 semanas', tri: 'Q1 2026', status: 'Backlog' },
  { id: 4, cat: 'Treinamento', pri: 'Prioridade Média', title: 'Capacitação em IA', desc: 'Trilha de aprendizado sobre ferramentas de IA.', dur: '3 meses', tri: 'Q2 2026', status: 'Backlog' },
  { id: 5, cat: 'DevOps', pri: 'Prioridade Alta', title: 'CI/CD para todos os projetos', desc: 'Pipelines de integração e entrega contínua.', dur: '2 meses', tri: 'Q1 2026', status: 'Backlog' },
  { id: 6, cat: 'Infraestrutura', pri: 'Prioridade Alta', title: 'Migração cloud nativa', desc: 'Migração gradual para arquitetura cloud nativa.', dur: '6 meses', tri: 'Q3 2026', status: 'Backlog' }
];

// --- Hook ---

export function useDashboardStore() {
  const [clients, setClients] = useState<QCClient[]>([]);
  const [planning, setPlanning] = useState<PlanningItem[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load Initial Data
  useEffect(() => {
    const savedClients = localStorage.getItem(STORAGE_KEYS.QC_CLIENTS);
    const savedPlanning = localStorage.getItem(STORAGE_KEYS.PLANNING);
    const savedTeam = localStorage.getItem(STORAGE_KEYS.TEAM);
    const savedPeriods = localStorage.getItem(STORAGE_KEYS.PERIODS);

    // QC Clients mapping with default if not all exist
    let finalClients = savedClients ? JSON.parse(savedClients) : [];
    if (finalClients.length === 0) {
        finalClients = DEFAULT_CLIENTS;
    } else {
        // Enforce the default clients exist
        DEFAULT_CLIENTS.forEach(def => {
            if (!finalClients.find((c: QCClient) => c.id === def.id)) {
                finalClients.push(def);
            }
        });
    }

    setClients(finalClients);
    setPlanning(savedPlanning ? JSON.parse(savedPlanning) : DEFAULT_PLANNING);
    setTeam(savedTeam ? JSON.parse(savedTeam) : []);
    setPeriods(savedPeriods ? JSON.parse(savedPeriods) : []);
    setIsLoaded(true);
  }, []);

  // Persist Changes
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem(STORAGE_KEYS.QC_CLIENTS, JSON.stringify(clients));
  }, [clients, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem(STORAGE_KEYS.PLANNING, JSON.stringify(planning));
  }, [planning, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem(STORAGE_KEYS.TEAM, JSON.stringify(team));
  }, [team, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem(STORAGE_KEYS.PERIODS, JSON.stringify(periods));
  }, [periods, isLoaded]);

  // Actions
  const updateClient = (updated: QCClient) => {
    setClients(prev => prev.map(c => c.id === updated.id ? updated : c));
  };

  const addPlanningItem = (item: PlanningItem) => {
    setPlanning(prev => [item, ...prev]);
  };

  const updatePlanningItem = (item: PlanningItem) => {
    setPlanning(prev => prev.map(p => p.id === item.id ? item : p));
  };

  const deletePlanningItem = (id: number) => {
    setPlanning(prev => prev.filter(p => p.id !== id));
  };

  const addTeamMember = (m: TeamMember) => {
    setTeam(prev => [...prev, m]);
  };

  const updateTeamMember = (m: TeamMember) => {
    setTeam(prev => prev.map(item => item.id === m.id ? m : item));
  };

  const deleteTeamMember = (id: string) => {
    setTeam(prev => prev.filter(m => m.id !== id));
  };

  const addPeriod = (p: Period) => {
    setPeriods(prev => [...prev, p]);
  };

  const deletePeriod = (id: number) => {
    setPeriods(prev => prev.filter(p => p.id !== id));
  };

  const updatePeriod = (p: Period) => {
    setPeriods(prev => prev.map(item => item.id === p.id ? p : item));
  };

  return {
    clients,
    planning,
    team,
    periods,
    isLoaded,
    updateClient,
    addPlanningItem,
    updatePlanningItem,
    deletePlanningItem,
    addTeamMember,
    updateTeamMember,
    deleteTeamMember,
    addPeriod,
    updatePeriod,
    deletePeriod
  };
}
