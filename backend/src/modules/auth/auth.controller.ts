import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { authService } from './auth.service';
import {
  loginSchema,
  refreshSchema,
  changePasswordSchema,
} from './auth.schema';
import { success } from '../../utils/response';

export const authController = {
  async login(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = loginSchema.parse(req.body);
      const result = await authService.login(data);
      res.status(200).json(success(result, 'Login realizado com sucesso'));
    } catch (error) {
      next(error);
    }
  },

  async refresh(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = refreshSchema.parse(req.body);
      const result = await authService.refresh(refreshToken);
      res.status(200).json(success(result, 'Token renovado com sucesso'));
    } catch (error) {
      next(error);
    }
  },

  async logout(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = refreshSchema.parse(req.body);
      await authService.logout(refreshToken);
      res.status(200).json(success(null, 'Logout realizado com sucesso'));
    } catch (error) {
      next(error);
    }
  },

  async changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = changePasswordSchema.parse(req.body);
      await authService.changePassword(req.user!.id, data);
      res.status(200).json(success(null, 'Senha alterada com sucesso'));
    } catch (error) {
      next(error);
    }
  },

  async me(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const user = await authService.me(req.user!.id);
      res.status(200).json(success(user, 'Perfil obtido com sucesso'));
    } catch (error) {
      next(error);
    }
  },
};
