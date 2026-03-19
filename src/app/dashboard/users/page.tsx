'use client';

import React from 'react';
import { UserSection } from '@/components/dashboard/UserSection';
import { Sidebar } from '@/components/layout/Sidebar';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function UsersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && user && user.role !== 'GESTOR' && user.role !== 'ADMINISTRADOR') {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) return null;
  if (!user || (user.role !== 'GESTOR' && user.role !== 'ADMINISTRADOR')) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-main)' }}>
      <Sidebar />
      <div style={{ flex: 1, padding: '32px' }}>
        <header style={{ marginBottom: '32px' }}>
           <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Gestão de Usuários</h1>
           <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Administração de acessos e permissões do sistema</p>
        </header>
        
        <UserSection />
      </div>
    </div>
  );
}
