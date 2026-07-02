import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  LayoutGrid,
  List,
  Plus,
  Github,
  Flame,
  Star,
  ClipboardList,
  X,
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { PageHeader } from '@/components/shared/PageHeader';
import { ClassificationBadge } from '@/components/shared/ClassificationBadge';
import { StatusPill } from '@/components/shared/StatusPill';
import { EmptyState } from '@/components/shared/EmptyState';
import { cn, formatDate, truncate } from '@/lib/utils';
import { getUser } from '@/lib/mockData';
import type { NotePatch } from '@/types';

type ViewMode = 'grid' | 'list';

export default function PatchesPage() {
  const navigate = useNavigate();
  const { patches, classifications, toggleFavorite } = useAppStore();
  const [query, setQuery] = useState('');
  const [classFilter, setClassFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [view, setView] = useState<ViewMode>('grid');

  const filtered = useMemo(() => {
    return patches.filter((p) => {
      if (classFilter && p.classificationId !== classFilter) return false;
      if (statusFilter && p.status !== statusFilter) return false;
      if (query) {
        const q = query.toLowerCase();
        const matches =
          p.title.toLowerCase().includes(q) ||
          p.summary.toLowerCase().includes(q) ||
          p.version.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [patches, query, classFilter, statusFilter]);

  const hasFilters = query || classFilter || statusFilter;

  return (
    <div>
      <PageHeader
        title="Note Patches"
        description={`${filtered.length} de ${patches.length} patches`}
        actions={
          <button onClick={() => navigate('/patches/new')} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Novo Patch
          </button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white-dim" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por título, versão, tag..."
            className="input-base pl-10"
          />
        </div>
        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="input-base lg:w-52"
        >
          <option value="">Todas as classificações</option>
          {classifications.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-base lg:w-44"
        >
          <option value="">Todos os status</option>
          <option value="draft">Rascunho</option>
          <option value="in_review">Em Revisão</option>
          <option value="approved">Aprovado</option>
          <option value="published">Publicado</option>
          <option value="archived">Arquivado</option>
        </select>
        {hasFilters && (
          <button
            onClick={() => {
              setQuery('');
              setClassFilter('');
              setStatusFilter('');
            }}
            className="btn-ghost flex items-center gap-1"
          >
            <X className="w-4 h-4" /> Limpar
          </button>
        )}
        <div className="flex rounded-lg border border-black-border overflow-hidden shrink-0">
          <button
            onClick={() => setView('grid')}
            className={cn('p-2.5 transition-all', view === 'grid' ? 'bg-red text-[#FFFFFF]' : 'text-white-muted hover:text-white')}
            aria-label="Visualização em grid"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView('list')}
            className={cn('p-2.5 transition-all', view === 'list' ? 'bg-red text-[#FFFFFF]' : 'text-white-muted hover:text-white')}
            aria-label="Visualização em lista"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Nenhum patch encontrado"
          description={hasFilters ? 'Tente ajustar os filtros de busca.' : 'Cadastre o primeiro note patch para começar.'}
          action={
            <button onClick={() => navigate('/patches/new')} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Novo Patch
            </button>
          }
        />
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 animate-stagger">
          {filtered.map((p) => (
            <PatchCard key={p.id} patch={p} onFavorite={() => toggleFavorite(p.id)} />
          ))}
        </div>
      ) : (
        <div className="glass-card divide-y divide-black-border animate-fade-in">
          {filtered.map((p) => (
            <Link
              key={p.id}
              to={`/patches/${p.id}`}
              className="flex items-center gap-4 px-4 py-3 hover:bg-hover transition-all"
            >
              {p.isHotfix && <Flame className="w-4 h-4 text-red-glow shrink-0" />}
              <span className="font-mono text-xs text-red font-semibold w-24 shrink-0">{p.version}</span>
              <span className="text-sm flex-1 truncate">{p.title}</span>
              <ClassificationBadge classificationId={p.classificationId} size="sm" />
              <StatusPill status={p.status} />
              <span className="text-[11px] text-white-dim w-20 text-right shrink-0">
                {formatDate(p.deployedAt)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function PatchCard({ patch, onFavorite }: { patch: NotePatch; onFavorite: () => void }) {
  const author = getUser(patch.authorId);

  return (
    <Link
      to={`/patches/${patch.id}`}
      className={cn(
        'glass-card p-5 red-accent-left hover:border-red-40 transition-all duration-200 group flex flex-col gap-3',
        patch.isHotfix && 'shadow-red-glow'
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs text-red font-semibold">{patch.version}</span>
        <div className="flex items-center gap-2">
          {patch.isHotfix && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-red-glow uppercase">
              <Flame className="w-3 h-3" /> Hotfix
            </span>
          )}
          <button
            onClick={(e) => {
              e.preventDefault();
              onFavorite();
            }}
            className="text-white-dim hover:text-red transition-colors"
            aria-label="Favoritar"
          >
            <Star className={cn('w-4 h-4', patch.favorite && 'fill-red text-red')} />
          </button>
        </div>
      </div>

      <h3 className="text-sm font-semibold leading-snug group-hover:text-red transition-colors">
        {patch.title}
      </h3>
      <p className="text-xs text-white-muted leading-relaxed">{truncate(patch.summary, 120)}</p>

      <div className="flex flex-wrap gap-1.5">
        {patch.tags.map((tag) => (
          <span
            key={tag}
            className="text-[10px] px-2 py-0.5 rounded-full bg-black-surface-2 border border-black-border text-white-muted"
          >
            #{tag}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between mt-auto pt-3 border-t border-black-border">
        <div className="flex items-center gap-2">
          <ClassificationBadge classificationId={patch.classificationId} size="sm" />
          <StatusPill status={patch.status} />
        </div>
        {patch.githubRepo && <Github className="w-3.5 h-3.5 text-white-dim" />}
      </div>

      <div className="flex items-center justify-between text-[11px] text-white-dim">
        <span>{author?.name}</span>
        <span>{formatDate(patch.deployedAt)}</span>
      </div>
    </Link>
  );
}
