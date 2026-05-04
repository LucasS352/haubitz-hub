import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { AppHeader } from '@/components/AppHeader';
import { StatusBadge, ProgressBar } from '@/components/StatusBadge';
import { MetricCardSkeleton, ListSkeleton } from '@/components/Skeletons';
import { Building2, ClipboardList, Target, TrendingUp, Search } from 'lucide-react';
import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { Company, Lead, FollowUp } from '@/types';

const MetricCard = ({ icon: Icon, label, value, change }: { icon: any; label: string; value: string | number; change?: string }) => (
  <div className="glass-card p-5 flex flex-col gap-2">
    <div className="flex items-center gap-2 text-muted-foreground">
      <Icon className="h-4 w-4" />
      <span className="text-xs font-medium uppercase tracking-wider">{label}</span>
    </div>
    <p className="text-2xl font-bold">{value}</p>
    {change && <p className="text-xs text-success">{change}</p>}
  </div>
);

const stageLabels: Record<string, string> = {
  LEAD_IN: 'Lead In',
  QUALIFICATION: 'Qualificação',
  SCHEDULING: 'Agendamento',
  DIAGNOSIS: 'Diagnóstico',
  PROPOSAL: 'Proposta',
  NEGOTIATION: 'Negociação',
  FOLLOW_UP: 'Follow-up',
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const { data: companies, isLoading: loadingCompanies } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const { data } = await api.get('/companies');
      return (data.data || data) as Company[];
    },
  });

  const { data: leads } = useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const { data } = await api.get('/crm/leads');
      return (data.data || data) as Lead[];
    },
  });

  const activeCompanies = companies?.filter((c) => c.status === 'ACTIVE') || [];
  const onboardingsInProgress = companies?.filter((c) => c.onboarding?.status === 'IN_PROGRESS') || [];
  const totalLeads = leads?.length || 0;
  const wonLeads = leads?.filter((l) => l.pipelineStage === 'CLOSED_WON').length || 0;
  const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;

  const pipelineData = Object.entries(stageLabels).map(([key, label]) => ({
    stage: label,
    count: leads?.filter((l) => l.pipelineStage === key).length || 0,
  }));

  const filteredCompanies = companies?.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const pendingFollowUps = leads
    ?.flatMap((l) => l.followUps?.map((f) => ({ ...f, leadName: l.name, businessName: l.businessName })) || [])
    .filter((f) => !f.completed)
    .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
    .slice(0, 5) || [];

  return (
    <div className="animate-fade-in">
      <AppHeader title="Dashboard" />
      <div className="p-6 space-y-6">
        {/* Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {loadingCompanies ? (
            Array.from({ length: 4 }).map((_, i) => <MetricCardSkeleton key={i} />)
          ) : (
            <>
              <MetricCard icon={Building2} label="Clientes Ativos" value={activeCompanies.length} />
              <MetricCard icon={ClipboardList} label="Onboardings em Andamento" value={onboardingsInProgress.length} />
              <MetricCard icon={Target} label="Leads no Pipeline" value={totalLeads} />
              <MetricCard icon={TrendingUp} label="Taxa de Conversão" value={`${conversionRate}%`} />
            </>
          )}
        </div>

        {/* Client list */}
        <div className="glass-card">
          <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h3 className="font-semibold">Clientes</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar cliente..."
                className="bg-muted/50 border border-border rounded-md py-2 pl-9 pr-3 text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>
          {loadingCompanies ? (
            <ListSkeleton />
          ) : (
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
                  {filteredCompanies.map((company) => {
                    const steps = company.onboarding?.steps || [];
                    const completed = steps.filter((s) => s.status === 'COMPLETED').length;
                    return (
                      <tr
                        key={company.id}
                        onClick={() => navigate(`/clientes/${company.id}`)}
                        className="border-b border-border hover:bg-muted/30 cursor-pointer transition-colors"
                      >
                        <td className="p-4 font-medium">{company.name}</td>
                        <td className="p-4 text-muted-foreground hidden md:table-cell">{company.segment || '—'}</td>
                        <td className="p-4 text-muted-foreground hidden md:table-cell">{company.plan || '—'}</td>
                        <td className="p-4 w-48">
                          <ProgressBar value={completed} max={steps.length || 7} />
                        </td>
                        <td className="p-4">
                          <StatusBadge status={company.onboarding?.status || 'NOT_STARTED'} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredCompanies.length === 0 && (
                <p className="text-center text-muted-foreground py-8 text-sm">Nenhum cliente encontrado</p>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pipeline mini */}
          <div className="glass-card p-5">
            <h3 className="font-semibold mb-4">Pipeline CRM</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={pipelineData} layout="vertical" margin={{ left: 80 }}>
                <XAxis type="number" tick={{ fill: 'hsl(215 16% 62%)', fontSize: 12 }} />
                <YAxis type="category" dataKey="stage" tick={{ fill: 'hsl(213 27% 94%)', fontSize: 12 }} width={80} />
                <Tooltip
                  contentStyle={{ background: 'hsl(240 18% 9%)', border: '1px solid hsl(240 14% 15%)', borderRadius: 8 }}
                  labelStyle={{ color: 'hsl(213 27% 94%)' }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {pipelineData.map((_, i) => (
                    <Cell key={i} fill={`hsl(263 84% ${58 + i * 4}%)`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Follow-ups */}
          <div className="glass-card p-5">
            <h3 className="font-semibold mb-4">Follow-ups Pendentes</h3>
            {pendingFollowUps.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum follow-up pendente</p>
            ) : (
              <div className="space-y-3">
                {pendingFollowUps.map((f) => (
                  <div key={f.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                    <div>
                      <p className="text-sm font-medium">{f.leadName}</p>
                      <p className="text-xs text-muted-foreground">{f.businessName} · {new Date(f.scheduledDate).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <button
                      onClick={() => {
                        api.put(`/crm/followups/${f.id}`, { completed: true });
                      }}
                      className="text-xs px-3 py-1.5 rounded-md bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
                    >
                      Concluir
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
