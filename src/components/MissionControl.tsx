import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Shield, AlertTriangle, Activity, Users, MapPin, TrendingUp,
  MessageSquare, FileText, BrainCircuit, ArrowRight, CheckCircle,
  Clock, Zap, Eye, BarChart2, RefreshCw
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import {
  mockCases, mockAccused, mockDistricts, mockFinancialTransactions
} from "../mockData";

// ── Types ──────────────────────────────────────────────────────────────────
interface MissionControlProps {
  onNavigate: (tab: string) => void;
  forecasting: { warnings: any[]; hotspotsRisk: any[] };
  trendData: { crimeByMonth: any[]; crimeByType: any[]; hotspots: any[] };
}

// ── Helpers ────────────────────────────────────────────────────────────────
function getRiskColor(risk: number) {
  if (risk >= 75) return { text: "text-rose-400",   bg: "bg-rose-500/10",   border: "border-rose-500/30"   };
  if (risk >= 50) return { text: "text-amber-400",  bg: "bg-amber-500/10",  border: "border-amber-500/30"  };
  return           { text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" };
}

// ── Subcomponents ──────────────────────────────────────────────────────────

function AIBriefCard() {
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });
  return (
    <div className="card-elevated rounded-2xl p-5 border border-blue-500/20 bg-gradient-to-br from-slate-900 to-slate-950 col-span-full">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="text-label text-blue-400 mb-0.5">AI Daily Intelligence Brief</div>
            <div className="text-micro text-slate-500">{today} · Auto-generated from live FIR data</div>
          </div>
        </div>
        <span className="badge badge-blue">CONFIDENTIAL — L1+</span>
      </div>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-body-sm text-slate-300 leading-relaxed">
        <div className="space-y-1">
          <div className="text-caption font-semibold text-slate-400 uppercase tracking-wider">Threat Landscape</div>
          <p>Property crimes remain the dominant category across Karnataka, concentrated in <span className="chip-location">Bengaluru City</span> and <span className="chip-location">Hubballi-Dharwad</span>. Night-time robbery patterns suggest organised gang activity along the Koramangala–Cubbon Park corridor.</p>
        </div>
        <div className="space-y-1">
          <div className="text-caption font-semibold text-slate-400 uppercase tracking-wider">High-Priority Suspects</div>
          <p><span className="chip-person">Ramesh Kumar (Ranga)</span> is linked to 3 active FIRs — highest recidivism score on record. <span className="chip-person">Suresh Hegde</span> is a known financial intermediary. Surveillance escalation recommended.</p>
        </div>
        <div className="space-y-1">
          <div className="text-caption font-semibold text-slate-400 uppercase tracking-wider">Recommended Focus</div>
          <p>Financial trace on <span className="chip-case">FIR-202600004</span> (Mangaluru phishing) reveals a 3-phase crypto laundering chain. Coordinate with cyber-crime wing and commercial bank fraud desks for immediate freeze orders.</p>
        </div>
      </div>
    </div>
  );
}

