"use strict";
/**
 * SEED INICIAL - Sistema Haubitz
 *
 * Cria:
 * 1. O usuário SuperAdmin (Kayke) com acesso total
 * 2. Todas as permissões padrão do sistema
 * 3. Atribui todas as permissões ao Kayke (redundante, mas mantido para referência)
 *
 * Execute: npm run seed
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const uuid_1 = require("uuid");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const prisma = new client_1.PrismaClient();
// =========================================================
// PERMISSÕES PADRÃO DO SISTEMA
// Kayke pode atribuir qualquer combinação destas para os usuários
// =========================================================
const DEFAULT_PERMISSIONS = [
    // --- Empresas ---
    { module: 'companies', action: 'read', name: 'companies:read', description: 'Visualizar empresas cadastradas' },
    { module: 'companies', action: 'write', name: 'companies:write', description: 'Cadastrar e editar empresas' },
    { module: 'companies', action: 'manage', name: 'companies:manage', description: 'Gerenciar status e contrato das empresas' },
    // --- Onboarding ---
    { module: 'onboarding', action: 'read', name: 'onboarding:read', description: 'Visualizar onboarding dos clientes' },
    { module: 'onboarding', action: 'write', name: 'onboarding:write', description: 'Atualizar etapas e status do onboarding' },
    { module: 'onboarding', action: 'log', name: 'onboarding:log', description: 'Adicionar logs e observações nas etapas' },
    // --- CRM ---
    { module: 'crm', action: 'read', name: 'crm:read', description: 'Visualizar leads e pipeline' },
    { module: 'crm', action: 'write', name: 'crm:write', description: 'Criar e editar leads' },
    { module: 'crm', action: 'stage', name: 'crm:stage', description: 'Mover leads entre estágios do pipeline' },
    { module: 'crm', action: 'interact', name: 'crm:interact', description: 'Registrar interações e follow-ups' },
    { module: 'crm', action: 'dashboard', name: 'crm:dashboard', description: 'Acessar dashboard e métricas do CRM' },
    // --- Usuários ---
    { module: 'users', action: 'read', name: 'users:read', description: 'Visualizar usuários do time' },
    { module: 'users', action: 'write', name: 'users:write', description: 'Criar e editar usuários' },
    { module: 'users', action: 'permissions', name: 'users:permissions', description: 'Gerenciar permissões de outros usuários' },
    // --- Relatórios ---
    { module: 'reports', action: 'read', name: 'reports:read', description: 'Acessar relatórios e análises' },
    { module: 'reports', action: 'export', name: 'reports:export', description: 'Exportar relatórios' },
];
async function main() {
    console.log('\n🌱 Iniciando seed do banco de dados Haubitz...\n');
    // 1. Cria as permissões
    console.log('📋 Criando permissões do sistema...');
    const createdPermissions = [];
    for (const perm of DEFAULT_PERMISSIONS) {
        const permission = await prisma.permission.upsert({
            where: { name: perm.name },
            update: { description: perm.description },
            create: {
                id: (0, uuid_1.v4)(),
                name: perm.name,
                description: perm.description,
                module: perm.module,
                action: perm.action,
            },
        });
        createdPermissions.push(permission);
    }
    console.log(`   ✅ ${createdPermissions.length} permissões criadas/atualizadas`);
    // 2. Cria o SuperAdmin (Kayke)
    const adminEmail = process.env.ADMIN_EMAIL || 'kayke@haubitz.com.br';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Haubitz@2024!';
    const adminName = process.env.ADMIN_NAME || 'Kayke';
    const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
    console.log(`\n👑 Criando SuperAdmin (${adminEmail})...`);
    const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (existingAdmin) {
        console.log('   ℹ️  SuperAdmin já existe — nenhuma alteração feita.');
    }
    else {
        const passwordHash = await bcryptjs_1.default.hash(adminPassword, BCRYPT_ROUNDS);
        const admin = await prisma.user.create({
            data: {
                id: (0, uuid_1.v4)(),
                name: adminName,
                email: adminEmail,
                passwordHash,
                role: 'SUPERADMIN',
                companyId: null, // SuperAdmin não pertence a uma empresa específica
                isActive: true,
            },
        });
        console.log(`   ✅ SuperAdmin criado: ${admin.name} (${admin.email})`);
        console.log(`   🔑 Senha inicial: ${adminPassword}`);
        console.log(`   ⚠️  IMPORTANTE: Altere a senha após o primeiro login!`);
    }
    // 3. Summary
    console.log('\n╔══════════════════════════════════════════╗');
    console.log('║     SEED CONCLUÍDO COM SUCESSO!          ║');
    console.log('╠══════════════════════════════════════════╣');
    console.log(`║  SuperAdmin: ${adminEmail.padEnd(29)}║`);
    console.log(`║  Senha:      ${adminPassword.padEnd(29)}║`);
    console.log(`║  Permissões: ${String(createdPermissions.length).padEnd(29)}║`);
    console.log('╠══════════════════════════════════════════╣');
    console.log('║  Próximos passos:                        ║');
    console.log('║  1. npm run dev (iniciar servidor)       ║');
    console.log('║  2. POST /api/auth/login (fazer login)   ║');
    console.log('║  3. Cadastrar seus clientes              ║');
    console.log('╚══════════════════════════════════════════╝\n');
}
main()
    .catch((e) => {
    console.error('\n❌ ERRO NO SEED:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map