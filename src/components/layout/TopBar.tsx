import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, Plus, Flame, Check, Sun, Moon, Menu } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { useThemeStore } from '@/store/themeStore';
import { cn, formatRelative } from '@/lib/utils';

export function TopBar() {
  const navigate = useNavigate();
  const { notifications, markNotificationRead, markAllNotificationsRead, setCommandPaletteOpen, sidebarCollapsed, setMobileMenuOpen } =
    useAppStore();
  const { theme, toggleTheme } = useThemeStore();
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <header
      className={cn(
        'fixed top-0 right-0 h-16 backdrop-blur-xl border-b border-black-border z-30 flex items-center justify-between px-4 md:px-6 transition-all duration-300',
        'left-0',
        sidebarCollapsed ? 'md:left-[68px]' : 'md:left-60'
      )}
      style={{ background: 'var(--color-surface)' }}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="md:hidden p-2 rounded-lg text-white-muted hover:text-white hover:bg-hover transition-all"
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search trigger */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="flex items-center gap-3 bg-black-surface-2 border border-black-border rounded-lg px-3 py-2 text-sm text-white-dim hover:border-red-40 transition-all flex-1 md:w-72 md:flex-none max-w-md"
        >
        <Search className="w-4 h-4" />
        <span>Buscar patches, docs...</span>
        <kbd className="hidden md:inline ml-auto text-[10px] bg-black-surface border border-black-border rounded px-1.5 py-0.5 font-mono">
          Ctrl K
        </kbd>
      </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-lg text-white-muted hover:text-white hover:bg-hover transition-all"
          aria-label={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
          title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        <button
          onClick={() => navigate('/history/hotfix?new=1')}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red border border-red-30 bg-red-soft hover:bg-red hover:text-[#FFFFFF] transition-all duration-200"
        >
          <Flame className="w-4 h-4" />
          <span className="hidden sm:inline">Hotfix</span>
        </button>
        <button onClick={() => navigate('/patches/new')} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Novo Patch</span>
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2.5 rounded-lg text-white-muted hover:text-white hover:bg-white/5 transition-all"
            aria-label="Notificações"
          >
            <Bell className="w-5 h-5" />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red text-[#FFFFFF] text-[9px] font-bold rounded-full flex items-center justify-center shadow-red-glow">
                {unread}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-12 w-80 glass-card shadow-2xl animate-slide-up overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-black-border">
                <span className="text-sm font-semibold">Notificações</span>
                <button
                  onClick={markAllNotificationsRead}
                  className="text-[11px] text-red hover:underline flex items-center gap-1"
                >
                  <Check className="w-3 h-3" /> Marcar todas lidas
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto scrollbar-custom">
                {notifications.length === 0 && (
                  <p className="text-sm text-white-muted p-4 text-center">Nenhuma notificação</p>
                )}
                {notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => {
                      markNotificationRead(n.id);
                      if (n.link) navigate(n.link);
                      setNotifOpen(false);
                    }}
                    className={cn(
                      'w-full text-left px-4 py-3 border-b border-border-50 hover:bg-hover transition-all',
                      !n.read && 'bg-red-soft-50'
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {!n.read && <span className="w-2 h-2 rounded-full bg-red mt-1.5 shrink-0" />}
                      <div className="min-w-0">
                        <p className="text-xs font-semibold">{n.title}</p>
                        <p className="text-[11px] text-white-muted truncate">{n.message}</p>
                        <p className="text-[10px] text-white-dim mt-1">{formatRelative(n.createdAt)}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
