# Copilot Desktop — 项目文档

> 将 GitHub Copilot CLI 包装为一个现代化的 Electron 桌面应用，让不熟悉命令行的用户也能直观地使用 AI 编程助手。

---

## 📋 项目进度

### 版本历程

| 版本 | 日期 | 里程碑 | 状态 |
|------|------|--------|------|
| V1.0 | 2026-03-05 | 项目脚手架搭建 (Electron + React + TS) | ✅ 完成 |
| V1.1 | 2026-03-05 | Code Review 修复 6 个关键问题 | ✅ 完成 |
| V1.2 | 2026-03-05 | ANSI 转义序列全面解析，消除乱码 | ✅ 完成 |
| V2.0 | 2026-03-05 | 功能实现：身份验证、对话、文件管理 | ✅ 完成 |
| V2.1 | 2026-03-05 | 修复 model 列表和 --cwd 参数 | ✅ 完成 |
| V3.0 | 2026-03-06 | UI 大重构：Slate/Indigo 主题、SVG 图标 | ✅ 完成 |
| V3.1 | 2026-03-06 | 多语言国际化 (en/zh-CN/ja/ko) | ✅ 完成 |
| V3.2 | 2026-03-06 | UI-V2：Header、Projects、History、系统菜单 | ✅ 完成 |

### Git 提交记录

```
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

## 🏗️ 项目架构

### 整体结构

```
copilot-desktop/
├── src/
│   ├── main/                    # Electron 主进程
│   │   ├── main.ts              # 窗口管理、IPC、PTY、系统菜单
│   │   └── preload.ts           # contextBridge API 暴露
│   └── renderer/                # React 渲染进程
│       ├── App.tsx              # 根组件、路由、布局
│       ├── index.tsx            # React 入口
│       ├── index.html           # HTML 模板
│       ├── components/          # UI 组件
│       │   ├── Header.tsx       # 上下文栏 (项目/文件/状态)
│       │   ├── Sidebar.tsx      # 侧边导航 (Chat/Files/History/Projects/Settings)
│       │   ├── ChatPanel.tsx    # 对话面板 (消息/输入/快捷操作)
│       │   ├── FileTree.tsx     # 文件浏览器
│       │   ├── CodePreview.tsx  # 代码预览/Diff
│       │   ├── LoginPage.tsx    # GitHub 登录页
│       │   ├── HistoryPanel.tsx # 对话历史
│       │   ├── ModelSelector.tsx# 模型选择器
│       │   ├── SettingsPanel.tsx# 设置面板
│       │   ├── StatusBar.tsx    # 底部状态线
│       │   ├── SessionManager.tsx
│       │   └── ToolCallViewer.tsx
│       ├── store/
│       │   └── index.ts         # Zustand 全局状态管理
│       ├── styles/
│       │   └── globals.css      # Tailwind + 自定义样式/动画
│       ├── types/
│       │   └── index.ts         # TypeScript 类型定义
│       └── utils/
│           ├── ansiParser.ts    # 终端 ANSI 转义序列解析器
│           └── i18n.ts          # 国际化翻译系统
├── package.json
├── tsconfig.json                # Renderer TS 配置
├── tsconfig.main.json           # Main process TS 配置
├── webpack.config.js            # Webpack 打包配置
├── tailwind.config.js           # Tailwind CSS 配置
├── postcss.config.js            # PostCSS 配置
└── dist/
    ├── main/                    # 编译后的主进程 JS
    ├── renderer/                # 编译后的渲染进程 bundle
    └── win-unpacked/            # Windows 免安装包
        └── Copilot Desktop.exe  # 可执行文件 (~540MB)
