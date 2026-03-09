import React, { useEffect, useState } from 'react';
import { useStore } from '../store';
import { t } from '../utils/i18n';

type UpdateState = 'idle' | 'available' | 'downloading' | 'downloaded' | 'error';

export const UpdateNotification: React.FC = () => {
  const locale = useStore((s) => s.locale);
  const [state, setState] = useState<UpdateState>('idle');
  const [version, setVersion] = useState('');
  const [progress, setProgress] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!window.electronAPI?.updater) return;

    const cleanups = [
      window.electronAPI.updater.onAvailable((data) => {
        setVersion(data.version);
        setState('available');
      }),
      window.electronAPI.updater.onNotAvailable(() => {
        setState('idle');
      }),
      window.electronAPI.updater.onProgress((data) => {
        setProgress(data.percent);
        setState('downloading');
      }),
      window.electronAPI.updater.onDownloaded(() => {
        setState('downloaded');
      }),
      window.electronAPI.updater.onError(() => {
        setState('error');
      }),
    ];

    return () => cleanups.forEach((c) => c());
  }, []);

  if (state === 'idle' || dismissed) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] animate-slide-up">
      <div className="bg-slate-800 border border-slate-700/50 rounded-xl shadow-2xl p-4 max-w-sm">
        {state === 'available' && (
          <>
            <div className="flex items-start gap-3">
              <span className="text-xl">🚀</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-100">
                  {t('update.available', locale)}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {t('update.version', locale)}: v{version}
                </p>
              </div>
              <button onClick={() => setDismissed(true)} className="text-slate-500 hover:text-slate-300 text-sm">✕</button>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => {
                  setState('downloading');
                  window.electronAPI?.updater.download();
                }}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
              >
                {t('update.download', locale)}
              </button>
              <button
                onClick={() => setDismissed(true)}
                className="text-xs text-slate-400 hover:text-slate-300 px-3 py-1.5"
              >
                {t('update.later', locale)}
              </button>
            </div>
          </>
        )}

        {state === 'downloading' && (
          <div className="flex items-center gap-3">
            <span className="text-xl">⬇️</span>
            <div className="flex-1">
              <p className="text-xs text-slate-300">{t('update.downloading', locale)}</p>
              <div className="w-full bg-slate-700 rounded-full h-1.5 mt-1.5">
                <div
                  className="bg-indigo-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">{progress}%</p>
            </div>
          </div>
        )}

        {state === 'downloaded' && (
          <>
            <div className="flex items-start gap-3">
              <span className="text-xl">✅</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-100">
                  {t('update.ready', locale)}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {t('update.restart_hint', locale)}
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => window.electronAPI?.updater.install()}
                className="flex-1 bg-green-600 hover:bg-green-500 text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
              >
                {t('update.restart_now', locale)}
              </button>
              <button
                onClick={() => setDismissed(true)}
                className="text-xs text-slate-400 hover:text-slate-300 px-3 py-1.5"
              >
                {t('update.later', locale)}
              </button>
            </div>
          </>
        )}

        {state === 'error' && (
          <div className="flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <div className="flex-1">
              <p className="text-xs text-slate-400">{t('update.error', locale)}</p>
            </div>
            <button onClick={() => setDismissed(true)} className="text-slate-500 hover:text-slate-300 text-sm">✕</button>
          </div>
        )}
      </div>
    </div>
  );
};
