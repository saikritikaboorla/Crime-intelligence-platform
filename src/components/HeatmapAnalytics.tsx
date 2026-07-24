import React, { useState, useMemo, useEffect, useRef } from "react";
import L from "leaflet";
import {
  MapPin, Layers, Filter, TrendingUp, AlertTriangle, Users, DollarSign,
  Building2, ZoomIn, ZoomOut, RotateCcw, X, Eye, EyeOff, ShieldAlert,
  Calendar, FileText, Compass, Map as MapIcon, ChevronRight
} from "lucide-react";
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer,
  Cell, BarChart, Bar, CartesianGrid, Legend
} from "recharts";

interface HeatmapAnalyticsProps {
  heatmapData: any[];
  onNavigate: (tab: string) => void;
  logAuditEvent: (action: string, details: string) => void;
}

// ── GeoJSON Polygons for India Outline and Karnataka Highlight ──────────────
const karnatakaGeoJSON: any = {
  type: "Feature",
  properties: { name: "Karnataka", code: "KA", isTargetState: true },
  geometry: {
    type: "Polygon",
    coordinates: [[
      [74.05, 14.85], [74.15, 15.00], [74.25, 15.45], [74.12, 15.80], [74.45, 15.85],
      [74.75, 16.15], [75.10, 16.50], [75.05, 16.85], [75.40, 17.15], [75.75, 17.50],
      [76.25, 17.75], [77.10, 17.95], [77.60, 17.70], [77.40, 17.20], [77.15, 16.80],
      [77.35, 16.30], [77.60, 15.80], [77.20, 15.30], [77.60, 14.90], [78.20, 14.60],
      [78.35, 14.10], [78.40, 13.60], [78.45, 13.00], [78.00, 12.70], [77.45, 12.35],
      [77.00, 12.00], [76.50, 11.90], [76.10, 11.75], [75.70, 11.95], [75.40, 12.30],
      [75.15, 12.75], [74.70, 13.15], [74.70, 13.60], [74.35, 14.10], [74.10, 14.45],
      [74.05, 14.85]
    ]]
  }
};

const indiaGeoJSON: any = {
  type: "Feature",
  properties: { name: "India" },
  geometry: {
    type: "Polygon",
    coordinates: [[
      [74.86, 37.08], [75.74, 36.26], [77.84, 35.50], [79.25, 32.90], [78.90, 31.80],
      [80.05, 31.00], [81.00, 30.20], [80.30, 28.60], [88.10, 27.90], [88.90, 27.30],
      [91.70, 27.80], [92.10, 26.80], [95.10, 28.20], [97.40, 28.00], [96.30, 26.10],
      [94.30, 24.00], [92.40, 24.30], [91.80, 23.00], [91.40, 24.10], [89.80, 26.00],
      [88.80, 26.40], [88.90, 21.60], [86.90, 21.50], [84.90, 19.80], [83.20, 18.10],
      [80.20, 14.00], [79.80, 11.90], [79.80, 10.30], [78.10, 8.10], [77.50, 8.10],
      [76.70, 9.40], [75.80, 11.20], [74.70, 13.30], [73.80, 15.50], [72.80, 18.90],
      [72.80, 21.10], [68.70, 23.70], [70.50, 24.60], [71.00, 27.80], [74.40, 31.60],
      [74.50, 33.90], [74.86, 37.08]
    ]]
  }
};

