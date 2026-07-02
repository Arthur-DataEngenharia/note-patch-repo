import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardList, CalendarDays, Flame, AlertTriangle, ArrowUpRight, Activity,
  TrendingUp, Shield, Zap, GitBranch, CheckCircle2,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, CartesianGrid } from 'recharts';
import { useAppStore } from '@/store/appStore';
import { useThemeStore } from '@/store/themeStore';
import { PageHeader } from '@/components/shared/PageHeader';
import { ClassificationBadge } from '@/components/shared/ClassificationBadge';
import { formatRelative, formatDate, cn } from '@/lib/utils';
import { getUser } from '@/lib/mockData';

export default function DashboardPage() {
  const { patches, hotfixes, classifications, auditLogs } = useAppStore();
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';
  const axisColor = isDark ? '#555' : '#999';
  const gridColor = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)';
  const tooltipStyle = {
    background: isDark ? '#141414' : '#FFFFFF',
    border: `1px solid ${isDark ? '#2A2A2A' : '#E0E0E0'}`,
    borderRadius: 8,
    color: isDark ? '#FAFAFA' : '#1A1A1A',
    fontSize: 12,
  };
  const cursorFill = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)';

  const now = new Date();
  const thisMonth = patches.filter(
    (p) => p.deployedAt.getMonth() === now.getMonth() && p.deployedAt.getFullYear() === now.getFullYear()
  ).length;
  const lastMonthPatches = patches.filter(
    (p) => {
      const d = p.deployedAt;
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endLastMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return d >= lastMonth && d < endLastMonth;
    }
  ).length;
  const activeHotfixes = hotfixes.filter((h) => !['closed', 'validated'].includes(h.status)).length;
  const pendingDocs = patches.filter((p) => p.status === 'draft' || p.status === 'in_review').length;
  const publishedCount = patches.filter((p) => p.status === 'published').length;
  const successRate = patches.length > 0 ? Math.round((publishedCount / patches.length) * 100) : 0;

  const trendData = useMemo(() => {
    const months: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      months[key] = 0;
    }
    patches.forEach((p) => {
      const d = p.deployedAt;
      const key = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      if (months[key] !== undefined) months[key]++;
    });
    return Object.entries(months).map(([name, value]) => ({ name, value }));
  }, [patches]);

  const chartData = useMemo(() => {
    const counts: Record<string, number> = {};
    patches.forEach((p) => { counts[p.classificationId] = (counts[p.classificationId] || 0) + 1; });
    return Object.entries(counts).map(([id, count]) => {
      const c = classifications.find((cl) => cl.id === id);
      return { name: c?.name ?? id, count, color: c?.color ?? '#E11D48' };
    });
  }, [patches, classifications]);

  const recentPatches = [...patches]
    .filter((p) => p.status === 'published')
    .sort((a, b) => b.deployedAt.getTime() - a.deployedAt.getTime())
    .slice(0, 5);

  const criticalHotfixes = hotfixes.filter((h) => h.severity === 'critical' && !['closed', 'validated'].includes(h.status));

  const systemHealth = {
    score: Math.max(0, 100 - activeHotfixes * 15 - criticalHotfixes.length * 25),
    status: activeHotfixes === 0 ? 'Saudavel' : criticalHotfixes.length > 0 ? 'Critico' : 'Atencao',
    color: activeHotfixes === 0 ? 'text-green-400' : criticalHotfixes.length > 0 ? 'text-red' : 'text-amber-400',
    bg: activeHotfixes === 0 ? 'bg-green-500/10 border-green-500/30' : criticalHotfixes.length > 0 ? 'bg-red-soft border-red-30' : 'bg-amber-500/10 border-amber-500/30',
  };

  return (
    <div>
      <PageHeader title="Dashboard" description="Visao executiva do estado dos patches" />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 animate-stagger">
        {[
          { label: 'Total Patches', value: patches.length, icon: ClipboardList, color: '#E11D48', trend: `+${thisMonth} este mes` },
          { label: 'Taxa Sucesso', value: `${successRate}%`, icon: CheckCircle2, color: '#22C55E', trend: `${publishedCount} publicados` },
          { label: 'Hotfixes Ativos', value: activeHotfixes, icon: Flame, color: '#FF1744', glow: activeHotfixes > 0, trend: `${criticalHotfixes.length} criticos` },
          { label: 'Pendentes', value: pendingDocs, icon: AlertTriangle, color: '#F59E0B', trend: 'em revisao' },
        ].map((kpi) => (
          <div key={kpi.label} className={cn('glass-card p-5 red-accent-left', kpi.glow && 'shadow-red-glow')}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] text-white-muted uppercase tracking-wide font-semibold">{kpi.label}</span>
              <kpi.icon className="w-4 h-4" style={{ color: kpi.color }} />
            </div>
            <p className="text-2xl font-bold">{kpi.value}</p>
            <p className="text-[10px] text-white-dim mt-1">{kpi.trend}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-red" /> Evolucao de Deploys (6 meses)
            </h2>
            <span className="text-xs text-white-dim">{thisMonth} este mes vs {lastMonthPatches} anterior</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="name" stroke={axisColor} fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke={axisColor} fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="value" stroke="#E11D48" strokeWidth={2} dot={{ r: 3, fill: '#E11D48' }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* System Health */}
        <div className={cn('glass-card p-6 border', systemHealth.bg)}>
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-red" /> Saude do Sistema
          </h2>
          <div className="text-center py-2">
            <p className={cn('text-4xl font-bold', systemHealth.color)}>{systemHealth.score}</p>
            <p className="text-xs text-white-dim mt-1">Score de saude</p>
            <p className={cn('text-sm font-semibold mt-2', systemHealth.color)}>{systemHealth.status}</p>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-white-dim">Patches publicados</span>
              <span className="font-medium">{publishedCount}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-white-dim">Hotfixes abertos</span>
              <span className="font-medium">{activeHotfixes}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-white-dim">Post-mortens pendentes</span>
              <span className="font-medium">{hotfixes.filter((h) => h.postMortemNeeded && !h.postMortemDone).length}</span>
            </div>
          </div>
        </div>

        {/* Classification Chart */}
        <div className="lg:col-span-2 glass-card p-6">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-red" /> Distribuicao por Classificacao
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" stroke={axisColor} fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke={axisColor} fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip cursor={{ fill: cursorFill }} contentStyle={tooltipStyle} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, i) => (<Cell key={i} fill={entry.color} />))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Hotfixes Summary */}
        <div className="glass-card p-6">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-red" /> Hotfixes
          </h2>
          {hotfixes.length === 0 ? (
            <p className="text-sm text-white-dim">Nenhum hotfix registrado</p>
          ) : (
            <div className="space-y-3">
              {hotfixes.slice(0, 5).map((h) => (
                <div key={h.id} className="flex items-center gap-3 p-3 rounded-lg bg-surface-2-50 border border-black-border">
                  <Flame className={cn('w-4 h-4 shrink-0', h.severity === 'critical' ? 'text-red' : h.severity === 'high' ? 'text-amber-400' : 'text-white-dim')} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate">{h.title}</p>
                    <p className="text-[10px] text-white-dim">{h.affectedSystem}</p>
                  </div>
                  <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium',
                    h.status === 'closed' || h.status === 'validated' ? 'bg-green-500/10 text-green-400' : 'bg-red-soft text-red'
                  )}>
                    {h.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent deploys */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-red" /> Ultimos Deploys
            </h2>
            <Link to="/patches" className="text-xs text-red hover:underline flex items-center gap-1">
              Ver todos <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {recentPatches.map((p) => (
              <Link key={p.id} to={`/patches/${p.id}`} className="flex items-center gap-4 p-3 rounded-lg hover:bg-hover transition-all group bg-surface-2-50 border border-black-border hover:border-red-40">
                <span className="font-mono text-xs text-red font-semibold shrink-0 w-20">{p.version}</span>
                <span className="text-sm truncate flex-1 group-hover:text-white transition-colors">{p.title}</span>
                <ClassificationBadge classificationId={p.classificationId} size="sm" />
                <span className="text-[11px] text-white-dim shrink-0">{formatDate(p.deployedAt)}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Activity */}
        <div className="glass-card p-6">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-red" /> Atividade
          </h2>
          <div className="space-y-3">
            {auditLogs.slice(0, 5).map((log) => (
              <div key={log.id} className="flex gap-3 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-red mt-1.5 shrink-0" />
                <div>
                  <p className="text-white"><span className="font-semibold">{log.userName}</span> <span className="text-white-dim">{log.action}</span> {log.entity}</p>
                  <p className="text-white-dim text-[10px]">{formatRelative(log.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
