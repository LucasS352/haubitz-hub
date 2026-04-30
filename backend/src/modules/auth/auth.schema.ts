import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'E-mail é obrigatório' })
    .email('E-mail inválido')
    .toLowerCase()
    .trim(),
  password: z
    .string({ required_error: 'Senha é obrigatória' })
    .min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

export const refreshSchema = z.object({
  refreshToken: z
    .string({ required_error: 'Refresh token é obrigatório' })
    .min(10, 'Refresh token inválido'),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string({ required_error: 'Senha atual é obrigatória' })
      .min(1),
    newPassword: z
      .string({ required_error: 'Nova senha é obrigatória' })
      .min(8, 'Nova senha deve ter no mínimo 8 caracteres')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Nova senha deve conter letras maiúsculas, minúsculas e números'
      ),
    confirmPassword: z.string({ required_error: 'Confirmação de senha é obrigatória' }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
