import ModalShell from './ModalShell'

interface Props {
  info: string
  pdfUrl?: string
  onClose: () => void
}

export default function ContratoModal({ info, pdfUrl, onClose }: Props) {
  const getFullUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    return apiBase.replace('/api', '') + url;
  };

  return (
    <ModalShell title="Meu Contrato" onClose={onClose}>
      <div className="space-y-4">
        {pdfUrl && (
          <a
            href={getFullUrl(pdfUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full glass border border-brand-500/30 hover:border-brand-500/60 transition-all p-4 flex items-center justify-between group no-underline"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-white">Documento Original</p>
                <p className="text-xs text-white/50">Clique para abrir o contrato</p>
              </div>
            </div>
            <svg className="w-4 h-4 text-white/30 group-hover:text-brand-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}

        {info ? (
          <div>
            <h4 className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-2 px-1">Observações</h4>
            <div className="glass p-4 text-sm text-white/80 whitespace-pre-wrap leading-relaxed min-h-[80px]">
              {info}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-white/40">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
            </svg>
            <p className="text-sm">Informações do contrato ainda não disponíveis.</p>
            <p className="text-xs mt-1">Entre em contato com a equipe Haubitz.</p>
          </div>
        )}

        <a
          href="https://wa.me/5514991159546"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-ghost w-full flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4 text-green-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.555 4.122 1.526 5.855L.057 23.882l6.219-1.63A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.816 9.816 0 01-5.003-1.374l-.359-.213-3.712.974.99-3.617-.234-.371A9.817 9.817 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182 17.43 2.182 21.818 6.57 21.818 12c0 5.43-4.388 9.818-9.818 9.818z"/>
          </svg>
          Falar com suporte
        </a>
      </div>
    </ModalShell>
  )
}
