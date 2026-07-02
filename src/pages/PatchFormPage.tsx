import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Github, Plus, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';
import { useAppStore } from '@/store/appStore';
import { PageHeader } from '@/components/shared/PageHeader';
import { cn } from '@/lib/utils';
import type { NotePatch, AffectedClass } from '@/types';

const STEPS = [
  'Identificação',
  'Conteúdo',
  'GitHub',
  'Classes Sankhya',
  'Impacto & Rollback',
  'Checklist',
  'Revisão',
];

const DEFAULT_CHECKLIST: { label: string; checked: boolean; checkedBy?: string }[] = [
  { label: 'Testes unitários', checked: false },
  { label: 'Homologação', checked: false },
  { label: 'Code review', checked: false },
  { label: 'Aprovação gestor', checked: false },
];

export default function PatchFormPage() {
  const navigate = useNavigate();
  const { classifications, addPatch, addAuditLog, currentUser } = useAppStore();
  const [step, setStep] = useState(0);
  const [maxVisited, setMaxVisited] = useState(0);

  const [form, setForm] = useState({
    version: '',
    title: '',
    classificationId: '',
    tags: '',
    summary: '',
    technicalNotes: '',
    githubRepo: '',
    githubBranch: '',
    githubCommitSha: '',
    githubPrUrl: '',
    impactedSystems: '',
    rollbackPlan: '',
    checklist: DEFAULT_CHECKLIST,
    isHotfix: false,
  });
  const [affectedClasses, setAffectedClasses] = useState<AffectedClass[]>([]);
  const [newClass, setNewClass] = useState({ className: '', filePath: '', lineRange: '' });

  const update = (field: string, value: any) => setForm((f) => ({ ...f, [field]: value }));

  const canAdvance = () => {
    if (step === 0) return form.version.trim() && form.title.trim() && form.classificationId;
    if (step === 1) return form.summary.trim() && form.technicalNotes.trim();
    return true;
  };

  const goTo = (s: number) => {
    if (s <= maxVisited) setStep(s);
  };

  const next = () => {
    if (!canAdvance()) {
      toast.error('Preencha os campos obrigatórios antes de avançar');
      return;
    }
    const n = Math.min(step + 1, STEPS.length - 1);
    setStep(n);
    setMaxVisited(Math.max(maxVisited, n));
  };

  const back = () => setStep(Math.max(step - 1, 0));

  const publish = () => {
    const patch: NotePatch = {
      id: `p${Date.now()}`,
      version: form.version,
      title: form.title,
      summary: form.summary,
      technicalNotes: form.technicalNotes,
      status: 'published',
      classificationId: form.classificationId,
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      authorId: currentUser.id,
      githubRepo: form.githubRepo || undefined,
      githubBranch: form.githubBranch || undefined,
      githubCommitSha: form.githubCommitSha || undefined,
      githubPrUrl: form.githubPrUrl || undefined,
      githubFiles: [],
      affectedClasses,
      impactedSystems: form.impactedSystems.split(',').map((s) => s.trim()).filter(Boolean),
      rollbackPlan: form.rollbackPlan || undefined,
      checklist: form.checklist,
      deployedAt: new Date(),
      publishedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      isHotfix: form.isHotfix,
    };
    addPatch(patch);
    addAuditLog({
      userId: currentUser.id,
      userName: currentUser.name,
      action: 'publish',
      entity: 'patch',
      entityId: patch.id,
      details: { version: patch.version },
    });
    toast.success(`Patch ${patch.version} publicado com sucesso!`);
    navigate(`/patches/${patch.id}`);
  };

  const addClass = () => {
    if (!newClass.className.trim()) return;
    setAffectedClasses((prev) => [
      ...prev,
      {
        className: newClass.className,
        filePath: newClass.filePath,
        lineRange: newClass.lineRange || undefined,
        repoUrl: form.githubRepo ? `https://github.com/${form.githubRepo}` : '#',
      },
    ]);
    setNewClass({ className: '', filePath: '', lineRange: '' });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <PageHeader title="Novo Note Patch" description="Registre o que foi deployado em produção" />

      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center gap-1 mb-3 overflow-x-auto pb-1">
          {STEPS.map((label, i) => (
            <button
              key={label}
              onClick={() => goTo(i)}
              disabled={i > maxVisited}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-all',
                i === step
                  ? 'bg-red text-[#FFFFFF] shadow-red-glow'
                  : i <= maxVisited
                    ? 'bg-red-soft text-red hover:bg-red-20 cursor-pointer'
                    : 'bg-black-surface-2 text-white-dim cursor-not-allowed'
              )}
            >
              {i < step ? <Check className="w-3 h-3" /> : <span>{i + 1}</span>}
              {label}
            </button>
          ))}
        </div>
        <div className="h-1 bg-black-surface-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-red-gradient transition-all duration-500 rounded-full"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="glass-card p-6 mb-6 animate-fade-in" key={step}>
        {/* Step 0: Identificação */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-white-muted mb-1.5 block">Versão *</label>
                <input
                  value={form.version}
                  onChange={(e) => update('version', e.target.value)}
                  placeholder="ex: 4.28.118"
                  className="input-base font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-white-muted mb-1.5 block">Classificação *</label>
                <select
                  value={form.classificationId}
                  onChange={(e) => update('classificationId', e.target.value)}
                  className="input-base"
                >
                  <option value="">Selecione...</option>
                  {classifications.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} — {c.description}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-white-muted mb-1.5 block">Título *</label>
              <input
                value={form.title}
                onChange={(e) => update('title', e.target.value)}
                placeholder="Descreva a mudança de forma clara"
                className="input-base"
              />
            </div>
            <div>
              <label className="text-xs text-white-muted mb-1.5 block">Tags (separadas por vírgula)</label>
              <input
                value={form.tags}
                onChange={(e) => update('tags', e.target.value)}
                placeholder="ex: nfe, urgente, breaking-change"
                className="input-base"
              />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={form.isHotfix}
                onChange={(e) => update('isHotfix', e.target.checked)}
                className="accent-red w-4 h-4"
              />
              <span className="text-white-muted">Este patch é um hotfix de emergência</span>
            </label>
          </div>
        )}

        {/* Step 1: Conteúdo */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-white-muted mb-1.5 block">Resumo Executivo *</label>
              <textarea
                value={form.summary}
                onChange={(e) => update('summary', e.target.value)}
                placeholder="Resumo de alto nível para stakeholders"
                rows={3}
                className="input-base resize-none"
              />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-white-muted mb-1.5 block">Notas Técnicas (Markdown) *</label>
                <textarea
                  value={form.technicalNotes}
                  onChange={(e) => update('technicalNotes', e.target.value)}
                  placeholder={'## Contexto\n\nDescreva o problema...\n\n## Solução\n\n- Item 1'}
                  rows={14}
                  className="input-base resize-none font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-xs text-white-muted mb-1.5 block">Preview</label>
                <div className="bg-black-surface-2 border border-black-border rounded-lg p-4 h-[340px] overflow-y-auto scrollbar-custom text-sm [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-white [&_h2]:mt-3 [&_code]:text-red [&_code]:font-mono [&_ul]:list-disc [&_ul]:pl-5 [&_blockquote]:border-l-2 [&_blockquote]:border-red [&_blockquote]:pl-3">
                  {form.technicalNotes ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{form.technicalNotes}</ReactMarkdown>
                  ) : (
                    <p className="text-white-dim text-xs">O preview do markdown aparecerá aqui...</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: GitHub */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-white-muted mb-2">
              <Github className="w-4 h-4 text-red" />
              Conecte este patch ao código no GitHub (opcional)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-white-muted mb-1.5 block">Repositório (org/repo)</label>
                <input
                  value={form.githubRepo}
                  onChange={(e) => update('githubRepo', e.target.value)}
                  placeholder="empresa/sankhya-fiscal"
                  className="input-base font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-white-muted mb-1.5 block">Branch</label>
                <input
                  value={form.githubBranch}
                  onChange={(e) => update('githubBranch', e.target.value)}
                  placeholder="main"
                  className="input-base font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-white-muted mb-1.5 block">Commit SHA</label>
                <input
                  value={form.githubCommitSha}
                  onChange={(e) => update('githubCommitSha', e.target.value)}
                  placeholder="a3f8c21"
                  className="input-base font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-white-muted mb-1.5 block">URL do Pull Request</label>
                <input
                  value={form.githubPrUrl}
                  onChange={(e) => update('githubPrUrl', e.target.value)}
                  placeholder="https://github.com/..."
                  className="input-base font-mono"
                />
              </div>
            </div>
            <p className="text-[11px] text-white-dim">
              Em produção, os arquivos alterados serão importados automaticamente via GitHub API (Octokit).
            </p>
          </div>
        )}

        {/* Step 3: Classes */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-white-muted">
              Aponte as classes do repositório Sankhya afetadas por este patch.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_1.5fr_100px_auto] gap-2">
              <input
                value={newClass.className}
                onChange={(e) => setNewClass({ ...newClass, className: e.target.value })}
                placeholder="Nome da classe"
                className="input-base font-mono text-xs"
              />
              <input
                value={newClass.filePath}
                onChange={(e) => setNewClass({ ...newClass, filePath: e.target.value })}
                placeholder="Caminho do arquivo"
                className="input-base font-mono text-xs"
              />
              <input
                value={newClass.lineRange}
                onChange={(e) => setNewClass({ ...newClass, lineRange: e.target.value })}
                placeholder="Linhas"
                className="input-base font-mono text-xs"
              />
              <button onClick={addClass} className="btn-primary flex items-center gap-1 justify-center">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2">
              {affectedClasses.map((c, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-lg bg-surface-2-60 border border-black-border"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-xs text-red font-semibold">{c.className}</p>
                    <p className="text-[11px] text-white-dim truncate">
                      {c.filePath}
                      {c.lineRange && `:${c.lineRange}`}
                    </p>
                  </div>
                  <button
                    onClick={() => setAffectedClasses((prev) => prev.filter((_, idx) => idx !== i))}
                    className="text-white-dim hover:text-red transition-colors"
                    aria-label="Remover classe"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {affectedClasses.length === 0 && (
                <p className="text-xs text-white-dim text-center py-4">Nenhuma classe adicionada</p>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Impacto & Rollback */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <label className="text-xs text-white-muted mb-1.5 block">
                Sistemas Impactados (separados por vírgula)
              </label>
              <input
                value={form.impactedSystems}
                onChange={(e) => update('impactedSystems', e.target.value)}
                placeholder="ex: Emissão NF-e, Faturamento"
                className="input-base"
              />
            </div>
            <div>
              <label className="text-xs text-white-muted mb-1.5 block">Plano de Rollback</label>
              <textarea
                value={form.rollbackPlan}
                onChange={(e) => update('rollbackPlan', e.target.value)}
                placeholder={'1. Reverter commit...\n2. Restaurar versão anterior...\n3. Reiniciar serviço...'}
                rows={6}
                className="input-base resize-none"
              />
            </div>
          </div>
        )}

        {/* Step 5: Checklist */}
        {step === 5 && (
          <div className="space-y-3">
            <p className="text-sm text-white-muted mb-4">Marque os itens já validados:</p>
            {form.checklist.map((item, i) => (
              <label
                key={item.label}
                className="flex items-center gap-3 p-3 rounded-lg bg-surface-2-60 border border-black-border cursor-pointer hover:border-red-40 transition-all"
              >
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={(e) => {
                    const updated = [...form.checklist];
                    updated[i] = {
                      ...updated[i],
                      checked: e.target.checked,
                      checkedBy: e.target.checked ? currentUser.name : undefined,
                    };
                    update('checklist', updated);
                  }}
                  className="accent-red w-4 h-4"
                />
                <span className="text-sm">{item.label}</span>
              </label>
            ))}
          </div>
        )}

        {/* Step 6: Revisão */}
        {step === 6 && (
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-mono text-red font-bold">{form.version}</span>
              <span className="font-semibold">{form.title}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-white-dim mb-1">Classificação</p>
                <p>{classifications.find((c) => c.id === form.classificationId)?.name ?? '—'}</p>
              </div>
              <div>
                <p className="text-white-dim mb-1">Tags</p>
                <p>{form.tags || '—'}</p>
              </div>
              <div>
                <p className="text-white-dim mb-1">GitHub</p>
                <p className="font-mono">{form.githubRepo || '—'}</p>
              </div>
              <div>
                <p className="text-white-dim mb-1">Classes afetadas</p>
                <p>{affectedClasses.length}</p>
              </div>
              <div>
                <p className="text-white-dim mb-1">Sistemas impactados</p>
                <p>{form.impactedSystems || '—'}</p>
              </div>
              <div>
                <p className="text-white-dim mb-1">Checklist</p>
                <p>
                  {form.checklist.filter((c) => c.checked).length}/{form.checklist.length} concluídos
                </p>
              </div>
            </div>
            <div>
              <p className="text-white-dim text-xs mb-1">Resumo</p>
              <p className="text-white-muted">{form.summary}</p>
            </div>
            <div className="p-4 rounded-lg bg-red-soft border border-red-30 text-xs text-white-muted">
              Ao publicar, o patch fica <strong className="text-white">travado para edição</strong> e será
              registrado na trilha de auditoria.
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button onClick={back} disabled={step === 0} className="btn-secondary flex items-center gap-2 disabled:opacity-40">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        {step < STEPS.length - 1 ? (
          <button onClick={next} className="btn-primary flex items-center gap-2">
            Avançar <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={publish} className="btn-primary flex items-center gap-2 shadow-red-glow">
            <Check className="w-4 h-4" /> Publicar Patch
          </button>
        )}
      </div>
    </div>
  );
}
