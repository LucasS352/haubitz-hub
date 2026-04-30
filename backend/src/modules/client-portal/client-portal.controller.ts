import { Request, Response, NextFunction } from 'express';
import { clientPortalService } from './client-portal.service';
import { success } from '../../utils/response';

// Estende o Request para carregar o companyId autenticado via token do portal
export interface PortalRequest extends Request {
  portalCompanyId?: string;
}

export const clientPortalController = {
  /**
   * POST /api/portal/auth
   * Body: { token: string }
   * Valida o token e retorna os dados do dashboard.
   */
  async authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.body as { token: string };
      const company = await clientPortalService.authenticate(token);
      res.json(success({ company }, 'Autenticado com sucesso'));
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/portal/dashboard
   * Header: x-portal-token: <token>
   * Retorna os dados atualizados do dashboard.
   */
  async getDashboard(req: PortalRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const company = await clientPortalService.getDashboard(req.portalCompanyId!);
      res.json(success({ company }, 'Dashboard carregado'));
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /api/portal/trafego-pago
   * Header: x-portal-token: <token>
   * Body: { orcamento: number }
   */
  async updateTrafegoPago(req: PortalRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { orcamento } = req.body as { orcamento: number };
      const result = await clientPortalService.updateTrafegoPago(req.portalCompanyId!, Number(orcamento));
      res.json(success(result, 'Orçamento de tráfego pago atualizado'));
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /api/portal/meta-token
   * Header: x-portal-token: <token>
   * Body: { metaToken: string }
   */
  async updateMetaToken(req: PortalRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { metaToken } = req.body as { metaToken: string };
      await clientPortalService.updateMetaToken(req.portalCompanyId!, metaToken);
      res.json(success(null, 'Token da API Meta salvo com sucesso'));
    } catch (err) {
      next(err);
    }
  },
};
