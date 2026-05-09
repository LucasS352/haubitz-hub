export interface PortalCompany {
  id: string
  name: string
  segment?: string
  avatar?: string
  plan?: string
  contractStart?: string
  contractEnd?: string

  // Métricas financeiras
  investimento?: number | string
  faturamento?: number | string
  roi?: number

  // Tráfego pago
  trafegoPagoOrcamento?: number | string

  // Redes sociais
  instagramUrl?: string
  facebookUrl?: string
  tiktokUrl?: string

  // Contrato & Pagamento
  contratoInfo?: string
  pagamentosInfo?: string
  contractPdfUrl?: string
  paymentDay?: number

  // Meta API
  metaAccessToken?: string

  // Onboarding
  onboardingPdfUrl?: string
  onboarding?: {
    id: string
    status: string
    steps: {
      stepNumber: number
      title: string
      description?: string
      status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED'
      completedAt?: string
      startedAt?: string
      checklist?: { item: string; done: boolean }[]
      notes?: string
    }[]
  }
}
