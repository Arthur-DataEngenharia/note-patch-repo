# Deploy Guide — Railway (tudo num serviço só)

## 1. GitHub

```bash
git remote add origin https://github.com/SEU-USUARIO/note-patch-repo.git
git push -u origin main
```

## 2. Railway

1. Acesse [railway.app](https://railway.app) e crie conta com GitHub
2. **New Project** → **Deploy from GitHub repo** → selecione o repositório
3. Railway detecta automaticamente:
   - **Build**: `npm install` (dispara `postinstall` → `prisma generate`) + `npm run build` (compila Vite → `dist/`)
   - **Start**: `npm run db:migrate && npm run db:seed && npm start`
   - A porta é detectada automaticamente (`PORT` env)
4. Pronto — a aplicação estará online em uma única URL

## Como funciona

- O Express serve o frontend estático (`dist/`) e a API (`/api/*`) na mesma porta
- Todas as rotas do frontend redirecionam para `index.html` (SPA)
- SQLite persiste entre deploys no volume do Railway

## URL final

- `https://note-patch-repo.up.railway.app` (substitua pelo domínio real)
