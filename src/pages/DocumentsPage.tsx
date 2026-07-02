import { useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Upload,
  FileText,
  FileType,
  FileCode,
  Image,
  Sheet,
  File,
  Download,
  Search,
  History,
  Files,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAppStore } from '@/store/appStore';
import { PageHeader } from '@/components/shared/PageHeader';
import { ClassificationBadge } from '@/components/shared/ClassificationBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { VISIBILITY_CONFIG } from '@/lib/constants';
import { cn, formatDate, formatFileSize } from '@/lib/utils';
import { getUser } from '@/lib/mockData';
import type { DocumentItem } from '@/types';

const TYPE_ICONS: Record<DocumentItem['type'], React.ElementType> = {
  pdf: FileText,
  docx: FileType,
  md: FileCode,
  image: Image,
  xlsx: Sheet,
  other: File,
};

function inferType(name: string): DocumentItem['type'] {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'pdf';
  if (ext === 'docx' || ext === 'doc') return 'docx';
  if (ext === 'md') return 'md';
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext ?? '')) return 'image';
  if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') return 'xlsx';
  return 'other';
}

export default function DocumentsPage() {
  const { documents, addDocument, addAuditLog, currentUser, patches, loading } = useAppStore();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    if (!query) return documents;
    const q = query.toLowerCase();
    return documents.filter(
      (d) => d.title.toLowerCase().includes(q) || d.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [documents, query]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      const doc: DocumentItem = {
        id: `d${Date.now()}-${file.name}`,
        title: file.name,
        type: inferType(file.name),
        fileUrl: URL.createObjectURL(file),
        fileSize: file.size,
        tags: [],
        visibility: 'internal',
        versions: [{ version: 1, fileUrl: '#', uploadedBy: currentUser.id, uploadedAt: new Date() }],
        uploadedBy: currentUser.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      addDocument(doc);
      addAuditLog({
        userId: currentUser.id,
        userName: currentUser.name,
        action: 'create',
        entity: 'document',
        entityId: doc.id,
        details: { title: doc.title },
      });
    });
    toast.success(`${files.length} documento(s) adicionado(s)`);
  };

  const exportSelected = () => {
    if (selected.length === 0) {
      toast.error('Selecione ao menos um documento');
      return;
    }
    addAuditLog({
      userId: currentUser.id,
      userName: currentUser.name,
      action: 'export',
      entity: 'document',
      entityId: selected.join(','),
      details: { count: selected.length, format: 'bundle' },
    });
    toast.success(`Bundle com ${selected.length} documento(s) gerado`, {
      description: 'Em produção: ZIP com índice, capa e timeline.',
    });
    setSelected([]);
  };

  return (
    <div>
      <PageHeader
        title="Documentos"
        description="Repositório de runbooks, RFCs, diagramas e planilhas"
        actions={
          <>
            {selected.length > 0 && (
              <button onClick={exportSelected} className="btn-primary flex items-center gap-2">
                <Download className="w-4 h-4" /> Exportar ({selected.length})
              </button>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-secondary flex items-center gap-2"
            >
              <Upload className="w-4 h-4" /> Upload
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </>
        }
      />

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white-dim" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar documentos por título ou tag..."
          className="input-base pl-10"
        />
      </div>

      {/* Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          'border-2 border-dashed rounded-xl p-8 mb-6 text-center transition-all duration-200',
          dragging
            ? 'border-red bg-red-soft shadow-red-glow'
            : 'border-black-border hover:border-red-30'
        )}
      >
        <Upload className={cn('w-8 h-8 mx-auto mb-2', dragging ? 'text-red' : 'text-white-dim')} />
        <p className="text-sm text-white-muted">
          Arraste arquivos aqui ou{' '}
          <button onClick={() => fileInputRef.current?.click()} className="text-red hover:underline">
            selecione do computador
          </button>
        </p>
        <p className="text-[11px] text-white-dim mt-1">PDF, DOCX, MD, imagens, XLSX</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-red" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Files} title="Nenhum documento" description="Faça upload do primeiro documento." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 animate-stagger">
          {filtered.map((doc) => {
            const Icon = TYPE_ICONS[doc.type];
            const isSelected = selected.includes(doc.id);
            const linkedPatch = doc.patchId ? patches.find((p) => p.id === doc.patchId) : undefined;
            const vis = VISIBILITY_CONFIG[doc.visibility];
            return (
              <div
                key={doc.id}
                className={cn(
                  'glass-card p-5 transition-all duration-200 cursor-pointer',
                  isSelected ? 'border-red shadow-red-glow' : 'hover:border-red-30'
                )}
                onClick={() => toggleSelect(doc.id)}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-red-soft border border-red-20 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-red" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold truncate">{doc.title}</h3>
                    <p className="text-[11px] text-white-dim">
                      {doc.type.toUpperCase()} · {formatFileSize(doc.fileSize)}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(doc.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="accent-red w-4 h-4 mt-1"
                    aria-label={`Selecionar ${doc.title}`}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-1.5 mb-3">
                  {doc.classificationId && (
                    <ClassificationBadge classificationId={doc.classificationId} size="sm" />
                  )}
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                    style={{ color: vis.color, backgroundColor: `${vis.color}1F` }}
                  >
                    {vis.label}
                  </span>
                  {doc.versions.length > 1 && (
                    <span className="flex items-center gap-1 text-[10px] text-white-dim">
                      <History className="w-3 h-3" /> v{doc.versions[0].version}
                    </span>
                  )}
                </div>

                {linkedPatch && (
                  <Link
                    to={`/patches/${linkedPatch.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="block text-[11px] text-red hover:underline mb-2 font-mono"
                  >
                    ↳ Patch {linkedPatch.version}
                  </Link>
                )}

                <div className="flex items-center justify-between text-[11px] text-white-dim pt-3 border-t border-black-border">
                  <span>{getUser(doc.uploadedBy)?.name}</span>
                  <span>{formatDate(doc.updatedAt)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
