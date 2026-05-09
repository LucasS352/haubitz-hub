import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../../config/database';
import { NotFoundError, ConflictError, ForbiddenError } from '../../utils/errors';
import { buildPagination } from '../../utils/response';
import type { CreateCompanyInput, UpdateCompanyInput } from './companies.schema';

const COMPANY_SELECT = {
  id: true,
  name: true,
  cnpj: true,
  email: true,
  phone: true,
  website: true,
  segment: true,
  status: true,
  avatar: true,
  plan: true,
  contractStart: true,
  contractEnd: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  // Portal do cliente
  clientPortalToken: true,
  investimento: true,
  faturamento: true,
  roi: true,
  trafegoPagoOrcamento: true,
  instagramUrl: true,
  facebookUrl: true,
  tiktokUrl: true,
  contratoInfo: true,
  pagamentosInfo: true,
  metaAccessToken: true,
  onboardingPdfUrl: true,
  contractPdfUrl: true,
  paymentDay: true,
  createdBy: { select: { id: true, name: true } },
  onboarding: {
    select: {
      id: true,
      status: true,
      startedAt: true,
      completedAt: true,
      steps: {
        select: {
          stepNumber: true,
          title: true,
          status: true,
          dueDate: true,
        },
        orderBy: { stepNumber: 'asc' as const },
      },
    },
  },
  _count: {
    select: { users: true, leads: true },
  },
} as const;

