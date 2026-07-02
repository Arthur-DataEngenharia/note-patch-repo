import { create } from 'zustand';
import type { NotePatch, Hotfix, DocumentItem, Notification, Classification, AuditLog, User } from '@/types';
import { api } from '@/api/client';

function toDate(v: any) { return v ? new Date(v) : null; }
function parsePatchDates(p: any): NotePatch {
  return { ...p, createdAt: toDate(p.createdAt), updatedAt: toDate(p.updatedAt), deployedAt: toDate(p.deployedAt) };
}
function parseHotfixDates(h: any): Hotfix {
  return { ...h, reportedAt: toDate(h.reportedAt), closedAt: toDate(h.closedAt), updatedAt: toDate(h.updatedAt) };
}
function parseDocDates(d: any): DocumentItem {
  return { ...d, createdAt: toDate(d.createdAt), updatedAt: toDate(d.updatedAt) };
}
function parseAuditDates(a: any): AuditLog {
  return { ...a, timestamp: toDate(a.timestamp) };
}

interface AppState {
  patches: NotePatch[];
  hotfixes: Hotfix[];
  documents: DocumentItem[];
  notifications: Notification[];
  classifications: Classification[];
  auditLogs: AuditLog[];
  users: User[];
  currentUser: User;
  sidebarCollapsed: boolean;
  commandPaletteOpen: boolean;
  mobileMenuOpen: boolean;
  loading: boolean;

  init: () => Promise<void>;
  addPatch: (patch: NotePatch) => Promise<void>;
  updatePatch: (id: string, data: Partial<NotePatch>) => Promise<void>;
  archivePatch: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => void;
  addHotfix: (hotfix: Hotfix) => Promise<void>;
  updateHotfix: (id: string, data: Partial<Hotfix>) => Promise<void>;
  addDocument: (doc: DocumentItem) => Promise<void>;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void;
  toggleSidebar: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setMobileMenuOpen: (open: boolean) => void;
  setCurrentUser: (user: User) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  patches: [],
  hotfixes: [],
  documents: [],
  notifications: [],
  classifications: [],
  auditLogs: [],
  users: [],
  currentUser: { id: 'u1', name: 'Arthur Rodrigues', email: 'arthur@empresa.com', role: 'admin' },
  sidebarCollapsed: false,
  commandPaletteOpen: false,
  mobileMenuOpen: false,
  loading: true,

  init: async () => {
    try {
      const [patches, hotfixes, documents, notifications, classifications, auditLogs, users] = await Promise.all([
        api.getPatches(),
        api.getHotfixes(),
        api.getDocuments(),
        api.getNotifications(),
        api.getClassifications(),
        api.getAuditLogs(),
        api.getUsers(),
      ]);
      set({
        patches: (patches as any[]).map(parsePatchDates),
        hotfixes: (hotfixes as any[]).map(parseHotfixDates),
        documents: (documents as any[]).map(parseDocDates),
        notifications: (notifications as any[]).map((n: any) => ({ ...n, createdAt: toDate(n.createdAt) })),
        classifications: classifications as Classification[],
        auditLogs: (auditLogs as any[]).map(parseAuditDates),
        users: users as User[],
        currentUser: (users as User[])[0] || get().currentUser,
        loading: false,
      });
    } catch (e) {
      console.error('Failed to load from API:', e);
      set({ loading: false });
    }
  },

  addPatch: async (patch) => {
    set((s) => ({ patches: [patch, ...s.patches] }));
    try { await api.createPatch(patch); } catch (e) { console.error('Failed to persist patch:', e); }
  },

  updatePatch: async (id, data) => {
    set((s) => ({ patches: s.patches.map((p) => (p.id === id ? { ...p, ...data, updatedAt: new Date() } : p)) }));
    try { await api.updatePatch(id, data); } catch (e) { console.error('Failed to persist patch update:', e); }
  },

  archivePatch: async (id) => {
    set((s) => ({ patches: s.patches.map((p) => (p.id === id ? { ...p, status: 'archived' as const } : p)) }));
    try { await api.updatePatch(id, { status: 'archived' }); } catch (e) { console.error('Failed to persist archive:', e); }
  },

  toggleFavorite: (id) =>
    set((s) => ({ patches: s.patches.map((p) => (p.id === id ? { ...p, favorite: !p.favorite } : p)) })),

  addHotfix: async (hotfix) => {
    set((s) => ({ hotfixes: [hotfix, ...s.hotfixes] }));
    try { await api.createHotfix(hotfix); } catch (e) { console.error('Failed to persist hotfix:', e); }
  },

  updateHotfix: async (id, data) => {
    set((s) => ({ hotfixes: s.hotfixes.map((h) => (h.id === id ? { ...h, ...data } : h)) }));
    try { await api.updateHotfix(id, data); } catch (e) { console.error('Failed to persist hotfix update:', e); }
  },

  addDocument: async (doc) => {
    set((s) => ({ documents: [doc, ...s.documents] }));
    try { await api.createDocument(doc); } catch (e) { console.error('Failed to persist document:', e); }
  },

  markNotificationRead: (id) => {
    set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) }));
    api.markNotificationRead(id).catch(() => {});
  },

  markAllNotificationsRead: () => {
    set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) }));
    api.markAllNotificationsRead().catch(() => {});
  },

  addAuditLog: (log) => {
    const fullLog = { ...log, id: `a${Date.now()}`, timestamp: new Date() };
    set((s) => ({ auditLogs: [fullLog, ...s.auditLogs] }));
    api.createAuditLog(log).catch(() => {});
  },

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
  setCurrentUser: (user) => set({ currentUser: user }),
}));
