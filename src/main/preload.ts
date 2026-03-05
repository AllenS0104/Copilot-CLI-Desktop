import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
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
  },
});
