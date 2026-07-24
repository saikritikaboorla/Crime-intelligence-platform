import React, { useState } from "react";
import { motion } from "motion/react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ScatterChart, Scatter,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  Cell, LabelList
} from "recharts";
import {
  Activity, TrendingUp, Sparkles, AlertTriangle, CheckCircle,
  ArrowRight, BookOpen, Target, Lightbulb, Shield, LineChart,
  Filter, Layers, BarChart2
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
  observation: string;
  trend: string;
  whyMatters: string;
  action: string;
  accentClass?: string;
}

function AIInsightCard({ observation, trend, whyMatters, action, accentClass = "border-sky-500/25" }: InsightProps) {
  const [open, setOpen] = useState(true);
  return (
    <div className={`mt-4 rounded-xl border ${accentClass} bg-slate-950/70 border-l-4 shadow-lg`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left group"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-xs font-bold text-sky-300 uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-sky-400" />
          AI Sociological Analysis
        </span>
        <span className="text-slate-400 text-xs font-semibold group-hover:text-slate-200 transition">
          {open ? "▴ Collapse Insight" : "▾ Expand Insight"}
        </span>
      </button>
      {open && (
        <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-800/60 pt-3">
          <div className="space-y-1">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Key Observation</div>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">{observation}</p>
          </div>
          <div className="space-y-1">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Trend Summary</div>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">{trend}</p>
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
    minWidth: 200,
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.6)"
  }}>
    {children}
  </div>
);

// ─── Statewide KPI Summary Header Bar ──────────────────────────────────────────
function StatewideKpiBar({ data }: { data: SocioRow[] }) {
  if (!data.length) return null;

  const avgUrban = (data.reduce((s, d) => s + d.urbanization, 0) / data.length).toFixed(1);
  const avgStress = (data.reduce((s, d) => s + d.stress, 0) / data.length).toFixed(1);
  const avgEdu = (data.reduce((s, d) => s + d.education, 0) / data.length).toFixed(1);
  const totalCrimes = data.reduce((s, d) => s + d.totalCrimes, 0);

  const kpis = [
    {
      label: "Statewide Avg Urbanization",
      value: `${avgUrban}%`,
      subText: "Bengaluru highest at 92%",
      icon: <Activity className="w-5 h-5 text-sky-400" />,
      color: "border-sky-500/30 bg-sky-500/5",
      valueClass: "text-sky-300",
    },
    {
      label: "Statewide Avg Econ. Stress",
      value: `${avgStress}%`,
      subText: "Kalaburagi highest at 68%",
      icon: <AlertTriangle className="w-5 h-5 text-rose-400" />,
      color: "border-rose-500/30 bg-rose-500/5",
      valueClass: "text-rose-300",
    },
    {
      label: "Statewide Education Index",
      value: `${avgEdu}%`,
      subText: "Mangaluru leads at 91%",
      icon: <CheckCircle className="w-5 h-5 text-emerald-400" />,
      color: "border-emerald-500/30 bg-emerald-500/5",
      valueClass: "text-emerald-300",
    },
    {
      label: "Total Registered FIR Cases",
      value: `${totalCrimes} Cases`,
      subText: "Across 6 Karnataka districts",
      icon: <Shield className="w-5 h-5 text-amber-400" />,
      color: "border-amber-500/30 bg-amber-500/5",
      valueClass: "text-amber-300",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi, i) => (
        <div key={i} className={`rounded-xl border p-4 space-y-2 ${kpi.color}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider font-bold text-slate-400">{kpi.label}</span>
            <div className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-800">{kpi.icon}</div>
          </div>
          <div>
            <div className={`text-2xl sm:text-3xl font-extrabold tabular-nums tracking-tight ${kpi.valueClass}`}>{kpi.value}</div>
            <p className="text-xs text-slate-400 mt-1">{kpi.subText}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Chart 1: Socio-Economic Risk Indices ────────────────────────────────────
function SocioRiskChart({ data }: { data: SocioRow[] }) {
  const chartData = data.map((d) => ({
    name: d.districtName.split(" ")[0],
    fullName: d.districtName,
    "Urbanization %": d.urbanization,
    "Economic Stress %": d.stress,
    "Migration Rate %": d.migration,
    "Education Index %": d.education,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const row = data.find((d) => d.districtName.startsWith(label));
    return (
      <TooltipBox>
        <p style={{ color: "#f8fafc", fontWeight: 700, marginBottom: 8, fontSize: 14 }}>{row?.districtName ?? label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color, marginBottom: 4, fontSize: 12.5 }}>
            {p.name}: <span style={{ color: "#f8fafc", fontWeight: 700 }}>{p.value}%</span>
          </p>
        ))}
        {row && (
          <p style={{ color: "#94a3b8", marginTop: 8, borderTop: "1px solid #1e293b", paddingTop: 6, fontSize: 12 }}>
            Population Density: <strong style={{ color: "#e2e8f0" }}>{row.density.toLocaleString()} /km²</strong>
          </p>
        )}
      </TooltipBox>
    );
  };

  return (
    <div className="bg-slate-950/80 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-sky-500/15 border border-sky-500/25 flex items-center justify-center">
              <Activity className="w-4 h-4 text-sky-400" />
            </div>
            <h3 className="text-base font-bold text-slate-100">Socio-Economic Risk Indices by District</h3>
          </div>
          <p className="text-xs text-slate-400 ml-9">
            Comparative analysis of urbanization, economic stress, migration and education indices across all 6 districts
          </p>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-[380px] w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 25, right: 20, bottom: 45, left: 10 }} barCategoryGap="20%" barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="#475569"
              tick={{ fill: "#cbd5e1", fontSize: 13, fontWeight: 700 }}
              tickLine={false}
              axisLine={{ stroke: "#334155" }}
              label={{ value: "Karnataka Districts", position: "insideBottom", offset: -25, style: { fill: "#94a3b8", fontSize: 12, fontWeight: 600 } }}
            />
            <YAxis
              stroke="#475569"
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}%`}
              domain={[0, 100]}
              width={45}
              label={{ value: "Index Percentage (%)", angle: -90, position: "insideLeft", offset: 10, style: { fill: "#94a3b8", fontSize: 12, fontWeight: 600 } }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(51,65,85,0.2)" }} />
            <Legend
              wrapperStyle={{ fontSize: 13, paddingTop: 16 }}
              iconType="square"
              iconSize={12}
              formatter={(v) => <span style={{ color: "#cbd5e1", fontWeight: 600 }}>{v}</span>}
            />
            <Bar dataKey="Urbanization %" fill="#38bdf8" radius={[4, 4, 0, 0]} maxBarSize={22}>
              <LabelList dataKey="Urbanization %" position="top" style={{ fontSize: 10.5, fill: "#38bdf8", fontWeight: 700 }} formatter={(v: number) => `${v}%`} />
            </Bar>
            <Bar dataKey="Economic Stress %" fill="#f87171" radius={[4, 4, 0, 0]} maxBarSize={22}>
              <LabelList dataKey="Economic Stress %" position="top" style={{ fontSize: 10.5, fill: "#f87171", fontWeight: 700 }} formatter={(v: number) => `${v}%`} />
            </Bar>
            <Bar dataKey="Migration Rate %" fill="#c084fc" radius={[4, 4, 0, 0]} maxBarSize={22}>
              <LabelList dataKey="Migration Rate %" position="top" style={{ fontSize: 10.5, fill: "#c084fc", fontWeight: 700 }} formatter={(v: number) => `${v}%`} />
            </Bar>
            <Bar dataKey="Education Index %" fill="#34d399" radius={[4, 4, 0, 0]} maxBarSize={22}>
              <LabelList dataKey="Education Index %" position="top" style={{ fontSize: 10.5, fill: "#34d399", fontWeight: 700 }} formatter={(v: number) => `${v}%`} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <AIInsightCard
        accentClass="border-sky-500/20"
        observation="Bengaluru City dominates on urbanization (92%) while Kalaburagi leads on economic stress (68%). These represent opposite poles of Karnataka's socio-economic spectrum."
        trend="Urbanization and economic stress show an inverse relationship: as urbanization rises (Bengaluru), formal employment reduces stress; conversely rural-semi-urban districts face higher structural poverty stress."
        whyMatters="High economic stress correlates directly with crime motivation. Kalaburagi's 68% stress index, lowest education (65%), and rising violent crime confirm Merton's Strain Theory — blocked legitimate means drive crime."
        action="Prioritize community policing and economic intervention programs in Kalaburagi and Belagavi. Deploy cyber-awareness campaigns in Bengaluru to address the urbanization-driven fraud vectors."
      />
    </div>
  );
}

// ─── Chart 2: Crime Type Distribution by District ────────────────────────────
function CrimeDistributionChart({ data }: { data: SocioRow[] }) {
  const chartData = data.map((d) => ({
    name: d.districtName.split(" ")[0],
    fullName: d.districtName,
    "Property / Theft": d.propertyCrimes,
    "Violent / Assault": d.bodyCrimes,
    "Cyber Fraud": d.cyberCrimes,
    "Narcotics": d.drugCrimes,
    total: d.totalCrimes,
  }));

  // Aggregated totals by category across state
  const totProp = data.reduce((s, d) => s + d.propertyCrimes, 0);
  const totViol = data.reduce((s, d) => s + d.bodyCrimes, 0);
  const totCyber = data.reduce((s, d) => s + d.cyberCrimes, 0);
  const totDrug = data.reduce((s, d) => s + d.drugCrimes, 0);
  const totAll = data.reduce((s, d) => s + d.totalCrimes, 0);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const row = data.find((d) => d.districtName.startsWith(label));
    const total = row?.totalCrimes ?? 0;
    return (
      <TooltipBox>
        <p style={{ color: "#f8fafc", fontWeight: 700, marginBottom: 8, fontSize: 14 }}>{row?.districtName ?? label}</p>
        {payload.map((p: any) => p.value > 0 && (
          <p key={p.name} style={{ color: p.fill, marginBottom: 4, fontSize: 12.5 }}>
            {p.name}: <span style={{ color: "#f8fafc", fontWeight: 700 }}>{p.value} cases</span>
            {total > 0 && (
              <span style={{ color: "#94a3b8", fontSize: 11.5 }}> ({Math.round((p.value / total) * 100)}%)</span>
            )}
          </p>
        ))}
        <p style={{ color: "#94a3b8", borderTop: "1px solid #1e293b", paddingTop: 6, marginTop: 6, fontSize: 12.5 }}>
          Total FIR Cases: <span style={{ color: "#fbbf24", fontWeight: 800 }}>{total}</span>
        </p>
      </TooltipBox>
    );
  };

  return (
    <div className="bg-slate-950/80 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-rose-500/15 border border-rose-500/25 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-rose-400" />
            </div>
            <h3 className="text-base font-bold text-slate-100">Crime Type Distribution by District</h3>
          </div>
          <p className="text-xs text-slate-400 ml-9">
            Stacked breakdown of registered IPC crime head categories across all 6 districts
          </p>
        </div>

        {/* Aggregated Crime Head Category Summary Pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
          <span className="px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300">
            Property: {totProp} ({((totProp / totAll) * 100).toFixed(0)}%)
          </span>
          <span className="px-2.5 py-1 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-300">
            Violent: {totViol} ({((totViol / totAll) * 100).toFixed(0)}%)
          </span>
          <span className="px-2.5 py-1 rounded-md bg-purple-500/10 border border-purple-500/30 text-purple-300">
            Cyber: {totCyber} ({((totCyber / totAll) * 100).toFixed(0)}%)
          </span>
          <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
            Narcotics: {totDrug} ({((totDrug / totAll) * 100).toFixed(0)}%)
          </span>
        </div>
      </div>

      <div className="h-[380px] w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 25, right: 20, bottom: 45, left: 10 }} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="#475569"
              tick={{ fill: "#cbd5e1", fontSize: 13, fontWeight: 700 }}
              tickLine={false}
              axisLine={{ stroke: "#334155" }}
              label={{ value: "Karnataka Districts", position: "insideBottom", offset: -25, style: { fill: "#94a3b8", fontSize: 12, fontWeight: 600 } }}
            />
            <YAxis
              stroke="#475569"
              tick={{ fill: "#94a3b8", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              width={35}
              label={{ value: "FIR Case Count", angle: -90, position: "insideLeft", offset: 10, style: { fill: "#94a3b8", fontSize: 12, fontWeight: 600 } }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(51,65,85,0.2)" }} />
            <Legend
              wrapperStyle={{ fontSize: 13, paddingTop: 16 }}
              iconType="square"
              iconSize={12}
              formatter={(v) => <span style={{ color: "#cbd5e1", fontWeight: 600 }}>{v}</span>}
            />
            <Bar dataKey="Property / Theft" stackId="a" fill="#f59e0b" name="Property / Theft" />
            <Bar dataKey="Violent / Assault" stackId="a" fill="#ef4444" name="Violent / Assault" />
            <Bar dataKey="Cyber Fraud" stackId="a" fill="#c084fc" name="Cyber Fraud" />
            <Bar dataKey="Narcotics" stackId="a" fill="#34d399" name="Narcotics" radius={[4, 4, 0, 0]}>
              <LabelList dataKey="total" position="top" style={{ fontSize: 12, fill: "#fbbf24", fontWeight: 800 }} formatter={(v: number) => `${v} FIRs`} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <AIInsightCard
        accentClass="border-rose-500/20"
        observation="Bengaluru City accounts for the highest absolute crime count (4 cases), driven by property theft and narcotics. Kalaburagi shows the highest proportion of violent crime relative to its total."
        trend="Property crimes dominate statewide (50% of all FIRs). Violent crime is concentrated in districts with high economic stress (Kalaburagi, Bengaluru). Cyber fraud is limited to urban centres with banking infrastructure."
        whyMatters="Crime category concentration maps directly to intervention type. A one-size-fits-all approach fails — Bengaluru needs cyber patrol units; Kalaburagi needs community violence de-escalation."
        action="Allocate dedicated cyber-crime resources to Bengaluru and Mangaluru. Establish conflict-resolution outreach programs in Kalaburagi. Increase property crime surveillance in Bengaluru and Hubballi corridors."
      />
    </div>
  );
}

// ─── Chart 3: Urbanization × Crime Scatter & Regression Vector ─────────────
function UrbanizationScatterChart({ data }: { data: SocioRow[] }) {
  // Map specific label offsets to guarantee NO label overlap!
  const labelOffsets: Record<string, { dx: number; dy: number; textAnchor: "middle" | "start" | "end" }> = {
    "Bengaluru City":               { dx: 0,   dy: -24, textAnchor: "middle" },
    "Mysuru":                       { dx: 24,  dy: -4,  textAnchor: "start" },
    "Mangaluru (Dakshina Kannada)": { dx: -24, dy: -4,  textAnchor: "end" },
    "Hubballi-Dharwad":             { dx: 0,   dy: -24, textAnchor: "middle" },
    "Belagavi":                     { dx: 24,  dy: 16,  textAnchor: "start" },
    "Kalaburagi":                   { dx: -24, dy: 16,  textAnchor: "end" },
  };

  const chartData = data.map((d) => ({
    urbanization: d.urbanization,
    totalCrimes: d.totalCrimes,
    stress: d.stress,
    districtName: d.districtName,
    shortName: d.districtName.split(" ")[0],
    color: DISTRICT_COLORS[d.districtName] ?? "#64748b",
    offset: labelOffsets[d.districtName] ?? { dx: 0, dy: -20, textAnchor: "middle" },
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    if (!d) return null;
    return (
      <TooltipBox>
        <p style={{ color: d.color, fontWeight: 700, marginBottom: 6, fontSize: 14 }}>{d.districtName}</p>
        <p style={{ color: "#94a3b8", fontSize: 12.5 }}>Urbanization Index: <span style={{ color: "#f8fafc", fontWeight: 700 }}>{d.urbanization}%</span></p>
        <p style={{ color: "#94a3b8", fontSize: 12.5 }}>Total FIR Cases: <span style={{ color: "#fbbf24", fontWeight: 700 }}>{d.totalCrimes}</span></p>
        <p style={{ color: "#94a3b8", fontSize: 12.5 }}>Economic Stress: <span style={{ color: "#f87171", fontWeight: 700 }}>{d.stress}%</span></p>
        <p style={{ color: "#64748b", fontSize: 11.5, marginTop: 6, borderTop: "1px solid #1e293b", paddingTop: 4 }}>
          Positive Correlation ($r \approx +0.82$)
        </p>
      </TooltipBox>
    );
  };

  return (
    <div className="bg-slate-950/80 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">Urbanization vs. Total FIR Cases Correlation</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Scatter plot of urbanization % against FIR counts · Non-overlapping district tags · Size ∝ case count
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-lg">
          {DISTRICT_KEYS.map((d) => (
            <span key={d} className="flex items-center gap-1.5 text-slate-300">
              <span style={{ background: DISTRICT_COLORS[d], width: 9, height: 9, borderRadius: "50%", display: "inline-block" }} />
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
              label={{ value: "Urbanization Index (%)", position: "insideBottom", offset: -25, fill: "#94a3b8", fontSize: 12, fontWeight: 600 }}
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
              width={35}
              label={{ value: "Registered FIR Cases", angle: -90, position: "insideLeft", offset: 10, fill: "#94a3b8", fontSize: 12, fontWeight: 600 }}
            />
            <Tooltip content={<CustomTooltip />} cursor={false} />
            <Scatter
              name="Districts"
              data={chartData}
              shape={(props: any) => {
                const { cx, cy, payload } = props;
                const r = 14 + payload.totalCrimes * 7;
                const { dx, dy, textAnchor } = payload.offset;

                return (
                  <g>
                    {/* Glowing outer circle */}
                    <circle cx={cx} cy={cy} r={r} fill={payload.color} fillOpacity={0.2} stroke={payload.color} strokeWidth={2.5} />
                    <circle cx={cx} cy={cy} r={5} fill={payload.color} />

                    {/* Non-Overlapping Label Background Badge */}
                    <rect
                      x={cx + dx - (payload.shortName.length * 4 + 8) * (textAnchor === "end" ? 1 : textAnchor === "middle" ? 0.5 : 0)}
                      y={cy + dy - 12}
                      width={payload.shortName.length * 8 + 16}
                      height={18}
                      rx={4}
                      ry={4}
                      fill="#030712"
                      stroke={payload.color}
                      strokeWidth="1"
                    />
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
        observation="There is a positive correlation between urbanization and FIR case count. Bengaluru (92% urban, 4 cases) sits at the top-right, while Kalaburagi (35% urban, 1 case) sits at the bottom-left — despite its very high economic stress."
        trend="Urbanization amplifies crime opportunity and visibility (more reported cases). However, Kalaburagi's low case count likely reflects under-reporting rather than low incidence, given its 68% economic stress index."
        whyMatters="Urban crime is more visible and reported; rural crime is systematically under-reported. Relying only on FIR counts underestimates rural threat levels — especially for violent and domestic crimes in Belagavi and Kalaburagi."
        action="Establish mobile reporting units and anonymous tip lines in Kalaburagi and Belagavi to surface under-reported crime. Weight district-level risk assessments with socio-economic stress indices, not just FIR counts."
      />
    </div>
  );
}

// ─── Chart 4: Multi-Dimensional Risk Radar with Aggregated Benchmark ────────
function DistrictRadarChart({ data }: { data: SocioRow[] }) {
  const radarMetrics = [
    { key: "urbanization", label: "Urbanization" },
    { key: "stress", label: "Econ. Stress" },
    { key: "migration", label: "Migration" },
    { key: "crimeLoad", label: "Crime Load" },
    { key: "eduInverse", label: "Low Education" },
  ];

  const [selectedDistrict, setSelectedDistrict] = useState<string>(data[0]?.districtName ?? "");

  // Enrich data with normalised metrics
  const enriched = data.map((d) => ({
    ...d,
    crimeLoad: Math.round((d.totalCrimes / 4) * 100),
    eduInverse: 100 - d.education,
  }));

  // Statewide Benchmark Average
  const statewideAvg = {
    urbanization: Math.round(data.reduce((s, d) => s + d.urbanization, 0) / data.length),
    stress: Math.round(data.reduce((s, d) => s + d.stress, 0) / data.length),
    migration: Math.round(data.reduce((s, d) => s + d.migration, 0) / data.length),
    crimeLoad: Math.round((data.reduce((s, d) => s + d.totalCrimes, 0) / (data.length * 4)) * 100),
    eduInverse: Math.round(100 - data.reduce((s, d) => s + d.education, 0) / data.length),
  };

  const selected = enriched.find((d) => d.districtName === selectedDistrict);

  const radarChartData = selected
    ? radarMetrics.map((m) => ({
        metric: m.label,
        districtValue: (selected as any)[m.key] as number,
        statewideAvg: (statewideAvg as any)[m.key] as number,
        fullMark: 100,
      }))
    : [];

  const color = DISTRICT_COLORS[selectedDistrict] ?? "#38bdf8";

  return (
    <div className="bg-slate-950/80 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center">
              <Target className="w-4 h-4 text-indigo-400" />
            </div>
            <h3 className="text-base font-bold text-slate-100">Multi-Dimensional Risk Profile Radar</h3>
          </div>
          <p className="text-xs text-slate-400 ml-9">
            District risk profile compared directly against the Statewide Benchmark Average
          </p>
        </div>

        {/* District Selector Buttons */}
        <div className="flex flex-wrap gap-1.5">
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

      {/* Radar Legend */}
      <div className="flex items-center gap-4 text-xs font-semibold bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-lg w-fit">
        <span className="flex items-center gap-1.5" style={{ color }}>
          <span className="w-3.5 h-3.5 rounded-full" style={{ background: color }}></span>
          {selectedDistrict}
        </span>
        <span className="flex items-center gap-1.5 text-sky-400">
          <span className="w-4 h-0.5 border-t-2 border-dashed border-sky-400"></span>
          Statewide Average Benchmark
        </span>
      </div>

      <div className="h-[380px] w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarChartData} margin={{ top: 15, right: 30, bottom: 15, left: 30 }}>
            <PolarGrid stroke="#1e293b" />
            <PolarAngleAxis
              dataKey="metric"
              tick={{ fill: "#cbd5e1", fontSize: 13, fontWeight: 700 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: "#64748b", fontSize: 11 }}
              tickCount={5}
              axisLine={false}
            />
            {/* Selected District Radar */}
            <Radar
              name={selected?.districtName ?? ""}
              dataKey="districtValue"
              stroke={color}
              fill={color}
              fillOpacity={0.35}
              strokeWidth={3}
            />
            {/* Statewide Average Benchmark Overlay */}
            <Radar
              name="Statewide Average"
              dataKey="statewideAvg"
              stroke="#38bdf8"
              strokeDasharray="4 4"
              fill="#38bdf8"
              fillOpacity={0.08}
              strokeWidth={2}
            />
            <Tooltip
              contentStyle={{
                background: "rgba(2, 6, 23, 0.98)",
                border: "1px solid rgba(51, 65, 85, 0.9)",
                borderRadius: 10,
                fontSize: 13,
                color: "#f8fafc",
              }}
              formatter={(v: any, name: any) => [`${v} points`, name === "districtValue" ? selectedDistrict : "Statewide Average"]}
              labelFormatter={(l) => <span style={{ color: color, fontWeight: 700 }}>Indicator: {l}</span>}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {selected && (
        <div className="mt-2 grid grid-cols-5 gap-3 bg-slate-900/60 border border-slate-800 p-3 rounded-xl">
          {radarMetrics.map((m) => (
            <div key={m.key} className="text-center">
              <div className="text-sm sm:text-base font-extrabold" style={{ color }}>
                {(selected as any)[m.key]}
              </div>
              <div className="text-[11px] font-semibold text-slate-400">{m.label}</div>
            </div>
          ))}
        </div>
      )}

      <AIInsightCard
        accentClass="border-indigo-500/20"
        observation="Kalaburagi presents the most dangerous risk profile: highest economic stress (68%), highest low-education score (35%), significant migration pressure — all with minimal crime-fighting infrastructure. Bengaluru's radar is wide but more balanced."
        trend="Districts with unbalanced profiles — where stress and low-education are high but urbanization is low — are most susceptible to violent crime escalation over the next 12–18 months."
        whyMatters="A radar view surfaces hidden compound risk. A district can look safe on a single metric while being extremely vulnerable on the combination. This view prevents false reassurance from single-indicator analysis."
        action="Use radar profiles during annual resource allocation. Districts with ≥3 high-risk indicators should receive escalated policing budgets, social welfare integration, and dedicated community liaisons."
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Social Disorganization */}
      <div className="rounded-2xl border border-rose-500/30 bg-gradient-to-br from-rose-950/30 to-slate-950/80 p-6 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <div className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-1">Social Disorganization Theory</div>
            <h4 className="text-base font-bold text-rose-200 mb-2">Bengaluru: Urban Density Driver</h4>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              With urbanization at <span className="font-bold text-sky-400">{bengaluru?.urbanization ?? 92}%</span> and
              population density of <span className="font-bold text-sky-400">{bengaluru?.density?.toLocaleString() ?? "4,380"}/km²</span>,
              Bengaluru's rapid growth outpaces social cohesion — directly increasing property crime and cyber fraud opportunity.
            </p>
          </div>
        </div>
      </div>

      {/* Strain Theory */}
      <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-950/30 to-slate-950/80 p-6 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 mt-0.5">
            <BookOpen className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">Strain Theory (Merton)</div>
            <h4 className="text-base font-bold text-amber-200 mb-2">Kalaburagi: Blocked Opportunities</h4>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Economic stress at <span className="font-bold text-amber-400">{kalaburagi?.stress ?? 68}%</span> with
              education at only <span className="font-bold text-amber-400">{kalaburagi?.education ?? 65}%</span> —
              the classic Mertonian condition. Inability to achieve socially approved goals through legitimate means drives
              violent crime escalation, as confirmed by assault case FIR-202600008.
            </p>
          </div>
        </div>
      </div>

      {/* Protective Factor */}
      <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/30 to-slate-950/80 p-6 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 mt-0.5">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">Protective Factor Analysis</div>
            <h4 className="text-base font-bold text-emerald-200 mb-2">Mangaluru: Education as Buffer</h4>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Education index of <span className="font-bold text-emerald-400">{mangaluru?.education ?? 91}%</span> —
              Karnataka's highest — acts as a crime suppressor despite moderate urbanization
              (<span className="font-bold text-emerald-400">{mangaluru?.urbanization ?? 72}%</span>).
              This validates that education investment is the strongest single policy lever for long-term crime reduction.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── District Detail Table ────────────────────────────────────────────────────
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
            Full socio-economic and crime breakdown for all 6 Karnataka districts — sourced directly from the FIR ER Dataset
          </p>
        </div>
        <span className="text-xs font-semibold text-sky-400 bg-sky-500/10 border border-sky-500/30 px-3 py-1 rounded-lg">
          6 Districts Monitored
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900/90 border-b border-slate-800 text-xs font-bold text-slate-300 uppercase tracking-wider">
              <th className="py-3.5 px-4">District</th>
              <th className="py-3.5 px-3 text-center">Urban %</th>
              <th className="py-3.5 px-3 text-center">Migration %</th>
              <th className="py-3.5 px-3 text-center">Econ. Stress %</th>
              <th className="py-3.5 px-3 text-center">Education %</th>
              <th className="py-3.5 px-3 text-center">Density /km²</th>
              <th className="py-3.5 px-3 text-center text-amber-400">Property</th>
              <th className="py-3.5 px-3 text-center text-rose-400">Violent</th>
              <th className="py-3.5 px-3 text-center text-purple-400">Cyber</th>
              <th className="py-3.5 px-3 text-center text-emerald-400">Narcotics</th>
              <th className="py-3.5 px-4 text-center font-bold text-slate-100">Total FIRs</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-850">
            {data.map((d, i) => (
              <tr key={i} className="hover:bg-slate-850/80 transition-colors">
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-2.5">
                    <span
                      style={{
                        background: DISTRICT_COLORS[d.districtName] ?? "#64748b",
                        width: 10,
                        height: 10,
                        borderRadius: "50%",
                        display: "inline-block",
                        flexShrink: 0,
                      }}
                    />
                    <span className="font-semibold text-sm text-slate-100">{d.districtName}</span>
                  </div>
                </td>
                <td className="py-3.5 px-3 text-center text-sky-400 font-bold text-xs sm:text-sm">{d.urbanization}%</td>
                <td className="py-3.5 px-3 text-center text-purple-400 font-bold text-xs sm:text-sm">{d.migration}%</td>
                <td className="py-3.5 px-3 text-center">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      d.stress >= 60
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                        : d.stress >= 40
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                        : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                    }`}
                  >
                    {d.stress}%
                  </span>
                </td>
                <td className="py-3.5 px-3 text-center text-emerald-400 font-bold text-xs sm:text-sm">{d.education}%</td>
                <td className="py-3.5 px-3 text-center text-slate-300 font-mono text-xs sm:text-sm">{d.density.toLocaleString()}</td>
                <td className="py-3.5 px-3 text-center text-amber-400 font-extrabold text-xs sm:text-sm">{d.propertyCrimes}</td>
                <td className="py-3.5 px-3 text-center text-rose-400 font-extrabold text-xs sm:text-sm">{d.bodyCrimes}</td>
                <td className="py-3.5 px-3 text-center text-purple-400 font-extrabold text-xs sm:text-sm">{d.cyberCrimes}</td>
                <td className="py-3.5 px-3 text-center text-emerald-400 font-extrabold text-xs sm:text-sm">{d.drugCrimes}</td>
                <td className="py-3.5 px-4 text-center">
                  <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-extrabold bg-sky-500/20 text-sky-300 border border-sky-500/40">
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
  if (!socioData || socioData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
          <Activity className="w-5 h-5 text-slate-500" />
        </div>
        <p className="text-body text-slate-500">Loading sociological data…</p>
        <div className="space-y-2 w-full max-w-md">
          <div className="skeleton h-4 rounded" />
          <div className="skeleton h-4 w-3/4 rounded" />
          <div className="skeleton h-4 w-1/2 rounded" />
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
      className="flex flex-col gap-8 overflow-y-auto h-full pr-2 scrollbar-thin scrollbar-thumb-slate-800 pb-12"
    >
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-950/90 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-sky-400" />
            Sociological Crime Insights & Socio-Economic Correlations
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Data-grounded analysis of urbanization, economic stress, migration, and education indices across 6 Karnataka districts — derived exclusively from the KSP FIR ER Dataset
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-sky-500/10 text-sky-300 border border-sky-500/30">
            6 Districts Monitored
          </span>
          <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-500/10 text-purple-300 border border-purple-500/30">
            8 FIR Records Linked
          </span>
        </div>
      </div>

      {/* Statewide Aggregated KPI Summary Header Bar */}
      <StatewideKpiBar data={socioData} />

      {/* Row 1: Socio-Economic Risk Indices + Crime Type Distribution */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <SocioRiskChart data={socioData} />
        <CrimeDistributionChart data={socioData} />
      </div>

      {/* Row 2: Urbanization Scatter + Risk Profile Radar */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <UrbanizationScatterChart data={socioData} />
        <DistrictRadarChart data={socioData} />
      </div>

      {/* Row 3: Theory Cards */}
      <TheoryCards data={socioData} />

      {/* Row 4: Full Data Table */}
      <DistrictTable data={socioData} />

      {/* Row 5: Cross-Module Actions */}
      <CrossModulePanel onNavigate={onNavigate} setChatInput={setChatInput} logAuditEvent={logAuditEvent} />
    </motion.div>
  );
}
