"use client";

import { Search, Bell, Plus } from 'lucide-react';
import styles from './Topbar.module.css';

export function Topbar() {
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
        <button className={styles.iconButton} aria-label="Criar novo">
          <Plus size={20} />
        </button>
        <button className={`${styles.iconButton} ${styles.notificationBadge}`} aria-label="Notificações">
          <Bell size={20} />
          <span className={styles.badge}></span>
        </button>
      </div>
    </header>
  );
}
