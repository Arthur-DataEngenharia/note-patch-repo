import { useState, useEffect } from 'react';
import { X, Download, FileText, Image, FileCode } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  url: string;
  title: string;
  type: string;
  onClose: () => void;
}

export function DocumentViewer({ url, title, type, onClose }: Props) {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    if (type === 'txt' || type === 'md') {
      fetch(url)
        .then((r) => r.text())
        .then((t) => { setContent(t); setLoading(false); })
        .catch(() => { setContent('Erro ao carregar documento.'); setLoading(false); });
    } else {
      setLoading(false);
    }
  }, [url, type]);

  const isPdf = type === 'pdf';
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(type);
  const isCode = ['js', 'ts', 'tsx', 'jsx', 'json', 'css', 'html', 'py', 'java', 'go', 'rs'].includes(type);
  const isText = type === 'txt' || type === 'md';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="glass-card w-full max-w-4xl max-h-[90vh] flex flex-col animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-black-border shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            {isPdf ? <FileText className="w-4 h-4 text-red shrink-0" />
              : isImage ? <Image className="w-4 h-4 text-blue-400 shrink-0" />
              : isCode ? <FileCode className="w-4 h-4 text-green-400 shrink-0" />
              : <FileText className="w-4 h-4 text-white-dim shrink-0" />}
            <h3 className="text-sm font-medium truncate">{title}</h3>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a href={url} download className="p-1.5 rounded-lg hover:bg-black-surface-2 transition-colors" title="Download">
              <Download className="w-4 h-4" />
            </a>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-black-surface-2 transition-colors" title="Fechar">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-6 h-6 border-2 border-red border-t-transparent rounded-full animate-spin" />
            </div>
          ) : isPdf ? (
            <iframe
              src={url}
              className="w-full h-[70vh] rounded-lg border border-black-border bg-white"
              title={title}
            />
          ) : isImage ? (
            <img src={url} alt={title} className="max-w-full max-h-[70vh] mx-auto rounded-lg" />
          ) : isCode || isText ? (
            <pre className="text-xs text-white-dim font-mono whitespace-pre-wrap bg-black-surface-2 rounded-lg p-4 border border-black-border overflow-auto max-h-[70vh]">
              {content}
            </pre>
          ) : (
            <div className="text-center py-16">
              <p className="text-white-dim text-sm mb-4">Visualizacao inline nao disponivel para este formato.</p>
              <a href={url} target="_blank" rel="noopener noreferrer" className="btn-primary text-sm px-4 py-2">
                Abrir Externamente
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
