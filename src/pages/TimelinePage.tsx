import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Flame, X, Github, Clock } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { PageHeader } from '@/components/shared/PageHeader';
import { ClassificationBadge } from '@/components/shared/ClassificationBadge';
import { StatusPill } from '@/components/shared/StatusPill';
import { EmptyState } from '@/components/shared/EmptyState';
import { cn, formatDate, formatDateTime, truncate } from '@/lib/utils';
import { getUser } from '@/lib/mockData';
import type { NotePatch } from '@/types';

export default function TimelinePage() {
  const { patches, classifications } = useAppStore();
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [selectedPatch, setSelectedPatch] = useState<NotePatch | null>(null);

  const sorted = useMemo(() => {
    let list = patches.filter((p) => p.status === 'published' || p.status === 'archived');
    if (activeFilters.length > 0) {
      list = list.filter((p) => activeFilters.includes(p.classificationId));
    }
    return [...list].sort((a, b) => b.deployedAt.getTime() - a.deployedAt.getTime());
  }, [patches, activeFilters]);

  const usedClassifications = useMemo(() => {
    const ids = new Set(patches.map((p) => p.classificationId));
    return classifications.filter((c) => ids.has(c.id));
  }, [patches, classifications]);

  const toggleFilter = (id: string) => {
    setActiveFilters((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  return (
    <div>
      <PageHeader
        title="Linha do Tempo"
        description="Histórico cronológico dos deploys em produção"
      />

      {/* Classification chips */}
      <div className="flex flex-wrap gap-2 mb-10">
        {usedClassifications.map((c) => {
          const active = activeFilters.includes(c.id);
          return (
            <button
              key={c.id}
              onClick={() => toggleFilter(c.id)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200',
                active ? 'text-white' : 'text-white-muted hover:text-white'
              )}
              style={{
                borderColor: active ? c.color : 'var(--color-border)',
                backgroundColor: active ? `${c.color}30` : 'transparent',
              }}
            >
              <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: c.color }} />
              {c.name}
            </button>
          );
        })}
        {activeFilters.length > 0 && (
          <button onClick={() => setActiveFilters([])} className="btn-ghost text-xs flex items-center gap-1">
            <X className="w-3 h-3" /> Limpar filtros
          </button>
        )}
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="Nenhum patch na timeline"
          description="Publique patches para vê-los aqui."
        />
      ) : (
        <div className="relative max-w-4xl mx-auto">
          {/* Vertical line */}
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-red via-black-border to-transparent md:-translate-x-px" />

          <div className="space-y-8">
            {sorted.map((p, i) => {
              const isLeft = i % 2 === 0;
              return (
                <div
                  key={p.id}
                  className={cn(
                    'relative flex md:items-center gap-4 animate-slide-up',
                    'flex-row',
                    isLeft ? 'md:flex-row' : 'md:flex-row-reverse'
                  )}
                  style={{ animationDelay: `${Math.min(i * 0.06, 0.5)}s` }}
                >
                  {/* Node */}
                  <div
                    className={cn(
                      'absolute left-4 md:left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 z-10',
                      p.isHotfix
                        ? 'bg-red-glow border-red-glow animate-pulse-red'
                        : 'bg-surface border-red'
                    )}
                  />

                  {/* Spacer for the other half */}
                  <div className="hidden md:block md:w-1/2" />

                  {/* Card */}
                  <div className={cn('flex-1 pl-12 md:pl-0', isLeft ? 'md:pr-10' : 'md:pl-10')}>
                    <button
                      onClick={() => setSelectedPatch(p)}
                      className={cn(
                        'w-full text-left glass-card p-4 red-accent-left hover:border-red-40 transition-all group',
                        p.isHotfix && 'shadow-red-glow'
                      )}
                    >
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="font-mono text-xs text-red font-semibold">{p.version}</span>
                        {p.isHotfix && <Flame className="w-3.5 h-3.5 text-red-glow" />}
                        <span className="text-[11px] text-white-dim ml-auto">{formatDate(p.deployedAt)}</span>
                      </div>
                      <h3 className="text-sm font-semibold mb-1 group-hover:text-red transition-colors">
                        {p.title}
                      </h3>
                      <p className="text-xs text-white-muted mb-3">{truncate(p.summary, 100)}</p>
                      <ClassificationBadge classificationId={p.classificationId} size="sm" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Drawer */}
      {selectedPatch && (
        <div
          className="fixed inset-0 z-50 bg-overlay backdrop-blur-sm animate-fade-in"
          onClick={() => setSelectedPatch(null)}
        >
          <div
            className="absolute right-0 top-0 h-full w-full max-w-md border-l border-black-border overflow-y-auto scrollbar-custom p-6 animate-slide-up"
            style={{ background: 'var(--color-surface)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <span className="font-mono text-sm text-red font-bold">{selectedPatch.version}</span>
              <button
                onClick={() => setSelectedPatch(null)}
                className="btn-ghost p-2"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <StatusPill status={selectedPatch.status} />
              <ClassificationBadge classificationId={selectedPatch.classificationId} />
              {selectedPatch.isHotfix && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-red-glow uppercase">
                  <Flame className="w-3 h-3" /> Hotfix
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold mb-3">{selectedPatch.title}</h2>
            <p className="text-sm text-white-muted leading-relaxed mb-6">{selectedPatch.summary}</p>

            <div className="space-y-3 text-xs mb-6">
              <div className="flex justify-between py-2 border-b border-black-border">
                <span className="text-white-dim">Autor</span>
                <span>{getUser(selectedPatch.authorId)?.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-black-border">
                <span className="text-white-dim">Deploy</span>
                <span>{formatDateTime(selectedPatch.deployedAt)}</span>
              </div>
              {selectedPatch.githubRepo && (
                <div className="flex justify-between py-2 border-b border-black-border">
                  <span className="text-white-dim flex items-center gap-1">
                    <Github className="w-3 h-3" /> Repo
                  </span>
                  <span className="font-mono">{selectedPatch.githubRepo}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-b border-black-border">
                <span className="text-white-dim">Sistemas</span>
                <span className="text-right">{selectedPatch.impactedSystems.join(', ') || '—'}</span>
              </div>
            </div>

            <Link
              to={`/patches/${selectedPatch.id}`}
              className="btn-primary w-full flex items-center justify-center"
            >
              Ver detalhes completos
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
