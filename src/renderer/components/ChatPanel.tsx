import React, { useRef, useEffect, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useStore } from '../store';
import type { Message } from '../types';
import { t } from '../utils/i18n';

const quickActions = [
  { emoji: '📖', labelKey: 'chat.action_explain', promptKey: 'chat.prompt_explain' },
  { emoji: '🧪', labelKey: 'chat.action_test', promptKey: 'chat.prompt_test' },
  { emoji: '🐛', labelKey: 'chat.action_debug', promptKey: 'chat.prompt_debug' },
  { emoji: '✨', labelKey: 'chat.action_refactor', promptKey: 'chat.prompt_refactor' },
];

export const ChatPanel: React.FC = () => {
  const messages = useStore((s) => s.messages);
  const addMessage = useStore((s) => s.addMessage);
  const updateLastMessage = useStore((s) => s.updateLastMessage);
  const isThinking = useStore((s) => s.isThinking);
  const setIsThinking = useStore((s) => s.setIsThinking);
  const cwd = useStore((s) => s.cwd);
  const currentModel = useStore((s) => s.currentModel);
  const chatInput = useStore((s) => s.chatInput);
  const setChatInput = useStore((s) => s.setChatInput);
  const setActiveSidebarTab = useStore((s) => s.setActiveSidebarTab);
  const setCurrentModel = useStore((s) => s.setCurrentModel);
  const availableModels = useStore((s) => s.availableModels);
  const locale = useStore((s) => s.locale);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamBufferRef = useRef('');
  const activeIdRef = useRef<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showCommands, setShowCommands] = useState(false);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [hoveredMsg, setHoveredMsg] = useState<string | null>(null);
  const [showFilePicker, setShowFilePicker] = useState(false);
  const [showContextMenu, setShowContextMenu] = useState(false);

  useEffect(() => {
    if (!window.electronAPI) return;

    const cleanupStdout = window.electronAPI.copilot.onStdout(({ data }) => {
      streamBufferRef.current += data;
      if (!activeIdRef.current) {
        const id = `msg-${Date.now()}`;
        activeIdRef.current = id;
        useStore.getState().addMessage({
          id,
          role: 'assistant',
          content: streamBufferRef.current,
          timestamp: Date.now(),
        });
      } else {
        useStore.getState().updateLastMessage(streamBufferRef.current);
      }
    });

    const cleanupDone = window.electronAPI.copilot.onDone(() => {
      activeIdRef.current = null;
      streamBufferRef.current = '';
      useStore.getState().setIsThinking(false);
    });

    const cleanupError = window.electronAPI.copilot.onError(({ message }) => {
      activeIdRef.current = null;
      streamBufferRef.current = '';
      useStore.getState().setIsThinking(false);
      useStore.getState().addMessage({
        id: `msg-err-${Date.now()}`,
        role: 'system',
        content: `Error: ${message}`,
        timestamp: Date.now(),
      });
    });

    return () => {
      cleanupStdout();
      cleanupDone();
      cleanupError();
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + 'px';
    }
  }, [chatInput]);

  const doSend = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isThinking) return;

    addMessage({
      id: `msg-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
    });
    setChatInput('');
    setIsThinking(true);
    streamBufferRef.current = '';
    activeIdRef.current = null;

    window.electronAPI?.copilot.prompt({ prompt: trimmed, cwd, model: currentModel }).then((id: string) => {
      useStore.getState().setActivePromptId(id);
    });
  }, [isThinking, cwd, currentModel, addMessage, setIsThinking, setChatInput]);

  const handleSend = useCallback(() => {
    doSend(chatInput);
  }, [chatInput, doSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.ctrlKey && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCancel = useCallback(() => {
    const promptId = useStore.getState().activePromptId;
    if (promptId) {
      window.electronAPI?.copilot.cancel({ id: promptId });
    }
    setIsThinking(false);
    useStore.getState().setActivePromptId(null);
    activeIdRef.current = null;
    streamBufferRef.current = '';
  }, [setIsThinking]);

  const commands = [
    { cmd: '/help', descKey: 'cmd.help' },
    { cmd: '/model', descKey: 'cmd.model' },
    { cmd: '/compact', descKey: 'cmd.compact' },
    { cmd: '/diff', descKey: 'cmd.diff' },
    { cmd: '/review', descKey: 'cmd.review' },
  ];

  const folderName = cwd ? cwd.split(/[\\/]/).pop() : '...';

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full animate-fade-in">
            <div className="text-center space-y-6 max-w-md">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-slate-100">{t('chat.welcome_title', locale)}</h2>
                <p className="text-sm text-slate-500">{t('chat.welcome_subtitle', locale)}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action) => (
                  <button
                    key={action.labelKey}
                    onClick={() => doSend(t(action.promptKey, locale))}
                    className="bg-slate-800/50 border border-slate-700/50 hover:border-indigo-500/50 hover:bg-slate-800 rounded-xl p-4 text-left transition-all duration-150 cursor-pointer group"
                  >
                    <span className="text-lg">{action.emoji}</span>
                    <p className="text-sm text-slate-300 mt-2 group-hover:text-slate-100 transition-colors">{t(action.labelKey, locale)}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 animate-slide-up ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            onMouseEnter={() => setHoveredMsg(msg.id)}
            onMouseLeave={() => setHoveredMsg(null)}
          >
            {msg.role !== 'user' && (
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-medium text-slate-300">
                C
              </div>
            )}
            <div
              className={`max-w-[80%] p-3 ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-2xl rounded-br-sm'
                  : msg.role === 'system'
                  ? 'bg-red-900/30 border border-red-700/50 text-slate-300 rounded-2xl'
                  : 'bg-slate-800 text-slate-100 rounded-2xl rounded-bl-sm'
              }`}
            >
              {msg.role === 'assistant' ? (
                <div className="prose prose-invert prose-sm max-w-none">
                  <ReactMarkdown
                    components={{
                      code({ className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        const code = String(children).replace(/\n$/, '');
                        return match ? (
                          <div className="relative group/code">
                            <SyntaxHighlighter
                              style={vscDarkPlus}
                              language={match[1]}
                              PreTag="div"
                              customStyle={{ background: '#0f172a', borderRadius: '8px', fontSize: '13px' }}
                            >
                              {code}
                            </SyntaxHighlighter>
                            <button
                              onClick={() => navigator.clipboard.writeText(code)}
                              className="absolute top-2 right-2 opacity-0 group-hover/code:opacity-100 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs px-2 py-1 rounded transition-opacity"
                            >
                              {t('chat.copy', locale)}
                            </button>
                          </div>
                        ) : (
                          <code className="bg-slate-700 px-1.5 py-0.5 rounded text-xs" {...props}>
                            {children}
                          </code>
                        );
                      },
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
              )}
              {hoveredMsg === msg.id && (
                <div className="text-[10px] text-slate-500 mt-1 animate-fade-in">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-medium text-white">
                Y
              </div>
            )}
          </div>
        ))}
        {isThinking && (
          <div className="flex gap-3 items-center animate-fade-in">
            <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-medium text-slate-300">
              C
            </div>
            <div className="bg-slate-800 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <div className="w-16 h-1 rounded-full bg-gradient-to-r from-indigo-500 to-slate-700" style={{ animation: 'pulse-bar 1.5s ease-in-out infinite' }} />
                <span>{t('chat.thinking', locale)}</span>
              </div>
              <button
                onClick={handleCancel}
                className="text-xs bg-red-600/20 hover:bg-red-600/40 text-red-400 hover:text-red-300 px-2.5 py-1 rounded-lg transition-all border border-red-600/30"
                title={t('chat.stop', locale)}
              >
                ■ {t('chat.stop', locale)}
              </button>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-slate-700/50 bg-slate-900">
        {/* Context bar */}
        <div className="px-4 py-1.5 flex items-center gap-2 text-xs text-slate-500 bg-slate-800/30 border-b border-slate-700/30">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
          </svg>
          <span>{folderName}</span>
          <span className="text-slate-600">·</span>
          <button
            onClick={() => setShowModelPicker(!showModelPicker)}
            className="hover:text-slate-300 transition-colors relative"
          >
            {t('chat.model_label', locale)}: {currentModel}
          </button>
          {showModelPicker && (
            <div className="absolute bottom-20 left-16 bg-slate-800 border border-slate-700/50 rounded-xl shadow-xl py-1 z-50 min-w-[200px] max-h-64 overflow-y-auto animate-fade-in">
              {availableModels.map((m) => (
                <button
                  key={m}
                  onClick={() => { setCurrentModel(m); setShowModelPicker(false); }}
                  className={`block w-full text-left px-3 py-1.5 text-xs hover:bg-slate-700/50 transition-colors ${m === currentModel ? 'text-indigo-400' : 'text-slate-300'}`}
                >
                  {m === currentModel ? '● ' : '  '}{m}
                </button>
              ))}
            </div>
          )}
        </div>
        {/* Input row */}
        <div className="p-3 flex items-end gap-2">
          <div className="flex gap-1">
            <div className="relative">
              <button
                onClick={() => { setShowFilePicker(!showFilePicker); setShowContextMenu(false); setShowCommands(false); }}
                className="text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 px-2 py-1.5 rounded-lg transition-all"
              >
                {t('chat.files_btn', locale)}
              </button>
              {showFilePicker && (
                <div className="absolute bottom-8 left-0 bg-slate-800 border border-slate-700/50 rounded-xl shadow-xl py-1 z-50 min-w-[260px] max-h-64 overflow-y-auto animate-fade-in">
                  <div className="px-3 py-1.5 text-[10px] text-slate-500 uppercase tracking-wider">{t('chat.pick_file', locale)}</div>
                  {useStore.getState().openFiles.length > 0 ? (
                    useStore.getState().openFiles.map((f) => (
                      <button
                        key={f.path}
                        onClick={() => {
                          setChatInput(chatInput + `@${f.path} `);
                          setShowFilePicker(false);
                          textareaRef.current?.focus();
                        }}
                        className="block w-full text-left px-3 py-2 hover:bg-slate-700/50 transition-colors"
                      >
                        <span className="text-xs text-indigo-400 font-mono">{f.path.split(/[\\/]/).pop()}</span>
                        <span className="text-[10px] text-slate-500 ml-2 truncate">{f.path}</span>
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-xs text-slate-500">{t('chat.no_open_files', locale)}</div>
                  )}
                  <div className="border-t border-slate-700/50 mt-1 pt-1">
                    <button
                      onClick={() => {
                        setActiveSidebarTab('files');
                        setShowFilePicker(false);
                      }}
                      className="block w-full text-left px-3 py-2 hover:bg-slate-700/50 transition-colors text-xs text-slate-400"
                    >
                      📂 {t('chat.browse_files', locale)}
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className="relative">
              <button
                onClick={() => { setShowContextMenu(!showContextMenu); setShowFilePicker(false); setShowCommands(false); }}
                className="text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 px-2 py-1.5 rounded-lg transition-all"
              >
                {t('chat.context_btn', locale)}
              </button>
              {showContextMenu && (
                <div className="absolute bottom-8 left-0 bg-slate-800 border border-slate-700/50 rounded-xl shadow-xl py-1 z-50 min-w-[220px] animate-fade-in">
                  <div className="px-3 py-1.5 text-[10px] text-slate-500 uppercase tracking-wider">{t('chat.add_context', locale)}</div>
                  {cwd && (
                    <button
                      onClick={() => {
                        setChatInput(chatInput + `@project:${cwd.split(/[\\/]/).pop()} `);
                        setShowContextMenu(false);
                        textareaRef.current?.focus();
                      }}
                      className="block w-full text-left px-3 py-2 hover:bg-slate-700/50 transition-colors"
                    >
                      <span className="text-xs text-indigo-400">📁 {t('chat.ctx_project', locale)}</span>
                      <span className="text-[10px] text-slate-500 ml-2">{cwd.split(/[\\/]/).pop()}</span>
                    </button>
                  )}
                  {useStore.getState().activeFilePath && (
                    <button
                      onClick={() => {
                        const fp = useStore.getState().activeFilePath!;
                        setChatInput(chatInput + `@file:${fp.split(/[\\/]/).pop()} `);
                        setShowContextMenu(false);
                        textareaRef.current?.focus();
                      }}
                      className="block w-full text-left px-3 py-2 hover:bg-slate-700/50 transition-colors"
                    >
                      <span className="text-xs text-indigo-400">📄 {t('chat.ctx_active_file', locale)}</span>
                      <span className="text-[10px] text-slate-500 ml-2">{useStore.getState().activeFilePath?.split(/[\\/]/).pop()}</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setChatInput(chatInput + '@selection ');
                      setShowContextMenu(false);
                      textareaRef.current?.focus();
                    }}
                    className="block w-full text-left px-3 py-2 hover:bg-slate-700/50 transition-colors"
                  >
                    <span className="text-xs text-indigo-400">✂️ {t('chat.ctx_selection', locale)}</span>
                  </button>
                </div>
              )}
            </div>
            <div className="relative">
              <button
                onClick={() => { setShowCommands(!showCommands); setShowFilePicker(false); setShowContextMenu(false); }}
                className="text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 px-2 py-1.5 rounded-lg transition-all"
              >
                {t('chat.commands_btn', locale)}
              </button>
              {showCommands && (
                <div className="absolute bottom-8 left-0 bg-slate-800 border border-slate-700/50 rounded-xl shadow-xl py-1 z-50 min-w-[180px] animate-fade-in">
                  {commands.map((c) => (
                    <button
                      key={c.cmd}
                      onClick={() => { setChatInput(chatInput + c.cmd + ' '); setShowCommands(false); textareaRef.current?.focus(); }}
                      className="block w-full text-left px-3 py-2 hover:bg-slate-700/50 transition-colors"
                    >
                      <span className="text-xs text-indigo-400 font-mono">{c.cmd}</span>
                      <span className="text-xs text-slate-500 ml-2">{t(c.descKey, locale)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <textarea
            ref={textareaRef}
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={(e) => {
              // Explicitly handle paste for Electron compatibility
              const pasted = e.clipboardData.getData('text');
              if (pasted) {
                e.preventDefault();
                const ta = textareaRef.current!;
                const start = ta.selectionStart;
                const end = ta.selectionEnd;
                const newVal = chatInput.substring(0, start) + pasted + chatInput.substring(end);
                setChatInput(newVal);
                // Restore cursor position after React re-render
                setTimeout(() => {
                  ta.selectionStart = ta.selectionEnd = start + pasted.length;
                }, 0);
              }
            }}
            placeholder={isThinking ? t('chat.placeholder_waiting', locale) : t('chat.placeholder', locale)}
            className="flex-1 bg-slate-800 text-slate-100 rounded-xl px-4 py-2.5 resize-none outline-none border border-slate-600 focus:border-indigo-500 disabled:opacity-50 text-sm transition-colors placeholder-slate-500"
            rows={1}
          />
          {isThinking ? (
            <button
              onClick={handleCancel}
              className="bg-red-600 hover:bg-red-500 text-white p-2.5 rounded-xl transition-all self-end"
              title={t('chat.stop', locale)}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!chatInput.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white p-2.5 rounded-xl transition-all self-end"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
