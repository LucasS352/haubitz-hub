import { Router } from 'express';
import { uploadController } from './upload.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();
router.use(authenticate);

/**
 * @route  POST /api/upload
 * @desc   Upload de arquivo (imagem/pdf)
 * @access Autenticado
 */
router.post('/', uploadController.uploadFile);

export default router;
