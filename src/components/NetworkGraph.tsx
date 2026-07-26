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

// Entity type configuration with colors and cluster assignments (reduced sizes by ~35% for readability)
const ENTITY_CONFIG: Record<EntityType, {
  color: string;
  glowColor: string;
  icon: React.ReactNode;
  baseSize: number;
  label: string;
  clusterAngle: number; // Radial position around center
}> = {
  Case: { color: "#f59e0b", glowColor: "rgba(245, 158, 11, 0.08)", icon: <Shield className="w-4 h-4" />, baseSize: 13, label: "FIR/Case", clusterAngle: 0 },
  Suspect: { color: "#ef4444", glowColor: "rgba(239, 68, 68, 0.08)", icon: <User className="w-4 h-4" />, baseSize: 10.5, label: "Suspect", clusterAngle: 45 },
  Victim: { color: "#3b82f6", glowColor: "rgba(59, 130, 246, 0.08)", icon: <User className="w-4 h-4" />, baseSize: 9.75, label: "Victim", clusterAngle: 90 },
  Witness: { color: "#8b5cf6", glowColor: "rgba(139, 92, 246, 0.08)", icon: <User className="w-4 h-4" />, baseSize: 9.1, label: "Witness", clusterAngle: 135 },
  BankAccount: { color: "#10b981", glowColor: "rgba(16, 185, 129, 0.08)", icon: <CreditCard className="w-4 h-4" />, baseSize: 9.1, label: "Bank Account", clusterAngle: 180 },
  Phone: { color: "#f97316", glowColor: "rgba(249, 115, 22, 0.08)", icon: <Phone className="w-4 h-4" />, baseSize: 7.8, label: "Phone", clusterAngle: 225 },
  Vehicle: { color: "#06b6d4", glowColor: "rgba(6, 182, 212, 0.08)", icon: <Car className="w-4 h-4" />, baseSize: 9.1, label: "Vehicle", clusterAngle: 270 },
  Location: { color: "#84cc16", glowColor: "rgba(132, 204, 26, 0.08)", icon: <MapPin className="w-4 h-4" />, baseSize: 7.8, label: "Location", clusterAngle: 315 },
  Organisation: { color: "#6366f1", glowColor: "rgba(99, 102, 241, 0.08)", icon: <Building className="w-4 h-4" />, baseSize: 9.75, label: "Organisation", clusterAngle: 0 },
  Person: { color: "#64748b", glowColor: "rgba(100, 116, 139, 0.08)", icon: <User className="w-4 h-4" />, baseSize: 9.1, label: "Person", clusterAngle: 45 },
  SIM: { color: "#a855f7", glowColor: "rgba(168, 85, 247, 0.08)", icon: <Phone className="w-4 h-4" />, baseSize: 7.15, label: "SIM", clusterAngle: 90 },
  IMEI: { color: "#d946ef", glowColor: "rgba(217, 70, 239, 0.08)", icon: <Phone className="w-4 h-4" />, baseSize: 7.15, label: "IMEI", clusterAngle: 135 },
  UPI: { color: "#f43f5e", glowColor: "rgba(244, 63, 94, 0.08)", icon: <DollarSign className="w-4 h-4" />, baseSize: 7.8, label: "UPI", clusterAngle: 180 },
  Address: { color: "#14b8a6", glowColor: "rgba(20, 184, 166, 0.08)", icon: <MapPin className="w-4 h-4" />, baseSize: 7.8, label: "Address", clusterAngle: 225 },
  Device: { color: "#22c55e", glowColor: "rgba(34, 197, 94, 0.08)", icon: <Phone className="w-4 h-4" />, baseSize: 7.8, label: "Device", clusterAngle: 270 },
  Weapon: { color: "#dc2626", glowColor: "rgba(220, 38, 38, 0.08)", icon: <AlertTriangle className="w-4 h-4" />, baseSize: 7.8, label: "Weapon", clusterAngle: 315 },
  Evidence: { color: "#eab308", glowColor: "rgba(234, 179, 8, 0.08)", icon: <Package className="w-4 h-4" />, baseSize: 7.15, label: "Evidence", clusterAngle: 0 },
};

// Relationship type configuration (reduced opacity for cleaner visualization)
const RELATION_CONFIG: Record<RelationType, {
  color: string;
  dash: string;
  opacity: number;
  label: string;
}> = {
  OWNS: { color: "#10b981", dash: "", opacity: 0.25, label: "OWNS" },
  USES: { color: "#6366f1", dash: "5,3", opacity: 0.2, label: "USES" },
  INVOLVED_IN: { color: "#f59e0b", dash: "", opacity: 0.3, label: "INVOLVED_IN" },
  CALLED: { color: "#8b5cf6", dash: "3,3", opacity: 0.2, label: "CALLED" },
  TRANSFERRED_TO: { color: "#ef4444", dash: "", opacity: 0.3, label: "TRANSFERRED_TO" },
  VISITED: { color: "#06b6d4", dash: "5,5", opacity: 0.18, label: "VISITED" },
  ASSOCIATED_WITH: { color: "#a855f7", dash: "4,4", opacity: 0.2, label: "ASSOCIATED_WITH" },
  SEEN_AT: { color: "#14b8a6", dash: "3,3", opacity: 0.18, label: "SEEN_AT" },
  ACCUSED_IN: { color: "#dc2626", dash: "", opacity: 0.3, label: "ACCUSED_IN" },
  VICTIM_IN: { color: "#3b82f6", dash: "", opacity: 0.3, label: "VICTIM_IN" },
  WITNESS_TO: { color: "#84cc16", dash: "5,3", opacity: 0.25, label: "WITNESS_TO" },
  OPERATED: { color: "#f97316", dash: "4,2", opacity: 0.2, label: "OPERATED" },
  LOCATED_AT: { color: "#eab308", dash: "", opacity: 0.25, label: "LOCATED_AT" },
  CONNECTED_TO: { color: "#64748b", dash: "5,5", opacity: 0.15, label: "CONNECTED_TO" },
  RELATED_TO: { color: "#78716c", dash: "3,3", opacity: 0.15, label: "RELATED_TO" },
};

