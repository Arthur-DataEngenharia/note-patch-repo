import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../generated/prisma/client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const adapter = new PrismaBetterSqlite3({ url: 'file:./prisma/dev.db' });
const prisma = new PrismaClient({ adapter });
const app = express();
const PORT = Number(process.env.PORT) || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'note-patch-secret-change-in-production';

const isProd = process.env.NODE_ENV === 'production';
app.use(cors({ origin: isProd ? false : true }));
app.use(express.json({ limit: '10mb' }));

// ─── Auth helpers ───
function signToken(user: { id: string; email: string; role: string }) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
}

function verifyToken(token: string) {
  try { return jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string }; }
  catch { return null; }
}

function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const auth = req.headers.authorization;
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  const payload = token ? verifyToken(token) : null;
  if (!payload) return res.status(401).json({ error: 'Unauthorized' });
  (req as any).user = payload;
  next();
}

function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = (req as any).user;
  if (!user || user.role !== 'admin') return res.status(403).json({ error: 'Forbidden: admin only' });
  next();
}

// ─── Helpers ───
function toDate(v: any) { return v ? new Date(v) : null; }

function parsePatch(p: any) {
  return {
    ...p,
    tags: JSON.parse(p.tags || '[]'),
    githubFiles: JSON.parse(p.githubFiles || '[]'),
    affectedClasses: JSON.parse(p.affectedClasses || '[]'),
    impactedSystems: JSON.parse(p.impactedSystems || '[]'),
    checklist: JSON.parse(p.checklist || '[]'),
    codeReferences: p.codeReferences ? JSON.parse(p.codeReferences) : [],
    createdAt: toDate(p.createdAt),
    updatedAt: toDate(p.updatedAt),
    deployedAt: toDate(p.deployedAt),
  };
}

function parseDoc(d: any) {
  return {
    ...d,
    tags: JSON.parse(d.tags || '[]'),
    versions: JSON.parse(d.versions || '[]'),
    createdAt: toDate(d.createdAt),
    updatedAt: toDate(d.updatedAt),
  };
}

function parseAudit(a: any) {
  return { ...a, details: JSON.parse(a.details || '{}'), timestamp: toDate(a.timestamp) };
}

function parseHotfix(h: any) {
  return {
    ...h,
    codeReferences: h.codeReferences ? JSON.parse(h.codeReferences) : [],
    reportedAt: toDate(h.reportedAt),
    closedAt: toDate(h.closedAt),
    updatedAt: toDate(h.updatedAt),
  };
}

// ─── Auth ───
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = signToken(user);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, avatarUrl: user.avatarUrl } });
});

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, role = 'viewer' } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password required' });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return res.status(409).json({ error: 'Email already in use' });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { id: `u${Date.now()}`, name, email, role, passwordHash },
  });

  const token = signToken(user);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
});

app.get('/api/auth/me', async (req, res) => {
  const auth = req.headers.authorization;
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  const payload = token ? verifyToken(token) : null;
  if (!payload) return res.status(401).json({ error: 'Unauthorized' });

  const user = await prisma.user.findUnique({ where: { id: payload.id } });
  if (!user) return res.status(401).json({ error: 'User not found' });

  res.json({ id: user.id, name: user.name, email: user.email, role: user.role, avatarUrl: user.avatarUrl });
});

// ─── Patches ───
app.get('/api/patches', async (_req, res) => {
  const patches = await prisma.notePatch.findMany({ orderBy: { deployedAt: 'desc' } });
  res.json(patches.map(parsePatch));
});

app.get('/api/patches/:id', async (req, res) => {
  const patch = await prisma.notePatch.findUnique({ where: { id: req.params.id } });
  if (!patch) return res.status(404).json({ error: 'Patch not found' });
  res.json(parsePatch(patch));
});

app.post('/api/patches', async (req, res) => {
  const b = req.body;
  const patch = await prisma.notePatch.create({
    data: {
      id: b.id,
      version: b.version,
      title: b.title,
      summary: b.summary,
      technicalNotes: b.technicalNotes,
      status: b.status || 'draft',
      classificationId: b.classificationId,
      tags: JSON.stringify(b.tags || []),
      authorId: b.authorId,
      reviewerId: b.reviewerId || null,
      githubRepo: b.githubRepo || null,
      githubBranch: b.githubBranch || null,
      githubCommitSha: b.githubCommitSha || null,
      githubPrUrl: b.githubPrUrl || null,
      githubFiles: JSON.stringify(b.githubFiles || []),
      affectedClasses: JSON.stringify(b.affectedClasses || []),
      impactedSystems: JSON.stringify(b.impactedSystems || []),
      rollbackPlan: b.rollbackPlan || null,
      checklist: JSON.stringify(b.checklist || []),
      codeReferences: b.codeReferences ? JSON.stringify(b.codeReferences) : null,
      deployedAt: b.deployedAt || new Date(),
      publishedAt: b.publishedAt || null,
      isHotfix: b.isHotfix || false,
      favorite: b.favorite || false,
    },
  });
  res.json(parsePatch(patch));
});

