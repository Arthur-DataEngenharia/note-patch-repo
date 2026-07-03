import { useState } from 'react';
import { Clock, Plus, Trash2, User } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { cn, formatDate } from '@/lib/utils';
import type { TimeEntry } from '@/types';

interface Props {
  entityType: 'patch' | 'hotfix';
  entityId: string;
}

export function TimeSheetPanel({ entityType, entityId }: Props) {
  const { timeEntries, users, currentUser, addTimeEntry, deleteTimeEntry, getTimeEntriesForEntity } = useAppStore();
  const [isOpen, setIsOpen] = useState(false);
  const [hours, setHours] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const entries = getTimeEntriesForEntity(entityType, entityId);
  const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hours || Number(hours) <= 0) return;
    addTimeEntry({
      userId: currentUser.id,
      userName: currentUser.name,
      entityType,
      entityId,
      hours: Number(hours),
      description: description || undefined,
      date: new Date(date),
    });
    setHours('');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
  };

  const getUserColor = (userId: string) => {
    const idx = users.findIndex((u) => u.id === userId);
    const colors = ['#E11D48', '#3B82F6', '#22C55E', '#A855F7', '#F59E0B', '#06B6D4'];
    return colors[idx % colors.length];
  };

  return (
    <div className="glass-card p-5 animate-fade-in">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-red" />
          <h3 className="text-sm font-semibold">Horas Trabalhadas</h3>
          <span className="text-[11px] text-white-dim tabular-nums">{totalHours.toFixed(1)}h total</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-white-dim">{entries.length} registros</span>
          <Plus className={cn('w-4 h-4 transition-transform', isOpen ? 'rotate-45' : '')} />
        </div>
      </button>

      {isOpen && (
        <div className="mt-4 space-y-4">
          {/* Add form */}
          <form onSubmit={handleSubmit} className="space-y-3 p-3 rounded-lg bg-black-surface-2 border border-black-border">
            <div className="flex gap-3 flex-wrap">
              <div className="flex-1 min-w-[120px]">
                <label className="text-[10px] text-white-dim uppercase mb-1 block">Horas</label>
                <input
                  type="number"
                  step="0.25"
                  min="0.25"
                  max="24"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  placeholder="2.5"
                  required
                  className="input-base w-full text-sm"
                />
              </div>
              <div className="flex-1 min-w-[140px]">
                <label className="text-[10px] text-white-dim uppercase mb-1 block">Data</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="input-base w-full text-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] text-white-dim uppercase mb-1 block">Descricao (opcional)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="O que foi feito..."
                className="input-base w-full text-sm"
              />
            </div>
            <button type="submit" className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Apontar Horas
            </button>
          </form>

          {/* Entries list */}
          {entries.length === 0 ? (
            <p className="text-xs text-white-dim text-center py-2">Nenhum apontamento de horas ainda.</p>
          ) : (
            <div className="space-y-2">
              {/* Group by person */}
              {Array.from(new Set(entries.map((e) => e.userId))).map((userId) => {
                const userEntries = entries.filter((e) => e.userId === userId);
                const userHours = userEntries.reduce((s, e) => s + e.hours, 0);
                const userName = userEntries[0]?.userName || 'Desconhecido';
                const color = getUserColor(userId);

                return (
                  <div key={userId} className="rounded-lg border border-black-border overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2 bg-black-surface-2">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                        style={{ backgroundColor: color }}
                      >
                        {userName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <span className="text-xs font-medium">{userName}</span>
                      <span className="text-[11px] text-white-dim ml-auto tabular-nums">{userHours.toFixed(1)}h</span>
                    </div>
                    <div className="divide-y divide-black-border">
                      {userEntries.map((entry) => (
                        <div
                          key={entry.id}
                          className="flex items-center justify-between px-3 py-2 hover:bg-black-surface-2/50 transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Clock className="w-3 h-3 text-white-dim shrink-0" />
                            <div className="min-w-0">
                              <span className="text-xs tabular-nums">{entry.hours}h</span>
                              {entry.description && (
                                <span className="text-[11px] text-white-dim ml-2">{entry.description}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] text-white-dim">{formatDate(entry.date)}</span>
                            {entry.userId === currentUser.id && (
                              <button
                                onClick={() => deleteTimeEntry(entry.id)}
                                className="p-1 rounded hover:bg-red/10 text-white-dim hover:text-red transition-colors"
                                title="Remover"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
