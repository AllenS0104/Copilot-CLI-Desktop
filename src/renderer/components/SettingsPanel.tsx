import React from 'react';
import { useStore } from '../store';
import { ModelSelector } from './ModelSelector';

export const SettingsPanel: React.FC = () => {
  const settings = useStore((s) => s.settings);
  const cwd = useStore((s) => s.cwd);
  const setCwd = useStore((s) => s.setCwd);

  const handleChangeFolder = async () => {
    if (!window.electronAPI) return;
    const folder = await window.electronAPI.app.selectFolder();
    if (folder) setCwd(folder);
  };

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-lg font-semibold">Settings</h2>

      <section className="space-y-2">
        <h3 className="text-sm font-medium text-gray-400">Model</h3>
        <ModelSelector />
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-medium text-gray-400">Working Directory</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-300 truncate flex-1 bg-gray-800 px-2 py-1 rounded" title={cwd}>
            {cwd || '...'}
          </span>
          <button
            onClick={handleChangeFolder}
            className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-sm transition-colors"
          >
            Change
          </button>
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-medium text-gray-400">Theme</h3>
        <div className="bg-gray-800 px-3 py-2 rounded text-sm text-gray-300">
          🌙 Dark (default)
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-medium text-gray-400">About</h3>
        <div className="bg-gray-800 rounded p-3 text-sm text-gray-400 space-y-1">
          <p className="text-gray-200 font-medium">Copilot Desktop</p>
          <p>Version 1.0.0</p>
          <p>Built with Electron + React</p>
          <p className="text-xs">© GitHub, Inc.</p>
        </div>
      </section>
    </div>
  );
};