export const companiesService = {
  async list(query: {
    page?: string;
    limit?: string;
    status?: string;
    search?: string;
    callerIsSuperAdmin: boolean;
    callerCompanyId: string | null;
  }) {
    const { page, limit, skip } = buildPagination(query);

    const where: Record<string, unknown> = {
      ...(query.status && { status: query.status }),
      ...(query.search && {
        OR: [
          { name: { contains: query.search } },
          { email: { contains: query.search } },
          { cnpj: { contains: query.search } },
        ],
      }),
      // Não-SuperAdmin só vê a sua própria empresa
      ...(!query.callerIsSuperAdmin && { id: query.callerCompanyId }),
    };

    const [companies, total] = await prisma.$transaction([
      prisma.company.findMany({
        where,
        select: COMPANY_SELECT,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.company.count({ where }),
    ]);

    return { companies, total, page, limit };
  },

  async findById(id: string, callerCompanyId?: string | null, isSuperAdmin = false) {
    if (!isSuperAdmin && callerCompanyId !== id) {
      throw new ForbiddenError();
    }

    const company = await prisma.company.findUnique({
      where: { id },
      select: COMPANY_SELECT,
    });

    if (!company) throw new NotFoundError('Empresa não encontrada');
    return company;
  },

  async create(data: CreateCompanyInput, createdById: string) {
    if (data.cnpj) {
      const existing = await prisma.company.findUnique({ where: { cnpj: data.cnpj } });
      if (existing) throw new ConflictError('CNPJ já está cadastrado');
    }

    const company = await prisma.company.create({
      data: {
        id: uuidv4(),
        name: data.name,
        cnpj: data.cnpj ?? null,
        email: data.email ?? null,
        phone: data.phone ?? null,
        website: data.website ?? null,
        segment: data.segment ?? null,
        plan: data.plan ?? null,
        contractStart: data.contractStart ? new Date(data.contractStart) : null,
        contractEnd: data.contractEnd ? new Date(data.contractEnd) : null,
        notes: data.notes ?? null,
        createdById,
      },
      select: COMPANY_SELECT,
    });

    // Cria o onboarding automaticamente com as 7 etapas
    await createDefaultOnboarding(company.id);

    return prisma.company.findUnique({ where: { id: company.id }, select: COMPANY_SELECT });
  },

  async update(id: string, data: UpdateCompanyInput) {
    const company = await prisma.company.findUnique({ where: { id } });
    if (!company) throw new NotFoundError('Empresa não encontrada');

    if (data.cnpj && data.cnpj !== company.cnpj) {
      const conflict = await prisma.company.findFirst({
        where: { cnpj: data.cnpj, NOT: { id } },
      });
      if (conflict) throw new ConflictError('CNPJ já está em uso por outra empresa');
    }

    return prisma.company.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.cnpj !== undefined && { cnpj: data.cnpj }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.website !== undefined && { website: data.website }),
        ...(data.segment !== undefined && { segment: data.segment }),
        ...(data.plan !== undefined && { plan: data.plan }),
        ...(data.status && { status: data.status as any }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.contractStart && { contractStart: new Date(data.contractStart) }),
        ...(data.contractEnd && { contractEnd: new Date(data.contractEnd) }),
        ...(data.onboardingPdfUrl !== undefined && { onboardingPdfUrl: data.onboardingPdfUrl }),
        ...(data.contractPdfUrl !== undefined && { contractPdfUrl: data.contractPdfUrl }),
        ...(data.paymentDay !== undefined && { paymentDay: data.paymentDay }),
        ...(data.avatar !== undefined && { avatar: data.avatar }),
      },
      select: COMPANY_SELECT,
    });
  },

  /**
   * Gera (ou regenera) um token único para o portal do cliente.
   * O token é uma string hexadecimal de 32 bytes (64 caracteres).
   */
  async generateClientToken(id: string) {
    const company = await prisma.company.findUnique({ where: { id } });
    if (!company) throw new NotFoundError('Empresa não encontrada');

    const token = crypto.randomBytes(24).toString('hex'); // 48 chars

    await prisma.company.update({
      where: { id },
      data: { clientPortalToken: token },
    });

    return { token, companyId: id, companyName: company.name };
  },

  /**
   * Atualiza os dados específicos do Portal do Cliente:
   * métricas, redes sociais, informações de contrato e pagamento.
   */
  async updatePortalData(id: string, data: {
    investimento?: number;
    faturamento?: number;
    roi?: number;
    instagramUrl?: string;
    facebookUrl?: string;
    tiktokUrl?: string;
    contratoInfo?: string;
    pagamentosInfo?: string;
    metaAccessToken?: string;
    onboardingPdfUrl?: string;
    contractPdfUrl?: string;
    paymentDay?: number;
  }) {
    const company = await prisma.company.findUnique({ where: { id } });
    if (!company) throw new NotFoundError('Empresa não encontrada');

    return prisma.company.update({
      where: { id },
      data: {
        ...(data.investimento !== undefined && { investimento: data.investimento }),
        ...(data.faturamento  !== undefined && { faturamento:  data.faturamento }),
        ...(data.roi          !== undefined && { roi:          data.roi }),
        ...(data.instagramUrl !== undefined && { instagramUrl: data.instagramUrl }),
        ...(data.facebookUrl  !== undefined && { facebookUrl:  data.facebookUrl }),
        ...(data.tiktokUrl    !== undefined && { tiktokUrl:    data.tiktokUrl }),
        ...(data.contratoInfo    !== undefined && { contratoInfo:    data.contratoInfo }),
        ...(data.pagamentosInfo  !== undefined && { pagamentosInfo:  data.pagamentosInfo }),
        ...(data.metaAccessToken !== undefined && { metaAccessToken: data.metaAccessToken }),
        ...(data.onboardingPdfUrl !== undefined && { onboardingPdfUrl: data.onboardingPdfUrl }),
        ...(data.contractPdfUrl !== undefined && { contractPdfUrl: data.contractPdfUrl }),
        ...(data.paymentDay !== undefined && { paymentDay: data.paymentDay }),
        ...(data.avatar !== undefined && { avatar: data.avatar }),
      },
      select: {
        id: true,
        name: true,
        investimento: true,
        faturamento: true,
        roi: true,
        instagramUrl: true,
        facebookUrl: true,
        tiktokUrl: true,
        contratoInfo: true,
        pagamentosInfo: true,
        metaAccessToken: true,
        clientPortalToken: true,
        onboardingPdfUrl: true,
        contractPdfUrl: true,
        paymentDay: true,
        avatar: true,
      },
    });
  },
};

/**
 * Cria automaticamente o onboarding com as 7 etapas padrão ao cadastrar uma empresa.
 */
