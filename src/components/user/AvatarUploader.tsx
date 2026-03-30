"use client";

import React, { useRef, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import styles from '@/components/layout/Sidebar.module.css';

export function AvatarUploader() {
  const { user, updateUser } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione uma imagem válida.');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      // 1. Upload do arquivo
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) throw new Error('Falha no upload da imagem');
      const uploadData = await uploadRes.json();
      const newAvatarUrl = uploadData.url;

      // 2. Atualizar perfil do usuário
      const profileRes = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarUrl: newAvatarUrl }),
      });

      if (!profileRes.ok) throw new Error('Falha ao atualizar perfil');
      const profileData = await profileRes.json();

      // 3. Atualizar contexto local
      updateUser({ avatarUrl: newAvatarUrl });
      
    } catch (err: any) {
      console.error(err);
      alert('Erro ao atualizar foto de perfil: ' + err.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className={styles.avatarUploaderOverlay}>
      <button 
        className={styles.uploadBtn} 
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        title="Alterar foto de perfil"
      >
        {isUploading ? <Loader2 size={16} className={styles.spinner} /> : <Camera size={16} />}
      </button>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        style={{ display: 'none' }} 
      />
    </div>
  );
}
