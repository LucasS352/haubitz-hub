import { v4 as uuidv4 } from 'uuid';
import prisma from '../../config/database';
import { NotFoundError, ForbiddenError } from '../../utils/errors';
import { buildPagination } from '../../utils/response';
import type {
  CreateLeadInput,
  UpdateLeadInput,
  UpdateStageInput,
  CreateInteractionInput,
  CreateFollowUpInput,
  UpdateFollowUpInput,
} from './crm.schema';

const LEAD_SELECT = {
  id: true,
  companyId: true,
  name: true,
  email: true,
  phone: true,
  businessName: true,
  segment: true,
  source: true,
  status: true,
  pipelineStage: true,
  proposalValue: true,
  lostReason: true,
  closedAt: true,
  nextContactAt: true,
  notes: true,
  tags: true,
  createdAt: true,
  updatedAt: true,
  company: { select: { id: true, name: true } },
  sdr: { select: { id: true, name: true, email: true } },
  closer: { select: { id: true, name: true, email: true } },
  _count: { select: { interactions: true, followUps: true } },
} as const;

export const crmService = {
  // ========== LEADS ==========

  async listLeads(query: {
    page?: string;
    limit?: string;
    stage?: string;
    companyId?: string;
    sdrId?: string;
    closerId?: string;
    status?: string;
    search?: string;
    callerCompanyId: string | null;
    isSuperAdmin: boolean;
    callerId: string;
    callerRole: string;
  }) {
    const { page, limit, skip } = buildPagination(query);

    const where: Record<string, unknown> = {
      // Isolamento de tenant
      ...(!query.isSuperAdmin && { companyId: query.callerCompanyId }),
      // SuperAdmin pode filtrar por empresa específica
      ...(query.isSuperAdmin && query.companyId && { companyId: query.companyId }),
      // SDR vê apenas seus leads atribuídos + leads sem SDR atribuído
      ...(query.callerRole === 'SDR' && {
        OR: [{ sdrId: query.callerId }, { sdrId: null }],
      }),
      // Closer vê apenas seus leads
      ...(query.callerRole === 'CLOSER' && { closerId: query.callerId }),
      ...(query.stage && { pipelineStage: query.stage }),
      ...(query.sdrId && { sdrId: query.sdrId }),
      ...(query.closerId && { closerId: query.closerId }),
      ...(query.status && { status: query.status }),
      ...(query.search && {
        OR: [
          { name: { contains: query.search } },
          { email: { contains: query.search } },
          { phone: { contains: query.search } },
          { businessName: { contains: query.search } },
        ],
      }),
    };

    const [leads, total] = await prisma.$transaction([
      prisma.lead.findMany({
        where,
        select: LEAD_SELECT,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.lead.count({ where }),
    ]);

    return { leads, total, page, limit };
  },

  async findLeadById(
    id: string,
    callerCompanyId: string | null,
    isSuperAdmin: boolean
  ) {
    const lead = await prisma.lead.findUnique({
      where: { id },
      select: {
        ...LEAD_SELECT,
        interactions: {
          select: {
            id: true,
            type: true,
            notes: true,
            stage: true,
            duration: true,
            createdAt: true,
            user: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        followUps: {
          select: {
            id: true,
            scheduledAt: true,
            notes: true,
            status: true,
            attempt: true,
            result: true,
            completedAt: true,
            createdAt: true,
            user: { select: { id: true, name: true } },
          },
          orderBy: { scheduledAt: 'asc' },
        },
      },
    });

    if (!lead) throw new NotFoundError('Lead não encontrado');
    if (!isSuperAdmin && lead.companyId !== callerCompanyId) throw new ForbiddenError();

    return lead;
  },

  async createLead(
    data: CreateLeadInput,
    callerId: string,
    callerCompanyId: string | null,
    isSuperAdmin: boolean
  ) {
    // Determina o tenant do lead
    const companyId = isSuperAdmin && data.companyId ? data.companyId : callerCompanyId;
    if (!companyId) throw new ForbiddenError('Empresa não identificada para o lead');

    return prisma.lead.create({
      data: {
        id: uuidv4(),
        companyId,
        name: data.name,
        email: data.email ?? null,
        phone: data.phone ?? null,
        businessName: data.businessName ?? null,
        segment: data.segment ?? null,
        source: data.source ?? null,
        sdrId: data.sdrId ?? null,
        closerId: data.closerId ?? null,
        notes: data.notes ?? null,
        tags: data.tags ? JSON.stringify(data.tags) : null,
        pipelineStage: 'LEAD_IN',
      },
      select: LEAD_SELECT,
    });
  },

  async updateLead(
    id: string,
    data: UpdateLeadInput,
    callerCompanyId: string | null,
    isSuperAdmin: boolean
  ) {
    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) throw new NotFoundError('Lead não encontrado');
    if (!isSuperAdmin && lead.companyId !== callerCompanyId) throw new ForbiddenError();

    return prisma.lead.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.businessName !== undefined && { businessName: data.businessName }),
        ...(data.segment !== undefined && { segment: data.segment }),
        ...(data.source !== undefined && { source: data.source }),
        ...(data.sdrId !== undefined && { sdrId: data.sdrId }),
        ...(data.closerId !== undefined && { closerId: data.closerId }),
        ...(data.proposalValue !== undefined && { proposalValue: data.proposalValue }),
        ...(data.lostReason !== undefined && { lostReason: data.lostReason }),
        ...(data.nextContactAt !== undefined && {
          nextContactAt: data.nextContactAt ? new Date(data.nextContactAt) : null,
        }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.tags !== undefined && { tags: JSON.stringify(data.tags) }),
        ...(data.status !== undefined && { status: data.status }),
      },
      select: LEAD_SELECT,
    });
  },

  /**
   * Move o lead para outro estágio do pipeline com registro automático.
   */
  async updateStage(
    id: string,
    data: UpdateStageInput,
    userId: string,
    callerCompanyId: string | null,
    isSuperAdmin: boolean
  ) {
    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) throw new NotFoundError('Lead não encontrado');
    if (!isSuperAdmin && lead.companyId !== callerCompanyId) throw new ForbiddenError();

    const updateData: Record<string, unknown> = { pipelineStage: data.stage };

    if (data.proposalValue !== undefined) updateData.proposalValue = data.proposalValue;
    if (data.lostReason !== undefined) updateData.lostReason = data.lostReason;
    if (data.stage === 'CLOSED_WON' || data.stage === 'CLOSED_LOST') {
      updateData.closedAt = new Date();
    }

    const [updatedLead] = await prisma.$transaction([
      prisma.lead.update({ where: { id }, data: updateData, select: LEAD_SELECT }),
      // Registra a movimentação como interação automática
      prisma.crmInteraction.create({
        data: {
          id: uuidv4(),
          leadId: id,
          type: 'NOTE',
          notes:
            data.notes ||
            `Lead movido para: ${data.stage}${data.lostReason ? ` — Motivo: ${data.lostReason}` : ''}`,
          stage: lead.pipelineStage,
          performedBy: userId,
        },
      }),
    ]);

    return updatedLead;
  },

  // ========== INTERAÇÕES ==========

  async createInteraction(
    leadId: string,
    data: CreateInteractionInput,
    userId: string,
    callerCompanyId: string | null,
    isSuperAdmin: boolean
  ) {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { companyId: true, pipelineStage: true },
    });
    if (!lead) throw new NotFoundError('Lead não encontrado');
    if (!isSuperAdmin && lead.companyId !== callerCompanyId) throw new ForbiddenError();

    return prisma.crmInteraction.create({
      data: {
        id: uuidv4(),
        leadId,
        type: data.type as any,
        notes: data.notes,
        stage: lead.pipelineStage,
        duration: data.duration ?? null,
        performedBy: userId,
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });
  },

  async getInteractions(
    leadId: string,
    callerCompanyId: string | null,
    isSuperAdmin: boolean
  ) {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { companyId: true },
    });
    if (!lead) throw new NotFoundError('Lead não encontrado');
    if (!isSuperAdmin && lead.companyId !== callerCompanyId) throw new ForbiddenError();

    return prisma.crmInteraction.findMany({
      where: { leadId },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  },

  async deleteInteraction(interactionId: string, callerCompanyId: string | null, isSuperAdmin: boolean) {
    const interaction = await prisma.crmInteraction.findUnique({
      where: { id: interactionId },
      include: { lead: { select: { companyId: true } } },
    });
    if (!interaction) throw new NotFoundError('Interação não encontrada');
    if (!isSuperAdmin && interaction.lead.companyId !== callerCompanyId) throw new ForbiddenError();

    await prisma.crmInteraction.delete({ where: { id: interactionId } });
    return true;
  },

  async updateInteraction(interactionId: string, notes: string, callerCompanyId: string | null, isSuperAdmin: boolean) {
    const interaction = await prisma.crmInteraction.findUnique({
      where: { id: interactionId },
      include: { lead: { select: { companyId: true } } },
    });
    if (!interaction) throw new NotFoundError('Interação não encontrada');
    if (!isSuperAdmin && interaction.lead.companyId !== callerCompanyId) throw new ForbiddenError();

    return prisma.crmInteraction.update({
      where: { id: interactionId },
      data: { notes },
      include: { user: { select: { id: true, name: true } } },
    });
  },

  // ========== FOLLOW-UPS ==========

  async createFollowUp(
    leadId: string,
    data: CreateFollowUpInput,
    userId: string,
    callerCompanyId: string | null,
    isSuperAdmin: boolean
  ) {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { companyId: true },
    });
    if (!lead) throw new NotFoundError('Lead não encontrado');
    if (!isSuperAdmin && lead.companyId !== callerCompanyId) throw new ForbiddenError();

    // Atualiza a data do próximo contato no lead
    await prisma.lead.update({
      where: { id: leadId },
      data: { nextContactAt: new Date(data.scheduledAt) },
    });

    return prisma.followUp.create({
      data: {
        id: uuidv4(),
        leadId,
        scheduledAt: new Date(data.scheduledAt),
        notes: data.notes ?? null,
        attempt: data.attempt,
        createdBy: userId,
      },
      include: { user: { select: { id: true, name: true } } },
    });
  },

  async updateFollowUp(
    followUpId: string,
    data: UpdateFollowUpInput,
    callerCompanyId: string | null,
    isSuperAdmin: boolean
  ) {
    const followUp = await prisma.followUp.findUnique({
      where: { id: followUpId },
      include: { lead: { select: { companyId: true } } },
    });
    if (!followUp) throw new NotFoundError('Follow-up não encontrado');
    if (!isSuperAdmin && followUp.lead.companyId !== callerCompanyId) throw new ForbiddenError();

    return prisma.followUp.update({
      where: { id: followUpId },
      data: {
        ...(data.status && { status: data.status as any }),
        ...(data.result !== undefined && { result: data.result }),
        ...(data.scheduledAt && { scheduledAt: new Date(data.scheduledAt) }),
        ...(data.status === 'COMPLETED' && { completedAt: new Date() }),
      },
      include: { user: { select: { id: true, name: true } } },
    });
  },

  // ========== DASHBOARD ==========

  async getDashboard(callerCompanyId: string | null, isSuperAdmin: boolean, filterCompanyId?: string) {
    const companyFilter: any = isSuperAdmin
      ? filterCompanyId
        ? { companyId: filterCompanyId }
        : {}
      : { companyId: callerCompanyId as string };

    const [
      totalLeads,
      activeLeads,
      wonLeads,
      lostLeads,
      pipelineStats,
      recentLeads,
      pendingFollowUps,
    ] = await prisma.$transaction([
      prisma.lead.count({ where: companyFilter }),
      prisma.lead.count({ where: { ...companyFilter, status: 'ACTIVE', NOT: { pipelineStage: { in: ['CLOSED_WON', 'CLOSED_LOST'] } } } }),
      prisma.lead.count({ where: { ...companyFilter, pipelineStage: 'CLOSED_WON' } }),
      prisma.lead.count({ where: { ...companyFilter, pipelineStage: 'CLOSED_LOST' } }),
      // Contagem por estágio
      prisma.lead.groupBy({
        by: ['pipelineStage'],
        where: companyFilter,
        _count: { _all: true },
        orderBy: { pipelineStage: 'asc' },
      } as any),
      // Últimos 5 leads
      prisma.lead.findMany({
        where: companyFilter,
        select: LEAD_SELECT,
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
      // Follow-ups pendentes
      prisma.followUp.count({
        where: {
          status: 'PENDING',
          scheduledAt: { lte: new Date() },
          lead: companyFilter,
        },
      }),
    ]);

    const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : '0';

    return {
      overview: {
        totalLeads,
        activeLeads,
        wonLeads,
        lostLeads,
        conversionRate: `${conversionRate}%`,
        pendingFollowUps,
      },
      pipeline: pipelineStats.map((s: any) => ({
        stage: s.pipelineStage,
        count: s._count?._all || s._count?.pipelineStage || 0,
      })),
      recentLeads,
    };
  },
};
