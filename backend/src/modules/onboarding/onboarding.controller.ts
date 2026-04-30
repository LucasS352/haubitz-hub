import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { onboardingService } from './onboarding.service';
import {
  updateStepSchema,
  addStepLogSchema,
  updateOnboardingSchema,
} from './onboarding.schema';
import { success, paginate } from '../../utils/response';

export const onboardingController = {
  async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { status } = req.query;
      const { onboardings, total, page, limit } = await onboardingService.listAll({
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
        status: status as string | undefined,
        callerCompanyId: req.user!.companyId,
        isSuperAdmin: req.user!.isSuperAdmin,
      });
      res.status(200).json(paginate(onboardings, total, page, limit));
    } catch (error) {
      next(error);
    }
  },

  async getByCompany(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const onboarding = await onboardingService.getByCompany(
        req.params.companyId,
        req.user!.companyId,
        req.user!.isSuperAdmin
      );
      res.status(200).json(success(onboarding, 'Onboarding obtido com sucesso'));
    } catch (error) {
      next(error);
    }
  },

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const onboarding = await onboardingService.getById(
        req.params.id,
        req.user!.companyId,
        req.user!.isSuperAdmin
      );
      res.status(200).json(success(onboarding));
    } catch (error) {
      next(error);
    }
  },

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = updateOnboardingSchema.parse(req.body);
      const onboarding = await onboardingService.updateOnboarding(
        req.params.id,
        data,
        req.user!.companyId,
        req.user!.isSuperAdmin
      );
      res.status(200).json(success(onboarding, 'Onboarding atualizado'));
    } catch (error) {
      next(error);
    }
  },

  async updateStep(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = updateStepSchema.parse(req.body);
      const step = await onboardingService.updateStep(
        req.params.id,
        parseInt(req.params.stepNumber),
        data,
        req.user!.id,
        req.user!.companyId,
        req.user!.isSuperAdmin
      );
      res.status(200).json(success(step, 'Etapa atualizada com sucesso'));
    } catch (error) {
      next(error);
    }
  },

  async addStepLog(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = addStepLogSchema.parse(req.body);
      const log = await onboardingService.addStepLog(
        req.params.id,
        parseInt(req.params.stepNumber),
        data,
        req.user!.id,
        req.user!.companyId,
        req.user!.isSuperAdmin
      );
      res.status(201).json(success(log, 'Log registrado com sucesso'));
    } catch (error) {
      next(error);
    }
  },
};
