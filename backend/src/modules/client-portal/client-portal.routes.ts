import { Router, Request, Response, NextFunction } from 'express';
import { clientPortalController, PortalRequest } from './client-portal.controller';
import prisma from '../../config/database';
import { UnauthorizedError } from '../../utils/errors';

const router = Router();

/**
 * Middleware de autenticação específico do portal.
 * Lê o header `x-portal-token` e resolve o companyId correspondente.
 * Simples, stateless, sem JWT — o token em si é a credencial.
 */
const portalAuth = async (req: PortalRequest, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.headers['x-portal-token'] as string | undefined;
    if (!token) throw new UnauthorizedError('Token do portal não fornecido');

    const company = await prisma.company.findUnique({
      where: { clientPortalToken: token.trim() },
      select: { id: true },
    });

    if (!company) throw new UnauthorizedError('Token inválido');

    req.portalCompanyId = company.id;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * @route  POST /api/portal/auth
 * @desc   Valida o token do cliente e retorna os dados do dashboard
 * @access Público (o token é a credencial)
 */
router.post('/auth', clientPortalController.authenticate);

/**
 * @route  GET /api/portal/dashboard
 * @desc   Retorna dados atualizados do dashboard do cliente
 * @access Token do portal via header x-portal-token
 */
router.get('/dashboard', portalAuth, clientPortalController.getDashboard);

/**
 * @route  PUT /api/portal/trafego-pago
 * @desc   Cliente define orçamento de tráfego pago (mín R$ 7)
 * @access Token do portal via header x-portal-token
 */
router.put('/trafego-pago', portalAuth, clientPortalController.updateTrafegoPago);

/**
 * @route  PUT /api/portal/meta-token
 * @desc   Cliente salva/atualiza token de acesso da API Meta
 * @access Token do portal via header x-portal-token
 */
router.put('/meta-token', portalAuth, clientPortalController.updateMetaToken);

export default router;
