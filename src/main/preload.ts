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
      ipcRenderer.on('pty:data', (_event, payload) => callback(payload));
    },
    onExit: (callback: (data: { id: string; exitCode: number }) => void) => {
      ipcRenderer.on('pty:exit', (_event, payload) => callback(payload));
    },
  },
  fs: {
    readdir: (dirPath: string) => ipcRenderer.invoke('fs:readdir', dirPath),
    readfile: (filePath: string) => ipcRenderer.invoke('fs:readfile', filePath),
  },
});
