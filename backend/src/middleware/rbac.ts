import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AuthenticatedRequest } from './auth';
import { ForbiddenError } from '../utils/errors';

/**
 * Injeta automaticamente o filtro de tenant no request.
 * - SuperAdmin: vê todos os tenants (ou filtra por ?companyId=)
 * - Outros usuários: filtrados automaticamente para sua empresa
 */
export const injectTenantFilter = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void => {
  if (!req.user) return next();

  if (req.user.isSuperAdmin) {
    // SuperAdmin pode filtrar por empresa específica via query param
    const companyId = req.query.companyId as string | undefined;
    req.tenantFilter = companyId ? { companyId } : {};
  } else {
    // Usuários comuns ficam restritos à sua empresa
    req.tenantFilter = { companyId: req.user.companyId };
  }

  next();
};

/**
 * Verifica se o usuário tem uma permissão específica atribuída por Kayke.
 * SuperAdmin não precisa de permissão explícita.
 */
export const requirePermission = (permissionName: string) => {
  return async (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    if (!req.user) return next(new ForbiddenError());

    // SuperAdmin tem todas as permissões
    if (req.user.isSuperAdmin) return next();

    try {
      const userPermission = await prisma.userPermission.findFirst({
        where: {
          userId: req.user.id,
          permission: { name: permissionName },
        },
      });

      if (!userPermission) {
        return next(
          new ForbiddenError(
            `Permissão necessária: "${permissionName}". Contate o administrador.`
          )
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
