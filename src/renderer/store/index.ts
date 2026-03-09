import { create } from 'zustand';
import type { Message, FileNode, OpenFile, Settings } from '../types';
import type { Locale } from '../utils/i18n';

interface AppState {
  cliStatus: 'checking' | 'installed' | 'not_installed';
  cliPlatform: string;
  authStatus: 'checking' | 'authenticated' | 'unauthenticated';
  currentView: 'cli_check' | 'cli_install' | 'auth_choice' | 'auth' | 'main';
  messages: Message[];
  isThinking: boolean;
  activePromptId: string | null;
  cwd: string;
  currentModel: string;
  availableModels: string[];
  files: FileNode[];
  openFiles: OpenFile[];
  activeFilePath: string | null;
  rightSidebarOpen: boolean;
  activeSidebarTab: 'chat' | 'vibe' | 'files' | 'settings' | 'history';
  settings: Settings;
  sidebarExpanded: boolean;
  chatInput: string;
  locale: Locale;
  projects: { name: string; path: string }[];
  currentProject: string | null;
  chatHistory: { id: string; title: string; timestamp: number }[];

  setAuthStatus: (status: 'checking' | 'authenticated' | 'unauthenticated') => void;
  setCurrentView: (view: 'cli_check' | 'cli_install' | 'auth_choice' | 'auth' | 'main') => void;
  setCliStatus: (status: 'checking' | 'installed' | 'not_installed') => void;
  setCliPlatform: (platform: string) => void;
  addMessage: (msg: Message) => void;
  updateLastMessage: (content: string) => void;
  clearMessages: () => void;
  setIsThinking: (thinking: boolean) => void;
  setActivePromptId: (id: string | null) => void;
  setCwd: (cwd: string) => void;
  setCurrentModel: (model: string) => void;
  setAvailableModels: (models: string[]) => void;
  setFiles: (files: FileNode[]) => void;
  openFile: (file: OpenFile) => void;
  closeFile: (path: string) => void;
  setActiveFile: (path: string | null) => void;
  setRightSidebarOpen: (open: boolean) => void;
  setActiveSidebarTab: (tab: 'chat' | 'vibe' | 'files' | 'settings' | 'history') => void;
  setProjects: (projects: { name: string; path: string }[]) => void;
  setCurrentProject: (path: string | null) => void;
  addChatHistory: (entry: { id: string; title: string; timestamp: number }) => void;
  updateSettings: (settings: Partial<Settings>) => void;
  setSidebarExpanded: (expanded: boolean) => void;
  setChatInput: (text: string) => void;
  appendToChatInput: (text: string) => void;
  setLocale: (locale: Locale) => void;
}

export const useStore = create<AppState>((set) => ({
  cliStatus: 'checking',
  cliPlatform: '',
  authStatus: 'checking',
  currentView: 'cli_check' as const,
  messages: [],
  isThinking: false,
  activePromptId: null,
  cwd: '',
  currentModel: 'claude-sonnet-4.6',
  availableModels: [
    'claude-sonnet-4.6',
    'claude-sonnet-4.5',
    'claude-haiku-4.5',
    'claude-opus-4.6',
    'claude-opus-4.6-fast',
    'claude-opus-4.5',
    'claude-sonnet-4',
    'gemini-3-pro-preview',
    'gpt-5.3-codex',
    'gpt-5.2-codex',
    'gpt-5.2',
    'gpt-5.1-codex-max',
    'gpt-5.1-codex',
    'gpt-5.1',
    'gpt-5.1-codex-mini',
    'gpt-5-mini',
    'gpt-4.1',
  ],
  files: [],
  openFiles: [],
  activeFilePath: null,
  rightSidebarOpen: false,
  activeSidebarTab: 'chat',
  sidebarExpanded: false,
  chatInput: '',
  locale: 'en',
  projects: [],
  currentProject: null,
  chatHistory: [],
  settings: {
    theme: 'dark',
    experimentalMode: false,
    mcpServers: [],
    allowedPaths: [],
  },

  setAuthStatus: (status) => set({ authStatus: status }),
  setCurrentView: (view) => set({ currentView: view }),
  setCliStatus: (status) => set({ cliStatus: status }),
  setCliPlatform: (platform) => set({ cliPlatform: platform }),
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
  setActivePromptId: (id) => set({ activePromptId: id }),
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
  setProjects: (projects) => set({ projects }),
  setCurrentProject: (path) => set((s) => ({ currentProject: path, cwd: path || s.cwd })),
  addChatHistory: (entry) => set((s) => ({ chatHistory: [entry, ...s.chatHistory] })),
  updateSettings: (partial) =>
    set((s) => ({ settings: { ...s.settings, ...partial } })),
  setSidebarExpanded: (expanded) => set({ sidebarExpanded: expanded }),
  setChatInput: (text) => set({ chatInput: text }),
  appendToChatInput: (text) =>
    set((s) => ({ chatInput: s.chatInput + text })),
  setLocale: (locale) => set({ locale }),
}));
