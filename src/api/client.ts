const API_BASE = import.meta.env.VITE_API_URL || '/api';

function getToken() {
  return localStorage.getItem('token');
}

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json();
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    fetchJSON<{ token: string; user: any }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (name: string, email: string, password: string, role?: string) =>
    fetchJSON<{ token: string; user: any }>('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password, role }) }),
  me: () => fetchJSON<any>('/auth/me'),

  // Patches
  getPatches: () => fetchJSON<any[]>('/patches'),
  getPatch: (id: string) => fetchJSON<any>(`/patches/${id}`),
  createPatch: (data: any) => fetchJSON<any>('/patches', { method: 'POST', body: JSON.stringify(data) }),
  updatePatch: (id: string, data: any) => fetchJSON<any>(`/patches/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deletePatch: (id: string) => fetchJSON<any>(`/patches/${id}`, { method: 'DELETE' }),

  // Hotfixes
  getHotfixes: () => fetchJSON<any[]>('/hotfixes'),
  createHotfix: (data: any) => fetchJSON<any>('/hotfixes', { method: 'POST', body: JSON.stringify(data) }),
  updateHotfix: (id: string, data: any) => fetchJSON<any>(`/hotfixes/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Documents
  getDocuments: () => fetchJSON<any[]>('/documents'),
  createDocument: (data: any) => fetchJSON<any>('/documents', { method: 'POST', body: JSON.stringify(data) }),

  // Classifications
  getClassifications: () => fetchJSON<any[]>('/classifications'),
  createClassification: (data: any) => fetchJSON<any>('/classifications', { method: 'POST', body: JSON.stringify(data) }),

  // Audit Logs
  getAuditLogs: () => fetchJSON<any[]>('/audit-logs'),
  createAuditLog: (data: any) => fetchJSON<any>('/audit-logs', { method: 'POST', body: JSON.stringify(data) }),

  // Notifications
  getNotifications: () => fetchJSON<any[]>('/notifications'),
  markNotificationRead: (id: string) => fetchJSON<any>(`/notifications/${id}`, { method: 'PATCH', body: JSON.stringify({ read: true }) }),
  markAllNotificationsRead: () => fetchJSON<any>('/notifications', { method: 'PATCH', body: JSON.stringify({ markAllRead: true }) }),

  // Users
  getUsers: () => fetchJSON<any[]>('/users'),

  // Time Entries
  getTimeEntries: (params?: { entityType?: string; entityId?: string }) => {
    const qs = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    return fetchJSON<any[]>(`/time-entries${qs}`);
  },
  createTimeEntry: (data: any) => fetchJSON<any>('/time-entries', { method: 'POST', body: JSON.stringify(data) }),
  deleteTimeEntry: (id: string) => fetchJSON<any>(`/time-entries/${id}`, { method: 'DELETE' }),

  // Projects
  getProjects: (scope?: string) => fetchJSON<any[]>(`/projects${scope ? `?scope=${scope}` : ''}`),
  getProject: (id: string) => fetchJSON<any>(`/projects/${id}`),
  createProject: (data: any) => fetchJSON<any>('/projects', { method: 'POST', body: JSON.stringify(data) }),
  updateProject: (id: string, data: any) => fetchJSON<any>(`/projects/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteProject: (id: string) => fetchJSON<any>(`/projects/${id}`, { method: 'DELETE' }),
  publishProjectStage: (id: string, data: any) => fetchJSON<any>(`/projects/${id}/stages`, { method: 'POST', body: JSON.stringify(data) }),

  // GitHub
  connectGitHub: (githubToken: string) => fetchJSON<any>('/github/connect', { method: 'POST', body: JSON.stringify({ githubToken }) }),
  getGitHubRepos: () => fetchJSON<any>('/github/repos'),
  getRepoTree: (owner: string, repo: string, branch?: string) =>
    fetchJSON<any>(`/github/repos/${owner}/${repo}/tree${branch ? `?branch=${branch}` : ''}`),
  getRepoContent: (owner: string, repo: string, path: string, ref?: string) =>
    fetchJSON<any>(`/github/repos/${owner}/${repo}/file?path=${encodeURIComponent(path)}${ref ? `&ref=${ref}` : ''}`),
  getRepoCommits: (owner: string, repo: string, sha?: string, path?: string) =>
    fetchJSON<any>(`/github/repos/${owner}/${repo}/commits?${sha ? `sha=${sha}` : ''}${path ? `&path=${path}` : ''}`),
};
