import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UnauthorizedError } from '../utils/errors';
import prisma from '../config/database';

// Extende o Request do Express com os dados do usuário autenticado
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    companyId: string | null;
    isSuperAdmin: boolean;
  };
  tenantFilter?: Record<string, unknown>;
}

/**
 * Middleware de autenticação JWT.
 * Valida o token Bearer e injeta o usuário no request.
 */
export const authenticate = async (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Token de acesso não fornecido');
    }

    const token = authHeader.split(' ')[1];

    let decoded: { userId: string };
    try {
      decoded = jwt.verify(token, env.JWT_SECRET) as { userId: string };
    } catch {
      throw new UnauthorizedError('Token inválido ou expirado');
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId, isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        companyId: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError('Usuário não encontrado ou inativo');
    }

    req.user = {
      ...user,
      isSuperAdmin: user.role === 'SUPERADMIN',
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware de autorização por role.
 * SuperAdmin sempre passa. Outros roles verificados via lista.
 */
export const authorize = (...roles: string[]) => {
  return (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
  ): void => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }

    // SuperAdmin tem acesso irrestrito
    if (req.user.isSuperAdmin) {
      return next();
    }

    if (!roles.includes(req.user.role)) {
      const { ForbiddenError } = require('../utils/errors');
      return next(
        new ForbiddenError(
          `Acesso negado. Roles permitidos: ${roles.join(', ')}`
        )
      );
    }

    next();
  };
};
