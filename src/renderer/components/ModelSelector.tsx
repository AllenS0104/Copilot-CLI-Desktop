import React from 'react';
import { useStore } from '../store';

const AVAILABLE_MODELS = [
  'claude-sonnet-4-20250514',
  'claude-opus-4-20250514',
  'gpt-4o',
  'gpt-4o-mini',
  'o3-mini',
  'gemini-2.0-flash',
];

export const ModelSelector: React.FC = () => {
  const currentModel = useStore((s) => s.currentModel);
  const setCurrentModel = useStore((s) => s.setCurrentModel);
  const ptyId = useStore((s) => s.ptyId);

  const handleChange = (model: string) => {
    setCurrentModel(model);
    if (ptyId && window.electronAPI) {
      window.electronAPI.pty.write({ id: ptyId, data: `/model ${model}\n` });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-gray-400">Model:</label>
      <select
        value={currentModel}
        onChange={(e) => handleChange(e.target.value)}
        className="bg-gray-700 text-gray-100 text-sm rounded px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500"
      >
        {AVAILABLE_MODELS.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
    </div>
  );
};
