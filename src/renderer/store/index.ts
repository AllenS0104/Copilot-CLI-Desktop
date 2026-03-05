import { create } from 'zustand';
import type { Message, FileNode, OpenFile, ToolCall, Session, Settings } from '../types';

interface AppState {
  messages: Message[];
  files: FileNode[];
  openFiles: OpenFile[];
  activeFilePath: string | null;
  currentModel: string;
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
  sessions: Session[];
  currentSession: string;
  toolCalls: ToolCall[];
  settings: Settings;
  ptyId: string | null;
  rightSidebarOpen: boolean;
  activeSidebarTab: 'chat' | 'files' | 'settings' | 'sessions';

  addMessage: (msg: Message) => void;
  clearMessages: () => void;
  setFiles: (files: FileNode[]) => void;
  openFile: (file: OpenFile) => void;
  closeFile: (path: string) => void;
  setActiveFile: (path: string | null) => void;
  setCurrentModel: (model: string) => void;
  setConnectionStatus: (status: 'connected' | 'disconnected' | 'connecting') => void;
  setSessions: (sessions: Session[]) => void;
  setCurrentSession: (id: string) => void;
  addToolCall: (tc: ToolCall) => void;
  updateToolCall: (id: string, update: Partial<ToolCall>) => void;
  updateSettings: (settings: Partial<Settings>) => void;
  setPtyId: (id: string | null) => void;
  setRightSidebarOpen: (open: boolean) => void;
  setActiveSidebarTab: (tab: 'chat' | 'files' | 'settings' | 'sessions') => void;
}

export const useStore = create<AppState>((set) => ({
  messages: [],
  files: [],
  openFiles: [],
  activeFilePath: null,
  currentModel: 'claude-sonnet-4-20250514',
  connectionStatus: 'disconnected',
  sessions: [],
  currentSession: '',
  toolCalls: [],
  settings: {
    theme: 'dark',
    experimentalMode: false,
    mcpServers: [],
    allowedPaths: [],
  },
  ptyId: null,
  rightSidebarOpen: false,
  activeSidebarTab: 'chat',

  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),
  clearMessages: () => set({ messages: [] }),
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
  setCurrentModel: (model) => set({ currentModel: model }),
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setSessions: (sessions) => set({ sessions }),
  setCurrentSession: (id) => set({ currentSession: id }),
  addToolCall: (tc) => set((s) => ({ toolCalls: [...s.toolCalls, tc] })),
  updateToolCall: (id, update) =>
    set((s) => ({
      toolCalls: s.toolCalls.map((tc) => (tc.id === id ? { ...tc, ...update } : tc)),
    })),
  updateSettings: (partial) =>
    set((s) => ({ settings: { ...s.settings, ...partial } })),
  setPtyId: (id) => set({ ptyId: id }),
  setRightSidebarOpen: (open) => set({ rightSidebarOpen: open }),
  setActiveSidebarTab: (tab) => set({ activeSidebarTab: tab }),
}));
