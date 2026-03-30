'use client';

import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { SkillsModal } from '@/components/user/SkillsModal';
import { useAuth } from '@/context/AuthContext';
import styles from '../../app/layout.module.css';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, updateUser } = useAuth();

  const needsSkillSetup =
    !isLoginPage &&
    user &&
    user.roles?.includes('DESENVOLVEDOR') &&
    (user as any).firstAccessDone === false;

  if (isLoginPage) {
    return <main>{children}</main>;
  }

  return (
    <div className={styles.appContainer}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {sidebarOpen && (
        <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />
      )}
      <div className={styles.mainContent}>
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className={styles.pageContent}>
          {children}
        </main>
      </div>
      {needsSkillSetup && (
        <SkillsModal
          onComplete={(skills) => updateUser({ skills, firstAccessDone: true } as any)}
        />
      )}
    </div>
  );
}
