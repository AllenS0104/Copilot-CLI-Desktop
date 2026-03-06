import React from 'react';
import { useStore } from '../store';
import { t } from '../utils/i18n';
import type { Locale } from '../utils/i18n';

const ChatIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
  </svg>
);

const FilesIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
    <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
  </svg>
);

const HistoryIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const SettingsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
  </svg>
);

const ExpandIcon = ({ expanded }: { expanded: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
  >
    <path d="M9 18l6-6-6-6" />
  </svg>
);

const topTabs = [
  { id: 'chat' as const, icon: ChatIcon, labelKey: 'sidebar.chat' },
  { id: 'files' as const, icon: FilesIcon, labelKey: 'sidebar.files' },
  { id: 'history' as const, icon: HistoryIcon, labelKey: 'sidebar.history' },
];

export const Sidebar: React.FC = () => {
  const activeSidebarTab = useStore((s) => s.activeSidebarTab);
  const setActiveSidebarTab = useStore((s) => s.setActiveSidebarTab);
  const sidebarExpanded = useStore((s) => s.sidebarExpanded);
  const setSidebarExpanded = useStore((s) => s.setSidebarExpanded);
  const authStatus = useStore((s) => s.authStatus);
  const locale = useStore((s) => s.locale);
  const projects = useStore((s) => s.projects);
  const currentProject = useStore((s) => s.currentProject);
  const setProjects = useStore((s) => s.setProjects);
  const setCurrentProject = useStore((s) => s.setCurrentProject);

  const localeIndicator: Record<Locale, string> = { 'en': 'EN', 'zh-CN': '中', 'ja': '日', 'ko': '한' };

  const handleAddProject = async () => {
    const folderPath = await window.electronAPI?.app.selectFolder();
    if (folderPath) {
      const name = folderPath.split(/[\\/]/).pop() || folderPath;
      const already = projects.some((p) => p.path === folderPath);
      if (!already) {
        setProjects([...projects, { name, path: folderPath }]);
      }
      setCurrentProject(folderPath);
    }
  };

  const renderTabButton = (tab: typeof topTabs[number]) => {
    const Icon = tab.icon;
    const isActive = activeSidebarTab === tab.id;
    const label = t(tab.labelKey, locale);
    return (
      <button
        key={tab.id}
        className={`relative flex items-center gap-3 rounded-lg transition-all duration-150 ${
          sidebarExpanded ? 'px-3 py-2' : 'w-10 h-10 justify-center mx-auto'
        } ${
          isActive
            ? 'text-slate-100 bg-slate-700/50'
            : 'text-slate-400 hover:bg-slate-700/30 hover:text-slate-200'
        }`}
        onClick={() => setActiveSidebarTab(tab.id === activeSidebarTab ? 'chat' : tab.id)}
        title={!sidebarExpanded ? label : undefined}
      >
        {isActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-indigo-500 rounded-r" />
        )}
        <Icon />
        {sidebarExpanded && <span className="text-sm font-medium">{label}</span>}
      </button>
    );
  };

  return (
    <div
      className="bg-slate-800/50 border-r border-slate-700/50 flex flex-col py-3 transition-all duration-200"
      style={{ width: sidebarExpanded ? 240 : 48 }}
    >
      {/* Top - Global capabilities */}
      <div className="flex flex-col gap-1 px-1">
        {topTabs.map(renderTabButton)}
      </div>

      {/* Middle - Projects */}
      {sidebarExpanded && (
        <div className="flex flex-col px-3 mt-4 flex-1 overflow-y-auto">
          <span className="text-xs uppercase tracking-wider text-slate-600 font-medium mb-2">
            {t('sidebar.projects', locale)}
          </span>
          {projects.length === 0 ? (
            <div className="space-y-2">
              <p className="text-xs text-slate-600 italic">{t('sidebar.no_projects', locale)}</p>
              <button
                onClick={handleAddProject}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                + {t('sidebar.add_project', locale)}
              </button>
            </div>
          ) : (
            <div className="space-y-0.5">
              {projects.map((p) => (
                <button
                  key={p.path}
                  onClick={() => setCurrentProject(p.path)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${
                    currentProject === p.path
                      ? 'text-slate-100 bg-slate-700/40'
                      : 'text-slate-400 hover:bg-slate-700/30 hover:text-slate-200'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    currentProject === p.path ? 'bg-indigo-500' : 'bg-slate-600'
                  }`} />
                  <span className="truncate">{p.name}</span>
                </button>
              ))}
              <button
                onClick={handleAddProject}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                + {t('sidebar.add_project', locale)}
              </button>
            </div>
          )}
        </div>
      )}

      {!sidebarExpanded && <div className="flex-1" />}

      {/* Bottom - System */}
      <div className="mt-auto px-1 space-y-2">
        {/* Settings button */}
        {renderTabButton({ id: 'settings' as any, icon: SettingsIcon, labelKey: 'sidebar.settings' } as any)}

        <div className={`flex items-center gap-2 ${sidebarExpanded ? 'px-3 py-2' : 'justify-center py-2'}`}>
          <div className="w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center text-xs text-slate-300 font-medium">
            U
          </div>
          {sidebarExpanded && (
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${authStatus === 'authenticated' ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <span className="text-xs text-slate-400">{authStatus === 'authenticated' ? t('sidebar.connected', locale) : t('sidebar.offline', locale)}</span>
            </div>
          )}
        </div>
        <button
          onClick={() => setSidebarExpanded(!sidebarExpanded)}
          className={`flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-slate-700/30 rounded-lg transition-all duration-150 ${
            sidebarExpanded ? 'w-full px-3 py-2' : 'w-10 h-10 mx-auto'
          }`}
          title={sidebarExpanded ? t('sidebar.collapse', locale) : t('sidebar.expand', locale)}
        >
          <ExpandIcon expanded={sidebarExpanded} />
          {sidebarExpanded && <span className="text-xs ml-2">{t('sidebar.collapse', locale)}</span>}
        </button>
        {!sidebarExpanded && (
          <div className="flex items-center justify-center py-1">
            <span className="text-[10px] font-bold text-slate-500">{localeIndicator[locale]}</span>
          </div>
        )}
        {sidebarExpanded && (
          <div className="flex items-center px-3 py-1">
            <span className="text-[10px] font-bold text-slate-500">{localeIndicator[locale]}</span>
          </div>
        )}
      </div>
    </div>
  );
};
