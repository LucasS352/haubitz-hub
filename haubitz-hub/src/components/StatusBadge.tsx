import { cn } from '@/lib/utils';
import type { OnboardingStatus, StepStatus, CompanyStatus, PipelineStage } from '@/types';

const statusConfig: Record<string, { label: string; className: string }> = {
  NOT_STARTED: { label: 'Não Iniciado', className: 'bg-muted text-muted-foreground' },
  IN_PROGRESS: { label: 'Em Andamento', className: 'bg-warning/20 text-warning status-pulse' },
  COMPLETED: { label: 'Concluído', className: 'bg-success/20 text-success' },
  PAUSED: { label: 'Pausado', className: 'bg-destructive/20 text-destructive' },
  PENDING: { label: 'Pendente', className: 'bg-muted text-muted-foreground' },
  SKIPPED: { label: 'Pulada', className: 'bg-muted text-muted-foreground' },
  ACTIVE: { label: 'Ativo', className: 'bg-success/20 text-success' },
  INACTIVE: { label: 'Inativo', className: 'bg-muted text-muted-foreground' },
  LEAD_IN: { label: 'Lead In', className: 'bg-primary/20 text-primary' },
  QUALIFICATION: { label: 'Qualificação', className: 'bg-secondary/20 text-secondary' },
  SCHEDULING: { label: 'Agendamento', className: 'bg-warning/20 text-warning' },
  DIAGNOSIS: { label: 'Diagnóstico', className: 'bg-primary/20 text-primary' },
  PROPOSAL: { label: 'Proposta', className: 'bg-secondary/20 text-secondary' },
  NEGOTIATION: { label: 'Negociação', className: 'bg-warning/20 text-warning' },
  FOLLOW_UP: { label: 'Follow-up', className: 'bg-primary/20 text-primary' },
  CLOSED_WON: { label: 'Fechado (Ganho)', className: 'bg-success/20 text-success' },
  CLOSED_LOST: { label: 'Perdido', className: 'bg-destructive/20 text-destructive' },
};

export const StatusBadge = ({ status }: { status: string }) => {
  const config = statusConfig[status] || { label: status, className: 'bg-muted text-muted-foreground' };
  return (
    <span className={cn('px-2.5 py-1 rounded-md text-xs font-medium', config.className)}>
      {config.label}
    </span>
  );
};

export const ProgressBar = ({ value, max, className }: { value: number; max: number; className?: string }) => {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full gradient-primary transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap">{value}/{max} · {pct}%</span>
    </div>
  );
};
