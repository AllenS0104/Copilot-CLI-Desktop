import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  copilot: {
    prompt: (args: { prompt: string; cwd: string; model?: string }) =>
      ipcRenderer.invoke('copilot:prompt', args),
    cancel: (args: { id: string }) =>
      ipcRenderer.invoke('copilot:cancel', args),
    checkAuth: () => ipcRenderer.invoke('copilot:checkAuth'),
    getModels: () => ipcRenderer.invoke('copilot:getModels'),
    onStdout: (callback: (data: { id: string; data: string }) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, payload: any) => callback(payload);
      ipcRenderer.on('copilot:stdout', handler);
      return () => ipcRenderer.removeListener('copilot:stdout', handler);
    },
    onDone: (callback: (data: { id: string; exitCode: number }) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, payload: any) => callback(payload);
      ipcRenderer.on('copilot:done', handler);
      return () => ipcRenderer.removeListener('copilot:done', handler);
    },
    onError: (callback: (data: { id: string; exitCode: number; message: string }) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, payload: any) => callback(payload);
      ipcRenderer.on('copilot:error', handler);
      return () => ipcRenderer.removeListener('copilot:error', handler);
    },
  },
  pty: {
    create: (args: { cols: number; rows: number; cwd?: string }) =>
      ipcRenderer.invoke('pty:create', args),
    write: (args: { id: string; data: string }) =>
      ipcRenderer.invoke('pty:write', args),
    resize: (args: { id: string; cols: number; rows: number }) =>
      ipcRenderer.invoke('pty:resize', args),
    kill: (args: { id: string }) =>
      ipcRenderer.invoke('pty:kill', args),
    onData: (callback: (data: { id: string; data: string }) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, payload: any) => callback(payload);
      ipcRenderer.on('pty:data', handler);
      return () => ipcRenderer.removeListener('pty:data', handler);
    },
    onExit: (callback: (data: { id: string; exitCode: number }) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, payload: any) => callback(payload);
      ipcRenderer.on('pty:exit', handler);
      return () => ipcRenderer.removeListener('pty:exit', handler);
    },
  },
  fs: {
    readdir: (dirPath: string) => ipcRenderer.invoke('fs:readdir', dirPath),
    readfile: (filePath: string) => ipcRenderer.invoke('fs:readfile', filePath),
  },
  app: {
    getCwd: () => ipcRenderer.invoke('app:getCwd'),
    getHomedir: () => ipcRenderer.invoke('app:getHomedir'),
    selectFolder: () => ipcRenderer.invoke('app:selectFolder'),
  },
});
