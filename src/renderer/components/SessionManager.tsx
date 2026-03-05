import React, { useState } from 'react';
import { useStore } from '../store';
import type { Session } from '../types';

export const SessionManager: React.FC = () => {
  const sessions = useStore((s) => s.sessions);
  const currentSession = useStore((s) => s.currentSession);
  const setSessions = useStore((s) => s.setSessions);
  const setCurrentSession = useStore((s) => s.setCurrentSession);
  const ptyId = useStore((s) => s.ptyId);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const createSession = () => {
    const session: Session = {
      id: `session-${Date.now()}`,
      name: `Session ${sessions.length + 1}`,
      createdAt: Date.now(),
      lastActive: Date.now(),
    };
    setSessions([...sessions, session]);
    setCurrentSession(session.id);
  };

  const switchSession = (id: string) => {
    setCurrentSession(id);
    if (ptyId && window.electronAPI) {
      window.electronAPI.pty.write({ id: ptyId, data: `/resume ${id}\n` });
    }
  };

  const startRename = (session: Session) => {
    setRenamingId(session.id);
    setRenameValue(session.name);
  };

  const finishRename = (id: string) => {
    setSessions(
      sessions.map((s) => (s.id === id ? { ...s, name: renameValue.trim() || s.name } : s))
    );
    setRenamingId(null);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Sessions</h2>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-sm px-3 py-1 rounded"
          onClick={createSession}
        >
          + New
        </button>
      </div>
      <div className="space-y-1">
        {sessions.length === 0 && (
          <p className="text-sm text-gray-500">No sessions yet. Create one to get started.</p>
        )}
        {sessions.map((session) => (
          <div
            key={session.id}
            className={`flex items-center justify-between p-2 rounded cursor-pointer text-sm ${
              session.id === currentSession ? 'bg-gray-700' : 'hover:bg-gray-800'
            }`}
            onClick={() => switchSession(session.id)}
          >
            <div className="flex-1 min-w-0">
              {renamingId === session.id ? (
                <input
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={() => finishRename(session.id)}
                  onKeyDown={(e) => e.key === 'Enter' && finishRename(session.id)}
                  className="bg-gray-800 px-1 rounded outline-none w-full"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <>
                  <div className="truncate font-medium">{session.name}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(session.lastActive).toLocaleString()}
                  </div>
                </>
              )}
            </div>
            <button
              className="text-gray-500 hover:text-gray-300 ml-2"
              onClick={(e) => {
                e.stopPropagation();
                startRename(session);
              }}
            >
              ✏️
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
