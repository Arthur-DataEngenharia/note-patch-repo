import { useMemo } from 'react';
import { Clock, Users, Calendar, Percent, BarChart3, TrendingUp, Briefcase } from 'lucide-react';
import { format } from 'date-fns';
import { SummaryCard, StatPill, ChartCard, EmptyChart, BarChartWrapper, PieChartWrapper } from './Charts';

export default function ResumoTab({ entries, users, projects, patches, hotfixes, workingDays, expectedHours, start, end }: any) {
  const totalHours = entries.reduce((s: number, t: any) => s + t.hours, 0);

  const byUser = useMemo(() => {
    const map: Record<string, any> = {};
    for (const t of entries) {
      if (!map[t.userId]) map[t.userId] = { name: t.userName, hours: 0, entries: 0 };
      map[t.userId].hours += t.hours;
      map[t.userId].entries += 1;
    }
    return Object.values(map).sort((a: any, b: any) => b.hours - a.hours);
  }, [entries]);

  const byType = useMemo(() => {
    const map = { patch: 0, hotfix: 0, project: 0 };
    for (const t of entries) map[t.entityType as keyof typeof map] += t.hours;
    return [
      { name: 'Patches', value: Number(map.patch.toFixed(1)), key: 'patch' },
      { name: 'Hotfixes', value: Number(map.hotfix.toFixed(1)), key: 'hotfix' },
      { name: 'Projetos', value: Number(map.project.toFixed(1)), key: 'project' },
    ].filter((d) => d.value > 0);
  }, [entries]);

  const byProject = useMemo(() => {
    const map: Record<string, any> = {};
    for (const t of entries) {
      if (!map[t.entityId]) {
        const proj = projects.find((p: any) => p.id === t.entityId);
        const patch = patches.find((p: any) => p.id === t.entityId);
        const hotfix = hotfixes.find((h: any) => h.id === t.entityId);
        const name = proj?.title || patch?.title || hotfix?.title || 'Desconhecido';
        const type = proj ? 'Projeto' : patch ? 'Patch' : hotfix ? 'Hotfix' : 'Outro';
        map[t.entityId] = { name, hours: 0, type };
      }
      map[t.entityId].hours += t.hours;
    }
    return Object.values(map).sort((a: any, b: any) => b.hours - a.hours).slice(0, 10);
  }, [entries, projects, patches, hotfixes]);

  const avgPerDay = workingDays > 0 ? totalHours / workingDays : 0;
  const avgPerUser = byUser.length > 0 ? totalHours / byUser.length : 0;
  const utilizationRate = expectedHours > 0 ? (totalHours / expectedHours) * 100 : 0;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard icon={Clock} label="Total de Horas" value={`${totalHours.toFixed(1)}h`} sub={`${entries.length} apontamentos`} color="red" />
        <SummaryCard icon={Users} label="Usuários Ativos" value={String(byUser.length)} sub={`de ${users.length} cadastrados`} color="blue" />
        <SummaryCard icon={Calendar} label="Dias Úteis" value={String(workingDays)} sub={`${format(start, 'dd/MM')} – ${format(end, 'dd/MM/yyyy')}`} color="green" />
        <SummaryCard icon={Percent} label="Taxa de Utilização" value={`${utilizationRate.toFixed(1)}%`} sub={`Meta: ${expectedHours.toFixed(0)}h (CLT)`} color={utilizationRate >= 100 ? 'green' : utilizationRate >= 70 ? 'yellow' : 'red'} />
      </div>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatPill icon={BarChart3} label="Média por dia útil" value={`${avgPerDay.toFixed(1)}h`} hint="Total ÷ dias úteis" color="red" />
        <StatPill icon={TrendingUp} label="Média por usuário" value={`${avgPerUser.toFixed(1)}h`} hint="Total ÷ usuários ativos" color="green" />
        <StatPill icon={Briefcase} label="Entidades com horas" value={`${byProject.length}`} hint="Projetos, patches e hotfixes" color="blue" />
      </div>
      <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="Horas por Usuário" subtitle="% em relação à carga CLT esperada" icon={BarChart3}>
          {byUser.length === 0 ? <EmptyChart /> : (
            <BarChartWrapper data={byUser.map((u: any) => ({ name: u.name.split(' ')[0], horas: Number(u.hours.toFixed(1)) }))} />
          )}
        </ChartCard>
        <ChartCard title="Distribuição por Tipo" subtitle="Patches, Hotfixes e Projetos" icon={Briefcase}>
          {byType.length === 0 ? <EmptyChart /> : <PieChartWrapper data={byType} />}
        </ChartCard>
      </div>
      <div className="mt-5">
        <ChartCard title="Top Entidades com Mais Horas" subtitle="Projetos, Patches e Hotfixes" icon={TrendingUp}>
          {byProject.length === 0 ? <EmptyChart /> : (
            <BarChartWrapper data={byProject.map((p: any) => ({ name: p.name.length > 18 ? p.name.slice(0, 18) + '...' : p.name, horas: Number(p.hours.toFixed(1)) }))} color="#3b82f6" />
          )}
        </ChartCard>
      </div>
    </>
  );
}
