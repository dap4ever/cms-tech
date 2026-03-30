'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
  roles: ('GESTOR' | 'ADMINISTRADOR' | 'DESENVOLVEDOR')[];
  avatarUrl?: string;
  mustChangePassword?: boolean;
  firstAccessDone?: boolean;
  skills?: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (userData: User) => void;
  logout: () => Promise<void>;
  isGestor: boolean;
  isGerente: boolean;
  isDev: boolean;
  isAdmin: boolean;
  updateUser: (newData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Carregamento inicial rápido do localStorage para evitar flickering
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          
          // Redirecionamento preventivo se já soubermos que precisa mudar senha
          if (parsedUser.mustChangePassword && pathname !== '/profile' && pathname !== '/login') {
            router.push('/profile');
          }
        }

        // Validação real com o servidor
        const res = await fetch('/api/auth/me');
        
        if (res.ok) {
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await res.json();
            if (data.success && data.user) {
              setUser(data.user);
              localStorage.setItem('user', JSON.stringify(data.user));

              // Força troca de senha se necessário
              if (data.user.mustChangePassword && pathname !== '/profile' && pathname !== '/login') {
                router.push('/profile');
              }
            } else {
              setUser(null);
              localStorage.removeItem('user');
            }
          }
        } else if (res.status === 401 || res.status === 404) {
          // Usuário não existe mais ou sessão expirou
          setUser(null);
          localStorage.removeItem('user');
          if (pathname !== '/login') {
            router.push('/login');
          }
        }
      } catch (err) {
        console.error('Auth verification failed:', err);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [pathname, router]);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const updateUser = (newData: Partial<User>) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...newData };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      localStorage.removeItem('user');
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout failed');
    }
  };

  const isGestor = user?.roles?.includes('GESTOR') || (user as any)?.role === 'GESTOR' || false;
  const isGerente = user?.roles?.includes('ADMINISTRADOR') || (user as any)?.role === 'ADMINISTRADOR' || false;
  const isDev = user?.roles?.includes('DESENVOLVEDOR') || (user as any)?.role === 'DESENVOLVEDOR' || false;
  const isAdmin = isGestor || isGerente;

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isGestor, isGerente, isDev, isAdmin, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
