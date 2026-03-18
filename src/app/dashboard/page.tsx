'use client';

import React, { useState } from 'react';
import { 
  CheckCircle2, 
  TrendingUp, 
  Users, 
  FileText, 
  Clock,
  LayoutDashboard
} from 'lucide-react';
import styles from './dashboard.module.css';
import { QCSection } from '../../components/dashboard/QCSection';
import { PlanningSection } from '../../components/dashboard/PlanningSection';
import { TeamSection } from '../../components/dashboard/TeamSection';
import { ReportingSection } from '../../components/dashboard/ReportingSection';
import { HoursSection } from '../../components/dashboard/HoursSection';

type TabType = 'qc' | 'planning' | 'team' | 'reports' | 'hours';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('hours');

  const tabs = [
    { id: 'hours', label: 'Horas', icon: Clock },
    { id: 'qc', label: 'Quality Check', icon: CheckCircle2 },
    { id: 'planning', label: 'Planejamento', icon: TrendingUp },
    { id: 'team', label: 'Equipe', icon: Users },
    { id: 'reports', label: 'Relatórios', icon: FileText },
  ];

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.pageHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className={styles.iconWrapper}>
            <LayoutDashboard size={24} />
          </div>
          <div>
            <h1 className={styles.pageTitle}>Dashboard Central</h1>
            <p className={styles.pageSubtitle}>Gestão de atividades, equipe e performance CMS Tech</p>
          </div>
        </div>
      </header>

      <nav className={styles.tabNav}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`${styles.tabLink} ${activeTab === tab.id ? styles.activeTab : ''}`}
              onClick={() => setActiveTab(tab.id as TabType)}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </nav>

      <div className={styles.tabContent}>
        {activeTab === 'hours' && <HoursSection />}
        {activeTab === 'qc' && <QCSection />}
        {activeTab === 'planning' && <PlanningSection />}
        {activeTab === 'team' && <TeamSection />}
        {activeTab === 'reports' && <ReportingSection />}
      </div>

      <style jsx>{`
        .dashboardContainer {
          padding: 2px;
          animation: fadeIn 0.4s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .pageSubtitle {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }
        .iconWrapper {
          background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 4px 12px rgba(122, 106, 177, 0.3);
        }
        .tabNav {
          display: flex;
          gap: 8px;
          border-bottom: 1px solid var(--border-color);
          margin-bottom: 32px;
          padding-bottom: 2px;
          overflow-x: auto;
          scrollbar-width: none;
        }
        .tabNav::-webkit-scrollbar { display: none; }
        .tabLink {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-secondary);
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .tabLink:hover {
          color: var(--text-primary);
          background: var(--bg-surface-hover);
          border-radius: 8px 8px 0 0;
        }
        .activeTab {
          color: var(--accent-primary);
          border-bottom-color: var(--accent-primary);
        }
        .tabContent {
          min-height: 500px;
        }
      `}</style>
    </div>
  );
}
