import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { t } from '../utils/i18n';

export const LoginPage: React.FC = () => {
  const setAuthStatus = useStore((s) => s.setAuthStatus);
  const setCurrentView = useStore((s) => s.setCurrentView);
  const locale = useStore((s) => s.locale);
  const [status, setStatus] = useState<'launching' | 'polling' | 'success' | 'error'>('launching');
  const [errorMsg, setErrorMsg] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    launchTerminal();
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const launchTerminal = async () => {
    if (!window.electronAPI) return;
    setStatus('launching');
    setErrorMsg('');

    try {
      await window.electronAPI.copilot.login();
      // Terminal opened — now poll checkAuth every 3 seconds
      setStatus('polling');
      pollRef.current = setInterval(async () => {
        try {
          const result = await window.electronAPI.copilot.checkAuth();
          if (result.authenticated) {
            if (pollRef.current) clearInterval(pollRef.current);
            setStatus('success');
            setTimeout(() => {
              setAuthStatus('authenticated');
              setCurrentView('main');
            }, 1500);
          }
        } catch {}
      }, 3000);
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err?.message || 'Failed to open terminal');
    }
  };

  const handleBack = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    setCurrentView('auth_choice');
  };

  return (
    <div className="flex items-center justify-center h-screen bg-slate-900 text-slate-100 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.08),transparent_70%)]" />
      <div className="relative w-full max-w-md glass bg-slate-800/80 border border-slate-700/50 rounded-2xl shadow-2xl p-8 space-y-6 animate-slide-up">
        <button
          onClick={handleBack}
          className="absolute top-4 left-4 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="text-center space-y-3">
          <svg className="w-16 h-16 mx-auto text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5" />
            <path d="M12 8v4l2 2" />
          </svg>
          <h1 className="text-2xl font-semibold tracking-tight">{t('login.title', locale)}</h1>
        </div>

        {status === 'launching' && (
          <div className="flex items-center justify-center gap-2 text-slate-400 py-4">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm">{t('login.starting', locale)}</span>
          </div>
        )}

        {status === 'polling' && (
          <div className="space-y-5 animate-fade-in">
            <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-5 space-y-3">
              <p className="text-sm text-slate-300 font-medium">{t('login.terminal_instructions', locale)}</p>
              <ol className="text-sm text-slate-400 space-y-2 list-decimal list-inside">
                <li>{t('login.step_trust', locale)}</li>
                <li>{t('login.step_login', locale)}</li>
                <li>{t('login.step_account', locale)}</li>
                <li>{t('login.step_code', locale)}</li>
              </ol>
            </div>

            <div className="flex items-center justify-center gap-2 text-indigo-400 text-sm">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>{t('login.waiting_terminal', locale)}</span>
            </div>

            <button
              onClick={launchTerminal}
              className="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium py-2.5 px-4 rounded-xl transition-all text-sm"
            >
              {t('login.reopen_terminal', locale)}
            </button>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center space-y-3 animate-fade-in py-4">
            <svg className="w-12 h-12 mx-auto text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <p className="text-green-400 font-medium">{t('login.success', locale)}</p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-3 animate-fade-in">
            <div className="bg-red-900/30 border border-red-700/50 rounded-xl p-3 text-red-300 text-sm text-center">
              {errorMsg}
            </div>
            <button
              onClick={launchTerminal}
              className="w-full bg-white hover:bg-slate-100 text-slate-900 font-semibold py-3 px-6 rounded-xl text-sm transition-all"
            >
              {t('login.try_again', locale)}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

