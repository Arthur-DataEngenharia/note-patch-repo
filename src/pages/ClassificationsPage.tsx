import { useMemo, useState } from 'react';
import { Tags, Plus, X, Loader2 } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { api } from '@/api/client';
import { PageHeader } from '@/components/shared/PageHeader';
import { cn } from '@/lib/utils';

const PRESET_COLORS = [
  '#3B82F6', '#22C55E', '#A855F7', '#F59E0B', '#06B6D4',
  '#EC4899', '#14B8A6', '#F97316', '#8B5CF6', '#10B981',
  '#6366F1', '#E11D48', '#DC2626', '#F43F5E', '#7C3AED',
];

export default function ClassificationsPage() {
  const { classifications, patches } = useAppStore();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', color: PRESET_COLORS[0], sortOrder: 0 });
  const [error, setError] = useState('');

  const withCounts = useMemo(() => {
    return classifications.map((c) => ({
      ...c,
      patchCount: patches.filter((p) => p.classificationId === c.id).length,
    }));
  }, [classifications, patches]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.createClassification(form);
      setShowModal(false);
      setForm({ name: '', description: '', color: PRESET_COLORS[0], sortOrder: 0 });
      window.location.reload();
    } catch (err: any) {
      setError(err.message || 'Erro ao criar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Classificacoes"
        description="Modulos de negocio para categorizar os patches"
        actions={
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" /> Nova Classificacao
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-stagger">
        {withCounts.map((c) => (
          <div
            key={c.id}
            className="glass-card p-5 hover:border-red-30 transition-all duration-200 group"
            style={{ borderLeftWidth: 3, borderLeftColor: c.color }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${c.color}1F` }}
                >
                  <Tags className="w-4 h-4" style={{ color: c.color }} />
                </span>
                <h3 className="text-sm font-semibold">{c.name}</h3>
              </div>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ color: c.color, backgroundColor: `${c.color}1F` }}
              >
                {c.patchCount}
              </span>
            </div>
            <p className="text-xs text-white-muted">{c.description}</p>
            <div className="flex items-center gap-2 mt-3 text-[10px] text-white-dim">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: c.isActive ? '#22C55E' : 'var(--color-text-dim)' }}
              />
              {c.isActive ? 'Ativa' : 'Inativa'}
              <span className="font-mono ml-auto">{c.color}</span>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-card border border-black-border rounded-xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Nova Classificacao</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-hover text-white-dim">
                <X className="w-4 h-4" />
              </button>
            </div>
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-soft border border-red-30 text-sm text-red">{error}</div>
            )}
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-white-dim mb-1">Nome</label>
                <input
                  type="text" required value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-black-surface-2 border border-black-border rounded-lg px-3 py-2 text-sm text-white focus:border-red focus:outline-none"
                  placeholder="Ex: Fiscal"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white-dim mb-1">Descricao</label>
                <input
                  type="text" required value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-black-surface-2 border border-black-border rounded-lg px-3 py-2 text-sm text-white focus:border-red focus:outline-none"
                  placeholder="Ex: NFs, SPED, eSocial"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white-dim mb-1">Cor</label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setForm({ ...form, color })}
                      className={cn(
                        'w-7 h-7 rounded-lg border-2 transition-all',
                        form.color === color ? 'border-white scale-110' : 'border-transparent hover:border-white/30'
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-white-dim mb-1">Ordem</label>
                <input
                  type="number" value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                  className="w-full bg-black-surface-2 border border-black-border rounded-lg px-3 py-2 text-sm text-white focus:border-red focus:outline-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-2 rounded-lg border border-black-border text-sm hover:bg-hover transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className="flex-1 btn-primary py-2 text-sm flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
