import React, { useState } from 'react';
import { useStore } from '../store';
import { t } from '../utils/i18n';

export const AuthChoicePage: React.FC = () => {
  const setAuthStatus = useStore((s) => s.setAuthStatus);
  const setCurrentView = useStore((s) => s.setCurrentView);
  const locale = useStore((s) => s.locale);
  const [checking, setChecking] = useState(false);

  const handleAutoAuth = async () => {
    setChecking(true);
    try {
      const result = await window.electronAPI.copilot.checkAuth();
      if (result.authenticated) {
        setAuthStatus('authenticated');
        setCurrentView('main');
      } else {
        // Not authenticated yet, go to manual login
        setAuthStatus('unauthenticated');
        setCurrentView('auth');
      }
    } catch {
      setAuthStatus('unauthenticated');
      setCurrentView('auth');
    }
  };

  const handleManualAuth = () => {
    setAuthStatus('unauthenticated');
    setCurrentView('auth');
  };

  return (
    <div className="flex items-center justify-center h-screen bg-slate-900 text-slate-100 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.08),transparent_70%)]" />
      <div className="relative w-full max-w-lg glass bg-slate-800/80 border border-slate-700/50 rounded-2xl shadow-2xl p-8 space-y-8 animate-slide-up">
        {/* Header */}
        <div className="text-center space-y-3">
          <svg className="w-16 h-16 mx-auto text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5" />
            <path d="M12 8v4l2 2" />
          </svg>
          <h1 className="text-2xl font-semibold tracking-tight">{t('auth_choice.title', locale)}</h1>
          <p className="text-slate-400 text-sm">{t('auth_choice.subtitle', locale)}</p>
        </div>

        {checking ? (
          <div className="flex items-center justify-center gap-2 text-slate-400 py-6">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm">{t('auth_choice.checking', locale)}</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {/* Auto Auth */}
            <button
              onClick={handleAutoAuth}
              className="group relative bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl p-5 text-left transition-all border border-indigo-500/30 hover:border-indigo-400/50 hover:shadow-lg hover:shadow-indigo-500/10"
            >
              <div className="flex items-start gap-4">
                <div className="mt-0.5 w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-base">{t('auth_choice.auto', locale)}</h3>
                  <p className="text-indigo-200/70 text-sm mt-1">{t('auth_choice.auto_desc', locale)}</p>
                </div>
              </div>
            </button>

            {/* Manual Auth */}
            <button
              onClick={handleManualAuth}
              className="group relative bg-slate-700/50 hover:bg-slate-700 text-slate-100 rounded-xl p-5 text-left transition-all border border-slate-600/30 hover:border-slate-500/50 hover:shadow-lg"
            >
              <div className="flex items-start gap-4">
                <div className="mt-0.5 w-10 h-10 rounded-lg bg-slate-600/30 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-base">{t('auth_choice.manual', locale)}</h3>
                  <p className="text-slate-400 text-sm mt-1">{t('auth_choice.manual_desc', locale)}</p>
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Help link */}
        <div className="text-center">
          <a
            href="https://docs.github.com/en/copilot/how-tos/copilot-cli/cli-getting-started"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:text-indigo-300 text-xs underline transition-colors"
          >
            {t('auth_choice.help_link', locale)}
          </a>
        </div>
      </div>
    </div>
  );
};
