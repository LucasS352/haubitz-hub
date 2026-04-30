import { z } from 'zod';

export const createUserSchema = z.object({
  name: z
    .string({ required_error: 'Nome é obrigatório' })
    .min(2, 'Nome deve ter ao menos 2 caracteres')
    .trim(),
  email: z
    .string({ required_error: 'E-mail é obrigatório' })
    .email('E-mail inválido')
    .toLowerCase()
    .trim(),
  password: z
    .string({ required_error: 'Senha é obrigatória' })
    .min(8, 'Senha deve ter ao menos 8 caracteres')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Senha deve conter letras maiúsculas, minúsculas e números'
    ),
  role: z.enum(['ADMIN', 'SDR', 'CLOSER', 'COLLABORATOR'], {
    errorMap: () => ({ message: 'Role inválido. Use: ADMIN, SDR, CLOSER ou COLLABORATOR' }),
  }),
  companyId: z.string().uuid('ID da empresa inválido').optional().nullable(),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).trim().optional(),
  email: z.string().email().toLowerCase().trim().optional(),
  role: z.enum(['ADMIN', 'SDR', 'CLOSER', 'COLLABORATOR']).optional(),
  companyId: z.string().uuid().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const updatePermissionsSchema = z.object({
  permissions: z
    .array(z.string().uuid('ID de permissão inválido'))
    .min(0, 'Lista de permissões inválida'),
});

export const listUsersSchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  role: z.enum(['SUPERADMIN', 'ADMIN', 'SDR', 'CLOSER', 'COLLABORATOR']).optional(),
  companyId: z.string().uuid().optional(),
  isActive: z.enum(['true', 'false']).optional(),
  search: z.string().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdatePermissionsInput = z.infer<typeof updatePermissionsSchema>;
