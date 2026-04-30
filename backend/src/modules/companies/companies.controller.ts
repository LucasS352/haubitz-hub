import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { companiesService } from './companies.service';
import {
  createCompanySchema,
  updateCompanySchema,
  listCompaniesSchema,
} from './companies.schema';
import { success, paginate } from '../../utils/response';

export const companiesController = {
  async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const query = listCompaniesSchema.parse(req.query);
      const { companies, total, page, limit } = await companiesService.list({
        ...query,
        callerIsSuperAdmin: req.user!.isSuperAdmin,
        callerCompanyId: req.user!.companyId,
      });
      res.status(200).json(paginate(companies, total, page, limit, 'Empresas listadas'));
    } catch (error) {
      next(error);
    }
  },

  async findById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const company = await companiesService.findById(
        req.params.id,
        req.user!.companyId,
        req.user!.isSuperAdmin
      );
      res.status(200).json(success(company, 'Empresa encontrada'));
    } catch (error) {
      next(error);
    }
  },

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = createCompanySchema.parse(req.body);
      const company = await companiesService.create(data, req.user!.id);
      res.status(201).json(success(company, 'Empresa criada e onboarding iniciado automaticamente'));
    } catch (error) {
      next(error);
    }
  },

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = updateCompanySchema.parse(req.body);
      const company = await companiesService.update(req.params.id, data);
      res.status(200).json(success(company, 'Empresa atualizada com sucesso'));
    } catch (error) {
      next(error);
    }
  },

  async generateClientToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await companiesService.generateClientToken(req.params.id);
      res.status(200).json(success(result, 'Token do portal gerado com sucesso'));
    } catch (error) {
      next(error);
    }
  },

  async updatePortalData(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const company = await companiesService.updatePortalData(req.params.id, req.body);
      res.status(200).json(success(company, 'Dados do portal atualizados'));
    } catch (error) {
      next(error);
    }
  },
};
