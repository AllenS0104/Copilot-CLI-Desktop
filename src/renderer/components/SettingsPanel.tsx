import React, { useState } from 'react';
import { useStore } from '../store';
import { ModelSelector } from './ModelSelector';

export const SettingsPanel: React.FC = () => {
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const [newMcpServer, setNewMcpServer] = useState('');
  const [newPath, setNewPath] = useState('');

  const addMcpServer = () => {
    const trimmed = newMcpServer.trim();
    if (trimmed && !settings.mcpServers.includes(trimmed)) {
      updateSettings({ mcpServers: [...settings.mcpServers, trimmed] });
      setNewMcpServer('');
    }
  };

  const removeMcpServer = (server: string) => {
    updateSettings({ mcpServers: settings.mcpServers.filter((s) => s !== server) });
  };

  const addAllowedPath = () => {
    const trimmed = newPath.trim();
    if (trimmed && !settings.allowedPaths.includes(trimmed)) {
      updateSettings({ allowedPaths: [...settings.allowedPaths, trimmed] });
      setNewPath('');
    }
  };

  const removeAllowedPath = (p: string) => {
    updateSettings({ allowedPaths: settings.allowedPaths.filter((x) => x !== p) });
  };

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-lg font-semibold">Settings</h2>

      <section className="space-y-2">
        <h3 className="text-sm font-medium text-gray-400">Model</h3>
        <ModelSelector />
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-medium text-gray-400">Theme</h3>
        <button
          className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-sm"
          onClick={() => updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })}
        >
          {settings.theme === 'dark' ? '🌙 Dark' : '☀️ Light'}
        </button>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-medium text-gray-400">Experimental Mode</h3>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={settings.experimentalMode}
            onChange={(e) => updateSettings({ experimentalMode: e.target.checked })}
            className="rounded"
          />
          Enable experimental features
        </label>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-medium text-gray-400">MCP Servers</h3>
        <div className="space-y-1">
          {settings.mcpServers.map((server) => (
            <div key={server} className="flex items-center justify-between bg-gray-800 px-2 py-1 rounded text-sm">
              <span className="font-mono">{server}</span>
              <button className="text-red-400 hover:text-red-300" onClick={() => removeMcpServer(server)}>✕</button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newMcpServer}
            onChange={(e) => setNewMcpServer(e.target.value)}
            placeholder="Add MCP server..."
            className="flex-1 bg-gray-800 text-sm px-2 py-1 rounded outline-none"
            onKeyDown={(e) => e.key === 'Enter' && addMcpServer()}
          />
          <button className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-sm" onClick={addMcpServer}>Add</button>
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-medium text-gray-400">Allowed Paths</h3>
        <div className="space-y-1">
          {settings.allowedPaths.map((p) => (
            <div key={p} className="flex items-center justify-between bg-gray-800 px-2 py-1 rounded text-sm">
              <span className="font-mono">{p}</span>
              <button className="text-red-400 hover:text-red-300" onClick={() => removeAllowedPath(p)}>✕</button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newPath}
            onChange={(e) => setNewPath(e.target.value)}
            placeholder="Add allowed path..."
            className="flex-1 bg-gray-800 text-sm px-2 py-1 rounded outline-none"
            onKeyDown={(e) => e.key === 'Enter' && addAllowedPath()}
          />
          <button className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-sm" onClick={addAllowedPath}>Add</button>
        </div>
      </section>
    </div>
  );
};
