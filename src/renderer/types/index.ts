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
  pty: {
    create: (args: { cols: number; rows: number; cwd?: string }) => Promise<string>;
    write: (args: { id: string; data: string }) => Promise<void>;
    resize: (args: { id: string; cols: number; rows: number }) => Promise<void>;
    kill: (args: { id: string }) => Promise<void>;
    onData: (callback: (data: { id: string; data: string }) => void) => void;
    onExit: (callback: (data: { id: string; exitCode: number }) => void) => void;
  };
  fs: {
    readdir: (dirPath: string) => Promise<FileNode[]>;
    readfile: (filePath: string) => Promise<string | null>;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
