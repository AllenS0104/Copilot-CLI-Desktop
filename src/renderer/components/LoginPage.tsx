import React, { useState } from 'react';
import { useStore } from '../store';
import { t } from '../utils/i18n';

export const LoginPage: React.FC = () => {
  const setAuthStatus = useStore((s) => s.setAuthStatus);
  const setCurrentView = useStore((s) => s.setCurrentView);
  const locale = useStore((s) => s.locale);
  const [status, setStatus] = useState<'idle' | 'waiting' | 'error'>('idle');
  const [deviceCode, setDeviceCode] = useState('');
  const [verificationUrl, setVerificationUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);

  const handleLogin = async () => {
    if (!window.electronAPI) return;
    setStatus('waiting');
    setErrorMsg('');
    setDeviceCode('');
    setVerificationUrl('');

    try {
      const ptyId = await window.electronAPI.pty.create({ cols: 120, rows: 40 });

      const cleanupData = window.electronAPI.pty.onData(({ id, data }) => {
        if (id !== ptyId) return;
        // Parse device code pattern like "XXXX-XXXX"
        const codeMatch = data.match(/([A-Z0-9]{4}-[A-Z0-9]{4})/);
        if (codeMatch) {
          setDeviceCode(codeMatch[1]);
        }
        // Parse URL
        const urlMatch = data.match(/(https?:\/\/github\.com\/login\/device[^\s]*)/);
        if (urlMatch) {
          setVerificationUrl(urlMatch[1]);
        }
        // Check for success
        if (data.toLowerCase().includes('logged in') || data.toLowerCase().includes('authentication complete') || data.toLowerCase().includes('successfully')) {
          cleanupData();
          cleanupExit();
          setAuthStatus('authenticated');
          setCurrentView('main');
        }
      });

      const cleanupExit = window.electronAPI.pty.onExit(({ id, exitCode }) => {
        if (id !== ptyId) return;
        cleanupData();
        cleanupExit();
        if (exitCode !== 0) {
          setStatus('error');
          setErrorMsg('Login process exited unexpectedly.');
        }
      });

      await window.electronAPI.pty.write({ id: ptyId, data: '/login\n' });
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err?.message || 'Failed to start login process.');
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(deviceCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenUrl = () => {
    if (verificationUrl) {
      window.open(verificationUrl, '_blank');
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-slate-900 text-slate-100 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.08),transparent_70%)]" />
      <div className="relative w-full max-w-md glass bg-slate-800/80 border border-slate-700/50 rounded-2xl shadow-2xl p-8 space-y-6 animate-slide-up">
        <div className="text-center space-y-3">
          <svg className="w-16 h-16 mx-auto text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polygon points="12,2 22,8.5 22,15.5 12,22 2,15.5 2,8.5" />
            <path d="M12 8v4l2 2" />
          </svg>
          <h1 className="text-2xl font-semibold tracking-tight">{t('login.title', locale)}</h1>
          <p className="text-slate-400 text-sm">{t('login.subtitle', locale)}</p>
        </div>

        {status === 'idle' && (
          <button
            onClick={handleLogin}
            className="w-full bg-white hover:bg-slate-100 text-slate-900 font-semibold py-3 px-6 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            {t('login.sign_in', locale)}
          </button>
        )}

        {status === 'waiting' && (
          <div className="space-y-4">
            {!deviceCode && (
              <div className="flex items-center justify-center gap-2 text-slate-400">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-sm">{t('login.starting', locale)}</span>
              </div>
            )}

            {deviceCode && (
              <div className="space-y-4 animate-fade-in">
                <p className="text-center text-sm text-slate-400">{t('login.enter_code', locale)}</p>
                <div className="flex items-center justify-center gap-3">
                  <code className="text-4xl font-bold tracking-[0.2em] text-indigo-400 bg-slate-900 px-6 py-3 rounded-xl border border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.15)]">
                    {deviceCode}
                  </code>
                </div>
                <div className="flex justify-center">
                  <button
                    onClick={handleCopyCode}
                    className="bg-slate-700 hover:bg-slate-600 text-sm px-4 py-2 rounded-lg transition-all text-slate-300"
                  >
                    {copied ? `✓ ${t('login.copied', locale)}` : t('login.copy', locale)}
                  </button>
                </div>

                {verificationUrl && (
                  <div className="text-center">
                    <button
                      onClick={handleOpenUrl}
                      className="text-indigo-400 hover:text-indigo-300 underline text-sm transition-colors"
                    >
                      {t('login.open_url', locale)}
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-center gap-2 text-slate-500 text-xs">
                  <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>{t('login.waiting', locale)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-3 animate-fade-in">
            <div className="bg-red-900/30 border border-red-700/50 rounded-xl p-3 text-red-300 text-sm text-center">
              {errorMsg || t('login.error_exit', locale)}
            </div>
            <button
              onClick={handleLogin}
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