async function createDefaultOnboarding(companyId: string) {
  const ONBOARDING_STEPS = [
    {
      stepNumber: 1,
      title: 'Kickoff e Briefing',
      description:
        'Reunião de boas-vindas, apresentação da equipe Haubitz, coleta de dados da empresa e preenchimento do briefing completo com objetivos, público-alvo e diferenciais.',
      checklist: [
        { item: 'Reunião de kickoff agendada e realizada', done: false },
        { item: 'Briefing completo preenchido', done: false },
        { item: 'Objetivos de negócio definidos', done: false },
        { item: 'Público-alvo identificado', done: false },
        { item: 'Canais de comunicação definidos', done: false },
      ],
    },
    {
      stepNumber: 2,
      title: 'Acessos e Configurações Técnicas',
      description:
        'Configuração de todos os acessos necessários: Meta Business Manager, Google Ads, Google Analytics, pixel de conversão, Business Profile e demais plataformas.',
      checklist: [
        { item: 'Acesso ao Meta Business Manager concedido', done: false },
        { item: 'Pixel do Facebook instalado e verificado', done: false },
        { item: 'Google Ads configurado', done: false },
        { item: 'Google Analytics instalado', done: false },
        { item: 'Google Business Profile otimizado', done: false },
        { item: 'Acesso ao site/e-commerce concedido', done: false },
      ],
    },
    {
      stepNumber: 3,
      title: 'Diagnóstico e Análise de Mercado',
      description:
        'Análise profunda da situação atual do cliente: performance das contas, análise de concorrentes, posicionamento de mercado, gaps de oportunidade e pontos de melhoria.',
      checklist: [
        { item: 'Análise das contas de tráfego existentes', done: false },
        { item: 'Análise de concorrentes (top 3)', done: false },
        { item: 'Estudo do posicionamento atual', done: false },
        { item: 'Relatório de diagnóstico enviado ao cliente', done: false },
        { item: 'Oportunidades de crescimento identificadas', done: false },
      ],
    },
    {
      stepNumber: 4,
      title: 'Planejamento Estratégico',
      description:
        'Definição da estratégia de crescimento: metas SMART, funil de vendas, estratégia de conteúdo, calendário editorial e cronograma de entregas mensais.',
      checklist: [
        { item: 'Metas mensais definidas (SMART)', done: false },
        { item: 'Funil de vendas mapeado', done: false },
        { item: 'Estratégia de conteúdo aprovada', done: false },
        { item: 'Calendário editorial do 1º mês criado', done: false },
        { item: 'Cronograma de entregas alinhado com o cliente', done: false },
      ],
    },
    {
      stepNumber: 5,
      title: 'Criação de Identidade Visual e Conteúdo',
      description:
        'Desenvolvimento ou refinamento da identidade visual, criação dos primeiros materiais, definição de linha editorial, tom de voz e diretrizes de marca.',
      checklist: [
        { item: 'Identidade visual aprovada', done: false },
        { item: 'Linha editorial definida', done: false },
        { item: 'Tom de voz documentado', done: false },
        { item: 'Primeiros criativos desenvolvidos', done: false },
        { item: 'Banco de imagens e vídeos organizado', done: false },
      ],
    },
    {
      stepNumber: 6,
      title: 'Ativação de Campanhas de Tráfego',
      description:
        'Configuração e lançamento das campanhas de tráfego pago: estrutura de campanhas, segmentação de público, criativos testados, orçamento definido e primeiros anúncios no ar.',
      checklist: [
        { item: 'Estrutura de campanhas criada', done: false },
        { item: 'Públicos segmentados e configurados', done: false },
        { item: 'Criativos de anúncio aprovados', done: false },
        { item: 'Campanhas ativadas', done: false },
        { item: 'Rastreamento de conversões validado', done: false },
      ],
    },
    {
      stepNumber: 7,
      title: 'Entrega e Revisão de Resultados',
      description:
        'Apresentação dos primeiros resultados, dashboard de métricas configurado, ajustes finos nas campanhas, alinhamento de expectativas e onboarding oficialmente concluído.',
      checklist: [
        { item: 'Relatório dos primeiros resultados entregue', done: false },
        { item: 'Reunião de revisão realizada', done: false },
        { item: 'Ajustes pós-análise implementados', done: false },
        { item: 'Dashboard de métricas entregue ao cliente', done: false },
        { item: 'Onboarding oficialmente concluído e aprovado', done: false },
      ],
    },
  ];

  const onboardingId = uuidv4();

  await prisma.onboarding.create({
    data: {
      id: onboardingId,
      companyId,
      status: 'NOT_STARTED',
      steps: {
        create: ONBOARDING_STEPS.map((step) => ({
          id: uuidv4(),
          stepNumber: step.stepNumber,
          title: step.title,
          description: step.description,
          status: 'PENDING',
          checklist: step.checklist,
        })),
      },
    },
  });
}
