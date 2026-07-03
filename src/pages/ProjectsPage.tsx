import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Calendar, Users, Clock, Briefcase, Flame, AlertTriangle } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { PageHeader } from '@/components/shared/PageHeader';
import { Breadcrumb } from '@/components/shared/Breadcrumb';
import { CreateProjectModal } from '@/components/projects/CreateProjectModal';
import { cn, formatDate } from '@/lib/utils';
import type { Project } from '@/types';

const COLUMNS = [
  { key: 'draft', label: 'Rascunho', color: '#6B7280' },
  { key: 'em_processo', label: 'Em Processo', color: '#3B82F6' },
  { key: 'desenvolvimento', label: 'Desenvolvimento', color: '#8B5CF6' },
  { key: 'qa', label: 'QA', color: '#F59E0B' },
  { key: 'hotfix', label: 'Hotfix', color: '#EF4444' },
  { key: 'publicado', label: 'Publicado', color: '#22C55E' },
  { key: 'concluido', label: 'Concluido', color: '#10B981' },
] as const;

const STAGE_LABELS: Record<string, string> = {
  processo: 'Processo',
  desenvolvimento: 'Dev',
  qa: 'QA',
  hotfix: 'Hotfix',
};

function ProjectCard({ project }: { project: Project }) {
  const { users } = useAppStore();
  const isOverdue = new Date(project.targetDate) < new Date() && project.status !== 'concluido';

  const processo = users.find((u) => u.id === project.processoId);
  const dev = users.find((u) => u.id === project.devId);
  const qa = users.find((u) => u.id === project.qaId);

  return (
    <Link
      to={`/projects/${project.id}`}
      className="block p-3 rounded-lg bg-black-surface-2 border border-black-border hover:border-red-30 transition-all group animate-fade-in-up"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          {project.type === 'hotfix_emergencial' ? (
            <Flame className="w-3.5 h-3.5 text-red" />
          ) : (
            <Briefcase className="w-3.5 h-3.5 text-blue-400" />
          )}
          <span className="text-[10px] uppercase font-medium text-white-dim">
            {project.type === 'hotfix_emergencial' ? 'Hotfix' : 'Patch'}
          </span>
        </div>
        {isOverdue && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
      </div>

      <h4 className="text-xs font-medium mb-2 group-hover:text-red transition-colors line-clamp-2">
        {project.title}
      </h4>

      <div className="flex items-center gap-3 text-[10px] text-white-dim mb-2">
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {formatDate(project.targetDate)}
        </span>
        {project.stages.length > 0 && (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {project.stages.length} etapas
          </span>
        )}
      </div>

      {project.currentStage && (
        <div className="text-[10px] mb-2">
          <span className="text-white-dim">Vez de: </span>
          <span className="text-red font-medium">{STAGE_LABELS[project.currentStage] || project.currentStage}</span>
        </div>
      )}

      {/* Assigned users */}
      <div className="flex items-center gap-1">
        {[processo, dev, qa].filter(Boolean).map((u, i) => (
          <div
            key={i}
            className="w-5 h-5 rounded-full bg-red/20 text-red text-[8px] flex items-center justify-center border border-red/30"
            title={u?.name}
          >
            {u?.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
          </div>
        ))}
      </div>
    </Link>
  );
}

export default function ProjectsPage() {
  const { projects, getProjectsForUser, currentUser } = useAppStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'my'>('all');

  const visibleProjects = filter === 'my' ? getProjectsForUser() : projects;
  const canCreate = currentUser.role === 'gerente' || currentUser.role === 'supervisor' || currentUser.role === 'admin';

  const columns = useMemo(() => {
    return COLUMNS.map((col) => ({
      ...col,
      projects: visibleProjects.filter((p) => p.status === col.key),
    }));
  }, [visibleProjects]);

  return (
    <div className="animate-fade-in">
      <Breadcrumb items={[{ label: 'Projetos' }]} />
      <PageHeader
        title="Projetos"
        subtitle="Kanban de projetos e workflow"
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-black-surface-2 rounded-lg border border-black-border p-0.5">
              <button
                onClick={() => setFilter('all')}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs transition-colors',
                  filter === 'all' ? 'bg-red-soft text-red' : 'text-white-dim hover:text-white'
                )}
              >
                Todos
              </button>
              <button
                onClick={() => setFilter('my')}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs transition-colors',
                  filter === 'my' ? 'bg-red-soft text-red' : 'text-white-dim hover:text-white'
                )}
              >
                Meus
              </button>
            </div>
            {canCreate && (
              <button onClick={() => setModalOpen(true)} className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Novo Projeto
              </button>
            )}
          </div>
        }
      />

      <div className="mt-6 overflow-x-auto pb-3 px-1" style={{
        scrollbarWidth: 'thin',
        scrollbarColor: '#333 transparent',
      }}>
        <style>{`
          .kanban-scroll::-webkit-scrollbar {
            height: 6px;
          }
          .kanban-scroll::-webkit-scrollbar-track {
            background: transparent;
          }
          .kanban-scroll::-webkit-scrollbar-thumb {
            background: #333;
            border-radius: 999px;
          }
          .kanban-scroll::-webkit-scrollbar-thumb:hover {
            background: #555;
          }
          .kanban-scroll::-webkit-scrollbar-corner {
            background: transparent;
          }
        `}</style>
        <div className="kanban-scroll flex gap-4 min-w-max">
          {columns.map((col) => (
            <div key={col.key} className="w-64 flex-shrink-0">
              <div className="flex items-center gap-2 mb-3 px-1">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }} />
                <h3 className="text-xs font-semibold">{col.label}</h3>
                <span className="text-[10px] text-white-dim ml-auto">{col.projects.length}</span>
              </div>
              <div className="space-y-2">
                {col.projects.map((p) => (
                  <ProjectCard key={p.id} project={p} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {modalOpen && <CreateProjectModal onClose={() => setModalOpen(false)} />}
    </div>
  );
}
