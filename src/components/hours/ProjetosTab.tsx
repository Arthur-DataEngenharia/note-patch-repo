import { useState, useMemo } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, Briefcase, Flame, Package, Clock, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BarChartWrapper } from './Charts';

export default function ProjetosTab({ entries, projects, patches, hotfixes }: any) {
  const [expandedProj, setExpandedProj] = useState<string | null>(null);

  const projectMetrics = useMemo(() => {
    const map: Record<string, any> = {};
    for (const t of entries) {
      const proj = projects.find((p: any) => p.id === t.entityId);
      const patch = patches.find((p: any) => p.id === t.entityId);
      const hotfix = hotfixes.find((h: any) => h.id === t.entityId);
      if (!proj && !patch && !hotfix) continue;
      const name = proj?.title || patch?.title || hotfix?.title || 'Desconhecido';
      const type = proj ? 'Projeto' : patch ? 'Patch' : 'Hotfix';
      const id = t.entityId;
      if (!map[id]) map[id] = { id, name, type, totalHours: 0, stages: {}, userHours: {} };
      map[id].totalHours += t.hours;
      const stageKey = t.description?.toLowerCase().includes('processo') ? 'processo'
        : t.description?.toLowerCase().includes('dev') || t.description?.toLowerCase().includes('desenvolv') ? 'desenvolvimento'
          : t.description?.toLowerCase().includes('qa') ? 'qa'
            : t.description?.toLowerCase().includes('hotfix') ? 'hotfix'
              : t.description?.toLowerCase().includes('public') ? 'publicado'
                : proj?.currentStage || 'rascunho';
      map[id].stages[stageKey] = (map[id].stages[stageKey] || 0) + t.hours;
      map[id].userHours[t.userName] = (map[id].userHours[t.userName] || 0) + t.hours;
    }
    return Object.values(map).sort((a: any, b: any) => b.totalHours - a.totalHours);
  }, [entries, projects, patches, hotfixes]);

  const stageColors: Record<string, string> = {
    processo: 'bg-cyan-500', desenvolvimento: 'bg-purple-500', qa: 'bg-green-500',
    hotfix: 'bg-orange-500', publicado: 'bg-blue-500', rascunho: 'bg-white-dim',
  };

  return (
    <div className="space-y-4">
      {projectMetrics.length === 0 && (
        <div className="glass-card p-8 text-center">
          <AlertTriangle className="w-8 h-8 text-white-dim mx-auto mb-2" />
          <p className="text-sm text-white-dim">Nenhum projeto com apontamentos no período.</p>
        </div>
      )}
      {projectMetrics.map((p: any) => {
        const isOpen = expandedProj === p.id;
        const stageEntries = Object.entries(p.stages).sort((a: any, b: any) => b[1] - a[1]);
        const bottleneck = stageEntries[0];
        const userEntries = Object.entries(p.userHours).sort((a: any, b: any) => b[1] - a[1]);

        return (
          <div key={p.id} className="glass-card overflow-hidden animate-fade-in">
            <button onClick={() => setExpandedProj(isOpen ? null : p.id)}
              className="w-full flex items-center gap-4 p-4 hover:bg-black-surface-2/30 transition-colors text-left">
              {p.type === 'Projeto' ? <Briefcase className="w-5 h-5 text-blue-400 shrink-0" />
                : p.type === 'Hotfix' ? <Flame className="w-5 h-5 text-orange-400 shrink-0" />
                  : <Package className="w-5 h-5 text-purple-400 shrink-0" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold truncate">{p.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded border border-black-border bg-black-surface-2 text-white-dim">{p.type}</span>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[10px] text-white-dim">{p.totalHours.toFixed(1)}h totais</span>
                  {bottleneck && (
                    <span className="text-[10px] text-red flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Gargalo: {bottleneck[0]} ({(bottleneck[1] as number).toFixed(1)}h)
                    </span>
                  )}
                </div>
              </div>
              {isOpen ? <ChevronUp className="w-4 h-4 text-white-dim shrink-0" /> : <ChevronDown className="w-4 h-4 text-white-dim shrink-0" />}
            </button>

            {isOpen && (
              <div className="border-t border-black-border px-4 pb-4 animate-fade-in">
                <h4 className="text-[10px] text-white-dim uppercase font-medium mt-4 mb-2">Horas por etapa</h4>
                <div className="space-y-2">
                  {stageEntries.map(([stage, hours]: any) => {
                    const pct = p.totalHours > 0 ? ((hours as number) / p.totalHours) * 100 : 0;
                    const isBottleneck = stage === bottleneck?.[0];
                    return (
                      <div key={stage} className="flex items-center gap-3">
                        <span className={cn('w-2 h-2 rounded-full shrink-0', stageColors[stage as string] || 'bg-white-dim')} />
                        <span className="text-[11px] w-28 shrink-0 capitalize">{stage}</span>
                        <div className="flex-1 h-2 bg-black-surface-2 rounded-full overflow-hidden">
                          <div className={cn('h-full rounded-full transition-all', isBottleneck ? 'bg-red' : stageColors[stage as string] || 'bg-white-dim')}
                            style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[11px] font-medium w-16 text-right">{hours}h</span>
                        <span className="text-[10px] text-white-dim w-10 text-right">{pct.toFixed(0)}%</span>
                      </div>
                    );
                  })}
                </div>

                <h4 className="text-[10px] text-white-dim uppercase font-medium mt-4 mb-2">Horas por colaborador</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {userEntries.map(([name, hours]: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg bg-black-surface-2 border border-black-border">
                      <Users className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-medium truncate">{name}</p>
                        <p className="text-[10px] text-white-dim">{hours}h</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <BarChartWrapper data={stageEntries.map(([stage, hours]: any) => ({ name: String(stage).charAt(0).toUpperCase() + String(stage).slice(1), horas: hours }))} color="#ef4444" />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
