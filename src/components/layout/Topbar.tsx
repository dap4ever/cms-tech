"use client";

import { Search, Bell, Plus, LogOut, User } from 'lucide-react';
import Link from 'next/link';
import styles from './Topbar.module.css';
import { useAuth } from '@/context/AuthContext';

export function Topbar() {
  const { user, logout } = useAuth();

  return (
    <header className={styles.topbar}>
      <div className={styles.searchContainer}>
        <Search className={styles.searchIcon} size={18} />
        <input 
          type="text" 
          placeholder="Busque por PRs, projetos, tickets..." 
          className={styles.searchInput}
        />
      </div>

      <div className={styles.actions}>
        <Link href="/profile" className={styles.userInfo}>
          <div className={styles.rolesSection}>
            <span className={styles.userName}>{user?.name}</span>
            <span className={styles.userRole}>{user?.roles?.join(', ')}</span>
          </div>
          <div className={styles.avatar}>
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} className={styles.avatarImg} />
            ) : (
              user?.name ? user.name.split(' ').map(i => i[0]).join('').toUpperCase().substring(0, 2) : '...'
            )}
          </div>
        </Link>

        <button className={styles.iconButton} aria-label="Criar novo">
          <Plus size={20} />
        </button>
        <button className={`${styles.iconButton} ${styles.notificationBadge}`} aria-label="Notificações">
          <Bell size={20} />
          <span className={styles.badge}></span>
        </button>
        <button 
          className={`${styles.iconButton} ${styles.logoutButton}`} 
          aria-label="Sair"
          onClick={logout}
          title="Sair do sistema"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}
