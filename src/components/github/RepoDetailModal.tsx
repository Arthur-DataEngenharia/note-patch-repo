import { useState, useEffect, useCallback, useRef } from 'react';
import {
  X, Folder, FileCode, GitBranch, GitCommit, ChevronRight, ChevronDown,
  Copy, Check, Loader2, Plus, Link2, Eye, Flame, FileText, Search, Download,
  ChevronUp,
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
        current[key] = isLast
          ? { ...item, name: part, children: null }
          : { name: part, type: 'tree', children: {} };
      } else if (!isLast && current[key].children === null) {
        // Convert previously created leaf to folder
        current[key] = { ...current[key], type: 'tree', children: {} };
      }
      if (!isLast) {
        current = current[key].children;
      }
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

// Simple syntax highlighting for dark theme
function highlightLine(line: string, lang: string, search?: string): React.ReactNode[] {
  const tokens: React.ReactNode[] = [];
  let remaining = line;
  let key = 0;

  const addToken = (text: string, cls: string) => {
    tokens.push(<span key={key++} className={cls}>{text}</span>);
  };

  // Comments first
  if (lang === 'js' || lang === 'ts' || lang === 'java' || lang === 'jsx' || lang === 'tsx' || lang === 'go' || lang === 'rust' || lang === 'swift' || lang === 'kotlin') {
    const commentMatch = remaining.match(/^(.*?)(\/\/.*)$/);
    if (commentMatch) {
      if (commentMatch[1]) remaining = commentMatch[1];
      else remaining = '';
      addToken(remaining, '');
      addToken(commentMatch[2], 'text-gray-500 italic');
      return tokens;
    }
  }
  if (lang === 'py') {
    const commentMatch = remaining.match(/^(.*?)(#.*)$/);
    if (commentMatch) {
      if (commentMatch[1]) remaining = commentMatch[1];
      else remaining = '';
      addToken(remaining, '');
      addToken(commentMatch[2], 'text-gray-500 italic');
      return tokens;
    }
  }
  if (lang === 'sql') {
    const commentMatch = remaining.match(/^(.*?)(--.*)$/);
    if (commentMatch) {
      if (commentMatch[1]) remaining = commentMatch[1];
      else remaining = '';
      addToken(remaining, '');
      addToken(commentMatch[2], 'text-gray-500 italic');
      return tokens;
    }
  }

  // Strings
  const stringRegex = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g;
  const parts = remaining.split(stringRegex);
  parts.forEach((part, i) => {
    if (i % 2 === 1) {
      addToken(part, 'text-emerald-400');
    } else {
      // Numbers
      const numParts = part.split(/(\b\d+(?:\.\d+)?\b)/g);
      numParts.forEach((np, j) => {
        if (j % 2 === 1) addToken(np, 'text-orange-400');
        else {
          // Keywords
          const kwRegex = /\b(import|export|from|const|let|var|function|class|interface|type|return|if|else|for|while|switch|case|break|continue|new|this|super|extends|implements|async|await|try|catch|finally|throw|typeof|instanceof|in|of|as|true|false|null|undefined|void|public|private|protected|static|readonly|get|set|package|module|require|def|print|len|range|with|yield|lambda|except|pass|raise|assert|del|global|nonlocal|and|or|not|is|SELECT|INSERT|UPDATE|DELETE|FROM|WHERE|JOIN|LEFT|RIGHT|INNER|OUTER|ON|GROUP|ORDER|BY|HAVING|LIMIT|OFFSET|CREATE|TABLE|ALTER|DROP|INDEX|VALUES|AND|OR|NOT|NULL|LIKE|IN|BETWEEN|EXISTS|UNION|ALL|DISTINCT|COUNT|SUM|AVG|MIN|MAX|AS|CASE|WHEN|THEN|ELSE|END|IF)\b/g;
          const kwParts = np.split(kwRegex);
          kwParts.forEach((kp, k) => {
            if (k % 2 === 1) addToken(kp, 'text-fuchsia-400 font-medium');
            else {
              // Functions / method calls
              const fnParts = kp.split(/(\b[a-zA-Z_]\w*\s*\()/g);
              fnParts.forEach((fp, m) => {
                if (m % 2 === 1) addToken(fp, 'text-blue-400');
                else {
                  // Types / classes (Capitalized words)
                  const typeParts = fp.split(/(\b[A-Z]\w*\b)/g);
                  typeParts.forEach((tp, n) => {
                    if (n % 2 === 1) addToken(tp, 'text-cyan-400');
                    else addToken(tp, '');
                  });
                }
              });
            }
          });
        }
      });
    }
  });

  return tokens;
}

function highlightSearch(text: string, search: string): React.ReactNode[] {
  if (!search) return [<span key="0">{text}</span>];
  const parts = text.split(new RegExp(`(${search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return parts.map((part, i) => {
    if (part.toLowerCase() === search.toLowerCase()) {
      return <span key={i} className="bg-amber-500/30 text-amber-300 font-semibold rounded px-0.5">{part}</span>;
    }
    return <span key={i}>{part}</span>;
  });
}

function wrapTokensWithSearch(tokens: React.ReactNode[], search?: string): React.ReactNode[] {
  if (!search) return tokens;
  return tokens.map((token, i) => {
    if (typeof token === 'string') return <span key={i}>{highlightSearch(token, search)}</span>;
    if (React.isValidElement(token)) {
      const el = token as React.ReactElement<any>;
      const children = el.props.children;
      if (typeof children === 'string') {
        return React.cloneElement(el, { key: i, children: highlightSearch(children, search) });
      }
    }
    return token;
  });
}

function getLangFromPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    js: 'js', jsx: 'jsx', ts: 'ts', tsx: 'tsx', java: 'java', kt: 'kotlin', swift: 'swift',
    py: 'py', go: 'go', rs: 'rust', cpp: 'cpp', c: 'c', h: 'c', hpp: 'cpp',
    sql: 'sql', json: 'json', xml: 'xml', yaml: 'yaml', yml: 'yaml', md: 'md',
    sh: 'sh', bash: 'sh', dockerfile: 'docker', css: 'css', scss: 'css', html: 'html',
    php: 'php', rb: 'rb', r: 'r', scala: 'scala', groovy: 'groovy', cs: 'cs',
    fs: 'fs', vb: 'vb', pl: 'pl', lua: 'lua', dart: 'dart', m: 'objc', mm: 'objc',
  };
  return map[ext] || '';
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
  const [treeSearch, setTreeSearch] = useState('');
  const [codeSearch, setCodeSearch] = useState('');
  const [searchMatchIndex, setSearchMatchIndex] = useState(0);
  const treeSearchRef = useRef<HTMLInputElement>(null);
  const codeSearchRef = useRef<HTMLInputElement>(null);
  const codeContainerRef = useRef<HTMLDivElement>(null);

  // Auto-focus tree search on mount
  useEffect(() => {
    treeSearchRef.current?.focus();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        if (activeTab === 'code' && selectedFile) {
          codeSearchRef.current?.focus();
        } else {
          treeSearchRef.current?.focus();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, activeTab, selectedFile]);

  // Reset search match index when search changes
  useEffect(() => {
    setSearchMatchIndex(0);
  }, [codeSearch]);

  // Auto-scroll to search match
  useEffect(() => {
    if (!codeSearch || !codeContainerRef.current) return;
    const matches = codeContainerRef.current.querySelectorAll('[data-search-match="true"]');
    if (matches[searchMatchIndex]) {
      matches[searchMatchIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [searchMatchIndex, codeSearch]);

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

  const downloadFile = () => {
    if (!fileContent || !selectedFile) return;
    const blob = new Blob([fileContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedFile.split('/').pop() || 'download';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success('Arquivo baixado');
  };

  const treeData = sortTree(buildFileTree(tree));

  function treeMatches(node: Record<string, any>, search: string, parentPath: string = ''): boolean {
    const lower = search.toLowerCase();
    return Object.values(node).some((item: any) => {
      const fullPath = parentPath ? `${parentPath}/${item.name}` : item.name;
      if (item.type === 'tree') return treeMatches(item.children, search, fullPath);
      return fullPath.toLowerCase().includes(lower);
    });
  }

  const renderTree = (node: Record<string, any>, search: string, parentPath: string = '') => {
    const lower = search.toLowerCase();
    return Object.values(node).map((item: any) => {
      const fullPath = parentPath ? `${parentPath}/${item.name}` : item.name;
      const isFolder = item.type === 'tree';
      const isExpanded = expandedFolders.has(fullPath);
      const matches = search ? fullPath.toLowerCase().includes(lower) : true;
      const childrenMatch = search && isFolder ? treeMatches(item.children, search, fullPath) : false;

      if (isFolder) {
        if (search && !matches && !childrenMatch) return null;
        return (
          <div key={fullPath}>
            <button
              onClick={() => toggleFolder(fullPath)}
              className={cn(
                'flex items-center gap-1.5 w-full px-2 py-1 text-xs hover:bg-hover rounded transition-colors',
                matches ? 'text-red' : 'text-white-dim'
              )}
            >
              {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              <Folder className="w-3.5 h-3.5 text-amber-400" />
              <span className="truncate">{item.name}</span>
            </button>
            {(isExpanded || search) && (
              <div className="pl-4 border-l border-black-border ml-2">
                {renderTree(item.children, '', fullPath)}
              </div>
            )}
          </div>
        );
      }

      if (search && !matches) return null;
      return (
        <button
          key={fullPath}
          onClick={() => loadFile(fullPath, item.sha)}
          className={cn(
            'flex items-center gap-1.5 w-full px-2 py-1 text-xs hover:bg-hover rounded transition-colors truncate',
            selectedFile === fullPath ? 'bg-red/10 text-red' : matches ? 'text-red' : 'text-white-dim'
          )}
        >
          <FileCode className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span className="truncate">{item.name}</span>
        </button>
      );
    }).filter(Boolean);
  };

  const lines = fileContent.split('\n');
  const codeMatchCount = codeSearch ? lines.filter(l => l.toLowerCase().includes(codeSearch.toLowerCase())).length : 0;

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
            <div className="px-2 py-2 border-b border-black-border">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white-dim" />
                <input
                  ref={treeSearchRef}
                  type="text"
                  value={treeSearch}
                  onChange={(e) => setTreeSearch(e.target.value)}
                  placeholder="Buscar arquivo... (Ctrl+F)"
                  className="w-full bg-black-surface-2 border border-black-border rounded-lg pl-7 pr-2 py-1 text-[11px] text-white placeholder-white-dim focus:border-red focus:outline-none"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5 scrollbar-custom">
              {treeLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-red" />
                </div>
              ) : (
                renderTree(treeData, treeSearch)
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
              {activeTab === 'code' && selectedFile && (
                <div className="ml-4 flex-1 max-w-xs flex items-center gap-1.5">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white-dim" />
                    <input
                      ref={codeSearchRef}
                      type="text"
                      value={codeSearch}
                      onChange={(e) => setCodeSearch(e.target.value)}
                      placeholder="Buscar no codigo... (Ctrl+F)"
                      className="w-full bg-black-surface-2 border border-black-border rounded-lg pl-7 pr-2 py-1 text-[11px] text-white placeholder-white-dim focus:border-red focus:outline-none"
                    />
                  </div>
                  {codeSearch && (
                    <>
                      <span className="text-[10px] text-white-dim tabular-nums whitespace-nowrap">
                        {Math.min(searchMatchIndex + 1, codeMatchCount)}/{codeMatchCount}
                      </span>
                      <button
                        onClick={() => setSearchMatchIndex(i => Math.max(0, i - 1))}
                        className="p-1 rounded bg-black-surface-2 border border-black-border hover:border-red-40 text-white-dim"
                        title="Anterior"
                      >
                        <ChevronUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setSearchMatchIndex(i => Math.min(codeMatchCount - 1, i + 1))}
                        className="p-1 rounded bg-black-surface-2 border border-black-border hover:border-red-40 text-white-dim"
                        title="Proximo"
                      >
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </>
                  )}
                </div>
              )}
              {selectedFile && (
                <span className="ml-auto mr-3 text-[10px] text-white-dim font-mono truncate max-w-[200px]">
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
                    <div className="relative" ref={codeContainerRef}>
                      <div className="absolute top-2 right-2 z-10 flex gap-1.5">
                        <button
                          onClick={downloadFile}
                          className="p-1.5 rounded bg-black-surface-2 border border-black-border hover:border-red-40 transition-colors"
                          title="Baixar arquivo"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
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
                          {(() => {
                            let matchCounter = -1;
                            return lines.map((line, i) => {
                              const lineNum = i + 1;
                              const isSelected = selectedLines && lineNum >= selectedLines.start && lineNum <= selectedLines.end;
                              const lang = selectedFile ? getLangFromPath(selectedFile) : '';
                              const searchMatch = codeSearch && line.toLowerCase().includes(codeSearch.toLowerCase());
                              if (codeSearch && !searchMatch) return null;
                              if (searchMatch) matchCounter++;
                              return (
                                <tr
                                  key={lineNum}
                                  data-search-match={searchMatch ? 'true' : undefined}
                                  onClick={(e) => handleLineClick(lineNum, e.shiftKey)}
                                  className={cn(
                                    'cursor-pointer select-none',
                                    isSelected ? 'bg-red/10' : searchMatch ? 'bg-amber-500/10' : 'hover:bg-hover'
                                  )}
                                >
                                  <td className="text-right pr-3 pl-4 py-0.5 text-white-muted select-none w-12 shrink-0 text-[10px] border-r border-black-border">
                                    {lineNum}
                                  </td>
                                  <td className="pl-3 py-0.5 whitespace-pre-wrap break-all">
                                    {codeSearch
                                      ? highlightSearch(line, codeSearch)
                                      : line ? highlightLine(line, lang) : <span className="text-gray-600"> </span>
                                    }
                                  </td>
                                </tr>
                              );
                            });
                          })()}
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
