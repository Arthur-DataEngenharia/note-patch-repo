import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Crumb {
  label: string;
  to?: string;
}

interface Props {
  items: Crumb[];
  className?: string;
}

export function Breadcrumb({ items, className }: Props) {
  return (
    <nav className={cn('flex items-center gap-1.5 text-[11px] text-white-dim mb-4', className)} aria-label="Breadcrumb">
      <Link to="/" className="flex items-center gap-1 hover:text-red transition-colors">
        <Home className="w-3 h-3" />
        <span>Inicio</span>
      </Link>
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <ChevronRight className="w-3 h-3 text-white-muted" />
          {item.to ? (
            <Link to={item.to} className="hover:text-red transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-white font-medium">{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}
