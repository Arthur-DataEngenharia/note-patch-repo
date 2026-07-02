# Deploy Guide

## 1. GitHub (código fonte)

```bash
git init
git add .
git commit -m "Initial commit"
```

Crie um repositório no [github.com](https://github.com), depois:

```bash
git remote add origin https://github.com/SEU-USUARIO/note-patch-repo.git
git push -u origin main
```

---

## 2. Backend — Render (gratuito)

1. Acesse [render.com](https://render.com) e crie conta com GitHub
2. **New Web Service** → conecte o repositório
3. Configuração:
   - **Root Directory**: `server` (ou deixe em branco se o package.json está na raiz)
   - **Build Command**: `npm install && npx prisma generate && npx prisma migrate deploy && npx tsx prisma/seed.ts`
   - **Start Command**: `npx tsx server/index.ts`
   - **Plan**: Free
4. Variáveis de ambiente:
   - `CORS_ORIGIN=https://note-patch-repo.vercel.app` (substitua pela URL do Vercel)
5. Copie a **URL do serviço** (ex: `https://note-patch-api.onrender.com`)

> ⚠️ No plano Free o SQLite reseta a cada deploy. Para produção real, migre para PostgreSQL.

---

## 3. Frontend — Vercel (gratuito)

1. Acesse [vercel.com](https://vercel.com) e crie conta com GitHub
2. **New Project** → importe o repositório
3. Configuração:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Variáveis de ambiente:
   - `VITE_API_URL=https://note-patch-api.onrender.com/api` (URL do Render + `/api`)
5. Deploy

O `vercel.json` já redireciona todas as rotas para o SPA.

---

## URLs finais

- **Frontend**: `https://note-patch-repo.vercel.app`
- **Backend**: `https://note-patch-api.onrender.com`
- **API Docs**: `https://note-patch-api.onrender.com/api/health`
