import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import api from '@/lib/api';
import { AppHeader } from '@/components/AppHeader';
import { ListSkeleton } from '@/components/Skeletons';
import { Plus, X, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import type { User, UserRole } from '@/types';

const roleColors: Record<string, string> = {
  SUPERADMIN: 'bg-primary/20 text-primary',
  ADMIN: 'bg-secondary/20 text-secondary',
  SDR: 'bg-warning/20 text-warning',
  CLOSER: 'bg-success/20 text-success',
  COLLABORATOR: 'bg-muted text-muted-foreground',
};

// Mapeamento de módulos para labels amigáveis
const moduleLabels: Record<string, string> = {
  companies: '🏢 Empresas',
  onboarding: '📋 Onboarding',
  crm: '🎯 CRM',
  users: '👥 Usuários',
  reports: '📊 Relatórios',
};

const actionLabels: Record<string, string> = {
  read: 'Visualizar',
  write: 'Cadastrar/Editar',
  manage: 'Gerenciar',
  log: 'Adicionar Logs',
  stage: 'Mover Pipeline',
  interact: 'Interações',
  dashboard: 'Dashboard',
  permissions: 'Gerenciar Permissões',
  export: 'Exportar',
};

const UsersPage = () => {
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newUserForm, setNewUserForm] = useState({ name: '', email: '', password: '', role: 'COLLABORATOR' as UserRole, companyId: '' });
  const [editPerms, setEditPerms] = useState<string[]>([]);

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => { const { data } = await api.get('/users'); return (data.data || data) as User[]; },
  });

  const { data: companies } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => { const { data } = await api.get('/companies'); return (data.data || []) as { id: string; name: string }[]; },
  });

  // Carrega todas as permissões disponíveis da API (com UUIDs reais)
  const { data: allPermissions } = useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const { data } = await api.get('/users/permissions');
      return (data.data || data) as { id: string; name: string; module: string; action: string; description?: string }[];
    },
  });

  // Agrupa permissões por módulo para exibição
  const permissionsByModule = (allPermissions || []).reduce((acc, perm) => {
    const mod = perm.module;
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(perm);
    return acc;
  }, {} as Record<string, typeof allPermissions>);

  const createUserMutation = useMutation({
    mutationFn: (data: typeof newUserForm) => {
      const payload = {
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
        companyId: data.companyId || null,
      };
      return api.post('/users', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuário criado!');
      setShowNew(false);
      setNewUserForm({ name: '', email: '', password: '', role: 'COLLABORATOR', companyId: '' });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Erro ao criar usuário';
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    },
  });

  const updatePermsMutation = useMutation({
    mutationFn: ({ userId, permissions }: { userId: string; permissions: string[] }) =>
      api.put(`/users/${userId}/permissions`, { permissions }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Permissões salvas!');
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (userId: string) => api.delete(`/users/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuário desativado');
      setSelectedUser(null);
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: (userId: string) => api.put(`/users/${userId}`, { isActive: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuário reativado com sucesso!');
      setSelectedUser(null);
    },
    onError: () => toast.error('Erro ao reativar usuário'),
  });

  const openUserEdit = (user: User) => {
    setSelectedUser(user);
    // Extrai os UUIDs das permissões atuais do usuário
    const currentPermIds = (user.permissions || []).map((p: any) =>
      p.permission?.id || p.permissionId || p.id || p
    ).filter(Boolean);
    setEditPerms(currentPermIds);
  };

  const togglePerm = (id: string) => {
    setEditPerms(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const inputClass = "w-full bg-muted/50 border border-border rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50";

  return (
    <div className="animate-fade-in">
      <AppHeader title="Usuários" />
      <div className="p-6 space-y-4">
        <div className="flex justify-end">
          <button onClick={() => setShowNew(true)} className="gradient-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:opacity-90">
            <Plus className="h-4 w-4" /> Novo Usuário
          </button>
        </div>

        <div className="glass-card">
          {isLoading ? <ListSkeleton /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    <th className="text-left p-4">Nome</th>
                    <th className="text-left p-4">E-mail</th>
                    <th className="text-left p-4">Cargo</th>
                    <th className="text-left p-4 hidden md:table-cell">Empresa</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-left p-4 hidden md:table-cell">Último Login</th>
                  </tr>
                </thead>
                <tbody>
                  {users?.map(u => (
                    <tr key={u.id} onClick={() => openUserEdit(u)} className="border-b border-border hover:bg-muted/30 cursor-pointer transition-colors">
                      <td className="p-4 font-medium">{u.name}</td>
                      <td className="p-4 text-muted-foreground">{u.email}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${roleColors[u.role] || ''}`}>{u.role}</span>
                      </td>
                      <td className="p-4 text-muted-foreground hidden md:table-cell">{u.companyName || '—'}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${u.isActive ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'}`}>
                          {u.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="p-4 text-muted-foreground hidden md:table-cell">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString('pt-BR') : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit User Sheet */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-background/80" onClick={() => setSelectedUser(null)} />
          <div className="relative w-full max-w-lg bg-card border-l border-border h-full overflow-y-auto animate-fade-in p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">{selectedUser.name}</h3>
              <button onClick={() => setSelectedUser(null)}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>

            <div className="space-y-2 text-sm">
              <p className="text-muted-foreground">E-mail: {selectedUser.email}</p>
              <p className="text-muted-foreground">Cargo: <span className={`px-2 py-0.5 rounded text-xs font-medium ${roleColors[selectedUser.role]}`}>{selectedUser.role}</span></p>
            </div>

            {/* Permissions - agora com UUIDs reais da API */}
            {hasRole('SUPERADMIN') && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <h4 className="text-sm font-semibold">Permissões</h4>
                </div>
                {Object.entries(permissionsByModule).map(([mod, perms]) => (
                  <div key={mod} className="space-y-2">
                    <p className="text-xs font-medium">{moduleLabels[mod] || mod}</p>
                    <div className="flex flex-wrap gap-2">
                      {(perms || []).map(p => (
                        <label key={p!.id} className="flex items-center gap-1.5 text-xs cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editPerms.includes(p!.id)}
                            onChange={() => togglePerm(p!.id)}
                            className="rounded border-border text-primary focus:ring-primary"
                          />
                          {actionLabels[p!.action] || p!.action}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                {allPermissions?.length === 0 && (
                  <p className="text-xs text-muted-foreground">Nenhuma permissão disponível</p>
                )}
                <button
                  onClick={() => updatePermsMutation.mutate({ userId: selectedUser!.id, permissions: editPerms })}
                  className="w-full gradient-primary text-primary-foreground py-2 rounded-lg text-sm font-medium hover:opacity-90"
                >
                  {updatePermsMutation.isPending ? 'Salvando...' : 'Salvar Permissões'}
                </button>
              </div>
            )}

            {/* Ativar / Desativar */}
            <div className="pt-4 border-t border-border space-y-2">
              {selectedUser.isActive ? (
                <button
                  onClick={() => {
                    if (confirm('Deseja realmente desativar este usuário?')) {
                      deactivateMutation.mutate(selectedUser.id);
                    }
                  }}
                  disabled={deactivateMutation.isPending}
                  className="w-full py-2 rounded-lg text-sm font-medium border border-destructive text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                >
                  {deactivateMutation.isPending ? 'Desativando...' : 'Desativar Conta'}
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (confirm('Deseja reativar este usuário?')) {
                      reactivateMutation.mutate(selectedUser.id);
                    }
                  }}
                  disabled={reactivateMutation.isPending}
                  className="w-full py-2 rounded-lg text-sm font-medium border border-success text-success hover:bg-success/10 transition-colors disabled:opacity-50"
                >
                  {reactivateMutation.isPending ? 'Reativando...' : '✅ Reativar Conta'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New User Sheet */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-background/80" onClick={() => setShowNew(false)} />
          <div className="relative w-full max-w-md bg-card border-l border-border h-full overflow-y-auto animate-fade-in p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Novo Usuário</h3>
              <button onClick={() => setShowNew(false)}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            {/* Campos Nome, Email, Senha */}
            {['name', 'email', 'password'].map((field) => (
              <div key={field} className="space-y-1">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {{ name: 'Nome', email: 'E-mail', password: 'Senha Temporária' }[field]}
                </label>
                <input
                  type={field === 'password' ? 'password' : 'text'}
                  value={(newUserForm as any)[field]}
                  onChange={(e) => setNewUserForm({ ...newUserForm, [field]: e.target.value })}
                  className={inputClass}
                />
                {field === 'password' && (
                  <p className="text-xs text-muted-foreground">Mín. 8 caracteres com maiúscula, minúscula e número</p>
                )}
              </div>
            ))}
            {/* Select de Empresa */}
            <div className="space-y-1">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Empresa</label>
              <select
                value={newUserForm.companyId}
                onChange={(e) => setNewUserForm({ ...newUserForm, companyId: e.target.value })}
                className={inputClass}
              >
                <option value="">— Sem empresa (interno) —</option>
                {companies?.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Cargo</label>
              <select value={newUserForm.role} onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value as UserRole })} className={inputClass}>
                <option value="SDR">SDR</option>
                <option value="CLOSER">Closer</option>
                <option value="ADMIN">Admin</option>
                <option value="COLLABORATOR">Colaborador</option>
              </select>
            </div>
            <button
              onClick={() => createUserMutation.mutate(newUserForm)}
              disabled={!newUserForm.name || !newUserForm.email || !newUserForm.password || createUserMutation.isPending}
              className="w-full gradient-primary text-primary-foreground py-2.5 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {createUserMutation.isPending ? 'Salvando...' : 'Criar Usuário'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
