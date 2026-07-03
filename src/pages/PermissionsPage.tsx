import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Check,
  X,
  User,
  ChevronRight,
  Search,
  Save,
  RotateCcw,
  AlertTriangle,
  Lock,
  Unlock,
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { PageHeader } from '@/components/shared/PageHeader';
import { Breadcrumb } from '@/components/shared/Breadcrumb';
import { cn } from '@/lib/utils';

interface UserPermissions {
  role: string;
  screens: Record<string, boolean>;
}

const SCREEN_LIST = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'projects', label: 'Projetos' },
  { key: 'patches', label: 'Patches' },
  { key: 'hotfixes', label: 'Hotfixes' },
  { key: 'documents', label: 'Documentos' },
  { key: 'classifications', label: 'Classificacoes' },
  { key: 'github', label: 'GitHub' },
  { key: 'timeline', label: 'Timeline' },
  { key: 'audit', label: 'Auditoria' },
  { key: 'users', label: 'Usuarios' },
  { key: 'history', label: 'Historico' },
  { key: 'permissions', label: 'Permissoes' },
  { key: 'settings', label: 'Configuracoes' },
];

const ROLE_OPTIONS = [
  { value: 'gerente', label: 'Gerente', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  { value: 'supervisor', label: 'Supervisor', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  { value: 'desenvolvedor', label: 'Desenvolvedor', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
  { value: 'processo', label: 'Processo', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
  { value: 'qa', label: 'QA', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
  { value: 'viewer', label: 'Viewer', color: 'text-white-dim', bg: 'bg-white/5 border-white/10' },
];

function getRoleStyle(role: string) {
  return ROLE_OPTIONS.find((r) => r.value === role) || ROLE_OPTIONS[ROLE_OPTIONS.length - 1];
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

function loadPerms(): Record<string, UserPermissions> {
  try {
    const raw = localStorage.getItem('user-permissions');
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

function savePerms(perms: Record<string, UserPermissions>) {
  localStorage.setItem('user-permissions', JSON.stringify(perms));
}

export default function PermissionsPage() {
  const { users, currentUser } = useAppStore();
  const isManager = currentUser.role === 'gerente' || currentUser.role === 'supervisor' || currentUser.role === 'admin';

  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [perms, setPerms] = useState<Record<string, UserPermissions>>(loadPerms());
  const [savedId, setSavedId] = useState<string | null>(null);

  const filteredUsers = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (!isManager) {
    return (
      <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
        <Lock className="w-10 h-10 text-white-dim mb-4" />
        <p className="text-white-muted text-sm mb-2">Acesso restrito.</p>
        <p className="text-white-dim text-xs mb-6">Apenas Gerentes e Supervisores podem gerenciar permissoes.</p>
        <Link to="/dashboard" className="btn-primary text-sm px-4 py-2">Voltar</Link>
      </div>
    );
  }

  const selectedUser = users.find((u) => u.id === selectedUserId);

  const updateUserRole = (userId: string, newRole: string) => {
    setPerms((prev) => {
      const updated = {
        ...prev,
        [userId]: {
          ...prev[userId],
          role: newRole,
          screens: prev[userId]?.screens || {},
        },
      };
      savePerms(updated);
      return updated;
    });
  };

  const toggleScreen = (userId: string, screen: string) => {
    setPerms((prev) => {
      const userPerm = prev[userId] || { role: '', screens: {} };
      const updated = {
        ...prev,
        [userId]: {
          ...userPerm,
          screens: {
            ...userPerm.screens,
            [screen]: !userPerm.screens?.[screen],
          },
        },
      };
      savePerms(updated);
      return updated;
    });
  };

  const resetToDefaults = (userId: string) => {
    setPerms((prev) => {
      const { [userId]: _, ...rest } = prev;
      savePerms(rest);
      return rest;
    });
  };

  const handleSave = (userId: string) => {
    savePerms(perms);
    setSavedId(userId);
    setTimeout(() => setSavedId(null), 1500);
  };

  return (
    <div className="animate-fade-in">
      <Breadcrumb items={[{ label: 'Permissoes' }]} />
      <PageHeader
        title="Gerenciamento de Permissoes"
        subtitle="Configure permissoes por usuario"
      />

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* User list */}
        <div className="lg:col-span-1">
          <div className="glass-card p-4">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white-dim" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar usuario..."
                className="input-base w-full text-sm pl-9"
              />
            </div>

            <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
              {filteredUsers.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-xs text-white-dim">Nenhum usuario encontrado.</p>
                </div>
              )}
              {filteredUsers.map((u) => {
                const style = getRoleStyle(u.role);
                const isSelected = selectedUserId === u.id;
                const isYou = u.id === currentUser.id;
                return (
                  <button
                    key={u.id}
                    onClick={() => setSelectedUserId(isSelected ? null : u.id)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left',
                      isSelected
                        ? 'bg-red-soft border border-red-30'
                        : 'hover:bg-black-surface-2 border border-transparent'
                    )}
                  >
                    <div className="w-9 h-9 rounded-full bg-black-surface-2 border border-black-border flex items-center justify-center text-xs font-bold text-red shrink-0">
                      {getInitials(u.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium truncate">{u.name}</span>
                        {isYou && <span className="text-[9px] text-red bg-red-soft px-1 py-0.5 rounded">Voce</span>}
                      </div>
                      <span className="text-[10px] text-white-dim truncate">{u.email}</span>
                    </div>
                    <span className={cn('text-[10px] px-2 py-0.5 rounded-full border shrink-0',
                      isSelected ? 'text-red bg-red/10 border-red/20' : style.bg
                    )}>
                      {style.label}
                    </span>
                    <ChevronRight className={cn('w-3.5 h-3.5 shrink-0 transition-transform',
                      isSelected ? 'text-red rotate-90' : 'text-white-dim'
                    )} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Permissions panel */}
        <div className="lg:col-span-2">
          {selectedUser ? (
            <div className="glass-card p-5 animate-scale-in">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-soft border border-red-30 flex items-center justify-center text-sm font-bold text-red">
                    {getInitials(selectedUser.name)}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold">{selectedUser.name}</h3>
                    <p className="text-[10px] text-white-dim">{selectedUser.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => resetToDefaults(selectedUser.id)}
                    className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
                    title="Restaurar padrao"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Padrao
                  </button>
                  <button
                    onClick={() => handleSave(selectedUser.id)}
                    className={cn(
                      'btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5 transition-colors',
                      savedId === selectedUser.id && 'bg-green-600'
                    )}
                  >
                    {savedId === selectedUser.id ? (
                      <><Check className="w-3 h-3" /> Salvo!</>
                    ) : (
                      <><Save className="w-3 h-3" /> Salvar</>
                    )}
                  </button>
                </div>
              </div>

              {/* Role selector */}
              <div className="mb-6">
                <label className="text-[10px] text-white-dim uppercase mb-2 block font-medium">Role do Usuario</label>
                <div className="flex flex-wrap gap-2">
                  {ROLE_OPTIONS.map((role) => {
                    const currentRole = perms[selectedUser.id]?.role || selectedUser.role;
                    const isActive = currentRole === role.value;
                    return (
                      <button
                        key={role.value}
                        onClick={() => updateUserRole(selectedUser.id, role.value)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                          isActive
                            ? role.bg + ' ' + role.color + ' shadow-sm'
                            : 'bg-black-surface-2 text-white-dim border-black-border hover:border-white-dim'
                        )}
                      >
                        {role.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Screens grid */}
              <div>
                <label className="text-[10px] text-white-dim uppercase mb-3 block font-medium">Acesso as Telas</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SCREEN_LIST.map((screen) => {
                    const userPerm = perms[selectedUser.id]?.screens;
                    const defaultByRole = getDefaultScreenAccess(selectedUser.role, screen.key);
                    const isEnabled = userPerm?.[screen.key] !== undefined
                      ? userPerm[screen.key]
                      : defaultByRole;
                    return (
                      <button
                        key={screen.key}
                        onClick={() => toggleScreen(selectedUser.id, screen.key)}
                        className={cn(
                          'flex items-center justify-between p-3 rounded-lg border transition-all text-left',
                          isEnabled
                            ? 'bg-green-500/5 border-green-500/20 hover:bg-green-500/10'
                            : 'bg-black-surface-2 border-black-border hover:border-red/30'
                        )}
                      >
                        <div className="flex items-center gap-2">
                          {isEnabled ? (
                            <Unlock className="w-3.5 h-3.5 text-green-500" />
                          ) : (
                            <Lock className="w-3.5 h-3.5 text-white-dim" />
                          )}
                          <span className={cn('text-xs',
                            isEnabled ? 'text-white' : 'text-white-dim'
                          )}>{screen.label}</span>
                        </div>
                        <div className={cn(
                          'w-5 h-5 rounded flex items-center justify-center transition-colors',
                          isEnabled
                            ? 'bg-green-500 text-white'
                            : 'bg-red/10 text-red border border-red/20'
                        )}>
                          {isEnabled ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card p-8 flex flex-col items-center justify-center text-center min-h-[300px]">
              <Shield className="w-10 h-10 text-white-dim mb-3" />
              <p className="text-sm text-white-muted mb-1">Selecione um usuario</p>
              <p className="text-xs text-white-dim max-w-xs">
                Clique em um usuario na lista ao lado para gerenciar suas permissoes e role.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getDefaultScreenAccess(role: string, screen: string): boolean {
  const defaults: Record<string, string[]> = {
    gerente: SCREEN_LIST.map((s) => s.key),
    supervisor: SCREEN_LIST.map((s) => s.key).filter((s) => s !== 'permissions'),
    desenvolvedor: ['dashboard', 'projects', 'patches', 'hotfixes', 'documents',
      'classifications', 'github', 'timeline', 'settings',
    ],
    processo: ['dashboard', 'projects', 'patches', 'hotfixes', 'documents',
      'classifications', 'timeline', 'settings',
    ],
    qa: ['dashboard', 'projects', 'patches', 'hotfixes', 'documents',
      'classifications', 'timeline', 'settings',
    ],
    viewer: ['dashboard', 'projects', 'patches', 'hotfixes', 'documents',
      'classifications', 'timeline',
    ],
  };
  return (defaults[role] || []).includes(screen);
}
