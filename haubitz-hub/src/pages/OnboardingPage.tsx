import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import api from '@/lib/api';
import { AppHeader } from '@/components/AppHeader';
import { StatusBadge, ProgressBar } from '@/components/StatusBadge';
import { ListSkeleton } from '@/components/Skeletons';
import { useNavigate } from 'react-router-dom';
import type { Company } from '@/types';

const OnboardingPage = () => {
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState('recent');

  const { data: companies, isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => { const { data } = await api.get('/companies'); return (data.data || data) as Company[]; },
  });

  let items = companies?.filter(c => c.onboarding) || [];
  if (filterStatus) items = items.filter(c => c.onboarding?.status === filterStatus);

  items.sort((a, b) => {
    if (sortBy === 'progress') {
      const pA = (a.onboarding?.steps?.filter(s => s.status === 'COMPLETED').length || 0);
      const pB = (b.onboarding?.steps?.filter(s => s.status === 'COMPLETED').length || 0);
      return pA - pB;
    }
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    return 0;
  });

  const inputClass = "bg-muted/50 border border-border rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50";

  return (
    <div className="animate-fade-in">
      <AppHeader title="Onboarding" />
      <div className="p-6 space-y-4">
        <div className="flex flex-wrap gap-2">
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className={`${inputClass} w-44`}>
            <option value="">Todos os status</option>
            <option value="NOT_STARTED">Não Iniciado</option>
            <option value="IN_PROGRESS">Em Andamento</option>
            <option value="COMPLETED">Concluído</option>
            <option value="PAUSED">Pausado</option>
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className={`${inputClass} w-44`}>
            <option value="recent">Mais Recente</option>
            <option value="progress">Menos Progresso</option>
            <option value="name">Nome</option>
          </select>
        </div>

        {isLoading ? <ListSkeleton rows={6} cols={3} /> : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {items.map((c) => {
              const steps = c.onboarding?.steps || [];
              const completed = steps.filter(s => s.status === 'COMPLETED').length;
              return (
                <div
                  key={c.id}
                  onClick={() => navigate(`/clientes/${c.id}`)}
                  className="glass-card p-5 cursor-pointer hover:border-primary/30 transition-all space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm">{c.name}</h4>
                    <StatusBadge status={c.onboarding?.status || 'NOT_STARTED'} />
                  </div>
                  <ProgressBar value={completed} max={steps.length || 7} />
                  <div className="flex gap-1 flex-wrap">
                    {(steps.length > 0 ? steps : Array.from({ length: 7 }, (_, i) => ({ stepNumber: i + 1, status: 'PENDING' }))).map((s) => (
                      <div
                        key={s.stepNumber}
                        className={`h-2 flex-1 rounded-full ${
                          s.status === 'COMPLETED' ? 'bg-success' :
                          s.status === 'IN_PROGRESS' ? 'bg-warning status-pulse' :
                          'bg-muted'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {!isLoading && items.length === 0 && (
          <p className="text-center text-muted-foreground py-8">Nenhum onboarding encontrado</p>
        )}
      </div>
    </div>
  );
};

export default OnboardingPage;
