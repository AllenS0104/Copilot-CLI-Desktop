import React, { useState } from 'react';
import { useStore } from '../store';

export const LoginPage: React.FC = () => {
  const setAuthStatus = useStore((s) => s.setAuthStatus);
  const setCurrentView = useStore((s) => s.setCurrentView);
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
    <div className="flex items-center justify-center h-screen bg-gray-900 text-gray-100">
      <div className="w-full max-w-md bg-gray-800 rounded-2xl shadow-2xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="text-6xl">🤖</div>
          <h1 className="text-2xl font-bold">Welcome to Copilot Desktop</h1>
          <p className="text-gray-400">Sign in with your GitHub account to get started</p>
        </div>

        {status === 'idle' && (
          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg text-lg transition-colors"
          >
            Sign In with GitHub
          </button>
        )}

        {status === 'waiting' && (
          <div className="space-y-4">
            {!deviceCode && (
              <div className="flex items-center justify-center gap-2 text-gray-400">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Starting authentication...</span>
              </div>
            )}

            {deviceCode && (
              <div className="space-y-3">
                <p className="text-center text-sm text-gray-400">Enter this code on GitHub:</p>
                <div className="flex items-center justify-center gap-3">
                  <code className="text-3xl font-bold tracking-widest text-blue-400 bg-gray-900 px-4 py-2 rounded-lg">
                    {deviceCode}
                  </code>
                  <button
                    onClick={handleCopyCode}
                    className="bg-gray-700 hover:bg-gray-600 text-sm px-3 py-2 rounded-lg transition-colors"
                  >
                    {copied ? '✓ Copied' : '📋 Copy'}
                  </button>
                </div>

                {verificationUrl && (
                  <div className="text-center">
                    <button
                      onClick={handleOpenUrl}
                      className="text-blue-400 hover:text-blue-300 underline text-sm"
                    >
                      Open {verificationUrl}
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Waiting for authentication...</span>
                </div>
              </div>
            )}
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-3">
            <div className="bg-red-900/50 border border-red-700 rounded-lg p-3 text-red-300 text-sm text-center">
              {errorMsg}
            </div>
            <button
              onClick={handleLogin}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
