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
  generateDemoTimeEntries: () => void;
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

  generateDemoTimeEntries: () => {
    const state = get();
    let users = state.users.length > 0 ? state.users : [];
    let projects = state.projects;
    let patches = state.patches;
    let hotfixes = state.hotfixes;

    // Generate demo users if none exist
    if (users.length === 0) {
      const demoUsers: User[] = [
        { id: 'demo-u1', name: 'João Santos', email: 'joao@empresa.com', role: 'desenvolvedor' },
        { id: 'demo-u2', name: 'Maria Silva', email: 'maria@empresa.com', role: 'processo' },
        { id: 'demo-u3', name: 'Ana Costa', email: 'ana@empresa.com', role: 'qa' },
        { id: 'demo-u4', name: 'Carlos Lima', email: 'carlos@empresa.com', role: 'desenvolvedor' },
        { id: 'demo-u5', name: 'Fernanda Oliveira', email: 'fernanda@empresa.com', role: 'supervisor' },
      ];
      users = demoUsers;
      set((s) => ({ users: [...s.users, ...demoUsers] }));
      toast.success(`${demoUsers.length} usuários de exemplo criados`);
    }

    // Generate demo projects if none exist
    if (projects.length === 0) {
      const demoProjects: Project[] = [
        { id: 'demo-p1', title: 'Atualização Sistema ERP', type: 'patch_note', description: 'Migração de versão do ERP corporativo', status: 'publicado', currentStage: 'publicado', targetDate: new Date(), createdById: 'demo-u5', createdByName: 'Fernanda Oliveira', isPublic: true, createdAt: new Date(), updatedAt: new Date(), stages: [], documents: [] },
        { id: 'demo-p2', title: 'Hotfix Login Mobile', type: 'hotfix_emergencial', description: 'Correção urgente de autenticação no app', status: 'concluido', currentStage: 'concluido', targetDate: new Date(), createdById: 'demo-u5', createdByName: 'Fernanda Oliveira', isPublic: true, createdAt: new Date(), updatedAt: new Date(), stages: [], documents: [] },
        { id: 'demo-p3', title: 'Nova API de Pagamentos', type: 'patch_note', description: 'Integração com gateway de pagamentos', status: 'qa', currentStage: 'qa', targetDate: new Date(), createdById: 'demo-u5', createdByName: 'Fernanda Oliveira', isPublic: false, createdAt: new Date(), updatedAt: new Date(), stages: [], documents: [] },
        { id: 'demo-p4', title: 'Refatoração Módulo Fiscal', type: 'patch_note', description: 'Reestruturação do módulo de notas fiscais', status: 'desenvolvimento', currentStage: 'desenvolvimento', targetDate: new Date(), createdById: 'demo-u5', createdByName: 'Fernanda Oliveira', isPublic: false, createdAt: new Date(), updatedAt: new Date(), stages: [], documents: [] },
        { id: 'demo-p5', title: 'Correção Relatório Mensal', type: 'hotfix_emergencial', description: 'Ajuste nos totais do relatório gerencial', status: 'em_processo', currentStage: 'em_processo', targetDate: new Date(), createdById: 'demo-u5', createdByName: 'Fernanda Oliveira', isPublic: false, createdAt: new Date(), updatedAt: new Date(), stages: [], documents: [] },
      ];
      projects = demoProjects;
      set((s) => ({ projects: [...s.projects, ...demoProjects] }));
      toast.success(`${demoProjects.length} projetos de exemplo criados`);
    }

    // Generate demo patches if none exist
    if (patches.length === 0) {
      const demoPatches: NotePatch[] = [
        { id: 'demo-pt1', version: 'v2.1.0', title: 'Melhorias Performance Query', summary: 'Otimização de consultas SQL', technicalNotes: '', status: 'published', classificationId: '1', tags: ['performance', 'sql'], authorId: 'demo-u1', githubFiles: [], affectedClasses: [], impactedSystems: ['backend'], checklist: [], deployedAt: new Date(), createdAt: new Date(), updatedAt: new Date() },
        { id: 'demo-pt2', version: 'v2.1.1', title: 'Novo Layout Dashboard', summary: 'Redesign da tela principal', technicalNotes: '', status: 'published', classificationId: '1', tags: ['ui', 'ux'], authorId: 'demo-u4', githubFiles: [], affectedClasses: [], impactedSystems: ['frontend'], checklist: [], deployedAt: new Date(), createdAt: new Date(), updatedAt: new Date() },
        { id: 'demo-pt3', version: 'v2.2.0', title: 'Autenticação OAuth2', summary: 'Login com Google e Microsoft', technicalNotes: '', status: 'approved', classificationId: '1', tags: ['auth', 'security'], authorId: 'demo-u1', githubFiles: [], affectedClasses: [], impactedSystems: ['auth'], checklist: [], deployedAt: new Date(), createdAt: new Date(), updatedAt: new Date() },
      ];
      patches = demoPatches;
      set((s) => ({ patches: [...s.patches, ...demoPatches] }));
      toast.success(`${demoPatches.length} patches de exemplo criados`);
    }

    // Generate demo hotfixes if none exist
    if (hotfixes.length === 0) {
      const demoHotfixes: Hotfix[] = [
        { id: 'demo-hf1', title: 'Crash ao gerar PDF', description: 'Erro 500 na geração de relatórios PDF', status: 'closed', severity: 'high', reportedById: 'demo-u2', reportedByName: 'Maria Silva', reportedAt: new Date(), updatedAt: new Date(), codeReferences: '', documents: [] },
        { id: 'demo-hf2', title: 'Timeout Exportação Excel', description: 'Exportação de grande volume estoura timeout', status: 'closed', severity: 'medium', reportedById: 'demo-u3', reportedByName: 'Ana Costa', reportedAt: new Date(), updatedAt: new Date(), codeReferences: '', documents: [] },
        { id: 'demo-hf3', title: 'Email não enviado', description: 'Notificações pararam de ser enviadas', status: 'open', severity: 'high', reportedById: 'demo-u2', reportedByName: 'Maria Silva', reportedAt: new Date(), updatedAt: new Date(), codeReferences: '', documents: [] },
      ];
      hotfixes = demoHotfixes;
      set((s) => ({ hotfixes: [...s.hotfixes, ...demoHotfixes] }));
      toast.success(`${demoHotfixes.length} hotfixes de exemplo criados`);
    }

    // Now generate time entries for all entities
    const entities = [
      ...projects.map((p) => ({ id: p.id, name: p.title, type: 'project' as const })),
      ...patches.slice(0, 5).map((p) => ({ id: p.id, name: p.title, type: 'patch' as const })),
      ...hotfixes.slice(0, 5).map((h) => ({ id: h.id, name: h.title, type: 'hotfix' as const })),
    ];

    const demoEntries: TimeEntry[] = [];
    const now = new Date();
    for (let m = 0; m < 3; m++) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - m + 1, 0);
      const daysInMonth = monthEnd.getDate();

      for (const u of users) {
        const workDays = 15 + Math.floor(Math.random() * 6);
        for (let d = 0; d < workDays; d++) {
          const day = 1 + Math.floor(Math.random() * daysInMonth);
          const date = new Date(monthStart.getFullYear(), monthStart.getMonth(), day);
          if (date.getDay() === 0 || date.getDay() === 6) continue;

          const entity = entities[Math.floor(Math.random() * entities.length)];
          const hours = [1, 2, 3, 4, 5, 6, 8][Math.floor(Math.random() * 7)];
          const descriptions = ['Desenvolvimento', 'Revisão', 'Testes QA', 'Análise de processo', 'Correção', 'Deploy', 'Reunião', 'Documentação'];

          demoEntries.push({
            id: `demo-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            userId: u.id,
            userName: u.name,
            entityType: entity.type,
            entityId: entity.id,
            hours,
            description: descriptions[Math.floor(Math.random() * descriptions.length)],
            date,
            createdAt: date,
            updatedAt: date,
          });
        }
      }
    }

    set((s) => ({ timeEntries: [...demoEntries, ...s.timeEntries] }));
    toast.success(`${demoEntries.length} apontamentos de exemplo gerados`);
  },
}));
