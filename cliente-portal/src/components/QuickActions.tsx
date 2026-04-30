interface Props {
  onOpenContrato: () => void
  onOpenPagamentos: () => void
}

export default function QuickActions({ onOpenContrato, onOpenPagamentos }: Props) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {/* Meu Contrato */}
      <button
        id="btn-contrato"
        onClick={onOpenContrato}
        className="glass flex flex-col items-center gap-2 p-4 hover:border-white/20 transition-all duration-200 active:scale-95 group"
      >
        <div className="w-10 h-10 rounded-xl bg-white/5 group-hover:bg-white/10 flex items-center justify-center transition-colors">
          <svg className="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
          </svg>
        </div>
        <p className="text-[11px] font-medium text-white/70 text-center leading-tight">Meu Contrato</p>
      </button>

      {/* Pagamentos */}
      <button
        id="btn-pagamentos"
        onClick={onOpenPagamentos}
        className="glass flex flex-col items-center gap-2 p-4 hover:border-white/20 transition-all duration-200 active:scale-95 group"
      >
        <div className="w-10 h-10 rounded-xl bg-white/5 group-hover:bg-white/10 flex items-center justify-center transition-colors">
          <svg className="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-[11px] font-medium text-white/70 text-center leading-tight">Pagamentos</p>
      </button>

      {/* Suporte 24h */}
      <a
        id="btn-suporte-card"
        href="https://wa.me/5514991159546"
        target="_blank"
        rel="noopener noreferrer"
        className="glass flex flex-col items-center gap-2 p-4 hover:border-green-500/30 transition-all duration-200 active:scale-95 group no-underline"
      >
        <div className="w-10 h-10 rounded-xl bg-green-500/10 group-hover:bg-green-500/20 flex items-center justify-center transition-colors">
          <svg className="w-5 h-5 text-green-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.555 4.122 1.526 5.855L.057 23.882l6.219-1.63A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.816 9.816 0 01-5.003-1.374l-.359-.213-3.712.974.99-3.617-.234-.371A9.817 9.817 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182 17.43 2.182 21.818 6.57 21.818 12c0 5.43-4.388 9.818-9.818 9.818z"/>
          </svg>
        </div>
        <p className="text-[11px] font-medium text-white/70 text-center leading-tight">Suporte 24h</p>
      </a>
    </div>
  )
}
