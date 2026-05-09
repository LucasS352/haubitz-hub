import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { success } from '../../utils/response';
import { BadRequestError } from '../../utils/errors';

// Configurar o destino local para os uploads
const uploadDir = path.join(__dirname, '../../../public/uploads');

// Garante que o diretório exista
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Mantém a extensão original
    const ext = path.extname(file.originalname);
    const uniqueName = `${uuidv4()}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // Limite de 10MB
  },
}).single('file'); // Espera um campo chamado "file"

export const uploadController = {
  uploadFile(req: Request, res: Response, next: NextFunction) {
    upload(req, res, function (err) {
      if (err instanceof multer.MulterError) {
        return next(new BadRequestError(`Erro no upload: ${err.message}`));
      } else if (err) {
        return next(err);
      }

      if (!req.file) {
        return next(new BadRequestError('Nenhum arquivo enviado'));
      }

      // Constrói a URL pública
      // Em produção, isso pode precisar ser ajustado dependendo de proxy reverso
      const fileUrl = `/uploads/${req.file.filename}`;

      res.status(200).json(success({ url: fileUrl }, 'Arquivo enviado com sucesso'));
    });
  }
};
