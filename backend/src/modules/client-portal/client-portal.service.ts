import prisma from '../../config/database';
import { NotFoundError, ValidationError } from '../../utils/errors';

// Campos retornados ao cliente no dashboard (sem dados sensíveis internos)
const PORTAL_SELECT = {
  id: true,
  name: true,
  segment: true,
  avatar: true,
  plan: true,
  contractStart: true,
  contractEnd: true,
  // Métricas financeiras
  investimento: true,
  faturamento: true,
  roi: true,
  // Tráfego pago
  trafegoPagoOrcamento: true,
  // Redes sociais
  instagramUrl: true,
  facebookUrl: true,
  tiktokUrl: true,
  // Contrato e pagamento
  contratoInfo: true,
  pagamentosInfo: true,
  // Token Meta
  metaAccessToken: true,
  // Onboarding resumido
  onboarding: {
    select: {
      id: true,
      status: true,
      steps: {
        select: {
          stepNumber: true,
          title: true,
          description: true,
          status: true,
          completedAt: true,
          startedAt: true,
          checklist: true,
          notes: true,
        },
        orderBy: { stepNumber: 'asc' as const },
      },
    },
  },
} as const;

export const clientPortalService = {
  /**
   * Valida o token do portal e retorna os dados da empresa.
   * Usado na autenticação do cliente.
   */
  async authenticate(token: string) {
    if (!token || token.trim().length < 8) {
      throw new ValidationError('Token inválido');
    }

    const company = await prisma.company.findUnique({
      where: { clientPortalToken: token.trim() },
      select: PORTAL_SELECT,
    });

    if (!company) {
      throw new NotFoundError('Token não encontrado. Verifique com a sua equipe Haubitz.');
    }

    return company;
  },

  /**
   * Retorna os dados completos do portal para a empresa autenticada.
   */
  async getDashboard(companyId: string) {
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: PORTAL_SELECT,
    });

    if (!company) throw new NotFoundError('Empresa não encontrada');
    return company;
  },

  /**
   * Atualiza o orçamento de tráfego pago do cliente.
   * Valor mínimo: R$ 7,00.
   */
  async updateTrafegoPago(companyId: string, orcamento: number) {
    if (orcamento < 7) {
      throw new ValidationError('O valor mínimo para tráfego pago é R$ 7,00');
    }

    return prisma.company.update({
      where: { id: companyId },
      data: { trafegoPagoOrcamento: orcamento },
      select: { id: true, trafegoPagoOrcamento: true },
    });
  },

  /**
   * Salva / atualiza o token da API Meta do cliente.
   */
  async updateMetaToken(companyId: string, token: string) {
    if (!token || token.trim().length < 10) {
      throw new ValidationError('Token Meta inválido');
    }

    return prisma.company.update({
      where: { id: companyId },
      data: { metaAccessToken: token.trim() },
      select: { id: true },
    });
  },
};
