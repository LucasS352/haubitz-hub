import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../../config/database';
import { env } from '../../config/env';
import {
  UnauthorizedError,
  NotFoundError,
  ValidationError,
} from '../../utils/errors';
import type { LoginInput, ChangePasswordInput } from './auth.schema';

// Campos públicos retornados sobre o usuário logado
const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  companyId: true,
  company: {
    select: { id: true, name: true },
  },
} as const;

const generateTokens = (userId: string) => {
  const accessToken = jwt.sign({ userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
  const refreshToken = uuidv4(); // UUID simples como refresh token
  return { accessToken, refreshToken };
};

export const authService = {
  /**
   * Realiza login, valida credenciais e retorna tokens JWT.
   */
  async login(data: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      select: {
        ...USER_SELECT,
        passwordHash: true,
        isActive: true,
      },
    });

    // Mensagem genérica para não revelar se o e-mail existe
    if (!user || !user.isActive) {
      throw new UnauthorizedError('Credenciais inválidas');
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Credenciais inválidas');
    }

    const { accessToken, refreshToken } = generateTokens(user.id);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 dias

    await prisma.$transaction([
      // Salva o refresh token
      prisma.refreshToken.create({
        data: { id: uuidv4(), userId: user.id, token: refreshToken, expiresAt },
      }),
      // Atualiza último login
      prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      }),
    ]);

    const { passwordHash: _, isActive: __, ...safeUser } = user;

    return { accessToken, refreshToken, user: safeUser };
  },

  /**
   * Gera novo access token a partir de um refresh token válido.
   */
  async refresh(refreshToken: string) {
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: { select: { ...USER_SELECT, isActive: true } } },
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      // Remove token expirado se existir
      if (tokenRecord) {
        await prisma.refreshToken.delete({ where: { id: tokenRecord.id } });
      }
      throw new UnauthorizedError('Refresh token inválido ou expirado. Faça login novamente.');
    }

    if (!tokenRecord.user.isActive) {
      throw new UnauthorizedError('Usuário inativo');
    }

    const newAccessToken = jwt.sign({ userId: tokenRecord.user.id }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN,
    });

    return { accessToken: newAccessToken };
  },

  /**
   * Invalida o refresh token (logout).
   */
  async logout(refreshToken: string) {
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
  },

  /**
   * Altera a senha do usuário autenticado.
   */
  async changePassword(userId: string, data: ChangePasswordInput) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    if (!user) throw new NotFoundError('Usuário não encontrado');

    const isCurrentValid = await bcrypt.compare(data.currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      throw new ValidationError('Senha atual incorreta');
    }

    const newHash = await bcrypt.hash(data.newPassword, env.BCRYPT_ROUNDS);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newHash },
      }),
      // Invalida todos os refresh tokens para forçar re-login
      prisma.refreshToken.deleteMany({ where: { userId } }),
    ]);
  },

  /**
   * Retorna os dados do usuário autenticado (perfil).
   */
  async me(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId, isActive: true },
      select: {
        ...USER_SELECT,
        permissions: {
          include: { permission: true },
        },
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) throw new NotFoundError();
    return user;
  },
};
