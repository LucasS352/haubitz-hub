import { Router } from 'express';
import { onboardingController } from './onboarding.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();
router.use(authenticate);

/**
 * @route  GET /api/onboarding
 * @desc   Lista todos os onboardings (SuperAdmin) ou o do próprio tenant
 * @access Autenticado
 */
router.get('/', onboardingController.list);

/**
 * @route  GET /api/onboarding/company/:companyId
 * @desc   Onboarding completo de uma empresa específica
 * @access Autenticado (com isolamento de tenant)
 */
router.get('/company/:companyId', onboardingController.getByCompany);

/**
 * @route  GET /api/onboarding/:id
 * @desc   Onboarding por ID
 * @access Autenticado
 */
router.get('/:id', onboardingController.getById);

/**
 * @route  PUT /api/onboarding/:id
 * @desc   Atualiza status geral do onboarding
 * @access Autenticado
 */
router.put('/:id', onboardingController.update);

/**
 * @route  PUT /api/onboarding/:id/steps/:stepNumber
 * @desc   Atualiza status/checklist de uma etapa
 * @access Autenticado
 */
router.put('/:id/steps/:stepNumber', onboardingController.updateStep);

/**
 * @route  POST /api/onboarding/:id/steps/:stepNumber/logs
 * @desc   Adiciona log/nota a uma etapa
 * @access Autenticado
 */
router.post('/:id/steps/:stepNumber/logs', onboardingController.addStepLog);

export default router;
