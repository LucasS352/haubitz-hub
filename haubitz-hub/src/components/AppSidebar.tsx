import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard, Building2, ClipboardList, Target, Users, LogOut, ChevronLeft, Menu
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/', roles: ['SUPERADMIN', 'ADMIN', 'SDR', 'CLOSER', 'COLLABORATOR'] },
  { label: 'Clientes', icon: Building2, path: '/clientes', roles: ['SUPERADMIN', 'ADMIN', 'COLLABORATOR'] },
  { label: 'Onboarding', icon: ClipboardList, path: '/onboarding', roles: ['SUPERADMIN', 'ADMIN', 'COLLABORATOR'] },
  { label: 'CRM', icon: Target, path: '/crm', roles: ['SUPERADMIN', 'ADMIN', 'SDR', 'CLOSER'] },
  { label: 'Usuários', icon: Users, path: '/usuarios', roles: ['SUPERADMIN', 'ADMIN'] },
];

export const AppSidebar = () => {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';

  const filteredItems = navItems.filter((item) => user && item.roles.includes(user.role));

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-card border border-border"
      >
        <Menu className="h-5 w-5 text-foreground" />
      </button>

      <aside
        className={cn(
          "fixed left-0 top-0 h-screen bg-sidebar border-r border-border flex flex-col z-40 transition-all duration-300",
          collapsed ? "w-16" : "w-60",
          "max-lg:translate-x-0",
          collapsed ? "max-lg:-translate-x-full" : "max-lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className="p-4 flex items-center justify-between border-b border-border">
          {!collapsed && (
            <h1 className="text-xl font-bold gradient-text tracking-tight">Haubitz</h1>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors hidden lg:flex"
          >
            <ChevronLeft className={cn("h-4 w-4 text-muted-foreground transition-transform", collapsed && "rotate-180")} />
          </button>
        </div>

        {/* User */}
        <div className={cn("p-4 border-b border-border flex items-center gap-3", collapsed && "justify-center")}>
          <div className="h-9 w-9 rounded-full gradient-primary flex items-center justify-center text-sm font-semibold text-primary-foreground shrink-0">
            {initials}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.role}</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {filteredItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
                  collapsed && "justify-center px-2",
                  isActive
                    ? "sidebar-active text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-2 border-t border-border">
          <button
            onClick={logout}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all w-full",
              collapsed && "justify-center px-2"
            )}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Sair</span>}
          </button>
        </div>
      </aside>

      {/* Overlay mobile */}
      {!collapsed && (
        <div className="fixed inset-0 bg-background/80 z-30 lg:hidden" onClick={() => setCollapsed(true)} />
      )}
    </>
  );
};
