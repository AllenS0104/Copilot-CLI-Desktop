import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import type { FileNode } from '../types';

const FileTreeNode: React.FC<{
  node: FileNode;
  depth: number;
  onSelect: (node: FileNode) => void;
  onDoubleClick: (node: FileNode) => void;
}> = ({ node, depth, onSelect, onDoubleClick }) => {
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
        className="flex items-center gap-1 px-2 py-1 hover:bg-gray-700 cursor-pointer text-sm"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={handleToggle}
        onDoubleClick={() => onDoubleClick(node)}
      >
        <span className="w-4 text-center text-gray-400">
          {node.type === 'directory' ? (expanded ? '▼' : '▶') : '•'}
        </span>
        <span className={node.type === 'directory' ? 'text-yellow-400' : 'text-gray-300'}>
          {node.name}
        </span>
      </div>
      {expanded &&
        children.map((child) => (
          <FileTreeNode
            key={child.path}
            node={child}
            depth={depth + 1}
            onSelect={onSelect}
            onDoubleClick={onDoubleClick}
          />
        ))}
    </div>
  );
};

export const FileTree: React.FC = () => {
  const files = useStore((s) => s.files);
  const setFiles = useStore((s) => s.setFiles);
  const openFile = useStore((s) => s.openFile);
  const addMessage = useStore((s) => s.addMessage);

  useEffect(() => {
    const loadRoot = async () => {
      if (!window.electronAPI) return;
      const cwd = process.env.HOME || process.env.USERPROFILE || '.';
      const entries = await window.electronAPI.fs.readdir(cwd);
      setFiles(entries);
    };
    loadRoot();
  }, [setFiles]);

  const handleSelect = async (node: FileNode) => {
    if (node.type !== 'file' || !window.electronAPI) return;
    const content = await window.electronAPI.fs.readfile(node.path);
    if (content !== null) {
      const ext = node.name.split('.').pop() || 'txt';
      openFile({ path: node.path, content, language: ext });
    }
  };

  const handleDoubleClick = (node: FileNode) => {
    addMessage({
      id: `msg-${Date.now()}`,
      role: 'user',
      content: `@${node.path}`,
      timestamp: Date.now(),
    });
  };

  return (
    <div className="py-2">
      <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
        Files
      </div>
      {files.map((node) => (
        <FileTreeNode
          key={node.path}
          node={node}
          depth={0}
          onSelect={handleSelect}
          onDoubleClick={handleDoubleClick}
        />
      ))}
    </div>
  );
};
