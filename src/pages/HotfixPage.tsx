import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Flame, Plus, X, Timer, TrendingDown, Activity, ArrowRight, FileWarning } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/store/appStore';
import { PageHeader } from '@/components/shared/PageHeader';
import { StatusPill } from '@/components/shared/StatusPill';
import { EmptyState } from '@/components/shared/EmptyState';
import { SkeletonList } from '@/components/shared/Skeleton';
import { Breadcrumb } from '@/components/shared/Breadcrumb';
import { Tooltip } from '@/components/shared/Tooltip';
import { TimeSheetPanel } from '@/components/shared/TimeSheetPanel';
import { HOTFIX_WORKFLOW_STEPS, HOTFIX_STATUS_CONFIG } from '@/lib/constants';
import { cn, formatRelative, formatDuration, getResolutionMinutes } from '@/lib/utils';
import { getUser } from '@/lib/mockData';
import type { Hotfix } from '@/types';

export default function HotfixPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { hotfixes, addHotfix, updateHotfix, addAuditLog, currentUser, loading } = useAppStore();
  const [formOpen, setFormOpen] = useState(false);
  const [severityFilter, setSeverityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setFormOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const filtered = useMemo(() => {
    return hotfixes.filter((h) => {
      if (severityFilter && h.severity !== severityFilter) return false;
      if (statusFilter && h.status !== statusFilter) return false;
      return true;
    });
  }, [hotfixes, severityFilter, statusFilter]);

  const stats = useMemo(() => {
    const resolved = hotfixes.filter((h) => h.resolutionTimeMinutes);
    const avgTime =
      resolved.length > 0
        ? Math.round(resolved.reduce((acc, h) => acc + (h.resolutionTimeMinutes ?? 0), 0) / resolved.length)
        : 0;
    const active = hotfixes.filter((h) => !['closed', 'validated'].includes(h.status)).length;
    return { total: hotfixes.length, active, avgTime };
  }, [hotfixes]);

  const advanceStatus = (h: Hotfix) => {
    const idx = HOTFIX_WORKFLOW_STEPS.indexOf(h.status);
    if (idx < HOTFIX_WORKFLOW_STEPS.length - 1) {
      const nextStatus = HOTFIX_WORKFLOW_STEPS[idx + 1];
      const updates: Partial<Hotfix> = { status: nextStatus };
      if (nextStatus === 'deployed') updates.deployedAt = new Date();
      if (nextStatus === 'closed') {
        updates.resolvedAt = new Date();
        updates.resolvedBy = currentUser.id;
        updates.resolutionTimeMinutes = getResolutionMinutes(h.reportedAt);
      }
      updateHotfix(h.id, updates);
      toast.success(`Hotfix movido para: ${HOTFIX_STATUS_CONFIG[nextStatus].label}`);
    }
  };

  return (
    <div>
      <PageHeader
        title="Hotfix de Emergência"
        description="Correções críticas em produção com SLA tracking"
        actions={
          <button
            onClick={() => setFormOpen(true)}
            className="btn-primary flex items-center gap-2 shadow-red-glow"
          >
            <Flame className="w-4 h-4" /> Registrar Hotfix
          </button>
        }
      />

      {/* Tabs Histórico */}
      <div className="flex gap-1 mb-6 border-b border-black-border">
        <Link to="/history/hotfix" className="px-4 py-2 text-sm font-medium text-red border-b-2 border-red">
          🔥 Hotfix
        </Link>
        <Link
          to="/history/audit"
          className="px-4 py-2 text-sm font-medium text-white-muted hover:text-white transition-colors"
        >
          Auditoria
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 animate-stagger">
        <div className="glass-card p-5 red-accent-left">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-white-muted uppercase tracking-wide">Total de Hotfixes</span>
            <Activity className="w-4 h-4 text-red" />
          </div>
          <p className="text-3xl font-bold">{stats.total}</p>
        </div>
        <div className={cn('glass-card p-5 red-accent-left', stats.active > 0 && 'shadow-red-glow')}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-white-muted uppercase tracking-wide">Ativos Agora</span>
            <Flame className="w-4 h-4 text-red-glow" />
          </div>
          <p className="text-3xl font-bold text-red-glow">{stats.active}</p>
        </div>
        <div className="glass-card p-5 red-accent-left">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-white-muted uppercase tracking-wide">Tempo Médio Resolução</span>
            <TrendingDown className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-3xl font-bold">{formatDuration(stats.avgTime)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} className="input-base w-44">
          <option value="">Todas severidades</option>
          <option value="critical">Crítica</option>
          <option value="high">Alta</option>
          <option value="medium">Média</option>
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-base w-44">
          <option value="">Todos status</option>
          {HOTFIX_WORKFLOW_STEPS.map((s) => (
            <option key={s} value={s}>
              {HOTFIX_STATUS_CONFIG[s].label}
            </option>
          ))}
        </select>
      </div>

      <Breadcrumb items={[{ label: 'Hotfixes' }]} />

      {/* List */}
      {loading ? (
        <SkeletonList count={5} />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Flame} title="Nenhum hotfix encontrado" description="Sem hotfixes com os filtros atuais." />
      ) : (
        <div className="space-y-4 animate-stagger">
          {filtered.map((h) => {
            const isActive = !['closed', 'validated'].includes(h.status);
            const elapsed = getResolutionMinutes(h.reportedAt, h.resolvedAt);
            const stepIdx = HOTFIX_WORKFLOW_STEPS.indexOf(h.status);
            return (
              <div
                key={h.id}
                className={cn(
                  'glass-card p-5',
                  h.severity === 'critical' && isActive
                    ? 'border-red-glow/40 shadow-red-glow'
                    : 'red-accent-left'
                )}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Flame className={cn('w-4 h-4', isActive ? 'text-red-glow' : 'text-white-dim')} />
                    <h3 className="text-sm font-semibold">{h.title}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPill status={h.severity} variant="severity" />
                    <StatusPill status={h.status} variant="hotfix" />
                  </div>
                </div>

                <p className="text-xs text-white-muted mb-4">{h.description}</p>

                {/* Workflow progress */}
                <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1">
                  {HOTFIX_WORKFLOW_STEPS.map((s, i) => (
                    <div key={s} className="flex items-center gap-1 shrink-0">
                      <div
                        className={cn(
                          'px-2 py-1 rounded text-[9px] font-medium uppercase tracking-wide',
                          i <= stepIdx
                            ? 'bg-red-soft text-red border border-red-30'
                            : 'bg-black-surface-2 text-white-dim border border-black-border'
                        )}
                      >
                        {HOTFIX_STATUS_CONFIG[s].label}
                      </div>
                      {i < HOTFIX_WORKFLOW_STEPS.length - 1 && (
                        <ArrowRight className="w-3 h-3 text-white-dim" />
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between gap-4 flex-wrap text-xs">
                  <div className="flex items-center gap-4 text-white-dim flex-wrap">
                    <span>Sistema: <span className="text-white">{h.affectedSystem}</span></span>
                    <span>Por: <span className="text-white">{getUser(h.reportedBy)?.name}</span></span>
                    <span>{formatRelative(h.reportedAt)}</span>
                    <span className={cn('flex items-center gap-1 font-mono', isActive ? 'text-red-glow' : 'text-green-500')}>
                      <Timer className="w-3 h-3" />
                      {formatDuration(elapsed)}
                      {isActive && ' (em andamento)'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {h.postMortemNeeded && !h.postMortemDone && (
                      <span className="flex items-center gap-1 text-[10px] text-amber-500">
                        <FileWarning className="w-3 h-3" /> Post-mortem pendente
                      </span>
                    )}
                    {h.patchId && (
                      <Link to={`/patches/${h.patchId}`} className="text-red hover:underline text-[11px]">
                        Ver Note Patch →
                      </Link>
                    )}
                    {isActive && (
                      <button onClick={() => advanceStatus(h)} className="btn-secondary text-xs py-1.5">
                        Avançar status
                      </button>
                    )}
                  </div>
                </div>

                {/* Time Sheet */}
                <div className="mt-4 pt-4 border-t border-black-border">
                  <TimeSheetPanel entityType="hotfix" entityId={h.id} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick form modal */}
      {formOpen && (
        <HotfixQuickForm
          onClose={() => setFormOpen(false)}
          onSubmit={(hotfix) => {
            addHotfix(hotfix);
            addAuditLog({
              userId: currentUser.id,
              userName: currentUser.name,
              action: 'create',
              entity: 'hotfix',
              entityId: hotfix.id,
              details: { severity: hotfix.severity },
            });
            setFormOpen(false);
            toast.success('Hotfix registrado! Timer de SLA iniciado.', {
              description: 'Complete a documentação completa quando o incidente for resolvido.',
            });
          }}
        />
      )}
    </div>
  );
}

function HotfixQuickForm({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (h: Hotfix) => void;
}) {
  const currentUser = useAppStore((s) => s.currentUser);
  const [form, setForm] = useState({
    title: '',
    severity: 'critical' as Hotfix['severity'],
    affectedSystem: '',
    description: '',
    commitSha: '',
  });

  const submit = () => {
    if (!form.title.trim() || !form.affectedSystem.trim() || !form.description.trim()) {
      toast.error('Preencha título, sistema e descrição');
      return;
    }
    onSubmit({
      id: `h${Date.now()}`,
      title: form.title,
      severity: form.severity,
      affectedSystem: form.affectedSystem,
      description: form.description,
      commitSha: form.commitSha || undefined,
      status: 'reported',
      reportedBy: currentUser.id,
      reportedAt: new Date(),
      postMortemNeeded: form.severity === 'critical',
      postMortemDone: false,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-overlay backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg glass-card p-6 shadow-red-glow-lg animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Flame className="w-5 h-5 text-red-glow" /> Hotfix de Emergência
          </h2>
          <button onClick={onClose} className="btn-ghost p-2" aria-label="Fechar">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-white-muted mb-5">
          Formulário rápido — campos mínimos. Complete a documentação depois.
        </p>

        <div className="space-y-4">
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Título do incidente *"
            className="input-base"
            autoFocus
          />
          <div className="grid grid-cols-2 gap-3">
            <select
              value={form.severity}
              onChange={(e) => setForm({ ...form, severity: e.target.value as Hotfix['severity'] })}
              className="input-base"
            >
              <option value="critical">🔴 Crítica</option>
              <option value="high">🟠 Alta</option>
              <option value="medium">🟡 Média</option>
            </select>
            <input
              value={form.affectedSystem}
              onChange={(e) => setForm({ ...form, affectedSystem: e.target.value })}
              placeholder="Sistema afetado *"
              className="input-base"
            />
          </div>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Descrição do problema *"
            rows={3}
            className="input-base resize-none"
          />
          <input
            value={form.commitSha}
            onChange={(e) => setForm({ ...form, commitSha: e.target.value })}
            placeholder="Commit SHA da correção (se houver)"
            className="input-base font-mono"
          />
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="btn-secondary">
            Cancelar
          </button>
          <button onClick={submit} className="btn-primary flex items-center gap-2 shadow-red-glow">
            <Plus className="w-4 h-4" /> Registrar
          </button>
        </div>
      </div>
    </div>
  );
}
