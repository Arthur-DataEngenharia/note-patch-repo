import { Link } from 'react-router-dom';
import { Archive, Briefcase, Flame, CheckCircle2, Clock, User } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { PageHeader } from '@/components/shared/PageHeader';
import { Breadcrumb } from '@/components/shared/Breadcrumb';
import { cn, formatDate } from '@/lib/utils';

export default function HistoryPage() {
  const { projects, patches, hotfixes, users, currentUser } = useAppStore();
  const isManager = currentUser.role === 'gerente' || currentUser.role === 'supervisor' || currentUser.role === 'admin';

  if (!isManager) {
    return (
      <div className="text-center py-16 animate-fade-in">
        <p className="text-white-muted mb-4">Acesso restrito a Gerentes e Supervisores.</p>
        <Link to="/dashboard" className="btn-primary">Voltar</Link>
      </div>
    );
  }

  const completedProjects = projects.filter((p) => p.status === 'concluido');
  const archivedPatches = patches.filter((p) => p.status === 'archived');
  const closedHotfixes = hotfixes.filter((h) => h.status === 'closed');

  return (
    <div className="animate-fade-in">
      <Breadcrumb items={[{ label: 'Historico' }]} />
      <PageHeader
        title="Historico Completo"
        subtitle="Projetos concluidos, patches arquivados e hotfixes fechados"
      />

      {/* Completed Projects */}
      <div className="mt-6">
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-green-500" />
          Projetos Concluidos ({completedProjects.length})
        </h2>
        {completedProjects.length === 0 ? (
          <p className="text-xs text-white-dim">Nenhum projeto concluido.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {completedProjects.map((p) => (
              <Link
                key={p.id}
                to={`/projects/${p.id}`}
                className="glass-card p-4 hover:border-green-500/30 transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  {p.type === 'hotfix_emergencial' ? (
                    <Flame className="w-3.5 h-3.5 text-red" />
                  ) : (
                    <Briefcase className="w-3.5 h-3.5 text-blue-400" />
                  )}
                  <span className="text-[10px] uppercase text-white-dim">{p.type === 'hotfix_emergencial' ? 'Hotfix' : 'Patch'}</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500 ml-auto" />
                </div>
                <h3 className="text-xs font-medium mb-2">{p.title}</h3>
                <div className="flex items-center gap-3 text-[10px] text-white-dim">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(p.targetDate)}</span>
                  <span className="flex items-center gap-1"><User className="w-3 h-3" />{p.stages.length} etapas</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Archived Patches */}
      <div className="mt-8">
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Archive className="w-4 h-4 text-white-dim" />
          Patches Arquivados ({archivedPatches.length})
        </h2>
        {archivedPatches.length === 0 ? (
          <p className="text-xs text-white-dim">Nenhum patch arquivado.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {archivedPatches.map((p) => (
              <Link key={p.id} to={`/patches/${p.id}`} className="glass-card p-4 hover:border-white-dim transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-[10px] text-red">{p.version}</span>
                  <span className="text-[10px] text-white-dim ml-auto">{formatDate(p.createdAt)}</span>
                </div>
                <h3 className="text-xs font-medium">{p.title}</h3>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Closed Hotfixes */}
      <div className="mt-8">
        <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Flame className="w-4 h-4 text-amber-500" />
          Hotfixes Fechados ({closedHotfixes.length})
        </h2>
        {closedHotfixes.length === 0 ? (
          <p className="text-xs text-white-dim">Nenhum hotfix fechado.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {closedHotfixes.map((h) => (
              <div key={h.id} className="glass-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] uppercase font-medium px-1.5 py-0.5 rounded bg-green-500/10 text-green-500 border border-green-500/20">
                    {h.severity}
                  </span>
                  <span className="text-[10px] text-white-dim ml-auto">{formatDate(h.reportedAt)}</span>
                </div>
                <h3 className="text-xs font-medium">{h.title}</h3>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
