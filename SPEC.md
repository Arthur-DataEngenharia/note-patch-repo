# 📋 Note Patch Repository — Spec-Driven

## 1. Visão Geral

Sistema web para repositório centralizado de **Note Patches** — registros versionados e explicativos do que foi deployado em produção no ecossistema **Sankhya**. Integração com GitHub, linha do tempo visual, classificações por módulo, hotfix de emergência, exportação de documentos.

## 2. Stack

- **React 18 + TypeScript + Vite**
- **React Router v6** (nested routes)
- **Zustand + React Query** (estado + cache)
- **Tailwind CSS + shadcn/ui + Radix UI**
- **Lucide React** (ícones)
- **Recharts** (gráficos)
- **react-markdown + remark-gfm** (notas técnicas)
- **react-diff-viewer** (comparação de versões)
- **Octokit** (GitHub API)
- **Framer Motion** (animações)
- **jsPDF + xlsx** (exportação)
- **Sonner** (toasts)
- **Backend:** Node.js + Express + Prisma + PostgreSQL

## 3. Design System

### Paleta (Preto / Branco / Vermelho)

```css
--color-black:      #0A0A0A;  /* fundo */
--color-surface:    #141414;  /* cards */
--color-surface-2:  #1E1E1E;  /* hover/inputs */
--color-border:     #2A2A2A;
--color-white:      #FAFAFA;  /* texto */
--color-muted:      #888888;
--color-red:        #E11D48;  /* actions, badges */
--color-red-glow:   #FF1744;  /* crítico, hotfix */
--color-red-dark:   #8B0000;  /* hover */
--color-red-soft:   rgba(225,29,72,0.12);
```

### Estilização

- Dark-first, contraste alto (WCAG AA+)
- Glassmorphism sutil: `backdrop-blur(12px) + bg-white/5`
- Glow vermelho em críticos: `box-shadow: 0 0 20px rgba(225,29,72,0.3)`
- Micro-animações Framer Motion (fade-in, stagger)
- Gradient text em títulos: `from-white to-red-500 bg-clip-text`
- Grid pattern background sutil
- Border-left accent vermelho (3px) em cards de patch
- Scrollbar preta com thumb vermelho
- Font: **Inter** (UI) + **JetBrains Mono** (código)

## 4. Páginas / Rotas

```
/dashboard              → Visão geral + métricas
/patches                → Listagem de Note Patches
  /patches/:id          → Detalhe
  /patches/new          → Cadastro (wizard multi-step)
/timeline               → Linha do tempo visual
/history                → Histórico
  /history/hotfix       → Sub-aba: Hotfix de Emergência
  /history/audit        → Sub-aba: Trilha de Auditoria
/documents              → Repositório de Documentos
  /documents/:id        → Visualizador
  /documents/export     → Exportação em massa
/classifications        → Gestão de Classificações
/github                 → Integração GitHub
/settings               → Configurações
```

## 5. Funcionalidades

### 5.1 Dashboard

- KPI cards: total patches, patches/mês, hotfixes ativos, pendentes
- Gráfico barras: patches por classificação (6 meses)
- Mini timeline: últimos 5 deploys
- Alertas: patches sem nota, hotfixes sem rollback
- Feed de atividade recente

### 5.2 Listagem de Patches

- Filtros: classificação, versão, autor, data, status, tags
- Busca full-text
- Toggle visualização: cards / lista / tabela
- Bulk actions: exportar, arquivar, deletar
- Paginação infinita
- Card exibe: versão, título, classificação (badge colorida), autor, data, status, link GitHub, tags, indicador hotfix

### 5.3 Detalhe do Patch

