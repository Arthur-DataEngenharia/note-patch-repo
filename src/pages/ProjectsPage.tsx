import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Calendar as CalendarIcon, Users, Clock, Briefcase, Flame, AlertTriangle, LayoutGrid, ChevronLeft, ChevronRight } from 'lucide-react';
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

const MONTH_NAMES = ['Janeiro','Fevereiro','Marco','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function getDaysInMonth(year: number, month: number) {
  const date = new Date(year, month, 1);
  const days: Date[] = [];
  while (date.getMonth() === month) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
}

function getMonthGrid(year: number, month: number) {
  const days = getDaysInMonth(year, month);
  const firstDay = days[0].getDay();
  const grid: (Date | null)[] = Array(firstDay).fill(null);
  grid.push(...days);
  while (grid.length % 7 !== 0) grid.push(null);
  return grid;
}

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
          <CalendarIcon className="w-3 h-3" />
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

function KanbanView({ visibleProjects }: { visibleProjects: Project[] }) {
  const columns = useMemo(() => {
    return COLUMNS.map((col) => ({
      ...col,
      projects: visibleProjects.filter((p) => p.status === col.key),
    }));
  }, [visibleProjects]);

  return (
    <div className="overflow-x-auto pb-3 px-1" style={{
      scrollbarWidth: 'thin',
      scrollbarColor: '#333 transparent',
    }}>
      <style>{`
        .kanban-scroll::-webkit-scrollbar { height: 6px; }
        .kanban-scroll::-webkit-scrollbar-track { background: transparent; }
        .kanban-scroll::-webkit-scrollbar-thumb { background: #333; border-radius: 999px; }
        .kanban-scroll::-webkit-scrollbar-thumb:hover { background: #555; }
        .kanban-scroll::-webkit-scrollbar-corner { background: transparent; }
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
  );
}

function CalendarView({ visibleProjects }: { visibleProjects: Project[] }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const grid = useMemo(() => getMonthGrid(year, month), [year, month]);
  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < grid.length; i += 7) {
    weeks.push(grid.slice(i, i + 7));
  }

  const projectsByDate = useMemo(() => {
    const map: Record<string, typeof visibleProjects> = {};
    for (const p of visibleProjects) {
      const d = new Date(p.targetDate);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map[key]) map[key] = [];
      map[key].push(p);
    }
    return map;
  }, [visibleProjects]);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-1.5 rounded-lg bg-black-surface-2 border border-black-border hover:border-white-dim transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold min-w-[140px] text-center">
            {MONTH_NAMES[month]} {year}
          </span>
          <button onClick={nextMonth} className="p-1.5 rounded-lg bg-black-surface-2 border border-black-border hover:border-white-dim transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="glass-card p-4">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Dom','Seg','Ter','Qua','Qui','Sex','Sab'].map((d) => (
            <div key={d} className="text-center text-[10px] text-white-dim uppercase font-medium py-1">{d}</div>
          ))}
        </div>
        <div className="space-y-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-1">
              {week.map((day, di) => {
                if (!day) return <div key={di} className="min-h-[80px] rounded-lg" />;
                const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
                const dayProjects = projectsByDate[key] || [];
                const isToday = day.toDateString() === today.toDateString();

                return (
                  <div
                    key={di}
                    className={cn(
                      'min-h-[80px] rounded-lg border p-1.5 transition-colors',
                      isToday
                        ? 'border-red bg-red/5'
                        : 'border-black-border hover:border-white-dim'
                    )}
                  >
                    <span className={cn('text-[10px] font-medium', isToday ? 'text-red' : 'text-white-dim')}>
                      {day.getDate()}
                    </span>
                    <div className="mt-1 space-y-0.5">
                      {dayProjects.slice(0, 3).map((p) => (
                        <Link
                          key={p.id}
                          to={`/projects/${p.id}`}
                          className={cn(
                            'block text-[9px] px-1.5 py-0.5 rounded truncate',
                            p.type === 'hotfix_emergencial'
                              ? 'bg-red/10 text-red border border-red/20'
                              : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          )}
                          title={p.title}
                        >
                          {p.title}
                        </Link>
                      ))}
                      {dayProjects.length > 3 && (
                        <span className="text-[9px] text-white-dim px-1.5">+{dayProjects.length - 3}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  const { projects, getProjectsForUser, currentUser } = useAppStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'my'>('all');
  const [activeTab, setActiveTab] = useState<'kanban' | 'calendar'>('kanban');

  const visibleProjects = filter === 'my' ? getProjectsForUser() : projects;
  const canCreate = currentUser.role === 'gerente' || currentUser.role === 'supervisor' || currentUser.role === 'admin';

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

      {/* Tabs */}
      <div className="mt-4 flex items-center gap-1 border-b border-black-border">
        <button
          onClick={() => setActiveTab('kanban')}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 text-xs font-medium transition-colors border-b-2 -mb-[1px]',
            activeTab === 'kanban'
              ? 'text-red border-red'
              : 'text-white-dim border-transparent hover:text-white'
          )}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          Kanban
        </button>
        <button
          onClick={() => setActiveTab('calendar')}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 text-xs font-medium transition-colors border-b-2 -mb-[1px]',
            activeTab === 'calendar'
              ? 'text-red border-red'
              : 'text-white-dim border-transparent hover:text-white'
          )}
        >
          <CalendarIcon className="w-3.5 h-3.5" />
          Calendario
        </button>
      </div>

      <div className="mt-4">
        {activeTab === 'kanban' ? (
          <KanbanView visibleProjects={visibleProjects} />
        ) : (
          <CalendarView visibleProjects={visibleProjects} />
        )}
      </div>

      {modalOpen && <CreateProjectModal onClose={() => setModalOpen(false)} />}
    </div>
  );
}
