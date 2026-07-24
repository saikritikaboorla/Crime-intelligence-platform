import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Shield,
  User,
  HelpCircle,
  ArrowRight,
  DollarSign,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sliders,
  Search,
  Network,
  List,
  ChevronRight,
  Info,
  AlertTriangle,
  Move,
  Eye,
  FileText,
  RotateCcw,
  Focus,
  Layers,
  Sparkles
} from "lucide-react";

interface NetworkGraphProps {
  nodes: any[];
  edges: any[];
  onSelectNode: (node: any) => void;
}

export default function NetworkGraph({ nodes, edges, onSelectNode }: NetworkGraphProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("All");
  const [viewTab, setViewTab] = useState<"graph" | "directory">("graph");
  const [layoutMode, setLayoutMode] = useState<"circular" | "hierarchy">("circular");
  const [spacingFactor, setSpacingFactor] = useState<number>(1.3);

  // Increased default zoom to 2.0 for high clarity
  const [zoom, setZoom] = useState<number>(2.0);
  // Pan coordinates centered for 2800x1800 viewBox canvas at 2.0 zoom
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: -1400, y: -900 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    nodes.forEach(n => {
      if (n.type === "Case" || n.type === "Suspect") initial.add(n.id);
    });
    return initial;
  });

  const svgRef = useRef<SVGSVGElement>(null);

  // Filter nodes
  const filteredNodes = useMemo(() => {
    return nodes.filter(node => {
      const labelMatch = (node.label || "").toLowerCase().includes(searchQuery.toLowerCase());
      const typeMatch = (node.type || "").toLowerCase().includes(searchQuery.toLowerCase());
      const ownerMatch = (node.owner || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSearch = labelMatch || typeMatch || ownerMatch;

      const matchesFilter = filterType === "All" || node.type === filterType;
      return matchesSearch && matchesFilter;
    });
  }, [nodes, searchQuery, filterType]);

  const filteredNodeIds = useMemo(() => new Set(filteredNodes.map(n => n.id)), [filteredNodes]);

  // Find related nodes when a node is hovered/selected
  const relatedConnections = useMemo(() => {
    if (!selectedNodeId) return { nodeIds: new Set<string>(), edgeIds: new Set<string>() };
    const connectedNodeIds = new Set<string>([selectedNodeId]);
    const connectedEdgeIds = new Set<string>();

    edges.forEach(edge => {
      if (edge.source === selectedNodeId) {
        connectedNodeIds.add(edge.target);
        connectedEdgeIds.add(edge.id);
      } else if (edge.target === selectedNodeId) {
        connectedNodeIds.add(edge.source);
        connectedEdgeIds.add(edge.id);
      }
    });

    return { nodeIds: connectedNodeIds, edgeIds: connectedEdgeIds };
  }, [selectedNodeId, edges]);

  // Hover highlight connections
  const hoveredConnections = useMemo(() => {
    if (!hoveredNodeId) return { nodeIds: new Set<string>(), edgeIds: new Set<string>() };
    const connectedNodeIds = new Set<string>([hoveredNodeId]);
    const connectedEdgeIds = new Set<string>();

    edges.forEach(edge => {
      if (edge.source === hoveredNodeId) {
        connectedNodeIds.add(edge.target);
        connectedEdgeIds.add(edge.id);
      } else if (edge.target === hoveredNodeId) {
        connectedNodeIds.add(edge.source);
        connectedEdgeIds.add(edge.id);
      }
    });

    return { nodeIds: connectedNodeIds, edgeIds: connectedEdgeIds };
  }, [hoveredNodeId, edges]);

  // Render SVG Node positions dynamically with enhanced spacing and label staggering
  const positionedNodes = useMemo(() => {
    const width = 2800;
    const height = 1800;
    const center = { x: 1400, y: 900 };

    if (layoutMode === "circular") {
      const byType: Record<string, any[]> = { Case: [], Suspect: [], Victim: [], Account: [] };
      nodes.forEach(n => {
        const key = n.type in byType ? n.type : "Account";
        byType[key].push(n);
      });

      // Expanded ring radii & radial staggering to prevent label/node overlaps on 2800x1800 canvas
      const ringRadius: Record<string, number> = {
        Case:    240 * spacingFactor,
        Suspect: 560 * spacingFactor,
        Victim:  920 * spacingFactor,
        Account: 1280 * spacingFactor,
      };

      return nodes.map(node => {
        const group = byType[node.type] ?? byType.Account;
        const idx = group.findIndex((n: any) => n.id === node.id);
        const count = group.length;
        const baseRadius = ringRadius[node.type] ?? 500 * spacingFactor;
        
        // Alternating radial distance (+60px / -60px) to prevent node overlap in rings
        const radialStagger = (idx % 2 === 1 ? 60 : -60) * Math.min(spacingFactor, 1.4);
        const r = baseRadius + radialStagger;

        // Offset start angle per type so labels don't stack at 0°
        const offsets: Record<string, number> = { Case: 0, Suspect: Math.PI / 8, Victim: Math.PI / 4, Account: Math.PI / 3 };
        const startAngle = offsets[node.type] ?? 0;
        const angle = startAngle + (count > 1 ? (idx / count) * 2 * Math.PI : 0);
        
        // Alternating vertical jitter
        const jitterY = count > 3 ? (idx % 2 === 1 ? 30 : -30) : 0;

        return {
          ...node,
          idx,
          x: center.x + r * Math.cos(angle),
          y: center.y + r * Math.sin(angle) + jitterY,
        };
      });
    } else {
      // Hierarchy: Cases top → Suspects → Victims → Accounts bottom
      const cases    = nodes.filter(n => n.type === "Case");
      const suspects = nodes.filter(n => n.type === "Suspect");
      const victims  = nodes.filter(n => n.type === "Victim");
      const accounts = nodes.filter(n => n.type === "Account");

      const placeRow = (group: any[], y: number) =>
        group.map((node, idx) => ({
          ...node,
          idx,
          x: (width / (group.length + 1)) * (idx + 1),
          // Horizontal & vertical jitter for alternating nodes
          y: y + (idx % 2 === 1 ? 35 : -35),
        }));

      return [
        ...placeRow(cases,    220),
        ...placeRow(suspects, 600),
        ...placeRow(victims,  1000),
        ...placeRow(accounts, 1420),
      ].map(node => ({
        ...node,
        x: center.x + (node.x - center.x) * spacingFactor,
        y: center.y + (node.y - center.y) * spacingFactor,
      }));
    }
  }, [nodes, spacingFactor, layoutMode]);

  const nodeMap = useMemo(() => {
    const map = new Map<string, any>();
    positionedNodes.forEach(n => map.set(n.id, n));
    return map;
  }, [positionedNodes]);

  // Progressive visibility: show Case/Suspect always; others when connected to selected/hovered/expanded
  const visibleNodeIds = useMemo(() => {
    const ids = new Set<string>();
    positionedNodes.forEach(n => {
      if (n.type === "Case" || n.type === "Suspect") ids.add(n.id);
    });
    if (selectedNodeId) {
      edges.forEach(e => {
        if (e.source === selectedNodeId) ids.add(e.target);
        if (e.target === selectedNodeId) ids.add(e.source);
      });
    }
    if (hoveredNodeId) {
      edges.forEach(e => {
        if (e.source === hoveredNodeId) ids.add(e.target);
        if (e.target === hoveredNodeId) ids.add(e.source);
      });
    }
    expandedNodes.forEach(nid => {
      edges.forEach(e => {
        if (e.source === nid) ids.add(e.target);
        if (e.target === nid) ids.add(e.source);
      });
    });
    return ids;
  }, [positionedNodes, edges, selectedNodeId, hoveredNodeId, expandedNodes]);

  // Direct connections list for selected node details
  const directLinks = useMemo(() => {
    if (!selectedNodeId) return [];
    return edges
      .filter(edge => edge.source === selectedNodeId || edge.target === selectedNodeId)
      .map(edge => {
        const isSource = edge.source === selectedNodeId;
        const linkedId = isSource ? edge.target : edge.source;
        const linkedNode = nodeMap.get(linkedId);
        return {
          edgeId: edge.id,
          relation: edge.relation,
          amount: edge.amount,
          reason: edge.reason,
          node: linkedNode
        };
      })
      .filter(link => link.node !== undefined);
  }, [selectedNodeId, edges, nodeMap]);

  // Select node & center graph
  const handleNodeSelect = (nodeId: string, options?: { expandRelations?: boolean; zoomLevel?: number }) => {
    // Expand connected relationships
    if (options?.expandRelations !== false) {
      const connected = new Set<string>([nodeId]);
      edges.forEach(e => {
        if (e.source === nodeId) connected.add(e.target);
        if (e.target === nodeId) connected.add(e.source);
      });
      setExpandedNodes(prev => new Set([...prev, ...connected]));
    }

    setSelectedNodeId(nodeId);
    const node = nodeMap.get(nodeId);
    if (node) {
      onSelectNode(node);
      const activeZoom = options?.zoomLevel ?? (zoom < 1.8 ? 2.0 : zoom);
      if (options?.zoomLevel || zoom < 1.8) setZoom(activeZoom);

      // Recenter pan around node coordinates to put it visually in canvas center (1400, 900)
      setPan({
        x: 1400 - node.x * activeZoom,
        y: 900 - node.y * activeZoom
      });
    }
  };

  // Directory Interaction: Clicking any entity inside Synicade Directory
  // - Does NOT open a separate page
  // - Centers the graph on the selected node
  // - Highlights the selected node
  // - Expands connected relationships
  // - Displays the information directly inside the existing graph view
  const handleDirectoryEntityClick = (nodeId: string) => {
    // 1. Expand connected relationships
    const connected = new Set<string>([nodeId]);
    edges.forEach(e => {
      if (e.source === nodeId) connected.add(e.target);
      if (e.target === nodeId) connected.add(e.source);
    });
    setExpandedNodes(prev => new Set([...prev, ...connected]));

    // 2. Highlight/Select node
    setSelectedNodeId(nodeId);

    // 3. Switch to existing graph view
    setViewTab("graph");

    // 4. Center graph on selected node & notify parent
    setTimeout(() => {
      const n = nodeMap.get(nodeId);
      if (n) {
        onSelectNode(n);
        const activeZoom = zoom < 1.8 ? 2.0 : zoom;
        if (zoom < 1.8) setZoom(activeZoom);
        setPan({
          x: 1400 - n.x * activeZoom,
          y: 900 - n.y * activeZoom
        });
      }
    }, 40);
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const zoomFactor = 1.1;
    const nextZoom = e.deltaY < 0 ? zoom * zoomFactor : zoom / zoomFactor;
    setZoom(Math.max(0.4, Math.min(3.5, nextZoom)));
  };

  const resetPanZoom = () => {
    setZoom(2.0);
    setPan({ x: -1400, y: -900 });
  };

  const renderIcon = (type: string, isSuspicious?: boolean) => {
    const color = isSuspicious ? "text-rose-400" : "text-amber-400";
    switch (type) {
      case "Suspect":
        return <User className="w-5 h-5 text-emerald-400" />;
      case "Case":
        return <Shield className="w-5 h-5 text-amber-500" />;
      case "Account":
        return <DollarSign className={`w-5 h-5 ${color}`} />;
      case "Victim":
        return <User className="w-5 h-5 text-sky-400" />;
      default:
        return <HelpCircle className="w-5 h-5 text-slate-400" />;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, nodeId: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleNodeSelect(nodeId);
    }
  };

  const isHighRisk = (label: string) =>
    label.includes("Ramesh") || label.includes("Suresh");

  const formatINR = (amount: number) => {
    return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(amount);
  };

  if (!nodes || nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
        <Network className="w-12 h-12 text-slate-600 animate-pulse" />
        <div className="text-sm font-bold text-slate-400">Loading Criminal Network</div>
        <p className="text-xs text-slate-500">Fetching relationship graph from KSP database...</p>
        <div className="h-1 w-40 rounded bg-slate-800 animate-pulse mt-2" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Sidebar Controls & Refined Details — ENHANCED SCROLL PANEL */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-xl overflow-hidden flex flex-col min-h-[750px] lg:h-[800px]">
        {/* Fixed Header */}
        <div className="flex-shrink-0 p-4 border-b border-slate-800/60 bg-slate-900/40">
          <h3 className="text-xs font-bold tracking-wider uppercase text-amber-500 flex items-center gap-2 mb-3">
            <Sliders className="w-4 h-4" />
            Control Hub
          </h3>
          {/* Graph view toggle button */}
          <button
            onClick={() => setViewTab("graph")}
            className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition ${
              viewTab === "graph"
                ? "bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-[0_0_12px_rgba(251,191,36,0.3)]"
                : "bg-slate-900 text-slate-400 border-slate-700 hover:text-slate-200 hover:border-slate-600 hover:bg-slate-800"
            }`}
            title="Interactive Graph View"
          >
            <Network className="w-4 h-4" />
            <span>Interactive Graph</span>
          </button>
        </div>

        {/* SCROLLABLE CONTENT AREA */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">

        {/* Syndicate Directory — prominent full-width button */}
        <div>
          <button
            onClick={() => setViewTab("directory")}
            className={`w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl text-xs font-bold border transition ${
              viewTab === "directory"
                ? "bg-blue-500/20 text-blue-300 border-blue-500/50 shadow-[0_0_16px_rgba(59,130,246,0.4)]"
                : "bg-slate-900/80 text-blue-400 border-blue-500/30 hover:bg-blue-900/20 hover:border-blue-400/50"
            }`}
            title="Syndicate Relationship Directory"
          >
            <div className="flex items-center gap-2">
              <List className="w-4.5 h-4.5" />
              <span className="font-extrabold">Syndicate Directory</span>
            </div>
            <ChevronRight className="w-4 h-4 shrink-0" />
          </button>
          <p className="text-[10px] text-slate-500 text-center mt-1">Browse all entities &amp; relationships</p>
        </div>

        {/* Global Filters */}
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1 font-medium">Search Entity Name / ID</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="e.g. Ramesh, SBI, Case..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-9 text-caption"
                style={{paddingLeft: '2.25rem'}}
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1 font-medium">Filter Category</label>
            <div className="flex flex-wrap gap-1.5">
              {["All", "Suspect", "Case", "Account", "Victim"].map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={`py-1 px-2.5 rounded-md text-[10px] font-bold border transition ${
                    filterType === t
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/40"
                      : "bg-slate-950/80 text-slate-400 border-slate-800/80 hover:border-slate-700"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Graph-specific layout options */}
        {viewTab === "graph" && (
          <div className="space-y-3 pt-3 border-t border-slate-800/60">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1 font-medium">Structural Blueprint</label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => setLayoutMode("circular")}
                  className={`py-1.5 px-2 rounded-lg text-center text-[10px] font-bold border transition flex items-center justify-center gap-1 ${
                    layoutMode === "circular"
                      ? "bg-blue-600/20 text-blue-300 border-blue-500/50 shadow-[0_0_8px_rgba(59,130,246,0.3)]"
                      : "bg-slate-950 text-slate-400 border-slate-800 hover:border-blue-500/30 hover:text-slate-300"
                  }`}
                >
                  <span className="text-base leading-none">⊙</span> Concentric
                </button>
                <button
                  onClick={() => setLayoutMode("hierarchy")}
                  className={`py-1.5 px-2 rounded-lg text-center text-[10px] font-bold border transition flex items-center justify-center gap-1 ${
                    layoutMode === "hierarchy"
                      ? "bg-purple-600/20 text-purple-300 border-purple-500/50 shadow-[0_0_8px_rgba(168,85,247,0.3)]"
                      : "bg-slate-950 text-slate-400 border-slate-800 hover:border-purple-500/30 hover:text-slate-300"
                  }`}
                >
                  <span className="text-base leading-none">⊟</span> Hierarchy
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] text-slate-400 font-medium">Node Layout Spacing</label>
                <span className="text-[10px] text-amber-400 font-bold">{(spacingFactor * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.8"
                max="2.2"
                step="0.1"
                value={spacingFactor}
                onChange={(e) => setSpacingFactor(parseFloat(e.target.value))}
                className="w-full accent-amber-500 h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Quick-action filter buttons */}
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => setFilterType(filterType === "Suspect" ? "All" : "Suspect")}
                className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border transition flex items-center justify-center gap-1 ${
                  filterType === "Suspect"
                    ? "bg-emerald-600/20 text-emerald-300 border-emerald-500/50"
                    : "bg-slate-950 text-slate-400 border-slate-800 hover:border-emerald-500/30 hover:text-slate-300"
                }`}
                title="Focus on Suspects only"
              >
                <Focus className="w-3 h-3" />
                Focus Suspects
              </button>
              <button
                onClick={resetPanZoom}
                className="py-1.5 px-2 rounded-lg text-[10px] font-bold border transition flex items-center justify-center gap-1 bg-slate-950 text-slate-400 border-slate-800 hover:border-amber-500/30 hover:text-amber-400"
                title="Reset zoom and pan to default"
              >
                <RotateCcw className="w-3 h-3" />
                Reset View
              </button>
            </div>
          </div>
        )}

        {/* Detailed Relationship Inspector */}
        <div className="space-y-4 pt-3 border-t border-slate-800/60">
          {selectedNodeId && nodeMap.has(selectedNodeId) ? (
            <div className="bg-slate-950/80 rounded-xl border border-slate-800 space-y-3.5 animate-fadeIn overflow-hidden">
              {/* Colored header bar based on node type */}
              <div className={`px-4 pt-3 pb-2 border-b ${
                nodeMap.get(selectedNodeId).type === "Suspect" ? "bg-emerald-950/40 border-emerald-800/40" :
                nodeMap.get(selectedNodeId).type === "Case"    ? "bg-amber-950/40 border-amber-800/40" :
                nodeMap.get(selectedNodeId).type === "Account" ? "bg-rose-950/40 border-rose-800/40" :
                "bg-sky-950/40 border-sky-800/40"
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`text-[9px] uppercase px-2 py-0.5 rounded font-extrabold tracking-wider ${
                    nodeMap.get(selectedNodeId).type === "Suspect" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                    nodeMap.get(selectedNodeId).type === "Case"    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                    nodeMap.get(selectedNodeId).type === "Account" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                    "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                  }`}>
                    {nodeMap.get(selectedNodeId).type}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {/* HIGH RISK badge for suspects named Ramesh/Suresh */}
                    {nodeMap.get(selectedNodeId).type === "Suspect" && isHighRisk(nodeMap.get(selectedNodeId).label) && (
                      <span className="flex items-center gap-0.5 text-[8px] bg-red-500/15 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded font-extrabold tracking-wide animate-pulse">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        HIGH RISK
                      </span>
                    )}
                    {/* FLAGGED badge for mule/crypto accounts */}
                    {nodeMap.get(selectedNodeId).type === "Account" &&
                      (selectedNodeId.includes("MULE") || selectedNodeId.includes("CRYPTO")) && (
                      <span className="flex items-center gap-0.5 text-[8px] bg-rose-500/15 text-rose-400 border border-rose-500/30 px-1.5 py-0.5 rounded font-extrabold tracking-wide animate-pulse">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        FLAGGED
                      </span>
                    )}
                    <button
                      onClick={() => setSelectedNodeId(null)}
                      className="text-[10px] text-slate-500 hover:text-slate-300 font-bold underline cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>

                <div className="mt-2">
                  <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                    {renderIcon(nodeMap.get(selectedNodeId).type, nodeMap.get(selectedNodeId).isSuspicious)}
                    {nodeMap.get(selectedNodeId).label}
                  </h4>
                  {nodeMap.get(selectedNodeId).type === "Case" && nodeMap.get(selectedNodeId).crimeNo && (
                    <p className="text-[11px] font-mono font-bold text-amber-400 mt-0.5">
                      FIR: {nodeMap.get(selectedNodeId).crimeNo}
                    </p>
                  )}
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">ID: {selectedNodeId}</p>
                </div>
              </div>

              <div className="px-4 space-y-3.5 pb-3">
              {/* Contextual metadata */}
              <div className="text-xs space-y-2 bg-slate-900/30 p-2.5 rounded-lg border border-slate-800/60 text-slate-300">
                {nodeMap.get(selectedNodeId).type === "Suspect" && (
                  <>
                    <div className="flex justify-between"><span className="text-slate-500">Demographics:</span><strong>{nodeMap.get(selectedNodeId).age} yrs, {nodeMap.get(selectedNodeId).gender}</strong></div>
                    <div className="flex justify-between"><span className="text-slate-500">Syndicate Level:</span><strong className="text-rose-400">Accused Syndicate Partner</strong></div>
                  </>
                )}
                {nodeMap.get(selectedNodeId).type === "Case" && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between"><span className="text-slate-500">FIR Reference:</span><strong>{nodeMap.get(selectedNodeId).crimeNo}</strong></div>
                    <div className="flex justify-between"><span className="text-slate-500">Reg Date:</span><strong>{nodeMap.get(selectedNodeId).registeredDate}</strong></div>
                    <div className="pt-1.5 border-t border-slate-800 mt-1">
                      <span className="text-slate-500 block mb-0.5">Factual Digest:</span>
                      <p className="text-[11px] leading-normal italic text-slate-400 bg-slate-950 p-2 rounded border border-slate-900">
                        "{nodeMap.get(selectedNodeId).brief}"
                      </p>
                    </div>
                  </div>
                )}
                {nodeMap.get(selectedNodeId).type === "Account" && (
                  <>
                    <div className="flex justify-between"><span className="text-slate-500">Account Owner:</span><strong>{nodeMap.get(selectedNodeId).owner}</strong></div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Risk Assessment:</span>
                      <strong className={nodeMap.get(selectedNodeId).isSuspicious ? "text-rose-400 font-bold animate-pulse" : "text-emerald-400"}>
                        {nodeMap.get(selectedNodeId).isSuspicious ? "Mule Gateway Flagged" : "Standard Account"}
                      </strong>
                    </div>
                  </>
                )}
                {nodeMap.get(selectedNodeId).type === "Victim" && (
                  <>
                    <div className="flex justify-between"><span className="text-slate-500">Demographics:</span><strong>{nodeMap.get(selectedNodeId).age} yrs</strong></div>
                    <div className="flex justify-between"><span className="text-slate-500">Law Enforcement:</span><strong>{nodeMap.get(selectedNodeId).police ? "Yes" : "No"}</strong></div>
                  </>
                )}
              </div>

              {/* Dynamic Action Hop Links */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 block">Direct Syndicate Connections ({directLinks.length})</span>
                {directLinks.length > 0 ? (
                  <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                    {directLinks.map((link) => {
                      const relColor =
                        link.relation === "ASSOCIATE_OF"  ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                        link.relation === "ACCUSED_IN"    ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                        link.relation === "VICTIM_IN"     ? "bg-sky-500/10 text-sky-400 border-sky-500/20" :
                        link.relation === "TRANSACTIONS"  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                        "bg-slate-700/20 text-slate-400 border-slate-700/30";

                      return (
                        <button
                          key={link.edgeId}
                          onClick={() => handleNodeSelect(link.node.id, { expandRelations: true })}
                          className="w-full flex items-center justify-between text-left p-1.5 bg-slate-900/60 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-900 rounded-lg transition-all group cursor-pointer"
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <ArrowRight className="w-3 h-3 text-slate-600 shrink-0 group-hover:text-amber-400 transition-colors" />
                            <div className="truncate">
                              <p className="text-[11px] font-bold text-slate-200 truncate">{link.node.label}</p>
                              <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                                <span className={`text-[8px] px-1 py-0.5 rounded border font-bold ${relColor}`}>
                                  {link.relation.replace(/_/g, " ")}
                                </span>
                                {link.amount ? (
                                  <span className="text-[8px] text-emerald-400 font-mono">₹{formatINR(link.amount)}</span>
                                ) : null}
                              </div>
                            </div>
                          </div>
                          <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-500 italic">No direct connections mapped inside current filters.</p>
                )}
              </div>

              {/* Cross-module action buttons */}
              <div className="space-y-1.5 pt-1">
                <button
                  onClick={() => onSelectNode(nodeMap.get(selectedNodeId))}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 transition active:scale-[0.98]"
                >
                  <span>Request Full Case Sync</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                {nodeMap.get(selectedNodeId).type === "Suspect" && (
                  <button
                    onClick={() => onSelectNode({ ...nodeMap.get(selectedNodeId), _action: "view_profile" })}
                    className="w-full bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 font-bold py-1.5 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View Offender Profile
                  </button>
                )}
                {nodeMap.get(selectedNodeId).type === "Case" && (
                  <button
                    onClick={() => onSelectNode({ ...nodeMap.get(selectedNodeId), _action: "view_decision_support" })}
                    className="w-full bg-amber-600/10 hover:bg-amber-600/20 text-amber-400 border border-amber-500/30 font-bold py-1.5 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    View Decision Support
                  </button>
                )}
              </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-800 rounded-xl bg-slate-900/10 text-slate-500 min-h-[140px]">
              <Info className="w-6 h-6 text-slate-600 mb-2" />
              <p className="text-xs font-semibold">Inspector Inactive</p>
              <p className="text-[10px] text-slate-600 mt-1 max-w-[200px]">Click any node or directory entry to deeply explore active intelligence connections</p>
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Main Presentation Pane — EXPANDED CANVAS SIZE (800px Height) */}
      <div className="lg:col-span-3 flex flex-col min-h-[750px] lg:h-[800px] bg-slate-950/70 border border-slate-800 rounded-xl overflow-hidden relative">
        {/* Dynamic Dual Tab Render */}
        {viewTab === "graph" ? (
          <>
            {/* Background Aesthetic Grids */}
            <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px] opacity-40 pointer-events-none" />

            {/* Quick Action Overlay & Status Alerts */}
            <div className="absolute top-3 left-4 right-4 z-10 flex items-center justify-between pointer-events-none gap-2">
              <div className="bg-slate-900/90 backdrop-blur-md py-1.5 px-3.5 rounded-full border border-slate-800 text-[11px] text-slate-300 flex items-center gap-2 shadow-lg pointer-events-auto">
                <Move className="w-3.5 h-3.5 text-amber-500" />
                <span>Drag canvas to pan | Scroll to zoom | Click nodes to inspect &amp; center</span>
              </div>
              <div className="bg-slate-900/90 backdrop-blur-md py-1.5 px-3.5 rounded-full border border-slate-800 text-[11px] font-bold text-slate-300 flex items-center gap-2 shadow-lg pointer-events-auto">
                <span>Zoom Level:</span>
                <span className="text-amber-400 font-mono">{(zoom * 100).toFixed(0)}%</span>
                <span className="text-slate-600 mx-1">|</span>
                <span className="text-slate-300">{visibleNodeIds.size} / {positionedNodes.length} nodes</span>
              </div>
            </div>

            {/* Float Tactile Zoom Controls */}
            <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 shadow-xl">
              <button
                onClick={() => setZoom(z => Math.min(3.5, z + 0.25))}
                className="p-2.5 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-amber-400 rounded-lg border border-slate-800 transition active:scale-95 cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoom(z => Math.max(0.4, z - 0.25))}
                className="p-2.5 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-amber-400 rounded-lg border border-slate-800 transition active:scale-95 cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={resetPanZoom}
                className="p-2.5 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-amber-400 rounded-lg border border-slate-800 transition active:scale-95 cursor-pointer"
                title="Recenter and Fit View"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  if (expandedNodes.size > positionedNodes.filter(n => n.type === "Case" || n.type === "Suspect").length) {
                    const primary = new Set<string>();
                    positionedNodes.forEach(n => {
                      if (n.type === "Case" || n.type === "Suspect") primary.add(n.id);
                    });
                    setExpandedNodes(primary);
                  } else {
                    setExpandedNodes(new Set(positionedNodes.map(n => n.id)));
                  }
                }}
                className="p-2.5 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-amber-400 rounded-lg border border-slate-800 transition active:scale-95 cursor-pointer"
                title="Toggle: Expand All Nodes / Primary Only"
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>

            {/* EXPANDED SVG CANVAS (2800x1800 ViewBox) */}
            <svg
              ref={svgRef}
              className="w-full h-full cursor-grab active:cursor-grabbing outline-none select-none relative"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
              viewBox="0 0 2800 1800"
            >
              {/* Transform Group carrying zoom and pan offsets */}
              <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>

                {/* 1. RENDER RELATIONSHIP EDGES */}
                {edges.map((edge) => {
                  const srcNode = nodeMap.get(edge.source);
                  const tgtNode = nodeMap.get(edge.target);
                  if (!srcNode || !tgtNode) return null;
                  if (!filteredNodeIds.has(edge.source) || !filteredNodeIds.has(edge.target)) return null;
                  if (!visibleNodeIds.has(edge.source) || !visibleNodeIds.has(edge.target)) return null;

                  const isHighlighted = selectedNodeId
                    ? relatedConnections.edgeIds.has(edge.id)
                    : hoveredNodeId
                      ? hoveredConnections.edgeIds.has(edge.id)
                      : false;
                  const isDimmed = selectedNodeId
                    ? !relatedConnections.edgeIds.has(edge.id)
                    : hoveredNodeId
                      ? !hoveredConnections.edgeIds.has(edge.id)
                      : false;

                  if (isDimmed) return (
                    <line key={edge.id} x1={srcNode.x} y1={srcNode.y} x2={tgtNode.x} y2={tgtNode.y}
                      stroke="rgba(30,41,59,0.25)" strokeWidth={0.5} />
                  );

                  let stroke = "#334155"; let strokeWidth = 1.2; let dash = "";
                  if (edge.relation === "ASSOCIATE_OF")  { stroke = "rgba(16,185,129,0.55)"; dash = "6,4"; }
                  else if (edge.relation === "TRANSACTIONS") { stroke = edge.amount > 100000 ? "rgba(239,68,68,0.85)" : "rgba(239,68,68,0.5)"; strokeWidth = edge.amount > 100000 ? 3 : 2; }
                  else if (edge.relation === "ACCUSED_IN")   { stroke = "rgba(245,158,11,0.55)"; }
                  else if (edge.relation === "VICTIM_IN")    { stroke = "rgba(56,189,248,0.55)"; }
                  else if (edge.relation === "LINKED_TO_CASE") { stroke = "rgba(168,85,247,0.45)"; dash = "4,5"; }

                  if (isHighlighted) { strokeWidth += 2; stroke = stroke.replace(/0\.\d+\)/, "0.95)"); }

                  // Quadratic bezier curve calculation to prevent overlapping edge lines
                  const mx = (srcNode.x + tgtNode.x) / 2;
                  const my = (srcNode.y + tgtNode.y) / 2;
                  const dx = tgtNode.x - srcNode.x;
                  const dy = tgtNode.y - srcNode.y;
                  const len = Math.sqrt(dx * dx + dy * dy) || 1;
                  const curve = 40;
                  const cx = mx - (dy / len) * curve;
                  const cy = my + (dx / len) * curve;

                  return (
                    <g key={edge.id}>
                      <path
                        d={`M ${srcNode.x} ${srcNode.y} Q ${cx} ${cy} ${tgtNode.x} ${tgtNode.y}`}
                        fill="none"
                        stroke={stroke}
                        strokeWidth={strokeWidth}
                        strokeDasharray={dash}
                        className="transition-all duration-300"
                      />
                      {/* Financial amount badge on transactions */}
                      {edge.relation === "TRANSACTIONS" && (isHighlighted || edge.amount > 100000) && (
                        <g transform={`translate(${cx}, ${cy})`}>
                          <rect x="-28" y="-9" width="56" height="18" rx="5" fill="rgba(2,6,23,0.95)" stroke="rgba(239,68,68,0.6)" strokeWidth="0.8" />
                          <text fill="#f87171" fontSize="10" fontWeight="bold" textAnchor="middle" y="4">₹{(edge.amount/1000).toFixed(0)}k</text>
                        </g>
                      )}
                    </g>
                  );
                })}

                {/* 2. RENDER NODES WITH GUARANTEED NON-OVERLAPPING LABELS */}
                {positionedNodes.map((node) => {
                  if (!filteredNodeIds.has(node.id)) return null;
                  if (!visibleNodeIds.has(node.id)) return null;

                  const isHighlighted = selectedNodeId
                    ? relatedConnections.nodeIds.has(node.id)
                    : hoveredNodeId
                      ? hoveredConnections.nodeIds.has(node.id)
                      : false;
                  const isDimmed = selectedNodeId
                    ? !relatedConnections.nodeIds.has(node.id)
                    : hoveredNodeId
                      ? !hoveredConnections.nodeIds.has(node.id)
                      : false;
                  const isSelected = node.id === selectedNodeId;

                  let size = 16;
                  let fill = "#1e293b"; let stroke = "#64748b";
                  if (node.type === "Suspect") { fill = "rgba(6,78,59,0.95)";  stroke = isHighlighted ? "#34d399" : "#10b981"; size = 26; }
                  else if (node.type === "Case")    { fill = "rgba(120,53,15,0.95)"; stroke = isHighlighted ? "#fcd34d" : "#f59e0b"; size = 30; }
                  else if (node.type === "Account") { fill = node.isSuspicious ? "rgba(127,29,29,0.95)" : "rgba(15,23,42,0.95)"; stroke = node.isSuspicious ? "#f87171" : "#475569"; size = 22; }
                  else if (node.type === "Victim")  { fill = "rgba(7,89,133,0.95)";  stroke = isHighlighted ? "#7dd3fc" : "#38bdf8"; size = 23; }
                  if (isSelected) { size += 7; stroke = "#fbbf24"; }

                  // Alternating top / bottom label offset based on node index to eliminate label collisions
                  const isLabelAbove = (node.idx !== undefined ? node.idx : 0) % 2 === 1;
                  const labelYOffset = isLabelAbove ? -(size + 20) : (size + 20);

                  // Label visibility: show on zoom >= 1.5, hover, selection, or highlight
                  const isLabelVisible = zoom >= 1.5 || isSelected || isHighlighted || hoveredNodeId === node.id;

                  return (
                    <g
                      key={node.id}
                      transform={`translate(${node.x}, ${node.y})`}
                      style={{ opacity: isDimmed ? 0.12 : 1, transition: "opacity 0.25s, transform 0.25s" }}
                      className="cursor-pointer group outline-none"
                      onClick={() => handleNodeSelect(node.id, { expandRelations: true })}
                      onMouseEnter={() => setHoveredNodeId(node.id)}
                      onMouseLeave={() => setHoveredNodeId(null)}
                      onKeyDown={(e) => handleKeyDown(e, node.id)}
                      tabIndex={0}
                      role="button"
                      aria-label={`${node.type}: ${node.label}`}
                    >
                      <title>{`${node.type}: ${node.label}${node.age ? ` | Age: ${node.age}` : ""}${node.crimeNo ? ` | FIR: ${node.crimeNo}` : ""}${node.owner ? ` | ${node.owner}` : ""}`}</title>

                      {/* Selection ring animation */}
                      {isSelected && <circle r={size + 10} fill="none" stroke="rgba(251,191,36,0.4)" strokeWidth="2.5" className="animate-ping" />}
                      {isHighlighted && <circle r={size + 6} fill="none" stroke={stroke} strokeWidth="1.5" opacity="0.6" />}

                      {/* Node body circle */}
                      <circle r={size} fill={fill} stroke={stroke} strokeWidth={isSelected ? 3 : isHighlighted ? 2.5 : 2}
                        className="group-hover:stroke-amber-400 transition-all duration-200" />

                      {/* Icon inside node */}
                      <foreignObject x={-size * 0.7} y={-size * 0.7} width={size * 1.4} height={size * 1.4} className="pointer-events-none">
                        <div className="w-full h-full flex items-center justify-center">
                          {renderIcon(node.type, node.isSuspicious)}
                        </div>
                      </foreignObject>

                      {/* Crisp, Highly Readable Node Label Badge — Visible on Zoom >= 1.5, Hover, or Selection */}
                      <g
                        transform={`translate(0, ${labelYOffset})`}
                        style={{ opacity: isLabelVisible ? 1 : 0, transition: "opacity 0.2s ease" }}
                        className="pointer-events-none"
                      >
                        <rect
                          x={-(Math.min(node.label.length, 22) * 4.2 + 12)}
                          y="-10" rx="6"
                          width={(Math.min(node.label.length, 22) * 8.4 + 24)}
                          height="20"
                          fill="rgba(2, 6, 23, 0.96)"
                          stroke={isSelected ? "#fbbf24" : isHighlighted ? stroke : "rgba(71,85,105,0.8)"}
                          strokeWidth={isSelected ? "1.5" : "1"}
                        />
                        <text
                          fill={isSelected ? "#fbbf24" : isHighlighted ? "#ffffff" : "#f1f5f9"}
                          fontSize="12"
                          fontWeight="700"
                          textAnchor="middle"
                          y="4"
                          className="pointer-events-none"
                        >
                          {node.label.length > 22 ? node.label.substring(0, 20) + "…" : node.label}
                        </text>
                      </g>
                    </g>
                  );
                })}
              </g>
            </svg>
          </>
        ) : (
          /* ACCESSIBLE INTERACTIVE RELATIONSHIP DIRECTORY (SYNICADE DIRECTORY) */
          <div className="flex-1 flex flex-col min-h-0 bg-slate-950/90 p-5 overflow-hidden">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
              <div>
                <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
                  <List className="w-5 h-5 text-amber-500" />
                  Syndicate Relationship Directory
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Click any entity row to center, highlight, expand relationships, and inspect directly in graph view</p>
              </div>
              <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
                {filteredNodes.length} Entities Found
              </span>
            </div>

            {/* Filtered Records Grid */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 border border-slate-800/80 rounded-xl bg-slate-950">
              {filteredNodes.length > 0 ? (
                <div className="divide-y divide-slate-900">
                  {filteredNodes.map((node) => {
                    const nodeEdges = edges.filter(e => e.source === node.id || e.target === node.id);

                    return (
                      <div
                        key={node.id}
                        onClick={() => handleDirectoryEntityClick(node.id)}
                        className={`p-3.5 hover:bg-slate-900/80 transition flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer group ${
                          selectedNodeId === node.id ? "bg-amber-500/10 border-l-4 border-amber-500" : ""
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[9px] uppercase px-2 py-0.5 rounded font-extrabold tracking-wider ${
                              node.type === "Suspect" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" :
                              node.type === "Case" ? "bg-amber-500/15 text-amber-400 border border-amber-500/30" :
                              node.type === "Account" ? "bg-rose-500/15 text-rose-400 border border-rose-500/30" :
                              "bg-sky-500/15 text-sky-400 border border-sky-500/30"
                            }`}>
                              {node.type}
                            </span>
                            <span className="text-sm font-bold text-slate-100 group-hover:text-amber-400 transition-colors">
                              {node.label}
                            </span>
                            {node.isSuspicious && (
                              <span className="flex items-center gap-1 text-[9px] bg-rose-500/15 text-rose-400 border border-rose-500/30 px-2 py-0.5 rounded-full animate-pulse font-extrabold">
                                <AlertTriangle className="w-2.5 h-2.5" />
                                HIGH RISK
                              </span>
                            )}
                          </div>
                          
                          {/* Attribute row */}
                          <p className="text-xs text-slate-400">
                            {node.type === "Suspect" && `Demographics: ${node.age} yr old, Gender: ${node.gender}`}
                            {node.type === "Case" && `FIR Reference: ${node.crimeNo} | Registered: ${node.registeredDate}`}
                            {node.type === "Account" && `Bank Owner: ${node.owner} | Flagged: ${node.isSuspicious ? "Yes" : "No"}`}
                            {node.type === "Victim" && `Demographics: ${node.age} yr old | Official: ${node.police ? "Police Staff" : "Civilian"}`}
                          </p>

                          {/* Link tags */}
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            <span className="text-[10px] text-slate-500 font-bold self-center">Connections:</span>
                            {nodeEdges.slice(0, 5).map(e => {
                              const relatedId = e.source === node.id ? e.target : e.source;
                              const matchedLabel = nodes.find(n => n.id === relatedId)?.label || "Unknown";
                              return (
                                <span
                                  key={e.id}
                                  className="text-[9px] bg-slate-900 border border-slate-800 text-slate-300 px-2 py-0.5 rounded flex items-center gap-1 font-mono"
                                >
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500/80"></span>
                                  {e.relation.replace(/_/g, " ")}: {matchedLabel}
                                </span>
                              );
                            })}
                            {nodeEdges.length > 5 && (
                              <span className="text-[9px] text-slate-500 self-center font-bold">+{nodeEdges.length - 5} more</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDirectoryEntityClick(node.id);
                            }}
                            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs transition flex items-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(251,191,36,0.3)] active:scale-95"
                          >
                            <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
                            <span>Center &amp; View in Graph</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500">
                  <Search className="w-8 h-8 text-slate-700 mb-2" />
                  <p className="text-xs font-bold">No Records Match Filters</p>
                  <p className="text-[11px] text-slate-600 mt-1">Try modifying your query or select a different category filter</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
