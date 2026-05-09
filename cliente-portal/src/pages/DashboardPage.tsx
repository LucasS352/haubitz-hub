import { useState, useEffect } from 'react'
import api from '../api'
import type { PortalCompany } from '../types'
import MetricBanner from '../components/MetricBanner'
import OnboardingCard from '../components/OnboardingCard'
import QuickActions from '../components/QuickActions'
import TrafegoPagoModal from '../components/TrafegoPagoModal'
import ContratoModal from '../components/ContratoModal'
import PagamentosModal from '../components/PagamentosModal'
import SocialLinks from '../components/SocialLinks'

// Helper para formatar links externos para iframe (Google Drive, Canva, etc)
const formatEmbedUrl = (url: string) => {
  if (!url) return '';
  
  // Google Drive: /view ou /edit -> /preview
  if (url.includes('drive.google.com')) {
    return url.replace(/\/view(\?.*)?$/, '/preview').replace(/\/edit(\?.*)?$/, '/preview');
  }
  
  return url;
};

interface Props {
  company: PortalCompany
  onCompanyUpdate: (c: PortalCompany) => void
  onLogout: () => void
}

export default function DashboardPage({ company, onCompanyUpdate, onLogout }: Props) {
  const [modal, setModal] = useState<'trafego' | 'contrato' | 'pagamentos' | 'planejamento' | null>(null)

  // Sempre busca dados frescos da API ao abrir (garante checklist atualizado)
  useEffect(() => {
    api.get('/portal/dashboard')
      .then(({ data }) => {
        const fresh: PortalCompany = data.data?.company || data.company
        if (fresh) {
          onCompanyUpdate(fresh)
          localStorage.setItem('portal_company', JSON.stringify(fresh))
        }
      })
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])


  const initials = company.name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  const getFullUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    return apiBase.replace('/api', '') + url;
  };

  return (
    <div className="min-h-dvh bg-slate-950 flex flex-col">
      {/* ── Header ───────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-white/5 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar / Iniciais */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-sm font-bold text-white shadow-md overflow-hidden">
            {company.avatar ? (
              <img src={getFullUrl(company.avatar)} alt={company.name} className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div>
            <p className="text-xs text-white/40 leading-none">Bem-vindo(a)</p>
            <p className="text-sm font-semibold text-white leading-tight">{company.name}</p>
          </div>
        </div>

        {/* Logo Haubitz */}
        <div className="flex items-center gap-3">
          <a
            id="btn-suporte"
            href="https://wa.me/5514991159546"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-400 text-xs font-medium px-3 py-1.5 rounded-xl transition-colors"
            title="Suporte humanizado 24h"
          >
            {/* WhatsApp icon */}
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.555 4.122 1.526 5.855L.057 23.882l6.219-1.63A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.816 9.816 0 01-5.003-1.374l-.359-.213-3.712.974.99-3.617-.234-.371A9.817 9.817 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182 17.43 2.182 21.818 6.57 21.818 12c0 5.43-4.388 9.818-9.818 9.818z"/>
            </svg>
            Suporte
          </a>

          <button
            id="btn-logout"
            onClick={onLogout}
            className="text-white/30 hover:text-white/60 transition-colors"
            title="Sair"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </header>

      {/* ── Content ──────────────────────────────── */}
      <main className="flex-1 px-5 py-6 space-y-4 max-w-lg mx-auto w-full animate-fade-in">

        {/* 1. Métricas principais */}
        <MetricBanner company={company} />

        {/* 2. Status do onboarding */}
        <OnboardingCard onboarding={company.onboarding} />

        {/* 2.5. Material de Planejamento (Acesso Rápido) */}
        {company.onboardingPdfUrl && (
          <button
            onClick={() => setModal('planejamento')}
            className="w-full glass p-5 animate-fade-in mt-4 border border-brand-500/10 hover:border-brand-500/40 transition-all duration-300 group relative overflow-hidden text-left"
          >
            {/* Background Decorativo */}
            <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-brand-500/10 rounded-full blur-2xl group-hover:bg-brand-500/20 transition-all" />
            
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-400 group-hover:scale-110 transition-transform shadow-lg border border-brand-500/20">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-[10px] font-bold text-brand-400 uppercase tracking-[0.2em] mb-1">Estratégia & Design</h3>
                <p className="text-sm font-semibold text-white group-hover:text-brand-400 transition-colors">Material de Planejamento</p>
                <p className="text-xs text-white/40">Clique para visualizar o cronograma e ativos</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/30 group-hover:text-brand-400 group-hover:bg-brand-500/20 transition-all">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </button>
        )}

        {/* 3. Ações rápidas (Contrato, Pagamentos, Suporte) */}
        <QuickActions
          onOpenContrato={() => setModal('contrato')}
          onOpenPagamentos={() => setModal('pagamentos')}
          paymentDay={company.paymentDay}
        />

        {/* 4. Botão Tráfego Pago */}
        <button
          id="btn-trafego-pago"
          onClick={() => setModal('trafego')}
          className="w-full glass border border-brand-500/20 hover:border-brand-500/40 transition-all duration-200 p-4 flex items-center gap-4 group"
        >
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shrink-0 shadow-md group-hover:shadow-brand-500/30 transition-shadow">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-semibold text-white">Tráfego Pago</p>
            <p className="text-xs text-white/50">
              {company.trafegoPagoOrcamento
                ? `Orçamento: ${formatCurrency(Number(company.trafegoPagoOrcamento))}`
                : 'Defina seu orçamento mensal'}
            </p>
          </div>
          <svg className="w-4 h-4 text-white/30 group-hover:text-white/60 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* 5. Meu Cadastro */}
        <div className="glass p-4">
          <h3 className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-3">Meu Cadastro</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {company.segment && (
              <div>
                <p className="text-white/40 text-xs mb-0.5">Segmento</p>
                <p className="text-white font-medium">{company.segment}</p>
              </div>
            )}
            {company.plan && (
              <div>
                <p className="text-white/40 text-xs mb-0.5">Plano</p>
                <p className="text-white font-medium">{company.plan}</p>
              </div>
            )}
            {company.contractStart && (
              <div>
                <p className="text-white/40 text-xs mb-0.5">Início do contrato</p>
                <p className="text-white font-medium">
                  {new Date(company.contractStart).toLocaleDateString('pt-BR')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 6. Redes sociais */}
        <SocialLinks company={company} />

      </main>

      {/* Rodapé */}
      <footer className="px-5 py-4 text-center">
        <p className="text-white/20 text-xs">© {new Date().getFullYear()} Haubitz · Portal do Cliente</p>
      </footer>

      {/* ── Modais ───────────────────────────────── */}
      {modal === 'trafego' && (
        <TrafegoPagoModal
          current={Number(company.trafegoPagoOrcamento) || 0}
          onClose={() => setModal(null)}
          onSave={(val) => {
            const updated = { ...company, trafegoPagoOrcamento: val }
            onCompanyUpdate(updated)
            localStorage.setItem('portal_company', JSON.stringify(updated))
            setModal(null)
          }}
        />
      )}


      {modal === 'contrato' && (
        <ContratoModal
          info={company.contratoInfo || ''}
          pdfUrl={company.contractPdfUrl}
          onClose={() => setModal(null)}
        />
      )}

      {modal === 'pagamentos' && (
        <PagamentosModal
          info={company.pagamentosInfo || ''}
          paymentDay={Number(company.paymentDay) || undefined}
          onClose={() => setModal(null)}
        />
      )}

      {modal === 'planejamento' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-blur-xl bg-black/80 animate-fade-in">
          <div className="w-full max-w-4xl max-h-[90dvh] glass rounded-3xl overflow-hidden flex flex-col shadow-2xl border border-white/10">
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand-500/20 flex items-center justify-center text-brand-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h2 className="text-sm font-bold text-white uppercase tracking-widest">Material de Planejamento</h2>
              </div>
              <div className="flex items-center gap-2">
                <a 
                  href={company.onboardingPdfUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all"
                  title="Abrir em nova aba"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
                <button 
                  onClick={() => setModal(null)}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto bg-black/40 min-h-[400px] flex items-center justify-center p-2">
              {/\.(jpg|jpeg|png|webp|gif|svg)$/i.test(company.onboardingPdfUrl!) ? (
                <img 
                  src={company.onboardingPdfUrl} 
                  alt="Planejamento" 
                  className="max-w-full h-auto object-contain shadow-2xl rounded-lg"
                />
              ) : (
                <iframe 
                  src={formatEmbedUrl(company.onboardingPdfUrl!)} 
                  className="w-full h-full min-h-[60vh] border-0 rounded-lg"
                  allowFullScreen
                  title="Planejamento"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function formatCurrency(val: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
}
