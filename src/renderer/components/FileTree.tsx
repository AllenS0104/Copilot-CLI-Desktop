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
        className="group flex items-center gap-1 px-2 py-1 hover:bg-gray-700 cursor-pointer text-sm"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={handleToggle}
      >
        <span className="w-4 text-center text-gray-400">
          {node.type === 'directory' ? (expanded ? '▼' : '▶') : '•'}
        </span>
        <span className={`flex-1 truncate ${node.type === 'directory' ? 'text-yellow-400' : 'text-gray-300'}`}>
          {node.name}
        </span>
        {node.type === 'file' && (
          <button
            onClick={(e) => { e.stopPropagation(); onMention(node); }}
            className="hidden group-hover:block text-xs text-blue-400 hover:text-blue-300 px-1"
            title="Insert @mention in chat"
          >
            @
          </button>
        )}
      </div>
      {expanded &&
        children.map((child) => (
          <FileTreeNode key={child.path} node={child} depth={depth + 1} onSelect={onSelect} onMention={onMention} />
        ))}
    </div>
  );
};

export const FileTree: React.FC = () => {
  const files = useStore((s) => s.files);
  const setFiles = useStore((s) => s.setFiles);
  const openFile = useStore((s) => s.openFile);
  const cwd = useStore((s) => s.cwd);
  const setCwd = useStore((s) => s.setCwd);
  const addMessage = useStore((s) => s.addMessage);

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
    addMessage({
      id: `msg-${Date.now()}`,
      role: 'user',
      content: `@${node.path}`,
      timestamp: Date.now(),
    });
  };

  const handleChangeFolder = async () => {
    if (!window.electronAPI) return;
    const folder = await window.electronAPI.app.selectFolder();
    if (folder) setCwd(folder);
  };

  return (
    <div className="py-2">
      <div className="px-3 py-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Files</span>
        <button
          onClick={handleChangeFolder}
          className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-2 py-1 rounded transition-colors"
        >
          📂 Change
        </button>
      </div>
      <div className="px-3 py-1 text-xs text-gray-500 truncate" title={cwd}>
        {cwd || '...'}
      </div>
      {files.map((node) => (
        <FileTreeNode key={node.path} node={node} depth={0} onSelect={handleSelect} onMention={handleMention} />
      ))}
    </div>
  );
};
