import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { html as diff2htmlHtml } from 'diff2html';
import { useStore } from '../store';

export const CodePreview: React.FC = () => {
  const openFiles = useStore((s) => s.openFiles);
  const activeFilePath = useStore((s) => s.activeFilePath);
  const closeFile = useStore((s) => s.closeFile);
  const setActiveFile = useStore((s) => s.setActiveFile);
  const setRightSidebarOpen = useStore((s) => s.setRightSidebarOpen);

  const activeFile = openFiles.find((f) => f.path === activeFilePath);

  if (openFiles.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        No files open
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center border-b border-gray-700 overflow-x-auto">
        {openFiles.map((file) => (
          <div
            key={file.path}
            className={`flex items-center gap-1 px-3 py-2 text-sm cursor-pointer border-r border-gray-700 whitespace-nowrap ${
              file.path === activeFilePath ? 'bg-gray-800 text-white' : 'bg-gray-900 text-gray-400'
            }`}
            onClick={() => setActiveFile(file.path)}
          >
            <span>{file.path.split(/[\\/]/).pop()}</span>
            <button
              className="ml-1 text-gray-500 hover:text-gray-300"
              onClick={(e) => {
                e.stopPropagation();
                closeFile(file.path);
              }}
            >
              ×
            </button>
          </div>
        ))}
        <button
          className="ml-auto px-2 py-1 text-gray-500 hover:text-gray-300"
          onClick={() => setRightSidebarOpen(false)}
        >
          ✕
        </button>
      </div>
      <div className="flex-1 overflow-auto">
        {activeFile && (
          <SyntaxHighlighter
            style={vscDarkPlus}
            language={activeFile.language}
            showLineNumbers
            customStyle={{ margin: 0, minHeight: '100%', fontSize: '13px' }}
          >
            {activeFile.content}
          </SyntaxHighlighter>
        )}
      </div>
    </div>
  );
};
