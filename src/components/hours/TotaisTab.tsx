import { useMemo } from 'react';
import { Clock, Users, TrendingUp, AlertTriangle, Calendar } from 'lucide-react';
import { format, eachMonthOfInterval, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { SummaryCard, ChartCard, EmptyChart, BarChartWrapper } from './Charts';
import { getHolidays } from './holidays';
import { isWeekend } from 'date-fns';

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

export default function TotaisTab({ entries, users, start, end }: any) {
  const months = useMemo(() => {
    return eachMonthOfInterval({ start, end }).map((m) => {
      const s = startOfMonth(m);
      const e = endOfMonth(m);
      const monthEntries = entries.filter((t: any) => t.date >= s && t.date <= e);
      const hours = monthEntries.reduce((sum: number, t: any) => sum + t.hours, 0);
      const wd = countWorkingDays(s, e);
      const expected = wd * CLT_HOURS_PER_DAY;
      const rate = expected > 0 ? (hours / expected) * 100 : 0;
      return {
        name: format(m, 'MMM', { locale: ptBR }),
        horas: Number(hours.toFixed(1)),
        meta: expected,
        taxa: Number(rate.toFixed(1)),
        entries: monthEntries.length,
      };
    });
  }, [entries, start, end]);

  const totalHours = entries.reduce((s: number, t: any) => s + t.hours, 0);
  const totalWorkingDays = countWorkingDays(start, end);
  const totalExpected = totalWorkingDays * CLT_HOURS_PER_DAY;
  const overallRate = totalExpected > 0 ? (totalHours / totalExpected) * 100 : 0;

  const byTeam = useMemo(() => {
    const map: Record<string, any> = { 'Processo': { hours: 0, count: 0 }, 'Desenvolvimento': { hours: 0, count: 0 }, 'QA': { hours: 0, count: 0 }, 'Outros': { hours: 0, count: 0 } };
    for (const t of entries) {
      const u = users.find((user: any) => user.id === t.userId);
      const team = u?.role === 'processo' ? 'Processo' : u?.role === 'desenvolvedor' ? 'Desenvolvimento' : u?.role === 'qa' ? 'QA' : 'Outros';
      map[team].hours += t.hours;
      map[team].count += 1;
    }
    return Object.entries(map).filter(([_k, v]: any) => v.hours > 0).map(([name, v]: any) => ({ name, horas: Number(v.hours.toFixed(1)), apontamentos: v.count }));
  }, [entries, users]);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard icon={Clock} label="Total de Horas" value={`${totalHours.toFixed(1)}h`} sub={`${entries.length} apontamentos`} color="red" />
        <SummaryCard icon={Calendar} label="Dias Úteis no Período" value={String(totalWorkingDays)} sub={`${format(start, 'dd/MM/yyyy')} – ${format(end, 'dd/MM/yyyy')}`} color="green" />
        <SummaryCard icon={TrendingUp} label="Taxa Geral de Utilização" value={`${overallRate.toFixed(1)}%`} sub={`Meta: ${totalExpected.toFixed(0)}h`} color={overallRate >= 100 ? 'green' : overallRate >= 70 ? 'yellow' : 'red'} />
        <SummaryCard icon={Users} label="Equipes Ativas" value={String(byTeam.length)} sub="Com apontamentos no período" color="blue" />
      </div>

      <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="Evolução Mensal de Horas" subtitle="Comparativo mês a mês">
          {months.length === 0 ? <EmptyChart /> : <BarChartWrapper data={months} dataKey="horas" color="#3b82f6" />}
        </ChartCard>
        <ChartCard title="Horas por Equipe" subtitle="Processo, Desenvolvimento, QA e Outros">
          {byTeam.length === 0 ? <EmptyChart /> : <BarChartWrapper data={byTeam} dataKey="horas" color="#22c55e" />}
        </ChartCard>
      </div>

      <div className="mt-5 glass-card overflow-hidden">
        <div className="p-5 border-b border-black-border">
          <h3 className="text-sm font-semibold">Detalhamento Mensal</h3>
          <p className="text-[10px] text-white-dim mt-1">Horas apontadas vs meta CLT por mês</p>
        </div>
        {months.length === 0 ? (
          <div className="p-8 text-center">
            <AlertTriangle className="w-8 h-8 text-white-dim mx-auto mb-2" />
            <p className="text-sm text-white-dim">Nenhum dado no período.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-black-border">
                  <th className="px-5 py-3 text-[10px] text-white-dim uppercase font-medium">Mês</th>
                  <th className="px-5 py-3 text-[10px] text-white-dim uppercase font-medium text-right">Apontamentos</th>
                  <th className="px-5 py-3 text-[10px] text-white-dim uppercase font-medium text-right">Horas</th>
                  <th className="px-5 py-3 text-[10px] text-white-dim uppercase font-medium text-right">Meta CLT</th>
                  <th className="px-5 py-3 text-[10px] text-white-dim uppercase font-medium text-right">% Utilização</th>
                  <th className="px-5 py-3 text-[10px] text-white-dim uppercase font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {months.map((m: any, i: number) => (
                  <tr key={i} className="border-b border-black-border/50 hover:bg-black-surface-2/30 transition-colors">
                    <td className="px-5 py-3 text-xs font-medium capitalize">{m.name}</td>
                    <td className="px-5 py-3 text-xs text-white-dim text-right">{m.entries}</td>
                    <td className="px-5 py-3 text-xs font-medium text-right">{m.horas}h</td>
                    <td className="px-5 py-3 text-xs text-white-dim text-right">{m.meta}h</td>
                    <td className="px-5 py-3 text-xs text-right">
                      <span className={m.taxa >= 100 ? 'text-green-500' : m.taxa >= 70 ? 'text-yellow-500' : 'text-red'}>
                        {m.taxa}%
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={m.taxa >= 100 ? 'text-[10px] text-green-500 bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20'
                        : m.taxa >= 70 ? 'text-[10px] text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20'
                          : 'text-[10px] text-red bg-red/10 px-2 py-0.5 rounded-full border border-red/20'}>
                        {m.taxa >= 100 ? 'Meta Atingida' : m.taxa >= 70 ? 'Próximo' : 'Abaixo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
