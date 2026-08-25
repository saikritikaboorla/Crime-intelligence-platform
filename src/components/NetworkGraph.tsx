import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useLanguage } from "../context/LanguageContext";
import {
  Shield, User, HelpCircle, ArrowRight, DollarSign,
  ZoomIn, ZoomOut, Maximize2, Sliders, Search, Network,
  List, ChevronRight, Info, AlertTriangle, Move, Eye,
  FileText, RotateCcw, Focus, Layers, Sparkles,
  ChevronDown, ChevronUp, Filter, Calendar, MapPin,
  Phone, Car, Building, CreditCard, Package, Clock,
  BarChart3, Users2, GitBranch, X, CheckCircle2, Lightbulb
} from "lucide-react";

interface NetworkGraphProps {
  nodes: any[];
  edges: any[];
  onSelectNode: (node: any) => void;
}

// Entity Types based on CSV data
type EntityType = 
  | "Person" 
  | "Suspect" 
  | "Victim" 
  | "Case" 
  | "Phone" 
  | "SIM" 
  | "IMEI" 
  | "Vehicle" 
  | "BankAccount" 
  | "UPI" 
  | "Address" 
  | "Location" 
  | "Organisation" 
  | "Device" 
  | "Weapon" 
  | "Evidence"
  | "Witness";

// Relationship Types based on crime intelligence analysis
type RelationType = 
  | "OWNS" 
  | "USES" 
  | "INVOLVED_IN" 
  | "CALLED" 
  | "TRANSFERRED_TO" 
  | "VISITED" 
  | "ASSOCIATED_WITH" 
  | "SEEN_AT" 
  | "ACCUSED_IN" 
  | "VICTIM_IN" 
  | "WITNESS_TO" 
  | "OPERATED" 
  | "LOCATED_AT" 
  | "CONNECTED_TO" 
  | "RELATED_TO";

interface EntityNode {
  id: string;
  type: EntityType;
  label: string;
  data?: Record<string, any>;
  importance?: number;
  community?: number;
}

interface RelationshipEdge {
  id: string;
  source: string;
  target: string;
  relation: RelationType;
  weight?: number;
  color?: string;
  label?: string;
  data?: Record<string, any>;
}

// Entity type configuration
const ENTITY_CONFIG: Record<EntityType, {
  color: string;
  glowColor: string;
  icon: React.ReactNode;
  baseSize: number;
  label: string;
  clusterAngle: number;
  ring: number; // which ring 0=center,1=inner,2=mid,3=outer
}> = {
  Case:         { color: "#f59e0b", glowColor: "rgba(245,158,11,0.15)", icon: <Shield className="w-4 h-4" />, baseSize: 14, label: "FIR/Case",     clusterAngle: 0,   ring: 1 },
  Suspect:      { color: "#ef4444", glowColor: "rgba(239,68,68,0.15)",   icon: <User className="w-4 h-4" />,   baseSize: 11, label: "Suspect",       clusterAngle: 45,  ring: 2 },
  Victim:       { color: "#3b82f6", glowColor: "rgba(59,130,246,0.15)",  icon: <User className="w-4 h-4" />,   baseSize: 10, label: "Victim",        clusterAngle: 90,  ring: 2 },
  Witness:      { color: "#8b5cf6", glowColor: "rgba(139,92,246,0.15)",  icon: <User className="w-4 h-4" />,   baseSize: 9,  label: "Witness",       clusterAngle: 135, ring: 2 },
  BankAccount:  { color: "#10b981", glowColor: "rgba(16,185,129,0.15)",  icon: <CreditCard className="w-4 h-4" />, baseSize: 9, label: "Bank Account", clusterAngle: 180, ring: 3 },
  Phone:        { color: "#f97316", glowColor: "rgba(249,115,22,0.15)",  icon: <Phone className="w-4 h-4" />,  baseSize: 8,  label: "Phone",         clusterAngle: 225, ring: 3 },
  Vehicle:      { color: "#06b6d4", glowColor: "rgba(6,182,212,0.15)",   icon: <Car className="w-4 h-4" />,    baseSize: 9,  label: "Vehicle",       clusterAngle: 270, ring: 3 },
  Location:     { color: "#84cc16", glowColor: "rgba(132,204,26,0.15)",  icon: <MapPin className="w-4 h-4" />, baseSize: 8,  label: "Location",      clusterAngle: 315, ring: 3 },
  Organisation: { color: "#6366f1", glowColor: "rgba(99,102,241,0.15)",  icon: <Building className="w-4 h-4" />, baseSize: 10, label: "Organisation", clusterAngle: 0,  ring: 3 },
  Person:       { color: "#64748b", glowColor: "rgba(100,116,139,0.15)", icon: <User className="w-4 h-4" />,   baseSize: 9,  label: "Person",        clusterAngle: 45,  ring: 2 },
  SIM:          { color: "#a855f7", glowColor: "rgba(168,85,247,0.15)",  icon: <Phone className="w-4 h-4" />,  baseSize: 7,  label: "SIM",           clusterAngle: 90,  ring: 3 },
  IMEI:         { color: "#d946ef", glowColor: "rgba(217,70,239,0.15)",  icon: <Phone className="w-4 h-4" />,  baseSize: 7,  label: "IMEI",          clusterAngle: 135, ring: 3 },
  UPI:          { color: "#f43f5e", glowColor: "rgba(244,63,94,0.15)",   icon: <DollarSign className="w-4 h-4" />, baseSize: 8, label: "UPI",         clusterAngle: 180, ring: 3 },
  Address:      { color: "#14b8a6", glowColor: "rgba(20,184,166,0.15)",  icon: <MapPin className="w-4 h-4" />, baseSize: 8,  label: "Address",       clusterAngle: 225, ring: 3 },
  Device:       { color: "#22c55e", glowColor: "rgba(34,197,94,0.15)",   icon: <Phone className="w-4 h-4" />,  baseSize: 8,  label: "Device",        clusterAngle: 270, ring: 3 },
  Weapon:       { color: "#dc2626", glowColor: "rgba(220,38,38,0.15)",   icon: <AlertTriangle className="w-4 h-4" />, baseSize: 8, label: "Weapon",  clusterAngle: 315, ring: 3 },
  Evidence:     { color: "#eab308", glowColor: "rgba(234,179,8,0.15)",   icon: <Package className="w-4 h-4" />, baseSize: 7,  label: "Evidence",     clusterAngle: 0,   ring: 3 },
};

// Relationship type configuration
const RELATION_CONFIG: Record<RelationType, {
  color: string;
  dash: string;
  opacity: number;
  label: string;
}> = {
  OWNS:           { color: "#10b981", dash: "",    opacity: 0.30, label: "OWNS" },
  USES:           { color: "#6366f1", dash: "5,3", opacity: 0.22, label: "USES" },
  INVOLVED_IN:    { color: "#f59e0b", dash: "",    opacity: 0.35, label: "INVOLVED_IN" },
  CALLED:         { color: "#8b5cf6", dash: "3,3", opacity: 0.22, label: "CALLED" },
  TRANSFERRED_TO: { color: "#ef4444", dash: "",    opacity: 0.35, label: "TRANSFERRED_TO" },
  VISITED:        { color: "#06b6d4", dash: "5,5", opacity: 0.20, label: "VISITED" },
  ASSOCIATED_WITH:{ color: "#a855f7", dash: "4,4", opacity: 0.25, label: "ASSOCIATED_WITH" },
  SEEN_AT:        { color: "#14b8a6", dash: "3,3", opacity: 0.20, label: "SEEN_AT" },
  ACCUSED_IN:     { color: "#dc2626", dash: "",    opacity: 0.35, label: "ACCUSED_IN" },
  VICTIM_IN:      { color: "#3b82f6", dash: "",    opacity: 0.30, label: "VICTIM_IN" },
  WITNESS_TO:     { color: "#84cc16", dash: "5,3", opacity: 0.25, label: "WITNESS_TO" },
  OPERATED:       { color: "#f97316", dash: "4,2", opacity: 0.22, label: "OPERATED" },
  LOCATED_AT:     { color: "#eab308", dash: "",    opacity: 0.25, label: "LOCATED_AT" },
  CONNECTED_TO:   { color: "#64748b", dash: "5,5", opacity: 0.18, label: "CONNECTED_TO" },
  RELATED_TO:     { color: "#78716c", dash: "3,3", opacity: 0.18, label: "RELATED_TO" },
};

