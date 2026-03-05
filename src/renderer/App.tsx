import React, { useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatPanel } from './components/ChatPanel';
import { FileTree } from './components/FileTree';
import { CodePreview } from './components/CodePreview';
import { StatusBar } from './components/StatusBar';
import { SettingsPanel } from './components/SettingsPanel';
import { LoginPage } from './components/LoginPage';
import { useStore } from './store';

const App: React.FC = () => {
  const authStatus = useStore((s) => s.authStatus);
  const currentView = useStore((s) => s.currentView);
  const setAuthStatus = useStore((s) => s.setAuthStatus);
  const setCurrentView = useStore((s) => s.setCurrentView);
  const setCwd = useStore((s) => s.setCwd);
  const setAvailableModels = useStore((s) => s.setAvailableModels);
  const activeSidebarTab = useStore((s) => s.activeSidebarTab);
  const rightSidebarOpen = useStore((s) => s.rightSidebarOpen);

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
      <div className="flex items-center justify-center h-screen bg-gray-900 text-gray-100">
        <div className="text-center space-y-4">
          <div className="text-4xl animate-pulse">🤖</div>
          <p className="text-gray-400">Checking authentication...</p>
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
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        {showLeftPanel && (
          <div className="w-60 border-r border-gray-700 overflow-y-auto">
            {renderLeftPanel()}
          </div>
        )}
        <div className="flex-1 flex flex-col overflow-hidden">
          <ChatPanel />
        </div>
        {rightSidebarOpen && (
          <div className="w-96 border-l border-gray-700 overflow-hidden">
            <CodePreview />
          </div>
        )}
      </div>
      <StatusBar />
    </div>
  );
};

export default App;
