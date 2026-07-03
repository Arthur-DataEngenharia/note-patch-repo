import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Send, Calendar, User, Clock, FileText, CheckCircle2, Circle } from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { Breadcrumb } from '@/components/shared/Breadcrumb';
import { cn, formatDate } from '@/lib/utils';

const WORKFLOW_STEPS = [
  { key: 'processo', label: 'Processo', role: 'processo' },
  { key: 'desenvolvimento', label: 'Desenvolvimento', role: 'desenvolvedor' },
  { key: 'qa', label: 'QA', role: 'qa' },
  { key: 'hotfix', label: 'Hotfix', role: 'desenvolvedor' },
  { key: 'publicado', label: 'Publicado', role: 'gerente' },
];

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { getProjectById, users, currentUser, publishProjectStage, deleteProject, updateProject } = useAppStore();
  const project = getProjectById(id!);
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishText, setPublishText] = useState('');
  const [publishStage, setPublishStage] = useState('');

  if (!project) {
    return (
      <div className="text-center py-16 animate-fade-in">
        <p className="text-white-muted mb-4">Projeto nao encontrado.</p>
        <Link to="/projects" className="btn-primary">Voltar</Link>
      </div>
    );
  }

  const isManager = currentUser.role === 'gerente' || currentUser.role === 'supervisor' || currentUser.role === 'admin';
  const canViewPrivate = isManager || project.createdById === currentUser.id || project.processoId === currentUser.id || project.devId === currentUser.id || project.qaId === currentUser.id;

  if (!project.isPublic && !canViewPrivate) {
    return (
      <div className="text-center py-16 animate-fade-in">
        <p className="text-white-muted mb-4">Voce nao tem permissao para ver este projeto.</p>
        <Link to="/projects" className="btn-primary">Voltar</Link>
      </div>
    );
  }

  const processo = users.find((u) => u.id === project.processoId);
  const dev = users.find((u) => u.id === project.devId);
  const qa = users.find((u) => u.id === project.qaId);

  const canPublish = (() => {
    if (project.status === 'concluido') return false;
    if (!project.currentStage) return false;
    const stageRole = WORKFLOW_STEPS.find((s) => s.key === project.currentStage)?.role;
    if (!stageRole) return false;
    if (isManager) return true;
    if (stageRole === 'processo' && currentUser.role === 'processo' && project.processoId === currentUser.id) return true;
    if (stageRole === 'desenvolvedor' && currentUser.role === 'desenvolvedor' && project.devId === currentUser.id) return true;
    if (stageRole === 'qa' && currentUser.role === 'qa' && project.qaId === currentUser.id) return true;
    return false;
  })();

  const handlePublish = async () => {
    if (!publishText || !project.currentStage) return;
    await publishProjectStage(project.id, project.currentStage as any, publishText);
    setPublishOpen(false);
    setPublishText('');
  };

  const currentStepIndex = WORKFLOW_STEPS.findIndex((s) => s.key === (project.currentStage || ''));
  const statusIndex = WORKFLOW_STEPS.findIndex((s) => s.key === project.status);

  return (
    <div className="animate-fade-in max-w-4xl mx-auto">
      <Breadcrumb items={[{ label: 'Projetos', to: '/projects' }, { label: project.title }]} />

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-medium px-2 py-0.5 rounded bg-red-soft text-red">
              {project.type === 'hotfix_emergencial' ? 'Hotfix Emergencial' : 'Note Patch'}
            </span>
            <span className="text-[10px] text-white-dim">Criado por {project.createdByName}</span>
          </div>
          <h1 className="text-xl font-bold">{project.title}</h1>
        </div>
        {isManager && (
          <div className="flex items-center gap-2">
            {!project.isPublic && (
              <button
                onClick={() => updateProject(project.id, { isPublic: true })}
                className="btn-secondary text-xs py-1.5"
              >
                Tornar Publico
              </button>
            )}
            <button onClick={() => deleteProject(project.id)} className="btn-danger text-xs py-1.5">
              Excluir
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Description */}
          <div className="glass-card p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-white-muted mb-3">Descricao</h3>
            <p className="text-sm text-white-dim whitespace-pre-wrap">{project.description || 'Sem descricao.'}</p>
          </div>

          {/* Workflow progress */}
          <div className="glass-card p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-white-muted mb-4">Workflow</h3>
            <div className="space-y-3">
              {WORKFLOW_STEPS.map((step, i) => {
                const isDone = statusIndex > i || (statusIndex === i && project.status !== 'draft');
                const isCurrent = project.currentStage === step.key;
                const stageEntry = project.stages.find((s) => s.stage === step.key);

                return (
                  <div key={step.key} className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : isCurrent ? (
                        <Circle className="w-4 h-4 text-red animate-pulse" />
                      ) : (
                        <Circle className="w-4 h-4 text-white-dim" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={cn('text-xs font-medium', isDone ? 'text-white' : isCurrent ? 'text-red' : 'text-white-dim')}>
                          {step.label}
                        </span>
                        {isCurrent && <span className="text-[10px] text-red bg-red-soft px-1.5 py-0.5 rounded">ATUAL</span>}
                      </div>
                      {stageEntry && (
                        <div className="mt-1.5 p-2.5 rounded-lg bg-black-surface-2 border border-black-border">
                          <p className="text-xs text-white-dim">{stageEntry.description}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[10px] text-white-muted">por {stageEntry.userName}</span>
                            <span className="text-[10px] text-white-muted">{formatDate(stageEntry.publishedAt)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {canPublish && !publishOpen && (
              <button
                onClick={() => setPublishOpen(true)}
                className="mt-4 w-full btn-primary text-xs py-2 flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                Publicar Etapa ({WORKFLOW_STEPS.find((s) => s.key === project.currentStage)?.label})
              </button>
            )}

            {publishOpen && (
              <div className="mt-4 p-3 rounded-lg bg-black-surface-2 border border-black-border space-y-2">
                <label className="text-[10px] text-white-dim uppercase">O que foi feito nesta etapa?</label>
                <textarea
                  value={publishText}
                  onChange={(e) => setPublishText(e.target.value)}
                  placeholder="Descreva o que voce fez..."
                  rows={3}
                  className="input-base w-full text-sm resize-none"
                />
                <div className="flex gap-2">
                  <button onClick={() => setPublishOpen(false)} className="btn-secondary flex-1 text-xs py-1.5">Cancelar</button>
                  <button onClick={handlePublish} disabled={!publishText.trim()} className="btn-primary flex-1 text-xs py-1.5">
                    Publicar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="glass-card p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-white-muted mb-3">Responsaveis</h3>
            <div className="space-y-3">
              {[
                { label: 'Processo', user: processo },
                { label: 'Desenvolvimento', user: dev },
                { label: 'QA', user: qa },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-white-dim" />
                  <div>
                    <p className="text-[10px] text-white-dim">{item.label}</p>
                    <p className="text-xs font-medium">{item.user?.name || 'Nao atribuido'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-white-muted mb-3">Detalhes</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-white-dim">Data Prevista</span>
                <span className={cn(new Date(project.targetDate) < new Date() && project.status !== 'concluido' ? 'text-amber-500' : 'text-white')}>
                  {formatDate(project.targetDate)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white-dim">Criado em</span>
                <span className="text-white">{formatDate(project.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white-dim">Status</span>
                <span className="text-white capitalize">{project.status.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white-dim">Visibilidade</span>
                <span className={project.isPublic ? 'text-green-500' : 'text-amber-500'}>
                  {project.isPublic ? 'Publico' : 'Privado'}
                </span>
              </div>
            </div>
          </div>

          {/* Documents */}
          {project.documents.length > 0 && (
            <div className="glass-card p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-white-muted mb-3">Documentos</h3>
              <div className="space-y-2">
                {project.documents.map((doc) => (
                  <a
                    key={doc.id}
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 rounded-lg bg-black-surface-2 border border-black-border hover:border-red-30 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5 text-red" />
                    <span className="text-xs truncate flex-1">{doc.title}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
