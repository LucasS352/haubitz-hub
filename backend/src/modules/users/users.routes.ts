import { Router } from 'express';
import { usersController } from './users.controller';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();

// Todas as rotas de usuário requerem autenticação
router.use(authenticate);

/**
 * @route  GET /api/users/permissions
 * @desc   Lista todas as permissões disponíveis para atribuição
 * @access SUPERADMIN
 */
router.get('/permissions', authorize('SUPERADMIN'), usersController.listPermissions);

/**
 * @route  GET /api/users
 * @desc   Lista usuários (SuperAdmin vê todos; outros veem apenas do seu tenant)
 * @access SUPERADMIN, ADMIN
 */
router.get('/', authorize('SUPERADMIN', 'ADMIN'), usersController.list);

/**
 * @route  POST /api/users
 * @desc   Cria novo usuário e define seu papel/empresa
 * @access SUPERADMIN
 */
router.post('/', authorize('SUPERADMIN'), usersController.create);

/**
 * @route  GET /api/users/:id
 * @desc   Busca usuário por ID
 * @access SUPERADMIN, ADMIN
 */
router.get('/:id', authorize('SUPERADMIN', 'ADMIN'), usersController.findById);

/**
 * @route  PUT /api/users/:id
 * @desc   Atualiza dados do usuário
 * @access SUPERADMIN
 */
router.put('/:id', usersController.update);

/**
 * @route  DELETE /api/users/:id
 * @desc   Desativa usuário (soft delete)
 * @access SUPERADMIN
 */
router.delete('/:id', authorize('SUPERADMIN'), usersController.delete);

/**
 * @route  PUT /api/users/:id/permissions
 * @desc   Atualiza permissões de um usuário (Kayke define o acesso)
 * @access SUPERADMIN
 */
router.put('/:id/permissions', authorize('SUPERADMIN'), usersController.updatePermissions);

export default router;