- Header com versão, título, status, classificação, autor, data
- Resumo executivo
- Notas técnicas (Markdown renderizado)
- Card GitHub: repo, branch, commit, PR — botão "Ver no GitHub"
- Arquivos alterados (added/modified/deleted) com diff expandível
- Classes Sankhya afetadas com link ao repositório
- Sistemas impactados (checklist)
- Plano de rollback
- Checklist pré-deploy (testes, homolog, aprovações)
- Comentários (thread)
- Histórico de revisões do documento
- Ações: editar, exportar PDF/MD, duplicar, arquivar

### 5.4 Cadastro (Wizard Multi-Step)

1. **Identificação**: versão, título, classificação, tags
2. **Conteúdo**: editor Markdown split-screen + resumo
3. **GitHub**: selecionar repo/branch/commit → importar arquivos via API
4. **Classes Sankhya**: buscar classes no repo, apontar arquivo/linha
5. **Impacto & Rollback**: sistemas afetados, plano rollback
6. **Checklist**: testes, homolog, review, aprovação
7. **Revisão**: preview → publicar

UX: auto-save 30s, validação inline, progress bar, `Ctrl+Enter` avança, `Ctrl+S` salva rascunho

### 5.5 Linha do Tempo

- Timeline vertical com cards intercalados esquerda/direita
- Filtro por classificação (chips coloridos)
- Zoom: diário / semanal / mensal
- Marcadores: hotfixes (vermelho pulsante), releases maiores (borda vermelha)
- Conexões visuais entre patches dependentes
- Click → drawer lateral com detalhes
- Mini-mapa para navegação
- Exportar como imagem

### 5.6 Hotfix de Emergência (Sub-aba)

- Lista com prioridade visual (glow vermelho, ícone alerta)
- Campos: severidade (crítica/alta/média), sistema, tempo resolução, autor
- Workflow: Reportado → Em análise → Em correção → Deployado → Validado → Fechado
- SLA tracking com timer visual
- **Formulário rápido** (campos mínimos: título, severidade, sistema, descrição, commit)
- Pós-hotfix: prompt para completar documentação → converte em note patch
- Stats: tempo médio resolução, hotfixes/mês, recorrentes por sistema

### 5.7 Trilha de Auditoria (Sub-aba)

- Tabela: timestamp, usuário, ação, entidade, detalhe
- Filtro por usuário, ação, data
- Export CSV
- Logs append-only (imutáveis)

### 5.8 Documentos

- Upload drag & drop: PDF, DOCX, MD, imagens, XLSX
- Pastas virtuais por classificação, tags, vínculo a patch
- Preview in-browser (PDF, Markdown, imagem)
- Versionamento de documentos
- Busca full-text (extração de PDF/DOCX)
- Permissões: público / interno / restrito
- Export individual: PDF, MD
- **Export em massa**: selecionar docs + patches → ZIP com índice, capa, timeline

### 5.9 Classificações

| Classificação | Cor | Escopo |
|---|---|---|
| Comercial | `#3B82F6` | Pedidos, contratos |
| Produção | `#22C55E` | Manufatura, OPs |
| Portais | `#A855F7` | Portal parceiro/cliente |
| Financeiro | `#F59E0B` | Contas pagar/receber |
| Contábil | `#06B6D4` | Contabilidade, livros |
| Fiscal | `#EC4899` | NFs, SPED, eSocial |
| Suprimentos | `#14B8A6` | Compras, estoque |
| RH | `#F97316` | Folha, ponto |
| Logística | `#8B5CF6` | Transporte, expedição |
| CRM | `#10B981` | Atendimento, pipeline |
| Integrações | `#6366F1` | APIs, webhooks |
| Infraestrutura | `#E11D48` | DevOps, banco |
| Segurança | `#DC2626` | Auth, auditoria |
| Frontend | `#F43F5E` | UI/UX |
| Backend | `#7C3AED` | Serviços, regras |

- CRUD de classificações (nome, descrição, cor, ícone, ativa/inativa)
- Sub-classificações (ex: Financeiro → Contas a Receber)
- Contador de patches por classificação
- Drag & drop para reordenar

### 5.10 Integração GitHub

