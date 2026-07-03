import { useMemo } from 'react';
import { Clock, Briefcase, Flame, Package, TrendingUp, Calendar, Percent, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { SummaryCard, StatPill, ChartCard, EmptyChart, BarChartWrapper } from './Charts';

export default function UserDetailView({ userId, userName, entries, projects, patches, hotfixes, start, end, workingDays, expectedHours }: any) {
  const userEntries = entries.filter((t: any) => t.userId === userId && t.date >= start && t.date <= end);
  const totalHours = userEntries.reduce((s: number, t: any) => s + t.hours, 0);
  const rate = expectedHours > 0 ? (totalHours / expectedHours) * 100 : 0;

  const byEntity = useMemo(() => {
    const map: Record<string, any> = {};
    for (const t of userEntries) {
      if (!map[t.entityId]) {
        const proj = projects.find((p: any) => p.id === t.entityId);
        const patch = patches.find((p: any) => p.id === t.entityId);
        const hotfix = hotfixes.find((h: any) => h.id === t.entityId);
        const name = proj?.title || patch?.title || hotfix?.title || 'Desconhecido';
        const type = proj ? 'Projeto' : patch ? 'Patch' : hotfix ? 'Hotfix' : 'Outro';
        map[t.entityId] = { name, type, hours: 0 };
      }
      map[t.entityId].hours += t.hours;
    }
    return Object.values(map).sort((a: any, b: any) => b.hours - a.hours);
  }, [userEntries, projects, patches, hotfixes]);

  const byType = useMemo(() => {
    const map = { patch: 0, hotfix: 0, project: 0 };
    for (const t of userEntries) map[t.entityType as keyof typeof map] += t.hours;
    return [
      { name: 'Patches', value: Number(map.patch.toFixed(1)), key: 'patch' },
      { name: 'Hotfixes', value: Number(map.hotfix.toFixed(1)), key: 'hotfix' },
      { name: 'Projetos', value: Number(map.project.toFixed(1)), key: 'project' },
    ].filter((d) => d.value > 0);
  }, [userEntries]);

  const dailyEntries = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of userEntries) {
      const key = format(t.date, 'dd/MM');
      map[key] = (map[key] || 0) + t.hours;
    }
    return Object.entries(map).map(([name, horas]) => ({ name, horas: Number(horas.toFixed(1)) })).sort((a, b) => a.name.localeCompare(b.name));
  }, [userEntries]);

  return (
    <>
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard icon={Clock} label="Suas Horas" value={`${totalHours.toFixed(1)}h`} sub={`${userEntries.length} apontamentos`} color="red" />
        <SummaryCard icon={Calendar} label="Dias Úteis" value={String(workingDays)} sub={`${format(start, 'dd/MM')} – ${format(end, 'dd/MM/yyyy')}`} color="green" />
        <SummaryCard icon={Percent} label="Sua Utilização" value={`${rate.toFixed(1)}%`} sub={`Meta: ${expectedHours.toFixed(0)}h (CLT)`} color={rate >= 100 ? 'green' : rate >= 70 ? 'yellow' : 'red'} />
        <SummaryCard icon={TrendingUp} label="Média por Dia" value={`${workingDays > 0 ? (totalHours / workingDays).toFixed(1) : '0'}h`} sub="Total ÷ dias úteis" color="blue" />
      </div>

      <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="Horas por Entidade" subtitle="Projetos, Patches e Hotfixes que você trabalhou">
          {byEntity.length === 0 ? <EmptyChart /> : (
            <div className="space-y-2">
              {byEntity.map((e: any, i: number) => (
                <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg bg-black-surface-2 border border-black-border">
                  {e.type === 'Projeto' ? <Briefcase className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    : e.type === 'Hotfix' ? <Flame className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                      : <Package className="w-3.5 h-3.5 text-purple-400 shrink-0" />}
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium truncate">{e.name}</p>
                  </div>
                  <span className="text-[11px] font-medium">{e.hours.toFixed(1)}h</span>
                </div>
              ))}
            </div>
          )}
        </ChartCard>

        <ChartCard title="Distribuição por Tipo" subtitle="Como seu tempo foi dividido">
          {byType.length === 0 ? <EmptyChart /> : <BarChartWrapper data={byType} color="#22c55e" />}
        </ChartCard>
      </div>

      {userEntries.length === 0 ? (
        <div className="mt-5 glass-card p-8 text-center">
          <AlertTriangle className="w-8 h-8 text-white-dim mx-auto mb-2" />
          <p className="text-sm text-white-dim">Nenhum apontamento seu no período selecionado.</p>
        </div>
      ) : (
        <>
          <div className="mt-5 glass-card p-5">
            <h3 className="text-sm font-semibold mb-1">Horas por Dia</h3>
            <p className="text-[10px] text-white-dim mb-4">Evolução diária no período</p>
            <BarChartWrapper data={dailyEntries} color="#eab308" />
          </div>

          <div className="mt-5 glass-card overflow-hidden">
            <div className="p-5 border-b border-black-border">
              <h3 className="text-sm font-semibold">Seus Apontamentos</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-black-border">
                    <th className="px-5 py-3 text-[10px] text-white-dim uppercase font-medium">Data</th>
                    <th className="px-5 py-3 text-[10px] text-white-dim uppercase font-medium">Entidade</th>
                    <th className="px-5 py-3 text-[10px] text-white-dim uppercase font-medium text-right">Horas</th>
                    <th className="px-5 py-3 text-[10px] text-white-dim uppercase font-medium">Descrição</th>
                  </tr>
                </thead>
                <tbody>
                  {userEntries.sort((a: any, b: any) => b.date.getTime() - a.date.getTime()).map((t: any, idx: number) => {
                    const proj = projects.find((p: any) => p.id === t.entityId);
                    const patch = patches.find((p: any) => p.id === t.entityId);
                    const hotfix = hotfixes.find((h: any) => h.id === t.entityId);
                    const name = proj?.title || patch?.title || hotfix?.title || 'Desconhecido';
                    return (
                      <tr key={idx} className="border-b border-black-border/50">
                        <td className="px-5 py-3 text-xs text-white-dim">{format(t.date, 'dd/MM/yyyy')}</td>
                        <td className="px-5 py-3 text-xs">{name}</td>
                        <td className="px-5 py-3 text-xs font-medium text-right">{t.hours}h</td>
                        <td className="px-5 py-3 text-xs text-white-dim">{t.description || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  );
}
