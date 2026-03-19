"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  CheckCircle2,
  TrendingUp,
  Users, 
  FileText, 
  Inbox,
  Shield,
  Settings,
  GitPullRequest
} from 'lucide-react';
import styles from './Sidebar.module.css';
import { useAuth } from '@/context/AuthContext';

const navItems = [
  { name: 'Dashboard', route: '/dashboard', icon: LayoutDashboard },
  { name: 'Quality Check', route: '/quality-check', icon: CheckCircle2 },
  { name: 'Planejamento', route: '/planning', icon: TrendingUp },
  { name: 'Projetos', route: '/projects', icon: GitPullRequest },
  { name: 'Relatórios', route: '/reports', icon: FileText },
  { name: 'Equipe', route: '/teams', icon: Users },
  { name: 'Usuários', route: '/dashboard/users', icon: Shield },
  { name: 'Caixa de Entrada', route: '/taskrow', icon: Inbox },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  // Função para pegar as iniciais do nome
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const filteredNavItems = navItems.filter(item => {
    if (item.name === 'Usuários') {
      return user?.role === 'GESTOR' || user?.role === 'ADMINISTRADOR';
    }
    return true;
  });

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
          {filteredNavItems.map((item) => {
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
        <div className={styles.avatar}>
          {user ? getInitials(user.name) : '...'}
        </div>
        <div className={styles.userInfo}>
          <span className={styles.userName}>{user?.name || 'Carregando...'}</span>
          <span className={styles.userRole}>{user?.role || 'Aguardando...'}</span>
        </div>
      </div>
    </aside>
  );
}
