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
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { cn, getInitials } from '@/lib/utils';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/patches', label: 'Patches', icon: ClipboardList },
  { to: '/timeline', label: 'Timeline', icon: Clock },
  {
    to: '/history',
    label: 'Histórico',
    icon: FolderOpen,
    children: [
      { to: '/history/hotfix', label: 'Hotfix', icon: Flame, badge: true },
      { to: '/history/audit', label: 'Auditoria', icon: ScrollText },
    ],
  },
  { to: '/documents', label: 'Documentos', icon: Files },
  { to: '/classifications', label: 'Classificações', icon: Tags },
  { to: '/github', label: 'GitHub', icon: Github },
  { to: '/settings', label: 'Configurações', icon: Settings },
];

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, currentUser, hotfixes } = useAppStore();
  const location = useLocation();
  const activeHotfixes = hotfixes.filter((h) => !['closed', 'validated'].includes(h.status)).length;

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen backdrop-blur-xl border-r border-black-border z-40 flex flex-col transition-all duration-300',
        sidebarCollapsed ? 'w-[68px]' : 'w-60'
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
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto scrollbar-custom py-4 px-2 space-y-1">
        {NAV_ITEMS.map((item) => {
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
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-white-muted hover:text-white hover:bg-hover transition-all text-xs"
          aria-label={sidebarCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
        >
          <ChevronLeft
            className={cn('w-4 h-4 transition-transform duration-300', sidebarCollapsed && 'rotate-180')}
          />
          {!sidebarCollapsed && 'Colapsar'}
        </button>
      </div>
    </aside>
  );
}
