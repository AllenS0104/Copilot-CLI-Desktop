import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { useStore } from '../store';
import { t } from '../utils/i18n';
import 'xterm/css/xterm.css';

export const VibeCodePanel: React.FC = () => {
  const termRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const ptyIdRef = useRef<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [starting, setStarting] = useState(false);
  const cwd = useStore((s) => s.cwd);
  const locale = useStore((s) => s.locale);

  const startSession = useCallback(async () => {
    if (ptyIdRef.current || starting) return;
    setStarting(true);

    // Create xterm instance
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: "'Cascadia Code', 'Fira Code', 'JetBrains Mono', 'Consolas', monospace",
      theme: {
        background: '#0f172a',
        foreground: '#e2e8f0',
        cursor: '#818cf8',
        cursorAccent: '#0f172a',
        selectionBackground: '#334155',
        selectionForeground: '#f8fafc',
        black: '#1e293b',
        red: '#f87171',
        green: '#4ade80',
        yellow: '#facc15',
        blue: '#60a5fa',
        magenta: '#c084fc',
        cyan: '#22d3ee',
        white: '#f1f5f9',
        brightBlack: '#475569',
        brightRed: '#fca5a5',
        brightGreen: '#86efac',
        brightYellow: '#fde68a',
        brightBlue: '#93c5fd',
        brightMagenta: '#d8b4fe',
        brightCyan: '#67e8f9',
        brightWhite: '#f8fafc',
      },
      allowProposedApi: true,
      scrollback: 5000,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    if (termRef.current) {
      term.open(termRef.current);
      // Small delay to let DOM settle before fitting
      setTimeout(() => {
        try { fitAddon.fit(); } catch {}
      }, 50);
    }

    // Create PTY via IPC
    try {
      const cols = term.cols || 80;
      const rows = term.rows || 24;
      const id = await window.electronAPI.pty.create({ cols, rows, cwd: cwd || undefined });
      ptyIdRef.current = id;
      setConnected(true);

      // PTY output → xterm
      const cleanupData = window.electronAPI.pty.onData(({ id: dataId, data }: { id: string; data: string }) => {
        if (dataId === ptyIdRef.current) {
          term.write(data);
        }
      });

      // PTY exit → show message
      const cleanupExit = window.electronAPI.pty.onExit(({ id: exitId, exitCode }: { id: string; exitCode: number }) => {
        if (exitId === ptyIdRef.current) {
          term.write(`\r\n\x1b[33m[Session ended with code ${exitCode}]\x1b[0m\r\n`);
          ptyIdRef.current = null;
          setConnected(false);
        }
      });

      // xterm input → PTY
      term.onData((data: string) => {
        if (ptyIdRef.current) {
          window.electronAPI.pty.write({ id: ptyIdRef.current, data });
        }
      });

      // Handle resize
      term.onResize(({ cols, rows }: { cols: number; rows: number }) => {
        if (ptyIdRef.current) {
          window.electronAPI.pty.resize({ id: ptyIdRef.current, cols, rows });
        }
      });

      // Cleanup references for unmount
      (term as any)._cleanupData = cleanupData;
      (term as any)._cleanupExit = cleanupExit;
    } catch (err) {
      term.write(`\x1b[31mFailed to start session: ${err}\x1b[0m\r\n`);
    }
    setStarting(false);
  }, [cwd, starting]);

  // Auto-start on mount
  useEffect(() => {
    startSession();

    return () => {
      // Cleanup on unmount
      const term = xtermRef.current;
      if (term) {
        if ((term as any)._cleanupData) (term as any)._cleanupData();
        if ((term as any)._cleanupExit) (term as any)._cleanupExit();
        term.dispose();
        xtermRef.current = null;
      }
      if (ptyIdRef.current) {
        window.electronAPI.pty.kill({ id: ptyIdRef.current });
        ptyIdRef.current = null;
      }
    };
  }, []);

  // Handle container resize
  useEffect(() => {
    const handleResize = () => {
      if (fitAddonRef.current && xtermRef.current) {
        try { fitAddonRef.current.fit(); } catch {}
      }
    };
    window.addEventListener('resize', handleResize);

    // Also observe the container
    const observer = new ResizeObserver(handleResize);
    if (termRef.current) observer.observe(termRef.current);

    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, []);

  const handleRestart = useCallback(async () => {
    // Kill existing
    if (ptyIdRef.current) {
      await window.electronAPI.pty.kill({ id: ptyIdRef.current });
      ptyIdRef.current = null;
    }
    if (xtermRef.current) {
      xtermRef.current.clear();
    }
    setConnected(false);

    // Reuse existing xterm, just create new PTY
    if (xtermRef.current) {
      const term = xtermRef.current;
      try {
        const cols = term.cols || 80;
        const rows = term.rows || 24;
        const id = await window.electronAPI.pty.create({ cols, rows, cwd: cwd || undefined });
        ptyIdRef.current = id;
        setConnected(true);
      } catch (err) {
        term.write(`\x1b[31mFailed to restart: ${err}\x1b[0m\r\n`);
      }
    }
  }, [cwd]);

  return (
    <div className="flex flex-col h-full bg-slate-900">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700/50 bg-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-indigo-400">
              <polyline points="4 17 10 11 4 5" />
              <line x1="12" y1="19" x2="20" y2="19" />
            </svg>
            <span className="text-sm font-medium text-slate-200">{t('vibe.title', locale)}</span>
          </div>
          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs ${
            connected
              ? 'bg-emerald-500/10 text-emerald-400'
              : 'bg-slate-700/50 text-slate-500'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-500' : 'bg-slate-600'}`} />
            {connected ? t('vibe.connected', locale) : t('vibe.disconnected', locale)}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRestart}
            className="flex items-center gap-1.5 px-3 py-1 text-xs text-slate-400 hover:text-slate-200 bg-slate-700/30 hover:bg-slate-700/60 rounded-md transition-colors"
            title={t('vibe.restart', locale)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" />
            </svg>
            {t('vibe.restart', locale)}
          </button>
        </div>
      </div>

      {/* Terminal Container */}
      <div
        ref={termRef}
        className="flex-1 p-1"
        style={{ minHeight: 0 }}
      />

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-1 border-t border-slate-700/50 bg-slate-800/30 text-xs text-slate-500">
        <span>{cwd || '~'}</span>
        <span>{t('vibe.tip', locale)}</span>
      </div>
    </div>
  );
};
