import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../generated/prisma/client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const adapter = new PrismaBetterSqlite3({ url: 'file:./prisma/dev.db' });
const prisma = new PrismaClient({ adapter });
const app = express();
const PORT = Number(process.env.PORT) || 3001;

const isProd = process.env.NODE_ENV === 'production';
app.use(cors({ origin: isProd ? false : true }));
app.use(express.json({ limit: '10mb' }));

// ─── Helpers ───
function parsePatch(p: any) {
  return {
    ...p,
    tags: JSON.parse(p.tags || '[]'),
    githubFiles: JSON.parse(p.githubFiles || '[]'),
    affectedClasses: JSON.parse(p.affectedClasses || '[]'),
    impactedSystems: JSON.parse(p.impactedSystems || '[]'),
    checklist: JSON.parse(p.checklist || '[]'),
  };
}

function parseDoc(d: any) {
  return {
    ...d,
    tags: JSON.parse(d.tags || '[]'),
    versions: JSON.parse(d.versions || '[]'),
  };
}

function parseAudit(a: any) {
  return { ...a, details: JSON.parse(a.details || '{}') };
}

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
  res.json(hotfixes.map((h) => ({ ...h, reportedBy: h.reportedById })));
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
      patchId: b.patchId || null,
    },
  });
  res.json({ ...hotfix, reportedBy: hotfix.reportedById });
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
  if (b.patchId !== undefined) data.patchId = b.patchId;

  const hotfix = await prisma.hotfix.update({ where: { id: req.params.id }, data });
  res.json({ ...hotfix, reportedBy: hotfix.reportedById });
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
    parentId: null,
  })));
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
