'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { 
  User, 
  Lock, 
  Camera, 
  Save, 
  Loader2, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import styles from './profile.module.css';

export default function ProfilePage() {
  const { user, login } = useAuth();
  
  // States para Dados Básicos
  const [name, setName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [basicLoading, setBasicLoading] = useState(false);
  const [basicMessage, setBasicMessage] = useState({ type: '', text: '' });

  // States para Senha
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passLoading, setPassLoading] = useState(false);
  const [passMessage, setPassMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (user) {
      setName(user.name);
      setAvatarUrl(user.avatarUrl || '');
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setBasicLoading(true);
    setBasicMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, avatarUrl }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao atualizar perfil');

      // Atualiza o contexto global
      login(data);
      setBasicMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
    } catch (err: any) {
      setBasicMessage({ type: 'error', text: err.message });
    } finally {
      setBasicLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPassMessage({ type: 'error', text: 'As senhas não coincidem' });
      return;
    }

    setPassLoading(true);
    setPassMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/user/profile/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao alterar senha');

      setPassMessage({ type: 'success', text: 'Senha alterada com sucesso!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPassMessage({ type: 'error', text: err.message });
    } finally {
      setPassLoading(false);
    }
  };

  const getInitials = (n: string) => n.split(' ').map(i => i[0]).join('').toUpperCase().substring(0, 2);

  if (!user) return null;

  return (
    <div className={styles.profileContainer}>
      <header className={styles.titleSection}>
        <h1 className={styles.title}>Meu Perfil</h1>
        <p className={styles.subtitle}>Gerencie suas informações pessoais e segurança da conta</p>
      </header>

      <div className={styles.grid}>
        {/* Card de Informações Básicas */}
        <section className={styles.card}>
          <h2 className={styles.sectionTitle}><User size={20} /> Dados Pessoais</h2>
          
          <form onSubmit={handleUpdateProfile} className={styles.formContainer}>
            <div className={styles.avatarContainer}>
              <div className={styles.avatarBig}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt={name} className={styles.avatarImg} />
                ) : (
                  getInitials(name)
                )}
              </div>
              <div className={styles.formGroup} style={{ width: '100%', maxWidth: '400px' }}>
                <label className={styles.label}>URL da Foto (Avatar)</label>
                <input 
                  type="text" 
                  className={styles.input} 
                  placeholder="https://exemplo.com/foto.jpg"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Nome Completo</label>
                <input 
                  type="text" 
                  className={styles.input} 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required 
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Email (Não alterável)</label>
                <input 
                  type="email" 
                  className={styles.input} 
                  value={user.email} 
                  disabled 
                  style={{ opacity: 0.6 }}
                />
              </div>
            </div>

            {basicMessage.text && (
              <div className={`${styles.alert} ${basicMessage.type === 'success' ? styles.alertSuccess : styles.alertError}`}>
                <div className={styles.alertIcon}>
                  {basicMessage.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                </div>
                {basicMessage.text}
              </div>
            )}

            <button type="submit" className={styles.submitBtn} disabled={basicLoading}>
              {basicLoading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Salvar Alterações
            </button>
          </form>
        </section>

        {/* Card de Senha */}
        <section className={styles.card}>
          <h2 className={styles.sectionTitle}><Lock size={20} /> Segurança</h2>
          
          {user.mustChangePassword && (
            <div className={`${styles.alert} ${styles.alertError}`}>
              <div className={styles.alertIcon}>
                <AlertCircle size={20} />
              </div>
              <div>
                <strong>Troca Obrigatória:</strong> Identificamos que este é seu primeiro acesso ou sua senha precisa ser atualizada por segurança. Por favor, escolha uma nova senha forte.
              </div>
            </div>
          )}
          
          <form onSubmit={handleChangePassword} className={styles.formContainer}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Senha Atual</label>
              <input 
                type="password" 
                className={styles.input} 
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required 
                placeholder="Digite sua senha atual"
              />
            </div>

            <div className={styles.fieldRow}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Nova Senha</label>
                <input 
                  type="password" 
                  className={styles.input} 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required 
                  placeholder="Mínimo 8 caracteres"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Confirmar Nova Senha</label>
                <input 
                  type="password" 
                  className={styles.input} 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required 
                  placeholder="Repita a nova senha"
                />
              </div>
            </div>

            {passMessage.text && (
              <div className={`${styles.alert} ${passMessage.type === 'success' ? styles.alertSuccess : styles.alertError}`}>
                <div className={styles.alertIcon}>
                  {passMessage.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                </div>
                {passMessage.text}
              </div>
            )}

            <button type="submit" className={styles.submitBtn} disabled={passLoading}>
              {passLoading ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />}
              Atualizar Senha
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
