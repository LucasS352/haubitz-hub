import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors';
import { env } from '../config/env';

/**
 * Handler global de erros.
 * Converte todos os erros em respostas JSON padronizadas.
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void => {
  // Erros de validação Zod
  if (err instanceof ZodError) {
    const details = err.errors.map((e) => ({
      campo: e.path.join('.'),
      mensagem: e.message,
    }));

    res.status(400).json({
      success: false,
      message: 'Dados inválidos. Verifique os campos e tente novamente.',
      errors: details,
    });
    return;
  }

  // Erros operacionais conhecidos
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...((err as any).details && { errors: (err as any).details }),
    });
    return;
  }

  // Erros do Prisma (violação de constraint única, etc.)
  if ((err as any).code === 'P2002') {
    res.status(409).json({
      success: false,
      message: 'Conflito: este dado já está cadastrado no sistema.',
    });
    return;
  }

  if ((err as any).code === 'P2025') {
    res.status(404).json({
      success: false,
      message: 'Registro não encontrado.',
    });
    return;
  }

  // Log detalhado apenas em desenvolvimento
  if (env.NODE_ENV === 'development') {
    console.error('❌ ERRO NÃO TRATADO:', err);
  }

  // Erro genérico para produção (não expõe detalhes internos)
  res.status(500).json({
    success: false,
    message:
      env.NODE_ENV === 'development'
        ? err.message
        : 'Erro interno do servidor. Tente novamente mais tarde.',
  });
};

/** Handler para rotas não encontradas (404) */
export const notFoundHandler = (_req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada.',
  });
};
