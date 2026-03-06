import React from 'react';
import { useStore } from '../store';
import { t } from '../utils/i18n';

export const Header: React.FC = () => {
  const cwd = useStore((s) => s.cwd);
  const activeFilePath = useStore((s) => s.activeFilePath);
  const authStatus = useStore((s) => s.authStatus);
  const currentModel = useStore((s) => s.currentModel);
  const locale = useStore((s) => s.locale);

  const projectName = cwd ? cwd.split(/[\\/]/).pop() : null;
  const activeFileName = activeFilePath ? activeFilePath.split(/[\\/]/).pop() : null;
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const searchHint = isMac ? '⌘K to search' : t('header.search_hint', locale);

  return (
    <div className="h-10 bg-slate-800/30 border-b border-slate-700/30 flex items-center justify-between px-4 flex-shrink-0">
      <div className="flex items-center gap-2 text-sm">
        {cwd ? (
          <>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-slate-400">
              <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
            </svg>
            <span className="text-slate-200">{projectName}</span>
            <span className="text-slate-600">▾</span>
            {activeFileName && (
              <span className="text-slate-400">/ {activeFileName}</span>
            )}
          </>
        ) : (
          <span className="text-slate-500 italic">{t('header.no_project', locale)}</span>
        )}
      </div>

      <span className="text-xs text-slate-600">{searchHint}</span>

      <div className="flex items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${authStatus === 'authenticated' ? 'bg-emerald-500' : 'bg-red-500'}`} />
          <span className="text-slate-400">
            {authStatus === 'authenticated' ? t('header.connected', locale) : t('header.disconnected', locale)}
          </span>
        </div>
        <span className="text-slate-500">{currentModel}</span>
        <span className="text-slate-600 uppercase font-medium">{locale}</span>
      </div>
    </div>
  );
};
