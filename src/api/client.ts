const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json();
}

export const api = {
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

  // Audit Logs
  getAuditLogs: () => fetchJSON<any[]>('/audit-logs'),
  createAuditLog: (data: any) => fetchJSON<any>('/audit-logs', { method: 'POST', body: JSON.stringify(data) }),

  // Notifications
  getNotifications: () => fetchJSON<any[]>('/notifications'),
  markNotificationRead: (id: string) => fetchJSON<any>(`/notifications/${id}`, { method: 'PATCH', body: JSON.stringify({ read: true }) }),
  markAllNotificationsRead: () => fetchJSON<any>('/notifications', { method: 'PATCH', body: JSON.stringify({ markAllRead: true }) }),

  // Users
  getUsers: () => fetchJSON<any[]>('/users'),
};
