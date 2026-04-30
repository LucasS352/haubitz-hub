import { z } from 'zod';

const pipelineStages = [
  'LEAD_IN',
  'QUALIFICATION',
  'SCHEDULING',
  'DIAGNOSIS',
  'PROPOSAL',
  'NEGOTIATION',
  'FOLLOW_UP',
  'CLOSED_WON',
  'CLOSED_LOST',
] as const;

export const createLeadSchema = z.object({
  name: z.string({ required_error: 'Nome do lead é obrigatório' }).min(2).trim(),
  email: z.string().email('E-mail inválido').optional().nullable(),
  phone: z.string().optional().nullable(),
  businessName: z.string().optional().nullable(),
  segment: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
  companyId: z.string().uuid('ID da empresa inválido').optional(), // SuperAdmin pode definir; outros usam o próprio
  sdrId: z.string().uuid().optional().nullable(),
  closerId: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
});

export const updateLeadSchema = z.object({
  name: z.string().min(2).trim().optional(),
  email: z.string().email().optional().nullable(),
  phone: z.string().optional().nullable(),
  businessName: z.string().optional().nullable(),
  segment: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
  sdrId: z.string().uuid().optional().nullable(),
  closerId: z.string().uuid().optional().nullable(),
  proposalValue: z.number().positive().optional().nullable(),
  lostReason: z.string().optional().nullable(),
  nextContactAt: z.string().datetime().optional().nullable(),
  notes: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export const updateStageSchema = z.object({
  stage: z.enum(pipelineStages, {
    errorMap: () => ({ message: `Stage inválido. Use: ${pipelineStages.join(', ')}` }),
  }),
  notes: z.string().optional().nullable(),
  proposalValue: z.number().positive().optional().nullable(),
  lostReason: z.string().optional().nullable(),
});

export const createInteractionSchema = z.object({
  type: z.enum(['CALL', 'EMAIL', 'WHATSAPP', 'MEETING', 'NOTE'], {
    errorMap: () => ({ message: 'Tipo inválido. Use: CALL, EMAIL, WHATSAPP, MEETING ou NOTE' }),
  }),
  notes: z.string({ required_error: 'Descrição da interação é obrigatória' }).min(3),
  duration: z.number().int().positive().optional().nullable(),
});

export const createFollowUpSchema = z.object({
  scheduledAt: z
    .string({ required_error: 'Data de agendamento é obrigatória' })
    .datetime('Data inválida'),
  notes: z.string().optional().nullable(),
  attempt: z.number().int().min(1).max(5).default(1),
});

export const updateFollowUpSchema = z.object({
  status: z.enum(['PENDING', 'COMPLETED', 'MISSED']).optional(),
  result: z.string().optional().nullable(),
  scheduledAt: z.string().datetime().optional(),
});

export const listLeadsSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  stage: z.enum(pipelineStages).optional(),
  companyId: z.string().uuid().optional(),
  sdrId: z.string().uuid().optional(),
  closerId: z.string().uuid().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  search: z.string().optional(),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export type UpdateStageInput = z.infer<typeof updateStageSchema>;
export type CreateInteractionInput = z.infer<typeof createInteractionSchema>;
export type CreateFollowUpInput = z.infer<typeof createFollowUpSchema>;
export type UpdateFollowUpInput = z.infer<typeof updateFollowUpSchema>;
