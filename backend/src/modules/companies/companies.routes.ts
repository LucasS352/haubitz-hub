import { Router } from 'express';
import { companiesController } from './companies.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();
router.use(authenticate);

/**
 * @route  GET /api/companies
 * @desc   Lista empresas (SuperAdmin vê todas; outros veem apenas a sua)
 * @access Todos autenticados
 */
router.get('/', companiesController.list);

/**
 * @route  POST /api/companies
 * @desc   Cadastra nova empresa e cria onboarding automático
 * @access SUPERADMIN
 */
router.post('/', authorize('SUPERADMIN'), companiesController.create);

/**
 * @route  GET /api/companies/:id
 * @desc   Busca empresa por ID com onboarding completo
 * @access Todos autenticados (com isolamento de tenant)
 */
router.get('/:id', companiesController.findById);

/**
 * @route  PUT /api/companies/:id
 * @desc   Atualiza dados da empresa
 * @access SUPERADMIN, ADMIN
 */
router.put('/:id', authorize('SUPERADMIN', 'ADMIN'), companiesController.update);

/**
 * @route  POST /api/companies/:id/generate-portal-token
 * @desc   Gera (ou regenera) o token de acesso ao portal do cliente
 * @access SUPERADMIN, ADMIN
 */
router.post('/:id/generate-portal-token', authorize('SUPERADMIN', 'ADMIN'), companiesController.generateClientToken);

/**
 * @route  PUT /api/companies/:id/portal-data
 * @desc   Atualiza métricas, redes sociais e textos do portal do cliente
 * @access SUPERADMIN, ADMIN
 */
router.put('/:id/portal-data', authorize('SUPERADMIN', 'ADMIN'), companiesController.updatePortalData);

export default router;
