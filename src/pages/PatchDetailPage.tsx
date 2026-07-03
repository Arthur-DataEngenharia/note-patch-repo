import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Github,
  GitBranch,
  GitCommit,
  GitPullRequest,
  FilePlus,
  FileEdit,
  FileMinus,
  ExternalLink,
  Download,
  Archive,
  Pencil,
  CheckCircle2,
  Circle,
  Undo2,
  Layers,
  Flame,
  ChevronDown,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';
import { useAppStore } from '@/store/appStore';
import { ClassificationBadge } from '@/components/shared/ClassificationBadge';
import { StatusPill } from '@/components/shared/StatusPill';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Tooltip } from '@/components/shared/Tooltip';
import { Breadcrumb } from '@/components/shared/Breadcrumb';
import { TimeSheetPanel } from '@/components/shared/TimeSheetPanel';
import { formatDate, formatDateTime, cn } from '@/lib/utils';
import { getUser } from '@/lib/mockData';
import { exportPatchToPdf, exportPatchToMarkdown } from '@/lib/export';

const FILE_STATUS_ICON = {
  added: { icon: FilePlus, color: '#22C55E' },
  modified: { icon: FileEdit, color: '#F59E0B' },
  deleted: { icon: FileMinus, color: '#E11D48' },
};

export default function PatchDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { patches, archivePatch, addAuditLog, currentUser } = useAppStore();
  const patch = patches.find((p) => p.id === id);
  const [filesOpen, setFilesOpen] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!patch) {
    return (
      <div className="text-center py-16">
        <p className="text-white-muted mb-4">Patch não encontrado.</p>
        <Link to="/patches" className="btn-primary">
          Voltar para Patches
        </Link>
      </div>
    );
  }

  const author = getUser(patch.authorId);
  const reviewer = patch.reviewerId ? getUser(patch.reviewerId) : undefined;

  const handleExportPdf = () => {
    exportPatchToPdf(patch);
    addAuditLog({ userId: currentUser.id, userName: currentUser.name, action: 'export', entity: 'patch', entityId: patch.id, details: { format: 'pdf' } });
    toast.success('Patch exportado como PDF');
  };

  const handleExportMd = () => {
    exportPatchToMarkdown(patch);
    addAuditLog({ userId: currentUser.id, userName: currentUser.name, action: 'export', entity: 'patch', entityId: patch.id, details: { format: 'md' } });
    toast.success('Patch exportado como Markdown');
  };

  const handleArchive = () => {
    setConfirmOpen(true);
  };

  const confirmArchive = () => {
    archivePatch(patch.id);
    addAuditLog({ userId: currentUser.id, userName: currentUser.name, action: 'archive', entity: 'patch', entityId: patch.id, details: {} });
    setConfirmOpen(false);
    navigate('/patches');
  };

  return (
    <div className="animate-fade-in">
      <Breadcrumb items={[{ label: 'Patches', to: '/patches' }, { label: patch.title }]} />

      <ConfirmDialog
        open={confirmOpen}
        title="Arquivar Patch"
        message={`Tem certeza que deseja arquivar "${patch.title}"? Ele será movido para o status arquivado.`}
        confirmLabel="Arquivar"
        variant="warning"
        onConfirm={confirmArchive}
        onCancel={() => setConfirmOpen(false)}
      />

      {/* Back + actions */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <button onClick={() => navigate('/patches')} className="btn-ghost flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Patches
        </button>
        <div className="flex items-center gap-2 flex-wrap">
          <Tooltip text="Exportar como PDF">
            <button onClick={handleExportPdf} className="btn-secondary flex items-center gap-2">
              <Download className="w-4 h-4" /> PDF
            </button>
          </Tooltip>
          <Tooltip text="Exportar como Markdown">
            <button onClick={handleExportMd} className="btn-secondary flex items-center gap-2">
              <Download className="w-4 h-4" /> Markdown
            </button>
          </Tooltip>
          {patch.status !== 'published' && (
            <Tooltip text="Editar patch">
              <button className="btn-secondary flex items-center gap-2">
                <Pencil className="w-4 h-4" /> Editar
              </button>
            </Tooltip>
          )}
          {patch.status !== 'archived' && (
            <Tooltip text="Mover para arquivados">
              <button onClick={handleArchive} className="btn-ghost flex items-center gap-2 text-red">
                <Archive className="w-4 h-4" /> Arquivar
              </button>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Header */}
      <div className={cn('glass-card p-6 mb-6 red-accent-left', patch.isHotfix && 'shadow-red-glow')}>
        <div className="flex items-center gap-3 flex-wrap mb-3">
          <span className="font-mono text-sm text-red font-bold">{patch.version}</span>
          {patch.isHotfix && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-red-glow uppercase bg-red-soft px-2 py-0.5 rounded-full">
              <Flame className="w-3 h-3" /> Hotfix
            </span>
          )}
          <StatusPill status={patch.status} />
          <ClassificationBadge classificationId={patch.classificationId} />
        </div>
        <h1 className="text-2xl font-bold mb-2">{patch.title}</h1>
        <p className="text-sm text-white-muted leading-relaxed mb-4">{patch.summary}</p>
        <div className="flex items-center gap-6 text-xs text-white-dim flex-wrap">
          <span>Autor: <span className="text-white">{author?.name}</span></span>
          {reviewer && <span>Revisor: <span className="text-white">{reviewer.name}</span></span>}
          <span>Deploy: <span className="text-white">{formatDateTime(patch.deployedAt)}</span></span>
          {patch.publishedAt && <span>Publicado: <span className="text-white">{formatDate(patch.publishedAt)}</span></span>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Technical notes */}
          <div className="glass-card p-6">
            <h2 className="text-sm font-semibold mb-4 uppercase tracking-wide text-white-muted">
              Notas Técnicas
            </h2>
            <div className="prose-invert text-sm leading-relaxed space-y-3 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:text-white [&_h3]:font-semibold [&_h3]:text-white [&_code]:font-mono [&_code]:text-red [&_code]:bg-surface-2 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_pre]:bg-surface-2 [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:border [&_pre]:border-black-border [&_blockquote]:border-l-2 [&_blockquote]:border-red [&_blockquote]:pl-4 [&_blockquote]:text-white-muted [&_table]:w-full [&_th]:text-left [&_th]:p-2 [&_th]:border-b [&_th]:border-black-border [&_td]:p-2 [&_td]:border-b [&_td]:border-border-50 [&_ul]:list-disc [&_ul]:pl-5 [&_a]:text-red">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{patch.technicalNotes}</ReactMarkdown>
            </div>
          </div>

          {/* Changed files */}
          {patch.githubFiles.length > 0 && (
            <div className="glass-card p-6">
              <button
                onClick={() => setFilesOpen(!filesOpen)}
                className="w-full flex items-center justify-between text-sm font-semibold uppercase tracking-wide text-white-muted"
              >
                Arquivos Alterados ({patch.githubFiles.length})
                <ChevronDown className={cn('w-4 h-4 transition-transform', filesOpen && 'rotate-180')} />
              </button>
              {filesOpen && (
                <div className="mt-4 space-y-2">
                  {patch.githubFiles.map((f) => {
                    const cfg = FILE_STATUS_ICON[f.status];
                    return (
                      <div
                        key={f.path}
                        className="flex items-center gap-3 p-3 rounded-lg bg-surface-2-60 border border-black-border"
                      >
                        <cfg.icon className="w-4 h-4 shrink-0" style={{ color: cfg.color }} />
                        <span className="font-mono text-xs flex-1 truncate">{f.path}</span>
                        <span className="text-[11px] font-mono text-green-500">+{f.additions}</span>
                        <span className="text-[11px] font-mono text-red">−{f.deletions}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Affected classes */}
          {patch.affectedClasses.length > 0 && (
            <div className="glass-card p-6">
              <h2 className="text-sm font-semibold mb-4 uppercase tracking-wide text-white-muted flex items-center gap-2">
                <Layers className="w-4 h-4 text-red" /> Classes Afetadas
              </h2>
              <div className="space-y-2">
                {patch.affectedClasses.map((c) => (
                  <a
                    key={c.className}
                    href={c.repoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 p-3 rounded-lg bg-surface-2-60 border border-black-border hover:border-red-40 transition-all group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-xs text-red font-semibold">{c.className}</p>
                      <p className="text-[11px] text-white-dim truncate">
                        {c.filePath}
                        {c.lineRange && `:${c.lineRange}`}
                      </p>
                      {c.description && <p className="text-[11px] text-white-muted mt-1">{c.description}</p>}
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-white-dim group-hover:text-red transition-colors shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Rollback */}
          {patch.rollbackPlan && (
            <div className="glass-card p-6 border-red-20">
              <h2 className="text-sm font-semibold mb-3 uppercase tracking-wide text-red flex items-center gap-2">
                <Undo2 className="w-4 h-4" /> Plano de Rollback
              </h2>
              <pre className="text-xs text-white-muted whitespace-pre-wrap font-sans leading-relaxed">
                {patch.rollbackPlan}
              </pre>
            </div>
          )}
        </div>

        {/* Sidebar column */}
        <div className="space-y-6">
          {/* GitHub */}
          {patch.githubRepo && (
            <div className="glass-card p-5">
              <h2 className="text-xs font-semibold mb-4 uppercase tracking-wide text-white-muted flex items-center gap-2">
                <Github className="w-4 h-4" /> GitHub
              </h2>
              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-2 text-white-muted">
                  <Github className="w-3.5 h-3.5 shrink-0" />
                  <span className="font-mono truncate">{patch.githubRepo}</span>
                </div>
                {patch.githubBranch && (
                  <div className="flex items-center gap-2 text-white-muted">
                    <GitBranch className="w-3.5 h-3.5 shrink-0" />
                    <span className="font-mono truncate">{patch.githubBranch}</span>
                  </div>
                )}
                {patch.githubCommitSha && (
                  <div className="flex items-center gap-2 text-white-muted">
                    <GitCommit className="w-3.5 h-3.5 shrink-0" />
                    <span className="font-mono">{patch.githubCommitSha}</span>
                  </div>
                )}
                {patch.githubPrUrl && (
                  <div className="flex items-center gap-2 text-white-muted">
                    <GitPullRequest className="w-3.5 h-3.5 shrink-0" />
                    <a href={patch.githubPrUrl} target="_blank" rel="noreferrer" className="text-red hover:underline truncate">
                      Pull Request
                    </a>
                  </div>
                )}
              </div>
              <a
                href={`https://github.com/${patch.githubRepo}`}
                target="_blank"
                rel="noreferrer"
                className="btn-secondary w-full flex items-center justify-center gap-2 mt-4"
              >
                Ver no GitHub <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {/* Impacted systems */}
          {patch.impactedSystems.length > 0 && (
            <div className="glass-card p-5">
              <h2 className="text-xs font-semibold mb-4 uppercase tracking-wide text-white-muted">
                Sistemas Impactados
              </h2>
              <div className="space-y-2">
                {patch.impactedSystems.map((s) => (
                  <div key={s} className="flex items-center gap-2 text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-red" />
                    {s}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Checklist */}
          <div className="glass-card p-5">
            <h2 className="text-xs font-semibold mb-4 uppercase tracking-wide text-white-muted">
              Checklist Pré-Deploy
            </h2>
            <div className="space-y-3">
              {patch.checklist.map((item) => (
                <div key={item.label} className="flex items-start gap-2.5 text-xs">
                  {item.checked ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-white-dim shrink-0" />
                  )}
                  <div>
                    <p className={cn(item.checked ? 'text-white' : 'text-white-dim')}>{item.label}</p>
                    {item.checkedBy && (
                      <p className="text-[10px] text-white-dim">por {item.checkedBy}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tags */}
          {patch.tags.length > 0 && (
            <div className="glass-card p-5">
              <h2 className="text-xs font-semibold mb-3 uppercase tracking-wide text-white-muted">Tags</h2>
              <div className="flex flex-wrap gap-1.5">
                {patch.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-black-surface-2 border border-black-border text-white-muted"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Time Sheet */}
          <TimeSheetPanel entityType="patch" entityId={patch.id} />
        </div>
      </div>
    </div>
  );
}
