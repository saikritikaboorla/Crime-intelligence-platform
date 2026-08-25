import React, { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import { motion } from "motion/react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ScatterChart, Scatter,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  Cell, PieChart, Pie
} from "recharts";
import {
  Activity, TrendingUp, Sparkles, AlertTriangle, CheckCircle,
  ArrowRight, BookOpen, Target, Lightbulb, Shield,
  ChevronDown, ChevronUp, Users, UserX, User
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

interface DemoData {
  accused: {
    totalRows: number;
    gender: { Male: number; Female: number };
    ageBands: Record<string, number>;
    ageCrimeMatrix: Record<string, Record<string, number>>;
  };
  victims: {
    totalWithAge: number;
    gender: { Male: number; Female: number };
    ageBands: Record<string, number>;
  };
  complainants: {
    total: number;
    occupationGroups: Record<string, number>;
  };
}

interface Props {
  socioData: SocioRow[];
  onNavigate: (tab: string) => void;
  setChatInput: (v: string) => void;
  logAuditEvent: (action: string, detail: string) => void;
}

// ─── District colour palette (active-case districts) ─────────────────────────
const DISTRICT_COLORS: Record<string, string> = {
  "Bengaluru City":               "#38bdf8",
  "Mysuru":                       "#34d399",
  "Mangaluru (Dakshina Kannada)": "#fbbf24",
  "Hubballi-Dharwad":             "#a78bfa",
  "Belagavi":                     "#f472b6",
  "Kalaburagi":                   "#f87171",
};

// ─── AI Insight Card (collapsible, always-visible key finding) ────────────────
interface InsightProps {
  keyFinding: string;
  observation: string;
  whyMatters: string;
  action: string;
  accentClass?: string;
}

function AIInsightCard({ keyFinding, observation, whyMatters, action, accentClass = "border-sky-500/25" }: InsightProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`mt-4 rounded-xl border ${accentClass} bg-slate-950/70 border-l-4 shadow-lg`}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-start justify-between px-4 py-3 text-left group gap-3"
        aria-expanded={open}
      >
        <div className="flex items-start gap-2 min-w-0">
          <Sparkles className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <span className="text-xs font-bold text-sky-300 uppercase tracking-wider block mb-0.5">AI Sociological Analysis</span>
            <span className="text-xs text-slate-300 leading-relaxed">{keyFinding}</span>
          </div>
        </div>
        <span className="text-slate-500 shrink-0 mt-0.5 group-hover:text-slate-300 transition">
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>
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

// ─── Tooltip box ──────────────────────────────────────────────────────────────
const TooltipBox = ({ children }: { children: React.ReactNode }) => (
  <div style={{
    background: "rgba(2,6,23,0.98)", border: "1px solid rgba(51,65,85,0.9)",
    borderRadius: 10, padding: "12px 16px", fontSize: 13, lineHeight: 1.6,
    minWidth: 210, boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
  }}>
    {children}
  </div>
);

// ─── 1. KEY SOCIOLOGICAL INDICATORS (KPI bar) ─────────────────────────────────
function StatewideKpiBar({ data, demo }: { data: SocioRow[]; demo: DemoData | null }) {
  // Only the 6 districts that have FIR cases
  const active = data.filter(d => d.totalCrimes > 0);
  if (!active.length) return null;

  const avgUrban  = (active.reduce((s,d) => s + d.urbanization, 0) / active.length).toFixed(1);
  const avgStress = (active.reduce((s,d) => s + d.stress,       0) / active.length).toFixed(1);
  const avgEdu    = (active.reduce((s,d) => s + d.education,    0) / active.length).toFixed(1);
  const totalFIRs = active.reduce((s,d) => s + d.totalCrimes, 0);
  const totalWomen = active.reduce((s,d) => s + d.womenCrimes, 0);
  const pctHeinous = demo ? "55%" : "—"; // 22/40 cases = 55% heinous from CaseMaster.csv

  const kpis = [
    { label: "Avg Urbanization",   value: `${avgUrban}%`, sub: "Active districts (District.csv)",      icon: <Activity className="w-4 h-4 text-sky-400" />,     color: "border-sky-500/25 bg-sky-500/5",     val: "text-sky-300"     },
    { label: "Avg Economic Stress",value: `${avgStress}%`,sub: "Kalaburagi highest at 68%",             icon: <AlertTriangle className="w-4 h-4 text-rose-400" />, color: "border-rose-500/25 bg-rose-500/5",   val: "text-rose-300"    },
    { label: "Avg Education Index",value: `${avgEdu}%`,   sub: "Mangaluru leads at 91%",               icon: <CheckCircle className="w-4 h-4 text-emerald-400" />,color: "border-emerald-500/25 bg-emerald-500/5",val:"text-emerald-300"},
    { label: "Total FIR Cases",    value: `${totalFIRs}`, sub: "Across 6 Karnataka districts",         icon: <Shield className="w-4 h-4 text-amber-400" />,      color: "border-amber-500/25 bg-amber-500/5", val: "text-amber-300"   },
    { label: "Women/Domestic FIRs",value: `${totalWomen}`,sub: "Crimes Against Women (CrimeMajorHead=5)",icon:<Users className="w-4 h-4 text-pink-400" />,        color: "border-pink-500/25 bg-pink-500/5",   val: "text-pink-300"    },
    { label: "Heinous Offences",   value: pctHeinous,     sub: "22 of 40 cases (GravityOffenceID=1)",  icon: <AlertTriangle className="w-4 h-4 text-orange-400" />,color:"border-orange-500/25 bg-orange-500/5",val:"text-orange-300"  },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {kpis.map((k, i) => (
        <div key={i} className={`rounded-xl border p-4 space-y-1.5 ${k.color}`}>
          <div className="flex items-center justify-between gap-1">
            <span className="text-xs uppercase tracking-wider font-bold text-slate-400 leading-tight">{k.label}</span>
            <div className="shrink-0">{k.icon}</div>
          </div>
          <div className={`text-2xl font-extrabold tabular-nums ${k.val}`}>{k.value}</div>
          <p className="text-xs text-slate-500 leading-snug">{k.sub}</p>
        </div>
      ))}
    </div>
  );
}

// ─── 2. MAIN SOCIO-ECONOMIC CHART (preserved, full-width) ─────────────────────
function SocioRiskChart({ data }: { data: SocioRow[] }) {
  // Only districts with FIR cases for the comparison
  const active = data.filter(d => d.totalCrimes > 0);
  const [selected, setSelected] = useState<SocioRow | null>(null);

  const chartData = active.map(d => ({
    name: d.districtName === "Mangaluru (Dakshina Kannada)" ? "Mangaluru" : d.districtName.split(" ")[0],
    fullName: d.districtName,
    "Urbanization %":    d.urbanization,
    "Economic Stress %": d.stress,
    "Migration Rate %":  d.migration,
    "Education Index %": d.education,
  }));

  const CustomTooltip = ({ active: a, payload, label }: any) => {
    if (!a || !payload?.length) return null;
    const row = active.find(d => d.districtName.startsWith(label) || d.districtName === "Mangaluru (Dakshina Kannada)" && label === "Mangaluru");
    return (
      <TooltipBox>
        <p style={{ color: "#f8fafc", fontWeight: 700, marginBottom: 8, fontSize: 14 }}>{row?.districtName ?? label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color, marginBottom: 3, fontSize: 12.5 }}>
            {p.name}: <span style={{ color: "#f8fafc", fontWeight: 700 }}>{p.value}%</span>
          </p>
        ))}
        {row && <p style={{ color: "#94a3b8", marginTop: 8, borderTop: "1px solid #1e293b", paddingTop: 6, fontSize: 11.5 }}>
          Density: {row.density.toLocaleString()}/km² · Total FIRs: <strong style={{ color: "#fbbf24" }}>{row.totalCrimes}</strong> · Click to pin
        </p>}
      </TooltipBox>
    );
  };

  return (
    <div className="bg-slate-950/80 border border-slate-800 p-6 rounded-2xl space-y-5 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-3 mb-1.5">
            <div className="w-9 h-9 rounded-lg bg-sky-500/15 border border-sky-500/25 flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5 text-sky-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-100">Socio-Economic Risk Indices by District</h3>
          </div>
          <p className="text-sm text-slate-400 ml-12">
            Urbanization, economic stress, migration and education across 6 Karnataka districts (District.csv).
            Hover for values · Click a group to pin district detail.
          </p>
        </div>
        {selected && (
          <button onClick={() => setSelected(null)}
            className="text-xs text-slate-500 hover:text-slate-300 border border-slate-700 rounded-lg px-3 py-1.5 shrink-0 transition">
            Clear ×
          </button>
        )}
      </div>

      <div className="h-[480px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 20, bottom: 50, left: 20 }}
            barCategoryGap="22%" barGap={3}
            onClick={(bd: any) => {
              if (!bd?.activePayload?.length) return;
              const fn = bd.activePayload[0]?.payload?.fullName;
              setSelected(active.find(d => d.districtName === fn) ?? null);
            }}
            style={{ cursor: "pointer" }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="name" stroke="#475569" tick={{ fill: "#cbd5e1", fontSize: 13, fontWeight: 700 }}
              tickLine={false} axisLine={{ stroke: "#334155" }}
              label={{ value: "Karnataka Districts (6 with FIR cases)", position: "insideBottom", offset: -30,
                style: { fill: "#94a3b8", fontSize: 12, fontWeight: 600 } }} />
            <YAxis stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 12 }} tickLine={false} axisLine={false}
              tickFormatter={v => `${v}%`} domain={[0, 100]} width={48}
              label={{ value: "Index (%)", angle: -90, position: "insideLeft", offset: 14,
                style: { fill: "#94a3b8", fontSize: 12, fontWeight: 600 } }} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(51,65,85,0.15)" }} />
            <Legend wrapperStyle={{ fontSize: 13, paddingTop: 16 }} iconType="square" iconSize={13}
              formatter={v => <span style={{ color: "#cbd5e1", fontWeight: 600 }}>{v}</span>} />
            <Bar dataKey="Urbanization %"    fill="#38bdf8" radius={[4,4,0,0]} maxBarSize={28} />
            <Bar dataKey="Economic Stress %" fill="#f87171" radius={[4,4,0,0]} maxBarSize={28} />
            <Bar dataKey="Migration Rate %"  fill="#c084fc" radius={[4,4,0,0]} maxBarSize={28} />
            <Bar dataKey="Education Index %" fill="#34d399" radius={[4,4,0,0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {selected && (
        <div className="rounded-xl border bg-slate-900/80 p-4"
          style={{ borderLeftColor: DISTRICT_COLORS[selected.districtName] ?? "#38bdf8", borderLeftWidth: 4, borderColor: "rgba(51,65,85,0.6)" }}>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-3 h-3 rounded-full shrink-0" style={{ background: DISTRICT_COLORS[selected.districtName] ?? "#38bdf8" }} />
            <span className="font-bold text-slate-100 text-sm">{selected.districtName} — Full Profile</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-6 gap-2 text-xs">
            {[
              { label: "Urbanization",   value: `${selected.urbanization}%`,               color: "#38bdf8" },
              { label: "Econ. Stress",   value: `${selected.stress}%`,                     color: "#f87171" },
              { label: "Migration",      value: `${selected.migration}%`,                  color: "#c084fc" },
              { label: "Education",      value: `${selected.education}%`,                  color: "#34d399" },
              { label: "Pop. Density",   value: `${selected.density.toLocaleString()}/km²`,color: "#94a3b8" },
              { label: "Total FIRs",     value: `${selected.totalCrimes}`,                 color: "#fbbf24" },
              { label: "Property",       value: `${selected.propertyCrimes}`,              color: "#f59e0b" },
              { label: "Violent",        value: `${selected.bodyCrimes}`,                  color: "#ef4444" },
              { label: "Cyber",          value: `${selected.cyberCrimes}`,                 color: "#a78bfa" },
              { label: "Narcotics",      value: `${selected.drugCrimes}`,                  color: "#34d399" },
              { label: "Women/Domestic", value: `${selected.womenCrimes}`,                 color: "#f472b6" },
            ].map(item => (
              <div key={item.label} className="bg-slate-950/60 rounded-lg p-2 text-center border border-slate-800">
                <div className="font-extrabold text-sm" style={{ color: item.color }}>{item.value}</div>
                <div className="text-slate-500 mt-0.5">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <AIInsightCard
        accentClass="border-sky-500/20"
        keyFinding="Bengaluru leads on urbanization (92%) while Kalaburagi has the highest economic stress (68%) and lowest education (65%) — opposite ends of Karnataka's socio-economic range."
        observation="The 6 districts with FIR cases span the full socio-economic spectrum. Bengaluru City (urban=92%, stress=25%) and Kalaburagi (urban=35%, stress=68%) represent contrasting structural conditions that are associated with different crime-type profiles."
        whyMatters="High economic stress is associated with elevated violent and property crime rates. Low education levels coincide with reduced awareness of legal rights and support systems, potentially increasing both victimisation and offending risk."
        action="Prioritise community policing and economic intervention in Kalaburagi and Belagavi. Deploy cyber-awareness programs in Bengaluru and Mangaluru where high urbanization coincides with cyber/financial crime concentration."
      />
    </div>
  );
}

// ─── 3. DEMOGRAPHIC CRIME PATTERNS ───────────────────────────────────────────
// Source: Accused.csv (60 rows), Victim.csv (50 rows), ComplainantDetails.csv (40 rows)
// NOTE: Accused.csv has AgeYear and GenderID only — no occupation/caste/religion.
// ComplainantDetails.csv has OccupationID — used for socio-economic background proxy.

type DemoTab = "accused" | "victims" | "complainants";

const ACCUSED_AGE_ORDER  = ["18–24", "25–30", "31–40", "41–50", "51+"];
const VICTIM_AGE_ORDER   = ["<18", "18–30", "31–45", "46–60", "61+"];
const AGE_COLORS         = ["#38bdf8", "#34d399", "#fbbf24", "#f87171", "#c084fc"];
const OCC_COLORS         = ["#38bdf8","#34d399","#fbbf24","#f87171","#c084fc","#fb923c","#a78bfa"];

function DemographicCrimeSection({ demo }: { demo: DemoData | null }) {
  const [tab, setTab] = useState<DemoTab>("accused");

  if (!demo) {
    return (
      <div className="bg-slate-950/80 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <p className="text-slate-500 text-sm">Loading demographic data…</p>
      </div>
    );
  }

  // ── Accused age chart data ──
  const accAgeData = ACCUSED_AGE_ORDER.map(band => ({
    band,
    count: demo.accused.ageBands[band] ?? 0,
  }));

  // ── Accused age × crime type (top crime types only to avoid clutter) ──
  // Flatten matrix: rows = age bands, cols = top crime types
  const allCrimes = new Set<string>();
  ACCUSED_AGE_ORDER.forEach(b => Object.keys(demo.accused.ageCrimeMatrix[b] ?? {}).forEach(c => allCrimes.add(c)));
  // Sort crime types by total count, take top 5
  const crimesByTotal = [...allCrimes].map(c => ({
    name: c,
    total: ACCUSED_AGE_ORDER.reduce((s, b) => s + (demo.accused.ageCrimeMatrix[b]?.[c] ?? 0), 0),
  })).sort((a, b) => b.total - a.total).slice(0, 5);
  const topCrimes = crimesByTotal.map(c => c.name);
  const CRIME_COLORS: Record<string, string> = {
    "Against Property": "#f59e0b", "Narcotics": "#34d399", "Cyber/Financial": "#c084fc",
    "Against Body": "#ef4444", "Against Women": "#f472b6", "Public Order": "#fb923c",
    "Corruption": "#38bdf8", "SC/ST": "#fbbf24", "Against Children": "#a78bfa", "Road": "#64748b",
  };
  const crimeByAgeData = ACCUSED_AGE_ORDER.map(band => {
    const row: Record<string, any> = { band };
    topCrimes.forEach(c => { row[c] = demo.accused.ageCrimeMatrix[band]?.[c] ?? 0; });
    return row;
  });

  // ── Victim age chart data ──
  const vicAgeData = VICTIM_AGE_ORDER.map((band, i) => ({
    band,
    count: demo.victims.ageBands[band] ?? 0,
    fill: AGE_COLORS[i],
  }));

  // ── Complainant occupation ──
  const occData = Object.entries(demo.complainants.occupationGroups)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count], i) => ({ name, count, fill: OCC_COLORS[i % OCC_COLORS.length] }));
  const occTotal = occData.reduce((s, d) => s + d.count, 0);

  const AccusedAgeTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <TooltipBox>
        <p style={{ color: "#f8fafc", fontWeight: 700, marginBottom: 6, fontSize: 14 }}>Age Band: {label}</p>
        <p style={{ color: "#94a3b8", fontSize: 12.5 }}>Accused appearances: <span style={{ color: "#38bdf8", fontWeight: 700 }}>{payload[0]?.value}</span></p>
        <p style={{ color: "#64748b", fontSize: 11, marginTop: 4 }}>Source: Accused.csv (all 60 rows)</p>
      </TooltipBox>
    );
  };

  const CrimeAgeTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <TooltipBox>
        <p style={{ color: "#f8fafc", fontWeight: 700, marginBottom: 6, fontSize: 14 }}>Age Band: {label}</p>
        {payload.map((p: any) => p.value > 0 && (
          <p key={p.dataKey} style={{ color: p.fill ?? p.color, marginBottom: 3, fontSize: 12.5 }}>
            {p.dataKey}: <span style={{ color: "#f8fafc", fontWeight: 700 }}>{p.value}</span>
          </p>
        ))}
        <p style={{ color: "#64748b", fontSize: 11, marginTop: 4 }}>Source: Accused.csv × CaseMaster.csv</p>
      </TooltipBox>
    );
  };

  const VicAgeTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <TooltipBox>
        <p style={{ color: "#f8fafc", fontWeight: 700, marginBottom: 6, fontSize: 14 }}>Age Band: {label}</p>
        <p style={{ color: "#94a3b8", fontSize: 12.5 }}>Victims: <span style={{ color: "#fbbf24", fontWeight: 700 }}>{payload[0]?.value}</span></p>
        <p style={{ color: "#64748b", fontSize: 11, marginTop: 4 }}>Source: Victim.csv (excludes AgeYear=0 placeholders)</p>
      </TooltipBox>
    );
  };

  const OccTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    const pct = occTotal > 0 ? ((payload[0]?.value / occTotal) * 100).toFixed(0) : 0;
    return (
      <TooltipBox>
        <p style={{ color: "#f8fafc", fontWeight: 700, marginBottom: 6, fontSize: 14 }}>{label}</p>
        <p style={{ color: "#94a3b8", fontSize: 12.5 }}>Complainants: <span style={{ color: "#fbbf24", fontWeight: 700 }}>{payload[0]?.value}</span> ({pct}%)</p>
        <p style={{ color: "#64748b", fontSize: 11, marginTop: 4 }}>Source: ComplainantDetails.csv × OccupationMaster.csv</p>
      </TooltipBox>
    );
  };

  const tabs: { id: DemoTab; label: string; desc: string }[] = [
    { id: "accused",      label: "Accused Profile",       desc: "Age & crime type (Accused.csv, 60 rows)" },
    { id: "victims",      label: "Victim Profile",        desc: "Age bands & gender (Victim.csv)" },
    { id: "complainants", label: "Complainant Background",desc: "Occupation groups (ComplainantDetails.csv)" },
  ];

  return (
    <div className="bg-slate-950/80 border border-slate-800 p-6 rounded-2xl space-y-5 shadow-xl">
      {/* Header */}
      <div className="border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3 mb-1.5">
          <div className="w-9 h-9 rounded-lg bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-indigo-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-100">Demographic Crime Patterns</h3>
        </div>
        <p className="text-sm text-slate-400 ml-12">
          Age, gender and socio-economic background of accused, victims and complainants — sourced directly from CSV records.
        </p>
      </div>

      {/* Tab selector */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
              tab === t.id
                ? "bg-indigo-500/20 border-indigo-500/50 text-indigo-300"
                : "bg-slate-900/60 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600"
            }`}>
            {t.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-slate-500">{tabs.find(t => t.id === tab)?.desc}</p>

      {/* ── Tab: Accused ── */}
      {tab === "accused" && (
        <div className="space-y-6">
          {/* Gender summary */}
          <div className="flex items-center gap-6 bg-slate-900/60 border border-slate-800 rounded-xl px-5 py-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-sky-400" />
              <span className="text-sm text-slate-300">Male accused:</span>
              <span className="text-lg font-extrabold text-sky-300">{demo.accused.gender.Male}</span>
              <span className="text-xs text-slate-500">({((demo.accused.gender.Male / demo.accused.totalRows) * 100).toFixed(0)}%)</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-pink-400" />
              <span className="text-sm text-slate-300">Female accused:</span>
              <span className="text-lg font-extrabold text-pink-300">{demo.accused.gender.Female}</span>
              <span className="text-xs text-slate-500">({((demo.accused.gender.Female / demo.accused.totalRows) * 100).toFixed(0)}%)</span>
            </div>
            <span className="text-xs text-slate-600 ml-auto">Source: Accused.csv, GenderID column</span>
          </div>

          {/* Age band bar */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Accused by Age Band (all 60 appearances)</p>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={accAgeData} margin={{ top: 5, right: 20, bottom: 30, left: 10 }} barCategoryGap="35%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="band" tick={{ fill: "#cbd5e1", fontSize: 13, fontWeight: 700 }} tickLine={false} axisLine={{ stroke: "#334155" }}
                    label={{ value: "Age Band (Accused.csv)", position: "insideBottom", offset: -18, style: { fill: "#94a3b8", fontSize: 11 } }} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} tickLine={false} axisLine={false} allowDecimals={false} width={32}
                    label={{ value: "Count", angle: -90, position: "insideLeft", offset: 12, style: { fill: "#94a3b8", fontSize: 11 } }} />
                  <Tooltip content={<AccusedAgeTooltip />} cursor={{ fill: "rgba(51,65,85,0.15)" }} />
                  <Bar dataKey="count" radius={[5,5,0,0]}>
                    {accAgeData.map((_, i) => <Cell key={i} fill={AGE_COLORS[i]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Age × crime type stacked */}
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Age Band × Crime Type (top 5 crime heads)</p>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={crimeByAgeData} margin={{ top: 5, right: 20, bottom: 30, left: 10 }} barCategoryGap="35%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="band" tick={{ fill: "#cbd5e1", fontSize: 13, fontWeight: 700 }} tickLine={false} axisLine={{ stroke: "#334155" }}
                    label={{ value: "Age Band — Accused.csv × CaseMaster.csv", position: "insideBottom", offset: -18, style: { fill: "#94a3b8", fontSize: 11 } }} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} tickLine={false} axisLine={false} allowDecimals={false} width={32}
                    label={{ value: "Appearances", angle: -90, position: "insideLeft", offset: 12, style: { fill: "#94a3b8", fontSize: 11 } }} />
                  <Tooltip content={<CrimeAgeTooltip />} cursor={{ fill: "rgba(51,65,85,0.15)" }} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} iconType="square" iconSize={12}
                    formatter={v => <span style={{ color: "#cbd5e1" }}>{v}</span>} />
                  {topCrimes.map(c => (
                    <Bar key={c} dataKey={c} stackId="a" fill={CRIME_COLORS[c] ?? "#64748b"} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-slate-600 mt-2">Note: counts reflect accused appearances per case, not unique individuals.</p>
          </div>

          <AIInsightCard
            accentClass="border-indigo-500/20"
            keyFinding="25–30 is the peak accused age band (30 of 60 appearances, 50%). Property crime dominates this group — associated with economic opportunity-seeking behaviour."
            observation="The 25–30 age band accounts for 50% of all accused appearances in the dataset. This group is disproportionately represented in property crime (Against Property: 15 appearances) and narcotics (6). The 31–40 band shows a shift toward public order and organised crime."
            whyMatters="Age-concentrated crime patterns help direct intervention. Young adults (18–30) appearing predominantly in property and narcotics cases suggests different intervention strategies than the 31–40 cohort seen in organised and cyber crime."
            action="Focus youth crime-prevention programs on the 20–30 age group in high-stress districts. Target organised-crime disruption efforts at the 31–40 cohort in Kalaburagi and Bengaluru City."
          />
        </div>
      )}

      {/* ── Tab: Victims ── */}
      {tab === "victims" && (
        <div className="space-y-6">
          <div className="flex items-center gap-6 bg-slate-900/60 border border-slate-800 rounded-xl px-5 py-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-sky-400" />
              <span className="text-sm text-slate-300">Male victims:</span>
              <span className="text-lg font-extrabold text-sky-300">{demo.victims.gender.Male}</span>
              <span className="text-xs text-slate-500">({((demo.victims.gender.Male / demo.victims.totalWithAge) * 100).toFixed(0)}%)</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-pink-400" />
              <span className="text-sm text-slate-300">Female victims:</span>
              <span className="text-lg font-extrabold text-pink-300">{demo.victims.gender.Female}</span>
              <span className="text-xs text-slate-500">({((demo.victims.gender.Female / demo.victims.totalWithAge) * 100).toFixed(0)}%)</span>
            </div>
            <span className="text-xs text-slate-600 ml-auto">Source: Victim.csv (n={demo.victims.totalWithAge} with age data)</span>
          </div>

          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Victim Age Distribution (Victim.csv)</p>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vicAgeData} margin={{ top: 5, right: 20, bottom: 30, left: 10 }} barCategoryGap="35%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="band" tick={{ fill: "#cbd5e1", fontSize: 13, fontWeight: 700 }} tickLine={false} axisLine={{ stroke: "#334155" }}
                    label={{ value: "Age Band (Victim.csv, AgeYear > 0)", position: "insideBottom", offset: -18, style: { fill: "#94a3b8", fontSize: 11 } }} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} tickLine={false} axisLine={false} allowDecimals={false} width={32}
                    label={{ value: "Count", angle: -90, position: "insideLeft", offset: 12, style: { fill: "#94a3b8", fontSize: 11 } }} />
                  <Tooltip content={<VicAgeTooltip />} cursor={{ fill: "rgba(51,65,85,0.15)" }} />
                  <Bar dataKey="count" radius={[5,5,0,0]}>
                    {vicAgeData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-slate-600 mt-2">5 victims have AgeYear=0 (institutional/societal victims e.g. "Society", "State") — excluded from age analysis.</p>
          </div>

          <AIInsightCard
            accentClass="border-rose-500/20"
            keyFinding="Victims are predominantly aged 31–45 (38%), but 2 underage victims (<18) and 2 elderly victims (61+) signal vulnerability at the age extremes."
            observation="The 31–45 age band has the most victims (17 of 45 with age data, 38%). Female victims (15, 33%) are concentrated in domestic violence, dowry harassment and molestation cases. Two underage victims appear in POCSO (age 8 and 13)."
            whyMatters="Victim age and gender patterns help prioritise protective services. Female and underage victims in women/children crime categories require specialised investigative approaches and support resources."
            action="Ensure dedicated women and child protection investigators are assigned to districts with women/domestic FIRs. Review elderly victim cases (61+) for financial fraud and exploitation patterns."
          />
        </div>
      )}

      {/* ── Tab: Complainants ── */}
      {tab === "complainants" && (
        <div className="space-y-6">
          <p className="text-xs text-slate-400">
            Complainant occupation from <strong className="text-slate-300">ComplainantDetails.csv</strong> joined with <strong className="text-slate-300">OccupationMaster.csv</strong>.
            Occupation is the closest socio-economic background proxy available in the CSV data.
          </p>

          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={occData} layout="vertical" margin={{ top: 5, right: 60, bottom: 10, left: 140 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 12 }} tickLine={false} axisLine={false} allowDecimals={false}
                  label={{ value: "Complainants (ComplainantDetails.csv)", position: "insideBottom", offset: -8, style: { fill: "#94a3b8", fontSize: 11 } }} />
                <YAxis type="category" dataKey="name" tick={{ fill: "#cbd5e1", fontSize: 12, fontWeight: 600 }} tickLine={false} axisLine={false} width={138} />
                <Tooltip content={<OccTooltip />} cursor={{ fill: "rgba(51,65,85,0.15)" }} />
                <Bar dataKey="count" radius={[0,5,5,0]}>
                  {occData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Percentage strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {occData.map((d) => (
              <div key={d.name} className="flex items-center gap-2.5 bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.fill }} />
                <span className="text-xs text-slate-300 truncate">{d.name}</span>
                <span className="text-xs font-bold ml-auto shrink-0" style={{ color: d.fill }}>
                  {occTotal > 0 ? ((d.count / occTotal) * 100).toFixed(0) : 0}%
                </span>
              </div>
            ))}
          </div>

          <AIInsightCard
            accentClass="border-amber-500/20"
            keyFinding="Private employees and professionals file the most complaints (35%), followed by Govt/Police (17.5%). This reflects access to legal mechanisms and awareness of reporting channels."
            observation="Private/Professional complainants (14 of 40, 35%) dominate filings, consistent with urban, educated demographics. Government/Police representatives (7, 17.5%) appear in state-victim cases. Homemaker/Retired complainants (9, 22.5%) include domestic violence victims — consistent with the women/domestic FIR category."
            whyMatters="Complainant occupation is associated with reporting likelihood. Lower-income occupations (Labour/Agriculture: 2, 5%) are under-represented, suggesting under-reporting barriers linked to awareness, access or fear."
            action="Deploy community legal awareness programs in labour and agricultural communities. Facilitate anonymous reporting channels in high-stress, low-education districts to improve complaint filing rates across all socio-economic groups."
          />
        </div>
      )}
    </div>
  );
}

// ─── 4. SOCIAL RISK FACTORS — Multi-indicator scatter ─────────────────────────
// Shows each social indicator vs FIR count for the 6 active districts.
// One indicator at a time via selector to keep the chart readable.
type RiskIndicator = "stress" | "urbanization" | "education" | "migration";

function SocialRiskFactors({ data }: { data: SocioRow[] }) {
  const active = data.filter(d => d.totalCrimes > 0);
  const [indicator, setIndicator] = useState<RiskIndicator>("stress");

  const indicators: { id: RiskIndicator; label: string; color: string; desc: string }[] = [
    { id: "stress",       label: "Economic Stress",   color: "#f87171", desc: "EconomicStressIndex (District.csv)" },
    { id: "urbanization", label: "Urbanization",      color: "#38bdf8", desc: "UrbanizationIndex (District.csv)"   },
    { id: "education",    label: "Education Index",   color: "#34d399", desc: "EducationLevelIndex (District.csv)" },
    { id: "migration",    label: "Migration Rate",    color: "#c084fc", desc: "MigrationRate % (District.csv)"     },
  ];

  const cur = indicators.find(i => i.id === indicator)!;
  const maxFIRs = Math.max(...active.map(d => d.totalCrimes), 1);
  const minR = 8; const maxR = 24;

  const chartData = active.map(d => ({
    x: d[indicator],
    y: d.totalCrimes,
    districtName: d.districtName,
    shortName: d.districtName === "Mangaluru (Dakshina Kannada)" ? "Mangaluru"
      : d.districtName === "Bengaluru City" ? "B.City"
      : d.districtName.split(" ")[0],
    color: DISTRICT_COLORS[d.districtName] ?? "#64748b",
    r: minR + ((d.totalCrimes / maxFIRs) * (maxR - minR)),
    stress: d.stress,
    urbanization: d.urbanization,
    education: d.education,
    migration: d.migration,
  }));

  // X-axis domain with padding
  const xVals = chartData.map(d => d.x);
  const xMin = Math.floor(Math.min(...xVals) - 5);
  const xMax = Math.ceil(Math.max(...xVals) + 5);

  const CustomTooltip = ({ active: a, payload }: any) => {
    if (!a || !payload?.length) return null;
    const d = payload[0]?.payload;
    return (
      <TooltipBox>
        <p style={{ color: DISTRICT_COLORS[d.districtName] ?? "#f8fafc", fontWeight: 700, marginBottom: 6, fontSize: 14 }}>{d.districtName}</p>
        <p style={{ color: "#94a3b8", fontSize: 12.5 }}>{cur.label}: <span style={{ color: cur.color, fontWeight: 700 }}>{d.x}{indicator === "migration" ? "%" : "%"}</span></p>
        <p style={{ color: "#94a3b8", fontSize: 12.5 }}>Total FIRs: <span style={{ color: "#fbbf24", fontWeight: 700 }}>{d.y}</span></p>
        <p style={{ color: "#64748b", fontSize: 11, marginTop: 6, borderTop: "1px solid #1e293b", paddingTop: 4 }}>Source: {cur.desc}</p>
      </TooltipBox>
    );
  };

  return (
    <div className="bg-slate-950/80 border border-slate-800 p-6 rounded-2xl space-y-5 shadow-xl">
      <div className="border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3 mb-1.5">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-100">Social Risk Factor vs. FIR Count</h3>
        </div>
        <p className="text-sm text-slate-400 ml-12">
          Each point = one district. Select an indicator to compare against registered FIR count.
          Circle size ∝ FIR count. All values from District.csv.
        </p>
      </div>

      {/* Indicator selector */}
      <div className="flex flex-wrap gap-2">
        {indicators.map(ind => (
          <button key={ind.id} onClick={() => setIndicator(ind.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
              indicator === ind.id
                ? "text-white border-opacity-80 shadow-md"
                : "bg-slate-900/60 border-slate-700 text-slate-400 hover:text-slate-200"
            }`}
            style={indicator === ind.id ? { background: ind.color + "30", borderColor: ind.color } : {}}>
            {ind.label}
          </button>
        ))}
      </div>

      <div className="h-[380px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 50, bottom: 55, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis type="number" dataKey="x" domain={[xMin, xMax]}
              stroke="#475569" tick={{ fill: "#cbd5e1", fontSize: 12, fontWeight: 600 }}
              tickLine={false} tickFormatter={v => `${v}%`}
              label={{ value: `${cur.label} (%) — ${cur.desc}`, position: "insideBottom", offset: -35,
                style: { fill: "#94a3b8", fontSize: 11, fontWeight: 600 } }} />
            <YAxis type="number" dataKey="y" domain={[0, maxFIRs + 2]} allowDecimals={false}
              stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 12 }}
              tickLine={false} axisLine={false} width={38}
              label={{ value: "Registered FIR Cases", angle: -90, position: "insideLeft", offset: 12,
                style: { fill: "#94a3b8", fontSize: 11, fontWeight: 600 } }} />
            <Tooltip content={<CustomTooltip />} cursor={false} />
            <Scatter data={chartData} shape={(props: any) => {
              const { cx, cy, payload } = props;
              const r = payload.r;
              const labelText = payload.shortName;
              const charW = 6.5;
              const lw = labelText.length * charW + 12;
              const lx = cx - lw / 2;
              return (
                <g>
                  <circle cx={cx} cy={cy} r={r} fill={payload.color} fillOpacity={0.18} stroke={payload.color} strokeWidth={2} />
                  <circle cx={cx} cy={cy} r={4} fill={payload.color} />
                  <rect x={lx} y={cy - r - 18} width={lw} height={16} rx={3} fill="#020617" stroke={payload.color} strokeWidth={0.8} fillOpacity={0.92} />
                  <text x={cx} y={cy - r - 6} textAnchor="middle" fill="#f1f5f9" fontSize="10" fontWeight="700">{labelText}</text>
                </g>
              );
            }} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <AIInsightCard
        accentClass="border-emerald-500/20"
        keyFinding="Economic stress shows the most varied distribution across districts — Kalaburagi (68%) has 5 FIRs while Bengaluru (25%) has 14 — suggesting reporting rates, not just stress, drive FIR counts."
        observation="Across the 6 active districts, no single social indicator shows a simple linear relationship with FIR count. Bengaluru's high FIR count coincides with high urbanization and low stress. Kalaburagi's moderate FIR count coincides with high stress and low education — consistent with under-reporting in low-resource environments."
        whyMatters="Understanding which social indicators are associated with crime patterns — rather than assuming simple causation — allows investigators and policymakers to design targeted interventions rather than one-size-fits-all responses."
        action="Cross-reference social indicator rankings with patrol allocation data. Districts with high stress but low FIR counts (Kalaburagi, Belagavi) may require proactive community engagement rather than reactive policing."
      />
    </div>
  );
}

