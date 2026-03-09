import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { ModelSelector } from './ModelSelector';
import { t, LOCALES, LOCALE_LABELS } from '../utils/i18n';
import type { Locale } from '../utils/i18n';

export const SettingsPanel: React.FC = () => {
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const cwd = useStore((s) => s.cwd);
  const setCwd = useStore((s) => s.setCwd);
  const locale = useStore((s) => s.locale);
  const setLocale = useStore((s) => s.setLocale);
  const [cliVersion, setCliVersion] = useState('...');
  const [cliUpdating, setCliUpdating] = useState(false);
  const [cliUpdateMsg, setCliUpdateMsg] = useState('');

  useEffect(() => {
    window.electronAPI?.copilot.getVersion().then((info) => {
      setCliVersion(info.version);
    });
  }, []);

  const handleCliUpdate = async () => {
    setCliUpdating(true);
    setCliUpdateMsg('');
    const result = await window.electronAPI?.copilot.update();
    setCliUpdating(false);
    if (result?.success) {
      if (result.message === 'updated') {
        setCliUpdateMsg(t('settings.cli_updated', locale));
        // Refresh version
        const info = await window.electronAPI?.copilot.getVersion();
        if (info) setCliVersion(info.version);
      } else if (result.message === 'latest') {
        setCliUpdateMsg(t('settings.cli_latest', locale));
      } else {
        setCliUpdateMsg(result.message);
      }
    } else {
      setCliUpdateMsg(result?.message || 'Update failed');
    }
  };

  const handleChangeFolder = async () => {
    if (!window.electronAPI) return;
    const folder = await window.electronAPI.app.selectFolder();
    if (folder) setCwd(folder);
  };

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wider">{t('settings.title', locale)}</h2>

      <section className="space-y-2">
        <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider">{t('settings.model', locale)}</h3>
        <ModelSelector />
      </section>

      <div className="border-t border-slate-700/50" />

      <section className="space-y-2">
        <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider">{t('settings.working_dir', locale)}</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-300 truncate flex-1 bg-slate-800 px-3 py-2 rounded-lg font-mono border border-slate-700/50" title={cwd}>
            {cwd || '...'}
          </span>
          <button
            onClick={handleChangeFolder}
            className="bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded-lg text-xs transition-all text-slate-300"
          >
            {t('settings.change', locale)}
          </button>
        </div>
      </section>

      <div className="border-t border-slate-700/50" />

      <section className="space-y-3">
        <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider">{t('settings.preferences', locale)}</h3>
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-300">{t('settings.dark_theme', locale)}</span>
          <button
            className="relative w-10 h-5 rounded-full bg-indigo-600 transition-colors"
            aria-label="Theme toggle"
          >
            <span className="absolute right-0.5 top-0.5 w-4 h-4 rounded-full bg-white transition-transform" />
          </button>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-300">{t('settings.experimental', locale)}</span>
          <button
            onClick={() => updateSettings({ experimentalMode: !settings.experimentalMode })}
            className={`relative w-10 h-5 rounded-full transition-colors ${settings.experimentalMode ? 'bg-indigo-600' : 'bg-slate-600'}`}
            aria-label="Experimental mode toggle"
          >
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${settings.experimentalMode ? 'right-0.5' : 'left-0.5'}`} />
          </button>
        </div>
      </section>

      <div className="border-t border-slate-700/50" />

      <section className="space-y-3">
        <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider">{t('settings.language', locale)}</h3>
        <div className="flex flex-wrap gap-2">
          {LOCALES.map((loc) => (
            <button
              key={loc}
              onClick={() => setLocale(loc)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                locale === loc
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-500/20'
                  : 'bg-slate-800 border-slate-700/50 text-slate-400 hover:text-slate-200 hover:border-slate-600'
              }`}
            >
              {LOCALE_LABELS[loc]}
            </button>
          ))}
        </div>
      </section>

      <div className="border-t border-slate-700/50" />

      <section className="space-y-2">
        <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider">{t('settings.about', locale)}</h3>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-sm text-slate-400 space-y-2">
          <p className="text-slate-200 font-medium">Copilot Desktop</p>
          <p className="text-xs">{t('settings.version', locale)}</p>
          <p className="text-xs">{t('settings.built_with', locale)}</p>

          <div className="border-t border-slate-700/50 my-2" />

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-300">Copilot CLI</p>
              <p className="text-[10px] text-slate-500">v{cliVersion}</p>
            </div>
            <button
              onClick={handleCliUpdate}
              disabled={cliUpdating}
              className="bg-indigo-600/20 hover:bg-indigo-600/40 disabled:opacity-50 text-indigo-400 text-xs px-3 py-1.5 rounded-lg transition-all border border-indigo-600/30"
            >
              {cliUpdating ? t('settings.cli_checking', locale) : t('settings.cli_update_btn', locale)}
            </button>
          </div>
          {cliUpdateMsg && (
            <p className="text-[11px] text-slate-400 animate-fade-in">{cliUpdateMsg}</p>
          )}

          <p className="text-xs text-slate-500">© GitHub, Inc.</p>
        </div>
      </section>
    </div>
  );
};
