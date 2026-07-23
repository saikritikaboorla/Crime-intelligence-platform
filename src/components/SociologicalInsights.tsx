import React, { useState } from "react";
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
  MessageSquare
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
  "Bengaluru City":               "#3b82f6",
  "Mysuru":                       "#10b981",
  "Mangaluru (Dakshina Kannada)": "#f59e0b",
  "Hubballi-Dharwad":             "#8b5cf6",
  "Belagavi":                     "#ec4899",
  "Kalaburagi":                   "#ef4444",
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

function AIInsightCard({ observation, trend, whyMatters, action, accentClass = "border-blue-500/25" }: InsightProps) {
  const [open, setOpen] = useState(true);
  return (
    <div className={`mt-4 rounded-xl border ${accentClass} bg-slate-950/60`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left group"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 text-caption font-semibold text-blue-300 uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          AI Insight
        </span>
        <span className="text-slate-500 text-micro group-hover:text-slate-300 transition">{open ? "▴ Hide" : "▾ Show Insight"}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-0.5">
            <div className="text-micro font-semibold text-slate-500 uppercase tracking-wider">Key Observation</div>
            <p className="text-body-sm text-slate-300 leading-relaxed">{observation}</p>
          </div>
          <div className="space-y-0.5">
            <div className="text-micro font-semibold text-slate-500 uppercase tracking-wider">Trend Summary</div>
            <p className="text-body-sm text-slate-300 leading-relaxed">{trend}</p>
          </div>
          <div className="space-y-0.5">
            <div className="text-micro font-semibold text-slate-500 uppercase tracking-wider">Why It Matters</div>
            <p className="text-body-sm text-slate-300 leading-relaxed">{whyMatters}</p>
          </div>
          <div className="space-y-0.5">
            <div className="text-micro font-semibold text-amber-500/80 uppercase tracking-wider">Suggested Action</div>
            <p className="text-body-sm text-amber-200/80 leading-relaxed">{action}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Custom Tooltip helpers ───────────────────────────────────────────────────
const TooltipBox = ({ children }: { children: React.ReactNode }) => (
  <div style={{
    background: "rgba(2,6,23,0.97)",
    border: "1px solid rgba(51,65,85,0.9)",
    borderRadius: 10,
    padding: "10px 14px",
    fontSize: 12,
    lineHeight: 1.6,
    minWidth: 180,
    boxShadow: "0 8px 32px rgba(0,0,0,0.5)"
  }}>
    {children}
  </div>
);

// ─── Chart 1: Socio-Economic Risk Indices ────────────────────────────────────
function SocioRiskChart({ data }: { data: SocioRow[] }) {
  const chartData = data.map(d => ({
    name: d.districtName.split(" ")[0], // short label
    fullName: d.districtName,
    "Urbanization %": d.urbanization,
    "Economic Stress %": d.stress,
    "Migration Rate %": d.migration,
    "Education Index %": d.education,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const row = data.find(d => d.districtName.startsWith(label));
    return (
      <TooltipBox>
        <p style={{ color: "#e2e8f0", fontWeight: 700, marginBottom: 6 }}>{row?.districtName ?? label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color, marginBottom: 2 }}>
            {p.name}: <span style={{ color: "#e2e8f0", fontWeight: 600 }}>{p.value}%</span>
          </p>
        ))}
        {row && (
          <p style={{ color: "#64748b", marginTop: 6, borderTop: "1px solid #1e293b", paddingTop: 6 }}>
            Density: {row.density.toLocaleString()} /km²
          </p>
        )}
      </TooltipBox>
    );
  };

  return (
    <div className="card rounded-2xl">
      <div className="h-0.5 rounded-t-2xl bg-gradient-to-r from-sky-500 to-blue-600 -mt-[1.375rem] mb-4 mx-[-1.5rem] rounded-tl-2xl rounded-tr-2xl" />
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-1">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-sky-500/15 border border-sky-500/25 flex items-center justify-center">
              <Activity className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <h3 className="text-heading3 text-slate-100">Socio-Economic Risk Indices</h3>
          </div>
          <p className="text-body-sm text-slate-500 ml-9">
            Urbanization, economic stress, migration and education levels across 6 Karnataka districts
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-72 w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }} barCategoryGap="25%">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.4)" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="#475569"
              tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 500 }}
              tickLine={false}
              axisLine={{ stroke: "rgba(51,65,85,0.5)" }}
            />
            <YAxis
              stroke="#475569"
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${v}%`}
              domain={[0, 100]}
              width={38}
              label={{ value: "Index (%)", angle: -90, position: "insideLeft", offset: 10, style: { fill: "#64748b", fontSize: 11 } }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(51,65,85,0.15)" }} />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
              iconType="square"
              iconSize={10}
              formatter={(v) => <span style={{ color: "#94a3b8" }}>{v}</span>}
            />
            <Bar dataKey="Urbanization %"     fill="#0ea5e9" radius={[3,3,0,0]} maxBarSize={18} />
            <Bar dataKey="Economic Stress %"  fill="#f59e0b" radius={[3,3,0,0]} maxBarSize={18} />
            <Bar dataKey="Migration Rate %"   fill="#8b5cf6" radius={[3,3,0,0]} maxBarSize={18} />
            <Bar dataKey="Education Index %"  fill="#10b981" radius={[3,3,0,0]} maxBarSize={18} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* AI Insight */}
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
  const chartData = data.map(d => ({
    name: d.districtName.split(" ")[0],
    fullName: d.districtName,
    "Property / Theft": d.propertyCrimes,
    "Violent / Assault": d.bodyCrimes,
    "Cyber Fraud":       d.cyberCrimes,
    "Narcotics":         d.drugCrimes,
    total:               d.totalCrimes,
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const row = data.find(d => d.districtName.startsWith(label));
    return (
      <TooltipBox>
        <p style={{ color: "#e2e8f0", fontWeight: 700, marginBottom: 6 }}>{row?.districtName ?? label}</p>
        {payload.map((p: any) => p.value > 0 && (
          <p key={p.name} style={{ color: p.fill, marginBottom: 2 }}>
            {p.name}: <span style={{ color: "#e2e8f0", fontWeight: 600 }}>{p.value} case{p.value !== 1 ? "s" : ""}</span>
          </p>
        ))}
        <p style={{ color: "#64748b", borderTop: "1px solid #1e293b", paddingTop: 6, marginTop: 6 }}>
          Total: <span style={{ color: "#fbbf24", fontWeight: 700 }}>{row?.totalCrimes ?? 0}</span>
        </p>
      </TooltipBox>
    );
  };

  return (
    <div className="card rounded-2xl">
      <div className="h-0.5 rounded-t-2xl bg-gradient-to-r from-rose-500 to-orange-600 -mt-[1.375rem] mb-4 mx-[-1.5rem] rounded-tl-2xl rounded-tr-2xl" />
      <div className="flex items-start justify-between gap-3 mb-1">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-rose-500/15 border border-rose-500/25 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <h3 className="text-heading3 text-slate-100">Crime Type Distribution by District</h3>
          </div>
          <p className="text-body-sm text-slate-500 ml-9">
            Stacked view of IPC crime head categories registered across all 6 districts
          </p>
        </div>
      </div>

      <div className="h-72 w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }} barCategoryGap="35%">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.4)" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="#475569"
              tick={{ fill: "#94a3b8", fontSize: 12, fontWeight: 500 }}
              tickLine={false}
              axisLine={{ stroke: "rgba(51,65,85,0.5)" }}
            />
            <YAxis
              stroke="#475569"
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              width={28}
              label={{ value: "Cases", angle: -90, position: "insideLeft", offset: 10, style: { fill: "#64748b", fontSize: 11 } }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(51,65,85,0.15)" }} />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
              iconType="square"
              iconSize={10}
              formatter={(v) => <span style={{ color: "#94a3b8" }}>{v}</span>}
            />
            <Bar dataKey="Property / Theft"  stackId="a" fill="#f59e0b" name="Property / Theft"  radius={[0,0,0,0]} />
            <Bar dataKey="Violent / Assault" stackId="a" fill="#ef4444" name="Violent / Assault" radius={[0,0,0,0]} />
            <Bar dataKey="Cyber Fraud"       stackId="a" fill="#8b5cf6" name="Cyber Fraud"       radius={[0,0,0,0]} />
            <Bar dataKey="Narcotics"         stackId="a" fill="#10b981" name="Narcotics"         radius={[3,3,0,0]} />
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

// ─── Chart 3: Urbanization × Crime Scatter ───────────────────────────────────
function UrbanizationScatterChart({ data }: { data: SocioRow[] }) {
  const chartData = data.map(d => ({
    urbanization: d.urbanization,
    totalCrimes:  d.totalCrimes,
    stress:       d.stress,
    districtName: d.districtName,
    shortName:    d.districtName.split(" ")[0],
    color:        DISTRICT_COLORS[d.districtName] ?? "#64748b",
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    if (!d) return null;
    return (
      <TooltipBox>
        <p style={{ color: d.color, fontWeight: 700, marginBottom: 6 }}>{d.districtName}</p>
        <p style={{ color: "#94a3b8" }}>Urbanization: <span style={{ color: "#e2e8f0", fontWeight: 600 }}>{d.urbanization}%</span></p>
        <p style={{ color: "#94a3b8" }}>Total FIR Cases: <span style={{ color: "#fbbf24", fontWeight: 600 }}>{d.totalCrimes}</span></p>
        <p style={{ color: "#94a3b8" }}>Economic Stress: <span style={{ color: "#f87171", fontWeight: 600 }}>{d.stress}%</span></p>
        <p style={{ color: "#64748b", fontSize: 11, marginTop: 4 }}>Dot size ∝ case count</p>
      </TooltipBox>
    );
  };

  return (
    <div className="card rounded-2xl">
      <div className="h-0.5 rounded-t-2xl bg-gradient-to-r from-emerald-500 to-teal-600 -mt-[1.375rem] mb-4 mx-[-1.5rem] rounded-tl-2xl rounded-tr-2xl" />
      <div className="flex items-start gap-3 mb-1">
        <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-heading3 text-slate-100">Urbanization vs. Total FIR Cases</h3>
          <p className="text-body-sm text-slate-500 mt-0.5">
            Each bubble = one district · Bubble size proportional to case count · Colour-coded by district
          </p>
        </div>
      </div>

      {/* District colour legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 mb-1 pl-9">
        {DISTRICT_KEYS.map(d => (
          <span key={d} className="flex items-center gap-1.5 text-micro text-slate-400">
            <span style={{ background: DISTRICT_COLORS[d], width: 8, height: 8, borderRadius: "50%", display: "inline-block" }} />
            {d.split(" ")[0]}
          </span>
        ))}
      </div>

      <div className="h-72 w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 16, right: 24, bottom: 40, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.4)" />
            <XAxis
              type="number"
              dataKey="urbanization"
              name="Urbanization"
              domain={[25, 100]}
              stroke="#475569"
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              tickLine={false}
              tickFormatter={v => `${v}%`}
              label={{ value: "Urbanization Index (%)", position: "insideBottom", offset: -12, fill: "#64748b", fontSize: 11 }}
            />
            <YAxis
              type="number"
              dataKey="totalCrimes"
              name="Total Cases"
              domain={[0, 5]}
              allowDecimals={false}
              stroke="#475569"
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={28}
              label={{ value: "FIR Cases", angle: -90, position: "insideLeft", offset: 8, fill: "#64748b", fontSize: 11 }}
            />
            <Tooltip content={<CustomTooltip />} cursor={false} />
            <Scatter
              name="Districts"
              data={chartData}
              shape={(props: any) => {
                const { cx, cy, payload } = props;
                const r = 12 + payload.totalCrimes * 6;
                return (
                  <g>
                    <circle cx={cx} cy={cy} r={r} fill={payload.color} fillOpacity={0.2} stroke={payload.color} strokeWidth={2} />
                    <circle cx={cx} cy={cy} r={4} fill={payload.color} />
                    <text x={cx} y={cy - r - 5} textAnchor="middle" fill="#e2e8f0" fontSize={10} fontWeight="600">
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

// ─── Chart 4: District Risk Radar ────────────────────────────────────────────
function DistrictRadarChart({ data }: { data: SocioRow[] }) {
  // Show top 3 most-at-risk districts side by side for clarity
  const radarMetrics = [
    { key: "urbanization",   label: "Urbanization" },
    { key: "stress",         label: "Econ. Stress" },
    { key: "migration",      label: "Migration" },
    { key: "crimeLoad",      label: "Crime Load" },
    { key: "eduInverse",     label: "Low Education" },
  ];

  const [selectedDistrict, setSelectedDistrict] = useState<string>(data[0]?.districtName ?? "");

  const enriched = data.map(d => ({
    ...d,
    crimeLoad:   Math.round((d.totalCrimes / 4) * 100), // normalise to 0-100 (max 4 cases)
    eduInverse:  100 - d.education,
  }));

  const radarData = radarMetrics.map(m => {
    const row: any = { metric: m.label };
    enriched.forEach(d => {
      row[d.districtName.split(" ")[0]] = (d as any)[m.key];
    });
    return row;
  });

  const selected = enriched.find(d => d.districtName === selectedDistrict);

  const singleRadarData = selected
    ? radarMetrics.map(m => ({
        metric:  m.label,
        value:   (selected as any)[m.key] as number,
        fullMark: 100,
      }))
    : [];

  const color = DISTRICT_COLORS[selectedDistrict] ?? "#3b82f6";

  return (
    <div className="card rounded-2xl">
      <div className="h-0.5 rounded-t-2xl bg-gradient-to-r from-indigo-500 to-purple-600 -mt-[1.375rem] mb-4 mx-[-1.5rem] rounded-tl-2xl rounded-tr-2xl" />
      <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center">
              <Target className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <h3 className="text-heading3 text-slate-100">District Risk Profile Radar</h3>
          </div>
          <p className="text-body-sm text-slate-500 ml-9">
            Multi-dimensional risk profile per district across 5 criminological indicators
          </p>
        </div>
        {/* District selector */}
        <div className="flex flex-wrap gap-1.5 ml-9">
          {data.map(d => {
            const short = d.districtName.split(" ")[0];
            const active = d.districtName === selectedDistrict;
            return (
              <button
                key={d.districtName}
                onClick={() => setSelectedDistrict(d.districtName)}
                className={`px-2.5 py-1 rounded-lg text-caption font-semibold border transition ${
                  active
                    ? "border-blue-500/50 text-blue-300 bg-blue-500/15"
                    : "border-slate-700/60 text-slate-500 hover:text-slate-300 hover:border-slate-600"
                }`}
              >
                {short}
              </button>
            );
          })}
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={singleRadarData} margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
            <PolarGrid stroke="rgba(51,65,85,0.5)" />
            <PolarAngleAxis
              dataKey="metric"
              tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 500 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: "#475569", fontSize: 9 }}
              tickCount={4}
              axisLine={false}
            />
            <Radar
              name={selected?.districtName ?? ""}
              dataKey="value"
              stroke={color}
              fill={color}
              fillOpacity={0.18}
              strokeWidth={2}
            />
            <Tooltip
              contentStyle={{
                background: "rgba(2,6,23,0.97)",
                border: "1px solid rgba(51,65,85,0.9)",
                borderRadius: 10,
                fontSize: 12,
              }}
              formatter={(v: any) => [`${v}`, ""]}
              labelFormatter={(l) => <span style={{ color: color, fontWeight: 700 }}>{l}</span>}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {selected && (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {radarMetrics.map(m => (
            <div key={m.key} className="text-center">
              <div className="text-body-sm font-bold" style={{ color }}>{(selected as any)[m.key]}</div>
              <div className="text-micro text-slate-500">{m.label}</div>
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
  const bengaluru  = data.find(d => d.districtName === "Bengaluru City");
  const kalaburagi = data.find(d => d.districtName === "Kalaburagi");
  const mangaluru  = data.find(d => d.districtName.startsWith("Mangaluru"));

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Social Disorganization */}
      <div className="rounded-xl border border-rose-500/20 bg-gradient-to-br from-rose-950/25 to-slate-950/60 p-5">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-rose-500/15 border border-rose-500/25 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div>
            <div className="text-micro font-semibold text-rose-400/80 uppercase tracking-wider mb-1">Social Disorganization Theory</div>
            <h4 className="text-body font-bold text-rose-300 mb-2">Bengaluru: Urban Density Driver</h4>
            <p className="text-body-sm text-slate-300 leading-relaxed">
              With urbanization at <span className="font-semibold text-sky-400">{bengaluru?.urbanization ?? 92}%</span> and
              population density of <span className="font-semibold text-sky-400">{bengaluru?.density?.toLocaleString() ?? "4,380"}/km²</span>,
              Bengaluru's rapid growth outpaces social cohesion — directly increasing property crime and cyber fraud opportunity.
            </p>
          </div>
        </div>
      </div>

      {/* Strain Theory */}
      <div className="rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-950/25 to-slate-950/60 p-5">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/25 flex items-center justify-center shrink-0 mt-0.5">
            <BookOpen className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="text-micro font-semibold text-amber-400/80 uppercase tracking-wider mb-1">Strain Theory (Merton)</div>
            <h4 className="text-body font-bold text-amber-300 mb-2">Kalaburagi: Blocked Opportunities</h4>
            <p className="text-body-sm text-slate-300 leading-relaxed">
              Economic stress at <span className="font-semibold text-amber-400">{kalaburagi?.stress ?? 68}%</span> with
              education at only <span className="font-semibold text-amber-400">{kalaburagi?.education ?? 65}%</span> —
              the classic Mertonian condition. Inability to achieve socially approved goals through legitimate means drives
              violent crime escalation, as confirmed by the assault case (FIR-202600008).
            </p>
          </div>
        </div>
      </div>

      {/* Protective Factor */}
      <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/25 to-slate-950/60 p-5">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shrink-0 mt-0.5">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="text-micro font-semibold text-emerald-400/80 uppercase tracking-wider mb-1">Protective Factor Analysis</div>
            <h4 className="text-body font-bold text-emerald-300 mb-2">Mangaluru: Education as Buffer</h4>
            <p className="text-body-sm text-slate-300 leading-relaxed">
              Education index of <span className="font-semibold text-emerald-400">{mangaluru?.education ?? 91}%</span> —
              Karnataka's highest — acts as a crime suppressor despite moderate urbanization
              (<span className="font-semibold text-emerald-400">{mangaluru?.urbanization ?? 72}%</span>).
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
    <div className="card rounded-2xl overflow-hidden p-0" style={{padding: 0}}>
      <div className="px-5 py-4 border-b border-slate-800/60">
        <div className="flex items-center gap-2">
          <Shield className="w-4.5 h-4.5 text-slate-400" />
          <h3 className="text-heading3 text-slate-100">District Intelligence Summary</h3>
        </div>
        <p className="text-body-sm text-slate-500 mt-1">Full socio-economic and crime data for all 6 Karnataka districts — sourced directly from the FIR ER Dataset</p>
      </div>
      <div className="overflow-x-auto">
        <table className="table-enterprise w-full">
          <thead>
            <tr>
              <th className="text-left">District</th>
              <th className="text-center">Urban %</th>
              <th className="text-center">Migration %</th>
              <th className="text-center">Econ. Stress %</th>
              <th className="text-center">Education %</th>
              <th className="text-center">Density /km²</th>
              <th className="text-center text-amber-400/80">Property</th>
              <th className="text-center text-rose-400/80">Violent</th>
              <th className="text-center text-purple-400/80">Cyber</th>
              <th className="text-center text-emerald-400/80">Narcotics</th>
              <th className="text-center font-bold text-slate-200">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d, i) => (
              <tr key={i}>
                <td>
                  <div className="flex items-center gap-2">
                    <span style={{ background: DISTRICT_COLORS[d.districtName] ?? "#64748b", width: 8, height: 8, borderRadius: "50%", display: "inline-block", flexShrink: 0 }} />
                    <span className="font-semibold text-slate-200">{d.districtName}</span>
                  </div>
                </td>
                <td className="text-center text-sky-400 font-medium">{d.urbanization}%</td>
                <td className="text-center text-purple-400 font-medium">{d.migration}%</td>
                <td className="text-center">
                  <span className={`badge ${d.stress >= 60 ? "badge-red" : d.stress >= 40 ? "badge-amber" : "badge-green"}`}>
                    {d.stress}%
                  </span>
                </td>
                <td className="text-center text-emerald-400 font-medium">{d.education}%</td>
                <td className="text-center text-slate-400 font-mono text-caption">{d.density.toLocaleString()}</td>
                <td className="text-center text-amber-400 font-semibold">{d.propertyCrimes}</td>
                <td className="text-center text-rose-400 font-semibold">{d.bodyCrimes}</td>
                <td className="text-center text-purple-400 font-semibold">{d.cyberCrimes}</td>
                <td className="text-center text-emerald-400 font-semibold">{d.drugCrimes}</td>
                <td className="text-center">
                  <span className="badge badge-blue font-bold">{d.totalCrimes}</span>
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
      label: "View Crime Hotspots",
      desc: "Spatial velocity map",
      tab: "hotspots",
      color: "text-blue-300",
      border: "border-blue-500/25",
      bg: "bg-blue-500/8",
    },
    {
      label: "Ask AI for Deep Analysis",
      desc: "Economic stress vs. crime",
      tab: "conversational",
      color: "text-purple-300",
      border: "border-purple-500/25",
      bg: "bg-purple-500/8",
      prefill: "Explain the relationship between economic stress and violent crime in Kalaburagi district",
    },
    {
      label: "Check Risk Predictions",
      desc: "Early warning alarms",
      tab: "forecasting",
      color: "text-amber-300",
      border: "border-amber-500/25",
      bg: "bg-amber-500/8",
    },
    {
      label: "View Offender Profiles",
      desc: "MO & recidivism risk",
      tab: "profiling",
      color: "text-emerald-300",
      border: "border-emerald-500/25",
      bg: "bg-emerald-500/8",
    },
  ];

  return (
    <div className="card rounded-2xl" style={{borderColor: 'rgba(14,165,233,0.12)'}}>
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-4.5 h-4.5 text-sky-400" />
        <h3 className="text-heading3 text-slate-200">Recommended Investigative Actions</h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {actions.map(a => (
          <button
            key={a.tab}
            onClick={() => {
              if (a.prefill) setChatInput(a.prefill);
              onNavigate(a.tab);
              logAuditEvent("Cross Link", `Sociological → ${a.tab}`);
            }}
            className={`group flex flex-col gap-1 p-3.5 rounded-xl border ${a.border} hover:border-opacity-70 transition text-left`}
          >
            <span className={`text-body-sm font-semibold ${a.color}`}>{a.label}</span>
            <span className="text-caption text-slate-500">{a.desc}</span>
            <ArrowRight className={`w-3.5 h-3.5 ${a.color} mt-1 opacity-0 group-hover:opacity-100 transition-opacity`} />
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
      className="flex flex-col gap-6 overflow-y-auto h-full pr-1"
      style={{ scrollbarWidth: "thin", scrollbarColor: "#334155 transparent" }}
    >
      {/* Page header */}
      <div className="section-header">
        <div>
          <h2 className="section-title">
            <Activity className="w-5 h-5 text-sky-400" />
            Sociological Crime Insights & Correlations
          </h2>
          <p className="section-subtitle mt-1">
            Data-grounded analysis of urbanization, economic stress, migration, and education indices across 6 Karnataka districts — derived exclusively from the KSP FIR ER Dataset
          </p>
        </div>
        <span className="badge badge-blue shrink-0">6 Districts · 8 FIRs</span>
      </div>

      {/* Row 1: Socio-Economic Indices + Crime Distribution */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <SocioRiskChart data={socioData} />
        <CrimeDistributionChart data={socioData} />
      </div>

      {/* Row 2: Scatter + Radar */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <UrbanizationScatterChart data={socioData} />
        <DistrictRadarChart data={socioData} />
      </div>

      {/* Row 3: Theory cards */}
      <TheoryCards data={socioData} />

      {/* Row 4: Full data table */}
      <DistrictTable data={socioData} />

      {/* Row 5: Cross-module actions */}
      <CrossModulePanel onNavigate={onNavigate} setChatInput={setChatInput} logAuditEvent={logAuditEvent} />
    </motion.div>
  );
}
