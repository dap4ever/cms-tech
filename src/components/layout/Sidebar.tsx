"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  KanbanSquare, 
  GitPullRequest, 
  Users, 
  FileText, 
  BarChart2, 
  Settings
} from 'lucide-react';
import styles from './Sidebar.module.css';

const navItems = [
  { name: 'Dashboard', route: '/dashboard', icon: LayoutDashboard },
  { name: 'Projetos', route: '/projects', icon: KanbanSquare },
  { name: 'Repositórios', route: '/repos', icon: GitPullRequest },
  { name: 'Times', route: '/teams', icon: Users },
  { name: 'Docs', route: '/docs', icon: FileText },
  { name: 'Métricas', route: '/metrics', icon: BarChart2 },
  { name: 'Config', route: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoContainer}>
        <div className={styles.logoIcon}>
          <div className={styles.f2fLogoMark}>2</div>
        </div>
        <div className={styles.logoTextWrapper}>
          <span className={styles.logoText}>F2F CMS</span>
          <span className={styles.logoSubtext}>POWERED BY AI</span>
        </div>
      </div>

      <div className={styles.navGroup}>
        <span className={styles.navTitle}>Menu Principal</span>
        <ul className={styles.navList}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.route);
            return (
              <li key={item.route}>
                <Link 
                  href={item.route} 
                  className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                >
                  <Icon className={styles.navIcon} strokeWidth={isActive ? 2.5 : 2} />
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <div className={styles.userProfile}>
        <div className={styles.avatar}>JD</div>
        <div className={styles.userInfo}>
          <span className={styles.userName}>João Dev</span>
          <span className={styles.userRole}>Tech Lead</span>
        </div>
      </div>
    </aside>
  );
}
