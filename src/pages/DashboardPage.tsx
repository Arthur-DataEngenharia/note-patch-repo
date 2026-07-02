import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ClipboardList,
  CalendarDays,
  Flame,
  AlertTriangle,
  ArrowUpRight,
  Activity,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useAppStore } from '@/store/appStore';
import { useThemeStore } from '@/store/themeStore';
import { PageHeader } from '@/components/shared/PageHeader';
import { ClassificationBadge } from '@/components/shared/ClassificationBadge';
import { StatusPill } from '@/components/shared/StatusPill';
import { formatRelative, formatDate } from '@/lib/utils';
import { getUser } from '@/lib/mockData';

export default function DashboardPage() {
  const { patches, hotfixes, classifications, auditLogs } = useAppStore();
  const theme = useThemeStore((s) => s.theme);
  const isDark = theme === 'dark';
  const axisColor = isDark ? '#555' : '#999';
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
    (p) =>
      p.deployedAt.getMonth() === now.getMonth() && p.deployedAt.getFullYear() === now.getFullYear()
  ).length;
  const activeHotfixes = hotfixes.filter((h) => !['closed', 'validated'].includes(h.status)).length;
  const pendingDocs = patches.filter((p) => p.status === 'draft' || p.status === 'in_review').length;

  const kpis = [
    { label: 'Total de Patches', value: patches.length, icon: ClipboardList, color: '#E11D48' },
    { label: 'Patches este mês', value: thisMonth, icon: CalendarDays, color: '#3B82F6' },
    { label: 'Hotfixes ativos', value: activeHotfixes, icon: Flame, color: '#FF1744', glow: activeHotfixes > 0 },
    { label: 'Pendentes de doc.', value: pendingDocs, icon: AlertTriangle, color: '#F59E0B' },
  ];

  const chartData = useMemo(() => {
    const counts: Record<string, number> = {};
    patches.forEach((p) => {
      counts[p.classificationId] = (counts[p.classificationId] || 0) + 1;
    });
    return Object.entries(counts).map(([id, count]) => {
      const c = classifications.find((cl) => cl.id === id);
      return { name: c?.name ?? id, count, color: c?.color ?? '#E11D48' };
    });
  }, [patches, classifications]);

  const recentPatches = [...patches]
    .filter((p) => p.status === 'published')
    .sort((a, b) => b.deployedAt.getTime() - a.deployedAt.getTime())
    .slice(0, 5);

  const alerts: { message: string; link: string }[] = [];
  patches
    .filter((p) => p.status === 'published' && !p.rollbackPlan)
    .forEach((p) => alerts.push({ message: `Patch ${p.version} sem plano de rollback`, link: `/patches/${p.id}` }));
  hotfixes
    .filter((h) => h.postMortemNeeded && !h.postMortemDone)
    .forEach((h) => alerts.push({ message: `Hotfix "${h.title}" sem post-mortem`, link: '/history/hotfix' }));

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Visão executiva do estado dos patches em produção"
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 animate-stagger">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className={`glass-card p-5 red-accent-left ${kpi.glow ? 'shadow-red-glow' : ''}`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-white-muted uppercase tracking-wide font-medium">
                {kpi.label}
              </span>
              <kpi.icon className="w-4 h-4" style={{ color: kpi.color }} />
            </div>
            <p className="text-3xl font-bold">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 glass-card p-6">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-red" />
            Patches por Classificação
          </h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" stroke={axisColor} fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke={axisColor} fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                cursor={{ fill: cursorFill }}
                contentStyle={tooltipStyle}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Alerts */}
        <div className="glass-card p-6">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red" />
            Alertas
          </h2>
          {alerts.length === 0 && (
            <p className="text-sm text-white-muted">Nenhum alerta pendente 🎉</p>
          )}
          <div className="space-y-2">
            {alerts.map((alert, i) => (
              <Link
                key={i}
                to={alert.link}
                className="block p-3 rounded-lg bg-red-soft border border-red-20 text-xs text-white hover:border-red-50 transition-all"
              >
                {alert.message}
              </Link>
            ))}
          </div>
        </div>

        {/* Recent deploys */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-red" />
              Últimos Deploys
            </h2>
            <Link to="/patches" className="text-xs text-red hover:underline flex items-center gap-1">
              Ver todos <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentPatches.map((p) => (
              <Link
                key={p.id}
                to={`/patches/${p.id}`}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-hover transition-all group red-accent-left bg-surface-2-50"
              >
                <span className="font-mono text-xs text-red font-semibold shrink-0">{p.version}</span>
                <span className="text-sm truncate flex-1 group-hover:text-white transition-colors">
                  {p.title}
                </span>
                <ClassificationBadge classificationId={p.classificationId} size="sm" />
                <span className="text-[11px] text-white-dim shrink-0">{formatDate(p.deployedAt)}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Activity feed */}
        <div className="glass-card p-6">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-red" />
            Atividade Recente
          </h2>
          <div className="space-y-4">
            {auditLogs.slice(0, 6).map((log) => (
              <div key={log.id} className="flex gap-3 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-red mt-1.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-white">
                    <span className="font-semibold">{log.userName}</span>{' '}
                    <span className="text-white-muted">
                      {log.action === 'create' && 'criou'}
                      {log.action === 'update' && 'atualizou'}
                      {log.action === 'publish' && 'publicou'}
                      {log.action === 'export' && 'exportou'}
                      {log.action === 'archive' && 'arquivou'}
                      {log.action === 'delete' && 'removeu'}
                    </span>{' '}
                    {log.entity === 'patch' && 'um patch'}
                    {log.entity === 'hotfix' && 'um hotfix'}
                    {log.entity === 'document' && 'um documento'}
                  </p>
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