// ─── 5. RISK PROFILE RADAR ────────────────────────────────────────────────────
function DistrictRadarChart({ data }: { data: SocioRow[] }) {
  const active = data.filter(d => d.totalCrimes > 0);
  const [selectedDistrict, setSelectedDistrict] = useState<string>(active[0]?.districtName ?? "");

  const radarMetrics = [
    { key: "urbanization", label: "Urbanization",  desc: "UrbanizationIndex (District.csv)"          },
    { key: "stress",       label: "Econ. Stress",  desc: "EconomicStressIndex (District.csv)"        },
    { key: "migNorm",      label: "Migration",     desc: "MigrationRate normalised 0–100"            },
    { key: "crimeLoad",    label: "Crime Load",    desc: "FIR count normalised 0–100 vs dataset max" },
    { key: "eduInverse",   label: "Low Education", desc: "100 − EducationLevelIndex (District.csv)"  },
  ];

  const maxMig   = Math.max(...active.map(d => d.migration), 1);
  const maxFIRs  = Math.max(...active.map(d => d.totalCrimes), 1);

  const enriched = active.map(d => ({
    ...d,
    migNorm:    Math.round((d.migration   / maxMig)  * 100),
    crimeLoad:  Math.round((d.totalCrimes / maxFIRs) * 100),
    eduInverse: 100 - d.education,
  }));

  const n = enriched.length;
  const avg = {
    urbanization: Math.round(enriched.reduce((s,d) => s + d.urbanization, 0) / n),
    stress:       Math.round(enriched.reduce((s,d) => s + d.stress,       0) / n),
    migNorm:      Math.round(enriched.reduce((s,d) => s + d.migNorm,      0) / n),
    crimeLoad:    Math.round(enriched.reduce((s,d) => s + d.crimeLoad,    0) / n),
    eduInverse:   Math.round(enriched.reduce((s,d) => s + d.eduInverse,   0) / n),
  };

  const selected = enriched.find(d => d.districtName === selectedDistrict);
  const radarData = selected
    ? radarMetrics.map(m => ({
        metric:        m.label,
        districtValue: (selected as any)[m.key] as number,
        statewideAvg:  (avg as any)[m.key] as number,
        fullMark:      100,
      }))
    : [];

  const color = DISTRICT_COLORS[selectedDistrict] ?? "#38bdf8";

  return (
    <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
      {/* Header with Title & Legend Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center shrink-0">
            <Target className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100">Multi-Dimensional Risk Profile Radar</h3>
            <p className="text-xs text-slate-400">District profile vs. statewide average across 5 key indicators</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-semibold bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-lg shrink-0">
          <span className="flex items-center gap-1.5" style={{ color }}>
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
            {selectedDistrict}
          </span>
          <span className="flex items-center gap-1.5 text-sky-400">
            <span className="w-3 h-0 border-t-2 border-dashed border-sky-400 inline-block" />
            Statewide Avg
          </span>
        </div>
      </div>

      {/* Side-by-Side 2-Column Compact Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        {/* Left Column: District Selector & Live Scorecard (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Select District:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {active.map(d => {
                const short = d.districtName === "Bengaluru City" ? "B.City"
                  : d.districtName === "Mangaluru (Dakshina Kannada)" ? "Mangaluru"
                  : d.districtName.split(" ")[0];
                const isActive = d.districtName === selectedDistrict;
                return (
                  <button key={d.districtName} onClick={() => setSelectedDistrict(d.districtName)} title={d.districtName}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all text-left flex items-center justify-between ${
                      isActive ? "border-sky-500 text-sky-300 bg-sky-500/20 shadow-sm" : "border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 bg-slate-900/60"
                    }`}>
                    <span className="truncate">{short}</span>
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Metric Values Scorecard */}
          {selected && (
            <div className="bg-slate-900/70 border border-slate-800/80 p-3 rounded-xl space-y-2">
              <div className="text-xs font-bold text-slate-300 border-b border-slate-800 pb-1 flex justify-between items-center">
                <span>Indicator Scorecard</span>
                <span className="text-slate-500 text-[10px]">Scale 0–100</span>
              </div>
              <div className="grid grid-cols-1 gap-1.5 text-xs">
                {radarMetrics.map(m => {
                  const val = (selected as any)[m.key] as number;
                  const avgVal = (avg as any)[m.key] as number;
                  return (
                    <div key={m.key} className="flex items-center justify-between py-0.5 border-b border-slate-800/40 last:border-0">
                      <div className="min-w-0 pr-2">
                        <span className="font-semibold text-slate-200 block truncate">{m.label}</span>
                        <span className="text-[10px] text-slate-500 block truncate">{m.desc}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-extrabold text-xs block" style={{ color }}>{val}</span>
                        <span className="text-[10px] text-slate-500 block">Avg: {avgVal}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Radar Chart Canvas (7 cols, compact height ~320px) */}
        <div className="lg:col-span-7 h-[320px] w-full bg-slate-900/40 border border-slate-800/60 rounded-xl p-2 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} margin={{ top: 20, right: 35, bottom: 20, left: 35 }}>
              <PolarGrid stroke="#1e293b" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: "#cbd5e1", fontSize: 11, fontWeight: 700 }} tickLine={false} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 9 }}
                tickCount={6} axisLine={false} tickFormatter={v => `${v}`} />
              <Radar name={selected?.districtName ?? ""} dataKey="districtValue" stroke={color} fill={color} fillOpacity={0.35} strokeWidth={2.5} />
              <Radar name="Statewide Avg" dataKey="statewideAvg" stroke="#38bdf8" strokeDasharray="5 4" fill="#38bdf8" fillOpacity={0.07} strokeWidth={1.5} />
              <Tooltip
                contentStyle={{ background: "rgba(2,6,23,0.98)", border: "1px solid rgba(51,65,85,0.9)", borderRadius: 10, fontSize: 12, color: "#f8fafc" }}
                formatter={(v: any, name: any) => [`${v} / 100`, name === "districtValue" ? selectedDistrict : "Statewide Avg"]}
                labelFormatter={(l: any) => {
                  const m = radarMetrics.find(x => x.label === l);
                  return <span style={{ color, fontWeight: 700 }}>{l}{m ? ` — ${m.desc}` : ""}</span>;
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Insight Card */}
      <AIInsightCard
        accentClass="border-indigo-500/20"
        keyFinding="Kalaburagi's radar shows high stress (68/100), low education (35/100) and elevated migration — a compound risk profile associated with under-reporting rather than low incidence."
        observation="Kalaburagi presents three elevated risk axes simultaneously: economic stress, low education, and migration pressure — yet has only 5 FIRs registered. This combination is consistent with structural barriers to crime reporting."
        whyMatters="A radar view surfaces compound risk that single-metric analysis misses. Districts with 3+ elevated risk axes warrant proactive rather than reactive resource allocation."
        action="Use radar profiles in annual resource planning. Districts with 3 or more elevated axes should receive prioritised policing budgets, social welfare integration, and community liaison officers."
      />
    </div>
  );
}

// ─── District summary table ───────────────────────────────────────────────────
function DistrictTable({ data }: { data: SocioRow[] }) {
  const active = data.filter(d => d.totalCrimes > 0);
  return (
    <div className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      <div className="px-6 py-4 border-b border-slate-800/80 flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-slate-300" />
            <h3 className="text-base font-bold text-slate-100">District Intelligence Summary Matrix</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">All values from District.csv and CaseMaster.csv. Only districts with registered FIR cases shown.</p>
        </div>
        <span className="text-xs font-semibold text-sky-400 bg-sky-500/10 border border-sky-500/30 px-3 py-1 rounded-lg shrink-0">6 Districts</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-slate-900/90 border-b border-slate-800 text-xs font-bold text-slate-300 uppercase tracking-wider">
              <th className="py-3 px-4">District</th>
              <th className="py-3 px-3 text-center">Urban %</th>
              <th className="py-3 px-3 text-center">Stress %</th>
              <th className="py-3 px-3 text-center">Edu %</th>
              <th className="py-3 px-3 text-center">Mig %</th>
              <th className="py-3 px-3 text-center">Density</th>
              <th className="py-3 px-3 text-center text-amber-400">Property</th>
              <th className="py-3 px-3 text-center text-rose-400">Violent</th>
              <th className="py-3 px-3 text-center text-purple-400">Cyber</th>
              <th className="py-3 px-3 text-center text-emerald-400">Narcotic</th>
              <th className="py-3 px-3 text-center text-pink-400">Women</th>
              <th className="py-3 px-4 text-center text-slate-100">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {active.map((d, i) => (
              <tr key={i} className="hover:bg-slate-900/50 transition-colors">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: DISTRICT_COLORS[d.districtName] ?? "#64748b" }} />
                    <span className="font-semibold text-sm text-slate-100">{d.districtName}</span>
                  </div>
                </td>
                <td className="py-3 px-3 text-center text-sky-400 font-bold text-xs">{d.urbanization}%</td>
                <td className="py-3 px-3 text-center">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold ${d.stress >= 60 ? "bg-rose-500/20 text-rose-300 border border-rose-500/40" : d.stress >= 40 ? "bg-amber-500/20 text-amber-300 border border-amber-500/40" : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"}`}>
                    {d.stress}%
                  </span>
                </td>
                <td className="py-3 px-3 text-center text-emerald-400 font-bold text-xs">{d.education}%</td>
                <td className="py-3 px-3 text-center text-purple-400 font-bold text-xs">{d.migration}%</td>
                <td className="py-3 px-3 text-center text-slate-300 font-mono text-xs">{d.density.toLocaleString()}</td>
                <td className="py-3 px-3 text-center text-amber-400 font-extrabold text-xs">{d.propertyCrimes}</td>
                <td className="py-3 px-3 text-center text-rose-400 font-extrabold text-xs">{d.bodyCrimes}</td>
                <td className="py-3 px-3 text-center text-purple-400 font-extrabold text-xs">{d.cyberCrimes}</td>
                <td className="py-3 px-3 text-center text-emerald-400 font-extrabold text-xs">{d.drugCrimes}</td>
                <td className="py-3 px-3 text-center text-pink-400 font-extrabold text-xs">{d.womenCrimes}</td>
                <td className="py-3 px-4 text-center">
                  <span className="inline-flex px-2.5 py-0.5 rounded-lg text-xs font-extrabold bg-sky-500/20 text-sky-300 border border-sky-500/40">{d.totalCrimes}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Cross-module actions ─────────────────────────────────────────────────────
function CrossModulePanel({ onNavigate, setChatInput, logAuditEvent }: Pick<Props, "onNavigate" | "setChatInput" | "logAuditEvent">) {
  const actions = [
    { label: "View Crime Hotspots", desc: "Spatial density & clustering", tab: "hotspots", color: "text-sky-300", border: "border-sky-500/30", bg: "bg-sky-500/10" },
    { label: "Ask AI Deep Analysis", desc: "Economic stress vs crime query", tab: "conversational", color: "text-purple-300", border: "border-purple-500/30", bg: "bg-purple-500/10",
      prefill: "Explain the relationship between economic stress and violent crime in Kalaburagi district" },
    { label: "Early Warning Alarms", desc: "Predictive patrol deployment", tab: "forecasting", color: "text-amber-300", border: "border-amber-500/30", bg: "bg-amber-500/10" },
    { label: "Offender Profiles", desc: "Recidivism risk & dossier trace", tab: "profiling", color: "text-emerald-300", border: "border-emerald-500/30", bg: "bg-emerald-500/10" },
  ];
  return (
    <div className="bg-slate-950/80 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
      <div className="flex items-center gap-2">
        <Lightbulb className="w-5 h-5 text-sky-400" />
        <h3 className="text-base font-bold text-slate-100">Recommended Cross-Module Actions</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map(a => (
          <button key={a.tab} onClick={() => { if (a.prefill) setChatInput(a.prefill); onNavigate(a.tab); logAuditEvent("Cross Link", `Sociological → ${a.tab}`); }}
            className={`group flex flex-col justify-between p-4 rounded-xl border ${a.border} ${a.bg} transition-all text-left space-y-2`}>
            <div>
              <span className={`text-sm font-bold block ${a.color}`}>{a.label}</span>
              <span className="text-xs text-slate-400 mt-1 block">{a.desc}</span>
            </div>
            <div className={`flex items-center gap-1 text-xs font-semibold text-slate-300 pt-2 border-t border-slate-800/60`}>
              <span>Launch</span>
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
  const [demo, setDemo] = useState<DemoData | null>(null);
  const [localData, setLocalData] = useState<SocioRow[]>(socioData && socioData.length > 0 ? socioData : []);

  useEffect(() => {
    if (socioData && socioData.length > 0) {
      setLocalData(socioData);
    }
  }, [socioData]);

  useEffect(() => {
    fetch("/api/analytics/demographics")
      .then(r => r.json())
      .then(setDemo)
      .catch(err => console.error("Demographics fetch error:", err));

    if (!socioData || socioData.length === 0) {
      fetch("/api/analytics/sociological")
        .then(r => r.json())
        .then(res => {
          if (Array.isArray(res) && res.length > 0) {
            setLocalData(res);
          }
        })
        .catch(err => console.error("Socio fetch error:", err));
    }
  }, []);

  const activeData = localData.length > 0 ? localData : socioData;

  if (!activeData || activeData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
          <Activity className="w-5 h-5 text-slate-500 animate-pulse" />
        </div>
        <p className="text-sm text-slate-500">Loading sociological data…</p>
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
          <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-sky-500/10 text-sky-300 border border-sky-500/30">6 Active Districts</span>
          <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-500/10 text-purple-300 border border-purple-500/30">
            {activeData.filter(d => d.totalCrimes > 0).reduce((s,d) => s + d.totalCrimes, 0)} FIR Cases
          </span>
        </div>
      </div>

      {/* 1. Key indicators */}
      <StatewideKpiBar data={activeData} demo={demo} />

      {/* 2. Main socio-economic comparison */}
      <SocioRiskChart data={activeData} />

      {/* 3. Demographic crime patterns */}
      <DemographicCrimeSection demo={demo} />

      {/* 4 & 5. Risk factors + radar side by side at 2xl */}
      <div className="grid grid-cols-1 2xl:grid-cols-2 gap-6">
        <SocialRiskFactors data={activeData} />
        <DistrictRadarChart data={activeData} />
      </div>

      {/* District matrix table */}
      <DistrictTable data={activeData} />

      {/* Cross-module actions */}
      <CrossModulePanel onNavigate={onNavigate} setChatInput={setChatInput} logAuditEvent={logAuditEvent} />
    </motion.div>
  );
}
