import React, { useState } from 'react';
import { useStore } from '../store';
import { t } from '../utils/i18n';

export const InstallPage: React.FC = () => {
  const locale = useStore((s) => s.locale);
  const cliPlatform = useStore((s) => s.cliPlatform);
  const setCliStatus = useStore((s) => s.setCliStatus);
  const setCurrentView = useStore((s) => s.setCurrentView);
  const [status, setStatus] = useState<'prompt' | 'installing' | 'success' | 'restart' | 'error'>('prompt');
  const [progress, setProgress] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const platformLabel =
    cliPlatform === 'win32' ? 'Windows (winget)' :
    cliPlatform === 'darwin' ? 'macOS (Homebrew)' : 'Linux (npm)';

  const installCmd =
    cliPlatform === 'win32' ? 'winget install GitHub.Copilot' :
    cliPlatform === 'darwin' ? 'brew install copilot-cli' : 'npm install -g @github/copilot';

  const handleInstall = async () => {
    if (!window.electronAPI) return;
    setStatus('installing');
    setProgress('');
    setErrorMsg('');

    const cleanup = window.electronAPI.copilot.onInstallProgress(({ data }) => {
      setProgress((prev) => prev + data);
    });

    try {
      const result = await window.electronAPI.copilot.install();
      cleanup();
      if (result.success) {
        if (result.needsRestart) {
          setStatus('restart');
        } else {
          setStatus('success');
          setTimeout(() => {
            setCliStatus('installed');
            setCurrentView('auth_choice');
          }, 1500);
        }
      } else {
        setStatus('error');
        setErrorMsg(result.message);
      }
    } catch (err: any) {
      cleanup();
      setStatus('error');
      setErrorMsg(err?.message || 'Unknown error');
    }
  };

  const handleDecline = () => {
    window.close();
  };

  return (
    <div className="flex items-center justify-center h-screen bg-slate-900 text-slate-100">
      <div className="absolute inset-0 bg-gradient-radial from-indigo-900/10 via-transparent to-transparent pointer-events-none" />
      <div className="w-full max-w-lg bg-slate-800/80 backdrop-blur border border-slate-700/50 rounded-2xl shadow-2xl p-8 space-y-6 relative z-10 animate-fade-in">

        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" className="w-8 h-8">
              <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
          </div>
        </div>

        <div className="text-center space-y-2">
          <h1 className="text-xl font-semibold">{t('install.title', locale)}</h1>
          <p className="text-sm text-slate-400">{t('install.subtitle', locale)}</p>
        </div>

        {status === 'prompt' && (
          <div className="space-y-4">
            {/* Platform info */}
            <div className="bg-slate-900/60 border border-slate-700/50 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-slate-400">{t('install.platform', locale)}:</span>
                <span className="text-slate-200 font-medium">{platformLabel}</span>
              </div>
              <div className="text-xs text-slate-500 font-mono bg-slate-950/50 rounded-lg px-3 py-2">
                $ {installCmd}
              </div>
            </div>

            <p className="text-xs text-slate-500 text-center">{t('install.note', locale)}</p>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleDecline}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium py-3 px-6 rounded-xl transition-all text-sm"
              >
                {t('install.decline', locale)}
              </button>
              <button
                onClick={handleInstall}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-6 rounded-xl transition-all text-sm"
              >
                {t('install.accept', locale)}
              </button>
            </div>
          </div>
        )}

        {status === 'installing' && (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-slate-300">
              <svg className="animate-spin h-5 w-5 text-indigo-400" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm">{t('install.installing', locale)}</span>
            </div>
            {progress && (
              <div className="bg-slate-950/50 rounded-lg p-3 max-h-40 overflow-y-auto">
                <pre className="text-xs text-slate-400 font-mono whitespace-pre-wrap">{progress}</pre>
              </div>
            )}
          </div>
        )}

        {status === 'success' && (
          <div className="text-center space-y-2">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-emerald-400">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="text-sm text-emerald-400">{t('install.success', locale)}</p>
          </div>
        )}

        {status === 'restart' && (
          <div className="space-y-4 animate-fade-in">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-emerald-400">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="text-sm text-emerald-400">{t('install.success', locale)}</p>
            </div>
            <div className="bg-amber-900/30 border border-amber-700/50 rounded-xl p-4 text-sm text-amber-300 text-center">
              <p>{t('install.restart_hint', locale)}</p>
            </div>
            <button
              onClick={() => window.electronAPI?.app.relaunch()}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-6 rounded-xl transition-all text-sm flex items-center justify-center gap-2"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path d="M1 4v6h6M23 20v-6h-6" />
                <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
              </svg>
              {t('install.restart_app', locale)}
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="bg-red-900/30 border border-red-700/50 rounded-xl p-4 text-sm text-red-300">
              <p className="font-medium mb-1">{t('install.error', locale)}</p>
              <pre className="text-xs text-red-400 font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">{errorMsg}</pre>
            </div>
            <p className="text-xs text-slate-500 text-center">
              {t('install.manual_hint', locale)}{' '}
              <a href="https://github.com/features/copilot/cli/" className="text-indigo-400 hover:text-indigo-300 underline" target="_blank" rel="noreferrer">
                github.com/features/copilot/cli
              </a>
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDecline}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium py-3 px-6 rounded-xl transition-all text-sm"
              >
                {t('install.quit', locale)}
              </button>
              <button
                onClick={handleInstall}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-6 rounded-xl transition-all text-sm"
              >
                {t('install.retry', locale)}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
