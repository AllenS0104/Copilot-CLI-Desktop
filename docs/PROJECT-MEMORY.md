# Copilot CLI Desktop — Project Memory & History

## 项目概述
**Copilot Desktop** — 将 GitHub Copilot CLI 包装为 Electron 桌面应用，提供图形化界面。
- **作者**: Allen Song (v-songjun@microsoft.com)
- **当前版本**: v0.2.0
- **路径**: `C:\Users\v-songjun\Downloads\99\copilot CLI\copilot-desktop`
- **GitHub (Personal/Public)**: https://github.com/AllenS0104/Copilot-CLI-Desktop
- **GitHub (EMO/Private)**: https://github.com/v-songjun_microsoft/Copilot-CLI-desktop

---

## 技术栈
- **框架**: Electron 28 + React 18 + TypeScript
- **构建**: Webpack 5 (renderer) + tsc (main process)
- **样式**: Tailwind CSS 3
- **状态管理**: Zustand
- **终端**: node-pty + xterm.js 5
- **Markdown**: react-markdown + react-syntax-highlighter
- **自动更新**: electron-updater (读取 GitHub Releases `latest.yml`)
- **打包**: electron-builder (NSIS installer + Portable)
- **国际化**: 自定义 i18n (en / zh-CN / ja / ko)

---

## 架构设计

### 双模式 Copilot 调用
1. **Chat 模式 (非交互)**: `spawn('cmd.exe', ['/c', 'copilot', '-s', '-p', prompt])` — 一次性 API 调用
2. **Vibe Code 模式 (交互)**: node-pty → xterm.js — 完整交互式终端，支持 vibe coding

### IPC 通信 (main ↔ renderer)
- `copilot:prompt` — 发送 prompt，流式返回 stdout
- `copilot:cancel` — 终止当前进程
- `copilot:checkAuth` — 检查登录状态
- `copilot:login` / `copilot:loginTerminal` — 登录流程
- `copilot:checkInstall` — 检测 CLI 安装
- `copilot:getVersion` / `copilot:update` — CLI 版本管理
- `pty:create/write/resize/kill` — PTY 管理 (Vibe Code)
- `fs:readdir/readfile/writefile/mkdir/delete/rename` — 文件操作
- `updater:check/download/install` — App 自动更新

### 关键技术决策
- **Windows spawn 问题**: `shell: true` 会拆分空格参数 → 改用 `cmd.exe /c` 单独传参
- **Package 体积优化**: 显式列出 node_modules 依赖 (2.7GB → 81MB)
- **Auth 流程**: 打开外部 cmd 终端让用户手动交互，app 轮询检测登录状态

---

## 文件结构
```
copilot-desktop/
├── package.json              # v0.2.0, build config, publish config
├── webpack.config.js         # Renderer bundling (React/CSS)
├── tsconfig.json             # Renderer TypeScript
├── tsconfig.main.json        # Main process TypeScript
├── tailwind.config.js        # Tailwind theme
├── postcss.config.js         # PostCSS + Tailwind + Autoprefixer
├── README.md                 # Full docs with download links
├── scripts/release.ps1       # One-click release automation
├── assets/
│   ├── icon.ico              # App icon (Windows)
│   └── icon.png              # App icon (general)
├── src/
│   ├── main/
│   │   ├── main.ts           # Electron main process (ALL IPC handlers)
│   │   └── preload.ts        # contextBridge API surface
│   └── renderer/
│       ├── index.html         # HTML shell
│       ├── index.tsx          # React entry point
│       ├── App.tsx            # Root component + routing
│       ├── store/index.ts     # Zustand global state
│       ├── types/index.ts     # TypeScript interfaces
│       ├── utils/
│       │   ├── i18n.ts        # 4-locale translations (~500 keys)
│       │   └── ansiParser.ts  # ANSI escape sequence stripper
│       ├── styles/globals.css # Tailwind base + custom animations
│       └── components/
│           ├── AuthChoicePage.tsx    # Auto/Manual auth choice
│           ├── LoginPage.tsx         # Manual auth via external terminal
│           ├── InstallPage.tsx       # CLI auto-install on first run
│           ├── ChatPanel.tsx         # Main chat UI (Markdown + streaming)
│           ├── VibeCodePanel.tsx     # ★ xterm.js interactive terminal
│           ├── FileTree.tsx          # Directory browser
│           ├── CodePreview.tsx       # File content viewer
│           ├── Header.tsx            # Top bar (model selector, cwd)
│           ├── Sidebar.tsx           # Left nav (Chat/Vibe/Files/History/Settings)
│           ├── SettingsPanel.tsx     # Theme, locale, CLI version, about
│           ├── HistoryPanel.tsx      # Conversation history
│           ├── ModelSelector.tsx     # AI model dropdown
│           ├── SessionManager.tsx    # Session management
│           ├── StatusBar.tsx         # Bottom status bar
│           ├── ToolCallViewer.tsx    # Tool call display
│           └── UpdateNotification.tsx # Auto-update banner
└── release/windows/           # Built installers
```