export default function HeatmapAnalytics({ heatmapData, onNavigate, logAuditEvent }: HeatmapAnalyticsProps) {
  const [selectedLayer, setSelectedLayer] = useState<string>("all");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("all");
  const [crimeTypeFilter, setCrimeTypeFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [monthFilter, setMonthFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Interactive Map Controls & Aggregated Modal State
  const [showHeatmapLayer, setShowHeatmapLayer] = useState<boolean>(true);
  const [showMarkersLayer, setShowMarkersLayer] = useState<boolean>(true);
  const [selectedHotspot, setSelectedHotspot] = useState<any | null>(null);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // ── Extract Unique Values for Filters ─────────────────────────────────────
  const districts = useMemo(() => {
    const unique = [...new Set(heatmapData.map(d => d.district))].filter(Boolean);
    return ["all", ...unique];
  }, [heatmapData]);

  const crimeTypes = useMemo(() => {
    const unique = [...new Set(heatmapData.map(d => d.crimeType))].filter(Boolean);
    return ["all", ...unique];
  }, [heatmapData]);

  const years = useMemo(() => {
    const unique = [...new Set(heatmapData.map(d => d.date ? new Date(d.date).getFullYear().toString() : null))].filter(Boolean);
    return ["all", ...unique.sort()];
  }, [heatmapData]);

  const months = useMemo(() => {
    return ["all", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
  }, []);

  const statuses = useMemo(() => {
    const unique = [...new Set(heatmapData.map(d => d.status))].filter(Boolean);
    return ["all", ...unique];
  }, [heatmapData]);

  // ── Filtered Data ────────────────────────────────────────────────────────
  const filteredData = useMemo(() => {
    return heatmapData.filter(item => {
      const districtMatch = selectedDistrict === "all" || item.district === selectedDistrict;
      const crimeMatch = crimeTypeFilter === "all" || item.crimeType === crimeTypeFilter;
      const layerMatch = selectedLayer === "all" || item.layer === selectedLayer;
      const yearMatch = yearFilter === "all" || (item.date && new Date(item.date).getFullYear().toString() === yearFilter);
      const monthMatch = monthFilter === "all" || (item.date && (new Date(item.date).getMonth() + 1).toString() === monthFilter);
      const severityMatch = severityFilter === "all" || item.severity === severityFilter;
      const statusMatch = statusFilter === "all" || item.status === statusFilter;
      return districtMatch && crimeMatch && layerMatch && yearMatch && monthMatch && severityMatch && statusMatch;
    });
  }, [heatmapData, selectedDistrict, crimeTypeFilter, selectedLayer, yearFilter, monthFilter, severityFilter, statusFilter]);

  // ── Statistics ───────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const totalCrimes = filteredData.length;
    const heinousCrimes = filteredData.filter(d => d.severity === "heinous").length;
    const districtsAffected = new Set(filteredData.map(d => d.district)).size;
    const suspiciousFinancial = filteredData.filter(d => d.isSuspicious).length;
    const activeStations = new Set(filteredData.map(d => d.station).filter(Boolean)).size;
    return { totalCrimes, heinousCrimes, districtsAffected, suspiciousFinancial, activeStations };
  }, [filteredData]);

  const layerCounts = useMemo(() => {
    return {
      case: filteredData.filter(d => d.layer === "case").length,
      arrest: filteredData.filter(d => d.layer === "arrest").length,
      financial: filteredData.filter(d => d.layer === "financial").length,
    };
  }, [filteredData]);

  const monthlyData = useMemo(() => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthMap: Record<string, number> = {};
    filteredData.forEach(item => {
      if (item.date) {
        const date = new Date(item.date);
        const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
        monthMap[monthKey] = (monthMap[monthKey] || 0) + 1;
      }
    });
    return Object.entries(monthMap)
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => {
        const [aMonth, aYear] = a.month.split(' ');
        const [bMonth, bYear] = b.month.split(' ');
        const aIndex = monthNames.indexOf(aMonth);
        const bIndex = monthNames.indexOf(bMonth);
        if (aYear !== bYear) return parseInt(aYear) - parseInt(bYear);
        return aIndex - bIndex;
      });
  }, [filteredData]);

  // Color intensity for district density bars
  const getHeatColor = (intensity: number) => {
    if (intensity >= 80) return "#dc2626";
    if (intensity >= 60) return "#f59e0b";
    if (intensity >= 40) return "#fbbf24";
    if (intensity >= 20) return "#fcd34d";
    return "#34d399";
  };

  const monthNames = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // ── Render Heatmap Density on HTML5 Canvas Overlay ───────────────────────
  const renderCanvasHeatmap = (mapInst: L.Map, points: any[]) => {
    const canvas = canvasRef.current;
    if (!canvas || !showHeatmapLayer) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = mapInst.getSize();
    canvas.width = size.x;
    canvas.height = size.y;
    ctx.clearRect(0, 0, size.x, size.y);

    if (!points.length) return;

    const zoom = mapInst.getZoom();
    const radius = Math.max(25, Math.min(75, zoom * 7));

    // Create offscreen grayscale alpha shadow canvas
    const shadowCanvas = document.createElement("canvas");
    shadowCanvas.width = size.x;
    shadowCanvas.height = size.y;
    const shadowCtx = shadowCanvas.getContext("2d");
    if (!shadowCtx) return;

    points.forEach(pt => {
      if (!pt.lat || !pt.lng) return;
      const ptPx = mapInst.latLngToContainerPoint([pt.lat, pt.lng]);
      const w = (pt.weight || 5) / 10;
      const r = radius * (pt.severity === "heinous" ? 1.4 : 1.0);

      const grad = shadowCtx.createRadialGradient(ptPx.x, ptPx.y, 0, ptPx.x, ptPx.y, r);
      grad.addColorStop(0, `rgba(0,0,0,${0.85 * w})`);
      grad.addColorStop(0.5, `rgba(0,0,0,${0.45 * w})`);
      grad.addColorStop(1, "rgba(0,0,0,0)");

      shadowCtx.fillStyle = grad;
      shadowCtx.beginPath();
      shadowCtx.arc(ptPx.x, ptPx.y, r, 0, Math.PI * 2);
      shadowCtx.fill();
    });

    // Colorize using precomputed gradient spectrum
    const imgData = shadowCtx.getImageData(0, 0, size.x, size.y);
    const data = imgData.data;

    // Palette: Blue -> Emerald -> Amber -> Red -> Dark Maroon
    const palCanvas = document.createElement("canvas");
    palCanvas.width = 256;
    palCanvas.height = 1;
    const palCtx = palCanvas.getContext("2d");
    if (palCtx) {
      const palGrad = palCtx.createLinearGradient(0, 0, 256, 0);
      palGrad.addColorStop(0.00, "rgba(0, 0, 0, 0)");
      palGrad.addColorStop(0.18, "rgba(59, 130, 246, 0.45)");
      palGrad.addColorStop(0.40, "rgba(16, 185, 129, 0.65)");
      palGrad.addColorStop(0.65, "rgba(245, 158, 11, 0.82)");
      palGrad.addColorStop(0.85, "rgba(239, 68, 68, 0.95)");
      palGrad.addColorStop(1.00, "rgba(153, 27, 27, 1.00)");
      palCtx.fillStyle = palGrad;
      palCtx.fillRect(0, 0, 256, 1);
      const palBytes = palCtx.getImageData(0, 0, 256, 1).data;

      for (let i = 3; i < data.length; i += 4) {
        const alpha = data[i];
        if (alpha > 0) {
          const palIdx = alpha * 4;
          data[i - 3] = palBytes[palIdx];
          data[i - 2] = palBytes[palIdx + 1];
          data[i - 1] = palBytes[palIdx + 2];
          data[i]     = Math.min(235, palBytes[palIdx + 3] * 1.15);
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
  };

  // ── Leaflet Map Lifecycle & Rendering ─────────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Bounds for India
      const indiaBounds = L.latLngBounds([6.0, 68.0], [37.5, 97.5]);

      const map = L.map(mapContainerRef.current, {
        center: [20.5937, 78.9629], // India Geographic Center
        zoom: 5,
        minZoom: 4,
        maxZoom: 14,
        maxBounds: indiaBounds,
        zoomControl: false,
        attributionControl: false,
      });

      // CartoDB Dark Matter tile layer for dark security aesthetic
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        subdomains: "abcd",
        maxZoom: 19,
      }).addTo(map);

      // GeoJSON India Outline
      L.geoJSON(indiaGeoJSON, {
        style: {
          color: "rgba(148, 163, 184, 0.5)",
          weight: 1.5,
          fillColor: "rgba(15, 23, 42, 0.4)",
          fillOpacity: 0.3,
        }
      }).addTo(map);

      // GeoJSON Karnataka State Polygon (Highlighted)
      const karnatakaLayer = L.geoJSON(karnatakaGeoJSON, {
        style: {
          color: "#f59e0b",
          weight: 2.5,
          fillColor: "rgba(245, 158, 11, 0.18)",
          fillOpacity: 0.8,
          dashArray: "4 2",
        }
      }).addTo(map);

      // Tooltip for Karnataka state highlight
      karnatakaLayer.bindTooltip("<b>Karnataka State</b><br/>High-Density Analytics Jurisdiction", {
        permanent: false,
        direction: "center",
        className: "karnataka-tooltip bg-slate-900 border border-amber-500/50 text-amber-300 text-xs px-2 py-1 rounded shadow-xl font-semibold"
      });

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Remove existing marker layer group if present
    const existingGroup = (map as any)._markerGroup;
    if (existingGroup) {
      map.removeLayer(existingGroup);
    }

    // Hotspot Markers Layer
    const markerGroup = L.layerGroup();
    (map as any)._markerGroup = markerGroup;

    if (showMarkersLayer) {
      // Group points by location / station for aggregated click handling
      const locationMap = new Map<string, any[]>();
      filteredData.forEach(item => {
        if (!item.lat || !item.lng) return;
        const key = `${item.station || item.district}_${item.lat.toFixed(3)}_${item.lng.toFixed(3)}`;
        const list = locationMap.get(key) || [];
        list.push(item);
        locationMap.set(key, list);
      });

      locationMap.forEach((cases, _key) => {
        const first = cases[0];
        const isHeinous = cases.some(c => c.severity === "heinous");
        const isFinancial = cases.some(c => c.layer === "financial");
        const isArrest = cases.some(c => c.layer === "arrest");
        const color = isFinancial ? "#f87171" : isHeinous ? "#ef4444" : isArrest ? "#a78bfa" : "#f59e0b";
        const count = cases.length;

        // Custom HTML DivIcon with glowing aura
        const customIcon = L.divIcon({
          className: "custom-hotspot-node",
          iconSize: [28, 28],
          iconAnchor: [14, 14],
          html: `
            <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
              ${isHeinous ? `<div style="position: absolute; inset: -4px; border-radius: 50%; background: ${color}; opacity: 0.35; animation: ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>` : ''}
              <div style="width: 22px; height: 22px; border-radius: ${isFinancial ? '3px' : '50%'}; background: ${color}; border: 2px solid #020617; box-shadow: 0 0 12px ${color}b0; transform: ${isFinancial ? 'rotate(45deg)' : 'none'}; display: flex; align-items: center; justify-content: center; color: #020617; font-weight: 800; font-size: 10px; flex-shrink: 0;">
                <span style="transform: ${isFinancial ? 'rotate(-45deg)' : 'none'}">${count}</span>
              </div>
            </div>
          `
        });

        const marker = L.marker([first.lat, first.lng], { icon: customIcon });

        // Click event opens Aggregated Hotspot Intelligence Modal
        marker.on("click", () => {
          setSelectedHotspot({
            station: first.station,
            district: first.district,
            lat: first.lat,
            lng: first.lng,
            cases: cases,
          });
          logAuditEvent("Hotspot Clicked", `Opened aggregated details for ${first.station} (${cases.length} cases)`);
        });

        // Hover tooltip
        marker.bindTooltip(`
          <div style="padding: 4px; font-family: sans-serif;">
            <div style="font-weight: 700; color: ${color}">${first.station || first.district}</div>
            <div style="font-size: 11px; color: #cbd5e1;">${count} Incident(s) Registered</div>
            <div style="font-size: 10px; color: #94a3b8; font-style: italic;">Click to view aggregated details</div>
          </div>
        `, { className: "bg-slate-950 border border-slate-700 text-slate-100 rounded-lg shadow-2xl" });

        markerGroup.addLayer(marker);
      });

      markerGroup.addTo(map);
    }

    // Render Canvas Heatmap Overlay
    renderCanvasHeatmap(map, filteredData);

    const handleMapMove = () => {
      renderCanvasHeatmap(map, filteredData);
    };

    map.on("move", handleMapMove);
    map.on("zoomend", handleMapMove);
    map.on("resize", handleMapMove);

    return () => {
      map.off("move", handleMapMove);
      map.off("zoomend", handleMapMove);
      map.off("resize", handleMapMove);
    };
  }, [filteredData, showHeatmapLayer, showMarkersLayer]);

  // Map Controls Helpers
  const handleZoomIn = () => mapInstanceRef.current?.zoomIn();
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut();
  const handleFitIndia = () => {
    mapInstanceRef.current?.setView([20.5937, 78.9629], 5);
    logAuditEvent("Map Control", "Reset view to India Bounds");
  };
  const handleFocusKarnataka = () => {
    mapInstanceRef.current?.setView([15.3173, 75.7139], 7);
    logAuditEvent("Map Control", "Focused on Karnataka State");
  };

  return (
    <div className="space-y-6 flex flex-col h-full overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
      
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800/60 pb-4 gap-3">
        <div>
          <h2 className="section-title flex items-center gap-2">
            <MapPin className="w-5 h-5 text-rose-500" />
            Geographic Crime Incident Heatmap Analytics
          </h2>
          <p className="section-subtitle mt-1">
            Real India Map · Highlighted Karnataka Jurisdiction · Dynamic Crime Density Heatmap & Hotspot Aggregation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleFocusKarnataka}
            className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-400 text-xs font-bold rounded-lg transition flex items-center gap-1.5"
          >
            <Compass className="w-4 h-4" /> Focus Karnataka
          </button>
          <button
            onClick={handleFitIndia}
            className="px-3 py-1.5 bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-300 text-xs font-bold rounded-lg transition flex items-center gap-1.5"
          >
            <MapIcon className="w-4 h-4 text-blue-400" /> Fit India View
          </button>
        </div>
      </div>

      {/* ── KPI Stats Cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500 font-semibold uppercase">Total Cases</span>
            <MapPin className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100">{stats.totalCrimes}</div>
          <div className="text-xs text-slate-600 mt-1">Geocoded FIR records</div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500 font-semibold uppercase">Heinous</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400">{stats.heinousCrimes}</div>
          <div className="text-xs text-slate-600 mt-1">Critical severity offences</div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500 font-semibold uppercase">Districts</span>
            <Layers className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">{stats.districtsAffected}</div>
          <div className="text-xs text-slate-600 mt-1">Active jurisdictions</div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500 font-semibold uppercase">Financial Fraud</span>
            <DollarSign className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">{stats.suspiciousFinancial}</div>
          <div className="text-xs text-slate-600 mt-1">Flagged laundering cases</div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500 font-semibold uppercase">Stations</span>
            <Building2 className="w-4 h-4 text-violet-400" />
          </div>
          <div className="text-2xl font-bold text-violet-400">{stats.activeStations}</div>
          <div className="text-xs text-slate-600 mt-1">Active police stations</div>
        </div>
      </div>

      {/* ── Filters Row ───────────────────────────────────────────────────── */}
      <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">Active Filters</span>
          </div>
          <span className="text-xs text-slate-500">Showing {filteredData.length} of {heatmapData.length} records</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-500 uppercase font-semibold">Layer</label>
            <select
              value={selectedLayer}
              onChange={e => setSelectedLayer(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-300 text-xs px-2 py-1.5 rounded-lg focus:outline-none focus:border-amber-500/50"
            >
              <option value="all">All Layers</option>
              <option value="case">Crime Incidents</option>
              <option value="arrest">Arrests</option>
              <option value="financial">Financial Fraud</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-500 uppercase font-semibold">District</label>
            <select
              value={selectedDistrict}
              onChange={e => setSelectedDistrict(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-300 text-xs px-2 py-1.5 rounded-lg focus:outline-none focus:border-amber-500/50"
            >
              {districts.map(d => (
                <option key={d} value={d}>{d === "all" ? "All Districts" : d}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-500 uppercase font-semibold">Crime Type</label>
            <select
              value={crimeTypeFilter}
              onChange={e => setCrimeTypeFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-300 text-xs px-2 py-1.5 rounded-lg focus:outline-none focus:border-amber-500/50"
            >
              {crimeTypes.map(t => (
                <option key={t} value={t}>{t === "all" ? "All Types" : t}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-500 uppercase font-semibold">Year</label>
            <select
              value={yearFilter}
              onChange={e => setYearFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-300 text-xs px-2 py-1.5 rounded-lg focus:outline-none focus:border-amber-500/50"
            >
              {years.map(y => (
                <option key={y} value={y}>{y === "all" ? "All Years" : y}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-500 uppercase font-semibold">Month</label>
            <select
              value={monthFilter}
              onChange={e => setMonthFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-300 text-xs px-2 py-1.5 rounded-lg focus:outline-none focus:border-amber-500/50"
            >
              {months.map(m => (
                <option key={m} value={m}>{m === "all" ? "All Months" : monthNames[parseInt(m)]}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-slate-500 uppercase font-semibold">Severity</label>
            <select
              value={severityFilter}
              onChange={e => setSeverityFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-300 text-xs px-2 py-1.5 rounded-lg focus:outline-none focus:border-amber-500/50"
            >
              <option value="all">All Severity</option>
              <option value="heinous">Heinous</option>
              <option value="standard">Standard</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSelectedLayer("all");
                setSelectedDistrict("all");
                setCrimeTypeFilter("all");
                setYearFilter("all");
                setMonthFilter("all");
                setSeverityFilter("all");
                setStatusFilter("all");
              }}
              className="w-full text-xs text-slate-500 hover:text-amber-400 border border-slate-800 hover:border-amber-500/30 px-3 py-1.5 rounded-lg transition font-semibold"
            >
              Reset All
            </button>
          </div>
        </div>

        {/* Breakdown Badges */}
        <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-slate-800/60">
          <span className="text-[10px] text-slate-500 uppercase font-bold mr-1 self-center">Layer Breakdown:</span>
          <span className="flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[11px] font-semibold px-3 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
            Crime Incidents: {layerCounts.case}
          </span>
          <span className="flex items-center gap-1.5 bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[11px] font-semibold px-3 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-violet-400 inline-block" />
            Arrests: {layerCounts.arrest}
          </span>
          <span className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] font-semibold px-3 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" />
            Financial Fraud: {layerCounts.financial}
          </span>
        </div>
      </div>

      {/* ── Main Section: Leaflet Map of India + Density Sidebar ──────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">

        {/* Left 3 cols: Leaflet Interactive Map of India with Karnataka Highlight */}
        <div className="xl:col-span-3 bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col relative min-h-[550px]">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-bold text-amber-500 uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5" /> India Crime Heatmap — Karnataka Highlighted
              </h3>
              <p className="text-[11px] text-slate-500">
                Interactive Leaflet Engine · Full India Outline · Karnataka Highlighted · Gaussian Kernel Heatmap
              </p>
            </div>
            {/* Map Action Controls */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-xl p-1 shadow-lg">
              <button
                onClick={handleZoomIn}
                title="Zoom In"
                className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={handleZoomOut}
                title="Zoom Out"
                className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={handleFitIndia}
                title="Reset to Fit India View"
                className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <div className="w-[1px] h-4 bg-slate-800 mx-1" />
              <button
                onClick={() => setShowHeatmapLayer(!showHeatmapLayer)}
                title="Toggle Heatmap Layer"
                className={`px-2 py-1 text-[11px] font-bold rounded-lg transition flex items-center gap-1 ${
                  showHeatmapLayer ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {showHeatmapLayer ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />} Heat Density
              </button>
              <button
                onClick={() => setShowMarkersLayer(!showMarkersLayer)}
                title="Toggle Hotspot Markers Layer"
                className={`px-2 py-1 text-[11px] font-bold rounded-lg transition flex items-center gap-1 ${
                  showMarkersLayer ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {showMarkersLayer ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />} Hotspots
              </button>
            </div>
          </div>

          {/* Leaflet Container */}
          <div className="relative flex-1 rounded-xl border border-slate-800/80 overflow-hidden min-h-[460px]">
            <div ref={mapContainerRef} className="w-full h-full min-h-[460px] bg-slate-950 z-0" />

            {/* Overlay HTML5 Canvas for Heatmap Density Rendering */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 pointer-events-none z-10"
            />

            {/* Map Bottom-Left Custom Legend */}
            <div className="absolute bottom-3 left-3 bg-slate-950/90 border border-slate-800 p-3 rounded-xl z-20 backdrop-blur-md shadow-2xl space-y-2 max-w-[260px]">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Map Legend & Spectrum</div>

              {/* Heat gradient bar */}
              <div className="space-y-1">
                <div className="h-2 w-full rounded-full bg-gradient-to-r from-blue-500 via-emerald-400 via-amber-400 to-rose-600" />
                <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                  <span>Low Density</span>
                  <span>Moderate</span>
                  <span className="text-rose-400 font-bold">Critical</span>
                </div>
              </div>

              {/* Symbols */}
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] pt-1 border-t border-slate-800/80">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 border border-slate-900 inline-block animate-pulse" />
                  <span className="text-slate-300">Heinous FIR</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-slate-900 inline-block" />
                  <span className="text-slate-300">Standard FIR</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-violet-400 border border-slate-900 inline-block" />
                  <span className="text-slate-300">Arrest Point</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-rose-400 rotate-45 border border-slate-900 inline-block" />
                  <span className="text-slate-300">Fraud Account</span>
                </div>
              </div>

              {/* Karnataka Badge */}
              <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400" /> Karnataka State
                </span>
                <span className="text-slate-500">Highlighted Polygon</span>
              </div>
            </div>

            {/* Instruction tooltip banner */}
            <div className="absolute top-3 left-3 bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-lg text-[10px] text-slate-400 z-20 backdrop-blur-md">
              💡 <span className="text-slate-300 font-semibold">Click any hotspot marker</span> to view aggregated intelligence report
            </div>
          </div>
        </div>

        {/* Right 2 cols: District Density Sidebar */}
        <div className="xl:col-span-2 bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col gap-4">
          <h3 className="text-xs font-bold text-amber-500 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5" /> Crime Density by District
          </h3>
          <DistrictDensityChart data={filteredData} getHeatColor={getHeatColor} onSelectDistrict={(d) => setSelectedDistrict(d)} />
        </div>
      </div>

      {/* ── Bottom Section: GPS Scatter & Hotspot Register ────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">

        {/* GPS Scatter Density (Lat x Lng) */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
          <h3 className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-2 flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5" /> GPS Coordinates Scatter Density (Lat × Lng)
          </h3>
          <p className="text-[11px] text-slate-500 mb-3">Each node = geocoded FIR · Size = gravity weight · Color = crime head</p>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
                <XAxis
                  dataKey="lng" type="number" domain={[74, 79]}
                  name="Longitude" tick={{ fill: '#64748b', fontSize: 9 }}
                  label={{ value: 'Longitude →', position: 'insideBottom', offset: -10, fill: '#475569', fontSize: 9 }}
                />
                <YAxis
                  dataKey="lat" type="number" domain={[11, 19]}
                  name="Latitude" tick={{ fill: '#64748b', fontSize: 9 }}
                  label={{ value: 'Lat', angle: -90, position: 'insideLeft', fill: '#475569', fontSize: 9 }}
                />
                <ZAxis dataKey="weight" range={[40, 180]} name="Severity" />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3', stroke: '#334155' }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0]?.payload;
                    return (
                      <div className="bg-slate-950 border border-slate-700 p-3 rounded-xl text-xs space-y-1 max-w-[220px]">
                        <div className="font-bold text-amber-400">{d?.crimeType}</div>
                        <div className="text-slate-400">{d?.station}</div>
                        <div className="text-slate-500 font-mono text-[10px]">{d?.date?.substring(0,10)}</div>
                        <div className="text-slate-500 font-mono text-[10px]">({d?.lat?.toFixed(4)}, {d?.lng?.toFixed(4)})</div>
                        {d?.suspectName && d.suspectName !== "Unknown" && (
                          <div className="text-violet-400 text-[10px] font-semibold">Suspect: {d.suspectName}</div>
                        )}
                        {d?.amount != null && (
                          <div className="text-rose-400 text-[10px] font-semibold">Amount: ₹{d.amount.toLocaleString()}</div>
                        )}
                      </div>
                    );
                  }}
                />
                <Scatter data={filteredData.filter(d => d.lat && d.lng)} name="Crimes">
                  {filteredData.filter(d => d.lat && d.lng).map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill={
                        entry.layer === "financial" ? "#f87171" :
                        entry.severity === "heinous" ? "#dc2626" :
                        entry.layer === "arrest" ? "#a78bfa" :
                        entry.crimeType?.includes("Cyber") ? "#38bdf8" :
                        entry.crimeType?.includes("Drug") || entry.crimeType?.includes("Narcotics") ? "#4ade80" :
                        "#f59e0b"
                      }
                      fillOpacity={0.75}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hotspot Register Table */}
        <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col">
          <h3 className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-3 flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5" /> Crime Hotspot Register
          </h3>
          <div className="flex-1 overflow-y-auto max-h-[280px] scrollbar-thin scrollbar-thumb-slate-700">
            <table className="w-full text-[11px]">
              <thead className="sticky top-0 bg-slate-900/90">
                <tr className="text-slate-500 uppercase text-[9px] font-bold">
                  <th className="text-left pb-2 pr-3">FIR / Station</th>
                  <th className="text-left pb-2 pr-3">Crime Type</th>
                  <th className="text-left pb-2 pr-3">District</th>
                  <th className="text-center pb-2 pr-2">Severity</th>
                  <th className="text-right pb-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {filteredData.slice(0, 30).map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/40 transition group">
                    <td className="py-1.5 pr-3">
                      <div className="font-mono text-[10px] text-slate-300 font-bold">{item.crimeNo || item.caseNo}</div>
                      <div className="text-slate-500 text-[9px] truncate max-w-[120px]">{item.station}</div>
                    </td>
                    <td className="py-1.5 pr-3 text-slate-300 truncate max-w-[110px]">{item.crimeType}</td>
                    <td className="py-1.5 pr-3 text-slate-400 text-[10px]">{item.district}</td>
                    <td className="py-1.5 text-center pr-2">
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${
                        item.severity === "heinous"
                          ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }`}>
                        {item.severity === "heinous" ? "HEINOUS" : "STD"}
                      </span>
                    </td>
                    <td className="py-1.5 text-right">
                      <button
                        onClick={() => {
                          setSelectedHotspot({
                            station: item.station,
                            district: item.district,
                            lat: item.lat,
                            lng: item.lng,
                            cases: [item],
                          });
                        }}
                        className="text-[10px] text-amber-400 hover:text-amber-300 underline font-semibold"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Monthly Crime Incidents Chart ─────────────────────────────────── */}
      <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4">
        <h3 className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-2 flex items-center gap-2">
          <TrendingUp className="w-3.5 h-3.5" /> Crime Incidents by Month
        </h3>
        <p className="text-[11px] text-slate-500 mb-3">Monthly FIR registration count across filtered records · Sourced from CaseMaster.csv</p>
        {monthlyData.length > 0 ? (
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={{ stroke: '#334155' }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: '#020617', border: '1px solid #334155', borderRadius: 8, fontSize: 11 }}
                  labelStyle={{ color: '#f59e0b', fontWeight: 700 }}
                  itemStyle={{ color: '#94a3b8' }}
                />
                <Legend wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
                <Bar dataKey="count" name="FIR Cases" radius={[4, 4, 0, 0]}>
                  {monthlyData.map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill={entry.count >= 6 ? "#dc2626" : entry.count >= 4 ? "#f59e0b" : "#34d399"}
                      fillOpacity={0.85}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-xs text-slate-500 text-center py-8">No data for current filters</div>
        )}
      </div>

      {/* ── Cross Module Navigation ────────────────────────────────────────── */}
      <div className="bg-slate-900/60 border border-slate-800/80 p-3 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
          <span className="text-slate-400 font-medium">Heatmap derived from {filteredData.length} geocoded FIR records — click nodes for cross-module analysis</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { onNavigate("network"); logAuditEvent("Cross Link", "Heatmap → Network Map"); }}
            className="py-1.5 px-3 bg-blue-600/10 border border-blue-500/20 hover:bg-blue-600/20 text-blue-400 rounded-lg font-bold transition flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5" /> Network Map
          </button>
          <button
            onClick={() => { onNavigate("forecasting"); logAuditEvent("Cross Link", "Heatmap → Forecasting"); }}
            className="py-1.5 px-3 bg-amber-600/10 border border-amber-500/20 hover:bg-amber-600/20 text-amber-400 rounded-lg font-bold transition flex items-center gap-1.5"
          >
            <AlertTriangle className="w-3.5 h-3.5" /> Early Warnings
          </button>
        </div>
      </div>

      {/* ── Aggregated Hotspot Intelligence Modal ──────────────────────────── */}
      {selectedHotspot && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-2xl p-6 shadow-2xl overflow-y-auto max-h-[90vh] space-y-4 animate-in fade-in zoom-in duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-100">
                    {selectedHotspot.station || selectedHotspot.district} Hotspot Intelligence
                  </h3>
                  <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>{selectedHotspot.district} District</span>
                    <span>•</span>
                    <span className="font-mono text-slate-500">
                      ({selectedHotspot.lat?.toFixed(4)}, {selectedHotspot.lng?.toFixed(4)})
                    </span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedHotspot(null)}
                className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Aggregated KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="text-[10px] uppercase text-slate-500 font-bold">Total FIR Cases</div>
                <div className="text-xl font-bold text-slate-100 mt-1">{selectedHotspot.cases.length}</div>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="text-[10px] uppercase text-slate-500 font-bold">Heinous Crimes</div>
                <div className="text-xl font-bold text-rose-400 mt-1">
                  {selectedHotspot.cases.filter((c: any) => c.severity === "heinous").length}
                </div>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="text-[10px] uppercase text-slate-500 font-bold">Fraud Proceeds</div>
                <div className="text-xl font-bold text-amber-400 mt-1">
                  ₹{selectedHotspot.cases.reduce((sum: number, c: any) => sum + (c.amount || 0), 0).toLocaleString()}
                </div>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="text-[10px] uppercase text-slate-500 font-bold">Arrests Made</div>
                <div className="text-xl font-bold text-violet-400 mt-1">
                  {selectedHotspot.cases.filter((c: any) => c.layer === "arrest").length}
                </div>
              </div>
            </div>

            {/* Aggregated FIR Cases List */}
            <div>
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileText className="w-4 h-4" /> Registered FIR Records in this Hotspot Cluster
              </h4>
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                {selectedHotspot.cases.map((c: any, idx: number) => (
                  <div key={idx} className="bg-slate-950 border border-slate-800/80 p-3 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-amber-400 font-bold">FIR #{c.crimeNo || c.caseNo}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        c.severity === "heinous"
                          ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                          : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }`}>
                        {c.severity === "heinous" ? "HEINOUS" : "STANDARD"}
                      </span>
                    </div>
                    <div className="text-xs text-slate-200 font-semibold">
                      {c.crimeType} {c.crimeHead ? `(${c.crimeHead})` : ""}
                    </div>
                    <div className="text-[11px] text-slate-400 bg-slate-900/80 p-2 rounded-lg border border-slate-800/50 italic">
                      "{c.facts || "Standard police record entry."}"
                    </div>
                    <div className="text-[10px] text-slate-500 flex items-center justify-between pt-1">
                      <span>Station: {c.station}</span>
                      <span>Date: {c.date?.substring(0, 10)}</span>
                      <span>Status: {c.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Action Buttons */}
            <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-3">
              <button
                onClick={() => {
                  setSelectedDistrict(selectedHotspot.district);
                  setSelectedHotspot(null);
                  logAuditEvent("Filter Hotspot", `Filtered view to ${selectedHotspot.district}`);
                }}
                className="px-4 py-2 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-400 text-xs font-bold rounded-xl transition"
              >
                Filter Page to {selectedHotspot.district}
              </button>
              <button
                onClick={() => setSelectedHotspot(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ── Sub-component: District Density Bar Chart ──────────────────────────────
function DistrictDensityChart({
  data, getHeatColor, onSelectDistrict
}: {
  data: any[];
  getHeatColor: (n: number) => string;
  onSelectDistrict: (d: string) => void;
}) {
  const districtCounts = useMemo(() => {
    const map: Record<string, { total: number; heinous: number; arrests: number }> = {};
    data.forEach(item => {
      const d = item.district || "Unknown";
      if (!map[d]) map[d] = { total: 0, heinous: 0, arrests: 0 };
      map[d].total++;
      if (item.severity === "heinous") map[d].heinous++;
      if (item.layer === "arrest") map[d].arrests++;
    });
    return Object.entries(map)
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.total - a.total);
  }, [data]);

  if (!districtCounts.length) {
    return <div className="text-xs text-slate-500 text-center py-8">No data for current filters</div>;
  }

  const max = districtCounts[0].total;

  return (
    <div className="space-y-2 flex-1 overflow-y-auto max-h-[360px] scrollbar-thin scrollbar-thumb-slate-700 pr-1">
      {districtCounts.map(({ name, total, heinous, arrests }) => {
        const pct = (total / max) * 100;
        const color = getHeatColor(pct);
        return (
          <div
            key={name}
            onClick={() => onSelectDistrict(name)}
            className="p-2 bg-slate-900/50 hover:bg-slate-900 border border-slate-800/80 hover:border-amber-500/30 rounded-xl transition cursor-pointer group"
          >
            <div className="flex items-center justify-between text-[10px] mb-1">
              <span className="text-slate-200 font-bold group-hover:text-amber-400 transition">{name}</span>
              <div className="flex items-center gap-2">
                {heinous > 0 && <span className="text-rose-400 font-bold">{heinous} heinous</span>}
                {arrests > 0 && <span className="text-violet-400 font-bold">{arrests} arrests</span>}
                <span className="text-slate-400 font-mono font-bold">{total} cases</span>
              </div>
            </div>
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800/60">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.max(8, pct)}%`, backgroundColor: color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
