import React, { useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { motion } from "motion/react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ScatterChart, Scatter,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  Cell
} from "recharts";
import {
  Activity, TrendingUp, Sparkles, AlertTriangle, CheckCircle,
  ArrowRight, BookOpen, Target, Lightbulb, Shield, LineChart,
  ChevronDown, ChevronUp, Users
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface SocioRow {
  districtName: string;
  urbanization: number;
  migration: number;
  stress: number;
  education: number;
  density: number;
  propertyCrimes: number;
  bodyCrimes: number;
  cyberCrimes: number;
  drugCrimes: number;
  womenCrimes: number;
  totalCrimes: number;
}

interface Props {
  socioData: SocioRow[];
  onNavigate: (tab: string) => void;
  setChatInput: (v: string) => void;
  logAuditEvent: (action: string, detail: string) => void;
}

// ─── Palette ──────────────────────────────────────────────────────────────────
const DISTRICT_COLORS: Record<string, string> = {
  "Bengaluru City":               "#38bdf8",
  "Mysuru":                       "#34d399",
  "Mangaluru (Dakshina Kannada)": "#fbbf24",
  "Hubballi-Dharwad":             "#a78bfa",
  "Belagavi":                     "#f472b6",
  "Kalaburagi":                   "#f87171",
};

const DISTRICT_KEYS = [
  "Bengaluru City",
  "Mysuru",
  "Mangaluru (Dakshina Kannada)",
  "Hubballi-Dharwad",
  "Belagavi",
  "Kalaburagi",
];

// ─── AI Insight Card ──────────────────────────────────────────────────────────
interface InsightProps {
  keyFinding: string;       // Always visible one-liner
  observation: string;
  whyMatters: string;
  action: string;
  accentClass?: string;
}

function AIInsightCard({
  keyFinding,
  observation,
  whyMatters,
  action,
  accentClass = "border-sky-500/25",
}: InsightProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`mt-4 rounded-xl border ${accentClass} bg-slate-950/70 border-l-4 shadow-lg`}>
      {/* Always-visible summary row */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-start justify-between px-4 py-3 text-left group gap-3"
        aria-expanded={open}
      >
        <div className="flex items-start gap-2 min-w-0">
          <Sparkles className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <span className="text-xs font-bold text-sky-300 uppercase tracking-wider block mb-0.5">
              AI Sociological Analysis
            </span>
            <span className="text-xs text-slate-300 leading-relaxed line-clamp-2">
              {keyFinding}
            </span>
          </div>
        </div>
        <span className="text-slate-500 shrink-0 mt-0.5 group-hover:text-slate-300 transition">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>

      {/* Expanded detail */}
      {open && (
        <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-800/60 pt-3">
          <div className="space-y-1">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Key Observation</div>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">{observation}</p>
          </div>
          <div className="space-y-1">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Why It Matters</div>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">{whyMatters}</p>
          </div>
          <div className="space-y-1">
            <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">Suggested Action</div>
            <p className="text-xs sm:text-sm text-amber-200/90 leading-relaxed font-medium">{action}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Custom Tooltip Box ────────────────────────────────────────────────────────
const TooltipBox = ({ children }: { children: React.ReactNode }) => (
  <div style={{
    background: "rgba(2, 6, 23, 0.98)",
    border: "1px solid rgba(51, 65, 85, 0.9)",
    borderRadius: 10,
    padding: "12px 16px",
    fontSize: 13,
    lineHeight: 1.6,
    minWidth: 210,
    boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
  }}>
    {children}
  </div>
);

// ─── Statewide KPI Summary Header Bar ──────────────────────────────────────────
function StatewideKpiBar({ data }: { data: SocioRow[] }) {
  if (!data.length) return null;

  const avgUrban   = (data.reduce((s, d) => s + d.urbanization, 0) / data.length).toFixed(1);
  const avgStress  = (data.reduce((s, d) => s + d.stress,       0) / data.length).toFixed(1);
  const avgEdu     = (data.reduce((s, d) => s + d.education,    0) / data.length).toFixed(1);
  const totalCrimes  = data.reduce((s, d) => s + d.totalCrimes,  0);
  const totalWomen   = data.reduce((s, d) => s + d.womenCrimes,  0);

  const kpis = [
    {
      label: "Avg Urbanization",
      value: `${avgUrban}%`,
      subText: "Bengaluru highest at 92%",
      icon: <Activity className="w-5 h-5 text-sky-400" />,
      color: "border-sky-500/30 bg-sky-500/5",
      valueClass: "text-sky-300",
    },
    {
      label: "Avg Economic Stress",
      value: `${avgStress}%`,
      subText: "Kalaburagi highest at 68%",
      icon: <AlertTriangle className="w-5 h-5 text-rose-400" />,
      color: "border-rose-500/30 bg-rose-500/5",
      valueClass: "text-rose-300",
    },
    {
      label: "Avg Education Index",
      value: `${avgEdu}%`,
      subText: "Mangaluru leads at 91%",
      icon: <CheckCircle className="w-5 h-5 text-emerald-400" />,
      color: "border-emerald-500/30 bg-emerald-500/5",
      valueClass: "text-emerald-300",
    },
    {
      label: "Total Registered FIRs",
      value: `${totalCrimes}`,
      subText: "Across 6 Karnataka districts",
      icon: <Shield className="w-5 h-5 text-amber-400" />,
      color: "border-amber-500/30 bg-amber-500/5",
      valueClass: "text-amber-300",
    },
    {
      label: "Women / Domestic Cases",
      value: `${totalWomen}`,
      subText: "Across all monitored districts",
      icon: <Users className="w-5 h-5 text-pink-400" />,
      color: "border-pink-500/30 bg-pink-500/5",
      valueClass: "text-pink-300",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {kpis.map((kpi, i) => (
        <div key={i} className={`rounded-xl border p-4 space-y-1.5 ${kpi.color}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-bold text-slate-400 leading-tight">{kpi.label}</span>
            <div className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-800 shrink-0">{kpi.icon}</div>
          </div>
          <div className={`text-2xl font-extrabold tabular-nums tracking-tight ${kpi.valueClass}`}>{kpi.value}</div>
          <p className="text-xs text-slate-500">{kpi.subText}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Chart 1: Socio-Economic Risk Indices (Main Chart — full width) ────────────
function SocioRiskChart({ data }: { data: SocioRow[] }) {
  const [selectedDistrict, setSelectedDistrict] = useState<SocioRow | null>(null);

  const chartData = data.map((d) => ({
    name: d.districtName.split(" ")[0],
    fullName: d.districtName,
    "Urbanization %":    d.urbanization,
    "Economic Stress %": d.stress,
    "Migration Rate %":  d.migration,
    "Education Index %": d.education,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const row = data.find((d) => d.districtName.startsWith(label));
    return (
      <TooltipBox>
        <p style={{ color: "#f8fafc", fontWeight: 700, marginBottom: 8, fontSize: 14 }}>
          {row?.districtName ?? label}
        </p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color, marginBottom: 3, fontSize: 12.5 }}>
            {p.name}: <span style={{ color: "#f8fafc", fontWeight: 700 }}>{p.value}%</span>
          </p>
        ))}
        {row && (
          <p style={{ color: "#94a3b8", marginTop: 8, borderTop: "1px solid #1e293b", paddingTop: 6, fontSize: 12 }}>
            Pop. Density: <strong style={{ color: "#e2e8f0" }}>{row.density.toLocaleString()} /km²</strong>
            <span style={{ color: "#64748b", marginLeft: 8 }}>· Click bar to pin details</span>
          </p>
        )}
      </TooltipBox>
    );
  };

  const handleBarClick = (barData: any) => {
    if (!barData?.activePayload?.length) return;
    const fullName = barData.activePayload[0]?.payload?.fullName;
    const row = data.find((d) => d.districtName === fullName);
    setSelectedDistrict(row ?? null);
  };

  return (
    <div className="bg-slate-950/80 border border-slate-800 p-6 rounded-2xl space-y-5 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <div className="w-9 h-9 rounded-lg bg-sky-500/15 border border-sky-500/25 flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5 text-sky-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-100">Socio-Economic Risk Indices by District</h3>
          </div>
          <p className="text-sm text-slate-400 ml-12">
            Urbanization, economic stress, migration and education compared across 6 Karnataka districts.
            Hover bars for values · Click any group to pin district detail below.
          </p>
        </div>
        {selectedDistrict && (
          <button
            onClick={() => setSelectedDistrict(null)}
            className="text-xs text-slate-500 hover:text-slate-300 border border-slate-700 rounded-lg px-3 py-1.5 shrink-0 transition"
          >
            Clear selection ×
          </button>
        )}
      </div>

      {/* Chart Canvas */}
      <div className="h-[500px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 20, bottom: 50, left: 20 }}
            barCategoryGap="22%"
            barGap={3}
            onClick={handleBarClick}
            style={{ cursor: "pointer" }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="#475569"
              tick={{ fill: "#cbd5e1", fontSize: 13, fontWeight: 700 }}
              tickLine={false}
              axisLine={{ stroke: "#334155" }}
              label={{
                value: "Karnataka Districts",
                position: "insideBottom",
                offset: -28,
                style: { fill: "#94a3b8", fontSize: 12, fontWeight: 600 },
              }}
            />
            <YAxis
              stroke="#475569"
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}%`}
              domain={[0, 100]}
              width={48}
              label={{
                value: "Index (%)",
                angle: -90,
                position: "insideLeft",
                offset: 14,
                style: { fill: "#94a3b8", fontSize: 12, fontWeight: 600 },
              }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(51,65,85,0.15)" }} />
            <Legend
              wrapperStyle={{ fontSize: 13, paddingTop: 16 }}
              iconType="square"
              iconSize={13}
              formatter={(v) => <span style={{ color: "#cbd5e1", fontWeight: 600 }}>{v}</span>}
            />
            <Bar dataKey="Urbanization %"    fill="#38bdf8" radius={[4,4,0,0]} maxBarSize={28} />
            <Bar dataKey="Economic Stress %" fill="#f87171" radius={[4,4,0,0]} maxBarSize={28} />
            <Bar dataKey="Migration Rate %"  fill="#c084fc" radius={[4,4,0,0]} maxBarSize={28} />
            <Bar dataKey="Education Index %" fill="#34d399" radius={[4,4,0,0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pinned District Detail Panel */}
      {selectedDistrict && (
        <div
          className="rounded-xl border border-sky-500/30 bg-slate-900/80 p-4"
          style={{ borderLeftColor: DISTRICT_COLORS[selectedDistrict.districtName] ?? "#38bdf8", borderLeftWidth: 4 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ background: DISTRICT_COLORS[selectedDistrict.districtName] ?? "#38bdf8" }}
            />
            <span className="font-bold text-slate-100 text-sm">{selectedDistrict.districtName} — Full Profile</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
            {[
              { label: "Urbanization",   value: `${selectedDistrict.urbanization}%`,                 color: "#38bdf8" },
              { label: "Econ. Stress",   value: `${selectedDistrict.stress}%`,                       color: "#f87171" },
              { label: "Migration Rate", value: `${selectedDistrict.migration}%`,                    color: "#c084fc" },
              { label: "Education",      value: `${selectedDistrict.education}%`,                    color: "#34d399" },
              { label: "Pop. Density",   value: `${selectedDistrict.density.toLocaleString()}/km²`,  color: "#94a3b8" },
              { label: "Total FIRs",     value: `${selectedDistrict.totalCrimes}`,                   color: "#fbbf24" },
              { label: "Property",       value: `${selectedDistrict.propertyCrimes}`,                color: "#f59e0b" },
              { label: "Violent",        value: `${selectedDistrict.bodyCrimes}`,                    color: "#ef4444" },
              { label: "Cyber",          value: `${selectedDistrict.cyberCrimes}`,                   color: "#a78bfa" },
              { label: "Narcotics",      value: `${selectedDistrict.drugCrimes}`,                    color: "#34d399" },
              { label: "Women / Domestic", value: `${selectedDistrict.womenCrimes}`,                 color: "#f472b6" },
            ].map((item) => (
              <div key={item.label} className="bg-slate-950/60 rounded-lg p-2.5 text-center border border-slate-800">
                <div className="font-extrabold text-sm" style={{ color: item.color }}>{item.value}</div>
                <div className="text-slate-500 mt-0.5 text-xs">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <AIInsightCard
        accentClass="border-sky-500/20"
        keyFinding="Bengaluru leads on urbanization (92%) while Kalaburagi has the highest economic stress (68%) — opposite poles of Karnataka's socio-economic spectrum."
        observation="Bengaluru City dominates on urbanization (92%) while Kalaburagi leads on economic stress (68%). These represent opposite ends of Karnataka's socio-economic range across the 6 monitored districts."
        whyMatters="High economic stress is associated with increased crime motivation. Kalaburagi's combination of 68% stress and 65% education index — the lowest in the dataset — is consistent with conditions described in strain theory, where limited access to legitimate opportunity coincides with elevated rates of violent crime."
        action="Prioritise community policing and economic intervention programs in Kalaburagi and Belagavi. Deploy cyber-awareness campaigns in Bengaluru where urbanization-driven fraud vectors are most prevalent."
      />
    </div>
  );
}

// ─── Chart 2: Crime Type Distribution by District ────────────────────────────
function CrimeDistributionChart({ data }: { data: SocioRow[] }) {
  const chartData = data.map((d) => ({
    name: d.districtName.split(" ")[0],
    fullName: d.districtName,
    "Property / Theft":   d.propertyCrimes,
    "Violent / Assault":  d.bodyCrimes,
    "Cyber Fraud":        d.cyberCrimes,
    "Narcotics":          d.drugCrimes,
    "Women / Domestic":   d.womenCrimes,
    total:                d.totalCrimes,
  }));

  const totProp  = data.reduce((s, d) => s + d.propertyCrimes, 0);
  const totViol  = data.reduce((s, d) => s + d.bodyCrimes,     0);
  const totCyber = data.reduce((s, d) => s + d.cyberCrimes,    0);
  const totDrug  = data.reduce((s, d) => s + d.drugCrimes,     0);
  const totWomen = data.reduce((s, d) => s + d.womenCrimes,    0);
  const totAll   = data.reduce((s, d) => s + d.totalCrimes,    0);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const row = data.find((d) => d.districtName.startsWith(label));
    const total = row?.totalCrimes ?? 0;
    return (
      <TooltipBox>
        <p style={{ color: "#f8fafc", fontWeight: 700, marginBottom: 8, fontSize: 14 }}>{row?.districtName ?? label}</p>
        {payload.map((p: any) => p.value > 0 && (
          <p key={p.name} style={{ color: p.fill, marginBottom: 3, fontSize: 12.5 }}>
            {p.name}: <span style={{ color: "#f8fafc", fontWeight: 700 }}>{p.value}</span>
            {total > 0 && (
              <span style={{ color: "#94a3b8", fontSize: 11 }}> ({Math.round((p.value / total) * 100)}%)</span>
            )}
          </p>
        ))}
        <p style={{ color: "#94a3b8", borderTop: "1px solid #1e293b", paddingTop: 6, marginTop: 6, fontSize: 12.5 }}>
          Total FIRs: <span style={{ color: "#fbbf24", fontWeight: 800 }}>{total}</span>
        </p>
      </TooltipBox>
    );
  };

  return (
    <div className="bg-slate-950/80 border border-slate-800 p-6 rounded-2xl space-y-5 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <div className="w-9 h-9 rounded-lg bg-rose-500/15 border border-rose-500/25 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 text-rose-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-100">Crime Type Distribution by District</h3>
          </div>
          <p className="text-sm text-slate-400 ml-12">
            Stacked breakdown of registered IPC crime categories across 6 districts. Hover for per-district counts.
          </p>
        </div>
      </div>

      {/* Category summary pills */}
      <div className="flex flex-wrap gap-2 text-xs font-semibold">
        <span className="px-3 py-1.5 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300">
          Property: {totProp} ({totAll ? ((totProp / totAll) * 100).toFixed(0) : 0}%)
        </span>
        <span className="px-3 py-1.5 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-300">
          Violent: {totViol} ({totAll ? ((totViol / totAll) * 100).toFixed(0) : 0}%)
        </span>
        <span className="px-3 py-1.5 rounded-md bg-purple-500/10 border border-purple-500/30 text-purple-300">
          Cyber: {totCyber} ({totAll ? ((totCyber / totAll) * 100).toFixed(0) : 0}%)
        </span>
        <span className="px-3 py-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
          Narcotics: {totDrug} ({totAll ? ((totDrug / totAll) * 100).toFixed(0) : 0}%)
        </span>
        <span className="px-3 py-1.5 rounded-md bg-pink-500/10 border border-pink-500/30 text-pink-300">
          Women/Domestic: {totWomen} ({totAll ? ((totWomen / totAll) * 100).toFixed(0) : 0}%)
        </span>
      </div>

      <div className="h-[460px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 20, bottom: 50, left: 20 }}
            barCategoryGap="30%"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="#475569"
              tick={{ fill: "#cbd5e1", fontSize: 13, fontWeight: 700 }}
              tickLine={false}
              axisLine={{ stroke: "#334155" }}
              label={{
                value: "Karnataka Districts",
                position: "insideBottom",
                offset: -28,
                style: { fill: "#94a3b8", fontSize: 12, fontWeight: 600 },
              }}
            />
            <YAxis
              stroke="#475569"
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              width={38}
              label={{
                value: "FIR Count",
                angle: -90,
                position: "insideLeft",
                offset: 14,
                style: { fill: "#94a3b8", fontSize: 12, fontWeight: 600 },
              }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(51,65,85,0.15)" }} />
            <Legend
              wrapperStyle={{ fontSize: 13, paddingTop: 16 }}
              iconType="square"
              iconSize={13}
              formatter={(v) => <span style={{ color: "#cbd5e1", fontWeight: 600 }}>{v}</span>}
            />
            <Bar dataKey="Property / Theft"  stackId="a" fill="#f59e0b" />
            <Bar dataKey="Violent / Assault" stackId="a" fill="#ef4444" />
            <Bar dataKey="Cyber Fraud"       stackId="a" fill="#c084fc" />
            <Bar dataKey="Narcotics"         stackId="a" fill="#34d399" />
            <Bar dataKey="Women / Domestic"  stackId="a" fill="#f472b6" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <AIInsightCard
        accentClass="border-rose-500/20"
        keyFinding="Property theft accounts for the largest crime share statewide; violent crime is concentrated in high-stress districts like Kalaburagi."
        observation="Property crimes are the dominant category across all districts. Violent crime is disproportionately associated with high-economic-stress districts such as Kalaburagi and Bengaluru City. Cyber fraud is largely limited to districts with established banking infrastructure."
        whyMatters="Crime category concentration maps to different intervention types. A uniform policing approach is inconsistent with this data — Bengaluru's pattern is consistent with opportunity-driven urban crime, while Kalaburagi's pattern is more consistent with stress-driven conflict."
        action="Allocate cyber-crime resources to Bengaluru and Mangaluru. Establish conflict-resolution outreach in Kalaburagi. Increase property-crime surveillance across Bengaluru and Hubballi corridors."
      />
    </div>
  );
}

// ─── Chart 3: Urbanization × Crime Scatter ──────────────────────────────────
function UrbanizationScatterChart({ data }: { data: SocioRow[] }) {
  const labelOffsets: Record<string, { dx: number; dy: number; textAnchor: "middle" | "start" | "end" }> = {
    "Bengaluru City":               { dx: 0,   dy: -26, textAnchor: "middle" },
    "Mysuru":                       { dx: 24,  dy: -4,  textAnchor: "start"  },
    "Mangaluru (Dakshina Kannada)": { dx: -24, dy: -4,  textAnchor: "end"    },
    "Hubballi-Dharwad":             { dx: 0,   dy: -26, textAnchor: "middle" },
    "Belagavi":                     { dx: 24,  dy: 16,  textAnchor: "start"  },
    "Kalaburagi":                   { dx: -24, dy: 16,  textAnchor: "end"    },
  };

  const chartData = data.map((d) => ({
    urbanization: d.urbanization,
    totalCrimes:  d.totalCrimes,
    stress:       d.stress,
    districtName: d.districtName,
    shortName:    d.districtName.split(" ")[0],
    color:        DISTRICT_COLORS[d.districtName] ?? "#64748b",
    offset:       labelOffsets[d.districtName] ?? { dx: 0, dy: -22, textAnchor: "middle" as const },
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    if (!d) return null;
    return (
      <TooltipBox>
        <p style={{ color: d.color, fontWeight: 700, marginBottom: 6, fontSize: 14 }}>{d.districtName}</p>
        <p style={{ color: "#94a3b8", fontSize: 12.5 }}>Urbanization: <span style={{ color: "#f8fafc", fontWeight: 700 }}>{d.urbanization}%</span></p>
        <p style={{ color: "#94a3b8", fontSize: 12.5 }}>Total FIRs: <span style={{ color: "#fbbf24", fontWeight: 700 }}>{d.totalCrimes}</span></p>
        <p style={{ color: "#94a3b8", fontSize: 12.5 }}>Economic Stress: <span style={{ color: "#f87171", fontWeight: 700 }}>{d.stress}%</span></p>
        <p style={{ color: "#64748b", fontSize: 11, marginTop: 6, borderTop: "1px solid #1e293b", paddingTop: 4 }}>
          Positive association observed (urbanization ↑, FIR count ↑)
        </p>
      </TooltipBox>
    );
  };

  return (
    <div className="bg-slate-950/80 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">Urbanization vs. Total FIR Cases</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Scatter plot — urbanization index vs. FIR count. Circle size ∝ case count. Hover for district values.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-lg shrink-0">
          {DISTRICT_KEYS.map((d) => (
            <span key={d} className="flex items-center gap-1.5 text-slate-300">
              <span style={{ background: DISTRICT_COLORS[d], width: 8, height: 8, borderRadius: "50%", display: "inline-block" }} />
              {d.split(" ")[0]}
            </span>
          ))}
        </div>
      </div>

      <div className="h-[380px] w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 25, right: 35, bottom: 45, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              type="number"
              dataKey="urbanization"
              name="Urbanization"
              domain={[25, 100]}
              stroke="#475569"
              tick={{ fill: "#cbd5e1", fontSize: 12, fontWeight: 600 }}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
              label={{ value: "Urbanization Index (%)", position: "insideBottom", offset: -28, fill: "#94a3b8", fontSize: 12, fontWeight: 600 }}
            />
            <YAxis
              type="number"
              dataKey="totalCrimes"
              name="Total Cases"
              domain={[0, 5]}
              allowDecimals={false}
              stroke="#475569"
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={32}
              label={{ value: "FIR Cases", angle: -90, position: "insideLeft", offset: 10, fill: "#94a3b8", fontSize: 12, fontWeight: 600 }}
            />
            <Tooltip content={<CustomTooltip />} cursor={false} />
            <Scatter
              name="Districts"
              data={chartData}
              shape={(props: any) => {
                const { cx, cy, payload } = props;
                const r = 14 + payload.totalCrimes * 7;
                const { dx, dy, textAnchor } = payload.offset;
                const labelW = payload.shortName.length * 8 + 16;
                const labelX = cx + dx - labelW * (textAnchor === "end" ? 1 : textAnchor === "middle" ? 0.5 : 0);
                return (
                  <g>
                    <circle cx={cx} cy={cy} r={r} fill={payload.color} fillOpacity={0.2} stroke={payload.color} strokeWidth={2.5} />
                    <circle cx={cx} cy={cy} r={5} fill={payload.color} />
                    <rect x={labelX} y={cy + dy - 12} width={labelW} height={18} rx={4} ry={4}
                      fill="#030712" stroke={payload.color} strokeWidth="1" />
                    <text x={cx + dx} y={cy + dy} textAnchor={textAnchor} fill="#f8fafc" fontSize="11.5" fontWeight="700">
                      {payload.shortName}
                    </text>
                  </g>
                );
              }}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <AIInsightCard
        accentClass="border-emerald-500/20"
        keyFinding="Higher urbanization is associated with more reported FIRs — but Kalaburagi's low count likely reflects under-reporting given its 68% economic stress."
        observation="There is a positive association between urbanization and FIR case count. Bengaluru (92% urban, most cases) sits at top-right; Kalaburagi (35% urban, fewest cases) sits at bottom-left — despite the highest economic stress in the dataset."
        whyMatters="Urban crime is more visible and more likely to be reported. Relying solely on FIR counts risks underestimating rural threat levels, particularly for domestic and violent crime in low-urbanization districts."
        action="Establish mobile reporting units and anonymous tip lines in Kalaburagi and Belagavi. Weight district-level risk assessments with socio-economic stress indices, not just FIR counts alone."
      />
    </div>
  );
}

// ─── Chart 4: Multi-Dimensional Risk Radar ────────────────────────────────────
function DistrictRadarChart({ data }: { data: SocioRow[] }) {
  const radarMetrics = [
    { key: "urbanization", label: "Urbanization"  },
    { key: "stress",       label: "Econ. Stress"  },
    { key: "migration",    label: "Migration"     },
    { key: "crimeLoad",    label: "Crime Load"    },
    { key: "eduInverse",   label: "Low Education" },
  ];

  const [selectedDistrict, setSelectedDistrict] = useState<string>(data[0]?.districtName ?? "");

  const enriched = data.map((d) => ({
    ...d,
    crimeLoad:  Math.round((d.totalCrimes / 4) * 100),
    eduInverse: 100 - d.education,
  }));

  const statewideAvg = {
    urbanization: Math.round(data.reduce((s, d) => s + d.urbanization, 0) / data.length),
    stress:       Math.round(data.reduce((s, d) => s + d.stress,       0) / data.length),
    migration:    Math.round(data.reduce((s, d) => s + d.migration,    0) / data.length),
    crimeLoad:    Math.round((data.reduce((s, d) => s + d.totalCrimes, 0) / (data.length * 4)) * 100),
    eduInverse:   Math.round(100 - data.reduce((s, d) => s + d.education, 0) / data.length),
  };

  const selected = enriched.find((d) => d.districtName === selectedDistrict);

  const radarChartData = selected
    ? radarMetrics.map((m) => ({
        metric:       m.label,
        districtValue: (selected as any)[m.key] as number,
        statewideAvg:  (statewideAvg as any)[m.key] as number,
        fullMark:      100,
      }))
    : [];

  const color = DISTRICT_COLORS[selectedDistrict] ?? "#38bdf8";

  return (
    <div className="bg-slate-950/80 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center shrink-0">
              <Target className="w-4 h-4 text-indigo-400" />
            </div>
            <h3 className="text-base font-bold text-slate-100">Multi-Dimensional Risk Profile Radar</h3>
          </div>
          <p className="text-xs text-slate-400 ml-9">
            District risk profile vs. statewide benchmark. Select a district below.
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 shrink-0">
          {data.map((d) => {
            const short = d.districtName.split(" ")[0];
            const active = d.districtName === selectedDistrict;
            return (
              <button
                key={d.districtName}
                onClick={() => setSelectedDistrict(d.districtName)}
                className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                  active
                    ? "border-sky-500 text-sky-300 bg-sky-500/20 shadow-md"
                    : "border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 bg-slate-900/60"
                }`}
              >
                {short}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs font-semibold bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-lg w-fit">
        <span className="flex items-center gap-1.5" style={{ color }}>
          <span className="w-3 h-3 rounded-full" style={{ background: color }} />
          {selectedDistrict}
        </span>
        <span className="flex items-center gap-1.5 text-sky-400">
          <span className="w-4 h-0 border-t-2 border-dashed border-sky-400" />
          Statewide Average
        </span>
      </div>

      <div className="h-[360px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarChartData} margin={{ top: 15, right: 30, bottom: 15, left: 30 }}>
            <PolarGrid stroke="#1e293b" />
            <PolarAngleAxis dataKey="metric" tick={{ fill: "#cbd5e1", fontSize: 12, fontWeight: 700 }} />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 11 }} tickCount={5} axisLine={false} />
            <Radar name={selected?.districtName ?? ""} dataKey="districtValue" stroke={color} fill={color} fillOpacity={0.35} strokeWidth={3} />
            <Radar name="Statewide Average" dataKey="statewideAvg" stroke="#38bdf8" strokeDasharray="4 4" fill="#38bdf8" fillOpacity={0.08} strokeWidth={2} />
            <Tooltip
              contentStyle={{ background: "rgba(2,6,23,0.98)", border: "1px solid rgba(51,65,85,0.9)", borderRadius: 10, fontSize: 13, color: "#f8fafc" }}
              formatter={(v: any, name: any) => [`${v} pts`, name === "districtValue" ? selectedDistrict : "Statewide Avg"]}
              labelFormatter={(l) => <span style={{ color, fontWeight: 700 }}>Indicator: {l}</span>}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {selected && (
        <div className="grid grid-cols-5 gap-2 bg-slate-900/60 border border-slate-800 p-3 rounded-xl">
          {radarMetrics.map((m) => (
            <div key={m.key} className="text-center">
              <div className="text-sm font-extrabold" style={{ color }}>{(selected as any)[m.key]}</div>
              <div className="text-xs font-semibold text-slate-500 mt-0.5">{m.label}</div>
            </div>
          ))}
        </div>
      )}

      <AIInsightCard
        accentClass="border-indigo-500/20"
        keyFinding="Kalaburagi's radar is skewed toward high stress and low education — a compound risk profile inconsistent with its low FIR count."
        observation="Kalaburagi presents an unbalanced risk profile: high economic stress (68%), high low-education score (35%), and significant migration pressure — yet a relatively low FIR count. This pattern is consistent with under-reporting rather than low incidence."
        whyMatters="A radar view surfaces compound risk that single-metric analysis misses. Districts with ≥3 elevated risk axes are more likely to experience rapid crime escalation if conditions worsen."
        action="Use radar profiles during annual resource allocation reviews. Districts with three or more elevated risk indicators should receive prioritised policing budgets, social welfare integration, and dedicated community liaisons."
      />
    </div>
  );
}

// ─── Criminological Theory Cards ─────────────────────────────────────────────
function TheoryCards({ data }: { data: SocioRow[] }) {
  const bengaluru  = data.find((d) => d.districtName === "Bengaluru City");
  const kalaburagi = data.find((d) => d.districtName === "Kalaburagi");
  const mangaluru  = data.find((d) => d.districtName.startsWith("Mangaluru"));

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {/* Social Disorganization */}
      <div className="rounded-2xl border border-rose-500/30 bg-gradient-to-br from-rose-950/30 to-slate-950/80 p-5 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <div className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-1">Social Disorganization Theory</div>
            <h4 className="text-sm font-bold text-rose-200 mb-2">Bengaluru: Urban Density Pattern</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              With urbanization at <span className="font-bold text-sky-400">{bengaluru?.urbanization ?? 92}%</span> and
              population density of <span className="font-bold text-sky-400">{bengaluru?.density?.toLocaleString() ?? "4,380"}/km²</span>,
              Bengaluru's rapid growth coincides with elevated property crime and cyber fraud — consistent with social
              disorganization theory, which associates high-density rapid urbanization with weakened community cohesion.
            </p>
          </div>
        </div>
      </div>

      {/* Strain Theory */}
      <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-950/30 to-slate-950/80 p-5 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 mt-0.5">
            <BookOpen className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">Strain Theory (Merton)</div>
            <h4 className="text-sm font-bold text-amber-200 mb-2">Kalaburagi: Blocked Opportunities</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Economic stress at <span className="font-bold text-amber-400">{kalaburagi?.stress ?? 68}%</span> with
              education at only <span className="font-bold text-amber-400">{kalaburagi?.education ?? 65}%</span> is
              consistent with strain theory conditions. Limited access to legitimate means is associated with violent
              crime patterns, as seen in assault case FIR-202600008 registered in this district.
            </p>
          </div>
        </div>
      </div>

      {/* Protective Factor */}
      <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/30 to-slate-950/80 p-5 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 mt-0.5">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">Protective Factor Analysis</div>
            <h4 className="text-sm font-bold text-emerald-200 mb-2">Mangaluru: Education as Buffer</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Education index of <span className="font-bold text-emerald-400">{mangaluru?.education ?? 91}%</span> —
              the highest across all 6 monitored districts — coincides with a lower crime burden despite moderate
              urbanization (<span className="font-bold text-emerald-400">{mangaluru?.urbanization ?? 72}%</span>).
              This pattern is consistent with education acting as a protective factor, though the small sample size
              warrants caution in generalising.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── District Detail Table (with womenCrimes) ────────────────────────────────
function DistrictTable({ data }: { data: SocioRow[] }) {
  return (
    <div className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-slate-300" />
            <h3 className="text-base font-bold text-slate-100">District Intelligence Summary Matrix</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Full socio-economic and crime breakdown for all 6 Karnataka districts — sourced from FIR ER Dataset CSV files.
          </p>
        </div>
        <span className="text-xs font-semibold text-sky-400 bg-sky-500/10 border border-sky-500/30 px-3 py-1 rounded-lg shrink-0">
          6 Districts
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-slate-900/90 border-b border-slate-800 text-xs font-bold text-slate-300 uppercase tracking-wider">
              <th className="py-3 px-4">District</th>
              <th className="py-3 px-3 text-center">Urban %</th>
              <th className="py-3 px-3 text-center">Migration %</th>
              <th className="py-3 px-3 text-center">Stress %</th>
              <th className="py-3 px-3 text-center">Edu %</th>
              <th className="py-3 px-3 text-center">Density /km²</th>
              <th className="py-3 px-3 text-center text-amber-400">Property</th>
              <th className="py-3 px-3 text-center text-rose-400">Violent</th>
              <th className="py-3 px-3 text-center text-purple-400">Cyber</th>
              <th className="py-3 px-3 text-center text-emerald-400">Narcotics</th>
              <th className="py-3 px-3 text-center text-pink-400">Women</th>
              <th className="py-3 px-4 text-center text-slate-100">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {data.map((d, i) => (
              <tr key={i} className="hover:bg-slate-900/50 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2.5">
                    <span
                      style={{ background: DISTRICT_COLORS[d.districtName] ?? "#64748b", width: 9, height: 9, borderRadius: "50%", display: "inline-block", flexShrink: 0 }}
                    />
                    <span className="font-semibold text-sm text-slate-100">{d.districtName}</span>
                  </div>
                </td>
                <td className="py-3 px-3 text-center text-sky-400 font-bold text-xs">{d.urbanization}%</td>
                <td className="py-3 px-3 text-center text-purple-400 font-bold text-xs">{d.migration}%</td>
                <td className="py-3 px-3 text-center">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                    d.stress >= 60 ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                    : d.stress >= 40 ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  }`}>
                    {d.stress}%
                  </span>
                </td>
                <td className="py-3 px-3 text-center text-emerald-400 font-bold text-xs">{d.education}%</td>
                <td className="py-3 px-3 text-center text-slate-300 font-mono text-xs">{d.density.toLocaleString()}</td>
                <td className="py-3 px-3 text-center text-amber-400 font-extrabold text-xs">{d.propertyCrimes}</td>
                <td className="py-3 px-3 text-center text-rose-400 font-extrabold text-xs">{d.bodyCrimes}</td>
                <td className="py-3 px-3 text-center text-purple-400 font-extrabold text-xs">{d.cyberCrimes}</td>
                <td className="py-3 px-3 text-center text-emerald-400 font-extrabold text-xs">{d.drugCrimes}</td>
                <td className="py-3 px-3 text-center text-pink-400 font-extrabold text-xs">{d.womenCrimes}</td>
                <td className="py-3 px-4 text-center">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-extrabold bg-sky-500/20 text-sky-300 border border-sky-500/40">
                    {d.totalCrimes}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Cross-Module Actions ─────────────────────────────────────────────────────
function CrossModulePanel({ onNavigate, setChatInput, logAuditEvent }: Pick<Props, "onNavigate" | "setChatInput" | "logAuditEvent">) {
  const actions = [
    {
      label: "View Crime Hotspots Map",
      desc: "Spatial analysis & heat intensity",
      tab: "hotspots",
      color: "text-sky-300",
      border: "border-sky-500/30",
      bg: "bg-sky-500/10",
    },
    {
      label: "Ask AI for Deep Analysis",
      desc: "Economic stress vs crime query",
      tab: "conversational",
      color: "text-purple-300",
      border: "border-purple-500/30",
      bg: "bg-purple-500/10",
      prefill: "Explain the relationship between economic stress and violent crime in Kalaburagi district",
    },
    {
      label: "Check Risk Predictions",
      desc: "Predictive early warning alarms",
      tab: "forecasting",
      color: "text-amber-300",
      border: "border-amber-500/30",
      bg: "bg-amber-500/10",
    },
    {
      label: "View Offender Profiles",
      desc: "Recidivism risk & dossier trace",
      tab: "profiling",
      color: "text-emerald-300",
      border: "border-emerald-500/30",
      bg: "bg-emerald-500/10",
    },
  ];

  return (
    <div className="bg-slate-950/80 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
      <div className="flex items-center gap-2">
        <Lightbulb className="w-5 h-5 text-sky-400" />
        <h3 className="text-base font-bold text-slate-100">Recommended Cross-Module Investigative Actions</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((a) => (
          <button
            key={a.tab}
            onClick={() => {
              if (a.prefill) setChatInput(a.prefill);
              onNavigate(a.tab);
              logAuditEvent("Cross Link", `Sociological → ${a.tab}`);
            }}
            className={`group flex flex-col justify-between p-4 rounded-xl border ${a.border} ${a.bg} hover:border-opacity-100 transition-all text-left space-y-2`}
          >
            <div>
              <span className={`text-sm font-bold block ${a.color}`}>{a.label}</span>
              <span className="text-xs text-slate-400 mt-1 block">{a.desc}</span>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-slate-300 pt-2 border-t border-slate-800/60">
              <span>Launch Action</span>
              <ArrowRight className={`w-4 h-4 ${a.color} transition-transform group-hover:translate-x-1`} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function SociologicalInsights({ socioData, onNavigate, setChatInput, logAuditEvent }: Props) {
  const { t } = useLanguage();

  if (!socioData || socioData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
          <Activity className="w-5 h-5 text-slate-500" />
        </div>
        <p className="text-sm text-slate-500">Loading sociological data…</p>
        <div className="space-y-2 w-full max-w-md">
          <div className="h-4 bg-slate-800 rounded animate-pulse" />
          <div className="h-4 bg-slate-800 rounded animate-pulse w-3/4" />
          <div className="h-4 bg-slate-800 rounded animate-pulse w-1/2" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      key="tab_sociological"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col gap-7 overflow-y-auto h-full pr-2 scrollbar-thin scrollbar-thumb-slate-800 pb-12"
    >
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-950/90 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-sky-400" />
            {t("socio.title")}
          </h2>
          <p className="text-xs text-slate-400 mt-1">{t("socio.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-sky-500/10 text-sky-300 border border-sky-500/30">
            6 Districts Monitored
          </span>
          <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-500/10 text-purple-300 border border-purple-500/30">
            {socioData.reduce((s, d) => s + d.totalCrimes, 0)} FIR Cases
          </span>
        </div>
      </div>

      {/* KPI Summary */}
      <StatewideKpiBar data={socioData} />

      {/* Main socio-economic risk chart — full width */}
      <SocioRiskChart data={socioData} />

      {/* Crime distribution — full width */}
      <CrimeDistributionChart data={socioData} />

      {/* Scatter + Radar — side by side at 2xl, stacked below */}
      <div className="grid grid-cols-1 2xl:grid-cols-2 gap-6">
        <UrbanizationScatterChart data={socioData} />
        <DistrictRadarChart data={socioData} />
      </div>

      {/* Theory Cards */}
      <TheoryCards data={socioData} />

      {/* District Table */}
      <DistrictTable data={socioData} />

      {/* Cross-Module Actions */}
      <CrossModulePanel onNavigate={onNavigate} setChatInput={setChatInput} logAuditEvent={logAuditEvent} />
    </motion.div>
  );
}