function KPIGrid({ onNavigate }: { onNavigate: (t: string) => void }) {
  const activeCases      = mockCases.filter(c => c.CaseStatusID === 2).length;
  const highRiskSuspects = mockAccused.filter((_, i) => i < 3).length;
  const hotspotCount     = mockDistricts.filter(d => d.SocioEconomic.economicStressIndex > 40).length;
  const suspiciousTx     = mockFinancialTransactions.filter(t => t.IsSuspicious).length;

  const kpis = [
    {
      label: "Active Investigations",
      value: activeCases,
      sub: "Cases under investigation",
      icon: FileText,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      border: "border-blue-500/20",
      tab: "decision",
    },
    {
      label: "High-Risk Suspects",
      value: highRiskSuspects,
      sub: "Repeat offenders flagged",
      icon: Users,
      color: "text-rose-400",
      bg: "bg-rose-500/10",
      border: "border-rose-500/20",
      tab: "profiling",
    },
    {
      label: "Crime Hotspot Districts",
      value: hotspotCount,
      sub: "Districts with elevated risk",
      icon: MapPin,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
      tab: "hotspots",
    },
    {
      label: "Suspicious Transactions",
      value: suspiciousTx,
      sub: "Flagged financial flows",
      icon: Activity,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/20",
      tab: "financial",
    },
  ];

  return (
    <>
      {kpis.map((k, i) => {
        const Icon = k.icon;
        return (
          <motion.button
            key={k.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            onClick={() => onNavigate(k.tab)}
            className={`kpi-card text-left group border ${k.border} cursor-pointer`}
          >
            <div className={`w-9 h-9 rounded-lg ${k.bg} border ${k.border} flex items-center justify-center mb-3`}>
              <Icon className={`w-4.5 h-4.5 ${k.color}`} />
            </div>
            <div className={`text-display font-black ${k.color} leading-none mb-1 animate-countUp`}>{k.value}</div>
            <div className="text-body-sm font-semibold text-slate-200">{k.label}</div>
            <div className="text-caption text-slate-500 mt-0.5">{k.sub}</div>
            <div className={`mt-3 text-micro font-semibold ${k.color} flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity`}>
              View details <ArrowRight className="w-3 h-3" />
            </div>
          </motion.button>
        );
      })}
    </>
  );
}

function AlertsPanel({ warnings }: { warnings: any[] }) {
  const displayWarnings = warnings.length > 0 ? warnings.slice(0, 4) : [
    { id: "W-001", severity: "HIGH",   title: "Repeat Gang Activity — Koramangala",       location: "Bengaluru City",     confidence: 87 },
    { id: "W-002", severity: "HIGH",   title: "Narcotics Distribution Network Active",     location: "Cubbon Park Area",   confidence: 82 },
    { id: "W-003", severity: "MEDIUM", title: "Cyber Fraud Surge — Senior Citizen Targets",location: "Mangaluru District", confidence: 74 },
    { id: "W-004", severity: "MEDIUM", title: "Juvenile Gang Violence Escalation",          location: "Kalaburagi Town",    confidence: 70 },
  ];

  return (
    <div className="card rounded-2xl flex flex-col">
      <div className="section-header mb-3">
        <div>
          <div className="section-title text-base">
            <AlertTriangle className="w-4.5 h-4.5 text-rose-400" />
            Critical Alerts
          </div>
          <div className="section-subtitle">Active early-warning signals</div>
        </div>
        <span className="badge badge-red">{displayWarnings.length} Active</span>
      </div>
      <div className="space-y-2 flex-1">
        {displayWarnings.map((w, i) => {
          const isHigh = w.severity === "HIGH";
          return (
            <motion.div
              key={w.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className={`flex items-start gap-3 p-3 rounded-xl border ${isHigh ? "border-rose-500/20 bg-rose-500/5" : "border-amber-500/15 bg-amber-500/5"}`}
            >
              <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${isHigh ? "bg-rose-500" : "bg-amber-400"} animate-pulse`} />
              <div className="min-w-0 flex-1">
                <div className="text-body-sm font-semibold text-slate-200 leading-snug">{w.title}</div>
                <div className="text-caption text-slate-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3" />{w.location}
                </div>
              </div>
              <span className={`badge shrink-0 ${isHigh ? "badge-red" : "badge-amber"}`}>{w.confidence ?? 80}%</span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function TrendMiniChart({ data }: { data: any[] }) {
  const chartData = data.length > 0 ? data : [
    { month: "Jan", Heinous: 1, NonHeinous: 0 },
    { month: "Feb", Heinous: 1, NonHeinous: 0 },
    { month: "Mar", Heinous: 1, NonHeinous: 1 },
    { month: "Apr", Heinous: 1, NonHeinous: 0 },
    { month: "May", Heinous: 2, NonHeinous: 1 },
    { month: "Jun", Heinous: 1, NonHeinous: 1 },
  ];

  return (
    <div className="card rounded-2xl">
      <div className="section-header mb-3">
        <div>
          <div className="section-title text-base">
            <TrendingUp className="w-4.5 h-4.5 text-emerald-400" />
            Crime Trend (2026)
          </div>
          <div className="section-subtitle">Monthly registration velocity</div>
        </div>
      </div>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
            <defs>
              <linearGradient id="mc-heinous" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#f43f5e" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="mc-nonheinous" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(51,65,85,0.4)" />
            <XAxis dataKey="month" stroke="#475569" fontSize={10} tickLine={false} />
            <YAxis stroke="#475569" fontSize={10} tickLine={false} allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: "rgba(2,6,23,0.95)", border: "1px solid rgba(51,65,85,0.8)", borderRadius: 8 }}
              labelStyle={{ color: "#e2e8f0", fontWeight: 600 }}
              itemStyle={{ color: "#94a3b8" }}
            />
            <Area type="monotone" dataKey="Heinous"    stroke="#f43f5e" fill="url(#mc-heinous)"    strokeWidth={2} name="Heinous" />
            <Area type="monotone" dataKey="NonHeinous" stroke="#f59e0b" fill="url(#mc-nonheinous)" strokeWidth={2} name="Non-Heinous" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex gap-4 mt-2">
        <span className="flex items-center gap-1.5 text-caption text-slate-500"><span className="w-2.5 h-2.5 rounded-sm bg-rose-500/60 inline-block" />Heinous</span>
        <span className="flex items-center gap-1.5 text-caption text-slate-500"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500/60 inline-block" />Non-Heinous</span>
      </div>
    </div>
  );
}

function TopCrimesPanel() {
  const crimes = [
    { name: "Robbery / Theft",       count: 4, pct: 50, color: "bg-amber-400" },
    { name: "Murder / Assault",       count: 2, pct: 25, color: "bg-rose-500"  },
    { name: "Cyber Fraud",            count: 1, pct: 12, color: "bg-purple-400"},
    { name: "Narcotics Trafficking",  count: 1, pct: 13, color: "bg-emerald-400"},
  ];
  return (
    <div className="card rounded-2xl">
      <div className="section-header mb-3">
        <div>
          <div className="section-title text-base">
            <BarChart2 className="w-4.5 h-4.5 text-purple-400" />
            Top Crime Categories
          </div>
          <div className="section-subtitle">Distribution across 8 active FIRs</div>
        </div>
      </div>
      <div className="space-y-3">
        {crimes.map((c, i) => (
          <div key={i}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-body-sm text-slate-300 font-medium">{c.name}</span>
              <span className="text-caption text-slate-500 font-mono">{c.count} cases</span>
            </div>
            <div className="confidence-bar">
              <motion.div
                className={`confidence-fill ${c.color}`}
                initial={{ width: 0 }}
                animate={{ width: `${c.pct}%` }}
                transition={{ delay: i * 0.1 + 0.3, duration: 0.6 }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivityTimeline() {
  const events = [
    { time: "06:30", action: "FIR 202600005 — Murder case update", type: "critical", tab: "decision" },
    { time: "Yesterday", action: "Financial trace flagged — 3-phase crypto laundering", type: "warning", tab: "financial" },
    { time: "2 days ago", action: "Ramesh Kumar linked to 3rd property theft FIR", type: "info",    tab: "profiling" },
    { time: "3 days ago", action: "Kalaburagi early warning alarm activated", type: "warning", tab: "forecasting" },
    { time: "4 days ago", action: "Cyber fraud arrest — Vikram Malhotra, Mangaluru", type: "info",    tab: "decision" },
  ];
  const dot: Record<string,string> = { critical: "bg-rose-500", warning: "bg-amber-400", info: "bg-blue-400" };

  return (
    <div className="card rounded-2xl">
      <div className="section-header mb-3">
        <div>
          <div className="section-title text-base">
            <Clock className="w-4.5 h-4.5 text-sky-400" />
            Recent Activity
          </div>
          <div className="section-subtitle">Investigation timeline</div>
        </div>
      </div>
      <div className="timeline-track space-y-4">
        {events.map((e, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07 }}
            className="relative"
          >
            <span className={`timeline-dot ${dot[e.type]}`} />
            <div className="text-body-sm text-slate-300 font-medium leading-snug">{e.action}</div>
            <div className="text-caption text-slate-500 mt-0.5">{e.time}</div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function AIRecommendations({ onNavigate }: { onNavigate: (t: string) => void }) {
  const recs = [
    { icon: Eye,          text: "Review Ramesh Kumar cross-case financial links",         tab: "profiling",   color: "text-amber-400",  bg: "bg-amber-500/10",  border: "border-amber-500/20"  },
    { icon: BrainCircuit, text: "Run decision support on FIR-202600004 (Phishing)",        tab: "decision",    color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/20"   },
    { icon: AlertTriangle,text: "Acknowledge Kalaburagi patrol deployment advisory",      tab: "forecasting", color: "text-rose-400",   bg: "bg-rose-500/10",   border: "border-rose-500/20"   },
    { icon: Activity,     text: "Initiate bank freeze on Suresh Hegde's SBI account",     tab: "financial",   color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  ];
  return (
    <div className="card rounded-2xl">
      <div className="section-header mb-3">
        <div>
          <div className="section-title text-base">
            <BrainCircuit className="w-4.5 h-4.5 text-indigo-400" />
            AI Recommendations
          </div>
          <div className="section-subtitle">Suggested next actions</div>
        </div>
      </div>
      <div className="space-y-2">
        {recs.map((r, i) => {
          const Icon = r.icon;
          return (
            <motion.button
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              onClick={() => onNavigate(r.tab)}
              className={`w-full text-left flex items-center gap-3 p-3 rounded-xl border ${r.border} ${r.bg} group transition hover:opacity-90`}
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${r.bg} border ${r.border}`}>
                <Icon className={`w-3.5 h-3.5 ${r.color}`} />
              </div>
              <span className="text-body-sm text-slate-300 flex-1">{r.text}</span>
              <ArrowRight className={`w-3.5 h-3.5 ${r.color} shrink-0 opacity-0 group-hover:opacity-100 transition-opacity`} />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function QuickActions({ onNavigate }: { onNavigate: (t: string) => void }) {
  const actions = [
    { icon: MessageSquare, label: "Open AI Chat",    sub: "Conversational search",  tab: "conversational", color: "text-amber-400",  bg: "from-amber-500/10",  border: "border-amber-500/25"  },
    { icon: Users,         label: "Criminal Graph",  sub: "Network relationships",  tab: "network",        color: "text-emerald-400",bg: "from-emerald-500/10",border: "border-emerald-500/25"},
    { icon: TrendingUp,    label: "Analytics",       sub: "Hotspots & trends",      tab: "hotspots",       color: "text-sky-400",    bg: "from-sky-500/10",    border: "border-sky-500/25"    },
    { icon: FileText,      label: "Case Reports",    sub: "Decision support",       tab: "decision",       color: "text-indigo-400", bg: "from-indigo-500/10", border: "border-indigo-500/25" },
  ];
  return (
    <div className="card-elevated rounded-2xl col-span-full">
      <div className="text-label text-slate-400 mb-4">Quick Actions</div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {actions.map((a, i) => {
          const Icon = a.icon;
          return (
            <motion.button
              key={a.tab}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => onNavigate(a.tab)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border ${a.border} bg-gradient-to-b ${a.bg} to-transparent group hover:border-opacity-60 transition`}
            >
              <div className={`w-10 h-10 rounded-xl border ${a.border} flex items-center justify-center bg-slate-950/60`}>
                <Icon className={`w-5 h-5 ${a.color}`} />
              </div>
              <div className="text-center">
                <div className={`text-body-sm font-semibold ${a.color}`}>{a.label}</div>
                <div className="text-caption text-slate-500">{a.sub}</div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function DistrictRiskTable({ hotspotsRisk }: { hotspotsRisk: any[] }) {
  const rows = hotspotsRisk.length > 0 ? hotspotsRisk : mockDistricts.map(d => ({
    name: d.DistrictName,
    risk: d.SocioEconomic.economicStressIndex,
    activeTrend: d.SocioEconomic.economicStressIndex > 50 ? "Rising" : "Stable",
  }));

  return (
    <div className="card rounded-2xl">
      <div className="section-header mb-3">
        <div>
          <div className="section-title text-base">
            <MapPin className="w-4.5 h-4.5 text-rose-400" />
            District Risk Index
          </div>
          <div className="section-subtitle">Live risk scores by district</div>
        </div>
      </div>
      <div className="space-y-2">
        {rows.slice(0, 6).map((h: any, i: number) => {
          const c = getRiskColor(h.risk);
          return (
            <div key={i} className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-body-sm text-slate-300 font-medium truncate">{h.name}</div>
                <div className="text-caption text-slate-500">{h.activeTrend} trend</div>
              </div>
              <div className="w-24">
                <div className="confidence-bar mb-1">
                  <motion.div
                    className={`confidence-fill ${c.text.replace("text-", "bg-").replace("-400", "-500")}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${h.risk}%` }}
                    transition={{ delay: i * 0.08, duration: 0.5 }}
                  />
                </div>
              </div>
              <span className={`badge shrink-0 ${c.bg} ${c.text} ${c.border}`}>{h.risk}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────
export default function MissionControl({ onNavigate, forecasting, trendData }: MissionControlProps) {
  const [lastRefresh, setLastRefresh] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const id = setInterval(() => setLastRefresh(new Date().toLocaleTimeString()), 60000);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      key="tab_mission"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="h-full overflow-y-auto pr-1"
      style={{ scrollbarWidth: "thin", scrollbarColor: "#334155 transparent" }}
    >
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-heading1 text-slate-100 flex items-center gap-3">
            <Shield className="w-7 h-7 text-blue-400 shrink-0" />
            Mission Control
          </h1>
          <p className="text-body-sm text-slate-400 mt-1">Executive Intelligence Dashboard — Karnataka State Police</p>
        </div>
        <div className="flex items-center gap-2 text-caption text-slate-500">
          <RefreshCw className="w-3.5 h-3.5" />
          Last updated {lastRefresh}
        </div>
      </div>

      {/* Row 1: AI Brief (full width) */}
      <div className="grid grid-cols-1 gap-4 mb-4">
        <AIBriefCard />
      </div>

      {/* Row 2: KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4 stagger-children">
        <KPIGrid onNavigate={onNavigate} />
      </div>

      {/* Row 3: Quick actions (full width) */}
      <div className="grid grid-cols-1 gap-4 mb-4">
        <QuickActions onNavigate={onNavigate} />
      </div>

      {/* Row 4: Alerts | Trend chart | District risk */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <AlertsPanel warnings={forecasting?.warnings ?? []} />
        <TrendMiniChart data={trendData?.crimeByMonth ?? []} />
        <DistrictRiskTable hotspotsRisk={forecasting?.hotspotsRisk ?? []} />
      </div>

      {/* Row 5: Top crimes | AI recs | Timeline */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4">
        <TopCrimesPanel />
        <AIRecommendations onNavigate={onNavigate} />
        <ActivityTimeline />
      </div>
    </motion.div>
  );
}
