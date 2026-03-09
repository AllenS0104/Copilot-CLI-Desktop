import { app, BrowserWindow, ipcMain, dialog, Menu } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as pty from 'node-pty';
import { spawn, ChildProcess } from 'child_process';
import { autoUpdater } from 'electron-updater';

let mainWindow: BrowserWindow | null = null;
const ptyProcesses = new Map<string, pty.IPty>();
const promptProcesses = new Map<string, ChildProcess>();

const copilotCmd = process.platform === 'win32' ? 'copilot.cmd' : 'copilot';
const defaultHome = process.env.HOME || process.env.USERPROFILE || '.';

function createWindow(): void {
  const menuTemplate: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        { label: 'Open Project', accelerator: 'CmdOrCtrl+O', click: () => { mainWindow?.webContents.send('menu:open-project'); } },
        { label: 'Close Project', click: () => { mainWindow?.webContents.send('menu:close-project'); } },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { label: 'Toggle Sidebar', accelerator: 'CmdOrCtrl+B', click: () => { mainWindow?.webContents.send('menu:toggle-sidebar'); } },
        { type: 'separator' },
        { role: 'toggleDevTools' },
        { role: 'reload' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        { label: 'About Copilot Desktop', click: () => { mainWindow?.webContents.send('menu:about'); } },
      ],
    },
  ];
  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

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

app.whenReady().then(() => {
  createWindow();
  // Auto-update: check for updates after window is ready
  if (process.env.NODE_ENV !== 'development') {
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;

    autoUpdater.on('update-available', (info) => {
      mainWindow?.webContents.send('updater:available', {
        version: info.version,
        releaseNotes: info.releaseNotes,
      });
    });

    autoUpdater.on('update-not-available', () => {
      mainWindow?.webContents.send('updater:not-available');
    });

    autoUpdater.on('download-progress', (progress) => {
      mainWindow?.webContents.send('updater:progress', {
        percent: Math.round(progress.percent),
        transferred: progress.transferred,
        total: progress.total,
      });
    });

    autoUpdater.on('update-downloaded', () => {
      mainWindow?.webContents.send('updater:downloaded');
    });

    autoUpdater.on('error', (err) => {
      mainWindow?.webContents.send('updater:error', { message: err.message });
    });

    // Check after 3 seconds to not block startup
    setTimeout(() => autoUpdater.checkForUpdates(), 3000);
  }
});

app.on('window-all-closed', () => {
  ptyProcesses.forEach((p) => p.kill());
  ptyProcesses.clear();
  promptProcesses.forEach((p) => p.kill());
  promptProcesses.clear();
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});

// ── Auto-Update IPC ──

ipcMain.handle('updater:check', async () => {
  try {
    const result = await autoUpdater.checkForUpdates();
    return { available: !!result?.updateInfo, version: result?.updateInfo?.version };
  } catch (err: any) {
    return { available: false, error: err.message };
  }
});

ipcMain.handle('updater:download', () => {
  autoUpdater.downloadUpdate();
});

ipcMain.handle('updater:install', () => {
  autoUpdater.quitAndInstall(false, true);
});

// ── Copilot CLI Version Check & Update ──

ipcMain.handle('copilot:getVersion', async () => {
  return new Promise<{ version: string; raw: string }>((resolve) => {
    let output = '';
    const child = spawn(copilotCmd, ['--version'], {
      shell: process.platform === 'win32',
      env: process.env as Record<string, string>,
    });
    child.stdout?.on('data', (chunk: Buffer) => { output += chunk.toString(); });
    child.stderr?.on('data', (chunk: Buffer) => { output += chunk.toString(); });
    child.on('close', () => {
      const match = output.match(/(\d+\.\d+\.\d+)/);
      resolve({ version: match ? match[1] : 'unknown', raw: output.trim() });
    });
    child.on('error', () => {
      resolve({ version: 'unknown', raw: 'Error checking version' });
    });
  });
});

ipcMain.handle('copilot:update', async () => {
  return new Promise<{ success: boolean; message: string }>((resolve) => {
    let output = '';
    const child = spawn(copilotCmd, ['update'], {
      shell: process.platform === 'win32',
      env: process.env as Record<string, string>,
    });
    child.stdout?.on('data', (chunk: Buffer) => {
      output += chunk.toString();
      mainWindow?.webContents.send('copilot:update-progress', { data: chunk.toString() });
    });
    child.stderr?.on('data', (chunk: Buffer) => {
      output += chunk.toString();
      mainWindow?.webContents.send('copilot:update-progress', { data: chunk.toString() });
    });
    child.on('close', (code) => {
      const hasUpdate = output.toLowerCase().includes('downloaded') || output.toLowerCase().includes('updated');
      const alreadyLatest = output.toLowerCase().includes('already') || output.toLowerCase().includes('up to date');
      if (code === 0) {
        resolve({
          success: true,
          message: hasUpdate ? 'updated' : (alreadyLatest ? 'latest' : output.trim()),
        });
      } else {
        resolve({ success: false, message: output.trim() || `Exit code ${code}` });
      }
    });
    child.on('error', (err) => {
      resolve({ success: false, message: err.message });
    });
  });
});