// Investigation-centric radial layout with concentric rings (improved spacing)
function computeInvestigationLayout(
  nodes: any[],
  edges: any[],
  selectedNodeId: string | null,
  centerX: number,
  centerY: number,
  canvasWidth: number,
  canvasHeight: number
): { id: string; x: number; y: number }[] {
  if (!nodes.length) return [];

  const positions: { id: string; x: number; y: number }[] = [];
  const nodeMap = new Map<string, any>();
  nodes.forEach(n => nodeMap.set(n.id, n));

  // Find center node (selected node or primary case)
  const centerNode = selectedNodeId 
    ? nodes.find(n => n.id === selectedNodeId)
    : nodes.find(n => n.type === "Case") || nodes[0];
  const centerNodeId = centerNode?.id;

  // Ring definitions based on investigation hierarchy (reorganized per requirements)
  const ring1Types = ["Case"]; // FIR / Cases
  const ring2Types = ["Suspect", "Victim", "Witness"]; // People
  const ring3Types = ["Phone", "BankAccount", "Vehicle", "UPI", "SIM", "IMEI"]; // Assets & Accounts
  const ring4Types = ["Location", "Address", "Organisation", "Device", "Weapon", "Evidence", "Person"]; // Organizations & Locations

  // Group nodes by ring
  const ring1Nodes = nodes.filter(n => !centerNodeId || n.id !== centerNodeId).filter(n => ring1Types.includes(n.type));
  const ring2Nodes = nodes.filter(n => !centerNodeId || n.id !== centerNodeId).filter(n => ring2Types.includes(n.type));
  const ring3Nodes = nodes.filter(n => !centerNodeId || n.id !== centerNodeId).filter(n => ring3Types.includes(n.type));
  const ring4Nodes = nodes.filter(n => !centerNodeId || n.id !== centerNodeId).filter(n => ring4Types.includes(n.type));

  // Calculate ring radii with increased spacing (concentric circles) - improved spacing
  const maxRadius = Math.min(canvasWidth, canvasHeight) * 0.45;
  const ring1Radius = maxRadius * 0.20; // Inner ring - Cases
  const ring2Radius = maxRadius * 0.40; // Second ring - People
  const ring3Radius = maxRadius * 0.60; // Third ring - Assets
  const ring4Radius = maxRadius * 0.80; // Outer ring - Organizations & Locations

  // Position center node
  if (centerNodeId) {
    positions.push({
      id: centerNodeId,
      x: centerX,
      y: centerY
    });
  }

  // Helper to position nodes in a ring with better spacing
  const positionInRing = (ringNodes: any[], radius: number, startAngle: number = 0) => {
    const count = ringNodes.length;
    if (count === 0) return;

    // Calculate minimum angular spacing to prevent overlap
    const minAngularSpacing = (2 * Math.PI) / (count + 2); // +2 for buffer

    ringNodes.forEach((node, index) => {
      // Use evenly spaced angles with small offset for variety
      const angle = startAngle + (index + 1) * minAngularSpacing;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      positions.push({ id: node.id, x, y });
    });
  };

  // Position nodes in concentric rings with improved spacing (4 rings)
  positionInRing(ring1Nodes, ring1Radius, 0);
  positionInRing(ring2Nodes, ring2Radius, Math.PI / 8); // Offset for visual variety
  positionInRing(ring3Nodes, ring3Radius, Math.PI / 4); // Different offset
  positionInRing(ring4Nodes, ring4Radius, Math.PI * 3 / 8); // Fourth ring offset

  // Apply enhanced force-directed refinement to prevent overlap (adjusted for smaller nodes)
  const iterations = 200;
  const repulsion = 60000; // Increased repulsion for better spacing
  const collisionRadius = 20; // Adjusted for smaller node sizes

  const posMap = new Map(positions.map(p => [p.id, { x: p.x, y: p.y, vx: 0, vy: 0 }]));

  for (let iter = 0; iter < iterations; iter++) {
    // Repulsion between all nodes
    const ids = Array.from(posMap.keys());
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const pa = posMap.get(ids[i])!;
        const pb = posMap.get(ids[j])!;
        const dx = pb.x - pa.x;
        const dy = pb.y - pa.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.1;
        
        if (dist < collisionRadius) {
          const overlap = collisionRadius - dist;
          const cx = (dx / dist) * overlap * 0.5;
          const cy = (dy / dist) * overlap * 0.5;
          pa.x -= cx;
          pa.y -= cy;
          pb.x += cx;
          pb.y += cy;
        }
      }
    }

    // Keep center node fixed
    if (centerNodeId) {
      const centerPos = posMap.get(centerNodeId);
      if (centerPos) {
        centerPos.x = centerX;
        centerPos.y = centerY;
      }
    }
  }

  return positions.map(p => ({
    id: p.id,
    x: posMap.get(p.id)?.x || centerX,
    y: posMap.get(p.id)?.y || centerY
  }));
}

