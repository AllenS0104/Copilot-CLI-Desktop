# Copilot CLI Desktop

<p align="center">
  <img src="assets/icon.png" width="128" alt="Copilot Desktop" />
</p>

<p align="center">
  <strong>A modern desktop UI for GitHub Copilot CLI</strong><br/>
  Making AI-powered coding accessible to everyone — no terminal required.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-0.1.0-blue" alt="version" />
  <img src="https://img.shields.io/badge/platform-Windows%20%7C%20Linux-green" alt="platform" />
  <img src="https://img.shields.io/badge/license-MIT-yellow" alt="license" />
  <img src="https://img.shields.io/badge/electron-28-purple" alt="electron" />
</p>

---

## ✨ What is Copilot CLI Desktop?

Copilot Desktop wraps [GitHub Copilot CLI](https://github.com/features/copilot/cli/) in a modern Electron desktop app with a graphical interface. It's built for users who prefer a visual UI over the command line.

### Key Features

- 🤖 **AI Chat** — Stream responses with Markdown rendering & syntax highlighting
- 🔐 **Auto/Manual Auth** — GitHub device code flow with guided steps
- 📁 **File Explorer** — Browse files, @ mention in prompts
- 🧠 **17 AI Models** — Claude, GPT, Gemini — switch with one click
- 🌍 **Multi-language** — English, 中文, 日本語, 한국어
- 📂 **Project Management** — Add/switch projects, auto-sync working directory
- 💬 **Conversation History** — Browse and restore past sessions
- ⚡ **Quick Actions** — Explain, Test, Debug, Refactor cards
- 🔧 **Slash Commands** — /help, /model, /compact, /diff, /review
- 🚀 **Auto CLI Install** — Detects missing CLI and guides installation

---

## 📦 Downloads

### Windows

| File | Type | Description |
|------|------|-------------|
| `CopilotDesktop-Setup-0.1.0.exe` | **NSIS Installer** | Standard installer with desktop & start menu shortcuts |
| `CopilotDesktop-Portable-0.1.0.exe` | **Portable (Beta)** | No installation needed, run directly |

### Linux

| File | Type | Description |
|------|------|-------------|
| `CopilotDesktop-0.1.0-linux-x64.tar.gz` | **tar.gz** | Extract and run `./copilot-desktop` |

> **Note:** MSI installer and `.deb`/`.AppImage` packages require elevated build permissions. They will be available in future releases.

---

## 🚀 Getting Started

### Prerequisites

- A valid [GitHub Copilot](https://github.com/features/copilot) subscription
- The app will auto-detect and guide you to install Copilot CLI if not found

### Install & Run

**Windows (Installer):**
1. Download `CopilotDesktop-Setup-0.1.0.exe`
2. Run the installer → choose install directory
3. Launch from desktop shortcut or start menu

**Windows (Portable):**
1. Download `CopilotDesktop-Portable-0.1.0.exe`
2. Double-click to run — no installation needed

**Linux:**
```bash
tar -xzf CopilotDesktop-0.1.0-linux-x64.tar.gz
cd copilot-desktop
./copilot-desktop
```

### First Launch Flow

1. **CLI Check** — App detects if Copilot CLI is installed
2. **CLI Install** — If missing, guides you through installation (restart required after)
3. **Auth Choice** — Select Auto (existing credentials) or Manual (terminal-based login)
4. **Ready** — Start chatting with Copilot!

---

## 🏗️ Architecture

```
copilot-desktop/
├── src/
│   ├── main/                     # Electron Main Process
│   │   ├── main.ts               # Window, IPC handlers, PTY, system menu
│   │   └── preload.ts            # contextBridge API surface
│   └── renderer/                 # React Renderer Process
│       ├── App.tsx               # Root component & view routing
│       ├── components/
│       │   ├── AuthChoicePage.tsx # Auto/Manual auth selection
│       │   ├── InstallPage.tsx   # CLI install prompt + restart
│       │   ├── LoginPage.tsx     # Terminal-based GitHub login
│       │   ├── ChatPanel.tsx     # Chat UI with streaming
│       │   ├── Sidebar.tsx       # Navigation (Chat/Files/History/Settings)
│       │   ├── Header.tsx        # Context bar
│       │   ├── FileTree.tsx      # File explorer with @ mentions
│       │   ├── SettingsPanel.tsx  # Model/language/preferences
│       │   ├── HistoryPanel.tsx   # Conversation history
│       │   └── ...
│       ├── store/index.ts        # Zustand global state
│       ├── utils/
│       │   ├── i18n.ts           # 4 locales × 80+ keys
│       │   └── ansiParser.ts     # Full ANSI/CSI/OSC parser
│       └── types/index.ts        # TypeScript interfaces
├── assets/
│   ├── icon.ico                  # Windows icon
│   └── icon.png                  # Linux icon
├── release/                      # Built packages (gitignored)
│   ├── windows/
│   └── linux/
└── package.json
```

### Tech Stack

| Category | Technology | Purpose |
|----------|-----------|---------|
| **Framework** | Electron 28 | Desktop container |
| **Frontend** | React 18 + TypeScript 5 | UI rendering |
| **State** | Zustand 4 | Lightweight global state |
| **Styling** | Tailwind CSS 3 | Utility-first CSS |
| **Bundler** | Webpack 5 | Module bundling |
| **Terminal** | node-pty | Interactive CLI communication |
| **Markdown** | react-markdown + react-syntax-highlighter | AI response rendering |
| **Packaging** | electron-builder | Cross-platform distribution |

### How It Works

```
┌─────────────────────────────────────────────────┐
│              Electron Main Process               │
│  ┌─────────────┐ ┌──────────┐ ┌──────────────┐  │
│  │ BrowserWindow│ │ node-pty │ │child_process │  │
│  │  (Window)    │ │ (Login)  │ │(copilot -sp) │  │
│  └──────┬──────┘ └────┬─────┘ └──────┬───────┘  │
│         └──────── IPC ─┴──────────────┘          │
├─────────── preload.ts (contextBridge) ───────────┤
│              Renderer Process (React)             │
│  ┌────────┬──────────────────────┬─────────┐     │
│  │Sidebar │ Header + ChatPanel   │CodeView │     │
│  │        │ (Streaming + MD)     │         │     │
│  │        │ Input Bar            │         │     │
│  └────────┴──────────────────────┴─────────┘     │
│  ┌─────────────────────────────────────────┐     │
│  │  Zustand Store (auth/messages/locale..) │     │
│  └─────────────────────────────────────────┘     │
└──────────────────────────────────────────────────┘
```

---

## 🎨 Design

- **Theme:** Slate/Indigo dark mode (inspired by Linear, Arc, Cursor)
- **Icons:** SVG line icons — minimal and clean
- **Animations:** Fade-in, slide-up, pulse loading bar
- **Layout:** Collapsible sidebar + context header + main workspace

---

## 🛠️ Development

```bash
# Install dependencies
npm install

# Development mode (hot-reload)
npm run dev

# Production build
npm run build

# Package for Windows
npx electron-builder --win nsis portable

# Package for Linux
npx electron-builder --linux tar.gz
```

### Supported AI Models (17)

```
Claude:  sonnet-4.6 · sonnet-4.5 · haiku-4.5 · opus-4.6 · opus-4.6-fast · opus-4.5 · sonnet-4
Gemini:  3-pro-preview
GPT:     5.3-codex · 5.2-codex · 5.2 · 5.1-codex-max · 5.1-codex · 5.1 · 5.1-codex-mini · 5-mini · 4.1
```

---

## 📋 Version History

| Version | Date | Milestone |
|---------|------|-----------|
| v0.1.0 | 2026-03-06 | 🎉 First public release |
| — | 2026-03-06 | CLI auto-detection & installation |
| — | 2026-03-06 | Auth choice (Auto/Manual) with terminal flow |
| — | 2026-03-06 | Linux tar.gz build |
| — | 2026-03-06 | Multi-language i18n (en/zh-CN/ja/ko) |
| — | 2026-03-06 | UI V3 redesign + V2 features (Header/Projects/History) |
| — | 2026-03-05 | Core functionality: auth, chat, file explorer |
| — | 2026-03-05 | Initial project scaffold |

---

## 📄 License

MIT

---

<p align="center">
  Built with ❤️ by Allen Song & the Copilot Desktop Team<br/>
  Powered by <a href="https://github.com/features/copilot/cli/">GitHub Copilot CLI</a>
</p>
