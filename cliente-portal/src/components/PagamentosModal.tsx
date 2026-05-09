import ModalShell from './ModalShell'

interface Props {
  info: string
  paymentDay?: number
  onClose: () => void
}

export default function PagamentosModal({ info, paymentDay, onClose }: Props) {
  return (
    <ModalShell title="Pagamentos" onClose={onClose}>
      <div className="space-y-4">
        {paymentDay && (
          <div className="glass p-4 border border-brand-500/20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400 font-bold">
                {paymentDay}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Vencimento Fixo</p>
                <p className="text-xs text-white/50">Todo dia {paymentDay} de cada mês</p>
              </div>
            </div>
          </div>
        )}

        {info ? (
          <div className="glass p-4 text-sm text-white/80 whitespace-pre-wrap leading-relaxed min-h-[120px]">
            {info}
          </div>
        ) : (
          <div className="text-center py-8 text-white/40">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm">Informações de pagamento ainda não disponíveis.</p>
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
