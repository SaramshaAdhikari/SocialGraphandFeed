import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { api } from '../api';
import type { GraphNeighborhoodData, GraphNode } from '../api/types';
import { useRouter } from '../router/Router';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  List,
  Network,
  UserCheck,
  UserPlus,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  Compass,
} from 'lucide-react';
import { Button } from '../components/ui';

interface NodePosition {
  x: number;
  y: number;
  node: GraphNode;
  isCenter: boolean;
}

export function GraphPage() {
  const { navigate } = useRouter();
  const [graph, setGraph] = useState<GraphNeighborhoodData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'visual' | 'table'>('visual');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [followActionBusy, setFollowActionBusy] = useState(false);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});

  // Canvas Pan & Zoom State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement | null>(null);

  const fetchGraph = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getGraphNeighborhood(30);
      setGraph(data);
      if (data.center) {
        setSelectedNodeId(data.center.id);
        const initialFollowing: Record<string, boolean> = {};
        for (const edge of data.edges) {
          if (edge.source === data.center.id) initialFollowing[edge.target] = true;
        }
        setFollowingMap(initialFollowing);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the social graph.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGraph();
  }, [fetchGraph]);

  // Determine mutual relationships from edges
  const relationshipMap = useMemo(() => {
    if (!graph) return { mutual: new Set<string>(), outgoing: new Set<string>(), incoming: new Set<string>() };
    const centerId = graph.center.id;
    const outgoing = new Set<string>(); // center -> target (you follow them)
    const incoming = new Set<string>(); // source -> center (they follow you)

    for (const edge of graph.edges) {
      if (edge.source === centerId) outgoing.add(edge.target);
      if (edge.target === centerId) incoming.add(edge.source);
    }

    const mutual = new Set<string>();
    for (const id of outgoing) {
      if (incoming.has(id)) mutual.add(id);
    }

    return { mutual, outgoing, incoming };
  }, [graph]);

  // Compute Layout Positions (Force-directed radial shell with collision repulsion)
  const layout = useMemo(() => {
    if (!graph || graph.nodes.length === 0) return { positions: new Map<string, NodePosition>(), width: 900, height: 600 };

    const width = 900;
    const height = 600;
    const centerX = width / 2;
    const centerY = height / 2;

    const positions = new Map<string, NodePosition>();
    const otherNodes = graph.nodes.filter((n) => n.id !== graph.center.id);

    // Center node position
    positions.set(graph.center.id, {
      x: centerX,
      y: centerY,
      node: graph.center,
      isCenter: true,
    });

    if (otherNodes.length === 0) {
      return { positions, width, height };
    }

    // Two-tier concentric ring arrangement for balanced density
    const count = otherNodes.length;
    const ring1Count = Math.min(count, 10);
    const ring2Count = Math.max(0, count - ring1Count);

    const radius1 = Math.max(140, Math.min(200, 40 + ring1Count * 14));
    const radius2 = radius1 + 120;

    for (let i = 0; i < ring1Count; i++) {
      const node = otherNodes[i];
      const angle = (i / ring1Count) * Math.PI * 2 - Math.PI / 2;
      positions.set(node.id, {
        x: centerX + Math.cos(angle) * radius1,
        y: centerY + Math.sin(angle) * radius1,
        node,
        isCenter: false,
      });
    }

    for (let i = 0; i < ring2Count; i++) {
      const node = otherNodes[ring1Count + i];
      const angle = ((i + 0.5) / ring2Count) * Math.PI * 2 - Math.PI / 2;
      positions.set(node.id, {
        x: centerX + Math.cos(angle) * radius2,
        y: centerY + Math.sin(angle) * radius2,
        node,
        isCenter: false,
      });
    }

    return { positions, width, height };
  }, [graph]);

  // Pan & Zoom Handlers
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 1.15 : 0.85;
    setZoom((prev) => Math.max(0.4, Math.min(3.0, prev * delta)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Primary click only
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const resetZoomAndPan = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const toggleFollowUser = async (targetUserId: string) => {
    const isCurrentlyFollowing = followingMap[targetUserId] ?? false;
    setFollowActionBusy(true);

    // Optimistic update
    setFollowingMap((prev) => ({ ...prev, [targetUserId]: !isCurrentlyFollowing }));

    try {
      await api.toggleFollow(targetUserId, !isCurrentlyFollowing);
    } catch {
      // Rollback on failure
      setFollowingMap((prev) => ({ ...prev, [targetUserId]: isCurrentlyFollowing }));
    } finally {
      setFollowActionBusy(false);
    }
  };

  const selectedNode = useMemo(() => {
    if (!graph || !selectedNodeId) return null;
    if (graph.center.id === selectedNodeId) return graph.center;
    return graph.nodes.find((n) => n.id === selectedNodeId) || null;
  }, [graph, selectedNodeId]);

  if (loading) {
    return (
      <main className="space-y-6" aria-busy="true">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Social Graph</h1>
            <p className="text-sm text-text-muted">Loading your relationship neighborhood…</p>
          </div>
        </header>
        <div
          data-testid="graph-loading"
          className="h-[520px] w-full animate-pulse rounded-2xl border border-border bg-surface-card/60 flex items-center justify-center flex-col gap-3"
        >
          <RefreshCw className="animate-spin text-primary" size={28} />
          <span className="text-sm font-medium text-text-muted">Resolving MongoDB relationship edges…</span>
        </div>
      </main>
    );
  }

  if (error || !graph) {
    return (
      <main className="space-y-6">
        <header>
          <h1 className="text-2xl font-bold text-text-primary">Social Graph</h1>
          <p className="text-sm text-text-muted">Explore network relationships and follower graphs.</p>
        </header>
        <div
          role="alert"
          className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-600 dark:text-rose-400 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <AlertCircle size={22} className="shrink-0" />
            <p className="text-sm font-medium">{error || 'Could not load graph data.'}</p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchGraph} className="shrink-0">
            <RefreshCw size={14} className="mr-2" /> Retry Connection
          </Button>
        </div>
      </main>
    );
  }

  const { positions } = layout;

  return (
    <main className="space-y-6" data-testid="social-graph-view">
      {/* Header & Controls Bar */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <Network className="text-primary" size={26} />
            Social Graph
          </h1>
          <p className="text-sm text-text-muted">
            Bounded relationship neighborhood for{' '}
            <strong className="text-text-primary">@{graph.center.username}</strong> ({graph.nodes.length} connections,{' '}
            {graph.edges.length} edges).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-xl border border-border bg-surface-card p-1 shadow-xs" role="tablist">
            <button
              role="tab"
              aria-selected={viewMode === 'visual'}
              onClick={() => setViewMode('visual')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                viewMode === 'visual'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <Network size={14} /> Interactive Graph
            </button>
            <button
              role="tab"
              aria-selected={viewMode === 'table'}
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                viewMode === 'table'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <List size={14} /> Connections Table
            </button>
          </div>

          <Button variant="ghost" size="sm" onClick={fetchGraph} title="Refresh graph data">
            <RefreshCw size={14} />
          </Button>
        </div>
      </header>

      {/* Visual Canvas Mode */}
      {viewMode === 'visual' ? (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
          {/* Main SVG Graph Container */}
          <div className="relative overflow-hidden rounded-2xl border border-border bg-surface-card shadow-sm">
            {/* Top Canvas Controls (Zoom / Pan / Fit) */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 rounded-xl border border-border bg-surface-card/90 p-1.5 backdrop-blur-md shadow-sm">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(3.0, z * 1.2))}
                className="p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-elevated rounded-lg transition-colors"
                title="Zoom In (+)"
                aria-label="Zoom In"
              >
                <ZoomIn size={16} />
              </button>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.4, z / 1.2))}
                className="p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-elevated rounded-lg transition-colors"
                title="Zoom Out (-)"
                aria-label="Zoom Out"
              >
                <ZoomOut size={16} />
              </button>
              <div className="h-4 w-px bg-border my-auto" />
              <button
                type="button"
                onClick={resetZoomAndPan}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-text-muted hover:text-text-primary hover:bg-surface-elevated rounded-lg transition-colors"
                title="Reset View (100%)"
              >
                <Maximize2 size={13} /> Fit
              </button>
              <span className="text-[11px] font-mono text-text-muted pl-1">
                {Math.round(zoom * 100)}%
              </span>
            </div>

            {/* Visual Legend */}
            <div className="absolute bottom-4 left-4 z-10 hidden sm:flex items-center gap-3 rounded-xl border border-border bg-surface-card/90 px-3 py-2 text-[11px] font-medium text-text-muted backdrop-blur-md shadow-sm">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-primary" /> Center (You)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Mutual Follow
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-indigo-400" /> Directed Follow
              </span>
            </div>

            {/* Interactive SVG Canvas */}
            <svg
              ref={svgRef}
              data-testid="interactive-social-graph-svg"
              role="img"
              aria-label={`Interactive social network showing ${graph.nodes.length} connections`}
              className={`h-[560px] w-full select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <defs>
                {/* Regular directed arrow */}
                <marker
                  id="directed-arrow"
                  viewBox="0 0 10 10"
                  refX="26"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="currentColor" className="text-border" />
                </marker>
                {/* Highlighted / Mutual arrow */}
                <marker
                  id="mutual-arrow"
                  viewBox="0 0 10 10"
                  refX="26"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="currentColor" className="text-emerald-500" />
                </marker>
              </defs>

              {/* Transform group for Zoom & Pan */}
              <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                {/* 1. Relationship Edges */}
                {graph.edges.map((edge) => {
                  const source = positions.get(edge.source);
                  const target = positions.get(edge.target);
                  if (!source || !target) return null;

                  const isEdgeMutual =
                    relationshipMap.mutual.has(edge.source) &&
                    (edge.target === graph.center.id || edge.source === graph.center.id);
                  const isHighlighted =
                    selectedNodeId === edge.source ||
                    selectedNodeId === edge.target ||
                    hoveredNodeId === edge.source ||
                    hoveredNodeId === edge.target;

                  return (
                    <line
                      key={`edge-${edge.source}-${edge.target}`}
                      x1={source.x}
                      y1={source.y}
                      x2={target.x}
                      y2={target.y}
                      stroke={
                        isHighlighted
                          ? '#6366f1'
                          : isEdgeMutual
                          ? '#10b981'
                          : 'var(--color-border, #e2e8f0)'
                      }
                      strokeWidth={isHighlighted ? 2.5 : isEdgeMutual ? 1.8 : 1.2}
                      strokeDasharray={isEdgeMutual ? 'none' : '4,2'}
                      markerEnd={isEdgeMutual ? 'url(#mutual-arrow)' : 'url(#directed-arrow)'}
                      className="transition-colors duration-200"
                    />
                  );
                })}

                {/* 2. Nodes */}
                {Array.from(positions.values()).map(({ x, y, node, isCenter }) => {
                  const isSelected = selectedNodeId === node.id;
                  const isHovered = hoveredNodeId === node.id;
                  const isMutual = relationshipMap.mutual.has(node.id);
                  const radius = isCenter ? 30 : 22;

                  return (
                    <g
                      key={`node-${node.id}`}
                      transform={`translate(${x}, ${y})`}
                      onClick={() => setSelectedNodeId(node.id)}
                      onMouseEnter={() => setHoveredNodeId(node.id)}
                      onMouseLeave={() => setHoveredNodeId(null)}
                      className="cursor-pointer transition-transform duration-150 hover:scale-105"
                      role="button"
                      tabIndex={0}
                      aria-label={`${node.display_name} (@${node.username})`}
                    >
                      {/* Selection Aura */}
                      {(isSelected || isHovered) && (
                        <circle
                          r={radius + 8}
                          fill="none"
                          stroke={isCenter ? '#4f46e5' : isMutual ? '#10b981' : '#6366f1'}
                          strokeWidth="3"
                          strokeOpacity="0.4"
                          className="animate-pulse"
                        />
                      )}

                      {/* Main Node Circle */}
                      <circle
                        r={radius}
                        fill={isCenter ? '#4f46e5' : isMutual ? '#10b981' : 'var(--color-surface-elevated, #f8fafc)'}
                        stroke={isSelected ? '#312e81' : isCenter ? '#6366f1' : 'var(--color-border, #cbd5e1)'}
                        strokeWidth={isCenter || isSelected ? 3 : 2}
                        className="shadow-sm transition-colors"
                      />

                      {/* Avatar Initials */}
                      <text
                        textAnchor="middle"
                        dy=".35em"
                        fontSize={isCenter ? 14 : 11}
                        fontWeight="bold"
                        fill={isCenter || isMutual ? '#ffffff' : 'var(--color-text-primary, #0f172a)'}
                        className="pointer-events-none select-none"
                      >
                        {node.display_name.charAt(0).toUpperCase()}
                      </text>

                      {/* Name Label with Background for Collision Legibility */}
                      <g transform={`translate(0, ${radius + 16})`}>
                        <rect
                          x={-Math.min(90, node.display_name.length * 4.2)}
                          y={-9}
                          width={Math.min(180, node.display_name.length * 8.4)}
                          height={18}
                          rx={9}
                          fill="var(--color-surface-card, #ffffff)"
                          stroke="var(--color-border, #e2e8f0)"
                          strokeWidth="1"
                          className="opacity-90"
                        />
                        <text
                          textAnchor="middle"
                          dy=".3em"
                          fontSize="11"
                          fontWeight={isSelected ? '700' : '500'}
                          fill="var(--color-text-primary, #0f172a)"
                          className="pointer-events-none select-none"
                        >
                          {node.display_name.length > 18
                            ? `${node.display_name.slice(0, 16)}…`
                            : node.display_name}
                        </text>
                      </g>
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>

          {/* Contextual Inspector Drawer / Sidebar */}
          <aside
            data-testid="graph-inspector-panel"
            aria-label="Selected connection details"
            className="rounded-2xl border border-border bg-surface-card p-5 shadow-sm space-y-4"
          >
            {selectedNode ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                    {selectedNode.id === graph.center.id ? 'Self (Center Node)' : 'Connection Profile'}
                  </span>
                  <button
                    onClick={() => setSelectedNodeId(graph.center.id)}
                    className="text-text-muted hover:text-text-primary p-1 rounded-md"
                    title="Return to Center"
                  >
                    <Compass size={14} />
                  </button>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary font-bold text-lg flex items-center justify-center shrink-0 border border-primary/20">
                    {selectedNode.display_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-base text-text-primary truncate">
                      {selectedNode.display_name}
                    </h3>
                    <p className="text-xs text-text-muted truncate">@{selectedNode.username}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {selectedNode.id === graph.center.id ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary">
                          Primary User
                        </span>
                      ) : relationshipMap.mutual.has(selectedNode.id) ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          Mutual Connection
                        </span>
                      ) : followingMap[selectedNode.id] ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                          You Follow
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-surface-elevated text-text-muted">
                          Follows You
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {selectedNode.bio && (
                  <p className="text-xs text-text-secondary leading-relaxed bg-surface-elevated/40 p-3 rounded-xl border border-border/50">
                    {selectedNode.bio}
                  </p>
                )}

                {/* Network Statistics */}
                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-xl bg-surface-elevated/50 border border-border/50">
                    <div className="font-bold text-text-primary text-sm">
                      {selectedNode.followers_count ?? '—'}
                    </div>
                    <div className="text-[10px] text-text-muted">Followers</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-surface-elevated/50 border border-border/50">
                    <div className="font-bold text-text-primary text-sm">
                      {selectedNode.following_count ?? '—'}
                    </div>
                    <div className="text-[10px] text-text-muted">Following</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-2">
                  {selectedNode.id !== graph.center.id && (
                    <Button
                      variant={followingMap[selectedNode.id] ? 'outline' : 'primary'}
                      size="sm"
                      className="w-full justify-center"
                      disabled={followActionBusy}
                      onClick={() => toggleFollowUser(selectedNode.id)}
                    >
                      {followingMap[selectedNode.id] ? (
                        <>
                          <UserCheck size={14} className="mr-1.5" /> Following
                        </>
                      ) : (
                        <>
                          <UserPlus size={14} className="mr-1.5" /> Follow Back
                        </>
                      )}
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-center text-xs"
                    onClick={() => navigate(`/u/${selectedNode.username}`)}
                  >
                    <ExternalLink size={13} className="mr-1.5" /> View Full Profile
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-sm text-text-muted">
                <HelpCircle size={24} className="mx-auto mb-2 opacity-60" />
                Click any node on the graph to inspect relationship details.
              </div>
            )}
          </aside>
        </div>
      ) : (
        /* Accessible Table Mode for Screen Readers & Tabular Navigation */
        <div className="overflow-hidden rounded-2xl border border-border bg-surface-card shadow-sm">
          <div className="p-4 border-b border-border bg-surface-elevated/30">
            <h2 className="text-sm font-semibold text-text-primary">
              All Graph Connections ({graph.nodes.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm" aria-label="Social connections directory">
              <thead>
                <tr className="border-b border-border bg-surface-elevated/50 text-xs font-semibold text-text-muted">
                  <th scope="col" className="py-3 px-4">User</th>
                  <th scope="col" className="py-3 px-4">Relationship</th>
                  <th scope="col" className="py-3 px-4">Followers</th>
                  <th scope="col" className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {graph.nodes.map((node) => {
                  const isCenter = node.id === graph.center.id;
                  const isMutual = relationshipMap.mutual.has(node.id);
                  const isFollowing = followingMap[node.id];

                  return (
                    <tr key={node.id} className="hover:bg-surface-elevated/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                            {node.display_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-text-primary">{node.display_name}</div>
                            <div className="text-xs text-text-muted">@{node.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {isCenter ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            Center (You)
                          </span>
                        ) : isMutual ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            Mutual Follow
                          </span>
                        ) : isFollowing ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                            Following
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-surface-elevated text-text-muted">
                            Follows You
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-text-muted text-xs">
                        {node.followers_count ?? '—'}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        {!isCenter && (
                          <Button
                            variant={isFollowing ? 'outline' : 'primary'}
                            size="sm"
                            disabled={followActionBusy}
                            onClick={() => toggleFollowUser(node.id)}
                            className="text-xs"
                          >
                            {isFollowing ? 'Following' : 'Follow'}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/u/${node.username}`)}
                          className="text-xs"
                        >
                          Profile
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}
export default GraphPage;
