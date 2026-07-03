import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  Clock,
  FolderOpen,
  Flame,
  ScrollText,
  Files,
  Tags,
  Github,
  Settings,
  ChevronLeft,
  Layers,
  X,
  LogOut,
  Users,
  Briefcase,
  Calendar,
  Archive,
  Shield,
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import { cn, getInitials } from '@/lib/utils';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/projects', label: 'Projetos', icon: Briefcase },
  { to: '/calendar', label: 'Calendario', icon: Calendar },
  { to: '/patches', label: 'Patches', icon: ClipboardList },
  { to: '/timeline', label: 'Timeline', icon: Clock },
  {
    to: '/history',
    label: 'Historico',
    icon: FolderOpen,
    children: [
      { to: '/hotfixes', label: 'Hotfix', icon: Flame, badge: true },
      { to: '/history/audit', label: 'Auditoria', icon: ScrollText },
    ],
  },
  { to: '/documents', label: 'Documentos', icon: Files },
  { to: '/classifications', label: 'Classificacoes', icon: Tags },
  { to: '/github', label: 'GitHub', icon: Github },
  { to: '/users', label: 'Usuarios', icon: Users, adminOnly: true },
  { to: '/archive', label: 'Arquivo', icon: Archive, managerOnly: true },
  { to: '/permissions', label: 'Permissoes', icon: Shield, managerOnly: true },
  { to: '/settings', label: 'Configuracoes', icon: Settings },
];

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, currentUser, hotfixes, mobileMenuOpen, setMobileMenuOpen } = useAppStore();
  const { logout, user: authUser } = useAuthStore();
  const location = useLocation();
  const activeHotfixes = hotfixes.filter((h) => !['closed', 'validated'].includes(h.status)).length;
  const role = (authUser?.role || currentUser.role);
  const isAdmin = role === 'admin';
  const isManager = role === 'gerente' || role === 'supervisor' || role === 'admin';
  const visibleNav = NAV_ITEMS.filter((item: any) => {
    if (item.adminOnly && !isAdmin) return false;
    if (item.managerOnly && !isManager) return false;
    return true;
  });

  return (
    <>
      {/* Mobile backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      <aside
        className={cn(
          'fixed left-0 top-0 h-screen backdrop-blur-xl border-r border-black-border z-50 flex flex-col transition-all duration-300',
          sidebarCollapsed ? 'md:w-[68px]' : 'md:w-60',
          'w-60',
          '-translate-x-full md:translate-x-0',
          mobileMenuOpen && 'translate-x-0'
        )}
        style={{ background: 'var(--color-surface)' }}
      >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-black-border shrink-0">
        <div className="w-9 h-9 rounded-lg bg-red-gradient flex items-center justify-center shadow-red-glow shrink-0">
          <Layers className="w-5 h-5 text-[#FFFFFF]" />
        </div>
        {!sidebarCollapsed && (
          <span className="font-bold text-sm tracking-widest uppercase whitespace-nowrap">
            Note <span className="text-red">Patch</span>
          </span>
        )}
        <button
          className="ml-auto md:hidden p-1.5 rounded-lg text-white-muted hover:text-white hover:bg-hover"
          onClick={() => setMobileMenuOpen(false)}
          aria-label="Fechar menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto scrollbar-custom py-4 px-2 space-y-1">
        {visibleNav.map((item: any) => {
          const isParentActive = location.pathname.startsWith(item.to);
          return (
            <div key={item.to}>
              <NavLink
                to={item.children ? item.children[0].to : item.to}
                className={({ isActive }) =>
                  cn(
                    'relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group',
                    isActive || (item.children && isParentActive)
                      ? 'text-white bg-red-soft'
                      : 'text-white-muted hover:text-white hover:bg-hover'
                  )
                }
                title={sidebarCollapsed ? item.label : undefined}
              >
                {isParentActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-red rounded-r-full shadow-red-glow" />
                )}
                <item.icon className="w-[18px] h-[18px] shrink-0" />
                {!sidebarCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
              </NavLink>

              {item.children && isParentActive && !sidebarCollapsed && (
                <div className="ml-5 mt-1 space-y-0.5 border-l border-black-border pl-3">
                  {item.children.map((child) => (
                    <NavLink
                      key={child.to}
                      to={child.to}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200',
                          isActive
                            ? 'text-red bg-red-soft'
                            : 'text-white-muted hover:text-white hover:bg-hover'
                        )
                      }
                    >
                      <child.icon className="w-4 h-4 shrink-0" />
                      <span>{child.label}</span>
                      {child.badge && activeHotfixes > 0 && (
                        <span className="ml-auto bg-red text-[#FFFFFF] text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse-red">
                          {activeHotfixes}
                        </span>
                      )}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-black-border p-3 space-y-2 shrink-0">
        <div className={cn('flex items-center gap-3', sidebarCollapsed && 'justify-center')}>
          <div className="w-8 h-8 rounded-full bg-red-soft border border-red-30 flex items-center justify-center text-xs font-bold text-red shrink-0">
            {getInitials(currentUser.name)}
          </div>
          {!sidebarCollapsed && (
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate">{currentUser.name}</p>
              <p className="text-[10px] text-white-muted capitalize">{currentUser.role}</p>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSidebar}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-white-muted hover:text-white hover:bg-hover transition-all text-xs"
            aria-label={sidebarCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
          >
            <ChevronLeft
              className={cn('w-4 h-4 transition-transform duration-300', sidebarCollapsed && 'rotate-180')}
            />
            {!sidebarCollapsed && 'Colapsar'}
          </button>
          <button
            onClick={logout}
            className="flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-white-muted hover:text-red hover:bg-red-soft transition-all text-xs"
            aria-label="Sair"
            title="Sair"
          >
            <LogOut className="w-4 h-4" />
            {!sidebarCollapsed && 'Sair'}
          </button>
        </div>
      </div>
    </aside>
    </>
  );
}
