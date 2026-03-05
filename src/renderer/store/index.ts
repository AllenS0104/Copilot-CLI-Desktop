import { create } from 'zustand';
import type { Message, FileNode, OpenFile, Settings } from '../types';

interface AppState {
  authStatus: 'checking' | 'authenticated' | 'unauthenticated';
  currentView: 'auth' | 'main';
  messages: Message[];
  isThinking: boolean;
  cwd: string;
  currentModel: string;
  availableModels: string[];
  files: FileNode[];
  openFiles: OpenFile[];
  activeFilePath: string | null;
  rightSidebarOpen: boolean;
  activeSidebarTab: 'chat' | 'files' | 'settings';
  settings: Settings;

  setAuthStatus: (status: 'checking' | 'authenticated' | 'unauthenticated') => void;
  setCurrentView: (view: 'auth' | 'main') => void;
  addMessage: (msg: Message) => void;
  updateLastMessage: (content: string) => void;
  clearMessages: () => void;
  setIsThinking: (thinking: boolean) => void;
  setCwd: (cwd: string) => void;
  setCurrentModel: (model: string) => void;
  setAvailableModels: (models: string[]) => void;
  setFiles: (files: FileNode[]) => void;
  openFile: (file: OpenFile) => void;
  closeFile: (path: string) => void;
  setActiveFile: (path: string | null) => void;
  setRightSidebarOpen: (open: boolean) => void;
  setActiveSidebarTab: (tab: 'chat' | 'files' | 'settings') => void;
  updateSettings: (settings: Partial<Settings>) => void;
}

export const useStore = create<AppState>((set) => ({
  authStatus: 'checking',
  currentView: 'auth',
  messages: [],
  isThinking: false,
  cwd: '',
  currentModel: 'claude-sonnet-4-20250514',
  availableModels: [
    'claude-sonnet-4-20250514',
    'claude-opus-4-20250514',
    'gpt-4o',
    'gpt-4o-mini',
    'o3-mini',
    'gemini-2.0-flash',
  ],
  files: [],
  openFiles: [],
  activeFilePath: null,
  rightSidebarOpen: false,
  activeSidebarTab: 'chat',
  settings: {
    theme: 'dark',
    experimentalMode: false,
    mcpServers: [],
    allowedPaths: [],
  },

  setAuthStatus: (status) => set({ authStatus: status }),
  setCurrentView: (view) => set({ currentView: view }),
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  updateLastMessage: (content) =>
    set((s) => {
      const msgs = [...s.messages];
      if (msgs.length > 0 && msgs[msgs.length - 1].role === 'assistant') {
        msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content };
      }
      return { messages: msgs };
    }),
  clearMessages: () => set({ messages: [] }),
  setIsThinking: (thinking) => set({ isThinking: thinking }),
  setCwd: (cwd) => set({ cwd }),
  setCurrentModel: (model) => set({ currentModel: model }),
  setAvailableModels: (models) => set({ availableModels: models }),
  setFiles: (files) => set({ files }),
  openFile: (file) =>
    set((s) => ({
      openFiles: s.openFiles.some((f) => f.path === file.path)
        ? s.openFiles
        : [...s.openFiles, file],
      activeFilePath: file.path,
      rightSidebarOpen: true,
    })),
  closeFile: (path) =>
    set((s) => ({
      openFiles: s.openFiles.filter((f) => f.path !== path),
      activeFilePath: s.activeFilePath === path ? null : s.activeFilePath,
    })),
  setActiveFile: (path) => set({ activeFilePath: path }),
  setRightSidebarOpen: (open) => set({ rightSidebarOpen: open }),
  setActiveSidebarTab: (tab) => set({ activeSidebarTab: tab }),
  updateSettings: (partial) =>
    set((s) => ({ settings: { ...s.settings, ...partial } })),
}));