app.patch('/api/patches/:id', async (req, res) => {
  const b = req.body;
  const data: any = { updatedAt: new Date() };
  if (b.status !== undefined) data.status = b.status;
  if (b.title !== undefined) data.title = b.title;
  if (b.summary !== undefined) data.summary = b.summary;
  if (b.technicalNotes !== undefined) data.technicalNotes = b.technicalNotes;
  if (b.classificationId !== undefined) data.classificationId = b.classificationId;
  if (b.tags !== undefined) data.tags = JSON.stringify(b.tags);
  if (b.reviewerId !== undefined) data.reviewerId = b.reviewerId;
  if (b.githubRepo !== undefined) data.githubRepo = b.githubRepo;
  if (b.githubBranch !== undefined) data.githubBranch = b.githubBranch;
  if (b.githubCommitSha !== undefined) data.githubCommitSha = b.githubCommitSha;
  if (b.githubPrUrl !== undefined) data.githubPrUrl = b.githubPrUrl;
  if (b.githubFiles !== undefined) data.githubFiles = JSON.stringify(b.githubFiles);
  if (b.affectedClasses !== undefined) data.affectedClasses = JSON.stringify(b.affectedClasses);
  if (b.impactedSystems !== undefined) data.impactedSystems = JSON.stringify(b.impactedSystems);
  if (b.rollbackPlan !== undefined) data.rollbackPlan = b.rollbackPlan;
  if (b.checklist !== undefined) data.checklist = JSON.stringify(b.checklist);
  if (b.codeReferences !== undefined) data.codeReferences = JSON.stringify(b.codeReferences);
  if (b.favorite !== undefined) data.favorite = b.favorite;
  if (b.publishedAt !== undefined) data.publishedAt = b.publishedAt;

  const patch = await prisma.notePatch.update({ where: { id: req.params.id }, data });
  res.json(parsePatch(patch));
});

app.delete('/api/patches/:id', async (req, res) => {
  await prisma.notePatch.delete({ where: { id: req.params.id } });
  res.json({ ok: true });
});

// ─── Hotfixes ───
app.get('/api/hotfixes', async (_req, res) => {
  const hotfixes = await prisma.hotfix.findMany({ orderBy: { reportedAt: 'desc' } });
  res.json(hotfixes.map((h) => ({ ...parseHotfix(h), reportedBy: h.reportedById })));
});

app.post('/api/hotfixes', async (req, res) => {
  const b = req.body;
  const hotfix = await prisma.hotfix.create({
    data: {
      id: b.id,
      title: b.title,
      severity: b.severity,
      affectedSystem: b.affectedSystem,
      description: b.description,
      commitSha: b.commitSha || null,
      status: b.status || 'reported',
      reportedById: b.reportedBy,
      reportedAt: b.reportedAt || new Date(),
      postMortemNeeded: b.postMortemNeeded ?? false,
      postMortemDone: b.postMortemDone ?? false,
      codeReferences: b.codeReferences ? JSON.stringify(b.codeReferences) : null,
      patchId: b.patchId || null,
    },
  });
  res.json({ ...parseHotfix(hotfix), reportedBy: hotfix.reportedById });
});

app.patch('/api/hotfixes/:id', async (req, res) => {
  const b = req.body;
  const data: any = {};
  if (b.status !== undefined) data.status = b.status;
  if (b.deployedAt !== undefined) data.deployedAt = b.deployedAt;
  if (b.resolvedAt !== undefined) data.resolvedAt = b.resolvedAt;
  if (b.resolvedBy !== undefined) data.resolvedBy = b.resolvedBy;
  if (b.resolutionTimeMinutes !== undefined) data.resolutionTimeMinutes = b.resolutionTimeMinutes;
  if (b.postMortemDone !== undefined) data.postMortemDone = b.postMortemDone;
  if (b.codeReferences !== undefined) data.codeReferences = JSON.stringify(b.codeReferences);
  if (b.patchId !== undefined) data.patchId = b.patchId;

  const hotfix = await prisma.hotfix.update({ where: { id: req.params.id }, data });
  res.json({ ...parseHotfix(hotfix), reportedBy: hotfix.reportedById });
});