- Config: PAT ou GitHub App, seleção de organização
- Repos monitorados com toggle on/off
- **Sync automático**: novo PR mergeado em produção → cria rascunho de patch
- Browser de código: navegar arquivos do repo no sistema
- Status da conexão (conectado/erro), última sync
- Webhooks para push/PR
- Mapeamento de classes Sankhya indexadas para busca
- Diff viewer de commit/PR in-system

## 6. Funcionalidades Inovadoras

### 6.1 Command Palette (`Ctrl+K`)

- Busca global: patches, docs, classificações, ações
- Navegação por teclado
- Comandos: "Novo patch", "Novo hotfix", "Exportar", "Ver timeline"

### 6.2 Comparação de Versões (Diff)

- Selecionar 2 patches → comparar mudanças
- Diff lado a lado com syntax highlighting
- Exportar diff como PDF

### 6.3 Templates de Note Patch

- Templates por classificação (fiscal ≠ frontend)
- Variáveis: `{{version}}`, `{{date}}`, `{{author}}`, `{{repo}}`
- Template de hotfix (enxuto, focado em urgência)

### 6.4 Workflow de Aprovação

- Estados: Draft → In Review → Approved → Published → Archived
- Aprovadores configuráveis
- Comentários inline de revisão
- Patch publicado fica locked (apenas versionado/arquivado)

### 6.5 Métricas Avançadas

- Patch frequency (line chart)
- Hotfix ratio vs planejados (donut)
- Time to document (tempo deploy → doc)
- Top contribuidores
- **Heatmap de deploys** (estilo GitHub contribution graph)
- Distribuição por classificação (pie)

### 6.6 Favoritos e Coleções

- Favoritar patches
- Coleções nomeadas ("Patches Q1 2026", "Hotfixes críticos")
- Compartilhar via URL

### 6.7 Modo Apresentação

- Fullscreen sem UI de navegação
- Navegação com setas do teclado
- Útil para handover, post-mortem, retrospectivas

### 6.8 Widget Embed

- Iframe para Confluence/Notion
- URL: `/embed/patches/:id?theme=dark`

### 6.9 Atalhos de Teclado

| Atalho | Ação |
|---|---|
| `Ctrl+K` | Command palette |
| `Ctrl+N` | Novo patch |
| `Ctrl+H` | Novo hotfix |
| `Ctrl+T` | Timeline |
| `Ctrl+D` | Dashboard |
| `Ctrl+E` | Exportar patch atual |
| `?` | Overlay de atalhos |

### 6.10 Notificações

- In-app: bell icon com badge
- Eventos: novo patch, hotfix, review solicitado, doc vinculado
- Config por usuário
- Email digest opcional (diário/semanal)

## 7. Modelo de Dados (TypeScript)

