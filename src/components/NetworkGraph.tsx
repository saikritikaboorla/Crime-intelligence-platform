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
  Link2,
  ChevronRight,
  Info,
  AlertTriangle,
  Move,
  Eye,
  FileText,
  RotateCcw,
  Focus
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
  const [spacingFactor, setSpacingFactor] = useState<number>(1.0);

  // Pan and Zoom State
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

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

  // Render SVG Node positions dynamically
  const positionedNodes = useMemo(() => {
    const width = 800;
    const height = 500;
    const center = { x: width / 2, y: height / 2 };

    if (layoutMode === "circular") {
      return nodes.map((node, index) => {
        let r = 160;
        if (node.type === "Case") r = 90;
        else if (node.type === "Account") r = 230;
        else if (node.type === "Victim") r = 130;

        r = r * spacingFactor;

        const angle = (index / nodes.length) * 2 * Math.PI;
        const x = center.x + r * Math.cos(angle) + (Math.sin(index * 4) * 20);
        const y = center.y + r * Math.sin(angle) + (Math.cos(index * 4) * 20);

        return { ...node, x, y };
      });
    } else {
      // Hierarchy layout: Top (Cases) -> Middle (Suspects/Victims) -> Bottom (Accounts)
      const cases = nodes.filter(n => n.type === "Case");
      const people = nodes.filter(n => n.type === "Suspect" || n.type === "Victim");
      const accounts = nodes.filter(n => n.type === "Account");

      return nodes.map(node => {
        let x = center.x;
        let y = center.y;

        if (node.type === "Case") {
          const idx = cases.findIndex(n => n.id === node.id);
          const count = cases.length;
          const segment = width / (count + 1 || 1);
          x = segment * (idx + 1);
          y = 90;
        } else if (node.type === "Suspect" || node.type === "Victim") {
          const idx = people.findIndex(n => n.id === node.id);
          const count = people.length;
          const segment = width / (count + 1 || 1);
          x = segment * (idx + 1);
          y = 250;
        } else if (node.type === "Account") {
          const idx = accounts.findIndex(n => n.id === node.id);
          const count = accounts.length;
          const segment = width / (count + 1 || 1);
          x = segment * (idx + 1);
          y = 410;
        }

        // Apply relative spacing scale from center
        x = center.x + (x - center.x) * spacingFactor;
        y = center.y + (y - center.y) * spacingFactor;

        return { ...node, x, y };
      });
    }
  }, [nodes, spacingFactor, layoutMode]);

  const nodeMap = useMemo(() => {
    const map = new Map<string, any>();
    positionedNodes.forEach(n => map.set(n.id, n));
    return map;
  }, [positionedNodes]);

  // Interactive direct connections list for selected node details traversal
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

  // Auto-focus selected node in directory list or center it
  const handleNodeSelect = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    const node = nodeMap.get(nodeId);
    if (node) {
      onSelectNode(node);
      // Recenter pan around node coordinates to put it visually center
      setPan({ x: 400 - node.x * zoom, y: 250 - node.y * zoom });
    }
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button !== 0) return; // Only left click drags
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
    setZoom(Math.max(0.3, Math.min(3.0, nextZoom)));
  };

  const resetPanZoom = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
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

  // Keyboard accessibility handler for nodes
  const handleKeyDown = (e: React.KeyboardEvent, nodeId: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleNodeSelect(nodeId);
    }
  };

  // Helper: is this node a high-risk suspect?
  const isHighRisk = (label: string) =>
    label.includes("Ramesh") || label.includes("Suresh");

  // Format Indian rupee amounts
  const formatINR = (amount: number) => {
    return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(amount);
  };

  // Empty / loading state
  if (!nodes || nodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
        <Network className="w-12 h-12 text-slate-600" />
        <div className="text-sm font-bold text-slate-400">Loading Criminal Network</div>
        <p className="text-xs text-slate-500">Fetching relationship graph from KSP database...</p>
        <div className="h-1 w-40 rounded bg-slate-800 animate-pulse mt-2" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Sidebar Controls & Refined Details */}
      <div className="bg-slate-900/60 backdrop-blur-md p-5 border border-slate-800 rounded-xl flex flex-col space-y-5 h-full">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold tracking-wider uppercase text-amber-500 flex items-center gap-2">
            <Sliders className="w-4 h-4" />
            Control Hub
          </h3>
          <div className="bg-slate-950/80 p-0.5 rounded-lg border border-slate-800 flex items-center">
            <button
              onClick={() => setViewTab("graph")}
              className={`p-1 rounded-md text-xs transition ${
                viewTab === "graph"
                  ? "bg-amber-500/20 text-amber-400"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Interactive Graphic Network"
            >
              <Network className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewTab("directory")}
              className={`p-1 rounded-md text-xs transition ${
                viewTab === "directory"
                  ? "bg-amber-500/20 text-amber-400"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Accessible Relationship Registry"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
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
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 pl-9 pr-3 text-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 placeholder-slate-600"
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
                <span className="text-[10px] text-slate-500 font-bold">{(spacingFactor * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.8"
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

        {/* Detailed Relationship Inspector / Panel */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-4 pt-3 border-t border-slate-800/60 scrollbar-thin scrollbar-thumb-slate-800">
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
                  {/* FIR number prominent for cases */}
                  {nodeMap.get(selectedNodeId).type === "Case" && nodeMap.get(selectedNodeId).crimeNo && (
                    <p className="text-[11px] font-mono font-bold text-amber-400 mt-0.5">
                      FIR: {nodeMap.get(selectedNodeId).crimeNo}
                    </p>
                  )}
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">ID: {selectedNodeId}</p>
                </div>
              </div>

              <div className="px-4 space-y-3.5">
              {/* Entity-specific contextual metadata */}
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

              {/* Dynamic Action Hop Links to Traverse Network */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 block">Direct Syndicate Connections ({directLinks.length})</span>
                {directLinks.length > 0 ? (
                  <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                    {directLinks.map((link) => {
                      // Relation badge colors
                      const relColor =
                        link.relation === "ASSOCIATE_OF"  ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                        link.relation === "ACCUSED_IN"    ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                        link.relation === "VICTIM_IN"     ? "bg-sky-500/10 text-sky-400 border-sky-500/20" :
                        link.relation === "TRANSACTIONS"  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                        "bg-slate-700/20 text-slate-400 border-slate-700/30";

                      return (
                        <button
                          key={link.edgeId}
                          onClick={() => handleNodeSelect(link.node.id)}
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
            <div className="h-full flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-800 rounded-xl bg-slate-900/10 text-slate-500">
              <Info className="w-6 h-6 text-slate-600 mb-2" />
              <p className="text-xs font-semibold">Inspector Inactive</p>
              <p className="text-[10px] text-slate-600 mt-1 max-w-[200px]">Click any node or register entry to deeply explore active intelligence connections</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Presentation Pane (Interactive SVG Canvas OR Registry Table) */}
      <div className="lg:col-span-3 flex flex-col h-[520px] bg-slate-950/60 border border-slate-800 rounded-xl overflow-hidden relative">
        {/* Dynamic Dual Tab Render */}
        {viewTab === "graph" ? (
          <>
            {/* Background Aesthetic Grids */}
            <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

            {/* Quick Action Overlay & Status Alerts */}
            <div className="absolute top-3 left-4 right-4 z-10 flex items-center justify-between pointer-events-none gap-2">
              <div className="bg-slate-900/90 backdrop-blur-md py-1 px-3 rounded-full border border-slate-800 text-[10px] text-slate-400 flex items-center gap-1.5 shadow-lg pointer-events-auto">
                <Move className="w-3 h-3 text-amber-500" />
                <span>Drag to pan | Scroll to zoom | Tab to select nodes</span>
              </div>
              <div className="bg-slate-900/90 backdrop-blur-md py-1 px-3 rounded-full border border-slate-800 text-[10px] font-bold text-slate-300 flex items-center gap-1.5 shadow-lg pointer-events-auto">
                <span>Zoom Scale:</span>
                <span className="text-amber-400">{(zoom * 100).toFixed(0)}%</span>
              </div>
            </div>

            {/* Float Tactile Zoom Controls */}
            <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-1.5 bg-slate-900/80 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 shadow-xl">
              <button
                onClick={() => setZoom(z => Math.min(3.0, z + 0.1))}
                className="p-2 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 transition active:scale-95"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoom(z => Math.max(0.3, z - 0.1))}
                className="p-2 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 transition active:scale-95"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={resetPanZoom}
                className="p-2 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 transition active:scale-95"
                title="Recenter and Fit"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>

            {/* Main Interactive Canvas */}
            <svg
              ref={svgRef}
              className="w-full h-full cursor-grab active:cursor-grabbing outline-none select-none relative"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onWheel={handleWheel}
              viewBox="0 0 800 500"
            >
              {/* Transform Group carrying the zoom and panning offsets */}
              <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                
                {/* 1. RENDER RELATIONSHIP EDGES */}
                {edges.map((edge) => {
                  const srcNode = nodeMap.get(edge.source);
                  const tgtNode = nodeMap.get(edge.target);

                  if (!srcNode || !tgtNode) return null;

                  // Highlight logic
                  let isHighlighted = false;
                  let isDimmed = false;
                  if (selectedNodeId) {
                    if (relatedConnections.edgeIds.has(edge.id)) {
                      isHighlighted = true;
                    } else {
                      isDimmed = true;
                    }
                  }

                  // Customize visual weights & color channels
                  let strokeColor = "stroke-slate-800";
                  let strokeWidth = 1.2;
                  let strokeDasharray = "";

                  if (edge.relation === "ASSOCIATE_OF") {
                    strokeColor = "stroke-emerald-500/40";
                    strokeDasharray = "4,4";
                  } else if (edge.relation === "TRANSACTIONS") {
                    strokeColor = edge.amount > 100000 ? "stroke-rose-500/60" : "stroke-rose-400/40";
                    strokeWidth = edge.amount > 100000 ? 2.5 : 1.8;
                  } else if (edge.relation === "ACCUSED_IN") {
                    strokeColor = "stroke-amber-500/40";
                  } else if (edge.relation === "VICTIM_IN") {
                    strokeColor = "stroke-sky-500/40";
                  }

                  if (isHighlighted) {
                    strokeColor = strokeColor.includes("rose") ? "stroke-rose-400" :
                                 strokeColor.includes("emerald") ? "stroke-emerald-400" :
                                 strokeColor.includes("sky") ? "stroke-sky-400" :
                                 "stroke-amber-400";
                    strokeWidth += 1.2;
                  } else if (isDimmed) {
                    strokeColor = "stroke-slate-900/10";
                    strokeWidth = 0.5;
                  }

                  return (
                    <g key={edge.id} className="transition-all duration-300">
                      <line
                        x1={srcNode.x}
                        y1={srcNode.y}
                        x2={tgtNode.x}
                        y2={tgtNode.y}
                        className={`${strokeColor} transition-all duration-300`}
                        strokeWidth={strokeWidth}
                        strokeDasharray={strokeDasharray}
                      />
                      {/* Financial transaction label */}
                      {edge.relation === "TRANSACTIONS" && (isHighlighted || !selectedNodeId) && (
                        <g transform={`translate(${(srcNode.x + tgtNode.x) / 2}, ${(srcNode.y + tgtNode.y) / 2})`}>
                          <rect
                            x="-22"
                            y="-7"
                            width="44"
                            height="14"
                            rx="4"
                            className="fill-slate-950/90 stroke-slate-800/80 stroke-[0.5]"
                          />
                          <text
                            fill="#f43f5e"
                            fontSize="8"
                            fontWeight="bold"
                            textAnchor="middle"
                            y="3"
                          >
                            ₹{(edge.amount / 1000).toFixed(0)}k
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}

                {/* 2. RENDER STATIONS / ENTITY NODES */}
                {positionedNodes.map((node) => {
                  let isHighlighted = false;
                  let isDimmed = false;
                  let isFiltered = filteredNodeIds.has(node.id);

                  if (selectedNodeId) {
                    if (relatedConnections.nodeIds.has(node.id)) {
                      isHighlighted = true;
                    } else {
                      isDimmed = true;
                    }
                  }

                  // Determine colors and sizes
                  let size = 16;
                  let fillColor = "fill-slate-900";
                  let strokeColor = "stroke-slate-600";

                  if (node.type === "Suspect") {
                    fillColor = "fill-emerald-950/90";
                    strokeColor = "stroke-emerald-400";
                    size = 18;
                  } else if (node.type === "Case") {
                    fillColor = "fill-amber-950/90";
                    strokeColor = "stroke-amber-400";
                    size = 20;
                  } else if (node.type === "Account") {
                    fillColor = node.isSuspicious ? "fill-rose-950/90" : "fill-slate-900/90";
                    strokeColor = node.isSuspicious ? "stroke-rose-500" : "stroke-slate-500";
                    size = 15;
                  } else if (node.type === "Victim") {
                    fillColor = "fill-sky-950/90";
                    strokeColor = "stroke-sky-400";
                    size = 15;
                  }

                  if (isHighlighted) {
                    size += 4;
                  }

                  // Visibility class
                  let opacityClass = "transition-all duration-300";
                  if (isDimmed) opacityClass += " opacity-25 scale-90";
                  if (!isFiltered) opacityClass += " opacity-10";

                  return (
                    <g
                      key={node.id}
                      transform={`translate(${node.x}, ${node.y})`}
                      className={`${opacityClass} cursor-pointer group outline-none`}
                      onClick={() => handleNodeSelect(node.id)}
                      onKeyDown={(e) => handleKeyDown(e, node.id)}
                      tabIndex={isFiltered ? 0 : -1}
                      role="button"
                      aria-label={`${node.type} Node: ${node.label}`}
                    >
                      <title>{`${node.type}: ${node.label} ${node.age ? `, Age: ${node.age}` : ""}`}</title>
                      
                      {/* Ripple Halo effect on hovered or highlighted items */}
                      {isHighlighted && (
                        <circle
                          r={size + 8}
                          className="fill-none stroke-amber-400/25 stroke-[1] animate-ping"
                        />
                      )}

                      <circle
                        r={size}
                        className={`${fillColor} ${strokeColor} stroke-[2] group-hover:stroke-amber-400 transition-all shadow-xl`}
                      />
                      
                      <foreignObject
                        x={-size}
                        y={-size}
                        width={size * 2}
                        height={size * 2}
                        className="pointer-events-none"
                      >
                        <div className="w-full h-full flex items-center justify-center">
                          {renderIcon(node.type, node.isSuspicious)}
                        </div>
                      </foreignObject>

                      {/* Clean display typography labels */}
                      <g transform={`translate(0, ${size + 14})`}>
                        <rect
                          x="-45"
                          y="-7"
                          width="90"
                          height="14"
                          rx="4"
                          className="fill-slate-950/80 stroke-slate-900/40 stroke-[0.5] group-hover:fill-slate-900 transition-colors"
                        />
                        <text
                          className="fill-slate-200 font-bold text-[9px] pointer-events-none"
                          textAnchor="middle"
                          y="3"
                        >
                          {node.label.length > 15 ? `${node.label.substring(0, 12)}...` : node.label}
                        </text>
                      </g>
                    </g>
                  );
                })}
              </g>
            </svg>
          </>
        ) : (
          /* ACCESSIBLE INTERACTIVE RELATIONSHIP DIRECTORY */
          <div className="flex-1 flex flex-col min-h-0 bg-slate-950/80 p-5 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                  <List className="w-4 h-4 text-amber-500" />
                  Syndicate Relationship Directory
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Fully accessible relationship register of all mapped law enforcement entities</p>
              </div>
              <span className="text-[10px] text-slate-500 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                Count: {filteredNodes.length} visible
              </span>
            </div>

            {/* Filtered Records Grid */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800 border border-slate-800/80 rounded-xl bg-slate-950">
              {filteredNodes.length > 0 ? (
                <div className="divide-y divide-slate-900">
                  {filteredNodes.map((node) => {
                    // Gather this node's direct edges
                    const nodeEdges = edges.filter(e => e.source === node.id || e.target === node.id);

                    return (
                      <div
                        key={node.id}
                        className={`p-3 hover:bg-slate-900/40 transition flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                          selectedNodeId === node.id ? "bg-amber-500/5 border-l-2 border-amber-500" : ""
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-[8px] uppercase px-1.5 py-0.5 rounded font-extrabold ${
                              node.type === "Suspect" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                              node.type === "Case" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                              node.type === "Account" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                              "bg-sky-500/10 text-sky-400 border border-sky-500/20"
                            }`}>
                              {node.type}
                            </span>
                            <span className="text-xs font-bold text-slate-100">{node.label}</span>
                            {node.isSuspicious && (
                              <span className="flex items-center gap-0.5 text-[8px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1 rounded animate-pulse font-bold">
                                <AlertTriangle className="w-2 h-2" />
                                HIGH RISK
                              </span>
                            )}
                          </div>
                          
                          {/* Attribute row */}
                          <p className="text-[11px] text-slate-400">
                            {node.type === "Suspect" && `Demographics: ${node.age} yr old, Gender: ${node.gender}`}
                            {node.type === "Case" && `FIR Reference: ${node.crimeNo} | Registered: ${node.registeredDate}`}
                            {node.type === "Account" && `Bank Owner: ${node.owner} | Flagged: ${node.isSuspicious ? "Yes" : "No"}`}
                            {node.type === "Victim" && `Demographics: ${node.age} yr old | Official: ${node.police ? "Police Staff" : "Civilian"}`}
                          </p>

                          {/* Link tags */}
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            <span className="text-[9px] text-slate-500 font-bold self-center">Connections:</span>
                            {nodeEdges.slice(0, 4).map(e => {
                              const relatedId = e.source === node.id ? e.target : e.source;
                              const matchedLabel = nodes.find(n => n.id === relatedId)?.label || "Unknown";
                              return (
                                <span
                                  key={e.id}
                                  className="text-[9px] bg-slate-900 border border-slate-800 text-slate-400 px-1.5 py-0.5 rounded flex items-center gap-1"
                                >
                                  <span className="w-1 h-1 rounded-full bg-slate-500"></span>
                                  {e.relation.replace("_", " ")}: {matchedLabel}
                                </span>
                              );
                            })}
                            {nodeEdges.length > 4 && (
                              <span className="text-[9px] text-slate-600 self-center font-semibold">+{nodeEdges.length - 4} more</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setViewTab("graph");
                              handleNodeSelect(node.id);
                            }}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-amber-400 border border-slate-800 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                          >
                            <span>Trace on Graph</span>
                            <Network className="w-3.5 h-3.5" />
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
