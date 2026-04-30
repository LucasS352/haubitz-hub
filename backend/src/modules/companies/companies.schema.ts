import { z } from 'zod';

export const createCompanySchema = z.object({
  name: z.string({ required_error: 'Nome da empresa é obrigatório' }).min(2).trim(),
  cnpj: z
    .string()
    .optional()
    .nullable()
    .transform((v) => (!v || v.trim() === '') ? null : v.replace(/\D/g, '')), // guarda apenas dígitos, sem validação de tamanho
  email: z.string().email('E-mail inválido').optional().nullable(),
  phone: z.string().optional().nullable(),
  website: z.string().optional().nullable(), // aceita qualquer string, sem validação de URL
  segment: z.string().optional().nullable(),
  plan: z.string().optional().nullable(),
  contractStart: z
    .string()
    .optional()
    .nullable()
    .transform((v) => {
      if (!v || v.trim() === '') return null;
      // Aceita tanto YYYY-MM-DD quanto ISO datetime
      if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return new Date(v + 'T00:00:00.000Z').toISOString();
      return v;
    }),
  contractEnd: z
    .string()
    .optional()
    .nullable()
    .transform((v) => {
      if (!v || v.trim() === '') return null;
      if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return new Date(v + 'T00:00:00.000Z').toISOString();
      return v;
    }),
  notes: z.string().optional().nullable(),
});

export const updateCompanySchema = createCompanySchema.partial().extend({
  status: z.enum(['ACTIVE', 'INACTIVE', 'PAUSED']).optional(),
});

export const listCompaniesSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PAUSED']).optional(),
  search: z.string().optional(),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
