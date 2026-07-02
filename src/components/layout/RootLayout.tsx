import { Outlet } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { CommandPalette } from './CommandPalette';
import { useAppStore } from '@/store/appStore';
import { useThemeStore } from '@/store/themeStore';
import { cn } from '@/lib/utils';

export function RootLayout() {
  const sidebarCollapsed = useAppStore((s) => s.sidebarCollapsed);
  const theme = useThemeStore((s) => s.theme);

  return (
    <div className="min-h-screen">
      <Sidebar />
      <TopBar />
      <CommandPalette />
      <main
        className={cn(
          'pt-16 min-h-screen transition-all duration-300',
          'pl-0',
          sidebarCollapsed ? 'md:pl-[68px]' : 'md:pl-60'
        )}
      >
        <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
          <Outlet />
        </div>
      </main>
      <Toaster
        theme={theme}
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--color-toast-bg)',
            border: '1px solid var(--color-toast-border)',
            color: 'var(--color-toast-text)',
          },
        }}
      />
    </div>
  );
}
