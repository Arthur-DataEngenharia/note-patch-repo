import { useState, useEffect, useCallback } from 'react';
import {
  X, Folder, FileCode, GitBranch, GitCommit, ChevronRight, ChevronDown,
  Copy, Check, Loader2, Plus, Link2, Eye, Flame, FileText,
} from 'lucide-react';
import { api } from '@/api/client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface TreeItem {
  path: string;
  type: 'tree' | 'blob';
  sha: string;
  mode: string;
  size?: number;
}

interface Commit {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
}

interface CodeRef {
  repo: string;
  path: string;
  sha: string;
  lines?: string;
  content?: string;
  branch: string;
}

interface Props {
  owner: string;
  repo: string;
  onClose: () => void;
  onAddToPatch?: (ref: CodeRef) => void;
  onAddToHotfix?: (ref: CodeRef) => void;
}

function buildFileTree(items: TreeItem[]) {
  const root: Record<string, any> = {};
  items.forEach((item) => {
    const parts = item.path.split('/');
    let current = root;
    parts.forEach((part, i) => {
      const isLast = i === parts.length - 1;
      const key = part;
      if (!current[key]) {
        current[key] = isLast ? { ...item, name: part, children: null } : { name: part, type: 'tree', children: {} };
      }
      if (!isLast) current = current[key].children;
    });
  });
  return root;
}

function sortTree(tree: Record<string, any>): Record<string, any> {
  const sorted: Record<string, any> = {};
  const entries = Object.entries(tree).sort(([, a], [, b]) => {
    if (a.type === 'tree' && b.type !== 'tree') return -1;
    if (a.type !== 'tree' && b.type === 'tree') return 1;
    return a.name.localeCompare(b.name);
  });
  entries.forEach(([key, val]) => {
    sorted[key] = val.children ? { ...val, children: sortTree(val.children) } : val;
  });
  return sorted;
}