// ── Mode 1: Prompt API (chat) ──

ipcMain.handle(
  'copilot:prompt',
  (_event, args: { prompt: string; cwd: string; model?: string }) => {
    const id = `prompt-${Date.now()}`;

    let child: ChildProcess;
    if (process.platform === 'win32') {
      // Windows: spawn cmd.exe directly with quoted prompt to avoid arg splitting
      const escaped = args.prompt.replace(/"/g, '\\"');
      let cmd = `copilot -s -p "${escaped}"`;
      if (args.model) cmd += ` --model ${args.model}`;
      child = spawn('cmd.exe', ['/c', cmd], {
        cwd: args.cwd,
        env: process.env as Record<string, string>,
      });
    } else {
      const spawnArgs = ['-s', '-p', args.prompt];
      if (args.model) spawnArgs.push('--model', args.model);
      child = spawn(copilotCmd, spawnArgs, {
        cwd: args.cwd,
        env: process.env as Record<string, string>,
      });
    }

    promptProcesses.set(id, child);

    let buffer = '';
    child.stdout?.on('data', (chunk: Buffer) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        mainWindow?.webContents.send('copilot:stdout', { id, data: line + '\n' });
      }
    });

    child.stderr?.on('data', (chunk: Buffer) => {
      mainWindow?.webContents.send('copilot:stdout', { id, data: chunk.toString() });
    });

    child.on('close', (code) => {
      if (buffer) {
        mainWindow?.webContents.send('copilot:stdout', { id, data: buffer });
      }
      promptProcesses.delete(id);
      if (code === 0) {
        mainWindow?.webContents.send('copilot:done', { id, exitCode: code });
      } else {
        mainWindow?.webContents.send('copilot:error', {
          id,
          exitCode: code,
          message: `Process exited with code ${code}`,
        });
      }
    });

    child.on('error', (err) => {
      promptProcesses.delete(id);
      mainWindow?.webContents.send('copilot:error', {
        id,
        exitCode: -1,
        message: err.message,
      });
    });

    return id;
  },
);

ipcMain.handle('copilot:cancel', (_event, args: { id: string }) => {
  const child = promptProcesses.get(args.id);
  if (child) {
    child.kill();
    promptProcesses.delete(args.id);
  }
});

// ── CLI Installation Check ──

ipcMain.handle('copilot:checkInstall', async () => {
  return new Promise<{ installed: boolean; platform: string }>((resolve) => {
    const platform = process.platform; // 'win32' | 'darwin' | 'linux'
    const checkCmd = platform === 'win32' ? 'where' : 'which';
    const child = spawn(checkCmd, ['copilot'], {
      shell: platform === 'win32',
      env: process.env as Record<string, string>,
    });
    child.on('close', (code) => {
      resolve({ installed: code === 0, platform });
    });
    child.on('error', () => {
      resolve({ installed: false, platform });
    });
  });
});

ipcMain.handle('copilot:install', async () => {
  const platform = process.platform;
  return new Promise<{ success: boolean; message: string; needsRestart: boolean }>((resolve) => {
    let cmd: string;
    let args: string[];

    if (platform === 'win32') {
      cmd = 'winget';
      args = ['install', '--id', 'GitHub.Copilot', '--accept-source-agreements', '--accept-package-agreements'];
    } else if (platform === 'darwin') {
      cmd = 'brew';
      args = ['install', 'copilot-cli'];
    } else {
      // Linux: try npm global install
      cmd = 'npm';
      args = ['install', '-g', '@github/copilot'];
    }

    let output = '';
    const child = spawn(cmd, args, {
      shell: platform === 'win32',
      env: process.env as Record<string, string>,
    });

    child.stdout?.on('data', (chunk: Buffer) => {
      output += chunk.toString();
      mainWindow?.webContents.send('copilot:install-progress', { data: chunk.toString() });
    });
    child.stderr?.on('data', (chunk: Buffer) => {
      output += chunk.toString();
      mainWindow?.webContents.send('copilot:install-progress', { data: chunk.toString() });
    });

    child.on('close', (code) => {
      if (code === 0) {
        // After fresh install, PATH may not be updated in current process
        // Signal that app restart is needed
        resolve({ success: true, message: 'Installation complete', needsRestart: true });
      } else {
        resolve({ success: false, message: output.trim() || `Exit code ${code}`, needsRestart: false });
      }
    });

    child.on('error', (err) => {
      resolve({ success: false, message: err.message, needsRestart: false });
    });
  });
});

