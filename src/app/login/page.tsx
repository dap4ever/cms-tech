'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './login.module.css';
import { LogIn, Loader2, AlertCircle } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      // Se a resposta não for JSON, pegamos o texto para entender o erro
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textError = await res.text();
        console.error('Non-JSON response:', textError);
        throw new Error('Erro no servidor: O banco de dados pode estar fora do ar ou mal configurado.');
      }

      const data = await res.json();

      if (!res.ok) {
        const errorMessage = data.details 
          ? `${data.error}: ${data.details}` 
          : (data.error || 'Falha ao entrar');
        throw new Error(errorMessage);
      }

      // Sucesso! Atualiza o estado global e redireciona
      login(data.user);
      router.push('/taskrow');
      router.refresh();
    } catch (err: any) {
      // Melhora a mensagem de erro para o usuário
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
          <span className={styles.logo}>DevCMS</span>
          <p className={styles.subtitle}>Gestão de Desenvolvedores v0.1</p>
        </div>

        {error && (
          <div className={styles.error}>
            <AlertCircle size={18} />
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