// ─── Documents ───
app.get('/api/documents', async (_req, res) => {
  const docs = await prisma.document.findMany({ orderBy: { updatedAt: 'desc' } });
  res.json(docs.map(parseDoc).map((d: any) => ({ ...d, uploadedBy: d.uploadedById })));
});

app.post('/api/documents', async (req, res) => {
  const b = req.body;
  const doc = await prisma.document.create({
    data: {
      id: b.id,
      title: b.title,
      type: b.type,
      fileUrl: b.fileUrl,
      fileSize: b.fileSize,
      tags: JSON.stringify(b.tags || []),
      visibility: b.visibility || 'internal',
      versions: JSON.stringify(b.versions || []),
      patchId: b.patchId || null,
      classificationId: b.classificationId || null,
      uploadedById: b.uploadedBy,
    },
  });
  res.json({ ...parseDoc(doc), uploadedBy: (doc as any).uploadedById });
});

// ─── Classifications ───
app.get('/api/classifications', async (_req, res) => {
  const classifications = await prisma.classification.findMany({ orderBy: { sortOrder: 'asc' } });
  const patches = await prisma.notePatch.groupBy({ by: ['classificationId'], _count: true });
  const counts = Object.fromEntries(patches.map((p) => [p.classificationId, p._count]));
  res.json(classifications.map((c) => ({
    ...c,
    icon: '',
    patchCount: counts[c.id] || 0,
  })));
});

app.post('/api/classifications', async (req, res) => {
  const b = req.body;
  const classification = await prisma.classification.create({
    data: {
      id: b.id || `c${Date.now()}`,
      name: b.name,
      color: b.color,
      description: b.description,
      sortOrder: b.sortOrder || 0,
      isActive: b.isActive ?? true,
      parentId: b.parentId || null,
      versionPrefix: b.versionPrefix || null,
    },
  });
  res.json({ ...classification, icon: '', patchCount: 0 });
});

// ─── Audit Logs ───
app.get('/api/audit-logs', async (_req, res) => {
  const logs = await prisma.auditLog.findMany({ orderBy: { timestamp: 'desc' } });
  res.json(logs.map(parseAudit));
});

app.post('/api/audit-logs', async (req, res) => {
  const b = req.body;
  const log = await prisma.auditLog.create({
    data: {
      userId: b.userId,
      userName: b.userName,
      action: b.action,
      entity: b.entity,
      entityId: b.entityId,
      details: JSON.stringify(b.details || {}),
    },
  });
  res.json(parseAudit(log));
});

// ─── Notifications ───
app.get('/api/notifications', async (_req, res) => {
  const notifications = await prisma.notification.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(notifications);
});

app.patch('/api/notifications/:id', async (req, res) => {
  const data: any = {};
  if (req.body.read !== undefined) data.read = req.body.read;
  const notification = await prisma.notification.update({ where: { id: req.params.id }, data });
  res.json(notification);
});

app.patch('/api/notifications', async (req, res) => {
  if (req.body.markAllRead) {
    await prisma.notification.updateMany({ data: { read: true } });
    return res.json({ ok: true });
  }
  res.status(400).json({ error: 'Invalid request' });
});

// ─── Users ───
app.get('/api/users', async (_req, res) => {
  const users = await prisma.user.findMany();
  res.json(users.map((u) => ({ ...u, avatarUrl: null, githubUsername: null })));
});

// ─── GitHub Integration ───
app.post('/api/github/connect', async (req, res) => {
  const auth = req.headers.authorization;
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  const payload = token ? verifyToken(token) : null;
  if (!payload) return res.status(401).json({ error: 'Unauthorized' });

  const { githubToken } = req.body;
  if (!githubToken) return res.status(400).json({ error: 'githubToken required' });

  // Validate token by fetching user
  const ghRes = await fetch('https://api.github.com/user', {
    headers: { Authorization: `token ${githubToken}`, Accept: 'application/vnd.github.v3+json' },
  });
  if (!ghRes.ok) return res.status(400).json({ error: 'Invalid GitHub token' });

  const ghUser = await ghRes.json();
  await prisma.user.update({
    where: { id: payload.id },
    data: { githubToken },
  });

  res.json({ login: ghUser.login, avatarUrl: ghUser.avatar_url });
});

