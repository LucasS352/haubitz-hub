import { useState, FormEvent } from 'react'
import api from '../api'
import ModalShell from './ModalShell'

interface Props {
  current: number
  onClose: () => void
  onSave: (value: number) => void
}

const MIN = 7

export default function TrafegoPagoModal({ current, onClose, onSave }: Props) {
  const [value, setValue] = useState(current > 0 ? String(current) : '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const numVal = parseFloat(value.replace(',', '.')) || 0

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (numVal < MIN) {
      setError(`O valor mínimo é R$ ${MIN},00`)
      return
    }

    setLoading(true)
    setError('')
    try {
      await api.put('/portal/trafego-pago', { orcamento: numVal })
      onSave(numVal)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erro ao salvar. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <ModalShell title="Tráfego Pago" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-brand-500/10 border border-brand-500/20 rounded-xl p-4 text-sm text-white/70">
          <p>Defina o valor mensal que você deseja investir em anúncios pagos.</p>
          <p className="mt-1 text-xs text-white/40">Valor mínimo: <span className="text-white font-medium">R$ 7,00</span></p>
        </div>

        <div>
          <label className="block text-xs text-white/50 uppercase tracking-widest font-medium mb-2">
            Orçamento mensal (R$)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-semibold">R$</span>
            <input
              id="input-trafego-valor"
              type="number"
              min={MIN}
              step="0.01"
              value={value}
              onChange={(e) => { setValue(e.target.value); setError('') }}
              placeholder="0,00"
              className="portal-input pl-10"
            />
          </div>

          {/* Sugestões rápidas */}
          <div className="flex gap-2 mt-3 flex-wrap">
            {[50, 100, 300, 500, 1000].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setValue(String(v))}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  numVal === v
                    ? 'bg-brand-500 text-white'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
                }`}
              >
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancelar</button>
          <button
            id="btn-salvar-trafego"
            type="submit"
            disabled={loading || numVal < MIN}
            className="btn-primary flex-1"
          >
            {loading ? 'Salvando...' : 'Confirmar'}
          </button>
        </div>
      </form>
    </ModalShell>
  )
}
