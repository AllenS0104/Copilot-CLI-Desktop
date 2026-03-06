import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useStore } from '../store';

export const CodePreview: React.FC = () => {
  const openFiles = useStore((s) => s.openFiles);
  const activeFilePath = useStore((s) => s.activeFilePath);
  const closeFile = useStore((s) => s.closeFile);
  const setActiveFile = useStore((s) => s.setActiveFile);
  const setRightSidebarOpen = useStore((s) => s.setRightSidebarOpen);

  const activeFile = openFiles.find((f) => f.path === activeFilePath);
  const pathParts = activeFilePath ? activeFilePath.split(/[\\/]/).slice(-3) : [];

  if (openFiles.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 text-sm">
        No files open
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Breadcrumb path */}
      {activeFilePath && (
        <div className="px-3 py-1.5 text-xs text-slate-500 border-b border-slate-700/50 bg-slate-800/30">
          {pathParts.map((part, i) => (
            <span key={i}>
              {i > 0 && <span className="mx-1 text-slate-600">/</span>}
              <span className={i === pathParts.length - 1 ? 'text-slate-300' : ''}>{part}</span>
            </span>
          ))}
        </div>
      )}
      {/* Tab bar */}
      <div className="flex items-center border-b border-slate-700/50 overflow-x-auto bg-slate-800/30">
        {openFiles.map((file) => (
          <div
            key={file.path}
            className={`group flex items-center gap-1.5 px-3 py-2 text-xs cursor-pointer border-r border-slate-700/30 whitespace-nowrap transition-all ${
              file.path === activeFilePath
                ? 'bg-slate-900 text-slate-100 border-b-2 border-b-indigo-500'
                : 'bg-slate-800/50 text-slate-400 hover:text-slate-300'
            }`}
            onClick={() => setActiveFile(file.path)}
          >
            <span className="text-slate-500">
              {file.language === 'tsx' || file.language === 'ts' ? 'TS' : file.language?.toUpperCase().slice(0, 2) || ''}
            </span>
            <span>{file.path.split(/[\\/]/).pop()}</span>
            <button
              className="ml-1 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-slate-300 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                closeFile(file.path);
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
        <button
          className="ml-auto px-2 py-1 text-slate-500 hover:text-slate-300 transition-colors"
          onClick={() => setRightSidebarOpen(false)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-auto">
        {activeFile && (
          <SyntaxHighlighter
            style={vscDarkPlus}
            language={activeFile.language}
            showLineNumbers
            lineNumberStyle={{ color: '#475569', fontSize: '12px', minWidth: '3em' }}
            customStyle={{ margin: 0, minHeight: '100%', fontSize: '13px', background: '#0f172a' }}
          >
            {activeFile.content}
          </SyntaxHighlighter>
        )}
      </div>
    </div>
  );
};
