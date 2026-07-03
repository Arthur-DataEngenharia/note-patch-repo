import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X, Check } from 'lucide-react';
import { format, addYears, subYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const MONTHS = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

interface MonthPickerProps {
  value: string; // yyyy-MM
  onChange: (value: string) => void;
}

export function MonthPicker({ value, onChange }: MonthPickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewYear, setViewYear] = useState(() => {
    if (value) return parseInt(value.split('-')[0], 10);
    return new Date().getFullYear();
  });

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  const selectedYear = value ? parseInt(value.split('-')[0], 10) : null;
  const selectedMonth = value ? parseInt(value.split('-')[1], 10) : null;

  const displayValue = value
    ? format(new Date(value + '-01'), "MMMM 'de' yyyy", { locale: ptBR })
    : 'Selecionar mês...';

  const handleSelect = (monthIdx: number) => {
    const iso = `${viewYear}-${String(monthIdx + 1).padStart(2, '0')}`;
    onChange(iso);
    setOpen(false);
  };

  const handleClear = () => {
    onChange('');
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="input-base w-full text-sm pl-9 pr-8 text-left flex items-center gap-2 min-h-[38px] relative"
      >
        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white-dim" />
        <span className={cn('text-sm truncate', !value && 'text-white-dim')}>
          {displayValue}
        </span>
        <ChevronLeft
          className={cn(
            'absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white-dim transition-transform shrink-0',
            open && 'rotate-[-90deg]'
          )}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-[280px] glass-card border border-black-border shadow-2xl rounded-xl overflow-hidden animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-black-border">
            <button
              type="button"
              onClick={() => setViewYear((y) => y - 1)}
              className="p-1 rounded-lg hover:bg-black-surface-2 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-white-dim" />
            </button>
            <span className="text-sm font-semibold">{viewYear}</span>
            <button
              type="button"
              onClick={() => setViewYear((y) => y + 1)}
              className="p-1 rounded-lg hover:bg-black-surface-2 transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-white-dim" />
            </button>
          </div>

          {/* Months grid */}
          <div className="grid grid-cols-3 gap-1 p-3">
            {MONTHS.map((m, i) => {
              const isSelected = selectedYear === viewYear && selectedMonth === i + 1;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleSelect(i)}
                  className={cn(
                    'py-2.5 rounded-lg text-xs font-medium transition-colors text-center',
                    isSelected
                      ? 'bg-red text-white font-semibold'
                      : 'text-white hover:bg-black-surface-2'
                  )}
                >
                  {m}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-3 py-2 border-t border-black-border bg-black-surface-2/30">
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-red hover:text-red-light transition-colors"
            >
              Limpar
            </button>
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                handleSelect(now.getMonth());
              }}
              className="text-xs text-red hover:text-red-light transition-colors font-medium"
            >
              Mês atual
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
