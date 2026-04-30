import { z } from 'zod';

export const updateStepSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED']).optional(),
  notes: z.string().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  checklist: z
    .array(
      z.object({
        item: z.string(),
        done: z.boolean(),
      })
    )
    .optional(),
});

export const addStepLogSchema = z.object({
  action: z.string({ required_error: 'Descrição da ação é obrigatória' }).min(3),
  notes: z.string().optional().nullable(),
  newStatus: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED']).optional(),
});

export const updateOnboardingSchema = z.object({
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'PAUSED']).optional(),
  responsibleId: z.string().uuid().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type UpdateStepInput = z.infer<typeof updateStepSchema>;
export type AddStepLogInput = z.infer<typeof addStepLogSchema>;
export type UpdateOnboardingInput = z.infer<typeof updateOnboardingSchema>;
