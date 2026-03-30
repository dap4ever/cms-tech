"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  CheckCircle2,
  TrendingUp,
  Users, 
  FileText, 
  Inbox,
  Shield,
  Settings,
  GitPullRequest,
  Eye,
  EyeOff,
  LogOut,
  X
} from 'lucide-react';
import styles from './Sidebar.module.css';
import { useAuth } from '@/context/AuthContext';
import { AvatarUploader } from '@/components/user/AvatarUploader';

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

export function Sidebar({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
   const { user, isGestor, isAdmin, logout } = useAuth();
  const [hiddenItems, setHiddenItems] = useState<string[]>([]);
  const [isManaging, setIsManaging] = useState(false);
  
  useEffect(() => {
    fetch('/api/settings/sidebar')
      .then(res => res.json())
      .then(data => {
        if (data.hiddenSidebarItems) setHiddenItems(data.hiddenSidebarItems);
      })
      .catch(console.error);
  }, []);

  const toggleVisibility = async (route: string) => {
    const newHidden = hiddenItems.includes(route)
      ? hiddenItems.filter(r => r !== route)
      : [...hiddenItems, route];
    
    setHiddenItems(newHidden);
    
    try {
      const res = await fetch('/api/settings/sidebar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hiddenSidebarItems: newHidden })
      });
      if (!res.ok) throw new Error('Falha no servidor');
    } catch (err) {
      console.error('Failed to save sidebar visibility');
      alert('Atenção: Não foi possível salvar a visibilidade. Verifique se o servidor foi reiniciado após a migração do banco.');
    }
  };

  // Função para pegar as iniciais do nome
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const isPowerUser = isAdmin || isGestor;
  const allowedForBasicUser = ['Projetos', 'Relatórios', 'Equipe'];

  const filteredNavItems = navItems.filter(item => {
    // Se não for Admin nem Gestor, vê apenas o básico solicitado
    if (!isPowerUser && !allowedForBasicUser.includes(item.name)) {
      return false;
    }

    // 1. Regra de Role (Usuários só Gestor/Gerente)
    if (item.name === 'Usuários' && !isAdmin) {
      return false;
    }
    // 2. Regra de visibilidade global (exceto para o Gestor em modo edição)
    if (hiddenItems.includes(item.route) && !isManaging) {
      return false;
    }
    return true;
  });

  return (
    <aside className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''}`}>
      <div className={styles.logoContainer}>
        <img src="/logo-f2f.png" alt="F2F CMS" className={styles.logoImage} />
        <button className={styles.closeBtn} onClick={onClose} aria-label="Fechar menu">
          <X size={20} />
        </button>
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
                  className={`${styles.navItem} ${isActive ? styles.active : ''} ${hiddenItems.includes(item.route) ? styles.itemHidden : ''}`}
                >
                  <Icon className={styles.navIcon} strokeWidth={isActive ? 2.5 : 2} />
                  <span>{item.name}</span>
                  {isManaging && (
                    <button 
                      className={styles.toggleVisibilityBtn}
                      onClick={(e) => { e.preventDefault(); toggleVisibility(item.route); }}
                    >
                      {hiddenItems.includes(item.route) ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {isGestor && (
        <div className={styles.manageContainer}>
          <button 
            className={`${styles.manageBtn} ${isManaging ? styles.activeManageBtn : ''}`}
            onClick={() => setIsManaging(!isManaging)}
            title={isManaging ? "Sair da Edição" : "Configurar Visibilidade do Menu"}
          >
            <Settings size={18} />
            <span>{isManaging ? "Finalizar Edição" : "Editar Menu"}</span>
          </button>
        </div>
      )}

      <div className={styles.userProfile}>
        <div className={styles.avatar}>
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} className={styles.avatarImg} />
          ) : (
            user ? getInitials(user.name) : '...'
          )}
          <AvatarUploader />
        </div>
        <div className={styles.userInfo}>
          <span className={styles.userName}>{user?.name || 'Carregando...'}</span>
          <span className={styles.userRole}>{user?.roles?.join(', ') || 'Aguardando...'}</span>
        </div>
        <button
          className={styles.logoutBtn}
          onClick={logout}
          title="Sair do sistema"
          aria-label="Sair"
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}
