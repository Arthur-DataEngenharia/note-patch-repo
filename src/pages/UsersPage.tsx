import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Plus, Shield, UserCheck, UserX, Loader2 } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/api/client';
import { cn, getInitials } from '@/lib/utils';

const ROLES = [
  { value: 'admin', label: 'Administrador', color: 'text-red' },
  { value: 'editor', label: 'Editor', color: 'text-blue-400' },
  { value: 'reviewer', label: 'Revisor', color: 'text-amber-400' },
  { value: 'viewer', label: 'Visualizador', color: 'text-white-dim' },
];

export function UsersPage() {
  const navigate = useNavigate();
  const { users, currentUser } = useAppStore();
  const { user: authUser } = useAuthStore();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'viewer' });
  const [error, setError] = useState('');

  const isAdmin = authUser?.role === 'admin' || currentUser.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <Shield className="w-12 h-12 text-red mb-4" />
        <h2 className="text-lg font-semibold mb-2">Acesso restrito</h2>
        <p className="text-sm text-white-dim">Apenas administradores podem acessar esta pagina.</p>
        <button onClick={() => navigate('/dashboard')} className="mt-4 btn-primary text-sm">
          Voltar ao Dashboard
        </button>
      </div>
    );
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.register(form.name, form.email, form.password, form.role);
      setShowModal(false);
      setForm({ name: '', email: '', password: '', role: 'viewer' });
      window.location.reload();
    } catch (err: any) {
      setError(err.message || 'Erro ao criar usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Users className="w-5 h-5 text-red" />
            Controle de Acessos
          </h1>
          <p className="text-sm text-white-dim mt-1">Gerencie usuarios e permissoes do sistema</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Novo Usuario
        </button>
      </div>

      <div className="glass-card border border-black-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black-border">
              <th className="text-left px-4 py-3 text-xs font-semibold text-white-dim uppercase">Usuario</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-white-dim uppercase">Email</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-white-dim uppercase">Permissao</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-white-dim uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const role = ROLES.find((r) => r.value === u.role);
              return (
                <tr key={u.id} className="border-b border-border-50 hover:bg-hover transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-red-soft border border-red-30 flex items-center justify-center text-xs font-bold text-red shrink-0">
                        {getInitials(u.name)}
                      </div>
                      <span className="font-medium">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-white-dim">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={cn('text-xs font-semibold uppercase', role?.color)}>
                      {role?.label || u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-xs text-green-400">
                      <UserCheck className="w-3.5 h-3.5" /> Ativo
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-card border border-black-border rounded-xl p-6 shadow-2xl">
            <h3 className="text-lg font-semibold mb-4">Novo Usuario</h3>
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
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white-dim mb-1">Email</label>
                <input
                  type="email" required value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-black-surface-2 border border-black-border rounded-lg px-3 py-2 text-sm text-white focus:border-red focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white-dim mb-1">Senha</label>
                <input
                  type="password" required value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-black-surface-2 border border-black-border rounded-lg px-3 py-2 text-sm text-white focus:border-red focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white-dim mb-1">Permissao</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full bg-black-surface-2 border border-black-border rounded-lg px-3 py-2 text-sm text-white focus:border-red focus:outline-none"
                >
                  {ROLES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
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
