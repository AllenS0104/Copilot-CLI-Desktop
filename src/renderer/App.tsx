import React, { useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatPanel } from './components/ChatPanel';
import { FileTree } from './components/FileTree';
import { CodePreview } from './components/CodePreview';
import { StatusBar } from './components/StatusBar';
import { SettingsPanel } from './components/SettingsPanel';
import { LoginPage } from './components/LoginPage';
import { useStore } from './store';
import { t } from './utils/i18n';

const App: React.FC = () => {
  const authStatus = useStore((s) => s.authStatus);
  const currentView = useStore((s) => s.currentView);
  const setAuthStatus = useStore((s) => s.setAuthStatus);
  const setCurrentView = useStore((s) => s.setCurrentView);
  const setCwd = useStore((s) => s.setCwd);
  const setAvailableModels = useStore((s) => s.setAvailableModels);
  const activeSidebarTab = useStore((s) => s.activeSidebarTab);
  const rightSidebarOpen = useStore((s) => s.rightSidebarOpen);
  const sidebarExpanded = useStore((s) => s.sidebarExpanded);
  const locale = useStore((s) => s.locale);

  useEffect(() => {
    const init = async () => {
      if (!window.electronAPI) return;
      try {
        const result = await window.electronAPI.copilot.checkAuth();
        if (result.authenticated) {
          setAuthStatus('authenticated');
          setCurrentView('main');
        } else {
          setAuthStatus('unauthenticated');
          setCurrentView('auth');
        }
      } catch {
        setAuthStatus('unauthenticated');
        setCurrentView('auth');
      }
      try {
        const cwd = await window.electronAPI.app.getCwd();
        setCwd(cwd);
      } catch {}
      try {
        const models = await window.electronAPI.copilot.getModels();
        if (models && models.length > 0) setAvailableModels(models);
      } catch {}
    };
    init();
  }, []);

  if (authStatus === 'checking') {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900 text-slate-100">
        <div className="text-center space-y-4 animate-fade-in">
          <svg className="w-12 h-12 mx-auto text-indigo-500 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          <p className="text-slate-400 text-sm">{t('app.checking_auth', locale)}</p>
        </div>
      </div>
    );
  }

  if (currentView === 'auth') {
    return <LoginPage />;
  }

  const renderLeftPanel = () => {
    switch (activeSidebarTab) {
      case 'files':
        return <FileTree />;
      case 'settings':
        return <SettingsPanel />;
      default:
        return null;
    }
  };

  const showLeftPanel = activeSidebarTab !== 'chat';

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-100">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        {showLeftPanel && (
          <div
            className="border-r border-slate-700/50 overflow-y-auto bg-slate-900 transition-all duration-200"
            style={{ width: sidebarExpanded ? 240 : 240 }}
          >
            {renderLeftPanel()}
          </div>
        )}
        <div className="flex-1 flex flex-col overflow-hidden">
          <ChatPanel />
        </div>
        {rightSidebarOpen && (
          <div className="w-96 border-l border-slate-700/50 overflow-hidden bg-slate-900 animate-fade-in">
            <CodePreview />
          </div>
        )}
      </div>
      <StatusBar />
    </div>
  );
};

export default App;
