import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

export const CHART_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];

export function SummaryCard({ icon: Icon, label, value, sub, color, trend }: any) {
  const colorMap: Record<string, any> = {
    red: { bg: 'bg-red/10', text: 'text-red', border: 'border-red/20', gradient: 'from-red/5' },
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', gradient: 'from-blue-500/5' },
    green: { bg: 'bg-green-500/10', text: 'text-green-500', border: 'border-green-500/20', gradient: 'from-green-500/5' },
    yellow: { bg: 'bg-yellow-500/10', text: 'text-yellow-500', border: 'border-yellow-500/20', gradient: 'from-yellow-500/5' },
  };
  const c = colorMap[color] || colorMap.red;
  return (
    <div className={cn('glass-card p-5 border relative overflow-hidden', c.border)}>
      {/* Subtle gradient overlay */}
      <div className={cn('absolute inset-0 bg-gradient-to-br to-transparent opacity-40 pointer-events-none', c.gradient)} />

      <div className="relative flex items-start justify-between">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', c.bg)}>
          <Icon className={cn('w-5 h-5', c.text)} />
        </div>
        {trend !== undefined && (
          <span className={cn(
            'text-[10px] font-semibold px-2 py-0.5 rounded-full',
            trend >= 0 ? 'bg-green-500/10 text-green-500' : 'bg-red/10 text-red'
          )}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>

      <div className="relative mt-3">
        <div className="text-2xl font-bold tracking-tight">{value}</div>
        <div className="text-[11px] text-white-dim mt-1 font-medium">{label}</div>
        <div className="text-[10px] text-white-dim/50 mt-1">{sub}</div>
      </div>
    </div>
  );
}

export function StatPill({ icon: Icon, label, value, hint, color = 'white' }: any) {
  const colorClasses: Record<string, string> = {
    red: 'text-red',
    blue: 'text-blue-400',
    green: 'text-green-500',
    yellow: 'text-yellow-500',
    white: 'text-white',
  };
  return (
    <div className="glass-card p-4 flex items-center gap-3 border border-black-border hover:border-white/10 transition-colors">
      <div className="w-10 h-10 rounded-xl bg-black-surface-2 border border-black-border flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-white-dim" />
      </div>
      <div className="min-w-0">
        <div className={cn('text-lg font-bold tracking-tight', colorClasses[color] || colorClasses.white)}>{value}</div>
        <div className="text-[11px] text-white-dim font-medium">{label}</div>
        <div className="text-[10px] text-white-dim/40">{hint}</div>
      </div>
    </div>
  );
}

export function ChartCard({ title, subtitle, children, icon: Icon }: any) {
  return (
    <div className="glass-card border border-black-border overflow-hidden">
      <div className="px-5 py-4 border-b border-black-border">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-red" />}
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
        <p className="text-[10px] text-white-dim mt-0.5">{subtitle}</p>
      </div>
      <div className="p-5">
        {children}
      </div>
    </div>
  );
}

export function EmptyChart() {
  return (
    <div className="h-48 flex flex-col items-center justify-center">
      <BarChart3 className="w-8 h-8 text-white-dim mb-2" />
      <p className="text-xs text-white-dim">Sem dados para exibir</p>
    </div>
  );
}

export function BarChartWrapper({ data, dataKey = 'horas', color = '#ef4444' }: any) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis dataKey="name" tick={{ fill: '#888', fontSize: 11 }} axisLine={{ stroke: '#333' }} />
        <YAxis tick={{ fill: '#888', fontSize: 11 }} axisLine={{ stroke: '#333' }} />
        <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, color: '#fff' }} formatter={(v: number) => [`${v}h`, 'Horas']} />
        <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function PieChartWrapper({ data }: any) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value"
          label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
          {data.map((_e: any, i: number) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
        </Pie>
        <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, color: '#fff' }} formatter={(v: number) => [`${v}h`, 'Horas']} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 11, color: '#888' }} />
      </PieChart>
    </ResponsiveContainer>
  );
}
