import { useState } from 'react';
import { Bell, User, Shield, Keyboard, Sun, Moon, Palette } from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/store/appStore';
import { useThemeStore } from '@/store/themeStore';
import { PageHeader } from '@/components/shared/PageHeader';
import { getInitials } from '@/lib/utils';

const SHORTCUTS = [
  { keys: 'Ctrl + K', action: 'Command palette / Busca global' },
  { keys: 'Ctrl + N', action: 'Novo patch' },
  { keys: 'Ctrl + D', action: 'Ir para Dashboard' },
  { keys: 'Esc', action: 'Fechar overlays/drawers' },
];

export default function SettingsPage() {
  const currentUser = useAppStore((s) => s.currentUser);
  const { theme, setTheme } = useThemeStore();
  const [notif, setNotif] = useState({
    newPatch: true,
    newHotfix: true,
    reviewRequested: true,
    emailDigest: 'weekly',
  });

  return (
    <div className="max-w-3xl">
      <PageHeader title="Configurações" description="Preferências do usuário e do sistema" />

      <div className="space-y-6">
        {/* Profile */}
        <div className="glass-card p-6">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <User className="w-4 h-4 text-red" /> Perfil
          </h2>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-red-soft border border-red-30 flex items-center justify-center text-lg font-bold text-red">
              {getInitials(currentUser.name)}
            </div>
            <div>
              <p className="font-semibold">{currentUser.name}</p>
              <p className="text-xs text-white-muted">{currentUser.email}</p>
              <span className="inline-flex items-center gap-1 mt-1 text-[10px] px-2 py-0.5 rounded-full bg-red-soft text-red font-medium uppercase">
                <Shield className="w-3 h-3" /> {currentUser.role}
              </span>
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="glass-card p-6">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Palette className="w-4 h-4 text-red" /> Aparência
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => {
                setTheme('light');
                toast.success('Tema claro ativado');
              }}
              className={`flex items-center gap-3 p-4 rounded-lg border transition-all ${
                theme === 'light'
                  ? 'border-red bg-red-soft'
                  : 'border-black-border hover:border-red-40'
              }`}
            >
              <Sun className="w-5 h-5 text-red" />
              <div className="text-left">
                <p className="text-sm font-medium">Modo Claro</p>
                <p className="text-[11px] text-white-muted">Fundo claro, texto escuro</p>
              </div>
            </button>
            <button
              onClick={() => {
                setTheme('dark');
                toast.success('Tema escuro ativado');
              }}
              className={`flex items-center gap-3 p-4 rounded-lg border transition-all ${
                theme === 'dark'
                  ? 'border-red bg-red-soft'
                  : 'border-black-border hover:border-red-40'
              }`}
            >
              <Moon className="w-5 h-5 text-red" />
              <div className="text-left">
                <p className="text-sm font-medium">Modo Escuro</p>
                <p className="text-[11px] text-white-muted">Fundo escuro, texto claro</p>
              </div>
            </button>
          </div>
        </div>

        {/* Notifications */}
        <div className="glass-card p-6">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Bell className="w-4 h-4 text-red" /> Notificações
          </h2>
          <div className="space-y-3">
            {[
              { key: 'newPatch', label: 'Novo patch publicado' },
              { key: 'newHotfix', label: 'Hotfix de emergência registrado' },
              { key: 'reviewRequested', label: 'Revisão solicitada' },
            ].map((item) => (
              <label key={item.key} className="flex items-center justify-between cursor-pointer text-sm">
                {item.label}
                <input
                  type="checkbox"
                  checked={(notif as any)[item.key]}
                  onChange={(e) => {
                    setNotif({ ...notif, [item.key]: e.target.checked });
                    toast.success('Preferência salva');
                  }}
                  className="accent-red w-4 h-4"
                />
              </label>
            ))}
            <div className="flex items-center justify-between pt-3 border-t border-black-border">
              <span className="text-sm">Email digest</span>
              <select
                value={notif.emailDigest}
                onChange={(e) => {
                  setNotif({ ...notif, emailDigest: e.target.value });
                  toast.success('Preferência salva');
                }}
                className="input-base w-36"
              >
                <option value="none">Nenhum</option>
                <option value="daily">Diário</option>
                <option value="weekly">Semanal</option>
              </select>
            </div>
          </div>
        </div>

        {/* Shortcuts */}
        <div className="glass-card p-6">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-red" /> Atalhos de Teclado
          </h2>
          <div className="space-y-2">
            {SHORTCUTS.map((s) => (
              <div key={s.keys} className="flex items-center justify-between text-sm py-2 border-b border-border-50 last:border-0">
                <span className="text-white-muted">{s.action}</span>
                <kbd className="font-mono text-[11px] bg-black-surface-2 border border-black-border rounded px-2 py-1">
                  {s.keys}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
