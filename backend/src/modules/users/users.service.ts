import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../../config/database';
import { env } from '../../config/env';
import {
  NotFoundError,
  ConflictError,
  ForbiddenError,
} from '../../utils/errors';
import { buildPagination } from '../../utils/response';
import type {
  CreateUserInput,
  UpdateUserInput,
  UpdatePermissionsInput,
} from './users.schema';

const USER_PUBLIC_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  companyId: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
  company: { select: { id: true, name: true } },
  permissions: { include: { permission: true } },
} as const;

export const usersService = {
  async list(query: {
    page?: string;
    limit?: string;
    role?: string;
    companyId?: string;
    isActive?: string;
    search?: string;
    callerIsSuperAdmin: boolean;
    callerCompanyId: string | null;
  }) {
    const { page, limit, skip } = buildPagination(query);

    const where: Record<string, unknown> = {
      // Usuários não-SUPERADMIN não veem outros tenants
      ...(query.callerIsSuperAdmin ? {} : { companyId: query.callerCompanyId }),
      ...(query.role && { role: query.role }),
      ...(query.companyId && query.callerIsSuperAdmin && { companyId: query.companyId }),
      ...(query.isActive !== undefined && { isActive: query.isActive === 'true' }),
      ...(query.search && {
        OR: [
          { name: { contains: query.search } },
          { email: { contains: query.search } },
        ],
      }),
      // Nunca exibe o SuperAdmin na lista
      NOT: { role: 'SUPERADMIN' },
    };

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        select: USER_PUBLIC_SELECT,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total, page, limit };
  },

  async findById(id: string, callerCompanyId?: string | null, isSuperAdmin = false) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: USER_PUBLIC_SELECT,
    });

    if (!user) throw new NotFoundError('Usuário não encontrado');

    // Garante isolamento de tenant
    if (!isSuperAdmin && user.companyId !== callerCompanyId) {
      throw new ForbiddenError();
    }

    return user;
  },

  async create(data: CreateUserInput, createdById: string) {
    const exists = await prisma.user.findUnique({ where: { email: data.email } });
    if (exists) throw new ConflictError('Este e-mail já está cadastrado');

    const passwordHash = await bcrypt.hash(data.password, env.BCRYPT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        id: uuidv4(),
        name: data.name,
        email: data.email,
        passwordHash,
        role: data.role as any,
        companyId: data.companyId ?? null,
      },
      select: USER_PUBLIC_SELECT,
    });

    return user;
  },

  async update(id: string, data: UpdateUserInput, callerCompanyId?: string | null, isSuperAdmin = false) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundError('Usuário não encontrado');
    if (user.role === 'SUPERADMIN') throw new ForbiddenError('Não é possível editar o SuperAdmin');

    if (!isSuperAdmin && user.companyId !== callerCompanyId) {
      throw new ForbiddenError();
    }

    if (data.email) {
      const conflict = await prisma.user.findFirst({
        where: { email: data.email, NOT: { id } },
      });
      if (conflict) throw new ConflictError('E-mail já em uso por outro usuário');
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.email && { email: data.email }),
        ...(data.role && { role: data.role as any }),
        ...(data.companyId !== undefined && { companyId: data.companyId }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      select: USER_PUBLIC_SELECT,
    });

    return updated;
  },

  async delete(id: string) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundError('Usuário não encontrado');
    if (user.role === 'SUPERADMIN') throw new ForbiddenError('Não é possível excluir o SuperAdmin');

    // Soft delete - apenas desativa
    await prisma.user.update({ where: { id }, data: { isActive: false } });
  },

  async updatePermissions(userId: string, data: UpdatePermissionsInput) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('Usuário não encontrado');
    if (user.role === 'SUPERADMIN') throw new ForbiddenError('SuperAdmin já tem todas as permissões');

    // Substitui todas as permissões
    await prisma.$transaction([
      prisma.userPermission.deleteMany({ where: { userId } }),
      ...(data.permissions.length > 0
        ? [
            prisma.userPermission.createMany({
              data: data.permissions.map((permissionId) => ({
                userId,
                permissionId,
              })),
              skipDuplicates: true,
            }),
          ]
        : []),
    ]);

    return prisma.user.findUnique({
      where: { id: userId },
      select: USER_PUBLIC_SELECT,
    });
  },

  async listPermissions() {
    return prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { action: 'asc' }],
    });
  },
};
