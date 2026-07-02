import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await useAuthStore.getState().register(form.name, form.email, form.password);
      } else {
        await login(form.email, form.password);
      }
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Erro ao autenticar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
        backgroundSize: '40px 40px'
      }} />

      <div className="w-full max-w-md mx-4">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-red-gradient flex items-center justify-center shadow-red-glow">
            <Layers className="w-6 h-6 text-[#FFFFFF]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Note <span className="text-red">Patch</span>
            </h1>
            <p className="text-xs text-white-dim">Repository & Version Control</p>
          </div>
        </div>

        <div className="glass-card border border-black-border p-6 md:p-8 rounded-2xl shadow-2xl">
          <h2 className="text-lg font-semibold mb-1">
            {isRegister ? 'Criar conta' : 'Entrar'}
          </h2>
          <p className="text-sm text-white-dim mb-6">
            {isRegister ? 'Preencha seus dados para se registrar' : 'Use suas credenciais para acessar'}
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-soft border border-red-30 text-sm text-red">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-xs font-medium text-white-dim mb-1.5">Nome completo</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required={isRegister}
                  className="w-full bg-black-surface-2 border border-black-border rounded-lg px-4 py-2.5 text-sm text-white placeholder-white-dim focus:border-red focus:outline-none transition-colors"
                  placeholder="Seu nome"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-white-dim mb-1.5">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                className="w-full bg-black-surface-2 border border-black-border rounded-lg px-4 py-2.5 text-sm text-white placeholder-white-dim focus:border-red focus:outline-none transition-colors"
                placeholder="nome@empresa.com"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-white-dim mb-1.5">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  className="w-full bg-black-surface-2 border border-black-border rounded-lg px-4 py-2.5 pr-10 text-sm text-white placeholder-white-dim focus:border-red focus:outline-none transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white-dim hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={cn(
                'w-full btn-primary flex items-center justify-center gap-2 py-2.5',
                loading && 'opacity-70 cursor-not-allowed'
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Aguarde...
                </>
              ) : (
                isRegister ? 'Criar conta' : 'Entrar'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => { setIsRegister(!isRegister); setError(''); }}
              className="text-sm text-white-dim hover:text-red transition-colors"
            >
              {isRegister ? 'Ja tem conta? Entrar' : 'Nao tem conta? Registrar'}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-white-dim mt-6">
          Super usuario: arthur@empresa.com / admin123
        </p>
      </div>
    </div>
  );
}
