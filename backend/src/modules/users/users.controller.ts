import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { usersService } from './users.service';
import {
  createUserSchema,
  updateUserSchema,
  updatePermissionsSchema,
  listUsersSchema,
} from './users.schema';
import { success, paginate } from '../../utils/response';

export const usersController = {
  async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const query = listUsersSchema.parse(req.query);
      const { users, total, page, limit } = await usersService.list({
        ...query,
        callerIsSuperAdmin: req.user!.isSuperAdmin,
        callerCompanyId: req.user!.companyId,
      });
      res.status(200).json(paginate(users, total, page, limit, 'Usuários listados com sucesso'));
    } catch (error) {
      next(error);
    }
  },

  async findById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = await usersService.findById(
        req.params.id,
        req.user!.companyId,
        req.user!.isSuperAdmin
      );
      res.status(200).json(success(user, 'Usuário encontrado'));
    } catch (error) {
      next(error);
    }
  },

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = createUserSchema.parse(req.body);
      const user = await usersService.create(data, req.user!.id);
      res.status(201).json(success(user, 'Usuário criado com sucesso'));
    } catch (error) {
      next(error);
    }
  },

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = updateUserSchema.parse(req.body);
      const user = await usersService.update(
        req.params.id,
        data,
        req.user!.companyId,
        req.user!.isSuperAdmin
      );
      res.status(200).json(success(user, 'Usuário atualizado com sucesso'));
    } catch (error) {
      next(error);
    }
  },

  async delete(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await usersService.delete(req.params.id);
      res.status(200).json(success(null, 'Usuário desativado com sucesso'));
    } catch (error) {
      next(error);
    }
  },

  async updatePermissions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = updatePermissionsSchema.parse(req.body);
      const user = await usersService.updatePermissions(req.params.id, data);
      res.status(200).json(success(user, 'Permissões atualizadas com sucesso'));
    } catch (error) {
      next(error);
    }
  },

  async listPermissions(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const permissions = await usersService.listPermissions();
      res.status(200).json(success(permissions, 'Permissões disponíveis'));
    } catch (error) {
      next(error);
    }
  },
};
