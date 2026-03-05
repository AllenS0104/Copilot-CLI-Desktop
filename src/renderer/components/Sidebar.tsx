import React from 'react';
import { useStore } from '../store';

const tabs = [
  { id: 'chat' as const, icon: '💬', label: 'Chat' },
  { id: 'files' as const, icon: '📁', label: 'Files' },
  { id: 'settings' as const, icon: '⚙️', label: 'Settings' },
];

export const Sidebar: React.FC = () => {
  const activeSidebarTab = useStore((s) => s.activeSidebarTab);
  const setActiveSidebarTab = useStore((s) => s.setActiveSidebarTab);

  return (
    <div className="w-12 bg-gray-800 border-r border-gray-700 flex flex-col items-center py-2 gap-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
            activeSidebarTab === tab.id
              ? 'bg-blue-600 text-white'
              : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'
          }`}
          onClick={() => setActiveSidebarTab(tab.id === activeSidebarTab ? 'chat' : tab.id)}
          title={tab.label}
        >
          <span className="text-lg">{tab.icon}</span>
        </button>
      ))}
    </div>
  );
};
