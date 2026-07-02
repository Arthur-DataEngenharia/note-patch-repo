import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../generated/prisma/client';
import bcrypt from 'bcryptjs';

const adapter = new PrismaBetterSqlite3({ url: 'file:./prisma/dev.db' });
const prisma = new PrismaClient({ adapter });

const SALT_ROUNDS = 10;

const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);
const hoursAgo = (n: number) => new Date(Date.now() - n * 60 * 60 * 1000);

async function main() {
  console.log('Cleaning database...');
  await Promise.all([
    prisma.notification.deleteMany(),
    prisma.auditLog.deleteMany(),
    prisma.document.deleteMany(),
    prisma.hotfix.deleteMany(),
    prisma.notePatch.deleteMany(),
    prisma.classification.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  console.log('Seeding database...');

  // --- Users ---
  const defaultPassword = await bcrypt.hash('admin123', SALT_ROUNDS);
  await prisma.user.createMany({
    data: [
      { id: 'u1', name: 'Arthur Rodrigues', email: 'arthur@empresa.com', role: 'admin', passwordHash: defaultPassword },
      { id: 'u2', name: 'Maria Silva', email: 'maria@empresa.com', role: 'editor', passwordHash: await bcrypt.hash('editor123', SALT_ROUNDS) },
      { id: 'u3', name: 'João Santos', email: 'joao@empresa.com', role: 'reviewer', passwordHash: await bcrypt.hash('reviewer123', SALT_ROUNDS) },
      { id: 'u4', name: 'Ana Costa', email: 'ana@empresa.com', role: 'editor', passwordHash: await bcrypt.hash('editor123', SALT_ROUNDS) },
    ],
  });

  // --- Classifications ---
  const classifications = [
    { id: 'comercial', name: 'Comercial', description: 'Pedidos, contratos', color: '#3B82F6', sortOrder: 1 },
    { id: 'producao', name: 'Produção', description: 'Manufatura, OPs', color: '#22C55E', sortOrder: 2 },
    { id: 'portais', name: 'Portais', description: 'Portal parceiro/cliente', color: '#A855F7', sortOrder: 3 },
    { id: 'financeiro', name: 'Financeiro', description: 'Contas pagar/receber', color: '#F59E0B', sortOrder: 4 },
    { id: 'contabil', name: 'Contábil', description: 'Contabilidade, livros', color: '#06B6D4', sortOrder: 5 },
    { id: 'fiscal', name: 'Fiscal', description: 'NFs, SPED, eSocial', color: '#EC4899', sortOrder: 6 },
    { id: 'suprimentos', name: 'Suprimentos', description: 'Compras, estoque', color: '#14B8A6', sortOrder: 7 },
    { id: 'rh', name: 'RH', description: 'Folha, ponto', color: '#F97316', sortOrder: 8 },
    { id: 'logistica', name: 'Logística', description: 'Transporte, expedição', color: '#8B5CF6', sortOrder: 9 },
    { id: 'crm', name: 'CRM', description: 'Atendimento, pipeline', color: '#10B981', sortOrder: 10 },
    { id: 'integracoes', name: 'Integrações', description: 'APIs, webhooks', color: '#6366F1', sortOrder: 11 },
    { id: 'infraestrutura', name: 'Infraestrutura', description: 'DevOps, banco', color: '#E11D48', sortOrder: 12 },
    { id: 'seguranca', name: 'Segurança', description: 'Auth, auditoria', color: '#DC2626', sortOrder: 13 },
    { id: 'frontend', name: 'Frontend', description: 'UI/UX', color: '#F43F5E', sortOrder: 14 },
    { id: 'backend', name: 'Backend', description: 'Serviços, regras', color: '#7C3AED', sortOrder: 15 },
  ];
  await prisma.classification.createMany({
    data: classifications.map((c) => ({ ...c, isActive: true })),
  });

  // --- NotePatches ---
  const patches = [
    {
      id: 'p1', version: '4.28.115',
      title: 'Correção no cálculo de impostos ICMS-ST para operações interestaduais',
      summary: 'Ajuste na rotina de cálculo do ICMS-ST considerando o MVA ajustado para operações entre estados com protocolo. Impacta emissão de NF-e de saída.',
      technicalNotes: `## Contexto\n\nO cálculo do **ICMS-ST** não considerava o MVA ajustado em operações interestaduais com protocolo firmado entre os estados.\n\n## Solução\n\n- Ajustada a classe \`CalculoImpostoST\` para buscar o MVA ajustado da tabela \`TGFMVA\`\n- Adicionada validação de protocolo entre UFs\n- Criado teste unitário cobrindo os cenários SP→MG, SP→RJ e RS→SC\n\n\`\`\`java\nBigDecimal mvaAjustado = mvaService.getMvaAjustado(ufOrigem, ufDestino, ncm);\n\`\`\`\n\n## Observações\n\n> Necessário reprocessar notas emitidas entre 25/06 e 28/06.`,
      status: 'published', classificationId: 'fiscal', authorId: 'u2', reviewerId: 'u3',
      tags: JSON.stringify(['icms-st', 'nfe', 'urgente']),
      githubRepo: 'empresa/sankhya-fiscal', githubBranch: 'main', githubCommitSha: 'a3f8c21',
      githubPrUrl: 'https://github.com/empresa/sankhya-fiscal/pull/482',
      githubFiles: JSON.stringify([
        { path: 'src/main/java/br/com/fiscal/CalculoImpostoST.java', status: 'modified', additions: 84, deletions: 22, diffUrl: '#' },
        { path: 'src/main/java/br/com/fiscal/MvaService.java', status: 'added', additions: 156, deletions: 0, diffUrl: '#' },
        { path: 'src/test/java/br/com/fiscal/CalculoImpostoSTTest.java', status: 'modified', additions: 98, deletions: 4, diffUrl: '#' },
      ]),
      affectedClasses: JSON.stringify([
        { className: 'CalculoImpostoST', filePath: 'src/main/java/br/com/fiscal/CalculoImpostoST.java', repoUrl: 'https://github.com/empresa/sankhya-fiscal', lineRange: '120-204', description: 'Método calcularST refatorado' },
        { className: 'MvaService', filePath: 'src/main/java/br/com/fiscal/MvaService.java', repoUrl: 'https://github.com/empresa/sankhya-fiscal', description: 'Nova classe de serviço' },
      ]),
      impactedSystems: JSON.stringify(['Emissão NF-e', 'Faturamento', 'Livros Fiscais']),
      rollbackPlan: '1. Reverter commit a3f8c21\n2. Restaurar versão anterior do JAR no servidor de produção\n3. Reiniciar serviço de faturamento',
      checklist: JSON.stringify([
        { label: 'Testes unitários', checked: true, checkedBy: 'Maria Silva' },
        { label: 'Homologação', checked: true, checkedBy: 'João Santos' },
        { label: 'Code review', checked: true, checkedBy: 'João Santos' },
        { label: 'Aprovação gestor', checked: true, checkedBy: 'Arthur Rodrigues' },
      ]),
      deployedAt: daysAgo(2), publishedAt: daysAgo(2), createdAt: daysAgo(5), updatedAt: daysAgo(2),
    },
    {
      id: 'p2', version: '4.28.114',
      title: 'Nova tela de aprovação de pedidos em lote no portal do parceiro',
      summary: 'Implementada funcionalidade de aprovação em massa de pedidos pendentes no portal, com filtros por período e valor.',
      technicalNotes: `## Funcionalidade\n\nNova tela no portal do parceiro para aprovação de pedidos em lote.\n\n- Seleção múltipla com checkbox\n- Filtros: período, valor mínimo/máximo, vendedor\n- Log de aprovação com usuário e timestamp`,
      status: 'published', classificationId: 'portais', authorId: 'u4', reviewerId: 'u1',
      tags: JSON.stringify(['portal', 'pedidos', 'feature']),
      githubRepo: 'empresa/portal-parceiro', githubBranch: 'main', githubCommitSha: 'b7e2d90',
      githubPrUrl: 'https://github.com/empresa/portal-parceiro/pull/213',
      githubFiles: JSON.stringify([
        { path: 'src/pages/AprovacaoLote.tsx', status: 'added', additions: 320, deletions: 0, diffUrl: '#' },
        { path: 'src/api/pedidos.ts', status: 'modified', additions: 45, deletions: 8, diffUrl: '#' },
      ]),
      affectedClasses: JSON.stringify([
        { className: 'AprovacaoLoteService', filePath: 'src/services/AprovacaoLoteService.java', repoUrl: 'https://github.com/empresa/portal-parceiro', description: 'Serviço de aprovação em massa' },
      ]),
      impactedSystems: JSON.stringify(['Portal do Parceiro', 'Gestão de Pedidos']),
      checklist: JSON.stringify([
        { label: 'Testes unitários', checked: true, checkedBy: 'Ana Costa' },
        { label: 'Homologação', checked: true, checkedBy: 'João Santos' },
        { label: 'Code review', checked: true, checkedBy: 'Arthur Rodrigues' },
        { label: 'Aprovação gestor', checked: true, checkedBy: 'Arthur Rodrigues' },
      ]),
      deployedAt: daysAgo(6), publishedAt: daysAgo(6), createdAt: daysAgo(10), updatedAt: daysAgo(6),
    },
    {
      id: 'p3', version: '4.28.113-HF1',
      title: 'HOTFIX: Timeout na geração de boletos em massa',
      summary: 'Correção emergencial de timeout na rotina de geração de boletos quando o lote excede 500 títulos.',
      technicalNotes: `## Problema\n\nTimeout de 30s estourado na geração de boletos em lotes grandes (>500 títulos).\n\n## Correção\n\n- Processamento movido para fila assíncrona\n- Chunk de 100 títulos por transação`,
      status: 'published', classificationId: 'financeiro', authorId: 'u1',
      tags: JSON.stringify(['hotfix', 'boletos', 'performance']),
      githubRepo: 'empresa/sankhya-financeiro', githubBranch: 'hotfix/boletos-timeout', githubCommitSha: 'c9d1e45',
      githubFiles: JSON.stringify([
        { path: 'src/main/java/br/com/fin/GeradorBoletos.java', status: 'modified', additions: 67, deletions: 31, diffUrl: '#' },
      ]),
      affectedClasses: JSON.stringify([
        { className: 'GeradorBoletos', filePath: 'src/main/java/br/com/fin/GeradorBoletos.java', repoUrl: 'https://github.com/empresa/sankhya-financeiro', lineRange: '45-112' },
      ]),
      impactedSystems: JSON.stringify(['Contas a Receber', 'Integração Bancária']),
      rollbackPlan: 'Reverter para JAR anterior. Boletos gerados na fila devem ser reprocessados manualmente.',
      checklist: JSON.stringify([
        { label: 'Testes unitários', checked: true, checkedBy: 'Arthur Rodrigues' },
        { label: 'Homologação', checked: false },
        { label: 'Code review', checked: true, checkedBy: 'Maria Silva' },
        { label: 'Aprovação gestor', checked: true, checkedBy: 'Arthur Rodrigues' },
      ]),
      deployedAt: daysAgo(8), publishedAt: daysAgo(8), createdAt: daysAgo(8), updatedAt: daysAgo(8),
      isHotfix: true,
    },
    {
      id: 'p4', version: '4.28.112',
      title: 'Integração com API de rastreamento de transportadoras',
      summary: 'Nova integração via webhook com APIs de rastreamento (Correios, Jadlog, TNT) para atualização automática do status de entrega.',
      technicalNotes: `## Integração\n\nWebhooks configurados para receber atualizações de status:\n\n| Transportadora | Método | Frequência |\n|---|---|---|\n| Correios | Polling | 30min |\n| Jadlog | Webhook | Real-time |\n| TNT | Webhook | Real-time |`,
      status: 'published', classificationId: 'logistica', authorId: 'u2', reviewerId: 'u3',
      tags: JSON.stringify(['integração', 'rastreamento', 'webhook']),
      githubRepo: 'empresa/sankhya-logistica', githubBranch: 'main', githubCommitSha: 'd4f7a12',
      githubPrUrl: 'https://github.com/empresa/sankhya-logistica/pull/98',
      githubFiles: JSON.stringify([
        { path: 'src/main/java/br/com/log/RastreamentoWebhook.java', status: 'added', additions: 210, deletions: 0, diffUrl: '#' },
        { path: 'src/main/java/br/com/log/StatusEntregaService.java', status: 'modified', additions: 55, deletions: 12, diffUrl: '#' },
      ]),
      affectedClasses: JSON.stringify([
        { className: 'RastreamentoWebhook', filePath: 'src/main/java/br/com/log/RastreamentoWebhook.java', repoUrl: 'https://github.com/empresa/sankhya-logistica' },
      ]),
      impactedSystems: JSON.stringify(['Expedição', 'Portal do Cliente']),
      checklist: JSON.stringify([
        { label: 'Testes unitários', checked: true, checkedBy: 'Maria Silva' },
        { label: 'Homologação', checked: true, checkedBy: 'João Santos' },
        { label: 'Code review', checked: true, checkedBy: 'João Santos' },
        { label: 'Aprovação gestor', checked: true, checkedBy: 'Arthur Rodrigues' },
      ]),
      deployedAt: daysAgo(12), publishedAt: daysAgo(12), createdAt: daysAgo(18), updatedAt: daysAgo(12),
    },
    {
      id: 'p5', version: '4.28.116',
      title: 'Refatoração do módulo de comissões de vendedores',
      summary: 'Reestruturação das regras de cálculo de comissão com suporte a metas escalonadas e comissão por margem.',
      technicalNotes: `## Em desenvolvimento\n\n- Comissão por faixa de meta\n- Comissão sobre margem de contribuição\n- Relatório gerencial novo`,
      status: 'in_review', classificationId: 'comercial', authorId: 'u4', reviewerId: 'u3',
      tags: JSON.stringify(['comissões', 'refactor']),
      githubRepo: 'empresa/sankhya-comercial', githubBranch: 'feature/comissoes-v2', githubCommitSha: 'e8a3b56',
      githubPrUrl: 'https://github.com/empresa/sankhya-comercial/pull/321',
      githubFiles: JSON.stringify([
        { path: 'src/main/java/br/com/com/CalculoComissao.java', status: 'modified', additions: 240, deletions: 180, diffUrl: '#' },
      ]),
      affectedClasses: JSON.stringify([
        { className: 'CalculoComissao', filePath: 'src/main/java/br/com/com/CalculoComissao.java', repoUrl: 'https://github.com/empresa/sankhya-comercial' },
      ]),
      impactedSystems: JSON.stringify(['Comercial', 'Folha de Pagamento']),
      checklist: JSON.stringify([
        { label: 'Testes unitários', checked: true, checkedBy: 'Ana Costa' },
        { label: 'Homologação', checked: false },
        { label: 'Code review', checked: false },
        { label: 'Aprovação gestor', checked: false },
      ]),
      deployedAt: new Date(), createdAt: daysAgo(3), updatedAt: hoursAgo(5),
    },
    {
      id: 'p6', version: '4.28.111',
      title: 'Ajuste no fechamento contábil mensal — conciliação automática',
      summary: 'Melhoria na rotina de conciliação automática entre razão e sub-ledgers no fechamento mensal.',
      technicalNotes: `## Melhoria\n\nConciliação automática razão × sub-ledger com relatório de divergências.`,
      status: 'published', classificationId: 'contabil', authorId: 'u2', reviewerId: 'u1',
      tags: JSON.stringify(['fechamento', 'conciliação']),
      githubRepo: 'empresa/sankhya-contabil', githubBranch: 'main', githubCommitSha: 'f2c8d33',
      githubFiles: JSON.stringify([
        { path: 'src/main/java/br/com/ctb/ConciliacaoService.java', status: 'modified', additions: 120, deletions: 45, diffUrl: '#' },
      ]),
      affectedClasses: JSON.stringify([
        { className: 'ConciliacaoService', filePath: 'src/main/java/br/com/ctb/ConciliacaoService.java', repoUrl: 'https://github.com/empresa/sankhya-contabil' },
      ]),
      impactedSystems: JSON.stringify(['Contabilidade']),
      checklist: JSON.stringify([
        { label: 'Testes unitários', checked: true, checkedBy: 'Maria Silva' },
        { label: 'Homologação', checked: true, checkedBy: 'João Santos' },
        { label: 'Code review', checked: true, checkedBy: 'Arthur Rodrigues' },
        { label: 'Aprovação gestor', checked: true, checkedBy: 'Arthur Rodrigues' },
      ]),
      deployedAt: daysAgo(20), publishedAt: daysAgo(20), createdAt: daysAgo(25), updatedAt: daysAgo(20),
    },
    {
      id: 'p7', version: '4.28.117',
      title: 'Dashboard de indicadores de produção em tempo real',
      summary: 'Novo painel com OEE, paradas de máquina e apontamentos em tempo real via WebSocket.',
      technicalNotes: `## Rascunho\n\nPainel em desenvolvimento com métricas de chão de fábrica.`,
      status: 'draft', classificationId: 'producao', authorId: 'u1',
      tags: JSON.stringify(['dashboard', 'oee', 'websocket']),
      githubRepo: 'empresa/sankhya-producao', githubBranch: 'feature/dashboard-oee',
      githubFiles: JSON.stringify([]),
      affectedClasses: JSON.stringify([]),
      impactedSystems: JSON.stringify(['Produção']),
      checklist: JSON.stringify([
        { label: 'Testes unitários', checked: false },
        { label: 'Homologação', checked: false },
        { label: 'Code review', checked: false },
        { label: 'Aprovação gestor', checked: false },
      ]),
      deployedAt: new Date(), createdAt: hoursAgo(20), updatedAt: hoursAgo(2),
    },
  ];

  for (const p of patches) {
    await prisma.notePatch.create({ data: p });
  }

  // --- Hotfixes ---
  await prisma.hotfix.createMany({
    data: [
      {
        id: 'h1', patchId: 'p3', title: 'Timeout na geração de boletos em massa',
        severity: 'critical', affectedSystem: 'Contas a Receber',
        description: 'Clientes não conseguem gerar remessas bancárias. Timeout de 30s estourado em lotes > 500 títulos.',
        commitSha: 'c9d1e45', status: 'closed', reportedById: 'u3', resolvedBy: 'u1',
        reportedAt: daysAgo(8),
        deployedAt: new Date(daysAgo(8).getTime() + 3 * 60 * 60 * 1000),
        resolvedAt: new Date(daysAgo(8).getTime() + 4 * 60 * 60 * 1000),
        resolutionTimeMinutes: 240, postMortemNeeded: true, postMortemDone: true,
      },
      {
        id: 'h2', title: 'Erro 500 na emissão de NFS-e para prefeitura de São Paulo',
        severity: 'critical', affectedSystem: 'Emissão NFS-e',
        description: 'Mudança no layout do webservice da prefeitura quebrou a integração. Todas as NFS-e de SP falhando.',
        commitSha: 'a1b2c3d', status: 'fixing', reportedById: 'u2',
        reportedAt: hoursAgo(3), postMortemNeeded: true, postMortemDone: false,
      },
      {
        id: 'h3', title: 'Lentidão no portal do cliente após deploy 4.28.114',
        severity: 'high', affectedSystem: 'Portal do Cliente',
        description: 'Query N+1 introduzida na listagem de pedidos. Tempo de resposta subiu de 200ms para 8s.',
        status: 'validated', reportedById: 'u4', resolvedBy: 'u4',
        reportedAt: daysAgo(5),
        deployedAt: new Date(daysAgo(5).getTime() + 90 * 60 * 1000),
        resolvedAt: new Date(daysAgo(5).getTime() + 2 * 60 * 60 * 1000),
        resolutionTimeMinutes: 120, postMortemNeeded: false, postMortemDone: false,
      },
      {
        id: 'h4', title: 'Divergência no saldo de estoque após inventário',
        severity: 'medium', affectedSystem: 'Estoque',
        description: 'Rotina de inventário não considera reservas em trânsito, gerando saldo negativo em alguns SKUs.',
        status: 'analyzing', reportedById: 'u3',
        reportedAt: hoursAgo(28), postMortemNeeded: false, postMortemDone: false,
      },
    ],
  });

  // --- Documents ---
  const docs = [
    {
      id: 'd1', title: 'Runbook — Deploy módulo fiscal', type: 'pdf', fileUrl: '#', fileSize: 2400000,
      classificationId: 'fiscal', patchId: 'p1', tags: JSON.stringify(['runbook', 'deploy']), visibility: 'internal',
      versions: JSON.stringify([
        { version: 2, fileUrl: '#', uploadedBy: 'u2', uploadedAt: daysAgo(2), changeNote: 'Adicionado passo de reprocessamento' },
        { version: 1, fileUrl: '#', uploadedBy: 'u2', uploadedAt: daysAgo(10) },
      ]),
      uploadedById: 'u2', createdAt: daysAgo(10), updatedAt: daysAgo(2),
    },
    {
      id: 'd2', title: 'RFC — Nova arquitetura de comissões', type: 'md', fileUrl: '#', fileSize: 45000,
      classificationId: 'comercial', patchId: 'p5', tags: JSON.stringify(['rfc', 'arquitetura']), visibility: 'public',
      versions: JSON.stringify([{ version: 1, fileUrl: '#', uploadedBy: 'u4', uploadedAt: daysAgo(4) }]),
      uploadedById: 'u4', createdAt: daysAgo(4), updatedAt: daysAgo(4),
    },
    {
      id: 'd3', title: 'Diagrama de integração — Transportadoras', type: 'image', fileUrl: '#', fileSize: 890000,
      classificationId: 'logistica', patchId: 'p4', tags: JSON.stringify(['diagrama', 'integração']), visibility: 'internal',
      versions: JSON.stringify([{ version: 1, fileUrl: '#', uploadedBy: 'u2', uploadedAt: daysAgo(14) }]),
      uploadedById: 'u2', createdAt: daysAgo(14), updatedAt: daysAgo(14),
    },
    {
      id: 'd4', title: 'Post-mortem — Timeout boletos', type: 'docx', fileUrl: '#', fileSize: 156000,
      classificationId: 'financeiro', patchId: 'p3', tags: JSON.stringify(['post-mortem', 'hotfix']), visibility: 'restricted',
      versions: JSON.stringify([{ version: 1, fileUrl: '#', uploadedBy: 'u1', uploadedAt: daysAgo(6) }]),
      uploadedById: 'u1', createdAt: daysAgo(6), updatedAt: daysAgo(6),
    },
    {
      id: 'd5', title: 'Planilha de homologação — 4.28.115', type: 'xlsx', fileUrl: '#', fileSize: 320000,
      classificationId: 'fiscal', patchId: 'p1', tags: JSON.stringify(['homologação', 'testes']), visibility: 'internal',
      versions: JSON.stringify([{ version: 1, fileUrl: '#', uploadedBy: 'u3', uploadedAt: daysAgo(3) }]),
      uploadedById: 'u3', createdAt: daysAgo(3), updatedAt: daysAgo(3),
    },
  ];
  for (const d of docs) {
    await prisma.document.create({ data: d });
  }

  // --- Audit Logs ---
  await prisma.auditLog.createMany({
    data: [
      { id: 'a1', userId: 'u2', userName: 'Maria Silva', action: 'publish', entity: 'patch', entityId: 'p1', details: JSON.stringify({ version: '4.28.115' }), timestamp: daysAgo(2) },
      { id: 'a2', userId: 'u1', userName: 'Arthur Rodrigues', action: 'create', entity: 'hotfix', entityId: 'h2', details: JSON.stringify({ severity: 'critical' }), timestamp: hoursAgo(3) },
      { id: 'a3', userId: 'u4', userName: 'Ana Costa', action: 'update', entity: 'patch', entityId: 'p5', details: JSON.stringify({ status: 'in_review' }), timestamp: hoursAgo(5) },
      { id: 'a4', userId: 'u3', userName: 'João Santos', action: 'export', entity: 'document', entityId: 'd1', details: JSON.stringify({ format: 'pdf' }), timestamp: hoursAgo(8) },
      { id: 'a5', userId: 'u1', userName: 'Arthur Rodrigues', action: 'create', entity: 'patch', entityId: 'p7', details: JSON.stringify({ version: '4.28.117' }), timestamp: hoursAgo(20) },
      { id: 'a6', userId: 'u2', userName: 'Maria Silva', action: 'update', entity: 'document', entityId: 'd1', details: JSON.stringify({ version: 2 }), timestamp: daysAgo(2) },
      { id: 'a7', userId: 'u4', userName: 'Ana Costa', action: 'archive', entity: 'patch', entityId: 'p-old', details: JSON.stringify({}), timestamp: daysAgo(4) },
    ],
  });

  // --- Notifications ---
  await prisma.notification.createMany({
    data: [
      { id: 'n1', type: 'new_hotfix', title: 'Hotfix crítico registrado', message: 'Erro 500 na emissão de NFS-e para prefeitura de SP', read: false, createdAt: hoursAgo(3), link: '/history/hotfix' },
      { id: 'n2', type: 'review_requested', title: 'Revisão solicitada', message: 'Ana Costa solicitou sua revisão no patch 4.28.116', read: false, createdAt: hoursAgo(5), link: '/patches/p5' },
      { id: 'n3', type: 'new_patch', title: 'Novo patch publicado', message: 'Patch 4.28.115 (Fiscal) publicado por Maria Silva', read: true, createdAt: daysAgo(2), link: '/patches/p1' },
    ],
  });

  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
