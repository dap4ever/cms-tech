"use client";

import { Search, Bell, Plus, LogOut, User } from 'lucide-react';
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
        <div className={styles.userInfo}>
          <User size={18} className={styles.userIcon} />
          <span className={styles.userName}>{user?.name || 'Carregando...'}</span>
          <span className={styles.userRole}>{user?.role}</span>
        </div>

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
