import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Eye, Edit, Check, X } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { PageHeader } from '@/components/shared/PageHeader';
import { Breadcrumb } from '@/components/shared/Breadcrumb';
import { cn } from '@/lib/utils';

interface PermConfig {
  screen: string;
  gerente: boolean;
  supervisor: boolean;
  desenvolvedor: boolean;
  processo: boolean;
  qa: boolean;
  viewer: boolean;
}

const DEFAULT_PERMS: PermConfig[] = [
  { screen: 'Dashboard', gerente: true, supervisor: true, desenvolvedor: true, processo: true, qa: true, viewer: true },
  { screen: 'Projetos (Kanban)', gerente: true, supervisor: true, desenvolvedor: true, processo: true, qa: true, viewer: true },
  { screen: 'Calendario', gerente: true, supervisor: true, desenvolvedor: true, processo: true, qa: true, viewer: true },
  { screen: 'Criar Projeto', gerente: true, supervisor: true, desenvolvedor: false, processo: false, qa: false, viewer: false },
  { screen: 'Publicar Etapa', gerente: true, supervisor: true, desenvolvedor: true, processo: true, qa: true, viewer: false },
  { screen: 'Patches', gerente: true, supervisor: true, desenvolvedor: true, processo: true, qa: true, viewer: true },
  { screen: 'Hotfixes', gerente: true, supervisor: true, desenvolvedor: true, processo: true, qa: true, viewer: true },
  { screen: 'Documentos', gerente: true, supervisor: true, desenvolvedor: true, processo: true, qa: true, viewer: true },
  { screen: 'GitHub', gerente: true, supervisor: true, desenvolvedor: true, processo: false, qa: false, viewer: false },
  { screen: 'Classificacoes', gerente: true, supervisor: true, desenvolvedor: true, processo: true, qa: true, viewer: true },
  { screen: 'Timeline', gerente: true, supervisor: true, desenvolvedor: true, processo: true, qa: true, viewer: true },
  { screen: 'Auditoria', gerente: true, supervisor: true, desenvolvedor: false, processo: false, qa: false, viewer: false },
  { screen: 'Usuarios', gerente: true, supervisor: true, desenvolvedor: false, processo: false, qa: false, viewer: false },
  { screen: 'Historico', gerente: true, supervisor: true, desenvolvedor: false, processo: false, qa: false, viewer: false },
  { screen: 'Permissoes', gerente: true, supervisor: false, desenvolvedor: false, processo: false, qa: false, viewer: false },
  { screen: 'Configuracoes', gerente: true, supervisor: true, desenvolvedor: true, processo: true, qa: true, viewer: false },
];

const ROLES = ['gerente', 'supervisor', 'desenvolvedor', 'processo', 'qa', 'viewer'] as const;
const ROLE_LABELS: Record<string, string> = {
  gerente: 'Gerente',
  supervisor: 'Supervisor',
  desenvolvedor: 'Dev',
  processo: 'Processo',
  qa: 'QA',
  viewer: 'Viewer',
};

export default function PermissionsPage() {
  const { currentUser } = useAppStore();
  const [perms, setPerms] = useState<PermConfig[]>(DEFAULT_PERMS);
  const [saved, setSaved] = useState(false);

  const canAccess = currentUser.role === 'gerente' || currentUser.role === 'admin';
  if (!canAccess) {
    return (
      <div className="text-center py-16 animate-fade-in">
        <p className="text-white-muted mb-4">Acesso restrito a Gerentes.</p>
        <Link to="/dashboard" className="btn-primary">Voltar</Link>
      </div>
    );
  }

  const togglePerm = (screenIdx: number, role: string) => {
    setPerms((prev) =>
      prev.map((p, i) => (i === screenIdx ? { ...p, [role]: !p[role as keyof PermConfig] } : p))
    );
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem('permissions', JSON.stringify(perms));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="animate-fade-in">
      <Breadcrumb items={[{ label: 'Permissoes' }]} />
      <PageHeader
        title="Gerenciamento de Permissoes"
        subtitle="Controle quem pode acessar cada tela do sistema"
        actions={
          <button
            onClick={handleSave}
            className={cn('btn-primary text-xs px-4 py-2', saved && 'bg-green-600')}
          >
            {saved ? 'Salvo!' : 'Salvar'}
          </button>
        }
      />

      <div className="mt-6 glass-card overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-black-border">
              <th className="text-left p-3 font-semibold text-white-muted">Tela</th>
              {ROLES.map((role) => (
                <th key={role} className="text-center p-3 font-semibold text-white-muted min-w-[70px]">
                  {ROLE_LABELS[role]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-black-border">
            {perms.map((perm, i) => (
              <tr key={perm.screen} className="hover:bg-black-surface-2/50 transition-colors">
                <td className="p-3 font-medium">{perm.screen}</td>
                {ROLES.map((role) => (
                  <td key={role} className="p-3 text-center">
                    <button
                      onClick={() => togglePerm(i, role)}
                      className={cn(
                        'w-6 h-6 rounded flex items-center justify-center transition-colors mx-auto',
                        perm[role as keyof PermConfig]
                          ? 'bg-green-500/20 text-green-500 border border-green-500/30'
                          : 'bg-red/10 text-red border border-red/20'
                      )}
                    >
                      {perm[role as keyof PermConfig] ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    </button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 glass-card p-4">
        <h3 className="text-xs font-semibold mb-2 flex items-center gap-2">
          <Shield className="w-4 h-4 text-red" />
          Regras de Workflow
        </h3>
        <ul className="text-xs text-white-dim space-y-1.5">
          <li><span className="text-white font-medium">Gerente/Supervisor:</span> Podem criar projetos, ver historico, gerenciar permissoes e usuarios.</li>
          <li><span className="text-white font-medium">Processo:</span> Publica a etapa de processo, passando para desenvolvimento.</li>
          <li><span className="text-white font-medium">Desenvolvedor:</span> Publica desenvolvimento e hotfix (apos QA).</li>
          <li><span className="text-white font-medium">QA:</span> Publica etapa de QA, enviando para revisao de hotfix.</li>
          <li><span className="text-white font-medium">Viewer:</span> Somente visualizacao de conteudo publico.</li>
        </ul>
      </div>
    </div>
  );
}
