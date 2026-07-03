import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Lock, Filter, BarChart3, User, Briefcase, Layers, Wand2,
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { PageHeader } from '@/components/shared/PageHeader';
import { Breadcrumb } from '@/components/shared/Breadcrumb';
import { cn } from '@/lib/utils';
import {
  format, startOfMonth, endOfMonth, isWeekend, parseISO,
  startOfYear, endOfYear, subMonths,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getHolidays } from '@/components/hours/holidays';
import ResumoTab from '@/components/hours/ResumoTab';
import UsuariosTab from '@/components/hours/UsuariosTab';
import ProjetosTab from '@/components/hours/ProjetosTab';
import TotaisTab from '@/components/hours/TotaisTab';
import UserDetailView from '@/components/hours/UserDetailView';

function countWorkingDays(start: Date, end: Date): number {
  let count = 0;
  const holidays = new Set<string>();
  for (let y = start.getFullYear(); y <= end.getFullYear(); y++) getHolidays(y).forEach((h) => holidays.add(h));
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    if (!isWeekend(d) && !holidays.has(format(d, 'yyyy-MM-dd'))) count++;
  }
  return count;
}

const CLT_HOURS_PER_DAY = 8;

export default function HoursDashboardPage() {
  const { timeEntries, users, projects, patches, hotfixes, currentUser, generateDemoTimeEntries } = useAppStore();
  const isManager = currentUser.role === 'gerente' || currentUser.role === 'supervisor' || currentUser.role === 'admin';

  const [tab, setTab] = useState<'resumo' | 'usuarios' | 'projetos' | 'totais'>('resumo');
  const [periodMode, setPeriodMode] = useState<'current_month' | 'last_month' | 'last_3months' | 'year' | 'custom'>('current_month');
  const [customMonth, setCustomMonth] = useState(() => format(new Date(), 'yyyy-MM'));

  const now = new Date();
  const selectedMonth = parseISO(customMonth + '-01');

  const periodLabel = useMemo(() => {
    if (periodMode === 'current_month') return format(now, "MMMM 'de' yyyy", { locale: ptBR });
    if (periodMode === 'last_month') return format(subMonths(now, 1), "MMMM 'de' yyyy", { locale: ptBR });
    if (periodMode === 'last_3months') return `Últimos 3 meses`;
    if (periodMode === 'custom') return format(selectedMonth, "MMMM 'de' yyyy", { locale: ptBR });
    return format(now, 'yyyy');
  }, [periodMode, selectedMonth, now]);

  const { start, end } = useMemo(() => {
    if (periodMode === 'current_month') {
      return { start: startOfMonth(now), end: endOfMonth(now) };
    }
    if (periodMode === 'last_month') {
      const last = subMonths(now, 1);
      return { start: startOfMonth(last), end: endOfMonth(last) };
    }
    if (periodMode === 'last_3months') {
      return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) };
    }
    if (periodMode === 'custom') {
      return { start: startOfMonth(selectedMonth), end: endOfMonth(selectedMonth) };
    }
    return { start: startOfYear(now), end: endOfYear(now) };
  }, [periodMode, selectedMonth, now]);

  const filteredEntries = useMemo(() => timeEntries.filter((t) => t.date >= start && t.date <= end), [timeEntries, start, end]);
  const workingDays = countWorkingDays(start, end);
  const expectedHours = workingDays * CLT_HOURS_PER_DAY;

  if (!isManager) {
    return (
      <div className="animate-fade-in">
        <Breadcrumb items={[{ label: 'Minhas Horas' }]} />
        <PageHeader title="Minhas Horas" subtitle="Apontamentos e métricas do período" />
        <UserDetailView
          userId={currentUser.id} userName={currentUser.name} entries={timeEntries}
          projects={projects} patches={patches} hotfixes={hotfixes}
          start={start} end={end} workingDays={workingDays} expectedHours={expectedHours}
        />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <Breadcrumb items={[{ label: 'Dashboard de Horas' }]} />
      <PageHeader
        title="Dashboard de Horas"
        subtitle="Métricas de produtividade e apontamento de horas"
        action={
          <div className="flex items-center gap-2">
            {isManager && (
              <button
                onClick={generateDemoTimeEntries}
                className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
                title="Gerar dados de exemplo para testar o dashboard"
              >
                <Wand2 className="w-3.5 h-3.5" />
                Dados de Exemplo
              </button>
            )}
            <Filter className="w-3.5 h-3.5 text-white-dim" />
            <select
              value={periodMode}
              onChange={(e) => setPeriodMode(e.target.value as any)}
              className="input-base text-xs py-1.5 px-3 appearance-none cursor-pointer"
              style={{ colorScheme: 'dark' }}
            >
              <option value="current_month">Mês atual</option>
              <option value="last_month">Mês anterior</option>
              <option value="last_3months">Últimos 3 meses</option>
              <option value="year">Ano inteiro</option>
              <option value="custom">Selecionar mês...</option>
            </select>
            {periodMode === 'custom' && (
              <input type="month" value={customMonth} onChange={(e) => setCustomMonth(e.target.value)}
                className="input-base text-xs py-1.5 px-3" style={{ colorScheme: 'dark' }} />
            )}
          </div>
        }
      />

      <div className="mt-4 flex items-center gap-2">
        <span className="text-[10px] text-white-dim uppercase">Período:</span>
        <span className="text-xs font-medium bg-red/10 text-red px-2 py-0.5 rounded-full border border-red/20 capitalize">
          {periodLabel}
        </span>
        <span className="text-[10px] text-white-dim">{workingDays} dias úteis • {expectedHours}h esperadas (CLT)</span>
      </div>

      <div className="mt-4 flex items-center gap-1 border-b border-black-border">
        {[
          { key: 'resumo', label: 'Resumo', icon: BarChart3 },
          { key: 'usuarios', label: 'Por Usuário', icon: User },
          { key: 'projetos', label: 'Por Projeto', icon: Briefcase },
          { key: 'totais', label: 'Totais', icon: Layers },
        ].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={cn('flex items-center gap-1.5 px-4 py-2 text-xs font-medium transition-colors border-b-2 -mb-[1px]',
              tab === t.key ? 'text-red border-red' : 'text-white-dim border-transparent hover:text-white')}>
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {tab === 'resumo' && (
          <ResumoTab entries={filteredEntries} users={users} projects={projects} patches={patches} hotfixes={hotfixes}
            workingDays={workingDays} expectedHours={expectedHours} start={start} end={end} />)}
        {tab === 'usuarios' && (
          <UsuariosTab entries={filteredEntries} users={users} projects={projects} patches={patches} hotfixes={hotfixes}
            start={start} end={end} workingDays={workingDays} expectedHours={expectedHours}
            currentUserId={currentUser.id} isManager={isManager} />)}
        {tab === 'projetos' && (
          <ProjetosTab entries={filteredEntries} projects={projects} patches={patches} hotfixes={hotfixes} />)}
        {tab === 'totais' && (
          <TotaisTab entries={filteredEntries} users={users} start={start} end={end} />)}
      </div>
    </div>
  );
}