```

### 架构图

```
┌─────────────────────────────────────────────────────────┐
│                    Electron Main Process                 │
│  ┌───────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │  BrowserWindow │  │   node-pty   │  │  child_process│ │
│  │  (窗口管理)    │  │  (PTY 交互)  │  │ (copilot -sp) │ │
│  └───────┬───────┘  └──────┬───────┘  └──────┬───────┘ │
│          │ IPC              │ IPC              │ IPC     │
├──────────┼──────────────────┼──────────────────┼────────┤
│          │      preload.ts (contextBridge)      │        │
├──────────┼──────────────────────────────────────┼────────┤
│                    Renderer Process (React)               │
│                                                           │
│  ┌──────────────────────────────────────────────────┐    │
│  │  System Menu (File / View / Help)                 │    │
│  ├────────────┬─────────────────────────────────────┤    │
│  │  Sidebar   │  Header (Context Bar)                │    │
│  │            ├─────────────────────────────────────┤    │
│  │  Chat      │                                     │    │
│  │  Files     │  ChatPanel / Workspace              │    │
│  │  History   │  (消息流 + Markdown + 代码高亮)      │    │
│  │  ─────     │                                     │    │
│  │  Projects  ├─────────────────────────────────────┤    │
│  │  ─────     │  Input Bar                          │    │
│  │  Settings  │  [@Files] [@Context] [/Commands]    │    │
│  │  User      │  [textarea]              [Send ▶]   │    │
│  └────────────┴─────────────────────────────────────┘    │
│                                                           │
│  ┌─────────────────────────────────────────────────┐     │
│  │          Zustand Store (全局状态)                 │     │
│  │  auth │ messages │ files │ projects │ locale ... │     │
│  └─────────────────────────────────────────────────┘     │
└───────────────────────────────────────────────────────────┘
```

---

## 🛠️ 技术栈

| 类别 | 技术 | 用途 |
|------|------|------|
| **框架** | Electron 28 | 桌面应用容器 |
| **前端** | React 18 + TypeScript 5 | UI 渲染 |
| **状态管理** | Zustand 4 | 轻量级全局状态 |
| **样式** | Tailwind CSS 3 | 原子化 CSS |
| **打包** | Webpack 5 | 模块打包 |
| **终端** | node-pty | 与 Copilot CLI 进程交互 |
| **Markdown** | react-markdown + react-syntax-highlighter | AI 回复渲染 |
| **Diff** | diff2html | 代码变更对比 |
| **分发** | electron-builder | Windows 免安装打包 |

---

## 🔑 核心功能

### 双模式 CLI 桥接

| 模式 | 技术 | 场景 |
|------|------|------|
| **Prompt API** | `copilot -sp "prompt"` (child_process) | 日常对话、代码生成 |
| **Interactive PTY** | node-pty 终端模拟 | 登录认证、交互式确认 |

### 已实现功能清单

- ✅ GitHub 身份验证 (Device Code Flow)
- ✅ AI 对话 (流式响应、Markdown 渲染、代码高亮)
- ✅ 文件浏览 (目录树、点击预览、@ 引用)
- ✅ 模型切换 (17 个模型: Claude/GPT/Gemini)
- ✅ 项目管理 (添加/切换项目、自动同步工作目录)
- ✅ 对话历史
- ✅ 快捷操作卡片 (解释项目/生成测试/调试/重构)
- ✅ 斜杠命令 (/help, /model, /compact, /diff, /review)
- ✅ 多语言 (English, 中文, 日本語, 한국어)
- ✅ 系统菜单 (File/View/Help + 快捷键)
- ✅ 代码预览 (语法高亮、Tab 管理)
- ✅ ANSI 转义序列全面解析

### 支持的 AI 模型

```
Claude: sonnet-4.6, sonnet-4.5, haiku-4.5, opus-4.6, opus-4.6-fast, opus-4.5, sonnet-4
Gemini: 3-pro-preview
GPT:    5.3-codex, 5.2-codex, 5.2, 5.1-codex-max, 5.1-codex, 5.1, 5.1-codex-mini, 5-mini, 4.1
```

---

## 🎨 设计语言

- **配色**: Slate 蓝灰底色 + Indigo 强调色 (inspired by Linear/Arc/Cursor)
- **图标**: SVG 线条图标，克制不炫技
- **动效**: 淡入 (fade-in)、滑入 (slide-up)、脉冲 (pulse-bar)
- **布局**: 三区结构 (Sidebar + Header + Main)
- **原则**: 冷静的现代感，信息层级清晰，大方留白

---

## 🚀 使用方式

```bash
# 开发模式
npm run dev

# 生产构建
npm run build

# 打包 Windows 免安装版
npm run pack

# 直接运行打包结果
dist\win-unpacked\Copilot Desktop.exe
```

### 前置条件

- [GitHub Copilot CLI](https://github.com/github/copilot-cli) 已安装并在 PATH 中
- 有效的 Copilot 订阅

---

## 📁 关键文件说明

| 文件 | 职责 |
|------|------|
| `main.ts` | Electron 主进程：窗口、IPC (pty/fs/copilot/app/menu)、系统菜单 |
| `preload.ts` | contextBridge：安全暴露 IPC 方法到渲染进程 |
| `store/index.ts` | Zustand 状态：auth、messages、files、projects、locale 等 |
| `ChatPanel.tsx` | 核心对话 UI：消息流、流式渲染、输入栏、快捷操作 |
| `Sidebar.tsx` | 三分区导航：全局能力 / 项目列表 / 系统设置 |
| `Header.tsx` | 上下文栏：当前项目/文件、连接状态、模型、语言 |
| `LoginPage.tsx` | GitHub Device Code 认证流程 |
| `i18n.ts` | 国际化：4 语言 × 60+ 翻译键 |
| `ansiParser.ts` | ANSI/CSI/OSC/DCS 全序列解析器 |
