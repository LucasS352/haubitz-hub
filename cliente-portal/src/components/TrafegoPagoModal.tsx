import { useState, FormEvent } from 'react'
import api from '../api'
import ModalShell from './ModalShell'

interface Props {
  current: number
  currentStartDate?: string
  currentEndDate?: string
  onClose: () => void
  onSave: (value: number, startDate: string, endDate: string) => void
}

const MIN = 7

// Date → YYYY-MM-DD para input[type=date]
const toInputDate = (d: Date | string) => {
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toISOString().split('T')[0]
}

// YYYY-MM-DD → DD/MM
const formatShort = (iso: string) => {
  if (!iso) return ''
  const [, m, day] = iso.split('-')
  return `${day}/${m}`
}

// Adiciona N dias a string YYYY-MM-DD
const addDays = (iso: string, days: number): string => {
  if (!iso) return ''
  const d = new Date(iso + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return toInputDate(d)
}

export default function TrafegoPagoModal({ current, currentStartDate, currentEndDate, onClose, onSave }: Props) {
  const defaultStart = currentStartDate ? toInputDate(currentStartDate) : toInputDate(new Date())
  const defaultEnd   = currentEndDate   ? toInputDate(currentEndDate)   : addDays(defaultStart, 30)

  const [value,     setValue]     = useState(current > 0 ? String(current) : '')
  const [startDate, setStartDate] = useState(defaultStart)
  const [endDate,   setEndDate]   = useState(defaultEnd)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')

  const numVal = parseFloat(value.replace(',', '.')) || 0

  // Quando muda início, auto-ajusta o fim para início + 30 (mas permite edição manual)
  const handleStartChange = (val: string) => {
    setStartDate(val)
    setEndDate(addDays(val, 30))
    setError('')
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (numVal < MIN) {
      setError(`O valor mínimo é R$ ${MIN},00`)
      return
    }
    if (!startDate || !endDate) {
      setError('Informe as datas de início e fim do período.')
      return
    }
    if (endDate <= startDate) {
      setError('A data fim deve ser após a data de início.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const startIso = new Date(startDate + 'T12:00:00').toISOString()
      const endIso   = new Date(endDate   + 'T12:00:00').toISOString()
      await api.put('/portal/trafego-pago', { orcamento: numVal, startDate: startIso, endDate: endIso })
      onSave(numVal, startIso, endIso)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erro ao salvar. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <ModalShell title="Tráfego Pago" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Info */}
        <div className="bg-brand-500/10 border border-brand-500/20 rounded-xl p-4 text-sm text-white/70 space-y-1.5">
          <p>Defina o valor que você deseja investir em anúncios pagos.</p>
          <p className="text-white/80">
            Ajustaremos o orçamento em até 2 horas.
          </p>
          <p className="text-xs text-white/40 pt-1">
            Valor mínimo: <span className="text-white font-medium">R$ 7,00</span>
          </p>
        </div>

        {/* Valor */}
        <div>
          <label className="block text-xs text-white/50 uppercase tracking-widest font-medium mb-2">
            Orçamento (R$)
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

        {/* Período: Início + Fim */}
        <div>
          <label className="block text-xs text-white/50 uppercase tracking-widest font-medium mb-2">
            Período de Veiculação
          </label>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] text-white/40 mb-1">Data de início</p>
              <input
                id="input-trafego-inicio"
                type="date"
                value={startDate}
                onChange={(e) => handleStartChange(e.target.value)}
                className="portal-input w-full text-sm"
                style={{ colorScheme: 'dark' }}
              />
            </div>
            <div>
              <p className="text-[10px] text-white/40 mb-1">Data fim</p>
              <input
                id="input-trafego-fim"
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setError('') }}
                className="portal-input w-full text-sm"
                style={{ colorScheme: 'dark' }}
              />
            </div>
          </div>

          {startDate && endDate && endDate > startDate && (
            <p className="text-xs text-white/40 mt-2 text-center">
              📅 <span className="text-white/60 font-medium">{formatShort(startDate)}</span>
              {' '}→{' '}
              <span className="text-white/60 font-medium">{formatShort(endDate)}</span>
            </p>
          )}
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
            disabled={loading || numVal < MIN || !startDate || !endDate}
            className="btn-primary flex-1"
          >
            {loading ? 'Salvando...' : 'Confirmar'}
          </button>
        </div>
      </form>
    </ModalShell>
  )
}
