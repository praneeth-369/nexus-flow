import React, { useState, useRef, useEffect } from 'react';
import { useProject } from '../../context/ProjectContext';
import { api } from '../../services/api';
import {
  MessageSquare,
  Sparkles,
  X,
  Send,
  RotateCcw,
  Bot,
  User,
} from 'lucide-react';

export default function AIChatbot() {
  const { setSelectedTaskId, setCurrentView, currentUser, activeProjectId, project } = useProject();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'init-1',
      role: 'assistant',
      content:
        `Hello! I am **NexusFlow AI**, your real-time project architect. I have live access to the dependency graph, critical path, and bottleneck telemetry for **${project?.name || 'this project'}**.\n\nAsk me anything or click one of the quick suggestions below for instant schedule intelligence!`,
      time: 'Just now',
      model: 'NexusFlow Engine',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const prefix = project?.taskPrefix || 'NX';

  const SUGGESTIONS = [
    '🚨 What is the top bottleneck?',
    '⚡ Which task can we start right now?',
    '📐 What is our Critical Path?',
    `🔴 Why is ${prefix}-105 blocked?`,
    '📊 Project Status Summary',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, messages]);

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputText).trim();
    if (!text || loading) return;

    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const history = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Blazing fast API call with active project context
      const res = await api.sendChatMessage(history, activeProjectId);

      const botReply = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.reply || 'Analysis completed.',
        model: res.model || 'Instant Engine',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botReply]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `⚠️ Could not reach AI service: ${err.message}. Please try again.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Chat history reset. How can I help you optimize **${project?.name || 'this project'}**?`,
        time: 'Just now',
        model: 'NexusFlow Engine',
      },
    ]);
  };

  // Helper to highlight Task IDs (e.g. NX-105, MOB-101) as interactive chips
  const renderFormattedContent = (content) => {
    const parts = content.split(/(\b[A-Za-z0-9]+-\d+\b)/g);

    return parts.map((part, index) => {
      if (/^[A-Za-z0-9]+-\d+$/.test(part)) {
        return (
          <button
            key={index}
            onClick={() => {
              setSelectedTaskId(part);
              setCurrentView('board');
            }}
            className="inline-flex items-center gap-1 font-mono font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-1.5 py-0.2 rounded mx-0.5 text-[11px] transition-colors"
            title={`Inspect task ${part}`}
          >
            {part}
          </button>
        );
      }
      return part;
    });
  };

  return (
    <div className="fixed bottom-5 right-5 z-40 select-none">
      {/* Floating Toggle Button (When Closed) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-700 shadow-2xl transition-all hover:scale-105 active:scale-95 group"
        >
          <div className="relative flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-emerald-400 group-hover:rotate-12 transition-transform" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <span className="text-xs font-bold font-sans tracking-tight">AI Advisor</span>
        </button>
      )}

      {/* Floating Chat Modal (When Open) */}
      {isOpen && (
        <div className="w-[380px] sm:w-[420px] h-[560px] rounded-3xl bg-panel-card border border-panel-border shadow-2xl glass-modal flex flex-col overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="p-3.5 border-b border-panel-border bg-panel flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white shrink-0">
                <Sparkles className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold text-white font-sans">NexusFlow AI</h3>
                  <span className="flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live Telemetry
                  </span>
                </div>
                <span className="text-[10px] text-zinc-400 truncate max-w-[180px] block">
                  {project?.name || 'Active Project'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-zinc-400">
              <button
                onClick={handleClearChat}
                className="p-1.5 rounded-lg hover:text-white hover:bg-zinc-800 transition-colors"
                title="Clear Conversation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:text-white hover:bg-zinc-800 transition-colors"
                title="Minimize Chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs">
            {messages.map((m) => {
              const isUser = m.role === 'user';

              return (
                <div
                  key={m.id}
                  className={`flex gap-2.5 items-start ${isUser ? 'flex-row-reverse' : ''}`}
                >
                  {/* Avatar */}
                  <div className="shrink-0 mt-0.5">
                    {isUser ? (
                      currentUser?.avatar ? (
                        <img
                          src={currentUser.avatar}
                          alt={currentUser.name}
                          className="w-6 h-6 rounded-full object-cover ring-1 ring-zinc-700"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-zinc-800 text-zinc-200 text-[10px] font-bold flex items-center justify-center">
                          {currentUser?.initials || 'U'}
                        </div>
                      )
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 text-emerald-400 flex items-center justify-center">
                        <Bot className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>

                  {/* Bubble */}
                  <div
                    className={`max-w-[84%] p-3 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                      isUser
                        ? 'bg-zinc-100 text-zinc-950 rounded-tr-sm shadow-md font-semibold'
                        : 'bg-panel border border-panel-border text-zinc-200 rounded-tl-sm shadow-sm'
                    }`}
                  >
                    <div>{renderFormattedContent(m.content)}</div>
                    <div
                      className={`text-[9px] mt-1.5 flex items-center justify-between font-mono ${
                        isUser ? 'text-zinc-600' : 'text-zinc-500'
                      }`}
                    >
                      <span>{m.time}</span>
                      {m.model && <span className="text-emerald-400 font-medium">{m.model}</span>}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {loading && (
              <div className="flex gap-2.5 items-start">
                <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 text-emerald-400 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="p-3 rounded-2xl rounded-tl-sm bg-panel border border-panel-border text-zinc-400 flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.4s]" />
                  </div>
                  <span className="text-[11px] text-zinc-400">Analyzing DAG telemetry...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions Chips */}
          <div className="px-3 py-2 border-t border-panel-border bg-panel/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {SUGGESTIONS.map((s, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(s.replace(/^[^\w]+/, ''))}
                className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 transition-all shrink-0 whitespace-nowrap"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 border-t border-panel-border bg-panel flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask about bottlenecks, CPM, or blockers..."
              className="flex-1 bg-panel-card border border-panel-border rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-zinc-500 outline-none transition-all"
            />
            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="p-2 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-bold disabled:opacity-40 transition-all active:scale-95 shadow-sm shrink-0"
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