```typescript
interface NotePatch {
  id: string;
  version: string;
  title: string;
  summary: string;
  technicalNotes: string;              // markdown
  status: 'draft' | 'in_review' | 'approved' | 'published' | 'archived';
  classificationId: string;
  subClassificationId?: string;
  tags: string[];
  authorId: string;
  reviewerId?: string;
  githubRepo?: string;
  githubBranch?: string;
  githubCommitSha?: string;
  githubPrUrl?: string;
  githubFiles: GithubFile[];
  affectedClasses: AffectedClass[];
  impactedSystems: string[];
  rollbackPlan?: string;
  checklist: ChecklistItem[];
  deployedAt: Date;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface GithubFile {
  path: string;
  status: 'added' | 'modified' | 'deleted';
  additions: number;
  deletions: number;
  diffUrl: string;
}

interface AffectedClass {
  className: string;
  filePath: string;
  repoUrl: string;
  lineRange?: string;
  description?: string;
}

interface ChecklistItem {
  label: string;
  checked: boolean;
  checkedBy?: string;
  checkedAt?: Date;
}

interface Hotfix {
  id: string;
  patchId?: string;
  title: string;
  severity: 'critical' | 'high' | 'medium';
  affectedSystem: string;
  description: string;
  commitSha?: string;
  status: 'reported' | 'analyzing' | 'fixing' | 'deployed' | 'validated' | 'closed';
  reportedBy: string;
  resolvedBy?: string;
  reportedAt: Date;
  deployedAt?: Date;
  resolvedAt?: Date;
  resolutionTimeMinutes?: number;
  postMortemNeeded: boolean;
  postMortemDone: boolean;
}

interface Document {
  id: string;
  title: string;
  type: 'pdf' | 'docx' | 'md' | 'image' | 'xlsx' | 'other';
  fileUrl: string;
  classificationId?: string;
  patchId?: string;
  tags: string[];
  visibility: 'public' | 'internal' | 'restricted';
  versions: DocumentVersion[];
  uploadedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface DocumentVersion {
  version: number;
  fileUrl: string;
  uploadedBy: string;
  uploadedAt: Date;
  changeNote?: string;
}

interface Classification {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  isActive: boolean;
  parentId?: string;
  sortOrder: number;
  patchCount: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'reviewer' | 'viewer';
  avatarUrl?: string;
  githubUsername?: string;
}

interface AuditLog {
  id: string;
  userId: string;
  action: 'create' | 'update' | 'delete' | 'export' | 'archive' | 'publish';
  entity: string;
  entityId: string;
  details: Record<string, any>;
  timestamp: Date;
}
```

## 8. Estrutura de Pastas (Frontend)

```
src/
├── api/                    # client.ts, patches.ts, hotfixes.ts, etc
├── components/
│   ├── ui/                 # shadcn/ui
│   ├── layout/             # RootLayout, Sidebar, TopBar, CommandPalette
│   ├── patches/            # PatchCard, PatchList, PatchFormWizard, PatchDetail, PatchFilters
│   ├── timeline/           # TimelineView, TimelineNode, TimelineMiniMap
│   ├── hotfix/             # HotfixCard, HotfixQuickForm, HotfixWorkflow, HotfixStats
│   ├── documents/          # DocumentGrid, DocumentUploader, DocumentPreview, ExportBundle
│   ├── github/             # GitHubBrowser, GitHubConfig, GitHubFileList
│   ├── dashboard/          # KpiCards, PatchFrequencyChart, DeployHeatmap
│   └── shared/             # Badge, StatusPill, ClassificationBadge, EmptyState
├── hooks/                  # usePatches, useHotfixes, useGitHub, useKeyboardShortcuts
├── pages/                  # Uma por rota
├── store/                  # authStore, filterStore, notificationStore
├── types/                  # index.ts
├── lib/                    # utils.ts, export.ts, constants.ts
├── styles/                 # globals.css
├── App.tsx
└── main.tsx
```

## 9. Sidebar

```
◆ NOTE PATCH
📊 Dashboard
📋 Patches
🕐 Timeline
📂 Histórico
   ├️ 🔥 Hotfix       (badge vermelho)
   └️ 📝 Auditoria
📁 Documentos
🏷️ Classificações
🔗 GitHub
⚙️ Configurações
─────────────────
🔔 [3] Notificações
👤 Usuário (role)
```

- Colapsável (ícone-only), indicador ativo vermelho, badge em hotfixes/notificações, drawer no mobile

## 10. Considerações Técnicas

- **Performance**: lazy loading, virtualização de listas, debounce buscas (300ms), cache React Query
- **Acessibilidade**: navegação por teclado, ARIA labels, focus visible vermelho, semantic HTML
- **Responsivo**: mobile (<640px), tablet (640-1024), desktop (>1024); sidebar vira drawer; grid adapta colunas
- **Segurança**: JWT + refresh, RBAC (admin/editor/reviewer/viewer), sanitização Markdown (DOMPurify), GitHub PAT encrypted no backend
- **API REST read-only** pública com API key, rate limiting, documentação Swagger
