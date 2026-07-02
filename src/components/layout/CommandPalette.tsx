import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ClipboardList, Flame, Clock, LayoutDashboard, FileText, Plus, ArrowRight } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { cn } from '@/lib/utils';

interface CommandItem {
  id: string;
  label: string;
  hint?: string;
  icon: React.ElementType;
  action: () => void;
  group: string;
}

export function CommandPalette() {
  const navigate = useNavigate();
  const { commandPaletteOpen, setCommandPaletteOpen, patches, documents } = useAppStore();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
      if (e.key === 'Escape') setCommandPaletteOpen(false);
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        navigate('/patches/new');
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        navigate('/dashboard');
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [commandPaletteOpen, setCommandPaletteOpen, navigate]);

  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery('');
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [commandPaletteOpen]);

  const go = (path: string) => {
    navigate(path);
    setCommandPaletteOpen(false);
  };

  const items: CommandItem[] = useMemo(() => {
    const commands: CommandItem[] = [
      { id: 'c1', label: 'Novo Note Patch', icon: Plus, action: () => go('/patches/new'), group: 'Ações' },
      { id: 'c2', label: 'Registrar Hotfix', icon: Flame, action: () => go('/history/hotfix?new=1'), group: 'Ações' },
      { id: 'c3', label: 'Ir para Dashboard', icon: LayoutDashboard, action: () => go('/dashboard'), group: 'Navegação' },
      { id: 'c4', label: 'Ver Timeline', icon: Clock, action: () => go('/timeline'), group: 'Navegação' },
      { id: 'c5', label: 'Ver Patches', icon: ClipboardList, action: () => go('/patches'), group: 'Navegação' },
    ];

    const patchItems: CommandItem[] = patches.map((p) => ({
      id: p.id,
      label: p.title,
      hint: p.version,
      icon: ClipboardList,
      action: () => go(`/patches/${p.id}`),
      group: 'Patches',
    }));

    const docItems: CommandItem[] = documents.map((d) => ({
      id: d.id,
      label: d.title,
      icon: FileText,
      action: () => go(`/documents/${d.id}`),
      group: 'Documentos',
    }));

    const all = [...commands, ...patchItems, ...docItems];
    if (!query) return all.slice(0, 10);
    const q = query.toLowerCase();
    return all.filter((i) => i.label.toLowerCase().includes(q) || i.hint?.toLowerCase().includes(q)).slice(0, 12);
  }, [query, patches, documents]);

  useEffect(() => setSelected(0), [query]);

  if (!commandPaletteOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-[15vh] animate-fade-in"
      onClick={() => setCommandPaletteOpen(false)}
    >
      <div
        className="w-full max-w-xl glass-card shadow-2xl shadow-red/10 overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 border-b border-black-border">
          <Search className="w-4 h-4 text-red shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelected((s) => Math.min(s + 1, items.length - 1));
              }
              if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelected((s) => Math.max(s - 1, 0));
              }
              if (e.key === 'Enter' && items[selected]) items[selected].action();
            }}
            placeholder="Buscar patches, documentos, ações..."
            className="flex-1 bg-transparent py-4 text-sm text-white placeholder-white-dim focus:outline-none"
          />
          <kbd className="text-[10px] text-white-dim bg-black-surface-2 border border-black-border rounded px-1.5 py-0.5 font-mono">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto scrollbar-custom py-2">
          {items.length === 0 && (
            <p className="text-sm text-white-muted text-center py-8">Nenhum resultado para "{query}"</p>
          )}
          {items.map((item, idx) => (
            <button
              key={item.id}
              onClick={item.action}
              onMouseEnter={() => setSelected(idx)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors',
                idx === selected ? 'bg-red-soft text-white' : 'text-white-muted'
              )}
            >
              <item.icon className={cn('w-4 h-4 shrink-0', idx === selected && 'text-red')} />
              <span className="flex-1 truncate">{item.label}</span>
              {item.hint && <span className="text-[10px] font-mono text-white-dim">{item.hint}</span>}
              <span className="text-[10px] text-white-dim">{item.group}</span>
              {idx === selected && <ArrowRight className="w-3.5 h-3.5 text-red" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
