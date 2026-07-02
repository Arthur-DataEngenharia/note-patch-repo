import { useState, useEffect } from 'react';
import { Github, CheckCircle2, XCircle, RefreshCw, GitBranch, Star, Eye, EyeOff, Loader2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/PageHeader';
import { api } from '@/api/client';
import { cn } from '@/lib/utils';
import RepoDetailModal from '@/components/github/RepoDetailModal';

interface Repo {
  id: number;
  name: string;
  fullName: string;
  description: string;
  url: string;
  stars: number;
  forks: number;
  language: string;
  updatedAt: string;
  isPrivate: boolean;
  owner: string;
}

export default function GitHubPage() {
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [connected, setConnected] = useState(false);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<Repo | null>(null);

  useEffect(() => {
    loadRepos();
  }, []);

  const loadRepos = async () => {
    setLoading(true);
    try {
      const data = await api.getGitHubRepos();
      setRepos(data.repos || []);
      setConnected(data.repos?.length > 0);
    } catch {
      setConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!token.trim()) return;
    setConnecting(true);
    try {
      await api.connectGitHub(token.trim());
      toast.success('GitHub conectado com sucesso');
      setConnected(true);
      await loadRepos();
    } catch (err: any) {
      toast.error(err.message || 'Token invalido');
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Integracao GitHub"
        description="Conecte patches diretamente ao codigo-fonte"
        actions={
          <button onClick={loadRepos} disabled={loading} className="btn-secondary flex items-center gap-2">
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} /> Atualizar
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Connection config */}
        <div className="glass-card p-6">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Github className="w-4 h-4 text-red" /> Conexao
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
            {connected ? 'Conectado ao GitHub' : 'Desconectado'}
          </div>

          <label className="text-xs text-white-muted mb-1.5 block">Personal Access Token</label>
          <div className="relative mb-4">
            <input
              type={showToken ? 'text' : 'password'}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxx"
              className="w-full bg-black-surface-2 border border-black-border rounded-lg px-3 py-2 pr-10 font-mono text-xs text-white placeholder-white-dim focus:border-red focus:outline-none"
            />
            <button
              onClick={() => setShowToken(!showToken)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white-dim hover:text-white"
            >
              {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[10px] text-white-dim mb-4">
            Crie um token em github.com/settings/tokens com permissao repo.
          </p>

          <button
            onClick={handleConnect}
            disabled={connecting || !token.trim()}
            className={cn('w-full btn-primary flex items-center justify-center gap-2', (connecting || !token.trim()) && 'opacity-70')}
          >
            {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Conectar'}
          </button>
        </div>

        {/* Repos */}
        <div className="lg:col-span-2 glass-card p-6">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-red" /> Repositorios ({repos.length})
          </h2>

          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-red" />
            </div>
          ) : repos.length === 0 ? (
            <div className="text-center py-12">
              <Github className="w-10 h-10 text-white-dim mx-auto mb-3" />
              <p className="text-sm text-white-dim">Nenhum repositorio carregado</p>
              <p className="text-xs text-white-muted mt-1">Conecte seu token do GitHub para ver seus repos</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {repos.map((repo) => (
                <div
                  key={repo.id}
                  className="group p-4 rounded-lg border border-black-border hover:border-red-40 bg-surface-2-20 hover:bg-hover transition-all cursor-pointer"
                  onClick={() => setSelectedRepo(repo)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-mono text-xs font-semibold truncate">{repo.fullName}</p>
                    <div className="flex items-center gap-1.5">
                      {repo.isPrivate && (
                        <span className="text-[10px] bg-black-surface border border-black-border rounded px-1.5 py-0.5">Private</span>
                      )}
                      <a
                        href={repo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 rounded hover:bg-black-surface-2 text-white-dim hover:text-white transition-colors"
                        title="Abrir no GitHub"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                  <p className="text-xs text-white-dim line-clamp-2 mb-3 min-h-[2.5em]">{repo.description || 'Sem descricao'}</p>
                  <div className="flex items-center gap-4 text-[10px] text-white-muted">
                    {repo.language && <span>{repo.language}</span>}
                    <span className="flex items-center gap-1"><Star className="w-3 h-3" /> {repo.stars}</span>
                    <span className="flex items-center gap-1"><GitBranch className="w-3 h-3" /> {repo.forks}</span>
                    <span className="ml-auto text-red opacity-0 group-hover:opacity-100 transition-opacity">Explorar &rarr;</span>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>

      {selectedRepo && (
        <RepoDetailModal
          owner={selectedRepo.owner}
          repo={selectedRepo.name}
          onClose={() => setSelectedRepo(null)}
        />
      )}
    </div>
  );
}
