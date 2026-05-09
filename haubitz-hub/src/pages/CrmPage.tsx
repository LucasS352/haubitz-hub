import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '@/lib/api';
import { AppHeader } from '@/components/AppHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { ListSkeleton, MetricCardSkeleton } from '@/components/Skeletons';
import { Plus, X, Phone, Mail, MessageCircle, Users, FileText, GripVertical, Target, TrendingUp, DollarSign, Award, Trash2, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { Lead, PipelineStage, InteractionType, CrmDashboard } from '@/types';

const STAGES: { key: PipelineStage; label: string }[] = [
  { key: 'LEAD_IN', label: 'Lead In' },
  { key: 'QUALIFICATION', label: 'Qualificação' },
  { key: 'SCHEDULING', label: 'Agendamento' },
  { key: 'DIAGNOSIS', label: 'Diagnóstico' },
  { key: 'PROPOSAL', label: 'Proposta' },
  { key: 'NEGOTIATION', label: 'Negociação' },
  { key: 'FOLLOW_UP', label: 'Follow-up' },
];

const CLOSED_STAGES: { key: PipelineStage; label: string }[] = [
  { key: 'CLOSED_WON', label: 'Fechado (Ganho)' },
  { key: 'CLOSED_LOST', label: 'Perdido' },
];

const interactionIcons: Record<InteractionType, any> = {
  CALL: Phone, EMAIL: Mail, WHATSAPP: MessageCircle, MEETING: Users, NOTE: FileText,
};

const CrmPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get('view') || 'pipeline';
  const queryClient = useQueryClient();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showNewLead, setShowNewLead] = useState(false);
  const [newLeadForm, setNewLeadForm] = useState({ name: '', email: '', phone: '', businessName: '', source: '', companyId: '' });
  const [newInteraction, setNewInteraction] = useState<{ type: InteractionType; notes: string; duration?: number } | null>(null);
  const [draggedLead, setDraggedLead] = useState<string | null>(null);
  const [editingInteractionId, setEditingInteractionId] = useState<string | null>(null);
  const [editingInteractionNotes, setEditingInteractionNotes] = useState<string>('');

  const { data: leads, isLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: async () => { const { data } = await api.get('/crm/leads'); return (data.data || data) as Lead[]; },
  });

  const { data: companies } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => { const { data } = await api.get('/companies'); return (data.data || []) as { id: string; name: string }[]; },
  });

  const { data: dashboard } = useQuery({
    queryKey: ['crm-dashboard'],
    queryFn: async () => { const { data } = await api.get('/crm/dashboard'); return (data.data || data) as CrmDashboard; },
    enabled: view === 'dashboard',
  });

  const moveStageMutation = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: PipelineStage }) =>
      api.put(`/crm/leads/${id}/stage`, { stage }),  // backend espera "stage" não "pipelineStage"
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead movido com sucesso!');
    },
  });

  const createLeadMutation = useMutation({
    mutationFn: (data: typeof newLeadForm) => {
      const payload = Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, v === '' ? null : v])
      );
      return api.post('/crm/leads', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Lead criado!');
      setShowNewLead(false);
      setNewLeadForm({ name: '', email: '', phone: '', businessName: '', source: '', companyId: '' });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Erro ao criar lead';
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    },
  });

  const addInteractionMutation = useMutation({
    mutationFn: ({ leadId, data }: { leadId: string; data: any }) =>
      api.post(`/crm/leads/${leadId}/interactions`, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Interação registrada!');
      setNewInteraction(null);
      if (selectedLead && res.data?.data) {
        setSelectedLead({
          ...selectedLead,
          interactions: [res.data.data, ...(selectedLead.interactions || [])]
        });
      }
    },
  });

  const updateLeadMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.put(`/crm/leads/${id}`, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      const updatedLead = res.data?.data || res.data;
      if (selectedLead && updatedLead) {
        setSelectedLead({
          ...selectedLead,
          ...updatedLead,
          interactions: selectedLead.interactions,
          followUps: selectedLead.followUps
        });
      }
      toast.success('Lead atualizado!');
    },
  });

  const deleteInteractionMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/crm/interactions/${id}`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Interação excluída!');
      if (selectedLead) {
        setSelectedLead({
          ...selectedLead,
          interactions: selectedLead.interactions?.filter(i => i.id !== id)
        });
      }
    },
  });

  const updateInteractionMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) => api.put(`/crm/interactions/${id}`, { notes }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success('Interação atualizada!');
      setEditingInteractionId(null);
      if (selectedLead && res.data?.data) {
        setSelectedLead({
          ...selectedLead,
          interactions: selectedLead.interactions?.map(i => i.id === res.data.data.id ? res.data.data : i)
        });
      }
    },
  });

  const handleLeadClick = async (lead: Lead) => {
    // Exibe imediatamente os dados básicos do painel
    setSelectedLead(lead);
    // Busca as interações e detalhes completos do servidor
    try {
      const { data } = await api.get(`/crm/leads/${lead.id}`);
      const fullLead = data.data || data;
      setSelectedLead(fullLead);
    } catch (err) {
      console.error('Erro ao buscar detalhes do lead', err);
    }
  };

  const inputClass = "w-full bg-muted/50 border border-border rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50";

  const handleDrop = (stage: PipelineStage) => {
    if (draggedLead) {
      moveStageMutation.mutate({ id: draggedLead, stage });
      setDraggedLead(null);
    }
  };

  return (
    <div className="animate-fade-in">
      <AppHeader title="CRM" />
      <div className="p-6 space-y-4">
        {/* Sub-nav */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-1 bg-muted/50 rounded-lg p-1">
            {[{ key: 'pipeline', label: 'Pipeline' }, { key: 'lista', label: 'Leads' }, { key: 'dashboard', label: 'Dashboard' }].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSearchParams({ view: tab.key })}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  view === tab.key ? 'gradient-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <button onClick={() => setShowNewLead(true)} className="gradient-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 hover:opacity-90">
            <Plus className="h-4 w-4" /> Novo Lead
          </button>
        </div>

        {/* Pipeline View */}
        {view === 'pipeline' && (
          <>
            <div className="flex gap-3 overflow-x-auto pb-4">
              {STAGES.map((stage) => {
                const stageLeads = leads?.filter(l => l.pipelineStage === stage.key) || [];
                return (
                  <div
                    key={stage.key}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(stage.key)}
                    className="min-w-[240px] flex-shrink-0 glass-card p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{stage.label}</h4>
                      <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{stageLeads.length}</span>
                    </div>
                    {stageLeads.map((lead) => (
                      <div
                        key={lead.id}
                        draggable
                        onDragStart={() => setDraggedLead(lead.id)}
                        onClick={() => handleLeadClick(lead)}
                        className="p-3 rounded-lg bg-muted/30 border border-border hover:border-primary/30 cursor-pointer transition-all space-y-1"
                      >
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-3 w-3 text-muted-foreground" />
                          <p className="text-sm font-medium truncate">{lead.name}</p>
                        </div>
                        {lead.businessName && <p className="text-xs text-muted-foreground">{lead.businessName}</p>}
                        {lead.proposalValue && <p className="text-xs text-success font-medium">R$ {lead.proposalValue.toLocaleString('pt-BR')}</p>}
                        {lead.sdr && <p className="text-xs text-muted-foreground">SDR: {lead.sdr.name}</p>}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
            {/* Closed stages */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CLOSED_STAGES.map((stage) => {
                const stageLeads = leads?.filter(l => l.pipelineStage === stage.key) || [];
                const total = stageLeads.reduce((sum, l) => sum + (l.proposalValue || 0), 0);
                return (
                  <div key={stage.key} className="glass-card p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium">{stage.label}</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{stageLeads.length} leads</span>
                        <span className="text-xs font-medium text-success">R$ {total.toLocaleString('pt-BR')}</span>
                      </div>
                    </div>
                    {stageLeads.slice(0, 3).map(l => (
                      <div key={l.id} onClick={() => handleLeadClick(l)} className="flex items-center justify-between py-1.5 text-sm cursor-pointer hover:text-primary transition-colors">
                        <span>{l.name}</span>
                        <span className="text-xs text-muted-foreground">R$ {(l.proposalValue || 0).toLocaleString('pt-BR')}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* List View */}
        {view === 'lista' && (
          <div className="glass-card">
            {isLoading ? <ListSkeleton /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      <th className="text-left p-4">Nome</th>
                      <th className="text-left p-4 hidden md:table-cell">Empresa</th>
                      <th className="text-left p-4 hidden md:table-cell">Origem</th>
                      <th className="text-left p-4">Estágio</th>
                      <th className="text-left p-4 hidden md:table-cell">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads?.map(l => (
                      <tr key={l.id} onClick={() => handleLeadClick(l)} className="border-b border-border hover:bg-muted/30 cursor-pointer transition-colors">
                        <td className="p-4 font-medium">{l.name}</td>
                        <td className="p-4 text-muted-foreground hidden md:table-cell">{l.businessName || '—'}</td>
                        <td className="p-4 text-muted-foreground hidden md:table-cell">{l.source || '—'}</td>
                        <td className="p-4"><StatusBadge status={l.pipelineStage} /></td>
                        <td className="p-4 text-muted-foreground hidden md:table-cell">{l.proposalValue ? `R$ ${l.proposalValue.toLocaleString('pt-BR')}` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Dashboard View */}
        {view === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {dashboard ? (
                <>
                  <div className="glass-card p-4"><p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1"><Target className="h-3 w-3" />Total Leads</p><p className="text-2xl font-bold mt-1">{dashboard.overview.totalLeads}</p></div>
                  <div className="glass-card p-4"><p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1"><Award className="h-3 w-3" />Ganhos</p><p className="text-2xl font-bold mt-1 text-success">{dashboard.overview.wonLeads}</p></div>
                  <div className="glass-card p-4"><p className="text-xs text-muted-foreground uppercase tracking-wider">Perdidos</p><p className="text-2xl font-bold mt-1 text-destructive">{dashboard.overview.lostLeads}</p></div>
                  <div className="glass-card p-4"><p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1"><TrendingUp className="h-3 w-3" />Conversão</p><p className="text-2xl font-bold mt-1">{dashboard.overview.conversionRate}</p></div>
                  <div className="glass-card p-4"><p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1"><DollarSign className="h-3 w-3" />Follow-ups Pendentes</p><p className="text-2xl font-bold mt-1">{dashboard.overview.pendingFollowUps}</p></div>
                </>
              ) : Array.from({ length: 5 }).map((_, i) => <MetricCardSkeleton key={i} />)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass-card p-5">
                <h3 className="font-semibold mb-4">Funil de Vendas</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={dashboard?.pipeline || []} layout="vertical" margin={{ left: 80 }}>
                    <XAxis type="number" tick={{ fill: 'hsl(215 16% 62%)', fontSize: 12 }} />
                    <YAxis type="category" dataKey="stage" tick={{ fill: 'hsl(213 27% 94%)', fontSize: 12 }} width={80} />
                    <Tooltip contentStyle={{ background: 'hsl(240 18% 9%)', border: '1px solid hsl(240 14% 15%)', borderRadius: 8 }} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {(dashboard?.pipeline || []).map((_, i) => <Cell key={i} fill={`hsl(263 84% ${58 + i * 3}%)`} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="glass-card p-5">
                <h3 className="font-semibold mb-4">Leads Recentes</h3>
                <div className="space-y-2">
                  {(dashboard?.recentLeads || []).slice(0, 5).map(l => (
                    <div key={l.id} className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/20">
                      <div>
                        <p className="font-medium">{l.name}</p>
                        <p className="text-xs text-muted-foreground">{l.businessName || '—'}</p>
                      </div>
                      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">{l.pipelineStage}</span>
                    </div>
                  ))}
                  {(!dashboard?.recentLeads || dashboard.recentLeads.length === 0) && (
                    <p className="text-sm text-muted-foreground">Nenhum lead recente</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lead Sheet */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-background/80" onClick={() => setSelectedLead(null)} />
          <div className="relative w-full max-w-lg bg-card border-l border-border h-full overflow-y-auto animate-fade-in p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">{selectedLead.name}</h3>
              <button onClick={() => setSelectedLead(null)}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            <div className="space-y-2 text-sm">
              {selectedLead.businessName && <p className="text-muted-foreground">Empresa: {selectedLead.businessName}</p>}
              {selectedLead.email && <p className="text-muted-foreground">E-mail: {selectedLead.email}</p>}
              {selectedLead.phone && <p className="text-muted-foreground">Tel: {selectedLead.phone}</p>}
              {selectedLead.source && <p className="text-muted-foreground">Origem: {selectedLead.source}</p>}
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Estágio:</span>
                <StatusBadge status={selectedLead.pipelineStage} />
              </div>
              <div className="flex items-center gap-2">
                {selectedLead.proposalValue ? (
                  <p className="text-success font-medium">Valor: R$ {Number(selectedLead.proposalValue).toLocaleString('pt-BR')}</p>
                ) : (
                  <p className="text-muted-foreground">Valor: Não definido</p>
                )}
                <button
                  onClick={() => {
                    const val = prompt('Digite o valor do projeto (ex: 2500.50):', selectedLead.proposalValue?.toString() || '');
                    if (val !== null) {
                      const num = parseFloat(val.replace(',', '.'));
                      if (!isNaN(num)) {
                        updateLeadMutation.mutate({ id: selectedLead.id, data: { proposalValue: num } });
                      }
                    }
                  }}
                  className="text-xs text-primary hover:underline ml-2"
                >
                  {selectedLead.proposalValue ? 'Editar Valor' : 'Adicionar Valor'}
                </button>
              </div>
            </div>

            {/* Move pipeline */}
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Mover no Pipeline</p>
              <select
                value={selectedLead.pipelineStage}
                onChange={(e) => {
                  moveStageMutation.mutate({ id: selectedLead.id, stage: e.target.value as PipelineStage });
                  setSelectedLead({ ...selectedLead, pipelineStage: e.target.value as PipelineStage });
                }}
                className={inputClass}
              >
                {[...STAGES, ...CLOSED_STAGES].map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>

            {/* Interactions timeline */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Interações</p>
                <button onClick={() => setNewInteraction({ type: 'NOTE', notes: '' })} className="text-xs text-primary hover:underline">+ Registrar</button>
              </div>
              {newInteraction && (
                <div className="p-3 rounded-lg bg-muted/30 border border-border space-y-2 mb-3">
                  <select value={newInteraction.type} onChange={(e) => setNewInteraction({ ...newInteraction, type: e.target.value as InteractionType })} className={inputClass}>
                    <option value="CALL">📞 Ligação</option>
                    <option value="EMAIL">📧 E-mail</option>
                    <option value="WHATSAPP">💬 WhatsApp</option>
                    <option value="MEETING">🤝 Reunião</option>
                    <option value="NOTE">📝 Nota</option>
                  </select>
                  <textarea value={newInteraction.notes} onChange={(e) => setNewInteraction({ ...newInteraction, notes: e.target.value })} placeholder="Notas..." className={`${inputClass} h-20 resize-none`} />
                  {(newInteraction.type === 'CALL' || newInteraction.type === 'MEETING') && (
                    <input type="number" placeholder="Duração (min)" value={newInteraction.duration || ''} onChange={(e) => setNewInteraction({ ...newInteraction, duration: Number(e.target.value) })} className={inputClass} />
                  )}
                  <div className="flex gap-2">
                    <button onClick={() => addInteractionMutation.mutate({ leadId: selectedLead.id, data: newInteraction })} className="px-3 py-1.5 rounded-md gradient-primary text-primary-foreground text-xs font-medium">Salvar</button>
                    <button onClick={() => setNewInteraction(null)} className="text-xs text-muted-foreground">Cancelar</button>
                  </div>
                </div>
              )}
              <div className="space-y-2">
                {selectedLead.interactions?.map((i) => {
                  const Icon = interactionIcons[i.type] || FileText;
                  const isEditing = editingInteractionId === i.id;
                  return (
                    <div key={i.id} className="flex gap-3 text-sm p-3 rounded-lg bg-muted/20 relative group">
                      <Icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <div className="w-full">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">{new Date(i.createdAt).toLocaleDateString('pt-BR')} · {i.user?.name || i.createdBy}{i.duration ? ` · ${i.duration}min` : ''}</p>
                          <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setEditingInteractionId(i.id); setEditingInteractionNotes(i.notes); }} className="text-muted-foreground hover:text-primary transition-colors"><Edit2 className="h-3.5 w-3.5" /></button>
                            <button onClick={() => { if (confirm('Excluir interação?')) deleteInteractionMutation.mutate(i.id); }} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                          </div>
                        </div>
                        {isEditing ? (
                          <div className="mt-2 space-y-2">
                            <textarea value={editingInteractionNotes} onChange={(e) => setEditingInteractionNotes(e.target.value)} className={`${inputClass} h-16 resize-none`} />
                            <div className="flex gap-2">
                              <button onClick={() => updateInteractionMutation.mutate({ id: i.id, notes: editingInteractionNotes })} className="px-3 py-1.5 rounded-md gradient-primary text-primary-foreground text-xs font-medium">Salvar</button>
                              <button onClick={() => setEditingInteractionId(null)} className="text-xs text-muted-foreground">Cancelar</button>
                            </div>
                          </div>
                        ) : (
                          i.notes && <p className="text-sm mt-1 whitespace-pre-wrap">{i.notes}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
                {(!selectedLead.interactions || selectedLead.interactions.length === 0) && (
                  <p className="text-xs text-muted-foreground">Nenhuma interação registrada</p>
                )}
              </div>
            </div>

            {/* Follow-ups */}
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">Follow-ups</p>
              <div className="space-y-2">
                {selectedLead.followUps?.map((f) => (
                  <div key={f.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/20 text-sm">
                    <div>
                      <p>{new Date(f.scheduledAt).toLocaleDateString('pt-BR')}</p>
                      {f.notes && <p className="text-xs text-muted-foreground">{f.notes}</p>}
                    </div>
                    {f.status === 'COMPLETED' ? (
                      <span className="text-xs text-success">Concluído</span>
                    ) : f.status === 'MISSED' ? (
                      <span className="text-xs text-destructive">Perdido</span>
                    ) : (
                      <button
                        onClick={() => api.put(`/crm/followups/${f.id}`, { status: 'COMPLETED' }).then(() => queryClient.invalidateQueries({ queryKey: ['leads'] }))}
                        className="text-xs px-2 py-1 rounded bg-primary/20 text-primary"
                      >
                        Concluir
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Lead Sheet */}
      {showNewLead && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-background/80" onClick={() => setShowNewLead(false)} />
          <div className="relative w-full max-w-md bg-card border-l border-border h-full overflow-y-auto animate-fade-in p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Novo Lead</h3>
              <button onClick={() => setShowNewLead(false)}><X className="h-5 w-5 text-muted-foreground" /></button>
            </div>
            {['name', 'email', 'phone', 'businessName', 'source'].map((field) => (
              <div key={field} className="space-y-1">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {{ name: 'Nome', email: 'E-mail', phone: 'Telefone', businessName: 'Nome da Empresa', source: 'Origem' }[field]}
                </label>
                <input value={(newLeadForm as any)[field]} onChange={(e) => setNewLeadForm({ ...newLeadForm, [field]: e.target.value })} className={inputClass} />
              </div>
            ))}
            {/* Empresa (tenant) — obrigatório para o SuperAdmin */}
            <div className="space-y-1">
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Cliente / Empresa <span className="text-destructive">*</span>
              </label>
              <select
                value={newLeadForm.companyId}
                onChange={(e) => setNewLeadForm({ ...newLeadForm, companyId: e.target.value })}
                className={inputClass}
              >
                <option value="">— Selecione a empresa —</option>
                {companies?.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => createLeadMutation.mutate(newLeadForm)}
              disabled={!newLeadForm.name || !newLeadForm.companyId || createLeadMutation.isPending}
              className="w-full gradient-primary text-primary-foreground py-2.5 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {createLeadMutation.isPending ? 'Salvando...' : 'Salvar Lead'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrmPage;
