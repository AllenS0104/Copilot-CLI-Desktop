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
    checkInstall: () => ipcRenderer.invoke('copilot:checkInstall') as Promise<{ installed: boolean; platform: string }>,
    install: () => ipcRenderer.invoke('copilot:install') as Promise<{ success: boolean; message: string }>,
    onInstallProgress: (callback: (data: { data: string }) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, payload: any) => callback(payload);
      ipcRenderer.on('copilot:install-progress', handler);
      return () => ipcRenderer.removeListener('copilot:install-progress', handler);
    },
    login: () => ipcRenderer.invoke('copilot:loginTerminal') as Promise<{ success: boolean; message: string }>,
    onLoginData: (callback: (data: string) => void) => {
      const handler = (_event: Electron.IpcRendererEvent, payload: any) => callback(payload);
      ipcRenderer.on('copilot:loginData', handler);
      return () => ipcRenderer.removeListener('copilot:loginData', handler);
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
    writefile: (filePath: string, content: string) => ipcRenderer.invoke('fs:writefile', filePath, content),
    mkdir: (dirPath: string) => ipcRenderer.invoke('fs:mkdir', dirPath),
    delete: (targetPath: string) => ipcRenderer.invoke('fs:delete', targetPath),
    rename: (oldPath: string, newPath: string) => ipcRenderer.invoke('fs:rename', oldPath, newPath),
  },
  app: {
    getCwd: () => ipcRenderer.invoke('app:getCwd'),
    getHomedir: () => ipcRenderer.invoke('app:getHomedir'),
    selectFolder: () => ipcRenderer.invoke('app:selectFolder'),
    relaunch: () => ipcRenderer.invoke('app:relaunch'),
  },
  menu: {
    onOpenProject: (cb: () => void) => {
      const handler = () => cb();
      ipcRenderer.on('menu:open-project', handler);
      return () => ipcRenderer.removeListener('menu:open-project', handler);
    },
    onCloseProject: (cb: () => void) => {
      const handler = () => cb();
      ipcRenderer.on('menu:close-project', handler);
      return () => ipcRenderer.removeListener('menu:close-project', handler);
    },
    onToggleSidebar: (cb: () => void) => {
      const handler = () => cb();
      ipcRenderer.on('menu:toggle-sidebar', handler);
      return () => ipcRenderer.removeListener('menu:toggle-sidebar', handler);
    },
    onAbout: (cb: () => void) => {
      const handler = () => cb();
      ipcRenderer.on('menu:about', handler);
      return () => ipcRenderer.removeListener('menu:about', handler);
    },
  },
});
