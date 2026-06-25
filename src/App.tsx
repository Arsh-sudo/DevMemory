import { useState } from 'react';
import { Database, GitBranch, MessageSquare, Network } from 'lucide-react';
import { ConnectView } from './views/ConnectView';
import { ChatView } from './views/ChatView';
import { GraphView } from './views/GraphView';

export type View = 'connect' | 'chat' | 'graph';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('connect');
  const [repoName, setRepoName] = useState<string | null>(null);

  return (
    <div className="flex h-screen w-full bg-white text-slate-900 font-sans antialiased overflow-hidden selection:bg-indigo-200">
      
      {/* Sidebar */}
      <aside className="w-64 border-r-2 border-slate-900 bg-white flex flex-col z-10">
        <div className="h-16 flex items-center px-6 border-b-2 border-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-none bg-slate-100 border-2 border-slate-900 flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
              <Network className="w-4 h-4 text-slate-900" />
            </div>
            <span className="font-black text-xl tracking-tighter uppercase text-slate-900">DevMemory</span>
          </div>
        </div>

        <div className="p-6 flex-1">
          <div className="text-[10px] font-bold text-slate-400 mb-4 px-2 uppercase tracking-widest">Workspace</div>
          <nav className="space-y-2">
            <NavItem 
              icon={<Database className="w-4 h-4" />} 
              label="Ingestion Engine" 
              active={currentView === 'connect'} 
              onClick={() => setCurrentView('connect')} 
            />
            <NavItem 
              icon={<MessageSquare className="w-4 h-4" />} 
              label="Memory Chat" 
              active={currentView === 'chat'} 
              onClick={() => setCurrentView('chat')} 
            />
            <NavItem 
              icon={<GitBranch className="w-4 h-4" />} 
              label="Knowledge Graph" 
              active={currentView === 'graph'} 
              onClick={() => setCurrentView('graph')} 
            />
          </nav>
        </div>

        <div className="p-4 border-t-2 border-slate-900 bg-yellow-50">
          <div className="px-3 py-3 bg-white border-2 border-slate-900 flex items-center gap-3 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
            <div className={`w-3 h-3 rounded-none border-2 border-slate-900 ${repoName ? 'bg-emerald-400' : 'bg-slate-200'}`} />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-900 font-bold uppercase tracking-widest leading-tight">Memory Engine</span>
              <span className="text-[10px] text-slate-500 font-bold truncate">{repoName || 'Disconnected'}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50 relative">
        {currentView === 'connect' && <ConnectView onConnect={(name) => setRepoName(name)} onNavigate={setCurrentView} />}
        {currentView === 'chat' && <ChatView repoName={repoName} />}
        {currentView === 'graph' && <GraphView />}
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-3 rounded-none text-xs font-bold uppercase tracking-widest transition-all
        ${active 
          ? 'bg-indigo-100 text-indigo-900 border-2 border-indigo-900 shadow-[2px_2px_0px_0px_rgba(49,46,129,1)]' 
          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 border-2 border-transparent'
        }`}
    >
      {icon}
      {label}
    </button>
  );
}
