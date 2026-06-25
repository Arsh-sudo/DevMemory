import { useEffect, useRef, useState } from 'react';
import ForceGraph2D, { ForceGraphMethods } from 'react-force-graph-2d';
import { TerminalSquare, RefreshCw } from 'lucide-react';

interface GraphData {
  nodes: { id: string; group: number; label: string; val: number }[];
  links: { source: string; target: string; label?: string }[];
}

export function GraphView() {
  const [data, setData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<ForceGraphMethods>(null!);

  useEffect(() => {
    fetch('/api/graph')
      .then(r => r.json())
      .then(d => {
        setData(d.nodes && d.nodes.length > 0 ? d : null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    const observeTarget = containerRef.current;
    if (!observeTarget) return;

    const observer = new ResizeObserver((entries) => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect;
        setDimensions({ width, height });
      }
    });

    observer.observe(observeTarget);
    return () => observer.unobserve(observeTarget);
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 p-8">
        <div className="bg-white border-2 border-slate-900 p-8 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] text-center max-w-sm w-full">
          <div className="w-12 h-12 border-2 border-slate-900 bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <TerminalSquare className="w-6 h-6 text-slate-900" />
          </div>
          <p className="text-sm font-bold text-slate-900 uppercase tracking-widest">No graph data</p>
          <p className="text-xs text-slate-500 mt-2 font-medium">Please initialize memory node first.</p>
        </div>
      </div>
    );
  }

  const getNodeColor = (group: number) => {
    switch (group) {
      case 1: return '#6366f1'; // Repo
      case 2: return '#10b981'; // Module
      case 3: return '#f43f5e'; // User
      case 4: return '#eab308'; // PR
      case 5: return '#3b82f6'; // Commit
      default: return '#94a3b8';
    }
  };

  return (
    <div className="flex-1 relative bg-slate-50 flex flex-col p-8">
      
      {/* Overlay Legend */}
      <div className="absolute top-12 left-12 z-10 bg-white border-2 border-slate-900 p-4 text-xs font-bold text-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] pointer-events-none">
        <div className="font-black mb-3 text-slate-900 uppercase tracking-widest text-[10px] border-b-2 border-slate-200 pb-2">Graph Legend</div>
        <div className="space-y-2">
          <LegendItem color="#6366f1" label="Repository" />
          <LegendItem color="#10b981" label="Module/Service" />
          <LegendItem color="#f43f5e" label="Developer" />
          <LegendItem color="#eab308" label="Pull Request" />
          <LegendItem color="#3b82f6" label="Commit" />
        </div>
      </div>

      <div ref={containerRef} className="flex-1 overflow-hidden border-2 border-slate-900 bg-white shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] relative">
        <ForceGraph2D
          ref={graphRef as any}
          width={dimensions.width}
          height={dimensions.height}
          graphData={data}
          nodeLabel="label"
          nodeColor={(node: any) => getNodeColor(node.group)}
          nodeRelSize={4}
          linkColor={() => '#cbd5e1'}
          linkWidth={2}
          linkDirectionalArrowLength={3.5}
          linkDirectionalArrowRelPos={1}
          onNodeClick={(node: any) => {
            // center on node
            graphRef.current?.centerAt(node.x, node.y, 1000);
            graphRef.current?.zoom(4, 2000);
          }}
          nodeCanvasObject={(node: any, ctx, globalScale) => {
            const label = node.label;
            const fontSize = 12 / globalScale;
            ctx.font = `${fontSize}px Inter, sans-serif`;
            const textWidth = ctx.measureText(label).width;
            const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2);

            ctx.fillStyle = 'white';
            ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2 + 12, bckgDimensions[0], bckgDimensions[1]);
            ctx.lineWidth = 1 / globalScale;
            ctx.strokeStyle = '#0f172a';
            ctx.strokeRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2 + 12, bckgDimensions[0], bckgDimensions[1]);

            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#0f172a';
            ctx.fillText(label, node.x, node.y + 12);

            // Draw Node Circle
            ctx.beginPath();
            ctx.arc(node.x, node.y, node.val ? Math.sqrt(node.val) : 4, 0, 2 * Math.PI, false);
            ctx.fillStyle = getNodeColor(node.group);
            ctx.fill();
            
            // Highlight ring
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 2 / globalScale;
            ctx.stroke();
          }}
        />
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string, label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-2.5 h-2.5 rounded-none border border-slate-900" style={{ backgroundColor: color }} />
      <span>{label}</span>
    </div>
  );
}
