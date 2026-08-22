/**
 * CrimeTrends.tsx — Improved Crime Trends tab
 * Uses real CSV-backed data via /api/analytics/trends-detailed
 * Features: filters by district/category/time, larger charts, trend insights,
 *           data summary showing actual records analyzed.
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  TrendingUp,
  MapPin,
  Filter,
  RefreshCw,
  AlertTriangle,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// ── Types ───────────────────────────────────────────────────────────────────

interface MonthPoint {
  month: string;
  monthKey: string;
  total: number;
  Heinous: number;
  NonHeinous: number;
}

interface CategoryPoint {
  name: string;
  fullName: string;
  category: string;
  value: number;
}

interface DistrictRow {
  districtId: number;
  name: string;
  risk: number;
  activeTrend: string;
  totalCases: number;
  heinousCases: number;
}

interface TrendInsight {
  label: string;
  value: string;
  direction: "up" | "down" | "neutral";
}

interface TrendsResponse {
  crimeByMonth: MonthPoint[];
  crimeByType: CategoryPoint[];
  districts: DistrictRow[];
  filters: {
    availableDistricts: { id: number; name: string }[];
    availableCategories: { id: number; name: string }[];
    availableMonths: { key: string; label: string }[];
  };
  summary: {
    totalRecordsAnalyzed: number;
    filteredRecords: number;
    dateRange: string;
    appliedFilters: string[];
  };
  insights: TrendInsight[];
}

interface Props {
  onNavigate: (tab: string) => void;
  logAuditEvent: (actionType: string, details: string) => void;
  legacyTrendData?: any;
}

// ── Constants ────────────────────────────────────────────────────────────────
const HEINOUS_COLOR = "#f43f5e";
const NON_HEINOUS_COLOR = "#f59e0b";

// Bar colours by index — cycles through a KSP-appropriate palette
const BAR_COLORS = [
  "#10b981", "#3b82f6", "#f59e0b", "#8b5cf6",
  "#ef4444", "#06b6d4", "#ec4899", "#84cc16",
  "#f97316", "#6366f1",
];

// ── Custom Tooltip: Area chart ───────────────────────────────────────────────
function MonthlyTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s: number, p: any) => s + (p.value ?? 0), 0);
  return (
    <div style={{
      background: "#0f172a",
      border: "1px solid #334155",
      borderRadius: 8,
      padding: "10px 14px",
      fontSize: 12,
      color: "#f8fafc",
      minWidth: 190,
    }}>
      <div style={{ fontWeight: 700, marginBottom: 6, color: "#f59e0b" }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ display: "flex", justifyContent: "space-between", gap: 16, marginBottom: 3 }}>
          <span style={{ color: p.color }}>{p.name}</span>
          <span style={{ fontWeight: 700, color: "#e2e8f0" }}>{p.value}</span>
        </div>
      ))}
      <div style={{ borderTop: "1px solid #334155", marginTop: 6, paddingTop: 6, display: "flex", justifyContent: "space-between" }}>
        <span style={{ color: "#94a3b8" }}>Total</span>
        <span style={{ fontWeight: 700, color: "#fff" }}>{total}</span>
      </div>
    </div>
  );
}

// ── Custom Tooltip: Bar chart ────────────────────────────────────────────────
function CategoryTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div style={{
      background: "#0f172a",
      border: "1px solid #334155",
      borderRadius: 8,
      padding: "10px 14px",
      fontSize: 12,
      color: "#f8fafc",
      maxWidth: 260,
    }}>
      <div style={{ fontWeight: 700, marginBottom: 4, color: "#10b981" }}>
        {item?.payload?.fullName}
      </div>
      <div style={{ color: "#64748b", marginBottom: 6, fontSize: 11 }}>
        {item?.payload?.category}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
        <span style={{ color: "#94a3b8" }}>Cases registered</span>
        <span style={{ fontWeight: 700, color: "#e2e8f0" }}>{item?.value}</span>
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────
export default function CrimeTrends({ onNavigate, logAuditEvent }: Props) {
  const [data, setData] = useState<TrendsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dossierOpen, setDossierOpen] = useState(false);

  // Filters
  const [selectedDistrict, setSelectedDistrict] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("all");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedDistrict !== "all") params.set("districtId", selectedDistrict);
      if (selectedCategory !== "all") params.set("categoryId", selectedCategory);
      if (selectedMonth !== "all") params.set("monthKey", selectedMonth);

      const res = await fetch(`/api/analytics/trends-detailed?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
    } catch (err: any) {
      setError(err.message ?? "Failed to load trends");
    } finally {
      setLoading(false);
    }
  }, [selectedDistrict, selectedCategory, selectedMonth]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    logAuditEvent("View Tab", "Accessed Crime Trends analysis panel.");
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const resetFilters = () => {
    setSelectedDistrict("all");
    setSelectedCategory("all");
    setSelectedMonth("all");
  };

  const hasFilters = selectedDistrict !== "all" || selectedCategory !== "all" || selectedMonth !== "all";

  // Bar chart height — grows with number of categories so labels never overlap
  const barChartHeight = Math.max(300, (data?.crimeByType.length ?? 0) * 28 + 60);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-5 h-full overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800/60 pb-4 gap-2">
        <div>
          <h2 className="section-title">
            <TrendingUp className="w-5 h-5 text-amber-500" />
            Crime Trends
          </h2>
          <p className="section-subtitle mt-1">Monthly crime velocity, category distribution and district-level hotspot analysis</p>
        </div>
        <div className="flex items-center gap-2 text-micro text-slate-600 whitespace-nowrap">
          <span className="text-slate-700">Mission Control</span>
          <span className="text-slate-800">›</span>
          <span className="text-amber-500/70 font-semibold">Crime Trends</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 flex flex-wrap items-end gap-4">
        <div className="flex items-center gap-2 text-amber-500 shrink-0">
          <Filter className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider">Filters</span>
        </div>

        <div className="flex flex-col gap-1 min-w-[160px]">
          <label className="text-micro text-slate-500 font-semibold uppercase tracking-wider">District</label>
          <select
            value={selectedDistrict}
            onChange={e => setSelectedDistrict(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-amber-500/50 cursor-pointer"
          >
            <option value="all">All Districts</option>
            {data?.filters.availableDistricts.map(d => (
              <option key={d.id} value={String(d.id)}>{d.name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1 min-w-[200px]">
          <label className="text-micro text-slate-500 font-semibold uppercase tracking-wider">Crime Category</label>
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-amber-500/50 cursor-pointer"
          >
            <option value="all">All Categories</option>
            {data?.filters.availableCategories.map(c => (
              <option key={c.id} value={String(c.id)}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1 min-w-[150px]">
          <label className="text-micro text-slate-500 font-semibold uppercase tracking-wider">Time Period</label>
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-amber-500/50 cursor-pointer"
          >
            <option value="all">All Months</option>
            {data?.filters.availableMonths.map(m => (
              <option key={m.key} value={m.key}>{m.label}</option>
            ))}
          </select>
        </div>

        {hasFilters && (
          <button
            onClick={resetFilters}
            className="text-xs text-slate-400 hover:text-slate-200 border border-slate-700 hover:border-slate-500 rounded-lg px-3 py-1.5 flex items-center gap-1.5 transition self-end"
          >
            <RefreshCw className="w-3 h-3" /> Reset
          </button>
        )}
      </div>

      {/* Data Summary */}
      {data && (
        <div className="bg-slate-950/50 border border-slate-800/60 rounded-xl px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Records</span>
            <span className="text-sm font-bold text-amber-400">{data.summary.filteredRecords}</span>
            <span className="text-xs text-slate-600">of {data.summary.totalRecordsAnalyzed} total</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Date Range</span>
            <span className="text-xs font-semibold text-slate-300">{data.summary.dateRange}</span>
          </div>
          {data.summary.appliedFilters.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Active Filters</span>
              {data.summary.appliedFilters.map((f, i) => (
                <span key={i} className="text-micro bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-semibold">{f}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Loading / Error */}
      {loading && (
        <div className="flex items-center justify-center py-16 text-slate-400 text-sm gap-3">
          <RefreshCw className="w-4 h-4 animate-spin" />
          Loading trends from CSV data…
        </div>
      )}
      {error && (
        <div className="flex items-center gap-3 bg-rose-950/30 border border-rose-800/40 rounded-xl p-4 text-rose-400 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          Failed to load trend data: {error}
        </div>
      )}

      {/* ── Main Charts ── */}
      {data && !loading && (
        <>
          {/* Chart 1: Crime Incidents by Month */}
          <div className="bg-slate-950/60 border border-slate-800/80 p-5 rounded-xl flex flex-col gap-3">
            {/* Chart header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-3">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-amber-500">
                  Crime Incidents by Month
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Monthly registered FIR count — split by gravity of offence
                </p>
              </div>
              <div className="flex items-center gap-5 text-xs shrink-0">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-8 h-2 rounded-sm" style={{ background: HEINOUS_COLOR, opacity: 0.85 }} />
                  <span className="text-slate-300 font-medium">Heinous</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-8 h-2 rounded-sm" style={{ background: NON_HEINOUS_COLOR, opacity: 0.85 }} />
                  <span className="text-slate-300 font-medium">Non-Heinous</span>
                </span>
              </div>
            </div>

            {data.crimeByMonth.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-slate-500 text-sm">
                No data for selected filters
              </div>
            ) : (
              <div style={{ height: 320, width: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={data.crimeByMonth}
                    margin={{ top: 12, right: 24, left: 8, bottom: 8 }}
                  >
                    <defs>
                      <linearGradient id="gradHeinous" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={HEINOUS_COLOR} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={HEINOUS_COLOR} stopOpacity={0.03} />
                      </linearGradient>
                      <linearGradient id="gradNonHeinous" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={NON_HEINOUS_COLOR} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={NON_HEINOUS_COLOR} stopOpacity={0.03} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis
                      dataKey="month"
                      stroke="#334155"
                      tick={{ fill: "#94a3b8", fontSize: 13 }}
                      tickLine={false}
                      axisLine={{ stroke: "#334155" }}
                      padding={{ left: 10, right: 10 }}
                    />
                    <YAxis
                      stroke="#334155"
                      tick={{ fill: "#94a3b8", fontSize: 13 }}
                      tickLine={false}
                      axisLine={false}
                      width={36}
                      allowDecimals={false}
                      label={{
                        value: "Cases",
                        angle: -90,
                        position: "insideLeft",
                        fill: "#64748b",
                        fontSize: 12,
                        dx: 4,
                      }}
                    />
                    <Tooltip content={<MonthlyTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="Heinous"
                      name="Heinous"
                      stroke={HEINOUS_COLOR}
                      strokeWidth={2.5}
                      fill="url(#gradHeinous)"
                      dot={{ fill: HEINOUS_COLOR, r: 4, strokeWidth: 0 }}
                      activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="NonHeinous"
                      name="Non-Heinous"
                      stroke={NON_HEINOUS_COLOR}
                      strokeWidth={2.5}
                      fill="url(#gradNonHeinous)"
                      dot={{ fill: NON_HEINOUS_COLOR, r: 4, strokeWidth: 0 }}
                      activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Chart 2: Crime Sub-Category Distribution (horizontal bar) */}
          <div className="bg-slate-950/60 border border-slate-800/80 p-5 rounded-xl flex flex-col gap-3">
            <div className="border-b border-slate-800/60 pb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-500">
                Crime Sub-Category Distribution
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Registered FIRs per IPC sub-head — sorted by count
              </p>
            </div>

            {data.crimeByType.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-slate-500 text-sm">
                No data for selected filters
              </div>
            ) : (
              <div style={{ height: barChartHeight, width: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={data.crimeByType}
                    margin={{ top: 8, right: 48, left: 8, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                    <XAxis
                      type="number"
                      stroke="#334155"
                      tick={{ fill: "#94a3b8", fontSize: 12 }}
                      tickLine={false}
                      axisLine={{ stroke: "#334155" }}
                      allowDecimals={false}
                      label={{
                        value: "Cases",
                        position: "insideBottom",
                        offset: -4,
                        fill: "#64748b",
                        fontSize: 12,
                      }}
                    />
                    <YAxis
                      type="category"
                      dataKey="fullName"
                      stroke="#334155"
                      tick={{ fill: "#cbd5e1", fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      width={200}
                    />
                    <Tooltip content={<CategoryTooltip />} />
                    <Bar dataKey="value" name="Cases" radius={[0, 4, 4, 0]} maxBarSize={22}>
                      {data.crimeByType.map((_, idx) => (
                        <Cell
                          key={idx}
                          fill={BAR_COLORS[idx % BAR_COLORS.length]}
                          fillOpacity={0.85}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Trend Insights */}
          {data.insights.length > 0 && (
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-500 mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Trend Insights
                <span className="text-micro text-slate-600 font-normal lowercase tracking-normal ml-1">
                  — derived from CSV data only
                </span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {data.insights.map((ins, idx) => {
                  const Icon = ins.direction === "up" ? TrendingUp : ins.direction === "down" ? TrendingDown : Minus;
                  const iconColor = ins.direction === "up" ? "text-rose-400" : ins.direction === "down" ? "text-emerald-400" : "text-slate-400";
                  const borderColor = ins.direction === "up" ? "border-rose-800/40" : ins.direction === "down" ? "border-emerald-800/40" : "border-slate-800/60";
                  return (
                    <div key={idx} className={`bg-slate-900/60 border ${borderColor} rounded-lg p-3.5 flex items-start gap-3`}>
                      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${iconColor}`} />
                      <div className="min-w-0">
                        <div className="text-micro text-slate-500 font-semibold uppercase tracking-wider mb-1">{ins.label}</div>
                        <div className="text-xs text-slate-200 leading-relaxed">{ins.value}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active District Grid — collapsible to keep focus on charts */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl overflow-hidden">
            <button
              onClick={() => setDossierOpen(v => !v)}
              className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-slate-900/40 transition"
            >
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-500" />
                <span className="text-sm font-bold uppercase tracking-wider text-amber-500">
                  Active District Grid
                </span>
                {data.districts.length > 0 && (
                  <span className="text-micro bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                    {data.districts.filter(d => d.totalCases > 0).length} districts
                  </span>
                )}
              </div>
              {dossierOpen
                ? <ChevronUp className="w-4 h-4 text-slate-500" />
                : <ChevronDown className="w-4 h-4 text-slate-500" />}
            </button>

            {dossierOpen && (
              <div className="px-5 pb-5 pt-1">
                {data.districts.filter(d => d.totalCases > 0).length === 0 ? (
                  <p className="text-slate-500 text-sm py-4 text-center">No district data for selected filters</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {data.districts.filter(d => d.totalCases > 0).map((d, idx) => {
                      const scoreColor = d.risk > 80 ? "text-rose-400" : d.risk > 60 ? "text-amber-400" : "text-emerald-400";
                      const trendIcon = d.activeTrend === "UPWARD" ? "↑" : d.activeTrend === "DOWNWARD" ? "↓" : "→";
                      const trendColor = d.activeTrend === "UPWARD" ? "text-rose-400" : d.activeTrend === "DOWNWARD" ? "text-emerald-400" : "text-slate-400";
                      return (
                        <div
                          key={idx}
                          className="bg-slate-900 border border-slate-800/60 p-3 rounded-lg flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-200 leading-tight">{d.name}</div>
                              <div className="text-micro text-slate-500">{d.totalCases} case{d.totalCases !== 1 ? "s" : ""} · {d.heinousCases} heinous</div>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className={`text-micro font-bold ${scoreColor}`}>Risk {d.risk}%</div>
                            <div className={`text-micro font-bold ${trendColor}`}>{trendIcon} {d.activeTrend}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Cross-module actions */}
                <div className="flex gap-2 mt-4 pt-4 border-t border-slate-800/50">
                  <button
                    type="button"
                    onClick={() => { onNavigate("sociological"); logAuditEvent("Cross Link", "Transitioned to Sociological Insights from Crime Trends."); }}
                    className="cross-action-btn flex-1"
                  >
                    <span>Compare Socio-drivers</span>
                    <span>→</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { onNavigate("forecasting"); logAuditEvent("Cross Link", "Transitioned to Forecasting from Crime Trends."); }}
                    className="cross-action-btn flex-1"
                  >
                    <span>Review Dispatch Beats</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </>
      )}
    </div>
  );
}
