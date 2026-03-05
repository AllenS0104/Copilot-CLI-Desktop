import React, { useState } from 'react';
import type { ToolCall } from '../types';

export const ToolCallViewer: React.FC<{ toolCalls: ToolCall[] }> = ({ toolCalls }) => {
  return (
    <div className="mt-2 space-y-1">
      {toolCalls.map((tc) => (
        <ToolCallCard key={tc.id} toolCall={tc} />
      ))}
    </div>
  );
};

const ToolCallCard: React.FC<{ toolCall: ToolCall }> = ({ toolCall }) => {
  const [expanded, setExpanded] = useState(false);

  const statusIcon =
    toolCall.status === 'running' ? '⏳' : toolCall.status === 'done' ? '✅' : '❌';

  return (
    <div className="bg-gray-700 rounded p-2 text-sm">
      <div
        className="flex items-center gap-2 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <span>{statusIcon}</span>
        <span className="font-mono text-blue-300">{toolCall.name}</span>
        <span className="text-gray-400 text-xs ml-auto">{expanded ? '▲' : '▼'}</span>
      </div>
      {expanded && (
        <div className="mt-2 space-y-1">
          <div className="text-xs text-gray-400">
            <pre className="whitespace-pre-wrap">{JSON.stringify(toolCall.params, null, 2)}</pre>
          </div>
          {toolCall.result && (
            <div className="text-xs text-gray-300 bg-gray-800 p-2 rounded">
              <pre className="whitespace-pre-wrap">{toolCall.result}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
