import { Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { UserAvatarUpload } from './UserAvatarUpload';

export const AppHeader = ({ title }: { title: string }) => {
  const { user } = useAuth();
  const initials = user?.name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?';

  return (
    <header className="h-14 border-b border-border flex items-center justify-between px-6 bg-background/80 backdrop-blur-sm sticky top-0 z-20">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground hidden sm:block">{user?.name}</span>
          <UserAvatarUpload />
        </div>
      </div>
    </header>
  );
};
