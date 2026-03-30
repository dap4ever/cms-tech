'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './login.module.css';
import { LogIn, Loader2, AlertCircle, UserX, ShieldOff, KeyRound } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';

type ErrorCode = 'USER_NOT_FOUND' | 'USER_BLOCKED' | 'WRONG_PASSWORD' | 'GENERIC';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState<ErrorCode | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    setErrorCode(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textError = await res.text();
        console.error('Non-JSON response:', textError);
        setErrorCode('GENERIC');
        throw new Error('Erro no servidor: o banco de dados pode estar fora do ar ou mal configurado.');
      }

      const data = await res.json();

      if (!res.ok) {
        setErrorCode(data.code || 'GENERIC');
        throw new Error(data.error || 'Falha ao entrar');
      }

      login(data.user);
      router.push('/taskrow');
      router.refresh();
    } catch (err: any) {
      const msg = err.message.includes('Unexpected token')
        ? 'Erro de comunicação com o banco de dados. Verifique a conexão.'
        : err.message;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.header}>
          <img src="/logo-f2f.png" alt="F2F CMS" className={styles.logoImg} />
          <p className={styles.subtitle}>Gestão de Tecnologia</p>
        </div>

        {error && (
          <div className={`${styles.error} ${errorCode === 'USER_BLOCKED' ? styles.errorBlocked : ''}`}>
            {errorCode === 'USER_NOT_FOUND' && <UserX size={18} />}
            {errorCode === 'USER_BLOCKED' && <ShieldOff size={18} />}
            {errorCode === 'WRONG_PASSWORD' && <KeyRound size={18} />}
            {(!errorCode || errorCode === 'GENERIC') && <AlertCircle size={18} />}
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="email">Email</label>
            <input
              className={styles.input}
              type="email"
              id="email"
              placeholder="exemplo@cms.tech"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="password">Senha</label>
            <input
              className={styles.input}
              type="password"
              id="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            className={styles.loginButton} 
            type="submit" 
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Entrando...
              </>
            ) : (
              <>
                <LogIn size={20} />
                Entrar no Sistema
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
