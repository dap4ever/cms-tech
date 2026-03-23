'use client';

import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  Mail, 
  Trash2, 
  Shield, 
  Search,
  RefreshCcw,
  CheckCircle2,
  AlertCircle,
  User as UserIcon,
  ChevronRight
} from 'lucide-react';
import { getUsers, createUser, deleteUser } from '@/actions/users';
import styles from './dashboard-premium.module.css';

export function UserSection() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    roles: ['DESENVOLVEDOR'] as string[]
  });

  const loadUsers = async () => {
    setLoading(true);
    const data = await getUsers();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const res = await createUser(formData);
    
    if (res.success) {
      setMessage({ type: 'success', text: 'Usuário criado com sucesso!' });
      setFormData({ name: '', email: '', roles: ['DESENVOLVEDOR'] });
      loadUsers();
    } else {
      setMessage({ type: 'error', text: res.error || 'Erro ao criar usuário.' });
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Deseja realmente remover o usuário ${name}?`)) {
      const res = await deleteUser(id);
      if (res.success) {
        loadUsers();
      } else {
        alert(res.error);
      }
    }
  };

  return (
    <div className={styles.premiumContainer} style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '24px' }}>
      
      {/* Coluna Esquerda: Formulário de Criação */}
      <aside>
        <div className={styles.glassCard} style={{ padding: '24px', position: 'sticky', top: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
             <div style={{ padding: '10px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-primary)' }}>
                <UserPlus size={20} />
             </div>
             <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Novo Usuário</h2>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
             <div className="inputGroup">
                <label>Nome Completo</label>
                <input 
                  className={styles.premiumInput} 
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Danilo Alves"
                />
             </div>

             <div className="inputGroup">
                <label>E-mail Corporativo</label>
                <input 
                  className={styles.premiumInput} 
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="danilo@agenciaf2f.com"
                />
             </div>

             <div className="inputGroup">
                <label>Níveis de Acesso</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                   {['GESTOR', 'ADMINISTRADOR', 'DESENVOLVEDOR'].map((r) => (
                      <label key={r} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.8rem', textTransform: 'none' }}>
                         <input 
                            type="checkbox"
                            checked={formData.roles.includes(r)}
                            onChange={(e) => {
                               const newRoles = e.target.checked 
                                  ? [...formData.roles, r]
                                  : formData.roles.filter(x => x !== r);
                               if (newRoles.length === 0 && r === 'DESENVOLVEDOR') return;
                               setFormData({ ...formData, roles: newRoles });
                            }}
                         />
                         {r.charAt(0) + r.slice(1).toLowerCase()}
                      </label>
                   ))}
                </div>
             </div>

             {message && (
                <div style={{ 
                   padding: '12px', 
                   borderRadius: '8px', 
                   background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                   color: message.type === 'success' ? 'var(--status-success)' : 'var(--status-error)',
                   fontSize: '0.8rem',
                   display: 'flex',
                   alignItems: 'center',
                   gap: '8px',
                   border: `1px solid ${message.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                }}>
                   {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                   {message.text}
                </div>
             )}

             <button 
                type="submit" 
                className={styles.premiumButton} 
                disabled={submitting}
                style={{ marginTop: '8px', width: '100%' }}
             >
                {submitting ? 'CRIANDO...' : 'CADASTRAR USUÁRIO'}
             </button>
          </form>

          <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '20px', textAlign: 'center', lineHeight: '1.4' }}>
             A senha padrão para novos usuários é <code style={{ color: 'var(--accent-primary)', fontWeight: 800 }}>Mudar@123</code>. 
             Eles deverão alterá-la no primeiro acesso.
          </p>
        </div>
      </aside>

      {/* Coluna Direita: Listagem de Usuários */}
      <main>
        <div className={styles.glassCard} style={{ padding: '0', overflow: 'hidden' }}>
          <header style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Usuários Ativos</h2>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Gerencie quem tem acesso ao dashboard</p>
             </div>
             <button className={styles.iconBtn} onClick={loadUsers} style={{ opacity: loading ? 0.5 : 1 }}>
                <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
             </button>
          </header>

          <div style={{ padding: '12px' }}>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Carregando usuários do banco...</div>
            ) : users.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Nenhum usuário cadastrado.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {users.map((user) => (
                  <div key={user.id} className={styles.userRow}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                       <div style={{ 
                          width: '40px', 
                          height: '40px', 
                          borderRadius: '10px', 
                          background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--text-secondary)',
                          border: '1px solid rgba(255,255,255,0.05)'
                       }}>
                          <UserIcon size={20} />
                       </div>
                       <div>
                          <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>{user.name}</h4>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                             <Mail size={12} />
                             {user.email}
                          </div>
                       </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                       <div style={{ textAlign: 'right' }}>
                          <span style={{ 
                             fontSize: '0.65rem', 
                             fontWeight: 800, 
                             textTransform: 'uppercase', 
                             color: 'var(--accent-secondary)',
                             background: 'rgba(99, 102, 241, 0.05)',
                             padding: '4px 8px',
                             borderRadius: '6px'
                          }}>
                             {user.roles && user.roles.length > 0 ? user.roles.join(', ') : 'Nenhum'}
                          </span>
                          <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                             Desde {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                          </p>
                       </div>
                       
                       <button 
                          className={styles.iconBtn} 
                          onClick={() => handleDelete(user.id, user.name)}
                          style={{ color: 'var(--status-error)', opacity: 0.6 }}
                       >
                          <Trash2 size={18} />
                       </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <style jsx>{`
        .inputGroup { display: flex; flex-direction: column; gap: 6px; }
        .inputGroup label { font-size: 0.65rem; font-weight: 800; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
