export interface NotePatch {
  id: string;
  version: string;
  title: string;
  summary: string;
  technicalNotes: string;
  status: 'draft' | 'in_review' | 'approved' | 'published' | 'archived';
  classificationId: string;
  subClassificationId?: string;
  tags: string[];
  authorId: string;
  reviewerId?: string;
  githubRepo?: string;
  githubBranch?: string;
  githubCommitSha?: string;
  githubPrUrl?: string;
  githubFiles: GithubFile[];
  affectedClasses: AffectedClass[];
  impactedSystems: string[];
  rollbackPlan?: string;
  checklist: ChecklistItem[];
  deployedAt: Date;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  isHotfix?: boolean;
  favorite?: boolean;
  isDemo?: boolean;
}

export interface GithubFile {
  path: string;
  status: 'added' | 'modified' | 'deleted';
  additions: number;
  deletions: number;
  diffUrl: string;
}

export interface AffectedClass {
  className: string;
  filePath: string;
  repoUrl: string;
  lineRange?: string;
  description?: string;
}

export interface ChecklistItem {
  label: string;
  checked: boolean;
  checkedBy?: string;
  checkedAt?: Date;
}

export interface Hotfix {
  id: string;
  patchId?: string;
  title: string;
  severity: 'critical' | 'high' | 'medium';
  affectedSystem: string;
  description: string;
  commitSha?: string;
  status: 'reported' | 'analyzing' | 'fixing' | 'deployed' | 'validated' | 'closed';
  reportedBy: string;
  resolvedBy?: string;
  reportedAt: Date;
  deployedAt?: Date;
  resolvedAt?: Date;
  resolutionTimeMinutes?: number;
  postMortemNeeded: boolean;
  postMortemDone: boolean;
  isDemo?: boolean;
}

export interface DocumentItem {
  id: string;
  title: string;
  type: 'pdf' | 'docx' | 'md' | 'image' | 'xlsx' | 'other';
  fileUrl: string;
  fileSize: number;
  classificationId?: string;
  patchId?: string;
  tags: string[];
  visibility: 'public' | 'internal' | 'restricted';
  versions: DocumentVersion[];
  uploadedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentVersion {
  version: number;
  fileUrl: string;
  uploadedBy: string;
  uploadedAt: Date;
  changeNote?: string;
}

export interface Classification {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  isActive: boolean;
  parentId?: string;
  sortOrder: number;
  patchCount: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'gerente' | 'supervisor' | 'desenvolvedor' | 'processo' | 'qa' | 'viewer' | 'admin';
  avatarUrl?: string;
  githubUsername?: string;
  isDemo?: boolean;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: 'create' | 'update' | 'delete' | 'export' | 'archive' | 'publish';
  entity: string;
  entityId: string;
  details: Record<string, any>;
  timestamp: Date;
}

export interface Notification {
  id: string;
  type: 'new_patch' | 'new_hotfix' | 'review_requested' | 'doc_linked' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  link?: string;
}

export interface TimeEntry {
  id: string;
  userId: string;
  userName: string;
  entityType: 'patch' | 'hotfix' | 'project';
  entityId: string;
  hours: number;
  description?: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
  isDemo?: boolean;
}

export interface Project {
  id: string;
  title: string;
  type: 'hotfix_emergencial' | 'patch_note';
  description: string;
  status: 'draft' | 'em_processo' | 'desenvolvimento' | 'qa' | 'hotfix' | 'publicado' | 'concluido';
  currentStage: string | null;
  targetDate: Date;
  createdById: string;
  createdByName: string;
  processoId?: string;
  devId?: string;
  qaId?: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  stages: ProjectStage[];
  documents: DocumentItem[];
  isDemo?: boolean;
}

export interface ProjectStage {
  id: string;
  projectId: string;
  stage: 'processo' | 'desenvolvimento' | 'qa' | 'hotfix' | 'publicado' | 'concluido';
  userId: string;
  userName: string;
  description: string;
  publishedAt: Date;
}

export type PageStatus = 'draft' | 'in_review' | 'approved' | 'published' | 'archived';
