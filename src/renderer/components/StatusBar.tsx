import React, { useState } from 'react';
import { useStore } from '../store';

export const StatusBar: React.FC = () => {
  const authStatus = useStore((s) => s.authStatus);
  const currentModel = useStore((s) => s.currentModel);
  const setCurrentModel = useStore((s) => s.setCurrentModel);
  const availableModels = useStore((s) => s.availableModels);
  const cwd = useStore((s) => s.cwd);
  const setCwd = useStore((s) => s.setCwd);
  const isThinking = useStore((s) => s.isThinking);
  const [showModelDropdown, setShowModelDropdown] = useState(false);

  const handleChangeFolder = async () => {
    if (!window.electronAPI) return;
    const folder = await window.electronAPI.app.selectFolder();
    if (folder) setCwd(folder);
  };

  return (
    <div className="flex items-center justify-between px-4 py-1 bg-gray-800 border-t border-gray-700 text-xs text-gray-400 relative">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <span className={`w-2 h-2 rounded-full ${authStatus === 'authenticated' ? 'bg-green-500' : 'bg-red-500'}`} />
          <span>{authStatus === 'authenticated' ? 'Connected' : 'Disconnected'}</span>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowModelDropdown(!showModelDropdown)}
            className="hover:text-gray-200 transition-colors"
          >
            Model: {currentModel}
          </button>
          {showModelDropdown && (
            <div className="absolute bottom-6 left-0 bg-gray-700 border border-gray-600 rounded-lg shadow-xl py-1 z-50 min-w-[200px]">
              {availableModels.map((m) => (
                <button
                  key={m}
                  onClick={() => { setCurrentModel(m); setShowModelDropdown(false); }}
                  className={`block w-full text-left px-3 py-1.5 hover:bg-gray-600 ${m === currentModel ? 'text-blue-400' : 'text-gray-300'}`}
                >
                  {m === currentModel ? '✓ ' : '  '}{m}
                </button>
              ))}
            </div>
          )}
        </div>
        {isThinking && (
          <span className="text-yellow-400 animate-pulse">⏳ Thinking...</span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <button onClick={handleChangeFolder} className="hover:text-gray-200 transition-colors truncate max-w-[300px]" title={cwd}>
          📁 {cwd || '...'}
        </button>
      </div>
    </div>
  );
};
