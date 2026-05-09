import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Importa as rotas de cada módulo
import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import companiesRoutes from './modules/companies/companies.routes';
import onboardingRoutes from './modules/onboarding/onboarding.routes';
import crmRoutes from './modules/crm/crm.routes';
import clientPortalRoutes from './modules/client-portal/client-portal.routes';
import uploadRoutes from './modules/upload/upload.routes';
import path from 'path';

// =============================================
// INICIALIZAÇÃO DO APP
// =============================================
const app = express();

// =============================================
// MIDDLEWARES DE SEGURANÇA
// =============================================

// Helmet: adiciona headers de segurança HTTP
app.use(helmet());

// CORS: configura origens permitidas
app.use(
  cors({
    origin: env.NODE_ENV === 'production'
      ? ['https://app.haubitz.com.br'] // Domínio de produção
      : ['http://localhost:3001', 'http://localhost:5173', 'http://localhost:8080'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Rate Limiting: proteção contra brute-force e DDoS
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 200, // máx 200 requests por janela
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Muitas requisições. Tente novamente em 15 minutos.',
  },
});

// Rate limit mais restrito para auth (anti brute-force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20, // máx 20 tentativas de login por janela
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Muitas tentativas de login. Aguarde 15 minutos.',
  },
});

app.use(globalLimiter);

// =============================================
// MIDDLEWARES GERAIS
// =============================================

// Parse JSON com limite de 10mb
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir arquivos estáticos da pasta uploads
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Logging de requisições (desabilitado em testes)
if (env.NODE_ENV !== 'test') {
  app.use(
    morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined')
  );
}

// =============================================
// ROTA DE HEALTH CHECK
// =============================================
app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Haubitz Backend está operacional 🚀',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// =============================================
// ROTAS DA API
// =============================================
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/crm', crmRoutes);
app.use('/api/portal', clientPortalRoutes);
app.use('/api/upload', uploadRoutes);

// =============================================
// HANDLERS DE ERRO (DEVEM SER OS ÚLTIMOS)
// =============================================
app.use(notFoundHandler);
app.use(errorHandler);

// =============================================
// INICIALIZA O SERVIDOR
// =============================================
app.listen(env.PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════╗');
  console.log('║     HAUBITZ BACKEND - Sistema Online     ║');
  console.log('╠══════════════════════════════════════════╣');
  console.log(`║  🚀 Porta:    ${env.PORT}                          ║`);
  console.log(`║  🌱 Ambiente: ${env.NODE_ENV.padEnd(12)}              ║`);
  console.log('╠══════════════════════════════════════════╣');
  console.log('║  📋 ENDPOINTS:                           ║');
  console.log('║  GET  /health                            ║');
  console.log('║  POST /api/auth/login                    ║');
  console.log('║  GET  /api/companies          (JWT)      ║');
  console.log('║  GET  /api/onboarding         (JWT)      ║');
  console.log('║  GET  /api/crm/leads          (JWT)      ║');
  console.log('║  GET  /api/crm/dashboard      (JWT)      ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log('');
});

export default app;
