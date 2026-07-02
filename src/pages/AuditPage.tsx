import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Download, ScrollText, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/store/appStore';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { formatDateTime } from '@/lib/utils';
import { exportAuditToCsv } from '@/lib/export';

const ACTION_LABELS: Record<string, string> = {
  create: 'Criação',
  update: 'Atualização',
  delete: 'Exclusão',
  export: 'Exportação',
  archive: 'Arquivamento',
  publish: 'Publicação',
};

const ACTION_COLORS: Record<string, string> = {
  create: '#22C55E',
  update: '#3B82F6',
  delete: '#E11D48',
  export: '#A855F7',
  archive: '#888888',
  publish: '#F59E0B',
};

export default function AuditPage() {
  const { auditLogs, users } = useAppStore();
  const [userFilter, setUserFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const filtered = useMemo(() => {
    return auditLogs.filter((log) => {
      if (userFilter && log.userId !== userFilter) return false;
      if (actionFilter && log.action !== actionFilter) return false;
      return true;
    });
  }, [auditLogs, userFilter, actionFilter]);

  const exportCsv = () => {
    exportAuditToCsv(
      filtered.map((l) => ({
        timestamp: formatDateTime(l.timestamp),
        user: l.userName,
        action: ACTION_LABELS[l.action] ?? l.action,
        entity: l.entity,
        detail: JSON.stringify(l.details),
      }))
    );
    toast.success('Auditoria exportada como CSV');
  };

  return (
    <div>
      <PageHeader
        title="Trilha de Auditoria"
        description="Log imutável de todas as ações no sistema"
        actions={
          <button onClick={exportCsv} className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        }
      />

      {/* Tabs Histórico */}
      <div className="flex gap-1 mb-6 border-b border-black-border">
        <Link
          to="/history/hotfix"
          className="px-4 py-2 text-sm font-medium text-white-muted hover:text-white transition-colors"
        >
          🔥 Hotfix
        </Link>
        <Link to="/history/audit" className="px-4 py-2 text-sm font-medium text-red border-b-2 border-red">
          Auditoria
        </Link>
      </div>

      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <select value={userFilter} onChange={(e) => setUserFilter(e.target.value)} className="input-base w-52">
          <option value="">Todos os usuários</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
        <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} className="input-base w-44">
          <option value="">Todas as ações</option>
          {Object.entries(ACTION_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <span className="flex items-center gap-1.5 text-[11px] text-white-dim ml-auto">
          <Lock className="w-3 h-3" /> Logs append-only (imutáveis)
        </span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={ScrollText} title="Nenhum registro" description="Sem logs com os filtros atuais." />
      ) : (
        <div className="glass-card overflow-hidden animate-fade-in">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-black-border text-left">
                <th className="px-4 py-3 text-[11px] uppercase tracking-wide text-white-muted font-medium">Timestamp</th>
                <th className="px-4 py-3 text-[11px] uppercase tracking-wide text-white-muted font-medium">Usuário</th>
                <th className="px-4 py-3 text-[11px] uppercase tracking-wide text-white-muted font-medium">Ação</th>
                <th className="px-4 py-3 text-[11px] uppercase tracking-wide text-white-muted font-medium">Entidade</th>
                <th className="px-4 py-3 text-[11px] uppercase tracking-wide text-white-muted font-medium">Detalhe</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => (
                <tr key={log.id} className="border-b border-border-50 hover:bg-hover transition-colors">
                  <td className="px-4 py-3 text-xs font-mono text-white-muted">{formatDateTime(log.timestamp)}</td>
                  <td className="px-4 py-3 text-xs">{log.userName}</td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium"
                      style={{
                        color: ACTION_COLORS[log.action],
                        backgroundColor: `${ACTION_COLORS[log.action]}1F`,
                      }}
                    >
                      {ACTION_LABELS[log.action]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs capitalize text-white-muted">{log.entity}</td>
                  <td className="px-4 py-3 text-[11px] font-mono text-white-dim truncate max-w-[200px]">
                    {JSON.stringify(log.details)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
