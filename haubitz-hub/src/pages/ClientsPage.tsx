import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import api from '@/lib/api';
import { AppHeader } from '@/components/AppHeader';
import { StatusBadge, ProgressBar } from '@/components/StatusBadge';
import { ListSkeleton } from '@/components/Skeletons';
import { Plus, Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type { Company } from '@/types';

const ClientsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSegment, setFilterSegment] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: '', cnpj: '', email: '', phone: '', website: '', segment: '', plan: '', contractStart: '' });

  const { data: companies, isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => { const { data } = await api.get('/companies'); return (data.data || data) as Company[]; },
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => {
      // Converte campos vazios para null (evita erros de validação no backend)
      const payload = Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, v === '' ? null : v])
      );
      return api.post('/companies', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Cliente criado com sucesso!');
      setShowNew(false);
      setForm({ name: '', cnpj: '', email: '', phone: '', website: '', segment: '', plan: '', contractStart: '' });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Erro ao criar cliente';
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    },
  });

  const filtered = companies?.filter((c) => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus && c.status !== filterStatus) return false;
    if (filterSegment && c.segment !== filterSegment) return false;
    return true;
  }) || [];

  const segments = [...new Set(companies?.map(c => c.segment).filter(Boolean))];

  const inputClass = "w-full bg-muted/50 border border-border rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50";

  return (
    <div className="animate-fade-in">
      <AppHeader title="Clientes" />
      <div className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." className={`${inputClass} pl-9 w-52`} />
            </div>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={`${inputClass} w-36`}>
              <option value="">Status</option>
              <option value="ACTIVE">Ativo</option>
              <option value="INACTIVE">Inativo</option>
              <option value="PAUSED">Pausado</option>
            </select>
            <select value={filterSegment} onChange={(e) => setFilterSegment(e.target.value)} className={`${inputClass} w-40`}>
              <option value="">Segmento</option>
              {segments.map(s => <option key={s} value={s!}>{s}</option>)}
            </select>
          </div>
          <button onClick={() => setShowNew(true)} className="gradient-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:opacity-90 transition-opacity">
            <Plus className="h-4 w-4" /> Novo Cliente
          </button>
        </div>

        <div className="glass-card">
          {isLoading ? <ListSkeleton /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    <th className="text-left p-4">Empresa</th>
                    <th className="text-left p-4 hidden md:table-cell">Segmento</th>
                    <th className="text-left p-4 hidden md:table-cell">Plano</th>
                    <th className="text-left p-4">Onboarding</th>
                    <th className="text-left p-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => {
                    const steps = c.onboarding?.steps || [];
                    const completed = steps.filter(s => s.status === 'COMPLETED').length;
                    return (
                      <tr key={c.id} onClick={() => navigate(`/clientes/${c.id}`)} className="border-b border-border hover:bg-muted/30 cursor-pointer transition-colors">
                        <td className="p-4 font-medium">{c.name}</td>
                        <td className="p-4 text-muted-foreground hidden md:table-cell">{c.segment || '—'}</td>
                        <td className="p-4 text-muted-foreground hidden md:table-cell">{c.plan || '—'}</td>
                        <td className="p-4 w-48"><ProgressBar value={completed} max={steps.length || 7} /></td>
                        <td className="p-4"><StatusBadge status={c.status} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filtered.length === 0 && <p className="text-center text-muted-foreground py-8 text-sm">Nenhum cliente encontrado</p>}
            </div>
          )}
        </div>
      </div>

      {/* Sheet Novo Cliente */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-background/80" onClick={() => setShowNew(false)} />
          <div className="relative w-full max-w-md bg-card border-l border-border h-full overflow-y-auto animate-fade-in p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Novo Cliente</h3>
              <button onClick={() => setShowNew(false)}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            {['name', 'cnpj', 'email', 'phone', 'website', 'segment', 'plan'].map((field) => (
              <div key={field} className="space-y-1">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {{ name: 'Nome', cnpj: 'CNPJ', email: 'E-mail', phone: 'Telefone', website: 'Website', segment: 'Segmento', plan: 'Plano' }[field]}
                </label>
                <input
                  value={(form as any)[field]}
                  onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  className={inputClass}
                />
              </div>
            ))}
            <div className="space-y-1">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Início do Contrato</label>
              <input type="date" value={form.contractStart} onChange={(e) => setForm({ ...form, contractStart: e.target.value })} className={inputClass} />
            </div>
            <button
              onClick={() => createMutation.mutate(form)}
              disabled={!form.name || createMutation.isPending}
              className="w-full gradient-primary text-primary-foreground py-2.5 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {createMutation.isPending ? 'Salvando...' : 'Salvar Cliente'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientsPage;
