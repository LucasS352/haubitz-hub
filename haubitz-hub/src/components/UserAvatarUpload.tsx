import React from 'react';
import { Camera } from 'lucide-react';
import { FileUploader } from './FileUploader';
import api from '@/lib/api';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export const UserAvatarUpload = () => {
  const { user } = useAuth();
  
  const getFullUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    return apiBase.replace('/api', '') + url;
  };

  const handleUploadSuccess = async (url: string) => {
    try {
      await api.put(`/users/${user?.id}`, { avatar: url });
      
      // Atualiza o usuário no localStorage e no context
      const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = { ...savedUser, avatar: url };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      toast.success('Foto de perfil atualizada!');
      // Recarrega a página para atualizar o contexto (simples e eficaz para o Kayke)
      window.location.reload();
    } catch (error) {
      toast.error('Erro ao atualizar foto de perfil');
    }
  };

  const initials = user?.name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?';

  return (
    <div className="relative group">
      <div className="h-9 w-9 rounded-full overflow-hidden border border-border bg-muted flex items-center justify-center cursor-pointer">
        {user?.avatar ? (
          <img src={getFullUrl(user.avatar)} alt={user.name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full gradient-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground">
            {initials}
          </div>
        )}
        
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <FileUploader
            onUploadSuccess={handleUploadSuccess}
            label=""
            accept="image/*"
            variant="avatar"
          />
        </div>
      </div>
      <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground p-0.5 rounded-full border border-background shadow-sm">
        <Camera className="h-2 w-2" />
      </div>
    </div>
  );
};
