import { v4 as uuidv4 } from 'uuid';
import prisma from '../../config/database';
import { NotFoundError, ForbiddenError } from '../../utils/errors';
import type { UpdateStepInput, AddStepLogInput, UpdateOnboardingInput } from './onboarding.schema';

const ONBOARDING_FULL_SELECT = {
  id: true,
  companyId: true,
  status: true,
  startedAt: true,
  completedAt: true,
  notes: true,
  responsibleId: true,
  createdAt: true,
  updatedAt: true,
  company: { select: { id: true, name: true, segment: true } },
  steps: {
    select: {
      id: true,
      stepNumber: true,
      title: true,
      description: true,
      status: true,
      dueDate: true,
      startedAt: true,
      completedAt: true,
      notes: true,
      checklist: true,
      createdAt: true,
      updatedAt: true,
      logs: {
        select: {
          id: true,
          action: true,
          oldStatus: true,
          newStatus: true,
          notes: true,
          createdAt: true,
          user: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' as const },
        take: 10,
      },
    },
    orderBy: { stepNumber: 'asc' as const },
  },
} as const;

export const onboardingService = {
  /**
   * Busca o onboarding completo de uma empresa com todas as etapas e logs.
   */
  async getByCompany(
    companyId: string,
    callerCompanyId: string | null,
    isSuperAdmin: boolean
  ) {
    // Isolamento de tenant
    if (!isSuperAdmin && callerCompanyId !== companyId) {
      throw new ForbiddenError();
    }

    const onboarding = await prisma.onboarding.findUnique({
      where: { companyId },
      select: ONBOARDING_FULL_SELECT,
    });

    if (!onboarding) throw new NotFoundError('Onboarding não encontrado para esta empresa');
    return onboarding;
  },

  /**
   * Busca onboarding por ID do onboarding.
   */
  async getById(id: string, callerCompanyId: string | null, isSuperAdmin: boolean) {
    const onboarding = await prisma.onboarding.findUnique({
      where: { id },
      select: ONBOARDING_FULL_SELECT,
    });

    if (!onboarding) throw new NotFoundError('Onboarding não encontrado');

    if (!isSuperAdmin && onboarding.companyId !== callerCompanyId) {
      throw new ForbiddenError();
    }

    return onboarding;
  },

  /**
   * Lista todos os onboardings (SuperAdmin) com status resumido.
   */
  async listAll(query: {
    page?: number;
    limit?: number;
    status?: string;
    callerCompanyId: string | null;
    isSuperAdmin: boolean;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      ...(!query.isSuperAdmin && { companyId: query.callerCompanyId }),
      ...(query.status && { status: query.status }),
    };

    const [onboardings, total] = await prisma.$transaction([
      prisma.onboarding.findMany({
        where,
        select: {
          id: true,
          companyId: true,
          status: true,
          startedAt: true,
          completedAt: true,
          updatedAt: true,
          company: { select: { id: true, name: true, segment: true, plan: true } },
          steps: {
            select: { stepNumber: true, status: true },
            orderBy: { stepNumber: 'asc' as const },
          },
        },
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.onboarding.count({ where }),
    ]);

    return { onboardings, total, page, limit };
  },

  /**
   * Atualiza metadados gerais do onboarding (status, responsável).
   */
  async updateOnboarding(
    id: string,
    data: UpdateOnboardingInput,
    callerCompanyId: string | null,
    isSuperAdmin: boolean
  ) {
    const onboarding = await prisma.onboarding.findUnique({ where: { id } });
    if (!onboarding) throw new NotFoundError('Onboarding não encontrado');
    if (!isSuperAdmin && onboarding.companyId !== callerCompanyId) throw new ForbiddenError();

    const updateData: Record<string, unknown> = {};
    if (data.status) {
      updateData.status = data.status;
      if (data.status === 'IN_PROGRESS' && !onboarding.startedAt) {
        updateData.startedAt = new Date();
      }
      if (data.status === 'COMPLETED') {
        updateData.completedAt = new Date();
      }
    }
    if (data.responsibleId !== undefined) updateData.responsibleId = data.responsibleId;
    if (data.notes !== undefined) updateData.notes = data.notes;

    return prisma.onboarding.update({
      where: { id },
      data: updateData,
      select: ONBOARDING_FULL_SELECT,
    });
  },

  /**
   * Atualiza o status/checklist de uma etapa específica.
   */
  async updateStep(
    onboardingId: string,
    stepNumber: number,
    data: UpdateStepInput,
    userId: string,
    callerCompanyId: string | null,
    isSuperAdmin: boolean
  ) {
    const onboarding = await prisma.onboarding.findUnique({
      where: { id: onboardingId },
      select: { companyId: true, status: true },
    });
    if (!onboarding) throw new NotFoundError('Onboarding não encontrado');
    if (!isSuperAdmin && onboarding.companyId !== callerCompanyId) throw new ForbiddenError();

    const step = await prisma.onboardingStep.findUnique({
      where: { onboardingId_stepNumber: { onboardingId, stepNumber } },
    });
    if (!step) throw new NotFoundError(`Etapa ${stepNumber} não encontrada`);

    const oldStatus = step.status;

    const updateData: Record<string, unknown> = {};
    if (data.status) {
      updateData.status = data.status;
      if (data.status === 'IN_PROGRESS' && !step.startedAt) {
        updateData.startedAt = new Date();
      }
      if (data.status === 'COMPLETED') {
        updateData.completedAt = new Date();
      }
    }
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    if (data.checklist !== undefined) updateData.checklist = data.checklist;

    const [updatedStep] = await prisma.$transaction([
      prisma.onboardingStep.update({
        where: { id: step.id },
        data: updateData,
      }),
      // Registra log automático se o status mudou
      ...(data.status && data.status !== oldStatus
        ? [
            prisma.onboardingStepLog.create({
              data: {
                id: uuidv4(),
                stepId: step.id,
                action: `Status alterado de "${oldStatus}" para "${data.status}"`,
                oldStatus,
                newStatus: data.status,
                performedBy: userId,
              },
            }),
          ]
        : []),
      // Atualiza o status geral do onboarding se necessário
      ...(onboarding.status === 'NOT_STARTED' && data.status === 'IN_PROGRESS'
        ? [
            prisma.onboarding.update({
              where: { id: onboardingId },
              data: { status: 'IN_PROGRESS', startedAt: new Date() },
            }),
          ]
        : []),
    ]);

    // Verifica se todas as etapas foram concluídas
    await checkAndCompleteOnboarding(onboardingId);

    return updatedStep;
  },

  /**
   * Adiciona um log manual a uma etapa.
   */
  async addStepLog(
    onboardingId: string,
    stepNumber: number,
    data: AddStepLogInput,
    userId: string,
    callerCompanyId: string | null,
    isSuperAdmin: boolean
  ) {
    const onboarding = await prisma.onboarding.findUnique({
      where: { id: onboardingId },
      select: { companyId: true },
    });
    if (!onboarding) throw new NotFoundError('Onboarding não encontrado');
    if (!isSuperAdmin && onboarding.companyId !== callerCompanyId) throw new ForbiddenError();

    const step = await prisma.onboardingStep.findUnique({
      where: { onboardingId_stepNumber: { onboardingId, stepNumber } },
    });
    if (!step) throw new NotFoundError(`Etapa ${stepNumber} não encontrada`);

    return prisma.onboardingStepLog.create({
      data: {
        id: uuidv4(),
        stepId: step.id,
        action: data.action,
        notes: data.notes ?? null,
        newStatus: data.newStatus ?? null,
        performedBy: userId,
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });
  },
};

/**
 * Verifica se todas as etapas estão concluídas e marca o onboarding como COMPLETED.
 */
async function checkAndCompleteOnboarding(onboardingId: string) {
  const steps = await prisma.onboardingStep.findMany({
    where: { onboardingId },
    select: { status: true },
  });

  const allDone = steps.every(
    (s) => s.status === 'COMPLETED' || s.status === 'SKIPPED'
  );

  if (allDone) {
    await prisma.onboarding.update({
      where: { id: onboardingId },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });
  }
}
