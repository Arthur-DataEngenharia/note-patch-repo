import { create } from 'zustand';
import { toast } from 'sonner';
import type { NotePatch, Hotfix, DocumentItem, Notification, Classification, AuditLog, User, TimeEntry, Project, ProjectStage } from '@/types';
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
function parseProjectDates(p: any): Project {
  return {
    ...p,
    targetDate: toDate(p.targetDate),
    createdAt: toDate(p.createdAt),
    updatedAt: toDate(p.updatedAt),
    stages: (p.stages || []).map((s: any) => ({ ...s, publishedAt: toDate(s.publishedAt) })),
    documents: (p.documents || []).map(parseDocDates),
  };
}

interface AppState {
  patches: NotePatch[];
  hotfixes: Hotfix[];
  documents: DocumentItem[];
  notifications: Notification[];
  classifications: Classification[];
  auditLogs: AuditLog[];
  users: User[];
  timeEntries: TimeEntry[];
  projects: Project[];
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
  addTimeEntry: (entry: Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  deleteTimeEntry: (id: string) => Promise<void>;
  getTimeEntriesForEntity: (entityType: string, entityId: string) => TimeEntry[];
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'stages' | 'documents' | 'isPublic' | 'status' | 'currentStage'>) => Promise<void>;
  updateProject: (id: string, data: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  publishProjectStage: (projectId: string, stage: ProjectStage['stage'], description: string) => Promise<void>;
  getProjectsForUser: () => Project[];
  getProjectById: (id: string) => Project | undefined;
  updateUser: (id: string, data: Partial<User>) => Promise<void>;
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
  timeEntries: [],
  projects: [],
  currentUser: { id: 'u1', name: 'Arthur Rodrigues', email: 'arthur@empresa.com', role: 'gerente' },
  sidebarCollapsed: false,
  commandPaletteOpen: false,
  mobileMenuOpen: false,
  loading: true,

  init: async () => {
    try {
      const [patches, hotfixes, documents, notifications, classifications, auditLogs, users, timeEntries, projects] = await Promise.all([
        api.getPatches(),
        api.getHotfixes(),
        api.getDocuments(),
        api.getNotifications(),
        api.getClassifications(),
        api.getAuditLogs(),
        api.getUsers(),
        api.getTimeEntries(),
        api.getProjects(),
      ]);
      set({
        patches: (patches as any[]).map(parsePatchDates),
        hotfixes: (hotfixes as any[]).map(parseHotfixDates),
        documents: (documents as any[]).map(parseDocDates),
        notifications: (notifications as any[]).map((n: any) => ({ ...n, createdAt: toDate(n.createdAt) })),
        classifications: classifications as Classification[],
        auditLogs: (auditLogs as any[]).map(parseAuditDates),
        users: users as User[],
        timeEntries: (timeEntries as any[]).map((t: any) => ({ ...t, date: toDate(t.date), createdAt: toDate(t.createdAt), updatedAt: toDate(t.updatedAt) })),
        projects: (projects as any[]).map(parseProjectDates),
        currentUser: (users as User[])[0] || get().currentUser,
        loading: false,
      });
    } catch (e: any) {
      toast.error('Erro ao carregar dados: ' + (e.message || 'verifique a conexao'));
      set({ loading: false });
    }
  },

  addPatch: async (patch) => {
    set((s) => ({ patches: [patch, ...s.patches] }));
    try { await api.createPatch(patch); toast.success('Patch criado'); } catch (e: any) { toast.error('Erro ao criar patch: ' + e.message); }
  },

  updatePatch: async (id, data) => {
    set((s) => ({ patches: s.patches.map((p) => (p.id === id ? { ...p, ...data, updatedAt: new Date() } : p)) }));
    try { await api.updatePatch(id, data); toast.success('Patch atualizado'); } catch (e: any) { toast.error('Erro ao atualizar patch: ' + e.message); }
  },

  archivePatch: async (id) => {
    set((s) => ({ patches: s.patches.map((p) => (p.id === id ? { ...p, status: 'archived' as const } : p)) }));
    try { await api.updatePatch(id, { status: 'archived' }); toast.success('Patch arquivado'); } catch (e: any) { toast.error('Erro ao arquivar patch: ' + e.message); }
  },

  toggleFavorite: (id) =>
    set((s) => ({ patches: s.patches.map((p) => (p.id === id ? { ...p, favorite: !p.favorite } : p)) })),

  addHotfix: async (hotfix) => {
    set((s) => ({ hotfixes: [hotfix, ...s.hotfixes] }));
    try { await api.createHotfix(hotfix); toast.success('Hotfix criado'); } catch (e: any) { toast.error('Erro ao criar hotfix: ' + e.message); }
  },

  updateHotfix: async (id, data) => {
    set((s) => ({ hotfixes: s.hotfixes.map((h) => (h.id === id ? { ...h, ...data } : h)) }));
    try { await api.updateHotfix(id, data); toast.success('Hotfix atualizado'); } catch (e: any) { toast.error('Erro ao atualizar hotfix: ' + e.message); }
  },

  addDocument: async (doc) => {
    set((s) => ({ documents: [doc, ...s.documents] }));
    try { await api.createDocument(doc); toast.success('Documento criado'); } catch (e: any) { toast.error('Erro ao criar documento: ' + e.message); }
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

  addTimeEntry: async (entry) => {
    const newEntry = { ...entry, id: `t${Date.now()}`, createdAt: new Date(), updatedAt: new Date() };
    set((s) => ({ timeEntries: [newEntry, ...s.timeEntries] }));
    try {
      const saved = await api.createTimeEntry(entry);
      set((s) => ({
        timeEntries: s.timeEntries.map((t) => (t.id === newEntry.id ? { ...saved, date: toDate(saved.date), createdAt: toDate(saved.createdAt), updatedAt: toDate(saved.updatedAt) } : t)),
      }));
      toast.success('Horas apontadas');
    } catch (e: any) {
      toast.error('Erro ao apontar horas: ' + e.message);
    }
  },

  deleteTimeEntry: async (id) => {
    set((s) => ({ timeEntries: s.timeEntries.filter((t) => t.id !== id) }));
    try {
      await api.deleteTimeEntry(id);
      toast.success('Horas removidas');
    } catch (e: any) {
      toast.error('Erro ao remover horas: ' + e.message);
    }
  },

  getTimeEntriesForEntity: (entityType, entityId) => {
    return get().timeEntries.filter((t) => t.entityType === entityType && t.entityId === entityId);
  },

  addProject: async (project) => {
    const newProject = { ...project, id: `pr${Date.now()}`, status: 'draft' as const, currentStage: null, isPublic: false, createdAt: new Date(), updatedAt: new Date(), stages: [], documents: [] };
    set((s) => ({ projects: [newProject, ...s.projects] }));
    try {
      const saved = await api.createProject(project);
      set((s) => ({
        projects: s.projects.map((p) => (p.id === newProject.id ? parseProjectDates(saved) : p)),
      }));
      toast.success('Projeto criado');
    } catch (e: any) {
      toast.error('Erro ao criar projeto: ' + e.message);
    }
  },

  updateProject: async (id, data) => {
    set((s) => ({ projects: s.projects.map((p) => (p.id === id ? { ...p, ...data, updatedAt: new Date() } : p)) }));
    try {
      await api.updateProject(id, data);
      toast.success('Projeto atualizado');
    } catch (e: any) {
      toast.error('Erro ao atualizar projeto: ' + e.message);
    }
  },

  deleteProject: async (id) => {
    set((s) => ({ projects: s.projects.filter((p) => p.id !== id) }));
    try {
      await api.deleteProject(id);
      toast.success('Projeto removido');
    } catch (e: any) {
      toast.error('Erro ao remover projeto: ' + e.message);
    }
  },

  publishProjectStage: async (projectId, stage, description) => {
    const user = get().currentUser;
    const newStage: ProjectStage = { id: `ps${Date.now()}`, projectId, stage, userId: user.id, userName: user.name, description, publishedAt: new Date() };
    set((s) => ({
      projects: s.projects.map((p) => (p.id === projectId ? { ...p, stages: [newStage, ...p.stages] } : p)),
    }));
    try {
      const saved = await api.publishProjectStage(projectId, { stage, description });
      const updatedProject = await api.getProject(projectId);
      set((s) => ({
        projects: s.projects.map((p) => (p.id === projectId ? parseProjectDates(updatedProject) : p)),
      }));
      toast.success('Etapa publicada');
    } catch (e: any) {
      toast.error('Erro ao publicar etapa: ' + e.message);
    }
  },

  getProjectsForUser: () => {
    const user = get().currentUser;
    const isManager = user.role === 'gerente' || user.role === 'supervisor' || user.role === 'admin';
    return get().projects.filter((p) =>
      isManager || p.isPublic || p.createdById === user.id || p.processoId === user.id || p.devId === user.id || p.qaId === user.id
    );
  },

  getProjectById: (id) => {
    return get().projects.find((p) => p.id === id);
  },

  updateUser: async (id, data) => {
    set((s) => ({
      users: s.users.map((u) => (u.id === id ? { ...u, ...data } : u)),
      currentUser: s.currentUser.id === id ? { ...s.currentUser, ...data } : s.currentUser,
    }));
    try {
      await api.updateUser(id, data);
      toast.success('Usuario atualizado');
    } catch (e: any) {
      toast.error('Erro ao atualizar usuario: ' + e.message);
    }
  },

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
  setCurrentUser: (user) => set({ currentUser: user }),
}));
