import { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, ThumbsUp, ThumbsDown, GitCommit, FileCode, Search, TerminalSquare } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
  feedback?: 'up' | 'down';
}

export function ChatView({ repoName }: { repoName: string | null }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "I am DevMemory. I have mapped your codebase. What would you like to know?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !repoName) return;
    
    const query = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: query }]);
    setLoading(true);

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: query, repo: repoName, session_id: 'session_123' })
      });
      const data = await res.json();
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: data.answer,
        sources: data.sources
      }]);
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'assistant', content: "Error communicating with memory node." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (index: number, type: 'up' | 'down') => {
    setMessages(prev => {
      const next = [...prev];
      next[index].feedback = type;
      return next;
    });
    
    // Fire and forget feedback
    fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: messages[index-1]?.content, helpful: type === 'up', dataset: `repo_${repoName}` })
    });
  };

  if (!repoName) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 p-8">
        <div className="bg-white border-2 border-slate-900 p-8 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] text-center max-w-sm w-full">
          <div className="w-12 h-12 border-2 border-slate-900 bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <TerminalSquare className="w-6 h-6 text-slate-900" />
          </div>
          <p className="text-sm font-bold text-slate-900 uppercase tracking-widest">No Repository</p>
          <p className="text-xs text-slate-500 mt-2 font-medium">Please initialize memory node first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full max-w-5xl mx-auto w-full p-6 md:p-8">
      
      {/* Header */}
      <div className="mb-6 flex items-center justify-between border-b-2 border-slate-900 pb-4">
        <div>
          <h2 className="text-3xl font-black tracking-tighter uppercase">Memory Query</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Active Dataset: {repoName}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-8 pb-8 pr-4 custom-scrollbar">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-10 h-10 rounded-none bg-slate-900 border-2 border-slate-900 flex items-center justify-center shrink-0 mt-1">
                <Bot className="w-5 h-5 text-white" />
              </div>
            )}
            
            <div className={`max-w-[85%] ${msg.role === 'user' ? 'bg-indigo-100 border-2 border-indigo-900 text-indigo-900 p-5 shadow-[4px_4px_0px_0px_rgba(49,46,129,1)]' : 'bg-white border-2 border-slate-900 p-6 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)]'}`}>
              {msg.role === 'assistant' ? (
                <div className="space-y-4">
                  <div className="prose prose-sm prose-slate max-w-none prose-p:leading-relaxed prose-pre:bg-slate-50 prose-pre:border-2 prose-pre:border-slate-900 prose-pre:rounded-none prose-pre:text-slate-900 prose-pre:shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                  
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="pt-4 mt-4 border-t-2 border-slate-100 flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mr-2 flex items-center gap-1">
                        <Search className="w-3 h-3" /> Sources
                      </span>
                      {msg.sources.map((src, j) => (
                        <div key={j} className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 border-2 border-slate-300 px-2 py-1 text-slate-600 flex items-center gap-1.5 hover:border-slate-900 hover:text-slate-900 transition-colors cursor-pointer">
                          {src.includes('Commit') ? <GitCommit className="w-3 h-3 text-emerald-600" /> : <FileCode className="w-3 h-3 text-blue-600" />}
                          {src}
                        </div>
                      ))}
                    </div>
                  )}

                  {msg.role === 'assistant' && i > 0 && !msg.feedback && (
                    <div className="flex items-center gap-2 pt-2">
                      <button onClick={() => handleFeedback(i, 'up')} className="p-2 border-2 border-slate-200 hover:border-slate-900 bg-white text-slate-500 hover:text-emerald-600 transition-colors" title="Helpful - Reinforces knowledge graph">
                        <ThumbsUp className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleFeedback(i, 'down')} className="p-2 border-2 border-slate-200 hover:border-slate-900 bg-white text-slate-500 hover:text-rose-600 transition-colors" title="Not helpful - Logs for graph pruning">
                        <ThumbsDown className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  {msg.feedback && (
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2 border-l-2 border-slate-300 pl-2">
                      {msg.feedback === 'up' ? 'Graph reinforced.' : 'Logged for pruning.'}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm font-medium leading-relaxed">{msg.content}</div>
              )}
            </div>
            
            {msg.role === 'user' && (
              <div className="w-10 h-10 rounded-none bg-slate-100 flex items-center justify-center shrink-0 mt-1 border-2 border-slate-900">
                <User className="w-5 h-5 text-slate-900" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-none bg-slate-900 border-2 border-slate-900 flex items-center justify-center shrink-0 mt-1">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div className="bg-white border-2 border-slate-900 p-4 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex items-center gap-2">
              <div className="w-2 h-2 bg-slate-900 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-slate-900 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-slate-900 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="pt-4">
        <div className="relative bg-white border-2 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] focus-within:shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] focus-within:translate-x-[4px] focus-within:translate-y-[4px] transition-all flex items-end">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask about PRs, architecture, recent changes..."
            className="flex-1 max-h-48 min-h-[64px] bg-transparent border-none focus:ring-0 text-sm font-medium text-slate-900 placeholder-slate-400 py-4 pl-4 pr-16 resize-none custom-scrollbar outline-none"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="absolute bottom-3 right-3 p-3 bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 transition-colors border-2 border-slate-900"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="text-right mt-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Powered by Cognee Hybrid Graph-Vector Memory
        </div>
      </div>
    </div>
  );
}