---

## 版本历史

### v0.2.0 (2026-03-09)
- ★ **Vibe Code Tab**: 嵌入 xterm.js 终端，完整 vibe coding 体验
- 修复 "too many arguments" prompt 传参问题

### v0.1.2 (2026-03-08)
- 自动更新 (electron-updater + GitHub Releases)
- CLI 版本检查和一键更新
- Package 体积优化 (159MB → 81MB)
- Release 自动化脚本
- 修复 prompt 参数传递

### v0.1.1 (2026-03-07)
- 修复 5 个 bug: PowerShell sandbox、复制粘贴、停止按钮、@命令、文件写入
- @Files 文件选择器、@Context 上下文菜单

### v0.1.0 (2026-03-07)
- 首个正式发布
- 完整 Chat UI、文件树、代码预览
- 身份验证 (自动/手动)
- CLI 自动检测和安装
- NSIS 安装程序 + Portable
- 4 语言 i18n

### 早期开发 (pre-release)
- V1: 脚手架 + ANSI 解析器
- V2: 完整功能实现 (auth, chat, files)
- V3: UI 重设计 (modern dark theme)
- UI-V2: Header, Projects, History, System Menu

---

## Git 提交历史 (完整)
```
16f4b27 feat: add Vibe Code tab with embedded xterm.js terminal (v0.2.0)
d8cdbee fix: correct Windows spawn - pass args separately to cmd.exe /c
a558515 fix: resolve 'too many arguments' by using cmd.exe /c with quoted prompt
21ed49c docs: update README for v0.1.2 with upgrade notice and auto-update info
abd2e58 chore: add release automation script
e65b921 feat: add Copilot CLI version check and one-click update
4f9eec3 feat: add auto-update via electron-updater + GitHub Releases
13d774d fix: split -sp into -s -p to prevent arg parsing error
c27e6c2 docs: update README for v0.1.1, clean file names
13b5bd4 fix: resolve 5 bugs from update-1
61d6fd5 chore: remove txt files from repo
6ecf496 docs: rewrite README for v0.1.0 GitHub release
9d4287a fix: restart prompt after first-time CLI install
0c1a89a fix: manual auth opens real terminal instead of hidden PTY
88545e3 fix: PTY spawn 'File not found' on Windows
50bc1b0 fix: two login flow bugs + separate release folder
5ca6b20 feat: add Linux build (tar.gz) + organize dist folder
0e15709 feat: formal packaging with NSIS installer + portable exe
40cd44d fix: login detects TUI ready state and already-authenticated
f2cf449 fix: manual auth uses correct PTY flow (copilot -> /login)
fd16edb feat: auth choice page + fix manual auth flow
9ef0fdf feat: auth mode selection (auto/manual) instead of auto-check
b2d7c4e feat: add CLI auto-detection and installation on startup
b7c8b46 docs: add comprehensive project documentation (README.md)
bebc7cf feat: UI-V2 redesign - Header, Projects, History, System Menu
9093ce3 feat: add multi-language i18n support (en/zh-CN/ja/ko)
ab04a0a feat: V3 UI redesign - modern, professional dark theme
8aba83d fix: remove invalid --cwd flag from copilot spawn args
c7ec344 fix: update model list to match current Copilot CLI allowed models
52b32ae feat: V2 - full UI implementation with auth, chat, and file management
ddb5216 fix: comprehensive ANSI escape stripping to eliminate garbled output
f720603 fix: resolve 6 critical issues from code review
7547240 feat: initial Copilot CLI Desktop app scaffold
```

