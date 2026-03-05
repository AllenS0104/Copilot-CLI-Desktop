import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as pty from 'node-pty';

let mainWindow: BrowserWindow | null = null;
const ptyProcesses = new Map<string, pty.IPty>();

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: '#111827',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  ptyProcesses.forEach((p) => p.kill());
  ptyProcesses.clear();
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});

// PTY handlers
ipcMain.handle('pty:create', (_event, args: { cols: number; rows: number; cwd?: string }) => {
  const id = `pty-${Date.now()}`;
  const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';
  const ptyProcess = pty.spawn(shell, ['--command', 'copilot'], {
    name: 'xterm-color',
    cols: args.cols || 80,
    rows: args.rows || 24,
    cwd: args.cwd || process.env.HOME || process.env.USERPROFILE || '.',
    env: process.env as Record<string, string>,
  });

  ptyProcess.onData((data: string) => {
    mainWindow?.webContents.send('pty:data', { id, data });
  });

  ptyProcess.onExit(({ exitCode }) => {
    mainWindow?.webContents.send('pty:exit', { id, exitCode });
    ptyProcesses.delete(id);
  });

  ptyProcesses.set(id, ptyProcess);
  return id;
});

ipcMain.handle('pty:write', (_event, args: { id: string; data: string }) => {
  const p = ptyProcesses.get(args.id);
  if (p) p.write(args.data);
});

ipcMain.handle('pty:resize', (_event, args: { id: string; cols: number; rows: number }) => {
  const p = ptyProcesses.get(args.id);
  if (p) p.resize(args.cols, args.rows);
});

ipcMain.handle('pty:kill', (_event, args: { id: string }) => {
  const p = ptyProcesses.get(args.id);
  if (p) {
    p.kill();
    ptyProcesses.delete(args.id);
  }
});

// FS handlers
ipcMain.handle('fs:readdir', async (_event, dirPath: string) => {
  try {
    const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
    return entries.map((e) => ({
      name: e.name,
      path: path.join(dirPath, e.name),
      type: e.isDirectory() ? 'directory' : 'file',
    }));
  } catch {
    return [];
  }
});

ipcMain.handle('fs:readfile', async (_event, filePath: string) => {
  try {
    return await fs.promises.readFile(filePath, 'utf-8');
  } catch {
    return null;
  }
});
