import { STATUS_CONFIG, HOTFIX_STATUS_CONFIG, SEVERITY_CONFIG } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface Props {
  status: string;
  variant?: 'patch' | 'hotfix' | 'severity';
  className?: string;
}

export function StatusPill({ status, variant = 'patch', className }: Props) {
  const config =
    variant === 'patch'
      ? STATUS_CONFIG[status]
      : variant === 'hotfix'
        ? { ...HOTFIX_STATUS_CONFIG[status], bg: `${HOTFIX_STATUS_CONFIG[status]?.color}1F` }
        : { ...SEVERITY_CONFIG[status], bg: `${SEVERITY_CONFIG[status]?.color}1F` };

  if (!config) return null;

  const isCritical = variant === 'severity' && status === 'critical';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium',
        isCritical && 'animate-pulse-red',
        className
      )}
      style={{ color: config.color, backgroundColor: (config as any).bg }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: config.color }} />
      {config.label}
    </span>
  );
}
