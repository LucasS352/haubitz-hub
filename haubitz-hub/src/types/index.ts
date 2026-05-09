export type UserRole = 'SUPERADMIN' | 'ADMIN' | 'SDR' | 'CLOSER' | 'COLLABORATOR';

export interface Permission {
  id: string;
  name: string;
  description?: string;
  module: string;
  action: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyId?: string | null;
  company?: { id: string; name: string } | null;
  isActive: boolean;
  avatar?: string;
  lastLoginAt?: string;
  permissions?: { permission: Permission }[];
  createdAt?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export type CompanyStatus = 'ACTIVE' | 'INACTIVE' | 'PAUSED';
export type OnboardingStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'PAUSED';
export type StepStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED';

export interface StepLog {
  id: string;
  action: string;         // backend retorna "action" (não "message")
  notes?: string;
  oldStatus?: string;
  newStatus?: string;
  createdAt: string;
  user?: { id: string; name: string };
}

export interface ChecklistItem {
  item: string;
  done: boolean;
}

export interface OnboardingStep {
  id: string;
  stepNumber: number;
  title: string;
  description?: string;
  status: StepStatus;
  checklist: ChecklistItem[];
  notes?: string;
  dueDate?: string;
  startedAt?: string;
  completedAt?: string;
  logs: StepLog[];
}

export interface Onboarding {
  id: string;
  companyId: string;
  status: OnboardingStatus;
  startedAt?: string;
  completedAt?: string;
  responsibleId?: string;
  steps: OnboardingStep[];
}

export interface Company {
  id: string;
  name: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  website?: string;
  segment?: string;
  plan?: string;
  status: CompanyStatus;
  contractStart?: string;
  contractEnd?: string;
  onboarding?: Onboarding;
  createdAt?: string;
  _count?: { users: number; leads: number };

  // Portal do Cliente
  clientPortalToken?: string;
  investimento?: number | string;
  faturamento?: number | string;
  roi?: number;
  trafegoPagoOrcamento?: number | string;
  instagramUrl?: string;
  facebookUrl?: string;
  tiktokUrl?: string;
  contratoInfo?: string;
  pagamentosInfo?: string;
  metaAccessToken?: string;
  avatar?: string;
  onboardingPdfUrl?: string;
  contractPdfUrl?: string;
  paymentDay?: number;
}

export type PipelineStage =
  | 'LEAD_IN'
  | 'QUALIFICATION'
  | 'SCHEDULING'
  | 'DIAGNOSIS'
  | 'PROPOSAL'
  | 'NEGOTIATION'
  | 'FOLLOW_UP'
  | 'CLOSED_WON'
  | 'CLOSED_LOST';

export type InteractionType = 'CALL' | 'EMAIL' | 'WHATSAPP' | 'MEETING' | 'NOTE';
export type FollowUpStatus = 'PENDING' | 'COMPLETED' | 'MISSED';

export interface CrmInteraction {
  id: string;
  type: InteractionType;
  notes?: string;
  duration?: number;
  stage?: PipelineStage;
  createdAt: string;
  user?: { id: string; name: string };
  createdBy?: string; // mantido para compatibilidade com UI
}

export interface FollowUp {
  id: string;
  scheduledAt: string;   // backend usa "scheduledAt" (não "scheduledDate")
  notes?: string;
  status: FollowUpStatus; // backend usa enum, não boolean "completed"
  attempt?: number;
  result?: string;
  completedAt?: string;
  user?: { id: string; name: string };
}

export interface Lead {
  id: string;
  companyId?: string;
  name: string;
  email?: string;
  phone?: string;
  businessName?: string;
  source?: string;
  status?: string;
  pipelineStage: PipelineStage;
  proposalValue?: number;
  lostReason?: string;
  closedAt?: string;
  nextContactAt?: string;
  notes?: string;
  sdr?: { id: string; name: string; email: string } | null;
  closer?: { id: string; name: string; email: string } | null;
  interactions: CrmInteraction[];
  followUps: FollowUp[];
  createdAt?: string;
  updatedAt?: string;
  _count?: { interactions: number; followUps: number };
}

// Estrutura real retornada pelo backend em GET /crm/dashboard
export interface CrmDashboard {
  overview: {
    totalLeads: number;
    activeLeads: number;
    wonLeads: number;
    lostLeads: number;
    conversionRate: string; // formato "50.0%" (string)
    pendingFollowUps: number;
  };
  pipeline: { stage: string; count: number }[];
  recentLeads: Lead[];
}

export interface PermissionGroup {
  module: string;
  icon: string;
  permissions: { key: string; label: string }[];
}