app.get('/api/github/repos', async (req, res) => {
  const auth = req.headers.authorization;
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  const payload = token ? verifyToken(token) : null;
  if (!payload) return res.status(401).json({ error: 'Unauthorized' });

  const user = await prisma.user.findUnique({ where: { id: payload.id } });
  const ghToken = user?.githubToken || process.env.GITHUB_TOKEN;
  if (!ghToken) return res.status(400).json({ error: 'GitHub token not configured' });

  const headers: any = {
    Authorization: `token ${ghToken}`,
    Accept: 'application/vnd.github.v3+json',
  };

  const [reposRes, orgsRes] = await Promise.all([
    fetch('https://api.github.com/user/repos?sort=updated&per_page=50', { headers }),
    fetch('https://api.github.com/user/orgs', { headers }),
  ]);

  const repos = reposRes.ok ? await reposRes.json() : [];
  const orgs = orgsRes.ok ? await orgsRes.json() : [];

  const mappedRepos = repos.map((r: any) => ({
    id: r.id,
    name: r.name,
    fullName: r.full_name,
    description: r.description,
    url: r.html_url,
    stars: r.stargazers_count,
    forks: r.forks_count,
    language: r.language,
    updatedAt: r.updated_at,
    isPrivate: r.private,
    owner: r.owner?.login,
  }));

  res.json({ repos: mappedRepos, orgs: orgs.map((o: any) => ({ login: o.login, avatarUrl: o.avatar_url })) });
});

async function getGitHubHeaders(req: express.Request) {
  const auth = req.headers.authorization;
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
  const payload = token ? verifyToken(token) : null;
  if (!payload) throw new Error('Unauthorized');
  const user = await prisma.user.findUnique({ where: { id: payload.id } });
  const ghToken = user?.githubToken || process.env.GITHUB_TOKEN;
  if (!ghToken) throw new Error('GitHub token not configured');
  return { Authorization: `token ${ghToken}`, Accept: 'application/vnd.github.v3+json' };
}

// Get repo tree (branches & root tree)
app.get('/api/github/repos/:owner/:repo/tree', async (req, res) => {
  try {
    const headers = await getGitHubHeaders(req);
    const { owner, repo } = req.params;
    let branch = req.query.branch as string || 'main';

    // Try to get default branch if specified branch fails
    const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
    if (repoRes.ok) {
      const repoData = await repoRes.json();
      if (repoData.default_branch) branch = repoData.default_branch;
    }

    const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`, { headers });
    if (!treeRes.ok) {
      const errText = await treeRes.text();
      return res.status(400).json({ error: `GitHub tree error: ${treeRes.status} ${errText}` });
    }
    const tree = await treeRes.json();
    res.json({ tree: tree.tree || [], branch });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Get file contents
app.get('/api/github/repos/:owner/:repo/file', async (req, res) => {
  try {
    const headers = await getGitHubHeaders(req);
    const { owner, repo } = req.params;
    const path = req.query.path as string || '';
    const ref = req.query.ref as string || 'main';
    const contentRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${ref}`, { headers });
    if (!contentRes.ok) throw new Error('Failed to fetch content');
    const content = await contentRes.json();
    if (content.content) {
      content.decoded = Buffer.from(content.content, 'base64').toString('utf-8');
    }
    res.json(content);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Get commits
app.get('/api/github/repos/:owner/:repo/commits', async (req, res) => {
  try {
    const headers = await getGitHubHeaders(req);
    const { owner, repo } = req.params;
    let sha = req.query.sha as string || '';
    const path = req.query.path as string || '';

    // Get default branch if not specified
    if (!sha) {
      const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
      if (repoRes.ok) {
        const repoData = await repoRes.json();
        sha = repoData.default_branch || 'main';
      } else {
        sha = 'main';
      }
    }

    let url = `https://api.github.com/repos/${owner}/${repo}/commits?sha=${sha}&per_page=30`;
    if (path) url += `&path=${encodeURIComponent(path)}`;
    const commitsRes = await fetch(url, { headers });
    if (!commitsRes.ok) {
      const errText = await commitsRes.text();
      return res.status(400).json({ error: `GitHub commits error: ${commitsRes.status} ${errText}` });
    }
    const commits = await commitsRes.json();
    res.json({ commits: commits.map((c: any) => ({
      sha: c.sha,
      message: c.commit?.message,
      author: c.commit?.author?.name,
      date: c.commit?.author?.date,
      url: c.html_url,
    })), branch: sha });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ─── Health ───
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// ─── Static files (production) ───
if (isProd) {
  app.use(express.static(path.join(__dirname, '../dist')));
  app.get(/.*/, (_req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
