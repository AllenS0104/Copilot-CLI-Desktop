import React, { useRef, useEffect, useState, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useStore } from '../store';
import type { Message } from '../types';

export const ChatPanel: React.FC = () => {
  const messages = useStore((s) => s.messages);
  const addMessage = useStore((s) => s.addMessage);
  const updateLastMessage = useStore((s) => s.updateLastMessage);
  const isThinking = useStore((s) => s.isThinking);
  const setIsThinking = useStore((s) => s.setIsThinking);
  const cwd = useStore((s) => s.cwd);
  const currentModel = useStore((s) => s.currentModel);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamBufferRef = useRef('');
  const activeIdRef = useRef<string | null>(null);

  // Register IPC listeners once
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
        content: `❌ Error: ${message}`,
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

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || isThinking) return;

    addMessage({
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    });
    setInput('');
    setIsThinking(true);
    streamBufferRef.current = '';
    activeIdRef.current = null;

    window.electronAPI?.copilot.prompt({ prompt: text, cwd, model: currentModel });
  }, [input, isThinking, cwd, currentModel, addMessage, setIsThinking]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.ctrlKey && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    // Ctrl+Enter inserts newline (default textarea behavior)
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-3 text-gray-400">
              <div className="text-5xl">👋</div>
              <p className="text-lg">Hi! I'm GitHub Copilot. Ask me anything about your code.</p>
            </div>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role !== 'user' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm">
                {msg.role === 'assistant' ? '🤖' : 'ℹ️'}
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : msg.role === 'system'
                  ? 'bg-red-900/40 border border-red-700/50 text-gray-300'
                  : 'bg-gray-800 text-gray-100'
              }`}
            >
              {msg.role === 'assistant' ? (
                <ReactMarkdown
                  components={{
                    code({ className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '');
                      const code = String(children).replace(/\n$/, '');
                      return match ? (
                        <SyntaxHighlighter style={vscDarkPlus} language={match[1]} PreTag="div">
                          {code}
                        </SyntaxHighlighter>
                      ) : (
                        <code className="bg-gray-700 px-1 rounded text-sm" {...props}>
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              ) : (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}
              <div className="text-xs text-gray-400 mt-1">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </div>
            </div>
            {msg.role === 'user' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center text-sm">
                👤
              </div>
            )}
          </div>
        ))}
        {isThinking && !activeIdRef.current && (
          <div className="flex gap-3 items-center">
            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm">🤖</div>
            <div className="bg-gray-800 rounded-lg p-3 text-gray-400">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span>Copilot is thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="border-t border-gray-700 p-3 flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isThinking ? 'Waiting for response...' : 'Type a message... (Enter to send, Ctrl+Enter for newline)'}
          className="flex-1 bg-gray-800 text-gray-100 rounded-lg px-4 py-2 resize-none outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          rows={2}
          disabled={isThinking}
        />
        <button
          onClick={handleSend}
          disabled={isThinking || !input.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white px-4 py-2 rounded-lg transition-colors self-end"
        >
          Send
        </button>
      </div>
    </div>
  );
};
