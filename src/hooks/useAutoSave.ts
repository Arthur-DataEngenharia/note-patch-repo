import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

export function useAutoSave<T>({
  data,
  onSave,
  delay = 3000,
  key,
}: {
  data: T;
  onSave: (data: T) => void | Promise<void>;
  delay?: number;
  key: string;
}) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const lastSavedRef = useRef<string>('');

  const saveToStorage = useCallback((value: T) => {
    try {
      localStorage.setItem(`autosave:${key}`, JSON.stringify(value));
    } catch { /* ignore */ }
  }, [key]);

  const loadFromStorage = useCallback((): T | null => {
    try {
      const raw = localStorage.getItem(`autosave:${key}`);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }, [key]);

  const clearStorage = useCallback(() => {
    localStorage.removeItem(`autosave:${key}`);
  }, [key]);

  useEffect(() => {
    const json = JSON.stringify(data);
    if (json === lastSavedRef.current) return;

    saveToStorage(data);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        await onSave(data);
        lastSavedRef.current = json;
        toast.success('Rascunho salvo automaticamente', { duration: 1500 });
      } catch {
        toast.error('Falha ao salvar rascunho', { duration: 2000 });
      }
    }, delay);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [data, delay, onSave, saveToStorage]);

  return { loadFromStorage, clearStorage };
}
