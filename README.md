# Note Patch Repository

Repositório centralizado de **Note Patches** — registros versionados e explicativos do que foi deployado em produção no ecossistema Sankhya.

Consulte a especificação completa em [`SPEC.md`](./SPEC.md).

## Stack

- React 18 + TypeScript + Vite
- Tailwind CSS (dark-first, paleta preto/branco/vermelho)
- Zustand (estado) + React Query (cache)
- React Router v6, Lucide, Recharts, react-markdown, Sonner, jsPDF

## Rodando o projeto

```bash
npm install
npm run dev
```

Acesse `http://localhost:5173`.

## Build de produção

```bash
npm run build
npm run preview
```

## Funcionalidades

- **Dashboard** — KPIs, gráfico por classificação, alertas, feed de atividade
- **Patches** — listagem com filtros/busca, grid/lista, detalhe completo, wizard de cadastro em 7 etapas
- **Timeline** — linha do tempo vertical com filtros por classificação e drawer de detalhes
- **Hotfix** — registro rápido de emergência, workflow de 6 estágios, SLA tracking
- **Auditoria** — trilha imutável com export CSV
- **Documentos** — upload drag & drop, seleção múltipla, export bundle
- **Classificações** — 15 módulos Sankhya com cores e contadores
- **GitHub** — configuração de conexão, repositórios monitorados, sync
- **Command Palette** — `Ctrl+K` para busca global
- **Exportação** — PDF e Markdown por patch

## Observações

- Os dados são **mockados** em `src/lib/mockData.ts` (sem backend).
- A integração real com GitHub (Octokit) e o backend (Node + Prisma + PostgreSQL) estão especificados no `SPEC.md` como próxima fase.
