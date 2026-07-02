import { AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger',
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;

  const colors = {
    danger: 'text-red border-red/30 bg-red/10',
    warning: 'text-amber-400 border-amber-400/30 bg-amber-400/10',
    info: 'text-blue-400 border-blue-400/30 bg-blue-400/10',
  };

  const btnColors = {
    danger: 'btn-primary bg-red hover:bg-red-glow',
    warning: 'btn-primary bg-amber-500 hover:bg-amber-600',
    info: 'btn-primary',
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="glass-card border border-black-border rounded-xl max-w-sm w-full p-6 shadow-2xl animate-scale-in">
        <div className="flex items-start gap-3 mb-4">
          <div className={cn('w-10 h-10 rounded-lg border flex items-center justify-center shrink-0', colors[variant])}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">{title}</h3>
            <p className="text-xs text-white-dim mt-1 leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2">
          <button onClick={onCancel} className="btn-secondary text-xs px-4 py-2">
            {cancelLabel}
          </button>
          <button onClick={onConfirm} className={cn('text-xs px-4 py-2', btnColors[variant])}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
