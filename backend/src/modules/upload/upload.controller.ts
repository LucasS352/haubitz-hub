import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { success } from '../../utils/response';
import { BadRequestError } from '../../utils/errors';

// Configurar o destino local para os uploads
const uploadDir = path.join(process.cwd(), 'public/uploads');

// Garante que o diretório exista e tenha as permissões certas para o Docker
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
// Forçar permissão de leitura para o Nginx conseguir servir as imagens
try {
  fs.chmodSync(uploadDir, '0755');
} catch (e) {
  console.log('Aviso: Não foi possível mudar permissão da pasta de uploads');
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

      // Garante que o arquivo recém-criado seja legível pelo Nginx (chmod 644)
      try {
        fs.chmodSync(req.file.path, '0644');
      } catch (e) {
        console.log('Aviso: Não foi possível ajustar permissão do arquivo:', req.file.filename);
      }

      // Constrói a URL pública
      const fileUrl = `/uploads/${req.file.filename}`;

      res.status(200).json(success({ url: fileUrl }, 'Arquivo enviado com sucesso'));
    });
  }
};
