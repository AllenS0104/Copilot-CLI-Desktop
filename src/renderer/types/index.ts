export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  toolCalls?: ToolCall[];
}

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
}

export interface OpenFile {
  path: string;
  content: string;
  language: string;
}

export interface ToolCall {
  id: string;
  name: string;
  params: Record<string, unknown>;
  status: 'running' | 'done' | 'error';
  result?: string;
}

export interface Session {
  id: string;
  name: string;
  createdAt: number;
  lastActive: number;
}

export interface Settings {
  theme: 'dark' | 'light';
  experimentalMode: boolean;
  mcpServers: string[];
  allowedPaths: string[];
}

export interface ElectronAPI {
  copilot: {
    prompt: (args: { prompt: string; cwd: string; model?: string }) => Promise<string>;
    cancel: (args: { id: string }) => Promise<void>;
    checkAuth: () => Promise<{ authenticated: boolean; message: string }>;
    checkInstall: () => Promise<{ installed: boolean; platform: string }>;
    install: () => Promise<{ success: boolean; message: string; needsRestart?: boolean }>;
    onInstallProgress: (callback: (data: { data: string }) => void) => () => void;
    login: () => Promise<{ success: boolean; message: string }>;
    onLoginData: (callback: (data: string) => void) => () => void;
    getModels: () => Promise<string[]>;
    onStdout: (callback: (data: { id: string; data: string }) => void) => () => void;
    onDone: (callback: (data: { id: string; exitCode: number }) => void) => () => void;
    onError: (callback: (data: { id: string; exitCode: number; message: string }) => void) => () => void;
  };
  pty: {
    create: (args: { cols: number; rows: number; cwd?: string }) => Promise<string>;
    write: (args: { id: string; data: string }) => Promise<void>;
    resize: (args: { id: string; cols: number; rows: number }) => Promise<void>;
    kill: (args: { id: string }) => Promise<void>;
    onData: (callback: (data: { id: string; data: string }) => void) => () => void;
    onExit: (callback: (data: { id: string; exitCode: number }) => void) => () => void;
  };
  fs: {
    readdir: (dirPath: string) => Promise<FileNode[]>;
    readfile: (filePath: string) => Promise<string | null>;
    writefile: (filePath: string, content: string) => Promise<{ success: boolean; message?: string }>;
    mkdir: (dirPath: string) => Promise<{ success: boolean; message?: string }>;
    delete: (targetPath: string) => Promise<{ success: boolean; message?: string }>;
    rename: (oldPath: string, newPath: string) => Promise<{ success: boolean; message?: string }>;
  };
  app: {
    getCwd: () => Promise<string>;
    getHomedir: () => Promise<string>;
    selectFolder: () => Promise<string | null>;
    relaunch: () => Promise<void>;
  };
  updater: {
    check: () => Promise<{ available: boolean; version?: string; error?: string }>;
    download: () => Promise<void>;
    install: () => Promise<void>;
    onAvailable: (cb: (data: { version: string; releaseNotes?: string }) => void) => () => void;
    onNotAvailable: (cb: () => void) => () => void;
    onProgress: (cb: (data: { percent: number; transferred: number; total: number }) => void) => () => void;
    onDownloaded: (cb: () => void) => () => void;
    onError: (cb: (data: { message: string }) => void) => () => void;
  };
  menu: {
    onOpenProject: (cb: () => void) => () => void;
    onCloseProject: (cb: () => void) => () => void;
    onToggleSidebar: (cb: () => void) => () => void;
    onAbout: (cb: () => void) => () => void;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
