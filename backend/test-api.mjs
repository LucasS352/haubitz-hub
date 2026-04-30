/**
 * HAUBITZ API - SCRIPT DE TESTE COMPLETO
 * Execute em um NOVO terminal (com o servidor ainda rodando):
 * node test-api.mjs
 */

const BASE = 'http://localhost:3000';
let TOKEN = '';
let COMPANY_ID = '';
let ONBOARDING_ID = '';
let LEAD_ID = '';
let PASS = 0;
let FAIL = 0;

const green = (s) => `\x1b[32m${s}\x1b[0m`;
const red   = (s) => `\x1b[31m${s}\x1b[0m`;
const cyan  = (s) => `\x1b[36m${s}\x1b[0m`;
const bold  = (s) => `\x1b[1m${s}\x1b[0m`;

function assert(label, condition, detail = '') {
  if (condition) {
    console.log(green(`  ✅ PASS`) + ` ${label}` + (detail ? ` → ${detail}` : ''));
    PASS++;
  } else {
    console.log(red(`  ❌ FAIL`) + ` ${label}` + (detail ? ` → ${detail}` : ''));
    FAIL++;
  }
}

async function req(method, path, body, auth = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth && TOKEN) headers['Authorization'] = `Bearer ${TOKEN}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  return { status: res.status, data: json };
}

async function run() {
  console.log('\n' + bold('══════════════════════════════════════════'));
  console.log(bold('   HAUBITZ - VALIDAÇÃO COMPLETA DA API'));
  console.log(bold('══════════════════════════════════════════\n'));

  // ─── 1. HEALTH CHECK ───────────────────────────────────────
  console.log(cyan('\n[1] HEALTH CHECK'));
  const h = await req('GET', '/health', null, false);
  assert('Sistema online', h.data.success === true);
  assert('Versão retornada', !!h.data.version, h.data.version);

  // ─── 2. AUTENTICAÇÃO ───────────────────────────────────────
  console.log(cyan('\n[2] AUTENTICAÇÃO'));

  // Login com credenciais erradas (deve bloquear)
  const badLogin = await req('POST', '/api/auth/login', { email: 'hacker@x.com', password: '123456' }, false);
  assert('Bloqueia credenciais inválidas', badLogin.status === 401, `HTTP ${badLogin.status}`);

  // Login correto
  const login = await req('POST', '/api/auth/login', { email: 'kayke@haubitz.com.br', password: 'Haubitz@2024!' }, false);
  assert('Login com sucesso', login.status === 200, `HTTP ${login.status}`);
  assert('AccessToken gerado', !!login.data.data?.accessToken);
  assert('Role é SUPERADMIN', login.data.data?.user?.role === 'SUPERADMIN', login.data.data?.user?.role);
  TOKEN = login.data.data?.accessToken;
  const REFRESH_TOKEN = login.data.data?.refreshToken;

  // Rota protegida sem token (deve bloquear)
  const noAuth = await req('GET', '/api/companies', null, false);
  assert('Bloqueia requisição sem token', noAuth.status === 401, `HTTP ${noAuth.status}`);

  // /me retorna dados do usuário
  const me = await req('GET', '/api/auth/me');
  assert('GET /auth/me retorna dados', me.status === 200 && me.data.data?.email === 'kayke@haubitz.com.br');

  // Refresh token
  const refresh = await req('POST', '/api/auth/refresh', { refreshToken: REFRESH_TOKEN }, false);
  assert('Refresh token gera novo accessToken', refresh.status === 200 && !!refresh.data.data?.accessToken, `HTTP ${refresh.status}`);

  // ─── 3. EMPRESAS (TENANTS) ─────────────────────────────────
  console.log(cyan('\n[3] EMPRESAS (TENANTS)'));

  // Cria empresa de teste
  const comp = await req('POST', '/api/companies', {
    name: `Empresa Teste ${Date.now()}`,
    email: 'teste@empresa.com',
    segment: 'E-commerce',
    plan: 'Premium',
    cnpj: `${Math.floor(Math.random()*90000000000000)+10000000000000}`, // CNPJ único
  });
  assert('Criar empresa', comp.status === 201, `HTTP ${comp.status}`);
  assert('Onboarding criado automaticamente', comp.data.data?.onboarding !== null);
  COMPANY_ID = comp.data.data?.id;

  // Lista empresas
  const companies = await req('GET', '/api/companies');
  assert('Listar empresas', companies.status === 200, `HTTP ${companies.status}`);
  assert('Meta de paginação presente', !!companies.data.meta?.total, `total=${companies.data.meta?.total}`);

  // Busca empresa por ID
  const getComp = await req('GET', `/api/companies/${COMPANY_ID}`);
  assert('Buscar empresa por ID', getComp.status === 200 && getComp.data.data?.id === COMPANY_ID);

  // CNPJ duplicado deve falhar
  const dupCnpj = comp.data.data?.cnpj;
  const dupComp = await req('POST', '/api/companies', { name: 'Outra Empresa', cnpj: dupCnpj });
  assert('Bloqueia CNPJ duplicado', dupComp.status === 409, `HTTP ${dupComp.status}`);

  // ─── 4. ONBOARDING ────────────────────────────────────────
  console.log(cyan('\n[4] ONBOARDING - 7 ETAPAS'));

  // Busca onboarding da empresa
  const ob = await req('GET', `/api/onboarding/company/${COMPANY_ID}`);
  assert('Onboarding encontrado', ob.status === 200, `HTTP ${ob.status}`);
  assert('Possui 7 etapas', ob.data.data?.steps?.length === 7, `etapas: ${ob.data.data?.steps?.length}`);
  assert('Etapa 1 é PENDING', ob.data.data?.steps[0]?.status === 'PENDING');
  assert('Status inicial é NOT_STARTED', ob.data.data?.status === 'NOT_STARTED');
  ONBOARDING_ID = ob.data.data?.id;

  // Atualiza etapa 1 para IN_PROGRESS
  const step1 = await req('PUT', `/api/onboarding/${ONBOARDING_ID}/steps/1`, {
    status: 'IN_PROGRESS',
    notes: 'Kickoff agendado para amanhã às 14h',
  });
  assert('Etapa 1 → IN_PROGRESS', step1.status === 200, `HTTP ${step1.status}`);

  // Verifica que onboarding mudou para IN_PROGRESS automaticamente
  const obUpdated = await req('GET', `/api/onboarding/${ONBOARDING_ID}`);
  assert('Onboarding muda para IN_PROGRESS automaticamente', obUpdated.data.data?.status === 'IN_PROGRESS', obUpdated.data.data?.status);

  // Completa etapa 1 com checklist
  const step1Done = await req('PUT', `/api/onboarding/${ONBOARDING_ID}/steps/1`, {
    status: 'COMPLETED',
    checklist: [
      { item: 'Reunião de kickoff agendada e realizada', done: true },
      { item: 'Briefing completo preenchido', done: true },
      { item: 'Objetivos de negócio definidos', done: true },
    ],
  });
  assert('Etapa 1 → COMPLETED', step1Done.status === 200, `HTTP ${step1Done.status}`);

  // Adiciona log manual
  const log = await req('POST', `/api/onboarding/${ONBOARDING_ID}/steps/2/logs`, {
    action: 'Acesso ao Meta Business Manager solicitado ao cliente',
    notes: 'Aguardando resposta por e-mail',
  });
  assert('Adiciona log na etapa 2', log.status === 201, `HTTP ${log.status}`);

  // Lista todos os onboardings (visão do Kayke)
  const allOb = await req('GET', '/api/onboarding');
  assert('Lista todos os onboardings (SuperAdmin)', allOb.status === 200, `total=${allOb.data.meta?.total}`);

  // ─── 5. CRM ────────────────────────────────────────────────
  console.log(cyan('\n[5] CRM - PIPELINE COMPLETO'));

  // Cria lead
  const lead = await req('POST', '/api/crm/leads', {
    name: 'João Silva',
    email: 'joao@lead.com',
    phone: '11999991234',
    businessName: 'Empresa do João',
    source: 'Instagram',
    companyId: COMPANY_ID,
  });
  assert('Criar lead', lead.status === 201, `HTTP ${lead.status}`);
  assert('Stage inicial é LEAD_IN', lead.data.data?.pipelineStage === 'LEAD_IN', lead.data.data?.pipelineStage);
  LEAD_ID = lead.data.data?.id;

  // Move para QUALIFICATION (SDR)
  const q = await req('PUT', `/api/crm/leads/${LEAD_ID}/stage`, {
    stage: 'QUALIFICATION',
    notes: 'Lead qualificado - interesse confirmado',
  });
  assert('Lead → QUALIFICATION', q.status === 200 && q.data.data?.pipelineStage === 'QUALIFICATION');

  // Move para SCHEDULING
  const sc = await req('PUT', `/api/crm/leads/${LEAD_ID}/stage`, { stage: 'SCHEDULING' });
  assert('Lead → SCHEDULING', sc.status === 200);

  // Move para DIAGNOSIS (Closer)
  const diag = await req('PUT', `/api/crm/leads/${LEAD_ID}/stage`, { stage: 'DIAGNOSIS' });
  assert('Lead → DIAGNOSIS', diag.status === 200);

  // Move para PROPOSAL com valor
  const prop = await req('PUT', `/api/crm/leads/${LEAD_ID}/stage`, {
    stage: 'PROPOSAL',
    proposalValue: 2500.00,
    notes: 'Proposta Premium enviada: R$ 2.500/mês',
  });
  assert('Lead → PROPOSAL (com valor)', prop.status === 200 && parseFloat(prop.data.data?.proposalValue) === 2500);

  // Registra interação (ligação)
  const inter = await req('POST', `/api/crm/leads/${LEAD_ID}/interactions`, {
    type: 'CALL',
    notes: 'Apresentação da proposta realizada. Cliente pediu 2 dias para decidir.',
    duration: 45,
  });
  assert('Registra interação (CALL)', inter.status === 201, `HTTP ${inter.status}`);

  // Cria follow-up
  const fu = await req('POST', `/api/crm/leads/${LEAD_ID}/followups`, {
    scheduledAt: new Date(Date.now() + 2 * 86400000).toISOString(),
    notes: 'Retornar em 2 dias para decisão do cliente',
    attempt: 1,
  });
  assert('Agenda follow-up', fu.status === 201, `HTTP ${fu.status}`);

  // Marca follow-up como concluído
  const fuId = fu.data.data?.id;
  const fuDone = await req('PUT', `/api/crm/followups/${fuId}`, {
    status: 'COMPLETED',
    result: 'Cliente confirmou interesse, aguarda aprovação interna',
  });
  assert('Follow-up → COMPLETED', fuDone.status === 200, `HTTP ${fuDone.status}`);

  // Move para CLOSED_WON
  const won = await req('PUT', `/api/crm/leads/${LEAD_ID}/stage`, {
    stage: 'CLOSED_WON',
    notes: 'Contrato assinado! Cliente convertido.',
  });
  assert('Lead → CLOSED_WON', won.status === 200 && !!won.data.data?.closedAt);

  // Busca detalhes do lead com histórico completo
  const leadDetail = await req('GET', `/api/crm/leads/${LEAD_ID}`);
  assert('Lead tem histórico de interações', leadDetail.data.data?.interactions?.length > 0, `${leadDetail.data.data?.interactions?.length} interações`);
  assert('Lead tem follow-ups', leadDetail.data.data?.followUps?.length > 0);

  // Cria lead perdido para testar
  const lostLead = await req('POST', '/api/crm/leads', {
    name: 'Maria Costa',
    phone: '11988887777',
    companyId: COMPANY_ID,
    source: 'Google Ads',
  });
  const lostId = lostLead.data.data?.id;
  const lost = await req('PUT', `/api/crm/leads/${lostId}/stage`, {
    stage: 'CLOSED_LOST',
    lostReason: 'Cliente escolheu concorrente por preço',
  });
  assert('Lead → CLOSED_LOST', lost.status === 200 && !!lost.data.data?.closedAt);

  // ─── 6. DASHBOARD ─────────────────────────────────────────
  console.log(cyan('\n[6] DASHBOARD & MÉTRICAS'));

  const dash = await req('GET', '/api/crm/dashboard');
  assert('Dashboard retorna overview', dash.status === 200, `HTTP ${dash.status}`);
  assert('Total de leads correto', dash.data.data?.overview?.totalLeads >= 2, `total=${dash.data.data?.overview?.totalLeads}`);
  assert('Leads ganhos registrados', dash.data.data?.overview?.wonLeads >= 1, `won=${dash.data.data?.overview?.wonLeads}`);
  assert('Taxa de conversão calculada', !!dash.data.data?.overview?.conversionRate, dash.data.data?.overview?.conversionRate);
  assert('Pipeline por estágio retornado', Array.isArray(dash.data.data?.pipeline));

  // ─── 7. USUÁRIOS E PERMISSÕES ─────────────────────────────
  console.log(cyan('\n[7] USUÁRIOS & PERMISSÕES (RBAC)'));

  // Lista permissões
  const perms = await req('GET', '/api/users/permissions');
  assert('Lista 16 permissões padrão', perms.data.data?.length === 16, `${perms.data.data?.length} permissões`);

  // Cria usuário SDR
  const sdr = await req('POST', '/api/users', {
    name: 'Carlos SDR',
    email: `sdr.${Date.now()}@haubitz.com`,
    password: 'Haubitz@2024!',
    role: 'SDR',
    companyId: COMPANY_ID,
  });
  assert('Criar usuário SDR', sdr.status === 201, `HTTP ${sdr.status}`);
  const SDR_ID = sdr.data.data?.id;

  // Cria usuário Closer
  const closer = await req('POST', '/api/users', {
    name: 'Ana Closer',
    email: `closer.${Date.now()}@haubitz.com`,
    password: 'Haubitz@2024!',
    role: 'CLOSER',
    companyId: COMPANY_ID,
  });
  assert('Criar usuário Closer', closer.status === 201, `HTTP ${closer.status}`);

  // Tenta criar usuário com e-mail duplicado
  const dupUser = await req('POST', '/api/users', {
    name: 'Duplicado',
    email: sdr.data.data?.email,
    password: 'Haubitz@2024!',
    role: 'SDR',
  });
  assert('Bloqueia e-mail duplicado', dupUser.status === 409, `HTTP ${dupUser.status}`);

  // Atribui permissões ao SDR
  const crmReadPerm = perms.data.data?.find(p => p.name === 'crm:read');
  const crmWritePerm = perms.data.data?.find(p => p.name === 'crm:write');
  const updatePerms = await req('PUT', `/api/users/${SDR_ID}/permissions`, {
    permissions: [crmReadPerm?.id, crmWritePerm?.id].filter(Boolean),
  });
  assert('Atribuir permissões ao SDR', updatePerms.status === 200, `HTTP ${updatePerms.status}`);

  // Lista usuários
  const users = await req('GET', '/api/users');
  assert('Listar usuários', users.status === 200, `total=${users.data.meta?.total}`);
  assert('SuperAdmin não aparece na lista', !users.data.data?.some(u => u.role === 'SUPERADMIN'));

  // Desativa usuário (soft delete)
  const del = await req('DELETE', `/api/users/${SDR_ID}`);
  assert('Desativar usuário (soft delete)', del.status === 200, `HTTP ${del.status}`);

  // ─── 8. LOGOUT ────────────────────────────────────────────
  console.log(cyan('\n[8] LOGOUT'));
  const logout = await req('POST', '/api/auth/logout', { refreshToken: REFRESH_TOKEN }, false);
  assert('Logout invalida refresh token', logout.status === 200, `HTTP ${logout.status}`);

  // Tenta usar o refresh token inválido após logout
  const badRefresh = await req('POST', '/api/auth/refresh', { refreshToken: REFRESH_TOKEN }, false);
  assert('Refresh token revogado após logout', badRefresh.status === 401, `HTTP ${badRefresh.status}`);

  // ─── RESULTADO FINAL ──────────────────────────────────────
  const total = PASS + FAIL;
  console.log('\n' + bold('══════════════════════════════════════════'));
  console.log(bold('   RESULTADO FINAL DA VALIDAÇÃO'));
  console.log(bold('══════════════════════════════════════════'));
  console.log(green(`  ✅ PASSOU: ${PASS}/${total}`));
  if (FAIL > 0) console.log(red(`  ❌ FALHOU: ${FAIL}/${total}`));
  console.log(`  📊 Cobertura: ${((PASS/total)*100).toFixed(0)}%`);
  console.log(bold('══════════════════════════════════════════\n'));

  if (FAIL === 0) {
    console.log(green(bold('  🎉 SISTEMA VALIDADO COM SUCESSO! Pronto para o Lovable.\n')));
  } else {
    console.log(red(`  ⚠️  ${FAIL} teste(s) falharam. Verificar antes de prosseguir.\n`));
  }
}

run().catch(e => {
  console.error(red('\n❌ ERRO CRÍTICO NO SCRIPT DE TESTES:'), e.message);
  process.exit(1);
});
