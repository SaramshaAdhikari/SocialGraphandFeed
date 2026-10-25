import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';

interface GraphData {
  center: { id: string; display_name: string; avatar_url: string };
  nodes: Array<{ id: string; display_name: string; avatar_url: string }>;
  edges: Array<{ source: string; target: string }>;
}

export function GraphPage() {
  const { user } = useAuth();
  const [graph, setGraph] = useState<GraphData | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    fetch('/api/v1/graph/neighborhood?limit=24', { credentials: 'include' })
      .then(async (response) => {
        if (!response.ok) throw new Error('Could not load the social graph.');
        return response.json() as Promise<GraphData>;
      })
      .then(setGraph)
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Could not load the social graph.'));
  }, []);
  if (error) return <div role="alert" className="rounded-xl bg-white p-6 text-red-600">{error}</div>;
  if (!graph) return <div className="rounded-xl bg-white p-6 text-slate-500">Loading relationship neighborhood…</div>;
  const radius = Math.max(90, Math.min(180, graph.nodes.length * 8));
  const center = { x: 300, y: 230 };
  const positions = new Map(graph.nodes.map((node, index) => {
    if (node.id === graph.center.id) return [node.id, center] as const;
    const angle = (index / Math.max(1, graph.nodes.length - 1)) * Math.PI * 2;
    return [node.id, { x: center.x + Math.cos(angle) * radius, y: center.y + Math.sin(angle) * radius }] as const;
  }));
  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Your social graph</h1>
        <p className="text-sm text-slate-500">A bounded neighborhood read from MongoDB follow edges.</p>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-[#181B22]">
        <svg viewBox="0 0 600 460" className="h-[460px] w-full" role="img" aria-label="Social graph neighborhood">
          {graph.edges.map((edge) => {
            const source = positions.get(edge.source);
            const target = positions.get(edge.target);
            return source && target ? <line key={`${edge.source}-${edge.target}`} x1={source.x} y1={source.y} x2={target.x} y2={target.y} stroke="#c7d2fe" strokeWidth="2" /> : null;
          })}
          {graph.nodes.map((node) => {
            const point = positions.get(node.id)!;
            const isCenter = node.id === graph.center.id;
            return (
              <g key={node.id}>
                <circle cx={point.x} cy={point.y} r={isCenter ? 28 : 20} fill={isCenter ? '#4f46e5' : '#e0e7ff'} stroke={isCenter ? '#312e81' : '#818cf8'} strokeWidth="2" />
                <text x={point.x} y={point.y + (isCenter ? 48 : 38)} textAnchor="middle" fontSize="12" fill="currentColor">{node.display_name}</text>
              </g>
            );
          })}
        </svg>
      </div>
      <p className="text-xs text-slate-500">Signed in as {user?.display_name}. Following or unfollowing changes the persisted edges and refreshes this bounded view.</p>
    </section>
  );
}
