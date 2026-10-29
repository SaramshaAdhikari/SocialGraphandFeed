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
  Crosshair,
} from 'lucide-react';
import { Button } from '../components/ui';
import { Avatar } from '../components/ui/Avatar';

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
  const [avatarErrors, setAvatarErrors] = useState<Record<string, boolean>>({});

  // Canvas Dimensions
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 1000, height: 680 });

  // Canvas Pan & Zoom State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const zoomRef = useRef<number>(1);
  zoomRef.current = zoom;

  // Node-level Synchronized Dragging State
  const [nodeCoords, setNodeCoords] = useState<Record<string, { x: number; y: number }>>({});
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const currentCoordsRef = useRef<Record<string, { x: number; y: number }>>({});
  const draggedNodeIdRef = useRef<string | null>(null);
  draggedNodeIdRef.current = draggedNodeId;

  const nodeDragStartRef = useRef<{
    clientX: number;
    clientY: number;
    startX: number;
    startY: number;
  }>({
    clientX: 0,
    clientY: 0,
    startX: 0,
    startY: 0,
  });
  const hasMovedRef = useRef<boolean>(false);
  const rafIdRef = useRef<number | null>(null);

  // Resize observer to dynamically match parent container
  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        if (clientWidth > 0 && clientHeight > 0) {
          setCanvasSize({
            width: clientWidth,
            height: Math.max(540, clientHeight),
          });
        }
      }
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [viewMode]);

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

  // Compute Layout Positions (Balanced multi-tier concentric solar system distribution)
  const layout = useMemo(() => {
    if (!graph || graph.nodes.length === 0) {
      return { positions: new Map<string, NodePosition>(), width: canvasSize.width, height: canvasSize.height };
    }

    const { width, height } = canvasSize;
    const centerX = width / 2;
    const centerY = height / 2;

    const positions = new Map<string, NodePosition>();
    const otherNodes = graph.nodes.filter((n) => n.id !== graph.center.id);

    // Center node position (Pinned at the heart of the canvas)
    positions.set(graph.center.id, {
      x: centerX,
      y: centerY,
      node: graph.center,
      isCenter: true,
    });

    if (otherNodes.length === 0) {
      return { positions, width, height };
    }

    // Partition nodes into tiers based on relationship semantics
    const mutualNodes: GraphNode[] = [];
    const directFollowNodes: GraphNode[] = [];
    const otherConnections: GraphNode[] = [];

    for (const n of otherNodes) {
      if (relationshipMap.mutual.has(n.id)) {
        mutualNodes.push(n);
      } else if (relationshipMap.outgoing.has(n.id)) {
        directFollowNodes.push(n);
      } else {
        otherConnections.push(n);
      }
    }

    // Ring 1 (Inner Orbit): Mutual Connections (up to 8 nodes, highest proximity)
    const ring1Nodes = mutualNodes.slice(0, 8);
    const overflowFromR1 = mutualNodes.slice(8);

    // Ring 2 (Middle Orbit): Followed creators + R1 overflow
    const ring2Pool = [...overflowFromR1, ...directFollowNodes];
    const ring2Nodes = ring2Pool.slice(0, 12);
    const overflowFromR2 = ring2Pool.slice(12);

    // Ring 3 (Outer Orbit): Extended network + remaining
    const ring3Nodes = [...overflowFromR2, ...otherConnections];

    // Radial distances calibrated for legibility and label clearance
    const radius1 = 165;
    const radius2 = 295;
    const radius3 = 430;

    // Distribute Ring 1
    const count1 = ring1Nodes.length;
    for (let i = 0; i < count1; i++) {
      const node = ring1Nodes[i];
      const angle = (i / count1) * Math.PI * 2 - Math.PI / 2;
      positions.set(node.id, {
        x: centerX + Math.cos(angle) * radius1,
        y: centerY + Math.sin(angle) * radius1,
        node,
        isCenter: false,
      });
    }

    // Distribute Ring 2 (Staggered by half phase to avoid radial overlap)
    const count2 = ring2Nodes.length;
    for (let i = 0; i < count2; i++) {
      const node = ring2Nodes[i];
      const angle = (i / count2) * Math.PI * 2 - Math.PI / 2 + (count1 > 0 ? Math.PI / count2 : 0);
      positions.set(node.id, {
        x: centerX + Math.cos(angle) * radius2,
        y: centerY + Math.sin(angle) * radius2,
        node,
        isCenter: false,
      });
    }

    // Distribute Ring 3 (Staggered phase)
    const count3 = ring3Nodes.length;
    for (let i = 0; i < count3; i++) {
      const node = ring3Nodes[i];
      const angle = (i / count3) * Math.PI * 2 - Math.PI / 2 + Math.PI / 6;
      positions.set(node.id, {
        x: centerX + Math.cos(angle) * radius3,
        y: centerY + Math.sin(angle) * radius3,
        node,
        isCenter: false,
      });
    }

    return { positions, width, height };
  }, [graph, canvasSize, relationshipMap]);

  // Sync initial layout positions into mutable nodeCoords state and mutable ref
  useEffect(() => {
    if (layout.positions.size > 0) {
      const initial: Record<string, { x: number; y: number }> = {};
      for (const [id, pos] of layout.positions.entries()) {
        initial[id] = { x: pos.x, y: pos.y };
      }
      currentCoordsRef.current = initial;
      setNodeCoords(initial);
    }
  }, [layout]);

  // Reset / Fit to view bounds
  const resetZoomAndPan = useCallback(() => {
    if (!graph || graph.nodes.length === 0) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      return;
    }

    const coords = Object.values(currentCoordsRef.current);
    if (coords.length === 0) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      return;
    }

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const c of coords) {
      if (c.x < minX) minX = c.x;
      if (c.x > maxX) maxX = c.x;
      if (c.y < minY) minY = c.y;
      if (c.y > maxY) maxY = c.y;
    }

    const graphWidth = Math.max(maxX - minX + 220, 500);
    const graphHeight = Math.max(maxY - minY + 220, 400);
    const { width: svgWidth, height: svgHeight } = canvasSize;

    const fitZoom = Math.max(0.4, Math.min(1.2, Math.min(svgWidth / graphWidth, svgHeight / graphHeight)));
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    setZoom(fitZoom);
    setPan({
      x: svgWidth / 2 - centerX * fitZoom,
      y: svgHeight / 2 - centerY * fitZoom,
    });
  }, [graph, canvasSize]);

  // Center specifically on a selected node
  const focusOnNode = useCallback((nodeId: string) => {
    const pos = currentCoordsRef.current[nodeId] || layout.positions.get(nodeId);
    if (!pos) return;
    const { width, height } = canvasSize;
    const targetZoom = 1.15;
    setZoom(targetZoom);
    setPan({
      x: width / 2 - pos.x * targetZoom,
      y: height / 2 - pos.y * targetZoom,
    });
  }, [canvasSize, layout]);

  // Zoom centered on pointer
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const delta = e.deltaY < 0 ? 1.12 : 0.88;
    const newZoom = Math.max(0.35, Math.min(3.5, zoom * delta));

    const svgX = (mouseX - pan.x) / zoom;
    const svgY = (mouseY - pan.y) / zoom;

    setZoom(newZoom);
    setPan({
      x: mouseX - svgX * newZoom,
      y: mouseY - svgY * newZoom,
    });
  };

  // Canvas Pan Handlers
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsPanning(true);
    panStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  // Node Drag Start Handler
  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    if (e.button !== 0) return;
    e.stopPropagation();

    const currentPos = currentCoordsRef.current[nodeId] || layout.positions.get(nodeId);
    if (!currentPos) return;

    nodeDragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      startX: currentPos.x,
      startY: currentPos.y,
    };
    hasMovedRef.current = false;
    setDraggedNodeId(nodeId);
  };

  // Mobile Touch Drag Handlers
  const handleNodeTouchStart = (e: React.TouchEvent, nodeId: string) => {
    if (e.touches.length !== 1) return;
    e.stopPropagation();
    const touch = e.touches[0];
    const currentPos = currentCoordsRef.current[nodeId] || layout.positions.get(nodeId);
    if (!currentPos) return;

    nodeDragStartRef.current = {
      clientX: touch.clientX,
      clientY: touch.clientY,
      startX: currentPos.x,
      startY: currentPos.y,
    };
    hasMovedRef.current = false;
    setDraggedNodeId(nodeId);
  };

  const handleCanvasTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsPanning(true);
      panStartRef.current = { x: touch.clientX - pan.x, y: touch.clientY - pan.y };
    }
  };

  // Global Synchronized Drag and Pan Listeners (Window-attached to eliminate lag)
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (draggedNodeIdRef.current) {
        const nodeId = draggedNodeIdRef.current;
        const dx = (e.clientX - nodeDragStartRef.current.clientX) / zoomRef.current;
        const dy = (e.clientY - nodeDragStartRef.current.clientY) / zoomRef.current;

        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
          hasMovedRef.current = true;
        }

        const newX = nodeDragStartRef.current.startX + dx;
        const newY = nodeDragStartRef.current.startY + dy;

        currentCoordsRef.current[nodeId] = { x: newX, y: newY };

        // Batch coordinate update via requestAnimationFrame for 60fps locked sync
        if (!rafIdRef.current) {
          rafIdRef.current = requestAnimationFrame(() => {
            rafIdRef.current = null;
            setNodeCoords({ ...currentCoordsRef.current });
          });
        }
      } else if (isPanning) {
        setPan({
          x: e.clientX - panStartRef.current.x,
          y: e.clientY - panStartRef.current.y,
        });
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];

      if (draggedNodeIdRef.current) {
        const nodeId = draggedNodeIdRef.current;
        const dx = (touch.clientX - nodeDragStartRef.current.clientX) / zoomRef.current;
        const dy = (touch.clientY - nodeDragStartRef.current.clientY) / zoomRef.current;

        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
          hasMovedRef.current = true;
        }

        const newX = nodeDragStartRef.current.startX + dx;
        const newY = nodeDragStartRef.current.startY + dy;

        currentCoordsRef.current[nodeId] = { x: newX, y: newY };

        if (!rafIdRef.current) {
          rafIdRef.current = requestAnimationFrame(() => {
            rafIdRef.current = null;
            setNodeCoords({ ...currentCoordsRef.current });
          });
        }
      } else if (isPanning) {
        setPan({
          x: touch.clientX - panStartRef.current.x,
          y: touch.clientY - panStartRef.current.y,
        });
      }
    };

    const onMouseUp = () => {
      if (draggedNodeIdRef.current) {
        if (!hasMovedRef.current) {
          setSelectedNodeId(draggedNodeIdRef.current);
        }
        setDraggedNodeId(null);
      }
      if (isPanning) {
        setIsPanning(false);
      }
    };

    const onTouchEnd = () => {
      if (draggedNodeIdRef.current) {
        if (!hasMovedRef.current) {
          setSelectedNodeId(draggedNodeIdRef.current);
        }
        setDraggedNodeId(null);
      }
      if (isPanning) {
        setIsPanning(false);
      }
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [isPanning]);

  const toggleFollowUser = async (targetUserId: string) => {
    const isCurrentlyFollowing = followingMap[targetUserId] ?? false;
    const newIsFollowing = !isCurrentlyFollowing;
    const delta = newIsFollowing ? 1 : -1;
    setFollowActionBusy(true);

    // Optimistic update of relationship and counts
    setFollowingMap((prev) => ({ ...prev, [targetUserId]: newIsFollowing }));
    setGraph((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        center: {
          ...prev.center,
          following_count: Math.max(0, (prev.center.following_count ?? 0) + delta),
        },
        nodes: prev.nodes.map((node) => {
          if (node.id === targetUserId) {
            return {
              ...node,
              followers_count: Math.max(0, (node.followers_count ?? 0) + delta),
            };
          }
          return node;
        }),
      };
    });

    try {
      const res = await api.toggleFollow(targetUserId, newIsFollowing);
      if (res && typeof res.followers_count === 'number') {
        setGraph((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            nodes: prev.nodes.map((node) => {
              if (node.id === targetUserId) {
                return {
                  ...node,
                  followers_count: res.followers_count,
                };
              }
              return node;
            }),
          };
        });
      }
    } catch {
      // Rollback on failure
      const rollbackDelta = -delta;
      setFollowingMap((prev) => ({ ...prev, [targetUserId]: isCurrentlyFollowing }));
      setGraph((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          center: {
            ...prev.center,
            following_count: Math.max(0, (prev.center.following_count ?? 0) + rollbackDelta),
          },
          nodes: prev.nodes.map((node) => {
            if (node.id === targetUserId) {
              return {
                ...node,
                followers_count: Math.max(0, (node.followers_count ?? 0) + rollbackDelta),
              };
            }
            return node;
          }),
        };
      });
    } finally {
      setFollowActionBusy(false);
    }
  };

  const selectedNode = useMemo(() => {
    if (!graph || !selectedNodeId) return null;
    if (graph.center.id === selectedNodeId) return graph.center;
    return graph.nodes.find((n) => n.id === selectedNodeId) || null;
  }, [graph, selectedNodeId]);

  // Defensive count loader if selected node lacks count data
  useEffect(() => {
    if (!selectedNode || !selectedNode.username) return;
    if (selectedNode.followers_count !== undefined && selectedNode.following_count !== undefined) return;
    let active = true;
    api.getUserProfile(selectedNode.username).then((profile) => {
      if (!active) return;
      setGraph((prev) => {
        if (!prev) return prev;
        if (prev.center.id === selectedNode.id) {
          return {
            ...prev,
            center: {
              ...prev.center,
              followers_count: profile.followers_count,
              following_count: profile.following_count,
              bio: profile.bio || prev.center.bio,
            },
          };
        }
        return {
          ...prev,
          nodes: prev.nodes.map((n) =>
            n.id === selectedNode.id
              ? {
                  ...n,
                  followers_count: profile.followers_count,
                  following_count: profile.following_count,
                  bio: profile.bio || n.bio,
                }
              : n
          ),
        };
      });
    }).catch(() => {});
    return () => {
      active = false;
    };
  }, [selectedNode?.id, selectedNode?.username]);

  if (loading) {
    return (
      <main className="space-y-6 w-full" aria-busy="true">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">Social Graph</h1>
            <p className="text-sm text-text-muted">Resolving technical relationships and network neighborhood…</p>
          </div>
        </header>
        <div
          data-testid="graph-loading"
          className="h-[600px] w-full animate-pulse rounded-2xl border border-border bg-surface-card/60 flex items-center justify-center flex-col gap-3"
        >
          <RefreshCw className="animate-spin text-primary" size={28} />
          <span className="text-sm font-medium text-text-muted">Resolving MongoDB relationship edges…</span>
        </div>
      </main>
    );
  }

  if (error || !graph) {
    return (
      <main className="space-y-6 w-full">
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

  return (
    <main className="space-y-6 w-full" data-testid="social-graph-view">
      {/* Header & Controls Bar */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-1">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight flex items-center gap-2.5">
            <Network className="text-primary" size={26} />
            <span>Social Graph Visualizer</span>
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Interactive relationship neighborhood centered on <strong className="text-text-primary">@{graph.center.username}</strong> &bull;{' '}
            <span className="font-semibold text-text-primary">{graph.nodes.length} connections</span>,{' '}
            <span className="font-semibold text-emerald-500">{relationshipMap.mutual.size} mutual</span>
          </p>
        </div>

        {/* View Mode Toggle & Actions */}
        <div className="flex items-center gap-2.5">
          <div className="flex rounded-xl bg-surface-subtle p-1 border border-border">
            <button
              type="button"
              onClick={() => setViewMode('visual')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'visual'
                  ? 'bg-surface-card text-text-primary shadow-xs'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <Network size={14} /> Network
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-surface-card text-text-primary shadow-xs'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <List size={14} /> Directory ({graph.nodes.length})
            </button>
          </div>

          <Button variant="secondary" size="sm" onClick={fetchGraph} title="Refresh graph data">
            <RefreshCw size={14} />
          </Button>
        </div>
      </header>

      {/* Main Interactive Workspace */}
      {viewMode === 'visual' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start w-full">
          {/* Large SVG Network Canvas */}
          <div
            ref={containerRef}
            className="lg:col-span-8 xl:col-span-9 relative rounded-2xl border border-border bg-canvas overflow-hidden shadow-xs min-h-[560px] lg:h-[calc(100vh-14rem)] lg:min-h-[620px] flex flex-col"
          >
            {/* Top Canvas Controls (Zoom / Pan / Fit / Center) */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-1 rounded-xl border border-border/70 bg-surface-card/85 p-1 backdrop-blur-md shadow-sm">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(3.5, z * 1.2))}
                className="inline-flex items-center justify-center w-7 h-7 text-text-muted hover:text-text-primary hover:bg-surface-elevated rounded-lg transition-colors cursor-pointer"
                title="Zoom In (+)"
                aria-label="Zoom In"
              >
                <ZoomIn size={16} className="shrink-0" />
              </button>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.35, z / 1.2))}
                className="inline-flex items-center justify-center w-7 h-7 text-text-muted hover:text-text-primary hover:bg-surface-elevated rounded-lg transition-colors cursor-pointer"
                title="Zoom Out (-)"
                aria-label="Zoom Out"
              >
                <ZoomOut size={16} className="shrink-0" />
              </button>
              <div className="h-4 w-px bg-border/60 my-auto mx-0.5" />
              <button
                type="button"
                onClick={resetZoomAndPan}
                className="inline-flex items-center justify-center gap-1.5 h-7 px-2.5 text-xs font-semibold text-text-muted hover:text-text-primary hover:bg-surface-elevated rounded-lg transition-colors cursor-pointer"
                title="Fit all nodes to view"
              >
                <Maximize2 size={13} className="shrink-0" />
                <span>Fit</span>
              </button>
              <button
                type="button"
                onClick={() => focusOnNode(graph.center.id)}
                className="inline-flex items-center justify-center gap-1.5 h-7 px-2.5 text-xs font-semibold text-text-muted hover:text-text-primary hover:bg-surface-elevated rounded-lg transition-colors cursor-pointer"
                title="Center on authenticated user"
              >
                <Crosshair size={13} className="shrink-0" />
                <span>Center</span>
              </button>
              <span className="inline-flex items-center justify-center h-7 text-[11px] font-mono text-text-muted px-2 select-none border-l border-border/60">
                {Math.round(zoom * 100)}%
              </span>
            </div>

            {/* Visual Legend (Neutral translucent pill) */}
            <div className="absolute bottom-4 left-4 z-10 hidden sm:flex items-center gap-3.5 rounded-xl border border-border/70 bg-surface-card/85 px-3.5 py-2 text-xs font-medium text-text-muted backdrop-blur-md shadow-sm">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-primary/30" /> Center (You)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Mutual Follow
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-border border border-border" /> Directed Follow
              </span>
            </div>

            {/* Interactive SVG Canvas */}
            <svg
              ref={svgRef}
              data-testid="interactive-social-graph-svg"
              role="img"
              aria-label={`Interactive social network showing ${graph.nodes.length} connections`}
              className={`flex-1 w-full h-full select-none touch-none ${
                draggedNodeId ? 'cursor-grabbing' : isPanning ? 'cursor-grabbing' : 'cursor-grab'
              }`}
              onWheel={handleWheel}
              onMouseDown={handleCanvasMouseDown}
              onTouchStart={handleCanvasTouchStart}
            >
              <defs>
                {/* Regular directed arrow marker */}
                <marker
                  id="directed-arrow"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="5"
                  markerHeight="5"
                  orient="auto"
                  markerUnits="userSpaceOnUse"
                >
                  <path d="M 0 2 L 8 5 L 0 8 z" fill="var(--color-border-subtle, #555555)" />
                </marker>

                {/* Highlighted / Mutual arrow marker */}
                <marker
                  id="mutual-arrow"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto"
                  markerUnits="userSpaceOnUse"
                >
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#10b981" />
                </marker>

                {/* Active / Highlighted arrow marker */}
                <marker
                  id="active-arrow"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto"
                  markerUnits="userSpaceOnUse"
                >
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="var(--color-primary, #6366f1)" />
                </marker>

                {/* Circular Avatar Clip Paths for Each Node */}
                {graph.nodes.map((node) => {
                  const isCenter = node.id === graph.center.id;
                  const radius = isCenter ? 30 : 22;
                  return (
                    <clipPath key={`clip-${node.id}`} id={`avatar-clip-${node.id}`}>
                      <circle cx="0" cy="0" r={radius} />
                    </clipPath>
                  );
                })}
              </defs>

              {/* Transform group for Zoom & Pan */}
              <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                {/* 1. Relationship Edges (Rendered behind nodes) */}
                <g id="edges-layer">
                  {graph.edges.map((edge) => {
                    const source = nodeCoords[edge.source] || layout.positions.get(edge.source);
                    const target = nodeCoords[edge.target] || layout.positions.get(edge.target);
                    if (!source || !target) return null;

                    const isSourceCenter = edge.source === graph.center.id;
                    const isTargetCenter = edge.target === graph.center.id;
                    const rSource = isSourceCenter ? 30 : 22;
                    const rTarget = isTargetCenter ? 30 : 22;

                    const dx = target.x - source.x;
                    const dy = target.y - source.y;
                    const dist = Math.hypot(dx, dy);
                    if (dist === 0 || dist <= rSource + rTarget) return null;

                    const uX = dx / dist;
                    const uY = dy / dist;

                    // Calculate precise line boundary terminations
                    const x1 = source.x + uX * rSource;
                    const y1 = source.y + uY * rSource;
                    const x2 = target.x - uX * rTarget;
                    const y2 = target.y - uY * rTarget;

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
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={
                          isEdgeMutual
                            ? '#10b981'
                            : isHighlighted
                            ? 'var(--color-primary, #6366f1)'
                            : 'var(--color-border, #333333)'
                        }
                        strokeWidth={isHighlighted ? 2.4 : isEdgeMutual ? 2 : 1.2}
                        strokeDasharray={isEdgeMutual ? undefined : '4 3'}
                        strokeOpacity={isHighlighted ? 0.95 : isEdgeMutual ? 0.75 : 0.4}
                        markerEnd={
                          isHighlighted
                            ? 'url(#active-arrow)'
                            : isEdgeMutual
                            ? 'url(#mutual-arrow)'
                            : 'url(#directed-arrow)'
                        }
                      />
                    );
                  })}
                </g>

                {/* 2. Nodes Layer */}
                <g id="nodes-layer">
                  {graph.nodes.map((node) => {
                    const isCenter = node.id === graph.center.id;
                    const pos = nodeCoords[node.id] || layout.positions.get(node.id) || { x: 450, y: 300 };
                    const isSelected = selectedNodeId === node.id;
                    const isHovered = hoveredNodeId === node.id;
                    const isDraggingThis = draggedNodeId === node.id;
                    const isMutual = relationshipMap.mutual.has(node.id);
                    const isFollowing = followingMap[node.id];
                    const radius = isCenter ? 30 : 22;
                    const hasImage = node.avatar_url && !avatarErrors[node.id];

                    return (
                      <g
                        key={`node-${node.id}`}
                        data-testid={`graph-node-${node.id}`}
                        transform={`translate(${pos.x}, ${pos.y})`}
                        onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                        onTouchStart={(e) => handleNodeTouchStart(e, node.id)}
                        onClick={() => setSelectedNodeId(node.id)}
                        onMouseEnter={() => setHoveredNodeId(node.id)}
                        onMouseLeave={() => setHoveredNodeId(null)}
                        className={`select-none focus:outline-none ${isDraggingThis ? 'cursor-grabbing' : 'cursor-grab'}`}
                        style={{ outline: 'none' }}
                        role="button"
                        tabIndex={0}
                        aria-label={`${node.display_name} (@${node.username})`}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedNodeId(node.id);
                          }
                        }}
                      >
                        {/* Selection & Hover Aura (Subtle Outer Glow) */}
                        {(isSelected || isHovered || isDraggingThis) && (
                          <circle
                            r={radius + 7}
                            fill="none"
                            stroke={
                              isCenter
                                ? 'var(--color-primary, #6366f1)'
                                : isMutual
                                ? '#10b981'
                                : 'var(--color-primary, #6366f1)'
                            }
                            strokeWidth="2"
                            strokeOpacity={isDraggingThis ? 0.8 : isSelected ? 0.6 : 0.3}
                            className="pointer-events-none"
                          />
                        )}

                        {/* Center Node Distinctive Outer Restrained Ring */}
                        {isCenter && (
                          <circle
                            r={radius + 4}
                            fill="none"
                            stroke="var(--color-primary, #6366f1)"
                            strokeWidth="2"
                            strokeOpacity={0.7}
                            strokeDasharray="4 2"
                            className="pointer-events-none"
                          />
                        )}

                        {/* Node Background Disc */}
                        <circle
                          r={radius}
                          fill="var(--color-surface-elevated, #141414)"
                          className="shadow-sm"
                        />

                        {/* Real Profile Image Avatar */}
                        {hasImage ? (
                          <image
                            href={node.avatar_url}
                            x={-radius}
                            y={-radius}
                            width={radius * 2}
                            height={radius * 2}
                            clipPath={`url(#avatar-clip-${node.id})`}
                            preserveAspectRatio="xMidYMid slice"
                            onError={() => setAvatarErrors((prev) => ({ ...prev, [node.id]: true }))}
                            className="pointer-events-none"
                          />
                        ) : (
                          /* Initial Fallback if Image Fails or is Missing */
                          <text
                            textAnchor="middle"
                            dy=".35em"
                            fontSize={isCenter ? 14 : 11}
                            fontWeight="bold"
                            fill={isCenter || isMutual ? '#ffffff' : 'var(--color-text-primary, #ffffff)'}
                            className="pointer-events-none select-none"
                          >
                            {node.display_name.charAt(0).toUpperCase()}
                          </text>
                        )}

                        {/* Clean Circular Node Border */}
                        <circle
                          r={radius}
                          fill="none"
                          stroke={
                            isSelected
                              ? 'var(--color-primary, #6366f1)'
                              : isCenter
                              ? 'var(--color-primary, #6366f1)'
                              : isMutual
                              ? '#10b981'
                              : isFollowing
                              ? 'rgba(99, 102, 241, 0.6)'
                              : 'var(--color-border, rgba(255, 255, 255, 0.15))'
                          }
                          strokeWidth={isSelected ? 2.5 : isCenter ? 2 : isMutual ? 2 : 1.5}
                          className="pointer-events-none"
                        />

                        {/* Clean Typography Label with Background Halo (No Rectangular Box) */}
                        <text
                          textAnchor="middle"
                          y={radius + 15}
                          fontSize="11"
                          fontWeight={isCenter || isSelected ? '700' : '600'}
                          fill="var(--color-text-primary, #ffffff)"
                          className="pointer-events-none select-none text-[11px] tracking-tight"
                          style={{
                            paintOrder: 'stroke fill',
                            stroke: 'var(--color-canvas, #000000)',
                            strokeWidth: '3.5px',
                            strokeLinejoin: 'round',
                          }}
                        >
                          {node.display_name.length > 15
                            ? `${node.display_name.slice(0, 14)}…`
                            : node.display_name}
                        </text>

                        {/* Handle subtitle for center or selected node */}
                        {(isCenter || isSelected || isHovered) && (
                          <text
                            textAnchor="middle"
                            y={radius + 27}
                            fontSize="9.5"
                            fontWeight="500"
                            fill="var(--color-text-muted, #888888)"
                            className="pointer-events-none select-none text-[9.5px]"
                            style={{
                              paintOrder: 'stroke fill',
                              stroke: 'var(--color-canvas, #000000)',
                              strokeWidth: '2.5px',
                              strokeLinejoin: 'round',
                            }}
                          >
                            @{node.username}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </g>
              </g>
            </svg>
          </div>

          {/* Contextual Inspector Drawer / Sidebar (Integrated Surface) */}
          <aside
            data-testid="graph-inspector-panel"
            aria-label="Selected connection details"
            className="lg:col-span-4 xl:col-span-3 rounded-2xl border border-border bg-surface-card p-5 shadow-sm space-y-4 w-full"
          >
            {selectedNode ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border">
                  <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                    {selectedNode.id === graph.center.id ? 'Self (Center Node)' : 'Connection Profile'}
                  </span>
                  <button
                    type="button"
                    onClick={() => focusOnNode(selectedNode.id)}
                    className="text-text-muted hover:text-text-primary p-1 rounded-md transition-colors cursor-pointer"
                    title="Center on this node in canvas"
                  >
                    <Compass size={15} />
                  </button>
                </div>

                {/* Profile Header Row with Real Avatar */}
                <div className="flex items-start gap-3.5">
                  <Avatar
                    src={selectedNode.avatar_url}
                    alt={selectedNode.display_name}
                    size="lg"
                    className="border border-border/80"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-base text-text-primary truncate flex items-center gap-1.5">
                      <span>{selectedNode.display_name}</span>
                      {selectedNode.is_verified && (
                        <span
                          title="Verified"
                          className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-primary text-white text-[9px] font-bold"
                        >
                          ✓
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-text-muted truncate">@{selectedNode.username}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {selectedNode.id === graph.center.id ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary">
                          Primary User
                        </span>
                      ) : relationshipMap.mutual.has(selectedNode.id) ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          Mutual Connection
                        </span>
                      ) : followingMap[selectedNode.id] ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary">
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
                  <div className="p-2.5 rounded-xl bg-surface-elevated/50 border border-border/50 flex flex-col items-center justify-center">
                    <div className="font-bold text-text-primary text-sm leading-tight">
                      {selectedNode.followers_count !== undefined ? selectedNode.followers_count : '—'}
                    </div>
                    <div className="text-[10px] text-text-muted font-medium mt-0.5">Followers</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-surface-elevated/50 border border-border/50 flex flex-col items-center justify-center">
                    <div className="font-bold text-text-primary text-sm leading-tight">
                      {selectedNode.following_count !== undefined ? selectedNode.following_count : '—'}
                    </div>
                    <div className="text-[10px] text-text-muted font-medium mt-0.5">Following</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-2">
                  {selectedNode.id !== graph.center.id && (
                    <Button
                      variant={followingMap[selectedNode.id] ? 'outline' : 'primary'}
                      size="sm"
                      className="w-full font-semibold rounded-xl"
                      disabled={followActionBusy}
                      onClick={() => toggleFollowUser(selectedNode.id)}
                      leftIcon={
                        followingMap[selectedNode.id] ? (
                          <UserCheck size={14} className="shrink-0" />
                        ) : (
                          <UserPlus size={14} className="shrink-0" />
                        )
                      }
                    >
                      {followingMap[selectedNode.id] ? 'Following' : 'Follow Back'}
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full font-medium text-xs rounded-xl"
                    onClick={() => navigate(`/u/${selectedNode.username}`)}
                    leftIcon={<ExternalLink size={13} className="shrink-0" />}
                  >
                    View Full Profile
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
        <div className="overflow-hidden rounded-2xl border border-border bg-surface-card shadow-sm w-full">
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
                          <Avatar
                            src={node.avatar_url}
                            alt={node.display_name}
                            size="sm"
                          />
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
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
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