export default function NetworkGraph({ nodes, edges, onSelectNode }: NetworkGraphProps) {
  const { t, language } = useLanguage();
  
  // UI State
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; node: any } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<EntityType | "All">("All");
  const [filterRelation, setFilterRelation] = useState<RelationType | "All">("All");
  const [viewTab, setViewTab] = useState<"graph" | "directory">("graph");
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Graph statistics
  const [graphStats, setGraphStats] = useState({
    nodes: 0,
    edges: 0,
    communities: 0,
    density: 0,
    connectedComponents: 0
  });

  // Pan/Zoom state
  const [zoom, setZoom] = useState(1.0); // Initial zoom, will be auto-calculated
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isAnimating, setIsAnimating] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false); // For smooth tab transitions

  // Refs
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef(1.0);
  const panRef = useRef({ x: 0, y: 0 });

  // Update refs when state changes
  useEffect(() => {
    zoomRef.current = zoom;
    panRef.current = pan;
  }, [zoom, pan]);

  // Transform raw CSV data to property graph model
  const propertyGraph = useMemo(() => {
    const entityNodes: EntityNode[] = [];
    const relationshipEdges: RelationshipEdge[] = [];
    const nodeMap = new Map<string, EntityNode>();

    // Process nodes from API - handle the exact format returned by backend
    nodes.forEach((node) => {
      let entityType: EntityType = "Person";
      let entityId = node.id;
      let entityLabel = node.label;
      let entityData: Record<string, any> = {};

      // Map node types from API to our entity types
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
        id: entityId,
        type: entityType,
        label: entityLabel,
        data: entityData
      };

      entityNodes.push(entityNode);
      nodeMap.set(entityId, entityNode);
    });

    // Process edges from API - handle the exact format returned by backend
    edges.forEach((edge, idx) => {
      let relationType: RelationType = "CONNECTED_TO";

      // Map relation types from API to our relation types
      switch (edge.relation) {
        case "ACCUSED_IN":
          relationType = "ACCUSED_IN";
          break;
        case "VICTIM_IN":
          relationType = "VICTIM_IN";
          break;
        case "TRANSACTION":
          relationType = "TRANSFERRED_TO";
          break;
        case "ASSOCIATE_OF":
          relationType = "ASSOCIATED_WITH";
          break;
        case "LINKED_TO_CASE":
          relationType = "INVOLVED_IN";
          break;
        default:
          relationType = "CONNECTED_TO";
      }

      const relationshipEdge: RelationshipEdge = {
        id: edge.id || `edge-${idx}`,
        source: edge.source,
        target: edge.target,
        relation: relationType,
        weight: edge.amount ? Math.min(Math.log(edge.amount + 1) / 10, 5) : 1,
        color: RELATION_CONFIG[relationType].color,
        label: RELATION_CONFIG[relationType].label,
        data: {
          amount: edge.amount,
          reason: edge.reason,
          date: edge.date
        }
      };

      relationshipEdges.push(relationshipEdge);
    });

    return { nodes: entityNodes, edges: relationshipEdges };
  }, [nodes, edges]);

  // Compute investigation-centric layout
  const [layoutPositions, setLayoutPositions] = useState<{ id: string; x: number; y: number }[]>([]);
  
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !propertyGraph.nodes.length) {
      setLayoutPositions([]);
      return;
    }
    
    const rect = container.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Use the new investigation-centric layout
    const positions = computeInvestigationLayout(propertyGraph.nodes, propertyGraph.edges, selectedNodeId, centerX, centerY, rect.width, rect.height);
    setLayoutPositions(positions);
    
    // Set up resize observer to recompute layout on container resize
    const resizeObserver = new ResizeObserver(() => {
      if (containerRef.current && propertyGraph.nodes.length) {
        const newRect = containerRef.current.getBoundingClientRect();
        const newCenterX = newRect.width / 2;
        const newCenterY = newRect.height / 2;
        const newPositions = computeInvestigationLayout(propertyGraph.nodes, propertyGraph.edges, selectedNodeId, newCenterX, newCenterY, newRect.width, newRect.height);
        setLayoutPositions(newPositions);
      }
    });
    
    resizeObserver.observe(container);
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [propertyGraph, selectedNodeId]);

  // Update graph statistics
  useEffect(() => {
    const nodeCount = propertyGraph.nodes.length;
    const edgeCount = propertyGraph.edges.length;
    setGraphStats({
      nodes: nodeCount,
      edges: edgeCount,
      communities: new Set(propertyGraph.nodes.map(n => n.type)).size,
      density: nodeCount > 1 ? edgeCount / (nodeCount * (nodeCount - 1) / 2) : 0,
      connectedComponents: 1
    });
  }, [propertyGraph]);

  // Auto-center and fit on load (investigation-centric - refined with proper padding)
  useEffect(() => {
    if (layoutPositions.length > 0 && containerRef.current) {
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      
      // Calculate bounding box of all nodes
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      layoutPositions.forEach(pos => {
        minX = Math.min(minX, pos.x);
        minY = Math.min(minY, pos.y);
        maxX = Math.max(maxX, pos.x);
        maxY = Math.max(maxY, pos.y);
      });
      
      const graphWidth = maxX - minX;
      const graphHeight = maxY - minY;
      const graphCenterX = (minX + maxX) / 2;
      const graphCenterY = (minY + maxY) / 2;
      
      // Calculate zoom to fit with 10% padding
      const padding = 0.10;
      const availableWidth = rect.width * (1 - padding);
      const availableHeight = rect.height * (1 - padding);
      const scaleX = availableWidth / (graphWidth || 1);
      const scaleY = availableHeight / (graphHeight || 1);
      const fitZoom = Math.min(scaleX, scaleY, 1.0); // Cap at 1.0 to prevent over-zooming
      
      // Calculate pan to center the graph
      const fitPanX = rect.width / 2 - graphCenterX * fitZoom;
      const fitPanY = rect.height / 2 - graphCenterY * fitZoom;
      
      setZoom(fitZoom);
      setPan({ x: fitPanX, y: fitPanY });
    }
  }, [layoutPositions]);

  // Camera animation to node (investigation-centric - refined with smooth animation)
  const animateCameraTo = useCallback((nodeId: string) => {
    const pos = layoutPositions.find(p => p.id === nodeId);
    if (!pos || !containerRef.current) return;

    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const targetZoom = 1.3; // Optimized zoom for node focus
    const targetPanX = rect.width / 2 - pos.x * targetZoom;
    const targetPanY = rect.height / 2 - pos.y * targetZoom;

    setIsAnimating(true);
    setIsTransitioning(true);
    
    // Animate zoom and pan smoothly
    const startZoom = zoomRef.current;
    const startPanX = panRef.current.x;
    const startPanY = panRef.current.y;
    const duration = 600;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic

      setZoom(startZoom + (targetZoom - startZoom) * easeProgress);
      setPan({
        x: startPanX + (targetPanX - startPanX) * easeProgress,
        y: startPanY + (targetPanY - startPanY) * easeProgress
      });

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
        setIsTransitioning(false);
      }
    };

    requestAnimationFrame(animate);
  }, [layoutPositions]);

  // Get connected entities for selected node
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
      const edges = connectedEdges.filter(e => e.source === id || e.target === id);
      const relations = edges.map(e => e.relation);
      return {
        id,
        label: node?.label || id,
        type: node?.type || "Unknown",
        relations,
        data: node?.data
      };
    });
  }, [selectedNodeId, propertyGraph]);

  // Get first-degree neighbors for highlighting
  const firstDegreeNeighbors = useMemo(() => {
    if (!selectedNodeId) return new Set<string>();
    
    const neighbors = new Set<string>([selectedNodeId]);
    propertyGraph.edges.forEach(e => {
      if (e.source === selectedNodeId) neighbors.add(e.target);
      if (e.target === selectedNodeId) neighbors.add(e.source);
    });
    
    return neighbors;
  }, [selectedNodeId, propertyGraph]);

  // Get first-degree neighbors for hover
  const hoverNeighbors = useMemo(() => {
    if (!hoveredNodeId) return new Set<string>();
    
    const neighbors = new Set<string>([hoveredNodeId]);
    propertyGraph.edges.forEach(e => {
      if (e.source === hoveredNodeId) neighbors.add(e.target);
      if (e.target === hoveredNodeId) neighbors.add(e.source);
    });
    
    return neighbors;
  }, [hoveredNodeId, propertyGraph]);

  // Generate AI-powered relationship explanation
  const generateRelationshipExplanation = useCallback((node: EntityNode): string => {
    if (!node) return "No entity selected.";

    // Get all connected edges and nodes
    const connectedEdges = propertyGraph.edges.filter(
      e => e.source === node.id || e.target === node.id
    );
    
    const connectedIds = new Set<string>();
    connectedEdges.forEach(e => {
      connectedIds.add(e.source === node.id ? e.target : e.source);
    });

    const connectedNodes = Array.from(connectedIds).map(id => 
      propertyGraph.nodes.find(n => n.id === id)
    ).filter(n => n !== undefined);

    // Count different entity types
    const typeCounts: Record<string, number> = {};
    connectedNodes.forEach(n => {
      typeCounts[n.type] = (typeCounts[n.type] || 0) + 1;
    });

    // Find FIRs, suspects, victims, etc.
    const firs = connectedNodes.filter(n => n.type === "Case");
    const suspects = connectedNodes.filter(n => n.type === "Suspect");
    const victims = connectedNodes.filter(n => n.type === "Victim");
    const accounts = connectedNodes.filter(n => n.type === "BankAccount");
    const phones = connectedNodes.filter(n => n.type === "Phone");
    const locations = connectedNodes.filter(n => n.type === "Location" || n.type === "Address");
    const organizations = connectedNodes.filter(n => n.type === "Organisation");

    // Find strongest relationship (most edges)
    const relationshipCounts: Record<string, number> = {};
    connectedEdges.forEach(e => {
      const otherId = e.source === node.id ? e.target : e.source;
      relationshipCounts[otherId] = (relationshipCounts[otherId] || 0) + 1;
    });

    let strongestConnection = null;
    let maxConnections = 0;
    Object.entries(relationshipCounts).forEach(([id, count]) => {
      if (count > maxConnections) {
        maxConnections = count;
        strongestConnection = propertyGraph.nodes.find(n => n.id === id);
      }
    });

    // Count indirect connections (2nd degree)
    const indirectIds = new Set<string>();
    connectedNodes.forEach(n => {
      propertyGraph.edges.forEach(e => {
        if (e.source === n.id && e.target !== node.id) indirectIds.add(e.target);
        if (e.target === n.id && e.source !== node.id) indirectIds.add(e.source);
      });
    });

    // Generate explanation based on entity type
    let explanation = "";

    if (node.type === "Suspect") {
      explanation = `This suspect is directly linked to ${firs.length} FIR${firs.length !== 1 ? 's' : ''}`;
      if (accounts.length > 0) explanation += `, ${accounts.length} bank account${accounts.length !== 1 ? 's' : ''}`;
      if (phones.length > 0) explanation += `, ${phones.length} phone number${phones.length !== 1 ? 's' : ''}`;
      if (organizations.length > 0) explanation += `, and ${organizations.length} organization${organizations.length !== 1 ? 's' : ''}`;
      explanation += `. `;

      if (firs.length > 0) {
        explanation += `Primary case association${firs.length > 1 ? 's' : ''}: ${firs.slice(0, 2).map(f => f.label).join(', ')}${firs.length > 2 ? ` and ${firs.length - 2} more` : ''}. `;
      }

      if (strongestConnection && firs.length > 0) {
        explanation += `The strongest relationship is with ${strongestConnection.label} (${strongestConnection.type}). `;
      }

      if (accounts.length >= 2) {
        explanation += `Financial connections across ${accounts.length} accounts suggest potential money trails requiring further investigation. `;
      }

      if (indirectIds.size > 0) {
        explanation += `Extended network includes ${indirectIds.size} indirect connections through associates and related entities. `;
      }
    } 
    else if (node.type === "Case") {
      explanation = `This FIR involves ${suspects.length} suspect${suspects.length !== 1 ? 's' : ''}`;
      if (victims.length > 0) explanation += `, ${victims.length} victim${victims.length !== 1 ? 's' : ''}`;
      if (accounts.length > 0) explanation += `, and ${accounts.length} financial account${accounts.length !== 1 ? 's' : ''}`;
      explanation += `. `;

      if (suspects.length > 0) {
        explanation += `Key suspects: ${suspects.slice(0, 3).map(s => s.label).join(', ')}${suspects.length > 3 ? ` and ${suspects.length - 3} more` : ''}. `;
      }

      if (phones.length > 0) {
        explanation += `Communication network involves ${phones.length} phone numbers. `;
      }

      if (indirectIds.size > 0) {
        explanation += `Case ecosystem extends to ${indirectIds.size} related entities through secondary connections. `;
      }
    }
    else if (node.type === "BankAccount") {
      explanation = `This financial account is connected to ${suspects.length} suspect${suspects.length !== 1 ? 's' : ''}`;
      if (firs.length > 0) explanation += ` across ${firs.length} FIR${firs.length !== 1 ? 's' : ''}`;
      if (accounts.length > 0) explanation += ` with ${accounts.length} other account${accounts.length !== 1 ? 's' : ''}`;
      explanation += `. `;

      if (suspects.length > 0) {
        explanation += `Account holders/associates: ${suspects.slice(0, 2).map(s => s.label).join(', ')}${suspects.length > 2 ? ` and ${suspects.length - 2} more` : ''}. `;
      }

      if (accounts.length >= 2) {
        explanation += `Multiple account connections suggest potential financial transactions or money movement patterns. `;
      }

      if (indirectIds.size > 0) {
        explanation += `Financial network extends to ${indirectIds.size} entities through transfer relationships. `;
      }
    }
    else if (node.type === "Phone") {
      explanation = `This phone number is linked to ${suspects.length} suspect${suspects.length !== 1 ? 's' : ''}`;
      if (victims.length > 0) explanation += `, ${victims.length} victim${victims.length !== 1 ? 's' : ''}`;
      if (firs.length > 0) explanation += ` across ${firs.length} case${firs.length !== 1 ? 's' : ''}`;
      explanation += `. `;

      if (suspects.length > 0) {
        explanation += `Primary contacts: ${suspects.slice(0, 2).map(s => s.label).join(', ')}${suspects.length > 2 ? ` and ${suspects.length - 2} more` : ''}. `;
      }

      if (firs.length > 1) {
        explanation += `This number appears in multiple cases, indicating potential cross-case coordination. `;
      }

      if (indirectIds.size > 0) {
        explanation += `Communication network includes ${indirectIds.size} indirect connections through call records and associations. `;
      }
    }
    else if (node.type === "Vehicle") {
      explanation = `This vehicle is associated with ${firs.length} FIR${firs.length !== 1 ? 's' : ''}`;
      if (suspects.length > 0) explanation += ` and ${suspects.length} suspect${suspects.length !== 1 ? 's' : ''}`;
      explanation += `. `;

      if (firs.length > 0) {
        explanation += `Case involvement: ${firs.map(f => f.label).join(', ')}. `;
      }

      if (locations.length > 0) {
        explanation += `Location links include ${locations.length} site${locations.length !== 1 ? 's' : ''}. `;
      }

      if (indirectIds.size > 0) {
        explanation += `Vehicle network extends to ${indirectIds.size} related entities. `;
      }
    }
    else if (node.type === "Organisation") {
      explanation = `This organization is connected to ${suspects.length} suspect${suspects.length !== 1 ? 's' : ''}`;
      if (firs.length > 0) explanation += ` across ${firs.length} FIR${firs.length !== 1 ? 's' : ''}`;
      if (accounts.length > 0) explanation += ` with ${accounts.length} financial account${accounts.length !== 1 ? 's' : ''}`;
      explanation += `. `;

      if (suspects.length > 0) {
        explanation += `Key personnel: ${suspects.slice(0, 3).map(s => s.label).join(', ')}${suspects.length > 3 ? ` and ${suspects.length - 3} more` : ''}. `;
      }

      if (accounts.length > 0) {
        explanation += `Financial infrastructure includes ${accounts.length} account${accounts.length !== 1 ? 's' : ''}. `;
      }

      if (indirectIds.size > 0) {
        explanation += `Organizational network extends to ${indirectIds.size} entities through various relationships. `;
      }
    }
    else if (node.type === "Victim") {
      explanation = `This victim is associated with ${firs.length} FIR${firs.length !== 1 ? 's' : ''}`;
      if (suspects.length > 0) explanation += ` involving ${suspects.length} suspect${suspects.length !== 1 ? 's' : ''}`;
      explanation += `. `;

      if (firs.length > 0) {
        explanation += `Case details: ${firs.map(f => f.label).join(', ')}. `;
      }

      if (phones.length > 0) {
        explanation += `Communication records involve ${phones.length} phone number${phones.length !== 1 ? 's' : ''}. `;
      }

      if (indirectIds.size > 0) {
        explanation += `Victim's network includes ${indirectIds.size} related connections. `;
      }
    }
    else {
      // Generic explanation for other entity types
      explanation = `This ${node.type.toLowerCase()} is directly connected to ${connectedNodes.length} entit${connectedNodes.length !== 1 ? 'ies' : 'y'}`;
      
      const typeDescriptions = Object.entries(typeCounts)
        .filter(([_, count]) => count > 0)
        .map(([type, count]) => `${count} ${type.toLowerCase()}${count !== 1 ? 's' : ''}`)
        .join(', ');
      
      if (typeDescriptions) {
        explanation += `: ${typeDescriptions}. `;
      } else {
        explanation += `. `;
      }

      if (strongestConnection) {
        explanation += `Primary connection is with ${strongestConnection.label} (${strongestConnection.type}). `;
      }

      if (indirectIds.size > 0) {
        explanation += `Extended network includes ${indirectIds.size} indirect connections. `;
      }
    }

    // Add significance assessment
    if (connectedNodes.length === 0) {
      explanation = `This ${node.type.toLowerCase()} has no direct connections in the current dataset. Limited relationship data available for analysis.`;
    } else if (connectedNodes.length <= 2) {
      explanation += `Limited relationship data available. This entity has minimal connections in the current network.`;
    } else if (connectedNodes.length >= 5) {
      explanation += `Highly connected entity with significant investigative relevance due to multiple relationship pathways.`;
    }

    return explanation;
  }, [propertyGraph]);

  // Filter nodes
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

  // Filter edges
  const filteredEdges = useMemo(() => {
    if (!propertyGraph.edges.length) return [];
    return propertyGraph.edges.filter(edge => {
      const matchesRelation = filterRelation === "All" || edge.relation === filterRelation;
      const sourceVisible = filteredNodes.some(n => n.id === edge.source);
      const targetVisible = filteredNodes.some(n => n.id === edge.target);
      return matchesRelation && sourceVisible && targetVisible;
    });
  }, [propertyGraph.edges, filterRelation, filteredNodes]);

  // Interaction handlers
  const handleNodeClick = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    onSelectNode(propertyGraph.nodes.find(n => n.id === nodeId));
    setTooltip(null); // Hide tooltip on click
    animateCameraTo(nodeId);
  };

  const handleNodeHover = (nodeId: string | null, event?: React.MouseEvent) => {
    setHoveredNodeId(nodeId);
    if (nodeId && event) {
      const node = propertyGraph.nodes.find(n => n.id === nodeId);
      if (node) {
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          setTooltip({
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
            node
          });
        }
      }
    } else {
      setTooltip(null);
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

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.max(0.3, Math.min(3, zoom * factor));
    const newPanX = mouseX - (mouseX - pan.x) * (newZoom / zoom);
    const newPanY = mouseY - (mouseY - pan.y) * (newZoom / zoom);
    
    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  const handleZoomIn = () => setZoom(z => Math.min(2.2, z * 1.12));
  const handleZoomOut = () => setZoom(z => Math.max(0.6, z * 0.88));
  const handleFit = () => {
    if (layoutPositions.length > 0 && containerRef.current) {
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      
      // Calculate bounding box of all nodes
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      layoutPositions.forEach(pos => {
        minX = Math.min(minX, pos.x);
        minY = Math.min(minY, pos.y);
        maxX = Math.max(maxX, pos.x);
        maxY = Math.max(maxY, pos.y);
      });
      
      const graphWidth = maxX - minX;
      const graphHeight = maxY - minY;
      const graphCenterX = (minX + maxX) / 2;
      const graphCenterY = (minY + maxY) / 2;
      
      // Calculate zoom to fit with 10% padding
      const padding = 0.10;
      const availableWidth = rect.width * (1 - padding);
      const availableHeight = rect.height * (1 - padding);
      const scaleX = availableWidth / (graphWidth || 1);
      const scaleY = availableHeight / (graphHeight || 1);
      const fitZoom = Math.min(scaleX, scaleY, 1.0);
      
      const fitPanX = rect.width / 2 - graphCenterX * fitZoom;
      const fitPanY = rect.height / 2 - graphCenterY * fitZoom;
      
      setZoom(fitZoom);
      setPan({ x: fitPanX, y: fitPanY });
      setSelectedNodeId(null);
    }
  };
  const handleReset = () => {
    handleFit();
  };

  // Directory interaction (seamless Directory → Graph integration)
  const handleDirectoryClick = (nodeId: string) => {
    const node = propertyGraph.nodes.find(n => n.id === nodeId);
    if (!node) return;

    // Check if entity is currently filtered out
    const isFilteredOut = filterType !== "All" && node.type !== filterType;
    const matchesSearch = !searchQuery || 
      node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.type.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Temporarily clear filters if entity is filtered out
    if (isFilteredOut || !matchesSearch) {
      setFilterType("All");
      setSearchQuery("");
    }

    // Smooth tab transition with animation
    setViewTab("graph");
    
    // Wait for tab transition to start, then initialize graph
    setTimeout(() => {
      // Ensure graph is initialized by checking layout positions
      if (layoutPositions.length === 0) {
        // Graph will initialize automatically due to useEffect dependency
        // We need to wait for layout computation
        setTimeout(() => {
          setSelectedNodeId(nodeId);
          onSelectNode(node);
          animateCameraTo(nodeId);
        }, 300);
      } else {
        // Graph is already initialized, proceed with selection
        setSelectedNodeId(nodeId);
        onSelectNode(node);
        animateCameraTo(nodeId);
      }
    }, 50); // Minimal delay for smooth transition
  };

  if (!propertyGraph.nodes.length) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
        <Network className="w-12 h-12 text-slate-600 animate-pulse" />
        <div className="text-sm font-bold text-slate-400">Loading Criminal Network</div>
        <p className="text-xs text-slate-500">Processing intelligence data from KSP database...</p>
        <p className="text-xs text-slate-600 mt-2">Raw data: {nodes.length} nodes, {edges.length} edges</p>
      </div>
    );
  }

  const selectedNodeData = propertyGraph.nodes.find(n => n.id === selectedNodeId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8 h-[900px]">
      {/* Sidebar */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-[900px] lg:h-auto w-80">
        {/* Header */}
        <div className="flex-shrink-0 p-4 lg:p-5 border-b border-slate-800/60 bg-slate-900/40 space-y-3 lg:space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold tracking-wider uppercase text-amber-500 flex items-center gap-2">
              <Sliders className="w-5 h-5" /> Intelligence Hub
            </h3>
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
        <div className="flex-1 overflow-y-auto p-4 lg:p-5 space-y-4 lg:space-y-5 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
          {/* Search */}
          <div className="space-y-4">
            <div>
              <label className="block text-micro text-slate-400 mb-2 font-medium">Search Intelligence</label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-4 top-3" />
                <input type="text" placeholder="Name, ID, type, location…" value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-sm rounded-lg p-3"
                  style={{ paddingLeft: "2.5rem" }} />
              </div>
            </div>

            {/* Entity Type Filter */}
            <div>
              <label className="block text-micro text-slate-400 mb-2 font-medium">Entity Type</label>
              <div className="flex flex-wrap gap-2">
                {["All", "Suspect", "Victim", "Case", "BankAccount", "Location"].map(t => (
                  <button key={t} onClick={() => setFilterType(t as EntityType | "All")}
                    className={`py-1 px-2 rounded-md text-micro font-bold border transition ${
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
                {["All", "ACCUSED_IN", "VICTIM_IN", "TRANSFERRED_TO", "ASSOCIATED_WITH", "CALLED"].map(r => (
                  <button key={r} onClick={() => setFilterRelation(r as RelationType | "All")}
                    className={`py-1 px-2 rounded-md text-micro font-bold border transition ${
                      filterRelation === r
                        ? "bg-blue-500/10 text-blue-300 border-blue-500/30"
                        : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700"
                    }`}>{r.replace(/_/g, " ")}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Graph Statistics */}
          <div className="border-t border-slate-800/60 pt-4">
            <button onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between text-sm font-bold text-slate-400 hover:text-slate-200 transition">
              <span className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-slate-500" /> Network Statistics
              </span>
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showAdvanced && (
              <div className="space-y-3 mt-4 pt-4 border-t border-slate-900">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                    <div className="text-micro text-slate-500">Nodes</div>
                    <div className="text-base font-bold text-amber-400">{graphStats.nodes}</div>
                  </div>
                  <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                    <div className="text-micro text-slate-500">Edges</div>
                    <div className="text-base font-bold text-blue-400">{graphStats.edges}</div>
                  </div>
                  <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                    <div className="text-micro text-slate-500">Clusters</div>
                    <div className="text-base font-bold text-purple-400">{graphStats.communities}</div>
                  </div>
                  <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                    <div className="text-micro text-slate-500">Density</div>
                    <div className="text-base font-bold text-emerald-400">{graphStats.density.toFixed(3)}</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Inspector Panel */}
          <div className="space-y-5 pt-4 border-t border-slate-800/60">
            {selectedNodeData ? (
              <div className="bg-slate-950/80 rounded-xl border border-slate-800 space-y-3 animate-fadeIn overflow-hidden">
                <div className="px-3 pt-3 pb-2 border-b border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-micro uppercase px-1.5 py-0.5 rounded font-extrabold tracking-wider bg-amber-500/10 text-amber-400">
                      {selectedNodeData.type}
                    </span>
                    <button onClick={() => setSelectedNodeId(null)}
                      className="text-micro text-slate-500 hover:text-slate-300 font-bold underline cursor-pointer">
                      Dismiss
                    </button>
                  </div>
                  <div className="mt-2">
                    <h4 className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                      {ENTITY_CONFIG[selectedNodeData.type]?.icon}
                      {selectedNodeData.label}
                    </h4>
                    <p className="text-micro text-slate-500 font-mono mt-0.5">ID: {selectedNodeId}</p>
                  </div>
                </div>

                <div className="px-3 space-y-3 pb-3">
                  {/* Entity Details */}
                  <div className="text-xs space-y-1.5 bg-slate-900/30 p-2 rounded-lg border border-slate-800/60 text-slate-300">
                    {Object.entries(selectedNodeData.data || {}).filter(([key]) => 
                      !['id', 'label', 'type'].includes(key)
                    ).slice(0, 4).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-slate-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                        <strong className="text-slate-200">{String(value)}</strong>
                      </div>
                    ))}
                  </div>

                  {/* Connected Entities */}
                  <div className="space-y-1.5">
                    <span className="text-micro uppercase tracking-wider font-bold text-slate-500 block">
                      Connected Entities ({connectedEntities.length})
                    </span>
                    {connectedEntities.length > 0 ? (
                      <div className="max-h-32 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
                        {connectedEntities.map((entity) => (
                          <button key={entity.id}
                            onClick={() => handleNodeClick(entity.id)}
                            className="w-full flex items-center justify-between text-left p-1 bg-slate-900/60 border border-slate-800 hover:border-amber-500/30 hover:bg-slate-900 rounded transition-all group cursor-pointer">
                            <div className="flex items-center gap-1 min-w-0">
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
              <div className="flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-800 rounded-xl bg-slate-900/10 text-slate-500 min-h-[120px]">
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

      {/* Main Graph Area */}
      <div className="lg:col-span-3 flex flex-col h-[800px] bg-slate-950 border border-slate-800/80 rounded-xl overflow-hidden relative min-h-[600px]">
        {viewTab === "graph" ? (
          <>
            {/* Top Status Bar (responsive) */}
            <div className="absolute top-3 left-3 lg:left-4 right-3 lg:right-4 z-10 flex items-center justify-between pointer-events-none gap-2">
              <div className="bg-slate-900/90 backdrop-blur-md py-1 px-2 lg:px-3 rounded-full border border-slate-800 text-micro text-slate-300 flex items-center gap-1.5 shadow-lg pointer-events-auto">
                <Move className="w-3 h-3 text-amber-500" />
                <span className="hidden sm:inline">Drag · Scroll to zoom · Click node to inspect</span>
                <span className="sm:hidden">Drag · Scroll · Click</span>
              </div>
              <div className="bg-slate-900/90 backdrop-blur-md py-1 px-2 lg:px-3 rounded-full border border-slate-800 text-micro font-bold text-slate-300 flex items-center gap-1.5 shadow-lg pointer-events-auto">
                <span className="text-amber-400 font-mono">{Math.round(zoom * 100)}%</span>
                <span className="text-slate-600 hidden sm:inline">|</span>
                <span className="hidden sm:inline">{graphStats.nodes} nodes · {graphStats.edges} edges</span>
                <span className="sm:hidden">{graphStats.nodes}n · {graphStats.edges}e</span>
              </div>
            </div>

            {/* SVG Graph Container */}
            <div 
              ref={containerRef}
              className="w-full h-full"
            >
              <svg
                ref={svgRef}
                className="w-full h-full cursor-grab active:cursor-grabbing outline-none select-none"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
              >
                {/* Tooltip */}
                {tooltip && (
                  <g transform={`translate(${tooltip.x + 15}, ${tooltip.y - 15})`}>
                    <rect
                      x={0}
                      y={0}
                      width={200}
                      height={70}
                      rx={8}
                      fill="rgba(15, 23, 42, 0.95)"
                      stroke="rgba(148, 163, 184, 0.3)"
                      strokeWidth={1}
                      style={{ filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.3))" }}
                    />
                    <text
                      x={10}
                      y={20}
                      fill="#fbbf24"
                      fontSize={11}
                      fontWeight={700}
                      style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}
                    >
                      {tooltip.node.type}
                    </text>
                    <text
                      x={10}
                      y={38}
                      fill="white"
                      fontSize={12}
                      fontWeight={600}
                      style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}
                    >
                      {tooltip.node.label.length > 25 ? tooltip.node.label.substring(0, 23) + "…" : tooltip.node.label}
                    </text>
                    <text
                      x={10}
                      y={55}
                      fill="#94a3b8"
                      fontSize={10}
                      fontWeight={500}
                      style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}
                    >
                      ID: {tooltip.node.id}
                    </text>
                  </g>
                )}
                <defs>
                  {/* Glow filters - reduced intensity */}
                  {Object.entries(ENTITY_CONFIG).map(([type, config]) => (
                    <filter key={type} id={`glow-${type}`} x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="2" in="SourceGraphic" result="blurred" />
                      <feMerge>
                        <feMergeNode in="blurred" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  ))}
                </defs>

                {/* Graph transform */}
                <g
                  transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}
                >
                  {/* Edges */}
                  {filteredEdges.map((edge) => {
                    const sourcePos = layoutPositions.find(p => p.id === edge.source);
                    const targetPos = layoutPositions.find(p => p.id === edge.target);
                    if (!sourcePos || !targetPos) return null;

                    const isSelectedEdge = selectedNodeId && (edge.source === selectedNodeId || edge.target === selectedNodeId);
                    const isHoveredEdge = hoveredNodeId && (edge.source === hoveredNodeId || edge.target === hoveredNodeId);
                    const isConnectedToSelected = selectedNodeId && firstDegreeNeighbors.has(edge.source) && firstDegreeNeighbors.has(edge.target);
                    const isConnectedToHover = hoveredNodeId && hoverNeighbors.has(edge.source) && hoverNeighbors.has(edge.target);
                    
                    const relConfig = RELATION_CONFIG[edge.relation];
                    const isDimmed = selectedNodeId && !isConnectedToSelected && !isSelectedEdge;
                    const isHoverDimmed = hoveredNodeId && !isConnectedToHover && !isHoveredEdge;

                    // Improved relationship visualization (enhanced visibility for connected edges)
                    const edgeWidth = isSelectedEdge || isHoveredEdge ? 2.5 : isConnectedToSelected ? 1.8 : 1;
                    const edgeOpacity = isDimmed ? 0.01 : 
                                       isHoverDimmed ? 0.03 : 
                                       isSelectedEdge || isHoveredEdge ? 0.9 : 
                                       isConnectedToSelected ? 0.6 : 
                                       relConfig.opacity;

                    return (
                      <line
                        key={edge.id}
                        x1={sourcePos.x}
                        y1={sourcePos.y}
                        x2={targetPos.x}
                        y2={targetPos.y}
                        stroke={relConfig.color}
                        strokeWidth={edgeWidth}
                        strokeOpacity={edgeOpacity}
                        strokeDasharray={relConfig.dash || undefined}
                        style={{
                          transition: "all 0.3s ease",
                          filter: (isSelectedEdge || isHoveredEdge) ? `drop-shadow(0 0 3px ${relConfig.color})` : undefined // Reduced glow
                        }}
                      />
                    );
                  })}

                  {/* Nodes */}
                  {filteredNodes.map((node) => {
                    const pos = layoutPositions.find(p => p.id === node.id);
                    if (!pos) return null;

                    const config = ENTITY_CONFIG[node.type] || ENTITY_CONFIG.Person;
                    const isSelected = node.id === selectedNodeId;
                    const isHovered = node.id === hoveredNodeId;
                    const isConnectedToSelected = firstDegreeNeighbors.has(node.id);
                    const isConnectedToHover = hoverNeighbors.has(node.id);
                    
                    const isDimmed = selectedNodeId && !isConnectedToSelected && !isSelected;
                    const isHoverDimmed = hoveredNodeId && !isConnectedToHover && !isHovered;

                    // Enhanced visual hierarchy (refined for readability - improved hover/click effects)
                    const nodeSize = isSelected ? config.baseSize * 1.6 : 
                                    isHovered ? config.baseSize * 1.3 : 
                                    config.baseSize;

                    const nodeOpacity = isDimmed ? 0.08 : isHoverDimmed ? 0.15 : 1;
                    const nodeBrightness = isHovered || isSelected ? 1.4 : 1;
                    const nodeGlow = isHovered ? 2 : isSelected ? 3 : 0; // Improved glow

                    return (
                      <g
                        key={node.id}
                        transform={`translate(${pos.x}, ${pos.y})`}
                        className="cursor-pointer outline-none"
                        onClick={() => handleNodeClick(node.id)}
                        onMouseEnter={(e) => handleNodeHover(node.id, e)}
                        onMouseLeave={() => handleNodeHover(null)}
                        style={{
                          opacity: nodeOpacity,
                          transition: "all 0.3s ease",
                          filter: `brightness(${nodeBrightness})`
                        }}
                      >
                        {/* Refined outer glow for selected/hovered */}
                        {(isSelected || isHovered) && (
                          <circle
                            r={nodeSize + nodeGlow}
                            fill="none"
                            stroke={config.color}
                            strokeWidth={2}
                            strokeOpacity={0.4}
                            style={{ filter: `url(#glow-${node.type})` }}
                          />
                        )}

                        {/* Refined selection highlight */}
                        {isSelected && (
                          <>
                            <circle
                              r={nodeSize + 4}
                              fill="none"
                              stroke={config.color}
                              strokeWidth={3}
                              strokeOpacity={0.8}
                            />
                            <circle
                              r={nodeSize + 10}
                              fill="none"
                              stroke={config.color}
                              strokeWidth={1.5}
                              strokeOpacity={0.4}
                              strokeDasharray="4,3"
                            />
                          </>
                        )}

                        {/* Node body */}
                        <circle
                          r={nodeSize}
                          fill={config.color}
                          stroke="rgba(255,255,255,0.3)"
                          strokeWidth={isSelected ? 2 : isHovered ? 1.5 : 1}
                          style={{
                            filter: `url(#glow-${node.type})`,
                            transition: "all 0.3s ease"
                          }}
                        />

                        {/* Label only when selected or hovered (refined - shows entity name and type) */}
                        {(isSelected || isHovered) && (
                          <g>
                            <text
                              x={nodeSize + 8}
                              y={-6}
                              fill="white"
                              fontSize={isSelected ? 11 : 10}
                              fontWeight={isSelected ? 700 : 600}
                              dominantBaseline="middle"
                              style={{
                                textShadow: "0 1px 3px rgba(0,0,0,0.8)",
                                pointerEvents: "none"
                              }}
                            >
                              {node.label.length > 20 ? node.label.substring(0, 18) + "…" : node.label}
                            </text>
                            <text
                              x={nodeSize + 8}
                              y={6}
                              fill="#94a3b8"
                              fontSize={isSelected ? 9 : 8}
                              fontWeight={isSelected ? 600 : 500}
                              dominantBaseline="middle"
                              style={{
                                textShadow: "0 1px 2px rgba(0,0,0,0.8)",
                                pointerEvents: "none"
                              }}
                            >
                              {node.type}
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}
                </g>
              </svg>
            </div>

            {/* Zoom Controls on top of graph (responsive) */}
            <div className="absolute top-1/2 right-2 lg:right-4 transform -translate-y-1/2 z-20 flex flex-col gap-2 bg-slate-900/95 backdrop-blur-md p-2 rounded-2xl border border-slate-700/80 shadow-2xl">
              <button
                onClick={handleZoomIn}
                className="flex flex-col items-center gap-0.5 py-2 px-2 bg-slate-950 hover:bg-amber-500/10 text-slate-300 hover:text-amber-400 rounded-xl border border-slate-800 hover:border-amber-500/40 transition active:scale-95 cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
                <span className="text-micro font-bold text-slate-500">+</span>
              </button>
              <button
                onClick={handleZoomOut}
                className="flex flex-col items-center gap-0.5 py-2 px-2 bg-slate-950 hover:bg-blue-500/10 text-slate-300 hover:text-blue-400 rounded-xl border border-slate-800 hover:border-blue-500/40 transition active:scale-95 cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
                <span className="text-micro font-bold text-slate-500">−</span>
              </button>
              <div className="border-t border-slate-800 my-0.5" />
              <button
                onClick={handleFit}
                className="flex flex-col items-center gap-0.5 py-2 px-2 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-slate-100 rounded-xl border border-slate-800 transition active:scale-95 cursor-pointer"
                title="Fit Graph"
              >
                <Maximize2 className="w-4 h-4" />
                <span className="text-micro font-bold text-slate-500">FIT</span>
              </button>
              <button
                onClick={handleReset}
                className="flex flex-col items-center gap-0.5 py-2 px-2 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 rounded-xl border border-slate-800 transition active:scale-95 cursor-pointer"
                title="Reset View"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="text-micro font-bold text-slate-500">RESET</span>
              </button>
            </div>

            {/* Enhanced Legend - all categories (responsive) */}
            <div className="absolute bottom-5 left-5 z-10 bg-slate-900/95 backdrop-blur-md p-4 lg:p-5 rounded-2xl border border-slate-700/80 shadow-2xl space-y-3 max-w-xs lg:max-w-sm hidden sm:block">
              <div className="text-sm font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-700/50 pb-3">Entity Legend</div>
              <div className="grid grid-cols-2 gap-x-4 lg:gap-x-5 gap-y-2">
                {[
                  { type: "FIR/Case", color: "#f59e0b" },
                  { type: "Suspect", color: "#ef4444" },
                  { type: "Victim", color: "#3b82f6" },
                  { type: "Witness", color: "#8b5cf6" },
                  { type: "Bank Account", color: "#10b981" },
                  { type: "Phone", color: "#f97316" },
                  { type: "Vehicle", color: "#06b6d4" },
                  { type: "Location", color: "#84cc16" },
                  { type: "Organisation", color: "#6366f1" },
                  { type: "UPI/Crypto", color: "#f43f5e" },
                  { type: "SIM", color: "#a855f7" },
                  { type: "IMEI", color: "#d946ef" },
                  { type: "Address", color: "#14b8a6" },
                  { type: "Device", color: "#22c55e" },
                  { type: "Weapon", color: "#dc2626" },
                  { type: "Evidence", color: "#eab308" },
                ].map(item => (
                  <div key={item.type} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-slate-300 font-medium">{item.type}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          /* Directory View - fixed scrolling (responsive) */
          <div className="flex-1 flex flex-col h-full bg-slate-950/90 overflow-hidden">
            <div className="flex-shrink-0 p-4 lg:p-6 border-b border-slate-800/80">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-lg lg:text-lg font-extrabold text-slate-100 flex items-center gap-3">
                    <List className="w-6 h-6 text-amber-500" /> Intelligence Directory
                  </h3>
                  <p className="text-sm text-slate-400 mt-1">Click any entity to center and highlight in graph view</p>
                </div>
                <span className="text-sm font-bold text-amber-400 bg-amber-500/10 px-4 py-1.5 rounded-full border border-amber-500/30">
                  {filteredNodes.length} Entities
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900 p-4 lg:p-6">
              <div className="border border-slate-800/80 rounded-xl bg-slate-950">
                {filteredNodes.length > 0 ? (
                  <div className="divide-y divide-slate-900">
                    {filteredNodes.map((node) => (
                      <div key={node.id}
                        onClick={() => handleDirectoryClick(node.id)}
                        className={`p-4 hover:bg-slate-900/80 transition flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer group ${
                          selectedNodeId === node.id ? "bg-amber-500/10 border-l-4 border-amber-500" : ""
                        }`}>
                        <div className="space-y-2">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="text-micro uppercase px-3 py-1 rounded font-extrabold tracking-wider bg-slate-800 text-slate-300">
                              {node.type}
                            </span>
                            <span className="text-base font-bold text-slate-100 group-hover:text-amber-400 transition-colors">{node.label}</span>
                          </div>
                          <p className="text-sm text-slate-400">
                            {node.data && Object.entries(node.data).slice(0, 2).map(([k, v]) => (
                              <span key={k} className="mr-3">{k}: {String(v)}</span>
                            ))}
                          </p>
                        </div>
                        <button className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded text-sm transition flex items-center gap-2 cursor-pointer active:scale-95 shrink-0">
                          <Sparkles className="w-4 h-4 fill-slate-950" /> View
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500">
                    <Search className="w-10 h-10 text-slate-700 mb-3" />
                    <p className="text-sm font-bold">No Records Match Filters</p>
                    <p className="text-micro text-slate-600 mt-2">Try modifying the search query or filters</p>
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