import { useState } from 'react';
import { Database, GitBranch, Github, Play, Loader2, ArrowRight, MessageSquare, Network } from 'lucide-react';

interface ConnectViewProps {
  onConnect: (repoName: string) => void;
  onNavigate: (view: 'chat' | 'graph') => void;
}

export function ConnectView({ onConnect, onNavigate }: ConnectViewProps) {
  const [repoUrl, setRepoUrl] = useState('https://github.com/facebook/react');
  const [token, setToken] = useState('ghp_************************************');
  const [ingesting, setIngesting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [datasetId, setDatasetId] = useState<string | null>(null);
  const [stats, setStats] = useState({ commits: 0, prs: 0, docs: 0 });

  const handleIngest = async () => {
    setIngesting(true);
    setProgress(0);
    setStats({ commits: 0, prs: 0, docs: 0 });

    try {
      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo_url: repoUrl, github_token: token })
      });
      const data = await res.json();
      setDatasetId(data.dataset);
      onConnect(data.repoName);

      // Poll for status
      const interval = setInterval(async () => {
        const statRes = await fetch(`/api/status/${data.dataset}`);
        const statData = await statRes.json();
        
        setProgress(statData.progress);
        setStats(statData.datasets);

        if (statData.status === 'completed') {
          clearInterval(interval);
          setIngesting(false);
        }
      }, 1000);
    } catch (e) {
      console.error(e);
      setIngesting(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
      <div className="w-full max-w-2xl space-y-8">
        
        <div className="text-center">
          <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-[10px] font-bold uppercase tracking-widest rounded-full border-2 border-indigo-200">System Setup</span>
          <h1 className="text-5xl font-black mt-6 leading-none tracking-tighter">Initialize<br/>Memory Node</h1>
          <p className="mt-4 text-slate-500 max-w-sm mx-auto font-medium">
            Connect a GitHub repository to build a semantic knowledge graph.
          </p>
        </div>

        <div className="bg-white border-2 border-slate-900 p-8 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Repository URL</label>
              <div className="relative">
                <Github className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-900" />
                <input 
                  type="text" 
                  value={repoUrl}
                  onChange={e => setRepoUrl(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-900 rounded-none py-3 pl-12 pr-4 text-sm font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-0 focus:border-indigo-600 transition-all shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] focus:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] focus:translate-x-[2px] focus:translate-y-[2px]"
                  placeholder="https://github.com/org/repo"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Access Token</label>
              <input 
                type="password" 
                value={token}
                onChange={e => setToken(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-900 rounded-none py-3 px-4 text-sm font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-0 focus:border-indigo-600 transition-all font-mono shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] focus:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] focus:translate-x-[2px] focus:translate-y-[2px]"
                placeholder="ghp_..."
              />
            </div>

            {!ingesting && progress === 0 && (
              <button 
                onClick={handleIngest}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-none border-2 border-slate-900 py-4 px-4 text-xs font-bold uppercase tracking-widest transition-all shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px] flex items-center justify-center gap-2 mt-4"
              >
                <Play className="w-4 h-4" />
                Start Ingestion
              </button>
            )}

            {(ingesting || progress > 0) && (
              <div className="pt-6 border-t-2 border-slate-200 space-y-6 mt-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-900 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2">
                    {ingesting ? <Loader2 className="w-4 h-4 animate-spin text-indigo-600" /> : <div className="w-4 h-4 bg-emerald-100 border-2 border-emerald-500 flex items-center justify-center"><div className="w-2 h-2 bg-emerald-500" /></div>}
                    {ingesting ? 'Constructing Knowledge Graph...' : 'Ingestion Complete'}
                  </span>
                  <span className="font-black text-xl italic">{progress}%</span>
                </div>
                
                <div className="h-4 bg-slate-100 border-2 border-slate-900 overflow-hidden rounded-none p-0.5">
                  <div 
                    className="h-full bg-slate-900 transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  >
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-2">
                  <StatCard label="Commits" value={stats.commits} />
                  <StatCard label="Pull Requests" value={stats.prs} />
                  <StatCard label="Documents" value={stats.docs} />
                </div>

                {!ingesting && progress === 100 && (
                  <div className="pt-4 flex gap-4">
                    <button onClick={() => onNavigate('chat')} className="flex-1 bg-white hover:bg-slate-50 text-slate-900 border-2 border-slate-900 rounded-none py-3 px-4 text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:translate-x-[2px] hover:translate-y-[2px]">
                      <MessageSquare className="w-4 h-4" /> Query
                    </button>
                    <button onClick={() => onNavigate('graph')} className="flex-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-900 border-2 border-indigo-900 rounded-none py-3 px-4 text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_rgba(49,46,129,1)] hover:shadow-[2px_2px_0px_0px_rgba(49,46,129,1)] hover:translate-x-[2px] hover:translate-y-[2px]">
                      <Network className="w-4 h-4" /> Graph <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string, value: number }) {
  return (
    <div className="bg-yellow-50 border-2 border-slate-900 p-4 text-center shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
      <div className="text-3xl font-black">{value}</div>
      <div className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mt-2">{label}</div>
    </div>
  );
}
