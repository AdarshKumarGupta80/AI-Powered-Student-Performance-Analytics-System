import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8080';

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hi! I'm your StudentAI assistant. Ask me anything about using this app — like where to find predictions, how to add students, or what risk levels mean." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const { data } = await axios.post(
        `${API_BASE}/api/chat`,
        { message: userMsg },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(prev => [...prev, { role: 'assistant', text: data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 transition-all"
        aria-label="Open chat assistant"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>


      {open && (
        <div className="fixed bottom-24 right-6 z-50 flex w-80 flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950 overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-slate-200 bg-indigo-600 px-4 py-3 dark:border-slate-800">
            <Bot className="h-5 w-5 text-white" />
            <div>
              <p className="text-sm font-semibold text-white">StudentAI Assistant</p>
              <p className="text-xs text-indigo-200">Ask me anything about the app</p>
            </div>
          </div>

    
          <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-80">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900">
                    <Bot className="h-4 w-4 text-indigo-600 dark:text-indigo-300" />
                  </div>
                )}
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-sm'
                    : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 rounded-bl-sm'
                }`}>
                  {msg.text}
                </div>
                {msg.role === 'user' && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700">
                    <User className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100">
                  <Bot className="h-4 w-4 text-indigo-600" />
                </div>
                <div className="rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-3 dark:bg-slate-800">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0ms]" />
                    <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce [animation-delay:150ms]" />
                    <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

    
          <div className="border-t border-slate-200 p-3 dark:border-slate-800 flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Ask about the app..."
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 transition"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}