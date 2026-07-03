import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

export const CHART_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];

export function SummaryCard({ icon: Icon, label, value, sub, color }: any) {
  const colorMap: Record<string, any> = {
    red: { bg: 'bg-red/10', text: 'text-red', border: 'border-red/20' },
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20' },
    green: { bg: 'bg-green-500/10', text: 'text-green-500', border: 'border-green-500/20' },
    yellow: { bg: 'bg-yellow-500/10', text: 'text-yellow-500', border: 'border-yellow-500/20' },
  };
  const c = colorMap[color] || colorMap.red;
  return (
    <div className={cn('glass-card p-4 border', c.border)}>
      <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center mb-3', c.bg)}>
        <Icon className={cn('w-4 h-4', c.text)} />
      </div>
      <div className="text-xl font-bold">{value}</div>
      <div className="text-[10px] text-white-dim mt-0.5">{label}</div>
      <div className="text-[10px] text-white-dim/60 mt-1">{sub}</div>
    </div>
  );
}

export function StatPill({ icon: Icon, label, value, hint }: any) {
  return (
    <div className="glass-card p-4 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-black-surface-2 border border-black-border flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-white-dim" />
      </div>
      <div>
        <div className="text-sm font-semibold">{value}</div>
        <div className="text-[10px] text-white-dim">{label}</div>
        <div className="text-[9px] text-white-dim/50">{hint}</div>
      </div>
    </div>
  );
}

export function ChartCard({ title, subtitle, children }: any) {
  return (
    <div className="glass-card p-5">
      <h3 className="text-sm font-semibold mb-1">{title}</h3>
      <p className="text-[10px] text-white-dim mb-4">{subtitle}</p>
      {children}
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
