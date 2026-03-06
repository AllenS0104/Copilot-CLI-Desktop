import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { t } from '../utils/i18n';
import { stripAnsi } from '../utils/ansiParser';

export const LoginPage: React.FC = () => {
  const setAuthStatus = useStore((s) => s.setAuthStatus);
  const setCurrentView = useStore((s) => s.setCurrentView);
  const locale = useStore((s) => s.locale);
  const [status, setStatus] = useState<'idle' | 'waiting' | 'success' | 'error'>('idle');
  const [deviceCode, setDeviceCode] = useState('');
  const [verificationUrl, setVerificationUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const [logs, setLogs] = useState('');
  const cleanupDataRef = useRef<(() => void) | null>(null);
  const cleanupExitRef = useRef<(() => void) | null>(null);
  const ptyIdRef = useRef<string | null>(null);
  const urlOpenedRef = useRef(false);
  const loginSentRef = useRef(false);
  const allOutputRef = useRef('');

  useEffect(() => {
    handleLogin();
    return () => {
      cleanupDataRef.current?.();
      cleanupExitRef.current?.();
      if (ptyIdRef.current) {
        window.electronAPI?.pty.kill({ id: ptyIdRef.current }).catch(() => {});
      }
    };
  }, []);

  const handleLoginSuccess = () => {
    setStatus('success');
    setTimeout(() => {
      setAuthStatus('authenticated');
      setCurrentView('main');
    }, 1500);
  };

  const handleLogin = async () => {
    if (!window.electronAPI) return;
    setStatus('waiting');
    setErrorMsg('');
    setDeviceCode('');
    setVerificationUrl('');
    setLogs('');
    loginSentRef.current = false;
    urlOpenedRef.current = false;
    allOutputRef.current = '';

    cleanupDataRef.current?.();
    cleanupExitRef.current?.();

    try {
      const ptyId = await window.electronAPI.pty.create({ cols: 120, rows: 40 });
      ptyIdRef.current = ptyId;

      const cleanupData = window.electronAPI.pty.onData(({ id, data }) => {
        if (id !== ptyId) return;
        const text = stripAnsi(data);
        allOutputRef.current += text;
        setLogs((prev) => prev + text);

        const cumulative = allOutputRef.current.toLowerCase();

        // Detect copilot TUI is ready (prompt appeared) — then send /login
        if (!loginSentRef.current && (text.includes('Type @') || text.includes('shift+tab') || text.includes('Describe a task'))) {
          loginSentRef.current = true;
          // Small delay to let TUI fully render
          setTimeout(() => {
            window.electronAPI.pty.write({ id: ptyId, data: '/login\n' }).catch(() => {});
          }, 500);
        }

        // Detect already authenticated (copilot shows "Unlimited reqs" or similar)
        if (cumulative.includes('unlimited reqs') || cumulative.includes('already logged in') || cumulative.includes('already authenticated')) {
          if (loginSentRef.current) {
            handleLoginSuccess();
            return;
          }
        }

        // Parse device code (XXXX-XXXX)
        const codeMatch = text.match(/([A-Z0-9]{4}-[A-Z0-9]{4})/);
        if (codeMatch) {
          setDeviceCode(codeMatch[1]);
        }

        // Parse verification URL and auto-open browser
        const urlMatch = text.match(/(https?:\/\/github\.com[^\s\x00-\x1f]*)/);
        if (urlMatch && !urlOpenedRef.current) {
          setVerificationUrl(urlMatch[1]);
          urlOpenedRef.current = true;
          window.open(urlMatch[1], '_blank');
        }

        // Detect login success
        const lower = text.toLowerCase();
        if (lower.includes('logged in') || lower.includes('authentication complete') || lower.includes('successfully authenticated')) {
          handleLoginSuccess();
        }
      });
      cleanupDataRef.current = cleanupData;

      const cleanupExit = window.electronAPI.pty.onExit(({ id, exitCode }) => {
        if (id !== ptyId) return;
        setStatus((prev) => {
          if (prev === 'success') return prev;
          // Check accumulated output for auth signals
          const cumulative = allOutputRef.current.toLowerCase();
          if (cumulative.includes('unlimited reqs') || cumulative.includes('logged in')) {
            setAuthStatus('authenticated');
            setCurrentView('main');
            return 'success';
          }
          setErrorMsg(`Process exited with code ${exitCode}`);
          return 'error';
        });
      });
      cleanupExitRef.current = cleanupExit;

      // Fallback: if after 8 seconds we see "Unlimited reqs" but /login wasn't sent, force it
      setTimeout(() => {
        const cumulative = allOutputRef.current.toLowerCase();
        if (cumulative.includes('unlimited reqs') && !loginSentRef.current) {
          loginSentRef.current = true;
          window.electronAPI.pty.write({ id: ptyIdRef.current!, data: '/login\n' }).catch(() => {});
        }
        // If already authenticated and still waiting, just proceed
        if (cumulative.includes('unlimited reqs') && status === 'waiting') {
          handleLoginSuccess();
        }
      }, 8000);

    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err?.message || 'Failed to start login process');
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(deviceCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenUrl = () => {
    if (verificationUrl) window.open(verificationUrl, '_blank');
  };

  const handleBack = () => {
    cleanupDataRef.current?.();
    cleanupExitRef.current?.();
    if (ptyIdRef.current) {
      window.electronAPI?.pty.kill({ id: ptyIdRef.current }).catch(() => {});
    }
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
          <p className="text-slate-400 text-sm">{t('login.subtitle', locale)}</p>
        </div>

        {status === 'waiting' && !deviceCode && (
          <div className="flex items-center justify-center gap-2 text-slate-400 py-4">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm">{t('login.starting', locale)}</span>
          </div>
        )}

        {deviceCode && status === 'waiting' && (
          <div className="space-y-4 animate-fade-in">
            <p className="text-center text-sm text-slate-400">{t('login.enter_code', locale)}</p>
            <div className="flex items-center justify-center">
              <code className="text-4xl font-bold tracking-[0.2em] text-indigo-400 bg-slate-900 px-6 py-3 rounded-xl border border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.15)]">
                {deviceCode}
              </code>
            </div>
            <div className="flex justify-center gap-3">
              <button
                onClick={handleCopyCode}
                className="bg-slate-700 hover:bg-slate-600 text-sm px-4 py-2 rounded-lg transition-all text-slate-300"
              >
                {copied ? `✓ ${t('login.copied', locale)}` : t('login.copy', locale)}
              </button>
              {verificationUrl && (
                <button
                  onClick={handleOpenUrl}
                  className="bg-indigo-600 hover:bg-indigo-500 text-sm px-4 py-2 rounded-lg transition-all text-white"
                >
                  {t('login.open_url', locale)}
                </button>
              )}
            </div>
            <div className="flex items-center justify-center gap-2 text-slate-500 text-xs">
              <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>{t('login.waiting', locale)}</span>
            </div>
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

        {logs && (
          <details className="text-xs text-slate-500">
            <summary className="cursor-pointer hover:text-slate-400 transition-colors">CLI Output</summary>
            <pre className="mt-2 bg-slate-900 rounded-lg p-3 max-h-32 overflow-auto whitespace-pre-wrap font-mono">
              {logs}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
};

