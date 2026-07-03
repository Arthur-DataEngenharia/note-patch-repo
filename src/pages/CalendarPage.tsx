import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Briefcase, Flame } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { Breadcrumb } from '@/components/shared/Breadcrumb';
import { cn } from '@/lib/utils';

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

const MONTH_NAMES = ['Janeiro','Fevereiro','Marco','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

export default function CalendarPage() {
  const { projects, getProjectsForUser } = useAppStore();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const visibleProjects = getProjectsForUser();

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
      <Breadcrumb items={[{ label: 'Calendario' }]} />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Calendario de Projetos</h1>
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
