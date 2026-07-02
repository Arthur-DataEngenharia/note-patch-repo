import type { Classification } from '@/types';

export const CLASSIFICATIONS: Classification[] = [
  { id: 'comercial', name: 'Comercial', description: 'Pedidos, contratos', color: '#3B82F6', icon: 'ShoppingCart', isActive: true, sortOrder: 1, patchCount: 0 },
  { id: 'producao', name: 'Produção', description: 'Manufatura, OPs', color: '#22C55E', icon: 'Factory', isActive: true, sortOrder: 2, patchCount: 0 },
  { id: 'portais', name: 'Portais', description: 'Portal parceiro/cliente', color: '#A855F7', icon: 'Globe', isActive: true, sortOrder: 3, patchCount: 0 },
  { id: 'financeiro', name: 'Financeiro', description: 'Contas pagar/receber', color: '#F59E0B', icon: 'DollarSign', isActive: true, sortOrder: 4, patchCount: 0 },
  { id: 'contabil', name: 'Contábil', description: 'Contabilidade, livros', color: '#06B6D4', icon: 'BookOpen', isActive: true, sortOrder: 5, patchCount: 0 },
  { id: 'fiscal', name: 'Fiscal', description: 'NFs, SPED, eSocial', color: '#EC4899', icon: 'Receipt', isActive: true, sortOrder: 6, patchCount: 0 },
  { id: 'suprimentos', name: 'Suprimentos', description: 'Compras, estoque', color: '#14B8A6', icon: 'Package', isActive: true, sortOrder: 7, patchCount: 0 },
  { id: 'rh', name: 'RH', description: 'Folha, ponto', color: '#F97316', icon: 'Users', isActive: true, sortOrder: 8, patchCount: 0 },
  { id: 'logistica', name: 'Logística', description: 'Transporte, expedição', color: '#8B5CF6', icon: 'Truck', isActive: true, sortOrder: 9, patchCount: 0 },
  { id: 'crm', name: 'CRM', description: 'Atendimento, pipeline', color: '#10B981', icon: 'PhoneCall', isActive: true, sortOrder: 10, patchCount: 0 },
  { id: 'integracoes', name: 'Integrações', description: 'APIs, webhooks', color: '#6366F1', icon: 'Plug', isActive: true, sortOrder: 11, patchCount: 0 },
  { id: 'infraestrutura', name: 'Infraestrutura', description: 'DevOps, banco', color: '#E11D48', icon: 'Server', isActive: true, sortOrder: 12, patchCount: 0 },
  { id: 'seguranca', name: 'Segurança', description: 'Auth, auditoria', color: '#DC2626', icon: 'Shield', isActive: true, sortOrder: 13, patchCount: 0 },
  { id: 'frontend', name: 'Frontend', description: 'UI/UX', color: '#F43F5E', icon: 'Monitor', isActive: true, sortOrder: 14, patchCount: 0 },
  { id: 'backend', name: 'Backend', description: 'Serviços, regras', color: '#7C3AED', icon: 'Code2', isActive: true, sortOrder: 15, patchCount: 0 },
];

export const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: 'Rascunho', color: '#888888', bg: 'rgba(136,136,136,0.12)' },
  in_review: { label: 'Em Revisão', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  approved: { label: 'Aprovado', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  published: { label: 'Publicado', color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
  archived: { label: 'Arquivado', color: '#555555', bg: 'rgba(85,85,85,0.12)' },
};

export const HOTFIX_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  reported: { label: 'Reportado', color: '#EF4444' },
  analyzing: { label: 'Em Análise', color: '#F59E0B' },
  fixing: { label: 'Em Correção', color: '#3B82F6' },
  deployed: { label: 'Deployado', color: '#A855F7' },
  validated: { label: 'Validado', color: '#22C55E' },
  closed: { label: 'Fechado', color: '#888888' },
};

export const SEVERITY_CONFIG: Record<string, { label: string; color: string; glow: boolean }> = {
  critical: { label: 'Crítica', color: '#FF1744', glow: true },
  high: { label: 'Alta', color: '#E11D48', glow: false },
  medium: { label: 'Média', color: '#F59E0B', glow: false },
};

export const HOTFIX_WORKFLOW_STEPS = [
  'reported',
  'analyzing',
  'fixing',
  'deployed',
  'validated',
  'closed',
] as const;

export const DOC_TYPE_ICONS: Record<string, string> = {
  pdf: 'FileText',
  docx: 'FileType',
  md: 'FileCode',
  image: 'Image',
  xlsx: 'Sheet',
  other: 'File',
};

export const VISIBILITY_CONFIG: Record<string, { label: string; color: string }> = {
  public: { label: 'Público', color: '#22C55E' },
  internal: { label: 'Interno', color: '#F59E0B' },
  restricted: { label: 'Restrito', color: '#E11D48' },
};