export default function RepoDetailModal({ owner, repo, onClose, onAddToPatch, onAddToHotfix }: Props) {
  const [tree, setTree] = useState<TreeItem[]>([]);
  const [treeLoading, setTreeLoading] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [fileLoading, setFileLoading] = useState(false);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [commitsLoading, setCommitsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'code' | 'commits'>('code');
  const [selectedLines, setSelectedLines] = useState<{ start: number; end: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const [branch, setBranch] = useState('main');

  useEffect(() => {
    loadTree();
    loadCommits();
  }, [owner, repo]);

  const loadTree = async () => {
    setTreeLoading(true);
    try {
      const data = await api.getRepoTree(owner, repo);
      setTree(data.tree || []);
      if (data.branch) setBranch(data.branch);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao carregar arvore do repo');
    } finally {
      setTreeLoading(false);
    }
  };

  const loadCommits = async (filePath?: string) => {
    setCommitsLoading(true);
    try {
      const data = await api.getRepoCommits(owner, repo, undefined, filePath);
      setCommits(data.commits || []);
      if (data.branch) setBranch(data.branch);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao carregar commits');
    } finally {
      setCommitsLoading(false);
    }
  };

  const loadFile = async (path: string, sha: string) => {
    setFileLoading(true);
    setSelectedFile(path);
    setSelectedLines(null);
    try {
      const data = await api.getRepoContent(owner, repo, path, branch);
      setFileContent(data.decoded || '');
      loadCommits(path);
    } catch {
      toast.error('Erro ao carregar arquivo');
      setFileContent('');
    } finally {
      setFileLoading(false);
    }
  };

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const handleLineClick = (lineNum: number, shiftKey: boolean) => {
    if (!shiftKey || !selectedLines) {
      setSelectedLines({ start: lineNum, end: lineNum });
      return;
    }
    setSelectedLines({
      start: Math.min(selectedLines.start, lineNum),
      end: Math.max(selectedLines.start, lineNum),
    });
  };

  const getSelectedText = () => {
    if (!selectedLines || !fileContent) return '';
    const lines = fileContent.split('\n');
    return lines.slice(selectedLines.start - 1, selectedLines.end).join('\n');
  };

  const buildRef = (): CodeRef => ({
    repo: `${owner}/${repo}`,
    path: selectedFile || '',
    sha: selectedLines ? `L${selectedLines.start}-L${selectedLines.end}` : '',
    lines: selectedLines ? `L${selectedLines.start}-${selectedLines.end}` : undefined,
    content: getSelectedText() || undefined,
    branch,
  });

  const addToPatch = () => {
    if (onAddToPatch) { onAddToPatch(buildRef()); toast.success('Referencia adicionada ao patch'); }
  };
  const addToHotfix = () => {
    if (onAddToHotfix) { onAddToHotfix(buildRef()); toast.success('Referencia adicionada ao hotfix'); }
  };

  const treeData = sortTree(buildFileTree(tree));

  const renderTree = (node: Record<string, any>, parentPath: string = '') => {
    return Object.values(node).map((item: any) => {
      const fullPath = parentPath ? `${parentPath}/${item.name}` : item.name;
      const isFolder = item.type === 'tree';
      const isExpanded = expandedFolders.has(fullPath);

      if (isFolder) {
        return (
          <div key={fullPath}>
            <button
              onClick={() => toggleFolder(fullPath)}
              className="flex items-center gap-1.5 w-full px-2 py-1 text-xs text-white-dim hover:bg-hover rounded transition-colors"
            >
              {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              <Folder className="w-3.5 h-3.5 text-amber-400" />
              <span className="truncate">{item.name}</span>
            </button>
            {isExpanded && (
              <div className="pl-4 border-l border-black-border ml-2">
                {renderTree(item.children, fullPath)}
              </div>
            )}
          </div>
        );
      }

      return (
        <button
          key={fullPath}
          onClick={() => loadFile(fullPath, item.sha)}
          className={cn(
            'flex items-center gap-1.5 w-full px-2 py-1 text-xs hover:bg-hover rounded transition-colors truncate',
            selectedFile === fullPath ? 'bg-red/10 text-red' : 'text-white-dim'
          )}
        >
          <FileCode className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span className="truncate">{item.name}</span>
        </button>
      );
    });
  };

  const lines = fileContent.split('\n');

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 lg:p-4 animate-fade-in">
      <div className="w-full h-full max-w-7xl glass-card border border-black-border rounded-xl flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-black-border shrink-0">
          <div className="flex items-center gap-3">
            <GitBranch className="w-4 h-4 text-red" />
            <div>
              <h3 className="text-sm font-semibold">{owner}/{repo}</h3>
              <p className="text-[10px] text-white-dim">Branch: {branch}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedFile && selectedLines && (
              <>
                <span className="text-[10px] text-white-dim bg-black-surface-2 px-2 py-1 rounded">
                  {selectedFile}:{selectedLines.start}-{selectedLines.end}
                </span>
                {onAddToPatch && (
                  <button onClick={addToPatch} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Patch
                  </button>
                )}
                {onAddToHotfix && (
                  <button onClick={addToHotfix} className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1">
                    <Flame className="w-3 h-3" /> Hotfix
                  </button>
                )}
              </>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-hover text-white-dim">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* File Tree */}
          <div className="w-64 border-r border-black-border flex flex-col shrink-0">
            <div className="px-3 py-2 border-b border-black-border flex items-center gap-2">
              <Folder className="w-3.5 h-3.5 text-white-dim" />
              <span className="text-[11px] font-semibold text-white-dim">Arquivos</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5 scrollbar-custom">
              {treeLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-red" />
                </div>
              ) : (
                renderTree(treeData)
              )}
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Tabs */}
            <div className="flex items-center border-b border-black-border shrink-0">
              <button
                onClick={() => setActiveTab('code')}
                className={cn(
                  'px-4 py-2 text-xs font-medium border-b-2 transition-colors',
                  activeTab === 'code' ? 'border-red text-red' : 'border-transparent text-white-dim hover:text-white'
                )}
              >
                <span className="flex items-center gap-1.5"><FileCode className="w-3.5 h-3.5" /> Codigo</span>
              </button>
              <button
                onClick={() => setActiveTab('commits')}
                className={cn(
                  'px-4 py-2 text-xs font-medium border-b-2 transition-colors',
                  activeTab === 'commits' ? 'border-red text-red' : 'border-transparent text-white-dim hover:text-white'
                )}
              >
                <span className="flex items-center gap-1.5"><GitCommit className="w-3.5 h-3.5" /> Commits</span>
              </button>
              {selectedFile && (
                <span className="ml-auto mr-3 text-[10px] text-white-dim font-mono truncate max-w-[300px]">
                  {selectedFile}
                </span>
              )}
            </div>

            {/* Content area */}
            <div className="flex-1 overflow-hidden">
              {activeTab === 'code' ? (
                <div className="h-full overflow-auto scrollbar-custom">
                  {fileLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="w-6 h-6 animate-spin text-red" />
                    </div>
                  ) : selectedFile ? (
                    <div className="relative">
                      <div className="absolute top-2 right-2 z-10">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(fileContent);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 1500);
                          }}
                          className="p-1.5 rounded bg-black-surface-2 border border-black-border hover:border-red-40 transition-colors"
                          title="Copiar codigo"
                        >
                          {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <table className="w-full text-xs font-mono">
                        <tbody>
                          {lines.map((line, i) => {
                            const lineNum = i + 1;
                            const isSelected = selectedLines && lineNum >= selectedLines.start && lineNum <= selectedLines.end;
                            return (
                              <tr
                                key={lineNum}
                                onClick={(e) => handleLineClick(lineNum, e.shiftKey)}
                                className={cn(
                                  'cursor-pointer select-none',
                                  isSelected ? 'bg-red/10' : 'hover:bg-hover'
                                )}
                              >
                                <td className="text-right pr-3 pl-4 py-0.5 text-white-muted select-none w-12 shrink-0 text-[10px] border-r border-black-border">
                                  {lineNum}
                                </td>
                                <td className="pl-3 py-0.5 whitespace-pre-wrap break-all text-white-dim">
                                  {line || ' '}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-white-dim">
                      <FileText className="w-10 h-10 mb-3" />
                      <p className="text-sm">Selecione um arquivo na arvore</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full overflow-y-auto scrollbar-custom p-3">
                  {commitsLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="w-6 h-6 animate-spin text-red" />
                    </div>
                  ) : commits.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-white-dim">
                      <GitCommit className="w-10 h-10 mb-3" />
                      <p className="text-sm">Nenhum commit encontrado</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {commits.map((c) => (
                        <a
                          key={c.sha}
                          href={c.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block p-3 rounded-lg bg-surface-2-50 border border-black-border hover:border-red-40 transition-all"
                        >
                          <p className="text-xs font-medium text-white truncate">{c.message}</p>
                          <div className="flex items-center gap-2 mt-1.5 text-[10px] text-white-dim">
                            <span>{c.author}</span>
                            <span>·</span>
                            <span className="font-mono text-white-muted">{c.sha.slice(0, 7)}</span>
                            <span>·</span>
                            <span>{new Date(c.date).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
