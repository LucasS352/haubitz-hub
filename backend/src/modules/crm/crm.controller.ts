import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth';
import { crmService } from './crm.service';
import {
  createLeadSchema,
  updateLeadSchema,
  updateStageSchema,
  createInteractionSchema,
  createFollowUpSchema,
  updateFollowUpSchema,
  listLeadsSchema,
} from './crm.schema';
import { success, paginate } from '../../utils/response';

export const crmController = {
  async listLeads(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const query = listLeadsSchema.parse(req.query);
      const { leads, total, page, limit } = await crmService.listLeads({
        ...query,
        callerCompanyId: req.user!.companyId,
        isSuperAdmin: req.user!.isSuperAdmin,
        callerId: req.user!.id,
        callerRole: req.user!.role,
      });
      res.status(200).json(paginate(leads, total, page, limit, 'Leads listados'));
    } catch (error) {
      next(error);
    }
  },

  async findLeadById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const lead = await crmService.findLeadById(
        req.params.id,
        req.user!.companyId,
        req.user!.isSuperAdmin
      );
      res.status(200).json(success(lead, 'Lead encontrado'));
    } catch (error) {
      next(error);
    }
  },

  async createLead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = createLeadSchema.parse(req.body);
      const lead = await crmService.createLead(
        data,
        req.user!.id,
        req.user!.companyId,
        req.user!.isSuperAdmin
      );
      res.status(201).json(success(lead, 'Lead criado com sucesso'));
    } catch (error) {
      next(error);
    }
  },

  async updateLead(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = updateLeadSchema.parse(req.body);
      const lead = await crmService.updateLead(
        req.params.id,
        data,
        req.user!.companyId,
        req.user!.isSuperAdmin
      );
      res.status(200).json(success(lead, 'Lead atualizado'));
    } catch (error) {
      next(error);
    }
  },

  async updateStage(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = updateStageSchema.parse(req.body);
      const lead = await crmService.updateStage(
        req.params.id,
        data,
        req.user!.id,
        req.user!.companyId,
        req.user!.isSuperAdmin
      );
      res.status(200).json(success(lead, `Lead movido para ${data.stage}`));
    } catch (error) {
      next(error);
    }
  },

  async createInteraction(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = createInteractionSchema.parse(req.body);
      const interaction = await crmService.createInteraction(
        req.params.id,
        data,
        req.user!.id,
        req.user!.companyId,
        req.user!.isSuperAdmin
      );
      res.status(201).json(success(interaction, 'Interação registrada'));
    } catch (error) {
      next(error);
    }
  },

  async getInteractions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const interactions = await crmService.getInteractions(
        req.params.id,
        req.user!.companyId,
        req.user!.isSuperAdmin
      );
      res.status(200).json(success(interactions));
    } catch (error) {
      next(error);
    }
  },

  async createFollowUp(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = createFollowUpSchema.parse(req.body);
      const followUp = await crmService.createFollowUp(
        req.params.id,
        data,
        req.user!.id,
        req.user!.companyId,
        req.user!.isSuperAdmin
      );
      res.status(201).json(success(followUp, 'Follow-up agendado'));
    } catch (error) {
      next(error);
    }
  },

  async updateFollowUp(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = updateFollowUpSchema.parse(req.body);
      const followUp = await crmService.updateFollowUp(
        req.params.followUpId,
        data,
        req.user!.companyId,
        req.user!.isSuperAdmin
      );
      res.status(200).json(success(followUp, 'Follow-up atualizado'));
    } catch (error) {
      next(error);
    }
  },

  async getDashboard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const filterCompanyId = req.query.companyId as string | undefined;
      const dashboard = await crmService.getDashboard(
        req.user!.companyId,
        req.user!.isSuperAdmin,
        filterCompanyId
      );
      res.status(200).json(success(dashboard, 'Dashboard CRM'));
    } catch (error) {
      next(error);
    }
  },
};
