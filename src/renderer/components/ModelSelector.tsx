import React, { useState } from 'react';
import { useStore } from '../store';

export const ModelSelector: React.FC = () => {
  const currentModel = useStore((s) => s.currentModel);
  const setCurrentModel = useStore((s) => s.setCurrentModel);
  const availableModels = useStore((s) => s.availableModels);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-gray-700 hover:bg-gray-600 text-gray-100 text-sm rounded-lg px-3 py-2 transition-colors"
      >
        <span className="truncate">{currentModel}</span>
        <span className="text-gray-400 ml-2">{isOpen ? '▲' : '▼'}</span>
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
          {availableModels.map((m) => (
            <button
              key={m}
              onClick={() => { setCurrentModel(m); setIsOpen(false); }}
              className={`block w-full text-left px-3 py-2 text-sm hover:bg-gray-600 transition-colors ${
                m === currentModel ? 'text-blue-400 bg-gray-600/50' : 'text-gray-300'
              }`}
            >
              {m === currentModel && '✓ '}{m}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
