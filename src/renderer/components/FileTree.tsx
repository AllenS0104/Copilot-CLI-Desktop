import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import type { FileNode } from '../types';

const FileTreeNode: React.FC<{
  node: FileNode;
  depth: number;
  onSelect: (node: FileNode) => void;
  onMention: (node: FileNode) => void;
}> = ({ node, depth, onSelect, onMention }) => {
  const [expanded, setExpanded] = useState(false);
  const [children, setChildren] = useState<FileNode[]>([]);

  const handleToggle = async () => {
    if (node.type === 'directory') {
      if (!expanded && children.length === 0 && window.electronAPI) {
        const entries = await window.electronAPI.fs.readdir(node.path);
        setChildren(entries);
      }
      setExpanded(!expanded);
    } else {
      onSelect(node);
    }
  };

  return (
    <div>
      <div
        className="group flex items-center gap-1.5 px-2 py-1 hover:bg-slate-700/30 cursor-pointer text-sm transition-colors"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={handleToggle}
      >
        <span className="w-4 text-center text-slate-500 text-xs">
          {node.type === 'directory' ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={`w-3 h-3 inline transition-transform duration-150 ${expanded ? 'rotate-90' : ''}`}>
              <path d="M9 18l6-6-6-6" />
            </svg>
          ) : (
            <span className="text-slate-500">·</span>
          )}
        </span>
        <span className={`flex-1 truncate ${node.type === 'directory' ? 'text-amber-400/80' : 'text-slate-400'}`}>
          {node.name}
        </span>
        {node.type === 'file' && (
          <button
            onClick={(e) => { e.stopPropagation(); onMention(node); }}
            className="hidden group-hover:flex items-center text-[10px] text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-1.5 py-0.5 rounded-full transition-all"
            title="Add to prompt"
          >
            @ Add
          </button>
        )}
      </div>
      {expanded && (
        <div className="animate-fade-in">
          {children.map((child) => (
            <FileTreeNode key={child.path} node={child} depth={depth + 1} onSelect={onSelect} onMention={onMention} />
          ))}
        </div>
      )}
    </div>
  );
};

export const FileTree: React.FC = () => {
  const files = useStore((s) => s.files);
  const setFiles = useStore((s) => s.setFiles);
  const openFile = useStore((s) => s.openFile);
  const cwd = useStore((s) => s.cwd);
  const setCwd = useStore((s) => s.setCwd);
  const appendToChatInput = useStore((s) => s.appendToChatInput);

  useEffect(() => {
    const loadRoot = async () => {
      if (!window.electronAPI || !cwd) return;
      const entries = await window.electronAPI.fs.readdir(cwd);
      setFiles(entries);
    };
    loadRoot();
  }, [cwd, setFiles]);

  const handleSelect = async (node: FileNode) => {
    if (node.type !== 'file' || !window.electronAPI) return;
    const content = await window.electronAPI.fs.readfile(node.path);
    if (content !== null) {
      const ext = node.name.split('.').pop() || 'txt';
      openFile({ path: node.path, content, language: ext });
    }
  };

  const handleMention = (node: FileNode) => {
    // Get relative path from cwd
    const relativePath = cwd && node.path.startsWith(cwd)
      ? node.path.slice(cwd.length).replace(/^[\\/]/, '')
      : node.name;
    appendToChatInput(`@${relativePath} `);
  };

  const handleChangeFolder = async () => {
    if (!window.electronAPI) return;
    const folder = await window.electronAPI.app.selectFolder();
    if (folder) setCwd(folder);
  };

  const breadcrumbs = cwd ? cwd.split(/[\\/]/).slice(-2) : ['...'];

  return (
    <div className="py-2">
      <div className="px-3 py-2 flex items-center justify-between">
        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Explorer</span>
        <button
          onClick={handleChangeFolder}
          className="text-slate-500 hover:text-slate-300 p-1 rounded hover:bg-slate-700/30 transition-all"
          title="Change folder"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
            <path d="M12 11v6M9 14h6" />
          </svg>
        </button>
      </div>
      <div className="px-3 py-1 text-xs text-slate-600 truncate flex items-center gap-1" title={cwd}>
        {breadcrumbs.map((part, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <span className="text-slate-700">/</span>}
            <span className={i === breadcrumbs.length - 1 ? 'text-slate-400' : ''}>{part}</span>
          </span>
        ))}
      </div>
      {files.map((node) => (
        <FileTreeNode key={node.path} node={node} depth={0} onSelect={handleSelect} onMention={handleMention} />
      ))}
    </div>
  );
};
