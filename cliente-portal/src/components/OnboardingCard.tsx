import { useState } from 'react'
import type { PortalCompany } from '../types'

type Step = NonNullable<PortalCompany['onboarding']>['steps'][number]

interface Props {
  onboarding?: PortalCompany['onboarding']
}

const STATUS_CONFIG = {
  COMPLETED:  { label: 'Concluída',   color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20',   dot: 'bg-green-400' },
  IN_PROGRESS:{ label: 'Em andamento',color: 'text-brand-400',  bg: 'bg-brand-500/10 border-brand-500/20',   dot: 'bg-brand-400 animate-pulse' },
  PENDING:    { label: 'Pendente',    color: 'text-white/40',   bg: 'bg-white/5 border-white/10',            dot: 'bg-white/20' },
  SKIPPED:    { label: 'Ignorada',    color: 'text-white/30',   bg: 'bg-white/5 border-white/5',             dot: 'bg-white/10' },
}

function StepRow({ step, index, isExpanded, onToggle }: {
  step: Step
  index: number
  isExpanded: boolean
  onToggle: () => void
}) {
  const cfg = STATUS_CONFIG[step.status] || STATUS_CONFIG.PENDING
  const checklist = (step.checklist || []) as { item: string; done: boolean }[]
  const doneCount = checklist.filter(c => c.done).length

  // Todas as etapas são clicáveis — o cliente pode sempre ver o detalhe
  return (
    <div className={`rounded-xl border transition-all duration-200 ${isExpanded ? cfg.bg : 'bg-white/3 border-white/5'}`}>
      {/* Row header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left cursor-pointer"
      >
        {/* Step number / status icon */}
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0
          ${step.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' :
            step.status === 'IN_PROGRESS' ? 'bg-brand-500/20 text-brand-400' : 'bg-white/5 text-white/30'}`}>
          {step.status === 'COMPLETED' ? (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : step.stepNumber}
        </div>

        {/* Title + sub info */}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium leading-tight ${step.status === 'PENDING' ? 'text-white/50' : 'text-white'}`}>
            {step.title}
          </p>
          <p className={`text-xs mt-0.5 ${cfg.color}`}>
            {step.status === 'COMPLETED' && step.completedAt
              ? `Concluída em ${new Date(step.completedAt).toLocaleDateString('pt-BR')}`
              : step.status === 'IN_PROGRESS'
              ? 'Em andamento agora'
              : cfg.label}
            {checklist.length > 0 && step.status !== 'PENDING' && (
              <span className="text-white/30 ml-2">· {doneCount}/{checklist.length} itens</span>
            )}
          </p>
        </div>

        {/* Chevron — sempre visível */}
        <svg
          className={`w-4 h-4 text-white/40 transition-transform duration-200 shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded detail */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-white/5 pt-4 animate-fade-in">

          {/* Descrição */}
          {step.description && (
            <p className="text-sm text-white/60 leading-relaxed">{step.description}</p>
          )}

          {/* Checklist (read-only para o cliente) */}
          {checklist.length > 0 ? (
            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-white/40 uppercase tracking-widest">Checklist</p>
              <div className="space-y-1.5">
                {checklist.map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border
                      ${item.done ? 'bg-green-500/20 border-green-500/30' : 'bg-white/5 border-white/15'}`}>
                      {item.done && (
                        <svg className="w-2.5 h-2.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className={`text-xs ${item.done ? 'text-white/50 line-through' : 'text-white/70'}`}>
                      {item.item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : !step.description && !step.notes ? (
            <p className="text-xs text-white/30 italic">Nenhum detalhe disponível para esta etapa ainda.</p>
          ) : null}

          {/* Notas visíveis ao cliente */}
          {step.notes && (
            <div className="bg-white/5 rounded-lg px-3 py-2.5">
              <p className="text-[10px] font-semibold text-white/40 uppercase tracking-widest mb-1">Observações</p>
              <p className="text-xs text-white/60 leading-relaxed">{step.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function OnboardingCard({ onboarding }: Props) {
  const [expandedStep, setExpandedStep] = useState<number | null>(null)
  const [isCardExpanded, setIsCardExpanded] = useState(false)

  if (!onboarding) {
    return (
      <div className="glass p-4">
        <p className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-2">Onde estamos</p>
        <p className="text-sm text-white/40">Onboarding ainda não iniciado.</p>
      </div>
    )
  }

  const steps = onboarding.steps || []
  const completed = steps.filter(s => s.status === 'COMPLETED').length
  const total = steps.length || 7
  const pct = Math.round((completed / total) * 100)

  return (
    <div className="glass p-4 space-y-4">
      {/* Cabeçalho + barra */}
      <button 
        onClick={() => setIsCardExpanded(!isCardExpanded)}
        className="w-full flex items-center justify-between cursor-pointer group"
      >
        <p className="text-xs font-semibold text-white/50 uppercase tracking-widest group-hover:text-white/70 transition-colors">Meu Onboarding</p>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-brand-400">{completed}/{total} concluídas</span>
          <svg
            className={`w-4 h-4 text-white/40 transition-transform duration-200 ${isCardExpanded ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-brand-400 to-brand-600 rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Lista de etapas */}
      {isCardExpanded && (
        <div className="space-y-2 animate-fade-in pt-2">
          {steps.map((step, index) => (
            <StepRow
              key={step.stepNumber}
              step={step}
              index={index}
              isExpanded={expandedStep === step.stepNumber}
              onToggle={() => setExpandedStep(expandedStep === step.stepNumber ? null : step.stepNumber)}
            />
          ))}

          {onboarding.status === 'COMPLETED' && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 text-center mt-2">
              <p className="text-sm font-semibold text-green-400">🎉 Onboarding 100% concluído!</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
