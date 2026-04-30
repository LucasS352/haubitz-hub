import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

/**
 * @route  POST /api/auth/login
 * @desc   Autenticação - retorna access e refresh token
 * @access Público
 */
router.post('/login', authController.login);

/**
 * @route  POST /api/auth/refresh
 * @desc   Renova access token usando refresh token
 * @access Público
 */
router.post('/refresh', authController.refresh);

/**
 * @route  POST /api/auth/logout
 * @desc   Invalida o refresh token
 * @access Público (token pode estar expirado)
 */
router.post('/logout', authController.logout);

/**
 * @route  PUT /api/auth/change-password
 * @desc   Altera a senha do usuário autenticado
 * @access Privado
 */
router.put('/change-password', authenticate, authController.changePassword);

/**
 * @route  GET /api/auth/me
 * @desc   Retorna dados do usuário autenticado
 * @access Privado
 */
router.get('/me', authenticate, authController.me);

export default router;