// ─── Improved force-directed + ring-anchored layout ─────────────────────────
function computeImprovedLayout(
  nodes: any[],
  edges: any[],
  centerX: number,
  centerY: number,
  canvasWidth: number,
  canvasHeight: number
): { id: string; x: number; y: number }[] {
  if (!nodes.length) return [];

  const nodeCount = nodes.length;

  // Compute degree centrality for each node
  const degree: Record<string, number> = {};
  nodes.forEach(n => { degree[n.id] = 0; });
  edges.forEach(e => {
    if (degree[e.source] !== undefined) degree[e.source]++;
    if (degree[e.target] !== undefined) degree[e.target]++;
  });

  // Assign ring based on entity type and degree
  const getTargetRing = (node: any): number => {
    const config = ENTITY_CONFIG[node.type as EntityType] || ENTITY_CONFIG.Person;
    return config.ring;
  };

  // Group nodes by ring
  const ring1Nodes = nodes.filter(n => getTargetRing(n) === 1); // Cases
  const ring2Nodes = nodes.filter(n => getTargetRing(n) === 2); // People
  const ring3Nodes = nodes.filter(n => getTargetRing(n) === 3); // Assets/Accounts

  // Calculate ring radii based on canvas size
  const maxRadius = Math.min(canvasWidth, canvasHeight) * 0.44;
  const ring1Radius = maxRadius * 0.22;
  const ring2Radius = maxRadius * 0.50;
  const ring3Radius = maxRadius * 0.88;

  // Initialize positions with evenly-spaced ring placement
  const pos: Record<string, { x: number; y: number; vx: number; vy: number }> = {};
  const ringPos: Record<string, { r: number; angle: number }> = {}; // anchor positions

  const placeRing = (ringNodes: any[], radius: number, startAngle: number = 0) => {
    const count = ringNodes.length;
    if (count === 0) return;
    const step = (2 * Math.PI) / count;
    // Sort by degree desc so high-degree nodes get "prime" positions
    const sorted = [...ringNodes].sort((a, b) => (degree[b.id] || 0) - (degree[a.id] || 0));
    sorted.forEach((node, i) => {
      const angle = startAngle + i * step;
      // Add small jitter to prevent perfect alignment issues
      const jitter = (Math.random() - 0.5) * (radius * 0.08);
      const r = radius + jitter;
      const x = centerX + Math.cos(angle) * r;
      const y = centerY + Math.sin(angle) * r;
      pos[node.id] = { x, y, vx: 0, vy: 0 };
      ringPos[node.id] = { r: radius, angle };
    });
  };

  placeRing(ring1Nodes, ring1Radius, 0);
  placeRing(ring2Nodes, ring2Radius, Math.PI / 12);
  placeRing(ring3Nodes, ring3Radius, Math.PI / 8);

  // Any nodes not placed yet
  nodes.forEach(n => {
    if (!pos[n.id]) {
      const angle = Math.random() * 2 * Math.PI;
      const r = maxRadius * 0.65;
      pos[n.id] = {
        x: centerX + Math.cos(angle) * r,
        y: centerY + Math.sin(angle) * r,
        vx: 0, vy: 0
      };
      ringPos[n.id] = { r, angle };
    }
  });

  // Build adjacency for spring forces
  const adjEdges: { source: string; target: string }[] = edges.map(e => ({ source: e.source, target: e.target }));

  // Force simulation parameters
  const iterations = 180;
  // Node radii for collision (based on type + degree)
  const getNodeRadius = (nodeId: string): number => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return 12;
    const config = ENTITY_CONFIG[node.type as EntityType] || ENTITY_CONFIG.Person;
    const d = degree[nodeId] || 0;
    const hubBonus = Math.min(d * 1.5, 12);
    return config.baseSize + hubBonus + 8; // collision padding
  };

  // Ideal spring distance based on type compatibility
  const springLength = (a: string, b: string): number => {
    const na = nodes.find(n => n.id === a);
    const nb = nodes.find(n => n.id === b);
    if (!na || !nb) return 80;
    const rA = getTargetRing(na);
    const rB = getTargetRing(nb);
    if (rA === rB) return 60; // same ring: shorter spring
    return 90; // different rings: longer spring
  };

  for (let iter = 0; iter < iterations; iter++) {
    const alpha = 1 - iter / iterations; // cooling factor
    const repulsionStrength = 3200 + alpha * 6000; // stronger early, weaker late
    const ringAnchorStrength = 0.015 + (1 - alpha) * 0.045; // strengthen anchor over time
    const springStrength = 0.04;
    const damping = 0.75;

    const ids = Object.keys(pos);

    // 1. Repulsion between ALL node pairs
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = pos[ids[i]];
        const b = pos[ids[j]];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distSq = dx * dx + dy * dy;
        const dist = Math.sqrt(distSq) || 0.01;
        const minDist = getNodeRadius(ids[i]) + getNodeRadius(ids[j]);

        const force = repulsionStrength / (distSq + 1);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        a.vx -= fx;
        a.vy -= fy;
        b.vx += fx;
        b.vy += fy;

        // Extra collision push-apart when overlapping
        if (dist < minDist) {
          const overlap = (minDist - dist) * 0.6;
          const cx = (dx / dist) * overlap;
          const cy = (dy / dist) * overlap;
          a.x -= cx * 0.5;
          a.y -= cy * 0.5;
          b.x += cx * 0.5;
          b.y += cy * 0.5;
        }
      }
    }

    // 2. Spring attraction along edges
    adjEdges.forEach(edge => {
      const a = pos[edge.source];
      const b = pos[edge.target];
      if (!a || !b) return;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
      const ideal = springLength(edge.source, edge.target);
      const delta = dist - ideal;
      const force = springStrength * delta;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      a.vx += fx;
      a.vy += fy;
      b.vx -= fx;
      b.vy -= fy;
    });

    // 3. Ring anchor (pull towards assigned ring radius)
    ids.forEach(id => {
      const p = pos[id];
      const anchor = ringPos[id];
      if (!anchor) return;
      const dx = p.x - centerX;
      const dy = p.y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
      const radialError = dist - anchor.r;
      // Push/pull radially towards target ring
      const fx = (dx / dist) * radialError * ringAnchorStrength;
      const fy = (dy / dist) * radialError * ringAnchorStrength;
      p.vx -= fx;
      p.vy -= fy;
    });

    // 4. Apply velocity with damping and bounds check
    ids.forEach(id => {
      const p = pos[id];
      p.vx *= damping;
      p.vy *= damping;
      // Cap velocity to prevent explosions
      const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (speed > 15) { p.vx = (p.vx / speed) * 15; p.vy = (p.vy / speed) * 15; }
      p.x += p.vx;
      p.y += p.vy;
      // Soft boundary
      const margin = 60;
      if (p.x < margin)             p.vx += (margin - p.x) * 0.1;
      if (p.x > canvasWidth - margin) p.vx -= (p.x - (canvasWidth - margin)) * 0.1;
      if (p.y < margin)             p.vy += (margin - p.y) * 0.1;
      if (p.y > canvasHeight - margin) p.vy -= (p.y - (canvasHeight - margin)) * 0.1;
    });
  }

  return nodes.map(n => ({
    id: n.id,
    x: pos[n.id]?.x ?? centerX,
    y: pos[n.id]?.y ?? centerY,
  }));
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function NetworkGraph({ nodes, edges, onSelectNode }: NetworkGraphProps) {
  const { t, language } = useLanguage();
  
  // UI State
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ svgX: number; svgY: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<EntityType | "All">("All");
  const [filterRelation, setFilterRelation] = useState<RelationType | "All">("All");
  const [viewTab, setViewTab] = useState<"graph" | "directory">("graph");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isGraphFocused, setIsGraphFocused] = useState(false); // for scroll disambiguation
  
  // Graph statistics
  const [graphStats, setGraphStats] = useState({
    nodes: 0,
    edges: 0,
    communities: 0,
    density: 0,
    hubCount: 0,
  });

  // Pan/Zoom state
  const [zoom, setZoom] = useState(0.8);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isAnimating, setIsAnimating] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Refs
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef(0.8);
  const panRef = useRef({ x: 0, y: 0 });
  // Queued focus: set by handleDirectoryClick, consumed by the graph-ready useEffect
  const pendingFocusNodeId = useRef<string | null>(null);

  // Update refs when state changes
  useEffect(() => {
    zoomRef.current = zoom;
    panRef.current = pan;
  }, [zoom, pan]);

  // ── Transform raw API data to property graph ─────────────────────────────
  const propertyGraph = useMemo(() => {
    const entityNodes: EntityNode[] = [];
    const relationshipEdges: RelationshipEdge[] = [];
    const nodeMap = new Map<string, EntityNode>();

    nodes.forEach((node) => {
      let entityType: EntityType = "Person";
      let entityData: Record<string, any> = {};

      if (node.type === "Case") {
        entityType = "Case";
        entityData = {
          caseId: node.id,
          crimeNo: node.crimeNo,
          date: node.date,
          brief: node.brief,
          type: node.type
        };
      } else if (node.type === "Suspect") {
        entityType = "Suspect";
        entityData = {
          personId: node.personId,
          age: node.age,
          gender: node.gender
        };
      } else if (node.type === "Victim") {
        entityType = "Victim";
        entityData = {
          victimId: node.id,
          age: node.age,
          police: node.police
        };
      } else if (node.type === "Account") {
        entityType = "BankAccount";
        entityData = {
          accountNumber: node.label,
          owner: node.owner,
          suspicious: node.suspicious
        };
      }

      const entityNode: EntityNode = {
        id: node.id,
        type: entityType,
        label: node.label,
        data: entityData
      };

      entityNodes.push(entityNode);
      nodeMap.set(node.id, entityNode);
    });

    edges.forEach((edge, idx) => {
      let relationType: RelationType = "CONNECTED_TO";
      switch (edge.relation) {
        case "ACCUSED_IN":     relationType = "ACCUSED_IN"; break;
        case "VICTIM_IN":      relationType = "VICTIM_IN"; break;
        case "TRANSACTION":    relationType = "TRANSFERRED_TO"; break;
        case "ASSOCIATE_OF":   relationType = "ASSOCIATED_WITH"; break;
        case "LINKED_TO_CASE": relationType = "INVOLVED_IN"; break;
        default:               relationType = "CONNECTED_TO";
      }

      relationshipEdges.push({
        id: edge.id || `edge-${idx}`,
        source: edge.source,
        target: edge.target,
        relation: relationType,
        weight: edge.amount ? Math.min(Math.log(edge.amount + 1) / 10, 5) : 1,
        color: RELATION_CONFIG[relationType].color,
        label: RELATION_CONFIG[relationType].label,
        data: { amount: edge.amount, reason: edge.reason, date: edge.date }
      });
    });

    return { nodes: entityNodes, edges: relationshipEdges };
  }, [nodes, edges]);

  // ── Degree centrality ────────────────────────────────────────────────────
  const degreeCentrality = useMemo(() => {
    const deg: Record<string, number> = {};
    propertyGraph.nodes.forEach(n => { deg[n.id] = 0; });
    propertyGraph.edges.forEach(e => {
      if (deg[e.source] !== undefined) deg[e.source]++;
      if (deg[e.target] !== undefined) deg[e.target]++;
    });
    return deg;
  }, [propertyGraph]);

  // Hub threshold: top 10% by degree (min 3 connections)
  const hubThreshold = useMemo(() => {
    const vals = Object.values(degreeCentrality).filter(v => v > 0);
    if (!vals.length) return 3;
    const sorted = [...vals].sort((a, b) => b - a);
    const top10idx = Math.max(0, Math.floor(sorted.length * 0.1) - 1);
    return Math.max(3, sorted[top10idx] || 3);
  }, [degreeCentrality]);

  // ── Compute layout ───────────────────────────────────────────────────────
  const [layoutPositions, setLayoutPositions] = useState<{ id: string; x: number; y: number }[]>([]);
  
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !propertyGraph.nodes.length) {
      setLayoutPositions([]);
      return;
    }
    
    const rect = container.getBoundingClientRect();
    const w = rect.width || 800;
    const h = rect.height || 700;

    // Run layout in next tick to not block render
    const timer = setTimeout(() => {
      const positions = computeImprovedLayout(
        propertyGraph.nodes, propertyGraph.edges,
        w / 2, h / 2, w, h
      );
      setLayoutPositions(positions);
    }, 0);
    
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width: rw, height: rh } = entry.contentRect;
      if (rw < 10 || rh < 10) return;
      const newPositions = computeImprovedLayout(
        propertyGraph.nodes, propertyGraph.edges,
        rw / 2, rh / 2, rw, rh
      );
      setLayoutPositions(newPositions);
    });
    resizeObserver.observe(container);

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
    };
  }, [propertyGraph]);

  // ── Update graph statistics ──────────────────────────────────────────────
  useEffect(() => {
    const nodeCount = propertyGraph.nodes.length;
    const edgeCount = propertyGraph.edges.length;
    const hubCount = Object.values(degreeCentrality).filter(d => d >= hubThreshold).length;
    setGraphStats({
      nodes: nodeCount,
      edges: edgeCount,
      communities: new Set(propertyGraph.nodes.map(n => n.type)).size,
      density: nodeCount > 1 ? edgeCount / (nodeCount * (nodeCount - 1) / 2) : 0,
      hubCount,
    });
  }, [propertyGraph, degreeCentrality, hubThreshold]);

  // Stable refs so the pending-focus effect doesn't re-fire on every render
  // (onSelectNode is an inline arrow in App.tsx — new reference every render)
  const onSelectNodeRef = useRef(onSelectNode);
  useEffect(() => { onSelectNodeRef.current = onSelectNode; }, [onSelectNode]);

  const animateCameraToRef = useRef<(nodeId: string, opts?: { fast?: boolean }) => void>(() => {});

  // ── Auto-fit on layout ready (suppressed when a Plot focus is queued) ───
  useEffect(() => {
    // Don't auto-fit if we're about to animate to a specific node
    if (pendingFocusNodeId.current) return;
    if (layoutPositions.length > 0 && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      fitToPositions(rect.width, rect.height, layoutPositions);
    }
  }, [layoutPositions]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Consume pending focus after graph tab becomes visible + layout ready ─
  // Deps are ONLY [viewTab, layoutPositions] — stable scalars — to avoid the
  // infinite loop caused by onSelectNode being a new arrow on every parent render.
  useEffect(() => {
    if (viewTab !== "graph") return;
    const nodeId = pendingFocusNodeId.current;
    if (!nodeId) return;
    if (!layoutPositions.length) return;

    const raf = requestAnimationFrame(() => {
      pendingFocusNodeId.current = null;
      setSelectedNodeId(nodeId);
      // Use stable refs — never causes this effect to re-fire
      const node = propertyGraph.nodes.find(n => n.id === nodeId);
      if (node) onSelectNodeRef.current(node);
      animateCameraToRef.current(nodeId, { fast: false });
    });
    return () => cancelAnimationFrame(raf);
  }, [viewTab, layoutPositions]); // eslint-disable-line react-hooks/exhaustive-deps

  const fitToPositions = useCallback((w: number, h: number, positions: { id: string; x: number; y: number }[]) => {
    if (!positions.length) return;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    positions.forEach(p => {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    });
    const gw = maxX - minX || 1;
    const gh = maxY - minY || 1;
    const padding = 0.12;
    const scaleX = (w * (1 - padding)) / gw;
    const scaleY = (h * (1 - padding)) / gh;
    const fitZoom = Math.min(scaleX, scaleY, 1.0);
    const fitPanX = w / 2 - ((minX + maxX) / 2) * fitZoom;
    const fitPanY = h / 2 - ((minY + maxY) / 2) * fitZoom;
    setZoom(fitZoom);
    setPan({ x: fitPanX, y: fitPanY });
  }, []);

  // ── Camera animation to node (with neighbourhood-bounding-box zoom) ─────
  const animateCameraTo = useCallback((nodeId: string, opts?: { fast?: boolean }) => {
    const pos = layoutPositions.find(p => p.id === nodeId);
    if (!pos || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const cw = rect.width  || 800;
    const ch = rect.height || 600;

    // --- Compute the bounding box of the node + its direct neighbours ---
    const neighbourIds = new Set<string>([nodeId]);
    propertyGraph.edges.forEach(e => {
      if (e.source === nodeId) neighbourIds.add(e.target);
      if (e.target === nodeId) neighbourIds.add(e.source);
    });

    const neighbourPositions = layoutPositions.filter(p => neighbourIds.has(p.id));
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    neighbourPositions.forEach(p => {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    });

    // Add padding around the neighbourhood
    const padPx = 80;
    minX -= padPx; minY -= padPx; maxX += padPx; maxY += padPx;

    const nw = maxX - minX || 1;
    const nh = maxY - minY || 1;

    // Zoom to fit the neighbourhood, clamped to a readable range
    const scaleX = (cw * 0.85) / nw;
    const scaleY = (ch * 0.85) / nh;
    // For isolated nodes (0 neighbours) use a fixed investigation zoom
    const baseZoom = neighbourIds.size <= 1 ? 1.5 : Math.min(scaleX, scaleY);
    const targetZoom = Math.max(0.8, Math.min(2.2, baseZoom));

    // Pan so the neighbourhood centre is centred in the viewport
    const ncx = (minX + maxX) / 2;
    const ncy = (minY + maxY) / 2;
    const targetPanX = cw / 2 - ncx * targetZoom;
    const targetPanY = ch / 2 - ncy * targetZoom;

    const startZoom = zoomRef.current;
    const startPanX = panRef.current.x;
    const startPanY = panRef.current.y;
    const duration = opts?.fast ? 350 : 550;
    const startTime = performance.now();
    setIsAnimating(true);

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setZoom(startZoom + (targetZoom - startZoom) * ease);
      setPan({
        x: startPanX + (targetPanX - startPanX) * ease,
        y: startPanY + (targetPanY - startPanY) * ease,
      });
      if (progress < 1) requestAnimationFrame(animate);
      else setIsAnimating(false);
    };
    requestAnimationFrame(animate);
  }, [layoutPositions, propertyGraph.edges]);

  // Keep the ref in sync so the pending-focus effect always has the latest version
  useEffect(() => { animateCameraToRef.current = animateCameraTo; }, [animateCameraTo]);

  // ── Connected entity sets ────────────────────────────────────────────────
  const connectedEntities = useMemo(() => {
    if (!selectedNodeId) return [];
    const connectedEdges = propertyGraph.edges.filter(
      e => e.source === selectedNodeId || e.target === selectedNodeId
    );
    const connectedIds = new Set<string>();
    connectedEdges.forEach(e => {
      connectedIds.add(e.source);
      connectedIds.add(e.target);
    });
    connectedIds.delete(selectedNodeId);
    return Array.from(connectedIds).map(id => {
      const node = propertyGraph.nodes.find(n => n.id === id);
      const eList = connectedEdges.filter(e => e.source === id || e.target === id);
      return {
        id, label: node?.label || id, type: node?.type || "Unknown",
        relations: eList.map(e => e.relation), data: node?.data,
      };
    });
  }, [selectedNodeId, propertyGraph]);

  const firstDegreeNeighbors = useMemo(() => {
    if (!selectedNodeId) return new Set<string>();
    const neighbors = new Set<string>([selectedNodeId]);
    propertyGraph.edges.forEach(e => {
      if (e.source === selectedNodeId) neighbors.add(e.target);
      if (e.target === selectedNodeId) neighbors.add(e.source);
    });
    return neighbors;
  }, [selectedNodeId, propertyGraph]);

  const hoverNeighbors = useMemo(() => {
    if (!hoveredNodeId) return new Set<string>();
    const neighbors = new Set<string>([hoveredNodeId]);
    propertyGraph.edges.forEach(e => {
      if (e.source === hoveredNodeId) neighbors.add(e.target);
      if (e.target === hoveredNodeId) neighbors.add(e.source);
    });
    return neighbors;
  }, [hoveredNodeId, propertyGraph]);

  // ── AI relationship explanation ─────────────────────────────────────────
  const generateRelationshipExplanation = useCallback((node: EntityNode): string => {
    if (!node) return "No entity selected.";
    const connectedEdges = propertyGraph.edges.filter(
      e => e.source === node.id || e.target === node.id
    );
    const connectedIds = new Set<string>();
    connectedEdges.forEach(e => {
      connectedIds.add(e.source === node.id ? e.target : e.source);
    });
    const connectedNodes = Array.from(connectedIds)
      .map(id => propertyGraph.nodes.find(n => n.id === id))
      .filter(Boolean) as EntityNode[];

    const firs      = connectedNodes.filter(n => n.type === "Case");
    const suspects  = connectedNodes.filter(n => n.type === "Suspect");
    const victims   = connectedNodes.filter(n => n.type === "Victim");
    const accounts  = connectedNodes.filter(n => n.type === "BankAccount");
    const phones    = connectedNodes.filter(n => n.type === "Phone");
    const locations = connectedNodes.filter(n => n.type === "Location" || n.type === "Address");
    const orgs      = connectedNodes.filter(n => n.type === "Organisation");

    const deg = degreeCentrality[node.id] || 0;
    const isHub = deg >= hubThreshold;

    const indirectIds = new Set<string>();
    connectedNodes.forEach(n => {
      propertyGraph.edges.forEach(e => {
        if (e.source === n.id && e.target !== node.id) indirectIds.add(e.target);
        if (e.target === n.id && e.source !== node.id) indirectIds.add(e.source);
      });
    });

    let explanation = "";

    if (node.type === "Suspect") {
      explanation = `This suspect is directly linked to ${firs.length} FIR${firs.length !== 1 ? "s" : ""}`;
      if (accounts.length) explanation += `, ${accounts.length} bank account${accounts.length !== 1 ? "s" : ""}`;
      if (phones.length)   explanation += `, ${phones.length} phone number${phones.length !== 1 ? "s" : ""}`;
      if (orgs.length)     explanation += `, and ${orgs.length} organisation${orgs.length !== 1 ? "s" : ""}`;
      explanation += ". ";
      if (firs.length) explanation += `Primary case${firs.length > 1 ? "s" : ""}: ${firs.slice(0, 2).map(f => f.label).join(", ")}${firs.length > 2 ? ` and ${firs.length - 2} more` : ""}. `;
      if (isHub) explanation += `⚠️ HIGH-VALUE TARGET — degree centrality of ${deg} connections places this suspect in the top network hubs. Likely organizer or repeat offender. `;
      if (accounts.length >= 2) explanation += `Multiple financial connections suggest potential money trail. `;
      if (indirectIds.size > 0) explanation += `Extended network: ${indirectIds.size} indirect connections.`;
    } else if (node.type === "Case") {
      explanation = `This FIR involves ${suspects.length} suspect${suspects.length !== 1 ? "s" : ""}`;
      if (victims.length)  explanation += `, ${victims.length} victim${victims.length !== 1 ? "s" : ""}`;
      if (accounts.length) explanation += `, and ${accounts.length} financial account${accounts.length !== 1 ? "s" : ""}`;
      explanation += ". ";
      if (suspects.length) explanation += `Key suspects: ${suspects.slice(0, 3).map(s => s.label).join(", ")}${suspects.length > 3 ? ` +${suspects.length - 3} more` : ""}. `;
      if (phones.length)   explanation += `Communication network: ${phones.length} phone number${phones.length !== 1 ? "s" : ""}. `;
      if (indirectIds.size) explanation += `Case ecosystem extends to ${indirectIds.size} related entities.`;
    } else if (node.type === "BankAccount") {
      explanation = `This financial account is connected to ${suspects.length} suspect${suspects.length !== 1 ? "s" : ""}`;
      if (firs.length)     explanation += ` across ${firs.length} FIR${firs.length !== 1 ? "s" : ""}`;
      if (accounts.length) explanation += ` with ${accounts.length} other account${accounts.length !== 1 ? "s" : ""}`;
      explanation += ". ";
      if (isHub) explanation += `⚠️ HIGH-RISK account — appears as network hub with ${deg} connections. Possible mule or laundering node. `;
      if (accounts.length >= 2) explanation += `Multiple account connections suggest financial layering. `;
      if (indirectIds.size) explanation += `Financial network: ${indirectIds.size} indirect entities.`;
    } else if (node.type === "Victim") {
      explanation = `This victim is associated with ${firs.length} FIR${firs.length !== 1 ? "s" : ""}`;
      if (suspects.length) explanation += ` involving ${suspects.length} suspect${suspects.length !== 1 ? "s" : ""}`;
      explanation += ". ";
      if (firs.length) explanation += `Case${firs.length > 1 ? "s" : ""}: ${firs.map(f => f.label).join(", ")}. `;
      if (indirectIds.size) explanation += `Network extends to ${indirectIds.size} related connections.`;
    } else {
      explanation = `This ${node.type.toLowerCase()} is connected to ${connectedNodes.length} entit${connectedNodes.length !== 1 ? "ies" : "y"}. `;
      if (isHub) explanation += `⚠️ Network hub with ${deg} connections — significant investigative relevance. `;
      if (indirectIds.size) explanation += `Extended network: ${indirectIds.size} indirect connections.`;
    }

    if (!connectedNodes.length) {
      explanation = `This ${node.type.toLowerCase()} has no direct connections in the current dataset.`;
    }
    return explanation;
  }, [propertyGraph, degreeCentrality, hubThreshold]);

  // ── Filtered data ────────────────────────────────────────────────────────
  const filteredNodes = useMemo(() => {
    if (!propertyGraph.nodes.length) return [];
    return propertyGraph.nodes.filter(node => {
      const matchesType = filterType === "All" || node.type === filterType;
      const matchesSearch = !searchQuery ||
        node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.type.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [propertyGraph.nodes, filterType, searchQuery]);

  const filteredEdges = useMemo(() => {
    if (!propertyGraph.edges.length) return [];
    return propertyGraph.edges.filter(edge => {
      const matchesRelation = filterRelation === "All" || edge.relation === filterRelation;
      const sourceVisible = filteredNodes.some(n => n.id === edge.source);
      const targetVisible = filteredNodes.some(n => n.id === edge.target);
      return matchesRelation && sourceVisible && targetVisible;
    });
  }, [propertyGraph.edges, filterRelation, filteredNodes]);

  // ── Interaction handlers ─────────────────────────────────────────────────
  const handleNodeClick = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    const node = propertyGraph.nodes.find(n => n.id === nodeId);
    if (node) onSelectNode(node);
    setTooltipPos(null);
    animateCameraTo(nodeId);
  };

  const handleNodeHover = (nodeId: string | null, svgX?: number, svgY?: number) => {
    setHoveredNodeId(nodeId);
    if (nodeId && svgX !== undefined && svgY !== undefined) {
      setTooltipPos({ svgX, svgY });
    } else {
      setTooltipPos(null);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  // Wheel: only zoom when user is "in graph focus mode" (clicked into graph)
  // Otherwise let the page scroll normally. This is the scroll-trap fix.
  const handleWheel = useCallback((e: WheelEvent) => {
    if (!isGraphFocused) return; // allow page scroll when graph not focused
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const factor = e.deltaY < 0 ? 1.12 : 0.89;
    const newZoom = Math.max(0.2, Math.min(4, zoomRef.current * factor));
    const newPanX = mouseX - (mouseX - panRef.current.x) * (newZoom / zoomRef.current);
    const newPanY = mouseY - (mouseY - panRef.current.y) * (newZoom / zoomRef.current);
    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  }, [isGraphFocused]);

  // Attach wheel listener as non-passive only when focused
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  const handleZoomIn  = () => setZoom(z => Math.min(3, z * 1.15));
  const handleZoomOut = () => setZoom(z => Math.max(0.2, z * 0.87));

  const handleFit = useCallback(() => {
    if (layoutPositions.length > 0 && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      fitToPositions(rect.width, rect.height, layoutPositions);
      setSelectedNodeId(null);
    }
  }, [layoutPositions, fitToPositions]);

  const handleReset = handleFit;

  // ── Directory → Graph navigation ────────────────────────────────────────
  const handleDirectoryClick = useCallback((nodeId: string) => {
    const node = propertyGraph.nodes.find(n => n.id === nodeId);
    if (!node) return;

    // 1. Clear any filters that would hide this node
    if (filterType !== "All" && node.type !== filterType) setFilterType("All");
    if (searchQuery) setSearchQuery("");

    // 2. If the graph is already visible and layout is ready, animate immediately
    //    (use stable refs so this callback doesn't recreate on every render)
    if (viewTab === "graph" && layoutPositions.length > 0) {
      setSelectedNodeId(nodeId);
      onSelectNodeRef.current(node);
      animateCameraToRef.current(nodeId, { fast: false });
      return;
    }

    // 3. Queue the focus so the pending-focus useEffect handles it
    pendingFocusNodeId.current = nodeId;
    setViewTab("graph");
  }, [
    propertyGraph.nodes, filterType, searchQuery,
    viewTab, layoutPositions
    // onSelectNode and animateCameraTo intentionally omitted — accessed via stable refs
  ]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Helpers for node sizing (hub-aware) ─────────────────────────────────
  const getDisplayNodeSize = (node: EntityNode, isSelected: boolean, isHovered: boolean): number => {
    const config = ENTITY_CONFIG[node.type] || ENTITY_CONFIG.Person;
    const deg = degreeCentrality[node.id] || 0;
    // Hub bonus: up to +8px for highest-degree nodes
    const maxDeg = Math.max(...Object.values(degreeCentrality), 1);
    const hubBonus = Math.min((deg / maxDeg) * 8, 8);
    const base = config.baseSize + hubBonus;
    if (isSelected) return base * 1.65;
    if (isHovered)  return base * 1.35;
    return base;
  };

  // ── SVG tooltip position: keep in bounds ────────────────────────────────
  const getTooltipTransform = (svgX: number, svgY: number, canvasW: number): string => {
    const tipW = 210;
    const tipH = 80;
    let tx = svgX + 16;
    let ty = svgY - 20;
    if (tx + tipW > canvasW - 10) tx = svgX - tipW - 10;
    if (ty < 10) ty = svgY + 10;
    return `translate(${tx}, ${ty})`;
  };

  // ── Empty state ──────────────────────────────────────────────────────────
  if (!propertyGraph.nodes.length) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4 text-center p-8">
        <Network className="w-12 h-12 text-slate-600 animate-pulse" />
        <div className="text-sm font-bold text-slate-400">Loading Criminal Network</div>
        <p className="text-xs text-slate-500">Processing intelligence data from KSP database…</p>
        <p className="text-xs text-slate-600 mt-2">Raw data: {nodes.length} nodes, {edges.length} edges</p>
      </div>
    );
  }

  const selectedNodeData = propertyGraph.nodes.find(n => n.id === selectedNodeId);
  const hoveredNodeData  = propertyGraph.nodes.find(n => n.id === hoveredNodeId);

  // Canvas size for tooltip bounds
  const canvasW = containerRef.current?.getBoundingClientRect().width || 800;

  return (
    // Root: NO fixed height — fills parent flex column, minimum usable height
    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 min-h-0">

      {/* ── Sidebar ───────────────────────────────────────────────────────── */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-xl overflow-hidden flex flex-col lg:w-80 shrink-0 max-h-[900px] lg:max-h-none lg:self-start lg:sticky lg:top-4">
        {/* Header */}
        <div className="flex-shrink-0 p-4 border-b border-slate-800/60 bg-slate-900/40 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold tracking-wider uppercase text-amber-500 flex items-center gap-2">
              <Sliders className="w-4 h-4" /> Intelligence Hub
            </h3>
            {graphStats.hubCount > 0 && (
              <span className="text-micro px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 font-bold">
                {graphStats.hubCount} hub{graphStats.hubCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
            {(["graph", "directory"] as const).map(tab => (
              <button key={tab} onClick={() => setViewTab(tab)}
                className={`flex items-center justify-center gap-2 py-2 rounded-md text-sm font-bold transition ${
                  viewTab === tab
                    ? tab === "graph"
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      : "bg-blue-500/10 text-blue-300 border border-blue-500/20"
                    : "text-slate-400 hover:text-slate-200"
                }`}>
                {tab === "graph" ? <Network className="w-4 h-4" /> : <List className="w-4 h-4" />}
                <span className="capitalize">{tab}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
          {/* Search */}
          <div className="space-y-3">
            <div>
              <label className="block text-micro text-slate-400 mb-1.5 font-medium">Search Intelligence</label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input type="text" placeholder="Name, ID, type…" value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-lg py-2 pr-3"
                  style={{ paddingLeft: "2.2rem" }} />
              </div>
            </div>

            {/* Entity Type Filter */}
            <div>
              <label className="block text-micro text-slate-400 mb-1.5 font-medium">Entity Type</label>
              <div className="flex flex-wrap gap-1.5">
                {["All", "Suspect", "Victim", "Case", "BankAccount", "Location"].map(t => (
                  <button key={t} onClick={() => setFilterType(t as EntityType | "All")}
                    className={`py-0.5 px-2 rounded text-micro font-bold border transition ${
                      filterType === t
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                        : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700"
                    }`}>{t === "BankAccount" ? "Bank" : t}</button>
                ))}
              </div>
            </div>

            {/* Relationship Type Filter */}
            <div>
              <label className="block text-micro text-slate-400 mb-1 font-medium">Relationship</label>
              <div className="flex flex-wrap gap-1">
                {["All", "ACCUSED_IN", "VICTIM_IN", "TRANSFERRED_TO", "ASSOCIATED_WITH"].map(r => (
                  <button key={r} onClick={() => setFilterRelation(r as RelationType | "All")}
                    className={`py-0.5 px-2 rounded text-micro font-bold border transition ${
                      filterRelation === r
                        ? "bg-blue-500/10 text-blue-300 border-blue-500/30"
                        : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700"
                    }`}>{r.replace(/_/g, " ")}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Graph Statistics */}
          <div className="border-t border-slate-800/60 pt-3">
            <button onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between text-sm font-bold text-slate-400 hover:text-slate-200 transition">
              <span className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-slate-500" /> Network Statistics
              </span>
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showAdvanced && (
              <div className="grid grid-cols-2 gap-2 mt-3">
                {[
                  { label: "Nodes",    value: graphStats.nodes,   color: "text-amber-400" },
                  { label: "Edges",    value: graphStats.edges,   color: "text-blue-400" },
                  { label: "Clusters", value: graphStats.communities, color: "text-purple-400" },
                  { label: "Hubs",     value: graphStats.hubCount, color: "text-red-400" },
                ].map(item => (
                  <div key={item.label} className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-800">
                    <div className="text-micro text-slate-500">{item.label}</div>
                    <div className={`text-base font-bold ${item.color}`}>{item.value}</div>
                  </div>
                ))}
                <div className="col-span-2 bg-slate-900/50 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-micro text-slate-500">Graph Density</div>
                  <div className="text-base font-bold text-emerald-400">{graphStats.density.toFixed(4)}</div>
                </div>
              </div>
            )}
          </div>

          {/* Scroll hint */}
          <div className="border-t border-slate-800/60 pt-3">
            <div className="flex items-center gap-2 p-2 bg-slate-900/40 rounded-lg border border-slate-800/60">
              <Info className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <p className="text-micro text-slate-500 leading-snug">
                Click inside graph to enable scroll-to-zoom. Click outside to restore page scroll.
              </p>
            </div>
          </div>

          {/* Inspector Panel */}
          <div className="space-y-4 pt-2 border-t border-slate-800/60">
            {selectedNodeData ? (
              <div className="bg-slate-950/80 rounded-xl border border-slate-800 space-y-3 animate-fadeIn overflow-hidden">
                <div className="px-3 pt-3 pb-2 border-b border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-micro uppercase px-1.5 py-0.5 rounded font-extrabold tracking-wider bg-amber-500/10 text-amber-400">
                      {selectedNodeData.type}
                    </span>
                    <div className="flex items-center gap-2">
                      {(degreeCentrality[selectedNodeId!] || 0) >= hubThreshold && (
                        <span className="text-micro px-1.5 py-0.5 rounded font-bold bg-red-500/10 border border-red-500/30 text-red-400">
                          HUB
                        </span>
                      )}
                      <button onClick={() => setSelectedNodeId(null)}
                        className="text-micro text-slate-500 hover:text-slate-300 font-bold underline cursor-pointer">
                        Dismiss
                      </button>
                    </div>
                  </div>
                  <div className="mt-2">
                    <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                      {ENTITY_CONFIG[selectedNodeData.type]?.icon}
                      {selectedNodeData.label}
                    </h4>
                    <p className="text-micro text-slate-500 font-mono mt-0.5">ID: {selectedNodeId}</p>
                    <p className="text-micro text-slate-500 mt-0.5">
                      Connections: <strong className="text-slate-300">{degreeCentrality[selectedNodeId!] || 0}</strong>
                    </p>
                  </div>
                </div>

                <div className="px-3 space-y-3 pb-3">
                  {/* Entity Details */}
                  <div className="text-xs space-y-1.5 bg-slate-900/30 p-2 rounded-lg border border-slate-800/60 text-slate-300">
                    {Object.entries(selectedNodeData.data || {})
                      .filter(([key]) => !["id", "label", "type"].includes(key))
                      .slice(0, 4)
                      .map(([key, value]) => (
                        <div key={key} className="flex justify-between gap-2">
                          <span className="text-slate-500 capitalize shrink-0">{key.replace(/([A-Z])/g, " $1")}:</span>
                          <strong className="text-slate-200 truncate">{String(value)}</strong>
                        </div>
                      ))}
                  </div>

                  {/* Connected Entities */}
                  <div className="space-y-1.5">
                    <span className="text-micro uppercase tracking-wider font-bold text-slate-500 block">
                      Connected Entities ({connectedEntities.length})
                    </span>
                    {connectedEntities.length > 0 ? (
                      <div className="max-h-36 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
                        {connectedEntities.map((entity) => (
                          <button key={entity.id}
                            onClick={() => handleNodeClick(entity.id)}
                            className="w-full flex items-center justify-between text-left p-1.5 bg-slate-900/60 border border-slate-800 hover:border-amber-500/30 hover:bg-slate-900 rounded transition-all group cursor-pointer">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <ArrowRight className="w-3 h-3 text-slate-600 shrink-0 group-hover:text-amber-400 transition-colors" />
                              <div className="truncate">
                                <p className="text-micro font-bold text-slate-200 truncate">{entity.label}</p>
                                <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                                  {entity.relations.slice(0, 2).map(rel => (
                                    <span key={rel} className="text-micro px-1 rounded font-bold bg-slate-800 text-slate-400">
                                      {rel.replace(/_/g, " ")}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <ChevronRight className="w-3 h-3 text-slate-600 group-hover:text-amber-400 shrink-0" />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-micro text-slate-500 italic">No direct connections.</p>
                    )}
                  </div>

                  {/* AI Relationship Explanation */}
                  <div className="space-y-1.5">
                    <span className="text-micro uppercase tracking-wider font-bold text-slate-500 block flex items-center gap-1.5">
                      <Lightbulb className="w-3 h-3 text-amber-400" /> Relationship Analysis
                    </span>
                    <div className="bg-gradient-to-br from-amber-500/5 to-blue-500/5 p-2 rounded-lg border border-amber-500/20">
                      <p className="text-xs text-slate-200 leading-relaxed">
                        {generateRelationshipExplanation(selectedNodeData)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-800 rounded-xl bg-slate-900/10 text-slate-500 min-h-[100px]">
                <Info className="w-5 h-5 text-slate-600 mb-1.5" />
                <p className="text-xs font-semibold">Inspector Inactive</p>
                <p className="text-micro text-slate-600 mt-1 max-w-[180px]">
                  Click any node to explore intelligence connections
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Main Graph Area ───────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col" style={{ minHeight: "600px" }}>
        {viewTab === "graph" ? (
          <div
            className="relative flex-1 bg-slate-950 border border-slate-800/80 rounded-xl overflow-hidden"
            style={{ minHeight: "600px" }}
            // Graph focus on click-in, blur on click-out is handled by tabIndex + onBlur
            tabIndex={-1}
            onFocus={() => setIsGraphFocused(true)}
            onBlur={() => setIsGraphFocused(false)}
            onClick={() => setIsGraphFocused(true)}
          >
            {/* Status Bar */}
            <div className="absolute top-3 left-3 right-12 z-10 flex items-center justify-between pointer-events-none gap-2">
              <div className="bg-slate-900/90 backdrop-blur-sm py-1 px-3 rounded-full border border-slate-800 text-micro text-slate-300 flex items-center gap-1.5 shadow-lg pointer-events-auto">
                <Move className="w-3 h-3 text-amber-500" />
                <span className="hidden sm:inline">Drag to pan · Click to focus then scroll to zoom · Click node</span>
                <span className="sm:hidden">Drag · Click to zoom · Tap node</span>
              </div>
              <div className="bg-slate-900/90 backdrop-blur-sm py-1 px-3 rounded-full border border-slate-800 text-micro font-bold text-slate-300 flex items-center gap-1.5 shadow-lg pointer-events-auto">
                <span className="text-amber-400 font-mono">{Math.round(zoom * 100)}%</span>
                <span className="text-slate-600 hidden sm:inline">|</span>
                <span className="hidden sm:inline text-slate-400">{graphStats.nodes}n · {graphStats.edges}e</span>
              </div>
            </div>

            {/* Focus indicator */}
            {isGraphFocused && (
              <div className="absolute top-3 right-3 z-10 bg-amber-500/20 border border-amber-500/40 rounded-full px-2 py-0.5">
                <span className="text-micro text-amber-400 font-bold">ZOOM ACTIVE</span>
              </div>
            )}

            {/* SVG Graph Container */}
            <div
              ref={containerRef}
              className="w-full h-full"
              style={{ minHeight: "600px" }}
            >
              <svg
                ref={svgRef}
                className={`w-full h-full outline-none select-none ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <defs>
                  {Object.entries(ENTITY_CONFIG).map(([type]) => (
                    <filter key={type} id={`glow-${type}`} x="-60%" y="-60%" width="220%" height="220%">
                      <feGaussianBlur stdDeviation="2.5" in="SourceGraphic" result="blurred" />
                      <feMerge>
                        <feMergeNode in="blurred" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  ))}
                  {/* Hub glow - brighter */}
                  <filter id="hub-glow" x="-80%" y="-80%" width="260%" height="260%">
                    <feGaussianBlur stdDeviation="4" in="SourceGraphic" result="blurred" />
                    <feMerge>
                      <feMergeNode in="blurred" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                  {/* ── Edges ── */}
                  {filteredEdges.map((edge) => {
                    const sourcePos = layoutPositions.find(p => p.id === edge.source);
                    const targetPos = layoutPositions.find(p => p.id === edge.target);
                    if (!sourcePos || !targetPos) return null;

                    const isSelectedEdge  = !!selectedNodeId && (edge.source === selectedNodeId || edge.target === selectedNodeId);
                    const isHoveredEdge   = !!hoveredNodeId  && (edge.source === hoveredNodeId  || edge.target === hoveredNodeId);
                    const isNearSelected  = !!selectedNodeId && firstDegreeNeighbors.has(edge.source) && firstDegreeNeighbors.has(edge.target);
                    const isNearHover     = !!hoveredNodeId  && hoverNeighbors.has(edge.source) && hoverNeighbors.has(edge.target);
                    const isDimmed        = !!selectedNodeId && !isNearSelected && !isSelectedEdge;
                    const isHoverDimmed   = !!hoveredNodeId  && !isNearHover && !isHoveredEdge;
                    const relConfig       = RELATION_CONFIG[edge.relation];

                    const edgeWidth   = isSelectedEdge || isHoveredEdge ? 2.8 : isNearSelected ? 2.0 : 1.2;
                    const edgeOpacity = isDimmed       ? 0.02 :
                                        isHoverDimmed  ? 0.04 :
                                        isSelectedEdge || isHoveredEdge ? 0.92 :
                                        isNearSelected ? 0.65 :
                                        relConfig.opacity;

                    return (
                      <line
                        key={edge.id}
                        x1={sourcePos.x} y1={sourcePos.y}
                        x2={targetPos.x} y2={targetPos.y}
                        stroke={relConfig.color}
                        strokeWidth={edgeWidth}
                        strokeOpacity={edgeOpacity}
                        strokeDasharray={relConfig.dash || undefined}
                        style={{
                          transition: "all 0.25s ease",
                          filter: (isSelectedEdge || isHoveredEdge)
                            ? `drop-shadow(0 0 4px ${relConfig.color}88)`
                            : undefined,
                        }}
                      />
                    );
                  })}

                  {/* ── Nodes ── */}
                  {filteredNodes.map((node) => {
                    const pos = layoutPositions.find(p => p.id === node.id);
                    if (!pos) return null;

                    const config      = ENTITY_CONFIG[node.type] || ENTITY_CONFIG.Person;
                    const isSelected  = node.id === selectedNodeId;
                    const isHovered   = node.id === hoveredNodeId;
                    const isNearSel   = firstDegreeNeighbors.has(node.id);
                    const isNearHov   = hoverNeighbors.has(node.id);
                    const isDimmed    = !!selectedNodeId && !isNearSel;
                    const isHovDimmed = !!hoveredNodeId  && !isNearHov;
                    const deg         = degreeCentrality[node.id] || 0;
                    const isHub       = deg >= hubThreshold;

                    const nodeSize    = getDisplayNodeSize(node, isSelected, isHovered);
                    const nodeOpacity = isDimmed ? 0.07 : isHovDimmed ? 0.12 : 1;

                    return (
                      <g
                        key={node.id}
                        transform={`translate(${pos.x}, ${pos.y})`}
                        className="cursor-pointer"
                        onClick={() => handleNodeClick(node.id)}
                        onMouseEnter={(e) => {
                          const svgEl = svgRef.current;
                          if (!svgEl) { handleNodeHover(node.id); return; }
                          // Convert mouse to SVG-space for tooltip positioning
                          const pt = svgEl.createSVGPoint();
                          pt.x = e.clientX;
                          pt.y = e.clientY;
                          const ctm = svgEl.getScreenCTM();
                          if (ctm) {
                            const svgPt = pt.matrixTransform(ctm.inverse());
                            handleNodeHover(node.id, svgPt.x, svgPt.y);
                          } else {
                            handleNodeHover(node.id, pos.x * zoom + pan.x + 20, pos.y * zoom + pan.y - 20);
                          }
                        }}
                        onMouseLeave={() => handleNodeHover(null)}
                        style={{
                          opacity: nodeOpacity,
                          transition: "opacity 0.25s ease",
                        }}
                      >
                        {/* Hub pulse ring */}
                        {isHub && !isSelected && !isHovered && (
                          <circle
                            r={nodeSize + 5}
                            fill="none"
                            stroke={config.color}
                            strokeWidth={1.5}
                            strokeOpacity={0.35}
                            strokeDasharray="3,4"
                          />
                        )}

                        {/* Hover glow ring */}
                        {isHovered && (
                          <circle
                            r={nodeSize + 4}
                            fill="none"
                            stroke={config.color}
                            strokeWidth={2}
                            strokeOpacity={0.5}
                            style={{ filter: `url(#glow-${node.type})` }}
                          />
                        )}

                        {/* Selection highlight rings */}
                        {isSelected && (
                          <>
                            <circle
                              r={nodeSize + 5}
                              fill="none"
                              stroke={config.color}
                              strokeWidth={3}
                              strokeOpacity={0.85}
                            />
                            <circle
                              r={nodeSize + 11}
                              fill="none"
                              stroke={config.color}
                              strokeWidth={1.5}
                              strokeOpacity={0.40}
                              strokeDasharray="4,3"
                            />
                          </>
                        )}

                        {/* Node body */}
                        <circle
                          r={nodeSize}
                          fill={config.color}
                          stroke={isSelected ? "rgba(255,255,255,0.6)" : isHovered ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.2)"}
                          strokeWidth={isSelected ? 2.5 : isHovered ? 2 : 1}
                          style={{
                            filter: isHub ? "url(#hub-glow)" : `url(#glow-${node.type})`,
                            transition: "r 0.25s ease, stroke-width 0.2s ease",
                          }}
                        />

                        {/* Hub label (always visible for top hubs, small) */}
                        {isHub && !isSelected && !isHovered && deg >= hubThreshold + 2 && (
                          <text
                            x={nodeSize + 5}
                            y={4}
                            fill={config.color}
                            fontSize={8}
                            fontWeight={700}
                            dominantBaseline="middle"
                            style={{ pointerEvents: "none", opacity: 0.85 }}
                          >
                            {node.label.length > 14 ? node.label.substring(0, 12) + "…" : node.label}
                          </text>
                        )}

                        {/* Label on hover or select */}
                        {(isSelected || isHovered) && (
                          <g>
                            {/* Label background for readability */}
                            <rect
                              x={nodeSize + 7}
                              y={-12}
                              width={Math.min(node.label.length, 22) * 6.5 + 8}
                              height={26}
                              rx={4}
                              fill="rgba(10,15,28,0.85)"
                              stroke={config.color}
                              strokeWidth={0.8}
                              strokeOpacity={0.4}
                              style={{ pointerEvents: "none" }}
                            />
                            <text
                              x={nodeSize + 11}
                              y={-3}
                              fill="white"
                              fontSize={isSelected ? 11 : 10}
                              fontWeight={isSelected ? 700 : 600}
                              dominantBaseline="middle"
                              style={{ pointerEvents: "none", textShadow: "0 1px 3px rgba(0,0,0,0.9)" }}
                            >
                              {node.label.length > 22 ? node.label.substring(0, 20) + "…" : node.label}
                            </text>
                            <text
                              x={nodeSize + 11}
                              y={9}
                              fill={config.color}
                              fontSize={isSelected ? 9 : 8}
                              fontWeight={600}
                              dominantBaseline="middle"
                              style={{ pointerEvents: "none" }}
                            >
                              {node.type}{isHub ? " · HUB" : ""}
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}

                  {/* ── SVG Tooltip (follows mouse in SVG space) ── */}
                  {hoveredNodeData && tooltipPos && (
                    <g
                      transform={getTooltipTransform(tooltipPos.svgX, tooltipPos.svgY, canvasW / zoom)}
                      style={{ pointerEvents: "none" }}
                    >
                      <rect
                        width={210} height={82} rx={8}
                        fill="rgba(10,15,28,0.97)"
                        stroke="rgba(148,163,184,0.35)"
                        strokeWidth={1}
                        style={{ filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.5))" }}
                      />
                      <text x={10} y={22} fill={ENTITY_CONFIG[hoveredNodeData.type]?.color || "#fbbf24"} fontSize={11} fontWeight={800}>
                        {hoveredNodeData.type}
                        {(degreeCentrality[hoveredNodeData.id] || 0) >= hubThreshold ? " · ⚠️ HUB" : ""}
                      </text>
                      <text x={10} y={40} fill="white" fontSize={12} fontWeight={600}>
                        {hoveredNodeData.label.length > 26 ? hoveredNodeData.label.substring(0, 24) + "…" : hoveredNodeData.label}
                      </text>
                      <text x={10} y={56} fill="#94a3b8" fontSize={10}>
                        ID: {hoveredNodeData.id}
                      </text>
                      <text x={10} y={70} fill="#64748b" fontSize={10}>
                        Connections: {degreeCentrality[hoveredNodeData.id] || 0}
                      </text>
                    </g>
                  )}
                </g>
              </svg>
            </div>

            {/* Zoom Controls */}
            <div className="absolute bottom-5 right-3 z-20 flex flex-col gap-2 bg-slate-900/95 backdrop-blur-sm p-2 rounded-2xl border border-slate-700/80 shadow-2xl">
              <button onClick={handleZoomIn}
                className="flex flex-col items-center gap-0.5 py-2 px-2 bg-slate-950 hover:bg-amber-500/10 text-slate-300 hover:text-amber-400 rounded-xl border border-slate-800 hover:border-amber-500/40 transition active:scale-95"
                title="Zoom In">
                <ZoomIn className="w-4 h-4" />
                <span className="text-micro font-bold text-slate-500">+</span>
              </button>
              <button onClick={handleZoomOut}
                className="flex flex-col items-center gap-0.5 py-2 px-2 bg-slate-950 hover:bg-blue-500/10 text-slate-300 hover:text-blue-400 rounded-xl border border-slate-800 hover:border-blue-500/40 transition active:scale-95"
                title="Zoom Out">
                <ZoomOut className="w-4 h-4" />
                <span className="text-micro font-bold text-slate-500">−</span>
              </button>
              <div className="border-t border-slate-800 my-0.5" />
              <button onClick={handleFit}
                className="flex flex-col items-center gap-0.5 py-2 px-2 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-slate-100 rounded-xl border border-slate-800 transition active:scale-95"
                title="Fit Graph">
                <Maximize2 className="w-4 h-4" />
                <span className="text-micro font-bold text-slate-500">FIT</span>
              </button>
              <button onClick={handleReset}
                className="flex flex-col items-center gap-0.5 py-2 px-2 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 rounded-xl border border-slate-800 transition active:scale-95"
                title="Reset View">
                <RotateCcw className="w-4 h-4" />
                <span className="text-micro font-bold text-slate-500">RST</span>
              </button>
            </div>

            {/* Legend */}
            <div className="absolute bottom-5 left-4 z-10 bg-slate-900/95 backdrop-blur-sm p-3 rounded-xl border border-slate-700/80 shadow-xl space-y-2 hidden sm:block max-w-[200px]">
              <div className="text-micro font-black text-slate-400 uppercase tracking-widest border-b border-slate-700/50 pb-1.5 mb-2">Entity Legend</div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                {[
                  { type: "FIR/Case",     color: "#f59e0b" },
                  { type: "Suspect",      color: "#ef4444" },
                  { type: "Victim",       color: "#3b82f6" },
                  { type: "Bank Account", color: "#10b981" },
                  { type: "Phone",        color: "#f97316" },
                  { type: "Location",     color: "#84cc16" },
                  { type: "Organisation", color: "#6366f1" },
                  { type: "Vehicle",      color: "#06b6d4" },
                ].map(item => (
                  <div key={item.type} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-micro text-slate-300">{item.type}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 pt-1 border-t border-slate-800/60">
                <div className="w-2.5 h-2.5 rounded-full border border-dashed border-red-400 shrink-0" />
                <span className="text-micro text-red-400">Hub node (top 10%)</span>
              </div>
            </div>
          </div>
        ) : (
          /* ── Directory View ─────────────────────────────────────────── */
          <div className="flex-1 flex flex-col bg-slate-950/90 border border-slate-800/80 rounded-xl overflow-hidden" style={{ minHeight: "600px" }}>
            <div className="flex-shrink-0 p-4 border-b border-slate-800/80">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
                    <List className="w-5 h-5 text-amber-500" /> Intelligence Directory
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Click any entity to highlight in graph view</p>
                </div>
                <span className="text-sm font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
                  {filteredNodes.length} Entities
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900 p-4">
              <div className="border border-slate-800/80 rounded-xl bg-slate-950">
                {filteredNodes.length > 0 ? (
                  <div className="divide-y divide-slate-900">
                    {filteredNodes.map((node) => {
                      const deg = degreeCentrality[node.id] || 0;
                      const isHub = deg >= hubThreshold;
                      return (
                        <div key={node.id}
                          className={`p-3.5 hover:bg-slate-900/80 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 group ${
                            selectedNodeId === node.id ? "bg-amber-500/10 border-l-4 border-amber-500" : ""
                          }`}>
                          <div className="space-y-1.5 min-w-0 flex-1 cursor-pointer" onClick={() => handleDirectoryClick(node.id)}>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-micro uppercase px-2 py-0.5 rounded font-extrabold tracking-wider bg-slate-800 text-slate-300">
                                {node.type}
                              </span>
                              {isHub && (
                                <span className="text-micro px-2 py-0.5 rounded font-bold bg-red-500/10 border border-red-500/30 text-red-400">
                                  HUB · {deg} links
                                </span>
                              )}
                              <span className="text-sm font-bold text-slate-100 group-hover:text-amber-400 transition-colors truncate">
                                {node.label}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 truncate">
                              {node.data && Object.entries(node.data).slice(0, 2).map(([k, v]) => (
                                <span key={k} className="mr-3">{k}: {String(v)}</span>
                              ))}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDirectoryClick(node.id);
                            }}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-slate-950 font-bold rounded text-sm transition flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0 focus:outline-none focus:ring-2 focus:ring-amber-400/60"
                          >
                            <Sparkles className="w-3.5 h-3.5 fill-slate-950" /> Plot
                          </button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="h-48 flex flex-col items-center justify-center text-center p-8 text-slate-500">
                    <Search className="w-8 h-8 text-slate-700 mb-3" />
                    <p className="text-sm font-bold">No Records Match Filters</p>
                    <p className="text-micro text-slate-600 mt-1">Try modifying the search or filters</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
