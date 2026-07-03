import { useState } from 'react';
import { X, Plus, Calendar, FileText, User, Briefcase, ChevronDown, AlertCircle } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { cn, formatDate } from '@/lib/utils';

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
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white-dim" />
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                required
                className="input-base w-full text-sm pl-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[ 
              { label: 'Processo', id: processoId, setId: setProcessoId, list: processoUsers },
              { label: 'Dev', id: devId, setId: setDevId, list: devUsers },
              { label: 'QA', id: qaId, setId: setQaId, list: qaUsers },
            ].map((field) => (
              <div key={field.label}>
                <label className="text-[10px] text-white-dim uppercase mb-1.5 block">{field.label}</label>
                <div className="relative">
                  <select
                    value={field.id}
                    onChange={(e) => field.setId(e.target.value)}
                    className="input-base w-full text-sm appearance-none pr-8 cursor-pointer"
                    style={{ backgroundColor: '#1a1a1a' }}
                  >
                    <option value="">Selecionar...</option>
                    {field.list.map((u) => (
                      <option key={u.id} value={u.id} style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>{u.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white-dim pointer-events-none" />
                </div>
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
