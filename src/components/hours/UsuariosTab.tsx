import { useState, useMemo } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, Briefcase, Flame, Package } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export default function UsuariosTab({ entries, projects, patches, hotfixes, expectedHours, currentUserId, isManager }: any) {
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const byUser = useMemo(() => {
    const map: Record<string, any> = {};
    for (const t of entries) {
      if (!map[t.userId]) map[t.userId] = { id: t.userId, name: t.userName, hours: 0, entries: 0 };
      map[t.userId].hours += t.hours;
      map[t.userId].entries += 1;
    }
    return Object.values(map).sort((a: any, b: any) => b.hours - a.hours);
  }, [entries]);

  const visibleUsers = isManager ? byUser : byUser.filter((u: any) => u.id === currentUserId);

  return (
    <div className="space-y-4">
      {visibleUsers.length === 0 && (
        <div className="glass-card p-8 text-center">
          <AlertTriangle className="w-8 h-8 text-white-dim mx-auto mb-2" />
          <p className="text-sm text-white-dim">Nenhum apontamento no período.</p>
        </div>
      )}
      {visibleUsers.map((u: any) => {
        const rate = expectedHours > 0 ? (u.hours / expectedHours) * 100 : 0;
        const isOpen = expandedUser === u.id;
        const userEntries = entries.filter((t: any) => t.userId === u.id);

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

        return (
          <div key={u.id} className="glass-card overflow-hidden animate-fade-in">
            <button onClick={() => setExpandedUser(isOpen ? null : u.id)}
              className="w-full flex items-center gap-4 p-4 hover:bg-black-surface-2/30 transition-colors text-left">
              <div className="w-10 h-10 rounded-full bg-red-soft border border-red-30 flex items-center justify-center text-sm font-bold text-red shrink-0">
                {u.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{u.name}</span>
                  <span className={cn('text-[10px] px-2 py-0.5 rounded-full border font-medium',
                    rate >= 100 ? 'bg-green-500/10 text-green-500 border-green-500/20'
                      : rate >= 70 ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                        : 'bg-red/10 text-red border-red/20')}>
                    {rate >= 100 ? 'Meta' : rate >= 70 ? 'Próximo' : 'Abaixo'}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] text-white-dim">{u.entries} apontamentos</span>
                  <span className="text-[10px] text-white-dim">{u.hours.toFixed(1)}h</span>
                  <span className={cn('text-[10px] font-medium', rate >= 100 ? 'text-green-500' : rate >= 70 ? 'text-yellow-500' : 'text-red')}>
                    {rate.toFixed(1)}% da meta
                  </span>
                </div>
                <div className="mt-2 w-full h-1.5 bg-black-surface-2 rounded-full overflow-hidden">
                  <div className={cn('h-full rounded-full', rate >= 100 ? 'bg-green-500' : rate >= 70 ? 'bg-yellow-500' : 'bg-red')}
                    style={{ width: `${Math.min(rate, 100)}%` }} />
                </div>
              </div>
              {isOpen ? <ChevronUp className="w-4 h-4 text-white-dim shrink-0" /> : <ChevronDown className="w-4 h-4 text-white-dim shrink-0" />}
            </button>

            {isOpen && (
              <div className="border-t border-black-border px-4 pb-4 animate-fade-in">
                <h4 className="text-[10px] text-white-dim uppercase font-medium mt-4 mb-2">Entidades trabalhadas</h4>
                {byEntity.length === 0 ? (
                  <p className="text-xs text-white-dim">Nenhuma entidade detalhada.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {byEntity.map((e: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg bg-black-surface-2 border border-black-border">
                        {e.type === 'Projeto' ? <Briefcase className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          : e.type === 'Hotfix' ? <Flame className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                            : <Package className="w-3.5 h-3.5 text-purple-400 shrink-0" />}
                        <div className="min-w-0">
                          <p className="text-[11px] font-medium truncate">{e.name}</p>
                          <p className="text-[10px] text-white-dim">{e.hours.toFixed(1)}h • {e.type}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <h4 className="text-[10px] text-white-dim uppercase font-medium mt-4 mb-2">Detalhamento por dia</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-black-border">
                        <th className="px-3 py-2 text-[10px] text-white-dim uppercase font-medium">Data</th>
                        <th className="px-3 py-2 text-[10px] text-white-dim uppercase font-medium">Entidade</th>
                        <th className="px-3 py-2 text-[10px] text-white-dim uppercase font-medium text-right">Horas</th>
                        <th className="px-3 py-2 text-[10px] text-white-dim uppercase font-medium">Descrição</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userEntries.sort((a: any, b: any) => b.date.getTime() - a.date.getTime()).map((t: any, idx: number) => {
                        const proj = projects.find((p: any) => p.id === t.entityId);
                        const patch = patches.find((p: any) => p.id === t.entityId);
                        const hotfix = hotfixes.find((h: any) => h.id === t.entityId);
                        const name = proj?.title || patch?.title || hotfix?.title || 'Desconhecido';
                        const type = proj ? 'Projeto' : patch ? 'Patch' : hotfix ? 'Hotfix' : 'Outro';
                        return (
                          <tr key={idx} className="border-b border-black-border/50">
                            <td className="px-3 py-2 text-[11px] text-white-dim">{format(t.date, 'dd/MM')}</td>
                            <td className="px-3 py-2 text-[11px]">
                              <span className="truncate block max-w-[200px]">{name}</span>
                              <span className="text-[9px] text-white-dim">{type}</span>
                            </td>
                            <td className="px-3 py-2 text-[11px] font-medium text-right">{t.hours}h</td>
                            <td className="px-3 py-2 text-[11px] text-white-dim">{t.description || '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
