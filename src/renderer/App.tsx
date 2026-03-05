import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatPanel } from './components/ChatPanel';
import { FileTree } from './components/FileTree';
import { CodePreview } from './components/CodePreview';
import { StatusBar } from './components/StatusBar';
import { SettingsPanel } from './components/SettingsPanel';
import { SessionManager } from './components/SessionManager';
import { useStore } from './store';

const App: React.FC = () => {
  const activeSidebarTab = useStore((s) => s.activeSidebarTab);
  const rightSidebarOpen = useStore((s) => s.rightSidebarOpen);

  const renderLeftPanel = () => {
    switch (activeSidebarTab) {
      case 'files':
        return <FileTree />;
      case 'settings':
        return <SettingsPanel />;
      case 'sessions':
        return <SessionManager />;
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
