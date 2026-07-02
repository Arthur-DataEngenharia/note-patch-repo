import { useState } from 'react';
import { Github, CheckCircle2, XCircle, RefreshCw, GitBranch, Webhook, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/PageHeader';
import { cn, formatRelative } from '@/lib/utils';

interface MonitoredRepo {
  name: string;
  enabled: boolean;
  lastSync: Date;
  branch: string;
}

const INITIAL_REPOS: MonitoredRepo[] = [
  { name: 'empresa/sankhya-fiscal', enabled: true, lastSync: new Date(Date.now() - 20 * 60000), branch: 'main' },
  { name: 'empresa/sankhya-financeiro', enabled: true, lastSync: new Date(Date.now() - 45 * 60000), branch: 'main' },
  { name: 'empresa/sankhya-comercial', enabled: true, lastSync: new Date(Date.now() - 3 * 3600000), branch: 'main' },
  { name: 'empresa/portal-parceiro', enabled: false, lastSync: new Date(Date.now() - 26 * 3600000), branch: 'main' },
  { name: 'empresa/sankhya-logistica', enabled: true, lastSync: new Date(Date.now() - 60 * 60000), branch: 'main' },
];

export default function GitHubPage() {
  const [token, setToken] = useState('ghp_****************************');
  const [showToken, setShowToken] = useState(false);
  const [connected, setConnected] = useState(true);
  const [autoSync, setAutoSync] = useState(true);
  const [repos, setRepos] = useState(INITIAL_REPOS);

  const toggleRepo = (name: string) => {
    setRepos((prev) => prev.map((r) => (r.name === name ? { ...r, enabled: !r.enabled } : r)));
  };

  const syncNow = () => {
    setRepos((prev) => prev.map((r) => (r.enabled ? { ...r, lastSync: new Date() } : r)));
    toast.success('Sincronização concluída', {
      description: 'Todos os repositórios ativos foram sincronizados.',
    });
  };

  return (
    <div>
      <PageHeader
        title="Integração GitHub"
        description="Conecte patches diretamente ao código-fonte"
        actions={
          <button onClick={syncNow} className="btn-secondary flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Sincronizar agora
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Connection config */}
        <div className="glass-card p-6">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Github className="w-4 h-4 text-red" /> Conexão
          </h2>

          <div
            className={cn(
              'flex items-center gap-2 p-3 rounded-lg mb-4 text-sm',
              connected
                ? 'bg-green-500/10 border border-green-500/30 text-green-500'
                : 'bg-red-soft border border-red-30 text-red'
            )}
          >
            {connected ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            {connected ? 'Conectado à organização "empresa"' : 'Desconectado'}
          </div>

          <label className="text-xs text-white-muted mb-1.5 block">Personal Access Token</label>
          <div className="relative mb-4">
            <input
              type={showToken ? 'text' : 'password'}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="input-base pr-10 font-mono text-xs"
            />
            <button
              onClick={() => setShowToken(!showToken)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white-dim hover:text-white"
              aria-label={showToken ? 'Ocultar token' : 'Mostrar token'}
            >
              {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[10px] text-white-dim mb-4">
            O token é armazenado criptografado no backend. Nunca exposto no cliente.
          </p>

          <button
            onClick={() => {
              setConnected(!connected);
              toast.success(connected ? 'Desconectado' : 'Conectado com sucesso');
            }}
            className={connected ? 'btn-secondary w-full' : 'btn-primary w-full'}
          >
            {connected ? 'Desconectar' : 'Conectar'}
          </button>

          <div className="mt-6 pt-4 border-t border-black-border">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs flex items-center gap-2">
                <Webhook className="w-4 h-4 text-red" /> Sync automático de PRs
              </span>
              <input
                type="checkbox"
                checked={autoSync}
                onChange={(e) => setAutoSync(e.target.checked)}
                className="accent-red w-4 h-4"
              />
            </label>
            <p className="text-[10px] text-white-dim mt-2">
              Ao detectar PR mergeado em produção, um rascunho de note patch é criado automaticamente.
            </p>
          </div>
        </div>

        {/* Monitored repos */}
        <div className="lg:col-span-2 glass-card p-6">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-red" /> Repositórios Monitorados
          </h2>
          <div className="space-y-2">
            {repos.map((repo) => (
              <div
                key={repo.name}
                className={cn(
                  'flex items-center gap-4 p-4 rounded-lg border transition-all',
                  repo.enabled
                    ? 'bg-surface-2-60 border-black-border'
                    : 'bg-surface-2-20 border-border-50 opacity-60'
                )}
              >
                <Github className="w-4 h-4 text-white-muted shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-xs font-semibold truncate">{repo.name}</p>
                  <p className="text-[10px] text-white-dim">
                    branch: {repo.branch} · última sync {formatRelative(repo.lastSync)}
                  </p>
                </div>
                <span
                  className={cn(
                    'text-[10px] px-2 py-0.5 rounded-full font-medium',
                    repo.enabled ? 'text-green-500 bg-green-500/10' : 'text-white-dim bg-white/5'
                  )}
                >
                  {repo.enabled ? 'Ativo' : 'Inativo'}
                </span>
                <button
                  onClick={() => toggleRepo(repo.name)}
                  className={cn(
                    'relative w-10 h-5 rounded-full transition-colors',
                    repo.enabled ? 'bg-red' : 'bg-black-surface-2 border border-black-border'
                  )}
                  role="switch"
                  aria-checked={repo.enabled}
                  aria-label={`Alternar monitoramento de ${repo.name}`}
                >
                  <span
                    className={cn(
                      'absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all',
                      repo.enabled ? 'left-5' : 'left-0.5'
                    )}
                  />
                </button>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-white-dim mt-4">
            Em produção, esta lista é carregada via Octokit (GitHub API) com paginação e webhooks configurados
            para eventos de push/PR.
          </p>
        </div>
      </div>
    </div>
  );
}
