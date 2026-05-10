import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { AppHeader } from '@/components/AppHeader';
import { StatusBadge, ProgressBar } from '@/components/StatusBadge';
import { MetricCardSkeleton } from '@/components/Skeletons';
import { 
  Building2, 
  Mail, 
  Phone, 
  Globe, 
  Calendar, 
  ArrowLeft, 
  Save, 
  Loader2, 
  ExternalLink,
  Shield,
  FileText,
  CreditCard,
  MessageSquare,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  Camera,
  Clock,
  Circle,
  Zap,
  ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { FileUploader } from '@/components/FileUploader';
import type { Company, OnboardingStep } from '@/types';

const stepTitles = [
  'Kickoff e Briefing',
  'Acessos e Configurações Técnicas',
  'Diagnóstico e Análise de Mercado',
  'Planejamento Estratégico',
  'Criação de Identidade Visual e Conteúdo',
  'Ativação de Campanhas de Tráfego',
  'Entrega e Revisão de Resultados',
];

const StepIcon = ({ status }: { status: string }) => {
  if (status === 'COMPLETED') return <Check className="h-5 w-5 text-success" />;
  if (status === 'IN_PROGRESS') return <Clock className="h-5 w-5 text-warning status-pulse" />;
  return <Circle className="h-5 w-5 text-muted-foreground" />;
};

// ── Portal Tab Component ─────────────────────────────────────
const PortalTab = ({ company, companyId }: { company: Company; companyId: string }) => {
  const queryClient = useQueryClient();

  const [portalForm, setPortalForm] = useState({
    investimento: company.investimento ?? '',
    faturamento: company.faturamento ?? '',
    roi: company.roi ?? '',
    instagramUrl: company.instagramUrl ?? '',
    facebookUrl: company.facebookUrl ?? '',
    tiktokUrl: company.tiktokUrl ?? '',
    contratoInfo: company.contratoInfo ?? '',
    pagamentosInfo: company.pagamentosInfo ?? '',
    metaAccessToken: company.metaAccessToken ?? '',
    onboardingPdfUrl: company.onboardingPdfUrl ?? '',
    contractPdfUrl: company.contractPdfUrl ?? '',
    paymentDay: company.paymentDay ?? '',
    trafegoPagoOrcamento: company.trafegoPagoOrcamento ?? '',
  });

  useEffect(() => {
    setPortalForm({
      investimento: company.investimento ?? '',
      faturamento: company.faturamento ?? '',
      roi: company.roi ?? '',
      instagramUrl: company.instagramUrl ?? '',
      facebookUrl: company.facebookUrl ?? '',
      tiktokUrl: company.tiktokUrl ?? '',
      contratoInfo: company.contratoInfo ?? '',
      pagamentosInfo: company.pagamentosInfo ?? '',
      metaAccessToken: company.metaAccessToken ?? '',
      onboardingPdfUrl: company.onboardingPdfUrl ?? '',
      contractPdfUrl: company.contractPdfUrl ?? '',
      paymentDay: company.paymentDay ?? '',
      trafegoPagoOrcamento: company.trafegoPagoOrcamento ?? '',
    });
  }, [company]);

  const savePortalMutation = useMutation({
    mutationFn: (data: typeof portalForm) =>
      api.put(`/companies/${companyId}/portal-data`, {
        ...data,
        investimento: data.investimento !== '' ? Number(data.investimento) : undefined,
        faturamento: data.faturamento !== '' ? Number(data.faturamento) : undefined,
        roi: data.roi !== '' ? Number(data.roi) : undefined,
        metaAccessToken: data.metaAccessToken || undefined,
        paymentDay: data.paymentDay !== '' ? Number(data.paymentDay) : undefined,
        trafegoPagoOrcamento: data.trafegoPagoOrcamento !== '' ? Number(data.trafegoPagoOrcamento) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company', companyId] });
      toast.success('Dados do portal atualizados!');
    },
    onError: () => toast.error('Erro ao salvar dados do portal'),
  });

  const generateTokenMutation = useMutation({
    mutationFn: () => api.post(`/companies/${companyId}/generate-portal-token`),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['company', companyId] });
      toast.success('Novo token gerado com sucesso!');
    },
    onError: () => toast.error('Erro ao gerar token'),
  });

  const currentToken = company.clientPortalToken ?? '';
  const portalUrl = `${window.location.origin.replace('5173', '5174')}`;

  const copyToClipboard = (text: string, label: string) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text)
        .then(() => toast.success(`${label} copiado!`))
        .catch(() => fallbackCopyTextToClipboard(text, label));
    } else {
      fallbackCopyTextToClipboard(text, label);
    }
  };

  const fallbackCopyTextToClipboard = (text: string, label: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    // Evita scroll para o textarea
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand('copy');
      if (successful) {
        toast.success(`${label} copiado!`);
      } else {
        toast.error('Não foi possível copiar');
      }
    } catch (err) {
      toast.error('Não foi possível copiar');
    }
    
    document.body.removeChild(textArea);
  };

  return (
    <div className="space-y-5">
      {/* Token de Acesso */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Zap className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Token de Acesso ao Portal</h3>
        </div>

        {currentToken ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-muted/50 border border-border rounded-lg px-3 py-2 text-xs font-mono truncate text-muted-foreground">
                {currentToken}
              </code>
              <button
                onClick={() => copyToClipboard(currentToken, 'Token')}
                className="p-2 rounded-lg bg-muted/50 border border-border hover:bg-muted transition-colors"
                title="Copiar token"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-muted/30 border border-border rounded-lg px-3 py-2 text-xs text-muted-foreground truncate">
                🔗 {portalUrl}
              </div>
              <button
                onClick={() => copyToClipboard(`${portalUrl}`, 'Link')}
                className="p-2 rounded-lg bg-muted/50 border border-border hover:bg-muted transition-colors"
                title="Copiar link do portal"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nenhum token gerado ainda.</p>
        )}

        <button
          onClick={() => generateTokenMutation.mutate()}
          disabled={generateTokenMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-lg gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          {generateTokenMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {currentToken ? 'Regenerar Token' : 'Gerar Token'}
        </button>
      </div>

      {/* Onboarding Material */}
      <div className="glass-card p-5 space-y-4">
        <FileUploader 
          label="Material de Planejamento (Onboarding)"
          currentUrl={portalForm.onboardingPdfUrl}
          onUploadSuccess={(url) => setPortalForm(f => ({ ...f, onboardingPdfUrl: url }))}
        />
        <div>
          <label className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">
            Ou cole um link externo (Canva, Google Drive)
          </label>
          <input
            type="url"
            value={portalForm.onboardingPdfUrl}
            onChange={(e) => setPortalForm((f) => ({ ...f, onboardingPdfUrl: e.target.value }))}
            placeholder="https://canva.com/..."
            className="w-full bg-muted/30 border border-border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
          />
        </div>
      </div>

      {/* Métricas */}
      <div className="glass-card p-5 space-y-4">
        <h3 className="font-semibold text-sm">Métricas Financeiras</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { key: 'investimento', label: 'Investimento (R$)', placeholder: '1000.00' },
            { key: 'faturamento', label: 'Faturamento (R$)', placeholder: '25000.00' },
            { key: 'roi', label: 'ROI (x)', placeholder: '25' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">{label}</label>
              <input
                type="number"
                value={(portalForm as any)[key]}
                onChange={(e) => setPortalForm((f) => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
          ))}
        </div>
      </div>
      
      {/* Orçamento de Tráfego Pago */}
      <div className="glass-card p-5 space-y-4 border-l-4 border-primary">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Orçamento de Tráfego Pago</h3>
          <StatusBadge status={company.trafegoPagoOrcamento ? 'ACTIVE' : 'NOT_STARTED'} />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Valor (R$)</label>
            <input
              type="number"
              value={portalForm.trafegoPagoOrcamento}
              onChange={(e) => setPortalForm((f) => ({ ...f, trafegoPagoOrcamento: e.target.value }))}
              placeholder="0.00"
              className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
          </div>
          
          <div className="md:col-span-2 bg-primary/5 border border-primary/10 rounded-lg p-3 flex flex-col justify-center">
            <p className="text-[10px] text-primary uppercase font-bold tracking-widest mb-1">Período definido pelo cliente</p>
            {company.trafficBudgetStartAt && company.trafficBudgetEndAt ? (
              <p className="text-sm font-medium">
                {new Date(company.trafficBudgetStartAt).toLocaleDateString('pt-BR')}
                {' → '}
                {new Date(company.trafficBudgetEndAt).toLocaleDateString('pt-BR')}
              </p>
            ) : company.trafficBudgetStartAt ? (
              <p className="text-sm font-medium">
                Início: {new Date(company.trafficBudgetStartAt).toLocaleDateString('pt-BR')}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">Aguardando definição do cliente</p>
            )}
          </div>
        </div>
      </div>

      {/* Redes Sociais */}
      <div className="glass-card p-5 space-y-4">
        <h3 className="font-semibold text-sm">Redes Sociais do Cliente</h3>
        <div className="space-y-3">
          {[
            { key: 'instagramUrl', label: 'Instagram', placeholder: 'https://instagram.com/...' },
            { key: 'facebookUrl', label: 'Facebook', placeholder: 'https://facebook.com/...' },
            { key: 'tiktokUrl', label: 'TikTok', placeholder: 'https://tiktok.com/@...' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">{label}</label>
              <input
                type="url"
                value={(portalForm as any)[key]}
                onChange={(e) => setPortalForm((f) => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Contrato & Pagamentos */}
      <div className="glass-card p-5 space-y-4">
        <h3 className="font-semibold text-sm">Informações de Contrato & Pagamento</h3>
        <div className="space-y-3">
            <FileUploader 
              label="Documento do Contrato"
              currentUrl={portalForm.contractPdfUrl}
              onUploadSuccess={(url) => setPortalForm(f => ({ ...f, contractPdfUrl: url }))}
            />
            <div className="mt-2 mb-4">
              <label className="text-[10px] text-muted-foreground uppercase tracking-widest block mb-1">
                Link do Contrato (Opcional)
              </label>
              <input
                type="url"
                value={portalForm.contractPdfUrl}
                onChange={(e) => setPortalForm((f) => ({ ...f, contractPdfUrl: e.target.value }))}
                placeholder="https://..."
                className="w-full bg-muted/30 border border-border rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/50"
              />
            </div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">
              Observações do Contrato
            </label>
            <textarea
              value={portalForm.contratoInfo}
              onChange={(e) => setPortalForm((f) => ({ ...f, contratoInfo: e.target.value }))}
              placeholder="Detalhes adicionais, vigência, cláusulas importantes..."
              rows={3}
              className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
            />
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">
              Dia de Vencimento
            </label>
            <select
              value={portalForm.paymentDay}
              onChange={(e) => setPortalForm((f) => ({ ...f, paymentDay: e.target.value }))}
              className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 mb-3"
            >
              <option value="">Selecione o dia</option>
              {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                <option key={day} value={day}>Dia {day}</option>
              ))}
            </select>
            <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">
              Observações de Pagamento
            </label>
            <textarea
              value={portalForm.pagamentosInfo}
              onChange={(e) => setPortalForm((f) => ({ ...f, pagamentosInfo: e.target.value }))}
              placeholder="Datas de vencimento, formas de pagamento, boleto, Pix..."
              rows={4}
              className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 resize-none"
            />
          </div>
        </div>
      </div>

      {/* Meta Access Token */}
      <div className="glass-card p-5 space-y-3">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <svg className="h-4 w-4 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96C18.34 21.21 22 17.06 22 12.06C22 6.53 17.5 2.04 12 2.04Z"/>
          </svg>
          Token da API Meta
        </h3>
        <p className="text-xs text-muted-foreground">Gerenciado pela Haubitz. O cliente não vê nem edita este campo.</p>
        <input
          type="text"
          value={portalForm.metaAccessToken}
          onChange={(e) => setPortalForm((f) => ({ ...f, metaAccessToken: e.target.value }))}
          placeholder="EAABwzLixnjYBO..."
          className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary/50"
        />
      </div>

      {/* Save button */}
      <button
        onClick={() => savePortalMutation.mutate(portalForm)}
        disabled={savePortalMutation.isPending}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl gradient-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50"
      >
        {savePortalMutation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        Salvar Dados do Portal
      </button>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────
const ClientDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [savingChecklist, setSavingChecklist] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [addingNoteStep, setAddingNoteStep] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'onboarding' | 'portal'>('onboarding');

  const { data: company, isLoading } = useQuery({
    queryKey: ['company', id],
    queryFn: async () => {
      const { data } = await api.get(`/companies/${id}`);
      return (data.data || data) as Company;
    },
  });

  const { data: onboarding } = useQuery({
    queryKey: ['onboarding', id],
    queryFn: async () => {
      const { data } = await api.get(`/onboarding/company/${id}`);
      return data.data || data;
    },
  });

  const ob = onboarding || company?.onboarding;
  const steps: OnboardingStep[] = ob?.steps || [];
  const completedSteps = steps.filter(s => s.status === 'COMPLETED').length;

  const updateStepMutation = useMutation({
    mutationFn: ({ stepNum, body }: { stepNum: number; body: any }) =>
      api.put(`/onboarding/${ob?.id}/steps/${stepNum}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding', id] });
      queryClient.invalidateQueries({ queryKey: ['company', id] });
      toast.success('Etapa atualizada com sucesso!');
    },
    onError: () => toast.error('Erro ao atualizar etapa'),
  });

  const addLogMutation = useMutation({
    mutationFn: ({ stepNum, message }: { stepNum: number; message: string }) =>
      api.post(`/onboarding/${ob?.id}/steps/${stepNum}/logs`, { action: message }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding', id] });
      toast.success('Nota adicionada!');
      setNoteText('');
      setAddingNoteStep(null);
    },
  });

  const toggleChecklist = async (stepNum: number, idx: number, currentChecklist: any[]) => {
    const key = `${stepNum}-${idx}`;
    setSavingChecklist(key);
    const updated = currentChecklist.map((item, i) => i === idx ? { ...item, done: !item.done } : item);
    await updateStepMutation.mutateAsync({ stepNum, body: { checklist: updated } });
    setSavingChecklist(null);
  };

  const updateCompanyMutation = useMutation({
    mutationFn: (data: Partial<Company>) => api.put(`/companies/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company', id] });
      toast.success('Empresa atualizada!');
    },
    onError: () => toast.error('Erro ao atualizar empresa'),
  });

  if (isLoading) return (
    <div className="animate-fade-in">
      <AppHeader title="Cliente" />
      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <MetricCardSkeleton /><MetricCardSkeleton /><MetricCardSkeleton />
      </div>
    </div>
  );

  const getFullUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    return apiBase.replace('/api', '') + url;
  };

  return (
    <div className="animate-fade-in">
      <AppHeader title={company?.name || 'Cliente'} />
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left - Company Info */}
          <div className="space-y-4">
            <div className="glass-card p-5 space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <div className="h-16 w-16 rounded-2xl border-2 border-dashed border-muted-foreground/20 flex items-center justify-center overflow-hidden bg-muted/30">
                    {company?.avatar ? (
                      <img src={getFullUrl(company.avatar)} alt={company.name} className="h-full w-full object-cover" />
                    ) : (
                      <Building2 className="h-8 w-8 text-muted-foreground/40" />
                    )}
                    
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                      <FileUploader
                        onUploadSuccess={(url) => {
                          updateCompanyMutation.mutate({ avatar: url });
                        }}
                        label=""
                        accept="image/*"
                        variant="avatar"
                      />
                    </div>
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground p-1 rounded-lg shadow-lg">
                    <Camera className="h-3 w-3" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{company?.name}</h3>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                {company?.email && (
                  <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-4 w-4" />{company.email}</div>
                )}
                {company?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground flex-1">{company.phone}</span>
                    <a
                      href={`https://wa.me/55${company.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Abrir WhatsApp"
                      className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-500/10 hover:bg-green-500/20 text-green-500 text-xs font-medium transition-colors"
                    >
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.555 4.122 1.526 5.855L.057 23.882l6.219-1.63A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.816 9.816 0 01-5.003-1.374l-.359-.213-3.712.974.99-3.617-.234-.371A9.817 9.817 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182 17.43 2.182 21.818 6.57 21.818 12c0 5.43-4.388 9.818-9.818 9.818z"/>
                      </svg>
                      WhatsApp
                    </a>
                  </div>
                )}
                {company?.website && (
                  <div className="flex items-center gap-2 text-muted-foreground"><Globe className="h-4 w-4" />{company.website}</div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Segmento</p>
                  <p className="text-sm font-medium">{company?.segment || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Plano</p>
                  <p className="text-sm font-medium">{company?.plan || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Status</p>
                  <StatusBadge status={company?.status || 'ACTIVE'} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Contrato</p>
                  <div className="flex items-center gap-1 text-sm">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    {company?.contractStart ? new Date(company.contractStart).toLocaleDateString('pt-BR') : '—'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Tabs (Onboarding / Portal) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Tab Navigation */}
            <div className="flex gap-1 bg-muted/30 p-1 rounded-xl border border-border">
              <button
                onClick={() => setActiveTab('onboarding')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeTab === 'onboarding'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Onboarding
              </button>
              <button
                onClick={() => setActiveTab('portal')}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 ${
                  activeTab === 'portal'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Zap className="h-3.5 w-3.5" />
                Portal do Cliente
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'onboarding' && (
              <div className="glass-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Onboarding</h3>
                  <StatusBadge status={ob?.status || 'NOT_STARTED'} />
                </div>
                
                <ProgressBar value={completedSteps} max={steps.length || 7} className="mb-6" />

                {/* Timeline */}
                <div className="space-y-1">
                  {(steps.length > 0 ? steps : stepTitles.map((t, i) => ({ stepNumber: i + 1, title: t, status: 'PENDING' as const, checklist: [], logs: [] }))).map((step) => {
                    const isExpanded = expandedStep === step.stepNumber;
                    return (
                      <div key={step.stepNumber} className="border border-border rounded-lg overflow-hidden">
                        <button
                          onClick={() => setExpandedStep(isExpanded ? null : step.stepNumber)}
                          className="w-full flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors text-left"
                        >
                          <StepIcon status={step.status} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">Etapa {step.stepNumber} — {step.title}</p>
                            {step.completedAt && (
                              <p className="text-xs text-muted-foreground">Concluída em {new Date(step.completedAt).toLocaleDateString('pt-BR')}</p>
                            )}
                          </div>
                          <StatusBadge status={step.status} />
                        </button>

                        {isExpanded && (
                          <div className="px-4 pb-4 pt-1 border-t border-border space-y-3 animate-fade-in">
                            {step.checklist && step.checklist.length > 0 && (
                              <div className="space-y-2">
                                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Checklist</p>
                                {step.checklist.map((item: any, idx: number) => (
                                  <label key={idx} className="flex items-center gap-2 text-sm cursor-pointer group">
                                    {savingChecklist === `${step.stepNumber}-${idx}` ? (
                                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                    ) : (
                                      <input
                                        type="checkbox"
                                        checked={item.done}
                                        onChange={() => toggleChecklist(step.stepNumber, idx, step.checklist)}
                                        className="rounded border-border text-primary focus:ring-primary"
                                      />
                                    )}
                                    <span className={item.done ? 'line-through text-muted-foreground' : ''}>{item.item}</span>
                                  </label>
                                ))}
                              </div>
                            )}

                            {step.notes && (
                              <div>
                                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Notas</p>
                                <p className="text-sm text-muted-foreground">{step.notes}</p>
                              </div>
                            )}

                            {step.logs && step.logs.length > 0 && (
                              <div>
                                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Histórico</p>
                                <div className="space-y-1">
                                  {step.logs.map((log: any) => (
                                    <div key={log.id} className="text-xs text-muted-foreground flex gap-2">
                                      <span>{new Date(log.createdAt).toLocaleDateString('pt-BR')}</span>
                                      <span>—</span>
                                      <span>{log.action}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {addingNoteStep === step.stepNumber ? (
                              <div className="flex gap-2">
                                <input
                                  value={noteText}
                                  onChange={(e) => setNoteText(e.target.value)}
                                  placeholder="Adicionar nota..."
                                  className="flex-1 bg-muted/50 border border-border rounded-md py-1.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                                <button
                                  onClick={() => addLogMutation.mutate({ stepNum: step.stepNumber, message: noteText })}
                                  disabled={!noteText}
                                  className="px-3 py-1.5 rounded-md bg-primary text-primary-foreground text-xs font-medium disabled:opacity-50"
                                >
                                  Salvar
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setAddingNoteStep(step.stepNumber)}
                                className="text-xs text-primary hover:underline"
                              >
                                + Adicionar Nota
                              </button>
                            )}

                            {step.status !== 'COMPLETED' && (
                              <button
                                onClick={() => updateStepMutation.mutate({
                                  stepNum: step.stepNumber,
                                  body: { status: step.status === 'PENDING' ? 'IN_PROGRESS' : 'COMPLETED' }
                                })}
                                className="text-xs px-3 py-1.5 rounded-md gradient-primary text-primary-foreground font-medium hover:opacity-90"
                              >
                                {step.status === 'PENDING' ? 'Iniciar Etapa' : 'Marcar como Concluída'}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === 'portal' && company && (
              <PortalTab company={company} companyId={id!} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDetailPage;
