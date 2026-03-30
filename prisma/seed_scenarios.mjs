/**
 * seed_scenarios.mjs
 *
 * Cria cenários de teste para:
 *  1. Erros de login  (usuário não encontrado, bloqueado, senha errada)
 *  2. Skills Modal    (primeiro acesso do dev)
 *  3. Sugestão IA     (skills + carga + prazo + férias)
 *
 * Rodar: node prisma/seed_scenarios.mjs
 * Remover: node prisma/seed_scenarios.mjs --clean
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const SENHA_PADRAO = 'Teste@123';
const CLEAN = process.argv.includes('--clean');

// ─── IDs fixos para facilitar limpeza ─────────────────────────────────────
const IDS = {
  // Usuários
  devBloqueado:   'test_u_bloqueado',
  devNovo:        'test_u_novo',       // firstAccessDone: false
  devFrontend:    'test_u_frontend',   // livre, especialista frontend
  devBackend:     'test_u_backend',    // 2 tasks ativas, 16h restantes
  devFullstack:   'test_u_fullstack',  // sprint com prazo em 2 dias
  devFerias:      'test_u_ferias',     // ausente (férias) hoje

  // Sprints
  sprintOk:       'test_sprint_ok',
  sprintCritico:  'test_sprint_critico',

  // Tasks para devBackend
  taskB1: 'test_task_backend_1',
  taskB2: 'test_task_backend_2',

  // Tasks para devFullstack  
  taskF1: 'test_task_fullstack_1',
};

// ─── CLEAN ────────────────────────────────────────────────────────────────
async function clean() {
  console.log('🧹  Removendo cenários de teste...');

  // Remover na ordem correta (FK)
  await prisma.timeEntry.deleteMany({
    where: { userId: { in: Object.values(IDS).filter(id => id.startsWith('test_u_')) } },
  });
  await prisma.absence.deleteMany({
    where: { userId: { in: Object.values(IDS).filter(id => id.startsWith('test_u_')) } },
  });
  await prisma.taskAssignment.deleteMany({
    where: { taskId: { in: [IDS.taskB1, IDS.taskB2, IDS.taskF1] } },
  });
  await prisma.sprint.deleteMany({
    where: { id: { in: [IDS.sprintOk, IDS.sprintCritico] } },
  });
  await prisma.user.deleteMany({
    where: { id: { in: Object.values(IDS).filter(id => id.startsWith('test_u_')) } },
  });

  console.log('✅  Dados de teste removidos com sucesso.');
}

// ─── SEED ─────────────────────────────────────────────────────────────────
async function seed() {
  const hash = await bcrypt.hash(SENHA_PADRAO, 10);
  const now = new Date();

  // ── Sprints ───────────────────────────────────────────────────────────
  const sprintOk = await prisma.sprint.upsert({
    where: { id: IDS.sprintOk },
    update: {},
    create: {
      id: IDS.sprintOk,
      name: 'Sprint Teste #01',
      startDate: new Date(now.getFullYear(), now.getMonth(), 1),
      endDate: new Date(now.getFullYear(), now.getMonth() + 1, 15),
      status: 'ACTIVE',
    },
  });
  console.log('  Sprint ok:', sprintOk.name);

  // Sprint com prazo crítico = daqui a 2 dias
  const criticalEnd = new Date(now);
  criticalEnd.setDate(criticalEnd.getDate() + 2);
  const sprintCritico = await prisma.sprint.upsert({
    where: { id: IDS.sprintCritico },
    update: { endDate: criticalEnd },
    create: {
      id: IDS.sprintCritico,
      name: 'Sprint CRÍTICO — prazo em 2 dias',
      startDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 10),
      endDate: criticalEnd,
      status: 'ACTIVE',
    },
  });
  console.log('  Sprint crítico:', sprintCritico.name);

  // ── Usuários ──────────────────────────────────────────────────────────

  // 1. Dev BLOQUEADO
  //    Cenário: tentativa de login → erro "Usuário bloqueado"
  await prisma.user.upsert({
    where: { id: IDS.devBloqueado },
    update: { isBlocked: true },
    create: {
      id: IDS.devBloqueado,
      name: 'Dev Bloqueado',
      email: 'dev.bloqueado@cms.tech',
      passwordHash: hash,
      roles: ['DESENVOLVEDOR'],
      isBlocked: true,
      firstAccessDone: true,
      skills: ['frontend'],
    },
  });
  console.log('  ✔ dev.bloqueado@cms.tech  (isBlocked: true)');

  // 2. Dev NOVO — primeiro acesso
  //    Cenário: login → SkillsModal aparece (firstAccessDone: false)
  await prisma.user.upsert({
    where: { id: IDS.devNovo },
    update: { firstAccessDone: false, skills: [] },
    create: {
      id: IDS.devNovo,
      name: 'Dev Novo',
      email: 'dev.novo@cms.tech',
      passwordHash: hash,
      roles: ['DESENVOLVEDOR'],
      isBlocked: false,
      firstAccessDone: false,
      skills: [],
    },
  });
  console.log('  ✔ dev.novo@cms.tech       (firstAccessDone: false → SkillsModal)');

  // 3. Dev FRONTEND — livre, nenhuma task ativa
  //    Cenário: melhor candidato para tarefas de front-end
  await prisma.user.upsert({
    where: { id: IDS.devFrontend },
    update: {},
    create: {
      id: IDS.devFrontend,
      name: 'Ana Frontend',
      email: 'dev.frontend@cms.tech',
      passwordHash: hash,
      roles: ['DESENVOLVEDOR'],
      isBlocked: false,
      firstAccessDone: true,
      skills: ['frontend', 'ux_ui', 'mobile'],
    },
  });
  console.log('  ✔ dev.frontend@cms.tech   (livre, skills: frontend, ux_ui, mobile)');

  // 4. Dev BACKEND — 2 tasks ativas com estimativas
  //    Cenário: moderadamente ocupado  
  await prisma.user.upsert({
    where: { id: IDS.devBackend },
    update: {},
    create: {
      id: IDS.devBackend,
      name: 'Bruno Backend',
      email: 'dev.backend@cms.tech',
      passwordHash: hash,
      roles: ['DESENVOLVEDOR'],
      isBlocked: false,
      firstAccessDone: true,
      skills: ['backend', 'postgresql', 'mysql'],
    },
  });
  console.log('  ✔ dev.backend@cms.tech    (backend, 2 tasks ativas no sprint ok)');

  // 5. Dev FULLSTACK — sprint com prazo crítico em 2 dias
  //    Cenário: penalizado pelo prazo
  await prisma.user.upsert({
    where: { id: IDS.devFullstack },
    update: {},
    create: {
      id: IDS.devFullstack,
      name: 'Carlos Fullstack',
      email: 'dev.fullstack@cms.tech',
      passwordHash: hash,
      roles: ['DESENVOLVEDOR'],
      isBlocked: false,
      firstAccessDone: true,
      skills: ['frontend', 'backend', 'postgresql'],
    },
  });
  console.log('  ✔ dev.fullstack@cms.tech  (fullstack, sprint crítico em 2 dias)');

  // 6. Dev FÉRIAS — ausente hoje
  //    Cenário: score 0 pela IA, badge 🏖 Ausente
  await prisma.user.upsert({
    where: { id: IDS.devFerias },
    update: {},
    create: {
      id: IDS.devFerias,
      name: 'Diana Férias',
      email: 'dev.ferias@cms.tech',
      passwordHash: hash,
      roles: ['DESENVOLVEDOR'],
      isBlocked: false,
      firstAccessDone: true,
      skills: ['frontend', 'qa'],
    },
  });
  console.log('  ✔ dev.ferias@cms.tech     (frontend, qa — de férias hoje)');

  // ── Ausência (Diana) ──────────────────────────────────────────────────
  const absStart = new Date(now);
  absStart.setDate(absStart.getDate() - 2); // começou há 2 dias
  const absEnd = new Date(now);
  absEnd.setDate(absEnd.getDate() + 5);     // volta daqui 5 dias

  await prisma.absence.deleteMany({ where: { userId: IDS.devFerias } });
  await prisma.absence.create({
    data: {
      userId: IDS.devFerias,
      start: absStart,
      end: absEnd,
      type: 'Férias',
    },
  });
  console.log('  ✔ Ausência Diana: férias até', absEnd.toLocaleDateString('pt-BR'));

  // ── Tasks de Bruno Backend (sprint ok, estimativas reais) ─────────────
  await prisma.taskAssignment.upsert({
    where: { taskId: IDS.taskB1 },
    update: {},
    create: {
      taskId: IDS.taskB1,
      title: 'Refatorar API de Relatórios',
      client: 'Cliente Teste',
      status: 'IN_PROGRESS',
      column: 'doing',
      estimationHr: '8h',
      trackedTime: '3h',
      sprintId: IDS.sprintOk,
      users: { connect: { id: IDS.devBackend } },
    },
  });

  await prisma.taskAssignment.upsert({
    where: { taskId: IDS.taskB2 },
    update: {},
    create: {
      taskId: IDS.taskB2,
      title: 'Otimizar queries do dashboard',
      client: 'Cliente Teste',
      status: 'REVIEW',
      column: 'review',
      estimationHr: '6h',
      trackedTime: '2h',
      sprintId: IDS.sprintOk,
      users: { connect: { id: IDS.devBackend } },
    },
  });
  console.log('  ✔ 2 tasks ativas para Bruno Backend (8h + 6h, ~9h restantes)');

  // ── TimeEntries de Bruno (últimos 14 dias) ─────────────────────────────
  // Upsert garante que não duplique na chave @@unique([taskId, userId])
  await prisma.timeEntry.upsert({
    where: { taskId_userId: { taskId: IDS.taskB1, userId: IDS.devBackend } },
    update: { hours: 3 },
    create: { taskId: IDS.taskB1, userId: IDS.devBackend, hours: 3 },
  });
  await prisma.timeEntry.upsert({
    where: { taskId_userId: { taskId: IDS.taskB2, userId: IDS.devBackend } },
    update: { hours: 2 },
    create: { taskId: IDS.taskB2, userId: IDS.devBackend, hours: 2 },
  });
  console.log('  ✔ TimeEntries Bruno: 5h apontadas nos últimos 14 dias');

  // ── Task de Carlos Fullstack (sprint CRÍTICO) ─────────────────────────
  await prisma.taskAssignment.upsert({
    where: { taskId: IDS.taskF1 },
    update: {},
    create: {
      taskId: IDS.taskF1,
      title: 'Implementar tela de relatório anual',
      client: 'Cliente Teste',
      status: 'IN_PROGRESS',
      column: 'doing',
      estimationHr: '12h',
      trackedTime: '4h',
      sprintId: IDS.sprintCritico,
      users: { connect: { id: IDS.devFullstack } },
    },
  });
  await prisma.timeEntry.upsert({
    where: { taskId_userId: { taskId: IDS.taskF1, userId: IDS.devFullstack } },
    update: { hours: 4 },
    create: { taskId: IDS.taskF1, userId: IDS.devFullstack, hours: 4 },
  });
  console.log('  ✔ Task de Carlos Fullstack (12h est., 4h apontadas, prazo crítico em 2 dias)');

  // ── Resumo final ──────────────────────────────────────────────────────
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║              CENÁRIOS DE TESTE CRIADOS COM SUCESSO           ║
╠══════════════════════════════════════════════════════════════╣
║                                                              ║
║  TESTE 1 — Erros de login                                    ║
║  ┌─────────────────────────────────────────────────────────┐ ║
║  │ Email não existe  →  qualquer@email.com                 │ ║
║  │ Usuário bloqueado →  dev.bloqueado@cms.tech / Teste@123 │ ║
║  │ Senha errada      →  dev.novo@cms.tech / senhaerrada    │ ║
║  └─────────────────────────────────────────────────────────┘ ║
║                                                              ║
║  TESTE 2 — SkillsModal (primeiro acesso)                     ║
║  ┌─────────────────────────────────────────────────────────┐ ║
║  │ Login com: dev.novo@cms.tech / Teste@123                │ ║
║  │ Deve abrir o modal de skills automaticamente            │ ║
║  └─────────────────────────────────────────────────────────┘ ║
║                                                              ║
║  TESTE 3 — Sugestão IA (abrir picker em qualquer task)       ║
║  ┌─────────────────────────────────────────────────────────┐ ║
║  │ 🥇 Ana Frontend    → livre, skills: frontend/ux_ui/mob  │ ║
║  │ 🥈 Bruno Backend   → 2 tasks, ~9h restantes             │ ║
║  │ ⚠️  Carlos Fullstack→ sprint vence em 2 dias            │ ║
║  │ 🏖  Diana Férias   → ausente, score 0, botão desabilitado│ ║
║  │ 🆕  Dev Novo       → sem skills definidas               │ ║
║  └─────────────────────────────────────────────────────────┘ ║
║                                                              ║
║  Senha de todos: Teste@123                                   ║
║  Limpar dados: node prisma/seed_scenarios.mjs --clean        ║
╚══════════════════════════════════════════════════════════════╝
`);
}

// ─── Entry point ──────────────────────────────────────────────────────────
async function main() {
  if (CLEAN) {
    await clean();
  } else {
    console.log('🌱  Criando cenários de teste...\n');
    await seed();
  }
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
