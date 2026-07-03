import { useState, useRef, useEffect } from 'react';
import { X, Plus, FileText, User, Briefcase, ChevronDown, AlertCircle, Check } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { cn } from '@/lib/utils';
import { DatePicker } from '@/components/shared/DatePicker';

interface UserSelectProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  options: { id: string; name: string }[];
}

function UserSelect({ label, value, onChange, options }: UserSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.id === value);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'input-base w-full text-sm pr-8 text-left flex items-center gap-2 transition-colors',
          selected ? 'text-white' : 'text-white-dim'
        )}
      >
        {selected ? (
          <span className="truncate">{selected.name}</span>
        ) : (
          <span>Selecionar...</span>
        )}
        <ChevronDown
          className={cn(
            'absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white-dim transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full glass-card border border-black-border shadow-2xl rounded-lg overflow-hidden animate-scale-in max-h-52 overflow-y-auto">
          <button
            type="button"
            onClick={() => { onChange(''); setOpen(false); }}
            className={cn(
              'w-full text-left px-3 py-2 text-xs transition-colors flex items-center justify-between',
              !value ? 'bg-red-soft text-red' : 'text-white-dim hover:bg-black-surface-2'
            )}
          >
            Selecionar...
            {!value && <Check className="w-3 h-3" />}
          </button>
          {options.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => { onChange(o.id); setOpen(false); }}
              className={cn(
                'w-full text-left px-3 py-2 text-xs transition-colors flex items-center justify-between',
                value === o.id ? 'bg-red-soft text-red' : 'text-white hover:bg-black-surface-2'
              )}
            >
              <span className="truncate">{o.name}</span>
              {value === o.id && <Check className="w-3 h-3 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface Props {
  onClose: () => void;
}

export function CreateProjectModal({ onClose }: Props) {
  const { users, addProject, currentUser } = useAppStore();
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'hotfix_emergencial' | 'patch_note'>('patch_note');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [processoId, setProcessoId] = useState('');
  const [devId, setDevId] = useState('');
  const [qaId, setQaId] = useState('');
  const [loading, setLoading] = useState(false);

  const processoUsers = users.filter((u) => u.role === 'processo');
  const devUsers = users.filter((u) => u.role === 'desenvolvedor');
  const qaUsers = users.filter((u) => u.role === 'qa');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !targetDate) return;
    setLoading(true);
    await addProject({
      title,
      type,
      description,
      targetDate: new Date(targetDate),
      processoId: processoId || undefined,
      devId: devId || undefined,
      qaId: qaId || undefined,
    });
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass-card w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in">
        <div className="flex items-center justify-between p-5 border-b border-black-border">
          <h2 className="text-base font-semibold">Novo Projeto</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-black-surface-2 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-[10px] text-white-dim uppercase mb-1.5 block">Tipo</label>
            <div className="flex gap-2">
              {(['patch_note', 'hotfix_emergencial'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={cn(
                    'flex-1 py-2 rounded-lg text-xs font-medium border transition-colors',
                    type === t
                      ? 'bg-red-soft text-red border-red-30'
                      : 'bg-black-surface-2 text-white-dim border-black-border hover:border-white-dim'
                  )}
                >
                  {t === 'patch_note' ? 'Note Patch' : 'Hotfix Emergencial'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] text-white-dim uppercase mb-1.5 block">Titulo</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nome do projeto..."
              required
              className="input-base w-full text-sm"
            />
          </div>

          <div>
            <label className="text-[10px] text-white-dim uppercase mb-1.5 block">Descricao</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descricao do projeto..."
              rows={3}
              className="input-base w-full text-sm resize-none"
            />
          </div>

          <div>
            <label className="text-[10px] text-white-dim uppercase mb-1.5 block">Data Prevista</label>
            <DatePicker
              value={targetDate}
              onChange={setTargetDate}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Processo', id: processoId, setId: setProcessoId, list: processoUsers },
              { label: 'Dev', id: devId, setId: setDevId, list: devUsers },
              { label: 'QA', id: qaId, setId: setQaId, list: qaUsers },
            ].map((field) => (
              <div key={field.label}>
                <label className="text-[10px] text-white-dim uppercase mb-1.5 block">{field.label}</label>
                <UserSelect
                  label={field.label}
                  value={field.id}
                  onChange={field.setId}
                  options={field.list.map((u) => ({ id: u.id, name: u.name }))}
                />
                {field.list.length === 0 && (
                  <div className="flex items-center gap-1 mt-1.5">
                    <AlertCircle className="w-3 h-3 text-amber-500" />
                    <span className="text-[10px] text-amber-500">Nenhum {field.label.toLowerCase()} cadastrado</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="pt-2 flex gap-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 text-sm py-2">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 text-sm py-2">
              {loading ? 'Criando...' : 'Criar Projeto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
