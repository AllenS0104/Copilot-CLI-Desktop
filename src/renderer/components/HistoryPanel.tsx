import React from 'react';
import { useStore } from '../store';
import { t } from '../utils/i18n';

export const HistoryPanel: React.FC = () => {
  const chatHistory = useStore((s) => s.chatHistory);
  const locale = useStore((s) => s.locale);

  const relativeTime = (ts: number) => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="p-4 space-y-3">
      <h3 className="text-xs uppercase tracking-wider text-slate-500 font-medium">
        {t('history.title', locale)}
      </h3>
      {chatHistory.length === 0 ? (
        <p className="text-sm text-slate-600 italic">{t('history.empty', locale)}</p>
      ) : (
        <div className="space-y-1">
          {chatHistory.map((entry) => (
            <div
              key={entry.id}
              className="px-3 py-2 rounded-lg hover:bg-slate-700/30 cursor-pointer transition-colors"
            >
              <p className="text-sm text-slate-300 truncate">{entry.title}</p>
              <p className="text-xs text-slate-600">{relativeTime(entry.timestamp)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
