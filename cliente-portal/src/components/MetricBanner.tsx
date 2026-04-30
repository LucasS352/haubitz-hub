import type { PortalCompany } from '../types'

interface Props { company: PortalCompany }

function fmt(val: number | string | undefined, isROI = false) {
  const n = Number(val)
  if (!val || isNaN(n)) return '—'
  if (isROI) return `${n}x`
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n)
}

export default function MetricBanner({ company }: Props) {
  const hasMetrics = company.investimento || company.faturamento || company.roi

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-brand-700 to-slate-900 p-5 shadow-xl shadow-brand-900/40">
      {/* Glow decorativo */}
      <div className="absolute -top-8 -right-8 w-32 h-32 bg-brand-400/20 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-6 -left-4 w-24 h-24 bg-brand-800/40 rounded-full blur-xl pointer-events-none" />

      <p className="text-xs font-semibold text-white/60 uppercase tracking-widest mb-4 relative">
        Seus Resultados
      </p>

      {hasMetrics ? (
        <div className="relative grid grid-cols-3 gap-4">
          {/* Investimento */}
          <div>
            <p className="metric-label text-white/50">Investido</p>
            <p className="metric-value text-lg mt-1">{fmt(company.investimento)}</p>
          </div>

          {/* Faturamento */}
          <div>
            <p className="metric-label text-white/50">Faturado</p>
            <p className="metric-value text-lg mt-1">{fmt(company.faturamento)}</p>
          </div>

          {/* ROI */}
          <div>
            <p className="metric-label text-white/50">ROI</p>
            <p className="metric-value text-lg mt-1 text-green-400">{fmt(company.roi, true)}</p>
          </div>
        </div>
      ) : (
        <div className="relative text-center py-4">
          <p className="text-white/40 text-sm">
            Seus resultados aparecerão aqui em breve 🚀
          </p>
        </div>
      )}
    </div>
  )
}
