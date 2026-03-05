import React from 'react';
import { useStore } from '../store';

export const StatusBar: React.FC = () => {
  const connectionStatus = useStore((s) => s.connectionStatus);
  const currentModel = useStore((s) => s.currentModel);
  const currentSession = useStore((s) => s.currentSession);

  const statusColor =
    connectionStatus === 'connected'
      ? 'bg-green-500'
      : connectionStatus === 'connecting'
      ? 'bg-yellow-500'
      : 'bg-red-500';

  return (
    <div className="flex items-center justify-between px-4 py-1 bg-gray-800 border-t border-gray-700 text-xs text-gray-400">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <span className={`w-2 h-2 rounded-full ${statusColor}`} />
          <span className="capitalize">{connectionStatus}</span>
        </div>
        <span>Model: {currentModel}</span>
      </div>
      <div className="flex items-center gap-3">
        <span>Session: {currentSession || 'default'}</span>
        <span>CWD: {process.cwd?.() || '~'}</span>
      </div>
    </div>
  );
};
