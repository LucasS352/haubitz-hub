import { Router } from 'express';
import { crmController } from './crm.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();
router.use(authenticate);

/**
 * @route  GET /api/crm/dashboard
 * @desc   Dashboard com métricas e visão geral do pipeline
 * @access Autenticado
 */
router.get('/dashboard', crmController.getDashboard);

/**
 * @route  GET /api/crm/leads
 * @desc   Lista leads com filtros (stage, SDR, Closer, etc.)
 * @access Autenticado
 */
router.get('/leads', crmController.listLeads);

/**
 * @route  POST /api/crm/leads
 * @desc   Cria novo lead no pipeline
 * @access SDR, CLOSER, ADMIN, SUPERADMIN
 */
router.post('/leads', authorize('SDR', 'CLOSER', 'ADMIN', 'SUPERADMIN'), crmController.createLead);

/**
 * @route  GET /api/crm/leads/:id
 * @desc   Detalhes completos do lead (com histórico de interações e follow-ups)
 * @access Autenticado
 */
router.get('/leads/:id', crmController.findLeadById);

/**
 * @route  PUT /api/crm/leads/:id
 * @desc   Atualiza dados do lead
 * @access SDR, CLOSER, ADMIN, SUPERADMIN
 */
router.put('/leads/:id', authorize('SDR', 'CLOSER', 'ADMIN', 'SUPERADMIN'), crmController.updateLead);

/**
 * @route  PUT /api/crm/leads/:id/stage
 * @desc   Move lead para outro estágio do pipeline
 * @access SDR, CLOSER, ADMIN, SUPERADMIN
 */
router.put('/leads/:id/stage', authorize('SDR', 'CLOSER', 'ADMIN', 'SUPERADMIN'), crmController.updateStage);

/**
 * @route  GET /api/crm/leads/:id/interactions
 * @desc   Histórico de interações do lead
 * @access Autenticado
 */
router.get('/leads/:id/interactions', crmController.getInteractions);

/**
 * @route  POST /api/crm/leads/:id/interactions
 * @desc   Registra nova interação (ligação, e-mail, WhatsApp, reunião, nota)
 * @access SDR, CLOSER, ADMIN, SUPERADMIN
 */
router.post(
  '/leads/:id/interactions',
  authorize('SDR', 'CLOSER', 'ADMIN', 'SUPERADMIN'),
  crmController.createInteraction
);

/**
 * @route  POST /api/crm/leads/:id/followups
 * @desc   Agenda follow-up (até 5 tentativas)
 * @access SDR, CLOSER, ADMIN, SUPERADMIN
 */
router.post(
  '/leads/:id/followups',
  authorize('SDR', 'CLOSER', 'ADMIN', 'SUPERADMIN'),
  crmController.createFollowUp
);

/**
 * @route  PUT /api/crm/followups/:followUpId
 * @desc   Atualiza status do follow-up (PENDING, COMPLETED, MISSED)
 * @access SDR, CLOSER, ADMIN, SUPERADMIN
 */
router.put(
  '/followups/:followUpId',
  authorize('SDR', 'CLOSER', 'ADMIN', 'SUPERADMIN'),
  crmController.updateFollowUp
);

export default router;
