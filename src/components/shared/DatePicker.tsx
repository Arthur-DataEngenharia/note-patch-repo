import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay, startOfWeek, endOfWeek, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const WEEK_DAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

interface DatePickerProps {
  value: string; // yyyy-mm-dd
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

export function DatePicker({ value, onChange, placeholder = 'dd/mm/aaaa', required }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (value) return new Date(value + 'T00:00:00');
    return new Date();
  });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const selectedDate = value ? new Date(value + 'T00:00:00') : null;

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const displayValue = selectedDate
    ? format(selectedDate, 'dd/MM/yyyy', { locale: ptBR })
    : '';

  const handleSelect = (day: Date) => {
    const iso = format(day, 'yyyy-MM-dd');
    onChange(iso);
    setOpen(false);
  };

  const handleClear = () => {
    onChange('');
    setOpen(false);
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    handleSelect(today);
  };

  return (
    <div ref={containerRef} className="relative">
      <div
        className="input-base w-full text-sm pl-10 pr-9 flex items-center cursor-pointer min-h-[38px]"
        onClick={() => setOpen((v) => !v)}
      >
        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white-dim pointer-events-none" />
        <span className={cn('text-sm', !displayValue && 'text-white-dim')}>
          {displayValue || placeholder}
        </span>
        {displayValue && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white-dim hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-50 mt-2 w-[280px] glass-card border border-black-border shadow-2xl rounded-xl overflow-hidden animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-black-border">
            <button
              type="button"
              onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
              className="p-1 rounded-lg hover:bg-black-surface-2 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-white-dim" />
            </button>
            <span className="text-sm font-semibold capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </span>
            <button
              type="button"
              onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
              className="p-1 rounded-lg hover:bg-black-surface-2 transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-white-dim" />
            </button>
          </div>

          {/* Week days */}
          <div className="grid grid-cols-7 px-2 pt-2">
            {WEEK_DAYS.map((d) => (
              <div key={d} className="text-center text-[10px] text-white-dim font-medium py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 px-2 pb-2 gap-0.5">
            {days.map((day) => {
              const inMonth = isSameMonth(day, currentMonth);
              const selected = selectedDate ? isSameDay(day, selectedDate) : false;
              const today = isToday(day);
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => handleSelect(day)}
                  disabled={!inMonth}
                  className={cn(
                    'h-8 w-8 mx-auto rounded-lg text-xs font-medium transition-colors flex items-center justify-center',
                    !inMonth && 'text-white-dim/30 pointer-events-none',
                    inMonth && !selected && 'text-white hover:bg-black-surface-2',
                    today && !selected && 'border border-red/40 text-red',
                    selected && 'bg-red text-white font-semibold'
                  )}
                >
                  {format(day, 'd')}
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
              onClick={handleToday}
              className="text-xs text-red hover:text-red-light transition-colors font-medium"
            >
              Hoje
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