---

## GitHub 操作指南

### Git Remotes
- `origin` → EMO (private): `https://github.com/v-songjun_microsoft/Copilot-CLI-desktop.git`
- `personal` → Public: `https://github.com/AllenS0104/Copilot-CLI-Desktop.git`

### GitHub CLI 切换账号
```powershell
& "C:\Program Files\GitHub CLI\gh.exe" auth switch --user AllenS0104       # Personal
& "C:\Program Files\GitHub CLI\gh.exe" auth switch --user v-songjun_microsoft  # EMO
```

### 发布新版本 (一键脚本)
```powershell
cd "C:\Users\v-songjun\Downloads\99\copilot CLI\copilot-desktop"
.\scripts\release.ps1 -Version "0.3.0"
```

### 手动发布流程
```powershell
# 1. Build
npx webpack --mode production
npx tsc -p tsconfig.main.json
$env:CSC_IDENTITY_AUTO_DISCOVERY="false"; npx electron-builder --win nsis portable

# 2. Push
git push personal main && git push origin main

# 3. Create Release (Personal)
gh release create v0.X.0 --repo AllenS0104/Copilot-CLI-Desktop --title "vX.X.X" dist\*.exe dist\latest.yml

# 4. Create Release (EMO)
gh auth switch --user v-songjun_microsoft
gh release create v0.X.0 --repo v-songjun_microsoft/Copilot-CLI-desktop --title "vX.X.X" dist\*.exe dist\latest.yml
gh auth switch --user AllenS0104
```

---

## 已知问题 & 注意事项

1. **Windows spawn**: 必须用 `spawn('cmd.exe', ['/c', 'copilot', '-s', '-p', prompt])`，不能用 `shell: true`
2. **Package 体积**: `files` 配置必须显式列出模块，不能用 `node_modules/**/*`
3. **EMO 限制**: Enterprise Managed Organization 不能创建 public repos
4. **Auto-update**: 需要 `latest.yml` + `.exe` + `.blockmap` 都上传到 GitHub Release
5. **Copilot CLI model 报错**: 400 "model not supported" 表示模型名称不在允许列表中

---

## 可用 AI 模型 (17个)
claude-sonnet-4.6, claude-sonnet-4.5, claude-haiku-4.5, claude-opus-4.6, claude-opus-4.6-fast,
claude-opus-4.5, claude-sonnet-4, gemini-3-pro-preview, gpt-5.3-codex, gpt-5.2-codex,
gpt-5.2, gpt-5.1-codex-max, gpt-5.1-codex, gpt-5.1, gpt-5.1-codex-mini, gpt-5-mini, gpt-4.1

---

## 未来可能的方向
- [ ] 原生 UI 解析 Copilot 输出 (替代纯 xterm.js)
- [ ] MCP Server 集成
- [ ] 多窗口/多 session 支持
- [ ] macOS / Linux 原生打包
- [ ] 插件系统
- [ ] 对话导出 (Markdown/PDF)
- [ ] 快捷键系统
- [ ] 自定义 prompt 模板

