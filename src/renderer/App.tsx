import React, { useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatPanel } from './components/ChatPanel';
import { FileTree } from './components/FileTree';
import { CodePreview } from './components/CodePreview';
import { StatusBar } from './components/StatusBar';
import { SettingsPanel } from './components/SettingsPanel';
import { LoginPage } from './components/LoginPage';
import { InstallPage } from './components/InstallPage';
import { AuthChoicePage } from './components/AuthChoicePage';
import { UpdateNotification } from './components/UpdateNotification';
import { VibeCodePanel } from './components/VibeCodePanel';
import { Header } from './components/Header';
import { HistoryPanel } from './components/HistoryPanel';
import { useStore } from './store';
import { t } from './utils/i18n';

const App: React.FC = () => {
  const cliStatus = useStore((s) => s.cliStatus);
  const authStatus = useStore((s) => s.authStatus);
  const currentView = useStore((s) => s.currentView);
  const setAuthStatus = useStore((s) => s.setAuthStatus);
  const setCurrentView = useStore((s) => s.setCurrentView);
  const setCliStatus = useStore((s) => s.setCliStatus);
  const setCliPlatform = useStore((s) => s.setCliPlatform);
  const setCwd = useStore((s) => s.setCwd);
  const setAvailableModels = useStore((s) => s.setAvailableModels);
  const activeSidebarTab = useStore((s) => s.activeSidebarTab);
  const rightSidebarOpen = useStore((s) => s.rightSidebarOpen);
  const sidebarExpanded = useStore((s) => s.sidebarExpanded);
  const locale = useStore((s) => s.locale);

  useEffect(() => {
    const init = async () => {
      if (!window.electronAPI) return;

      // Step 1: Check if Copilot CLI is installed
      try {
        const installResult = await window.electronAPI.copilot.checkInstall();
        setCliPlatform(installResult.platform);
        if (!installResult.installed) {
          setCliStatus('not_installed');
          setCurrentView('cli_install');
          return;
        }
        setCliStatus('installed');
      } catch {
        setCliStatus('not_installed');
        setCurrentView('cli_install');
        return;
      }

      // Step 2: Go to auth choice screen (no auto-check)
      setAuthStatus('unauthenticated');
      setCurrentView('auth_choice');

      // Step 3: Load cwd and models
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

  if (currentView === 'cli_check' || cliStatus === 'checking') {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900 text-slate-100">
        <div className="text-center space-y-4 animate-fade-in">
          <svg className="w-12 h-12 mx-auto text-indigo-500 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          <p className="text-slate-400 text-sm">{t('app.checking_cli', locale)}</p>
        </div>
      </div>
    );
  }

  if (currentView === 'cli_install') {
    return <InstallPage />;
  }

  if (currentView === 'auth_choice') {
    return <AuthChoicePage />;
  }

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
      case 'history':
        return <HistoryPanel />;
      default:
        return null;
    }
  };

  const showLeftPanel = activeSidebarTab !== 'chat' && activeSidebarTab !== 'vibe';

  const renderMainContent = () => {
    if (activeSidebarTab === 'vibe') {
      return <VibeCodePanel />;
    }
    return <ChatPanel />;
  };

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-100">
      <UpdateNotification />
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
          <Header />
          {renderMainContent()}
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