// ── Auth Check ──

ipcMain.handle('copilot:checkAuth', async () => {
  return new Promise<{ authenticated: boolean; message: string }>((resolve) => {
    let output = '';
    let child: ChildProcess;
    if (process.platform === 'win32') {
      child = spawn('cmd.exe', ['/c', 'copilot -s -p "hello"'], {
        env: process.env as Record<string, string>,
      });
    } else {
      child = spawn(copilotCmd, ['-s', '-p', 'hello'], {
        env: process.env as Record<string, string>,
      });
    }

    child.stdout?.on('data', (chunk: Buffer) => {
      output += chunk.toString();
    });
    child.stderr?.on('data', (chunk: Buffer) => {
      output += chunk.toString();
    });

    child.on('close', (code) => {
      const lower = output.toLowerCase();
      if (code === 0 && !lower.includes('login') && !lower.includes('error')) {
        resolve({ authenticated: true, message: 'Authenticated' });
      } else {
        resolve({
          authenticated: false,
          message: output.trim() || `Exit code ${code}`,
        });
      }
    });

    child.on('error', (err) => {
      resolve({ authenticated: false, message: err.message });
    });
  });
});

// ── Auth Login (open visible terminal for interactive login) ──

ipcMain.handle('copilot:loginTerminal', async () => {
  return new Promise<{ success: boolean; message: string }>((resolve) => {
    // Open a visible cmd/terminal window that runs copilot interactively
    // User handles trust prompt, /login, account selection in the real terminal
    let child: ChildProcess;
    if (process.platform === 'win32') {
      // start cmd /k keeps window open; copilot runs interactively
      child = spawn('cmd.exe', ['/c', 'start', 'cmd.exe', '/k', 'copilot'], {
        env: process.env as Record<string, string>,
        detached: true,
        stdio: 'ignore',
      });
    } else {
      // On macOS/Linux open a terminal emulator
      const terminal = process.platform === 'darwin' ? 'open' : 'x-terminal-emulator';
      const termArgs = process.platform === 'darwin'
        ? ['-a', 'Terminal', '--args', '-e', 'copilot']
        : ['-e', 'copilot'];
      child = spawn(terminal, termArgs, {
        env: process.env as Record<string, string>,
        detached: true,
        stdio: 'ignore',
      });
    }
    child.unref();

    // The terminal is now open. We poll for auth completion.
    // Resolve immediately — the renderer will poll checkAuth.
    resolve({ success: true, message: 'Terminal opened' });
  });
});

// ── Models ──

ipcMain.handle('copilot:getModels', () => {
  return [
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
  ];
});

// ── Mode 2: Interactive PTY (login / trust prompts) ──

ipcMain.handle('pty:create', (_event, args: { cols: number; rows: number; cwd?: string }) => {
  const id = `pty-${Date.now()}`;
  // On Windows, spawn cmd.exe and run copilot through it (node-pty can't resolve .cmd files directly)
  const shell = process.platform === 'win32' ? 'cmd.exe' : '/bin/bash';
  const shellArgs = process.platform === 'win32' ? ['/c', 'copilot'] : ['-c', 'copilot'];
  const ptyProcess = pty.spawn(shell, shellArgs, {
    name: 'xterm-color',
    cols: args.cols || 80,
    rows: args.rows || 24,
    cwd: args.cwd || defaultHome,
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

// ── FS handlers ──

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

ipcMain.handle('fs:writefile', async (_event, filePath: string, content: string) => {
  try {
    await fs.promises.writeFile(filePath, content, 'utf-8');
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
});

ipcMain.handle('fs:mkdir', async (_event, dirPath: string) => {
  try {
    await fs.promises.mkdir(dirPath, { recursive: true });
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
});

ipcMain.handle('fs:delete', async (_event, targetPath: string) => {
  try {
    const stat = await fs.promises.stat(targetPath);
    if (stat.isDirectory()) {
      await fs.promises.rm(targetPath, { recursive: true, force: true });
    } else {
      await fs.promises.unlink(targetPath);
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
});

ipcMain.handle('fs:rename', async (_event, oldPath: string, newPath: string) => {
  try {
    await fs.promises.rename(oldPath, newPath);
    return { success: true };
  } catch (err: any) {
    return { success: false, message: err.message };
  }
});

// ── App handlers ──

ipcMain.handle('app:getCwd', () => {
  return process.cwd();
});

ipcMain.handle('app:getHomedir', () => {
  return defaultHome;
});

ipcMain.handle('app:selectFolder', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
});

ipcMain.handle('app:relaunch', () => {
  app.relaunch();
  app.exit(0);
});
