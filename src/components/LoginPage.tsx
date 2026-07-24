import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Shield, Lock, Eye, EyeOff, ArrowRight, CheckCircle,
  AlertTriangle, BrainCircuit, Users, MapPin, TrendingUp
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface LoginPageProps {
  onLogin: (role: DemoRole) => void;
}

export interface DemoRole {
  id: string;
  title: string;
  level: string;
  description: string;
  badge: string;
  badgeClass: string;
  iconColor: string;
  iconBg: string;
  initials: string;
}

const DEMO_ROLES: DemoRole[] = [
  {
    id: "admin",
    title: "Administrator",
    level: "L4 — Full Access",
    description: "System config, user management, audit oversight.",
    badge: "ADMIN",
    badgeClass: "badge-purple",
    iconColor: "text-purple-400",
    iconBg: "bg-purple-500/15 border-purple-500/25",
    initials: "SA",
  },
  {
    id: "analyst",
    title: "Crime Analyst",
    level: "L2 — Analytical Access",
    description: "Sociological insights, trends, financial trace, AI queries.",
    badge: "ANALYST",
    badgeClass: "badge-blue",
    iconColor: "text-blue-400",
    iconBg: "bg-blue-500/15 border-blue-500/25",
    initials: "CA",
  },
  {
    id: "investigator",
    title: "Investigating Officer",
    level: "L1 — Operational Access",
    description: "FIR search, offender profiles, decision support.",
    badge: "OFFICER",
    badgeClass: "badge-amber",
    iconColor: "text-amber-400",
    iconBg: "bg-amber-500/15 border-amber-500/25",
    initials: "IO",
  },
  {
    id: "senior",
    title: "Senior Police Officer",
    level: "L3 — Command Access",
    description: "Mission control, early warnings, strategic reports.",
    badge: "SENIOR",
    badgeClass: "badge-green",
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-500/15 border-emerald-500/25",
    initials: "SP",
  },
];

// ── Deterministic star positions ───────────────────────────────────────────────
const STARS = Array.from({ length: 90 }, (_, i) => ({
  x: ((i * 127 + 33) % 97) + 1.5,
  y: ((i * 89 + 17) % 95) + 2.5,
  r: i % 3 === 0 ? 1.4 : i % 3 === 1 ? 0.9 : 0.5,
  delay: (i * 0.31) % 4,
  dur: 2 + (i % 5) * 0.8,
}));

// Network nodes for animated background graph
const BG_NODES = [
  { x: 12, y: 18, r: 3.5, t: "case"    },
  { x: 38, y: 10, r: 2.8, t: "suspect" },
  { x: 65, y: 22, r: 3.2, t: "case"    },
  { x: 85, y: 52, r: 2.5, t: "account" },
  { x: 52, y: 45, r: 4.2, t: "case"    },
  { x: 25, y: 55, r: 2.6, t: "suspect" },
  { x: 75, y: 70, r: 2.8, t: "account" },
  { x: 10, y: 72, r: 2.4, t: "victim"  },
  { x: 42, y: 80, r: 3.0, t: "suspect" },
  { x: 90, y: 35, r: 2.2, t: "victim"  },
  { x: 30, y: 32, r: 2.0, t: "account" },
  { x: 58, y: 88, r: 2.6, t: "case"    },
  { x: 18, y: 42, r: 2.2, t: "suspect" },
  { x: 70, y: 42, r: 2.4, t: "case"    },
  { x: 48, y: 62, r: 1.8, t: "victim"  },
];
const BG_EDGES = [
  [0,1],[1,2],[2,4],[3,4],[4,5],[4,6],[5,7],[6,8],[0,5],[2,9],[1,10],[8,11],[0,12],[2,13],[4,14],[10,12],
];

function nodeStroke(t: string) {
  if (t === "case")    return "rgba(59,130,246,0.55)";
  if (t === "suspect") return "rgba(239,68,68,0.45)";
  if (t === "account") return "rgba(245,158,11,0.45)";
  return "rgba(16,185,129,0.45)";
}
function nodeFill(t: string) {
  if (t === "case")    return "rgba(30,64,175,0.28)";
  if (t === "suspect") return "rgba(153,27,27,0.22)";
  if (t === "account") return "rgba(146,64,14,0.22)";
  return "rgba(6,95,70,0.22)";
}

// ── Animated 3D Background ────────────────────────────────────────────────────
function Background3D() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t); }, []);

  return (
    <div
      className="absolute inset-0 pointer-events-none select-none overflow-hidden"
      aria-hidden="true"
      style={{ opacity: mounted ? 1 : 0, transition: "opacity 1.4s ease" }}
    >
      {/* ── CSS keyframes injected inline ── */}
      <style>{`
        @keyframes twinkle   { 0%,100%{opacity:0.15} 50%{opacity:1} }
        @keyframes drift1    { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(18px,-14px) scale(1.06)} }
        @keyframes drift2    { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-22px,12px) scale(1.04)} }
        @keyframes drift3    { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(14px,18px) scale(1.05)} }
        @keyframes nodeFloat { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-9px)} }
        @keyframes lineFlow  { 0%{stroke-dashoffset:60} 100%{stroke-dashoffset:0} }
        @keyframes scanline  { 0%{transform:translateY(-100%)} 100%{transform:translateY(100vh)} }
        @keyframes gridPulse { 0%,100%{opacity:0.035} 50%{opacity:0.075} }
      `}</style>

      {/* Deep space gradient base */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(135deg, #020817 0%, #070d2a 35%, #0a0f2e 60%, #050d1f 100%)",
      }} />

      {/* Moving glow orbs */}
      <div style={{
        position: "absolute", width: 700, height: 700,
        top: "40%", left: "50%", transform: "translate(-50%,-50%)",
        background: "radial-gradient(ellipse, rgba(37,99,235,0.07) 0%, transparent 65%)",
        borderRadius: "50%", animation: "drift1 28s ease-in-out infinite",
      }} />
      <div style={{
        position: "absolute", width: 420, height: 420,
        top: "12%", right: "5%",
        background: "radial-gradient(ellipse, rgba(99,102,241,0.055) 0%, transparent 60%)",
        borderRadius: "50%", animation: "drift2 38s ease-in-out infinite",
      }} />
      <div style={{
        position: "absolute", width: 320, height: 320,
        bottom: "8%", left: "3%",
        background: "radial-gradient(ellipse, rgba(16,185,129,0.04) 0%, transparent 60%)",
        borderRadius: "50%", animation: "drift3 48s ease-in-out infinite",
      }} />

      {/* Perspective grid */}
      <svg
        style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          animation: "gridPulse 6s ease-in-out infinite",
        }}
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <pattern id="grid3d" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(59,130,246,0.18)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid3d)"
          style={{ transform: "perspective(900px) rotateX(72deg) scaleX(1.4) translateY(-30%)", transformOrigin: "50% 100%" }} />
      </svg>

      {/* Star field SVG */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      >
        {STARS.map((s, i) => (
          <circle
            key={i}
            cx={s.x} cy={s.y} r={s.r}
            fill="white"
            opacity="0.2"
            style={{
              animation: `twinkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
            }}
          />
        ))}
      </svg>

      {/* Animated network graph */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          filter: "blur(0.3px)", opacity: 0.5,
        }}
      >
        {BG_EDGES.map(([a, b], i) => {
          const na = BG_NODES[a], nb = BG_NODES[b];
          return (
            <line key={i}
              x1={na.x} y1={na.y} x2={nb.x} y2={nb.y}
              stroke="rgba(59,130,246,0.2)" strokeWidth="0.22"
              strokeDasharray="4 3"
              style={{ animation: `lineFlow ${3 + (i % 4) * 0.6}s linear ${(i * 0.4) % 2}s infinite` }}
            />
          );
        })}
        {BG_NODES.map((node, i) => (
          <g key={i} style={{ animation: `nodeFloat ${5 + (i % 4) * 1.5}s ease-in-out ${(i * 0.7) % 3}s infinite` }}>
            <circle cx={node.x} cy={node.y} r={node.r + 2.8} fill="none"
              stroke={nodeStroke(node.t)} strokeWidth="0.18" opacity="0.4" />
            <circle cx={node.x} cy={node.y} r={node.r}
              fill={nodeFill(node.t)} stroke={nodeStroke(node.t)} strokeWidth="0.35" />
          </g>
        ))}
      </svg>

      {/* Subtle scan line sweep */}
      <div style={{
        position: "absolute", left: 0, right: 0, height: "2px",
        background: "linear-gradient(90deg, transparent, rgba(59,130,246,0.08), transparent)",
        animation: "scanline 8s linear infinite",
        pointerEvents: "none",
      }} />
    </div>
  );
}

// ── Counting animation hook ───────────────────────────────────────────────────
function useCountUp(target: number, duration = 1200) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      setVal(Math.round(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return val;
}

// ── Role card ─────────────────────────────────────────────────────────────────
function RoleCard({ role, isActive, onSelect }: {
  role: DemoRole; isActive: boolean; onSelect: () => void;
}) {
  return (
    <button
      type="button" role="radio" aria-checked={isActive} onClick={onSelect}
      className="w-full text-left transition-all duration-150"
      style={{
        background: isActive ? "rgba(37,99,235,0.1)" : "rgba(6,13,31,0.65)",
        border: `1px solid ${isActive ? "rgba(59,130,246,0.45)" : "rgba(30,41,59,0.9)"}`,
        borderRadius: 12, padding: "11px 14px",
        boxShadow: isActive ? "0 0 0 1px rgba(59,130,246,0.12) inset, 0 4px 16px rgba(37,99,235,0.1)" : "none",
        outline: "none",
      }}
    >
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 text-caption font-bold ${role.iconBg} ${role.iconColor}`}>
          {role.initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-body-sm font-semibold text-slate-200 leading-none">{role.title}</span>
            <span className={`badge ${role.badgeClass} shrink-0`}>{role.badge}</span>
          </div>
          <div className="text-micro text-slate-500 mt-1 leading-snug">{role.description}</div>
        </div>
        <div
          className="w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-all duration-150"
          style={{ borderColor: isActive ? "#3b82f6" : "rgba(51,65,85,0.6)", background: isActive ? "#3b82f6" : "transparent" }}
        >
          {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
        </div>
      </div>
    </button>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function LoginPage({ onLogin }: LoginPageProps) {
  const [selectedRole, setSelectedRole] = useState<DemoRole>(DEMO_ROLES[2]);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginStep, setLoginStep] = useState<"idle" | "authenticating" | "done">("idle");
  const [error, setError] = useState("");

  // Animated stat counters
  const firs      = useCountUp(40);
  const districts = useCountUp(6, 900);
  const offenders = useCountUp(8, 1100);

  const credentials = {
    username: `demo.${selectedRole.id}@ksp.gov.in`,
    password: "KSP@Demo2026",
  };

  const handleLogin = async () => {
    if (loginStep !== "idle") return;
    setError("");
    setLoginStep("authenticating");
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 1300));
    setLoginStep("done");
    await new Promise(r => setTimeout(r, 380));
    onLogin(selectedRole);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex" style={{ fontFamily: "'Inter','Segoe UI',system-ui,sans-serif" }}>
      {/* Animated 3D background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <Background3D />
      </div>

      {/* Left branding panel */}
      <motion.div
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="hidden lg:flex flex-col justify-center gap-8 relative z-10 flex-1 px-16 py-12"
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%)", boxShadow: "0 4px 20px rgba(37,99,235,0.4)" }}>
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-body-sm font-bold text-slate-100 tracking-tight">Karnataka State Police</div>
            <div className="text-micro text-blue-400/70 tracking-widest uppercase mt-0.5">AI Intelligence Division</div>
          </div>
        </div>

        {/* Headline */}
        <div>
          <div className="text-label text-blue-400/70 mb-3">AI Crime Intelligence Platform</div>
          <h2 className="text-slate-100 font-bold leading-tight mb-4"
            style={{ fontSize: "1.95rem", letterSpacing: "-0.025em" }}>
            Unified intelligence.<br />
            <span style={{ background: "linear-gradient(90deg,#60a5fa,#818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Actionable insights.
            </span>
          </h2>
          <p className="text-body-sm text-slate-500 leading-relaxed max-w-xs">
            Connecting FIR records, criminal networks, financial flows, and predictive analytics for all 6 Karnataka districts.
          </p>
        </div>

        {/* Feature list */}
        <div className="space-y-2.5">
          {[
            { icon: BrainCircuit, label: "Gemini 2.0 AI Engine",   sub: "Natural language FIR queries",    color: "#60a5fa" },
            { icon: Users,        label: "Criminal Network Graph",  sub: "Entity relationship mapping",     color: "#818cf8" },
            { icon: TrendingUp,   label: "Predictive Forecasting",  sub: "District-level early warnings",   color: "#34d399" },
            { icon: MapPin,       label: "6 Karnataka Districts",   sub: "Bengaluru, Mysuru, Mangaluru +3", color: "#f59e0b" },
          ].map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div key={i} initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.09, duration: 0.4 }}
                className="flex items-center gap-3 group">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-110"
                  style={{ background: f.color + "18", border: `1px solid ${f.color}28`, borderLeft: `2px solid ${f.color}60` }}>
                  <Icon className="w-3.5 h-3.5" style={{ color: f.color }} />
                </div>
                <div>
                  <div className="text-body-sm font-semibold text-slate-300 group-hover:text-slate-100 transition-colors">{f.label}</div>
                  <div className="text-micro text-slate-600">{f.sub}</div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Animated stats */}
        <div className="flex items-center gap-8 pt-2 border-t border-slate-800/40">
          {[
            { value: firs,      label: "Active FIRs"  },
            { value: districts, label: "Districts"    },
            { value: offenders, label: "Offenders"    },
          ].map((s, i) => (
            <div key={i}>
              <div className="text-heading2 font-bold text-slate-200 tabular-nums">{s.value}</div>
              <div className="text-micro text-slate-600 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Divider */}
      <div className="hidden lg:block w-px my-10 relative z-10"
        style={{ background: "linear-gradient(to bottom,transparent,rgba(30,41,59,0.6) 20%,rgba(30,41,59,0.6) 80%,transparent)" }} />

      {/* Right login panel */}
      <div className="flex-shrink-0 w-full lg:w-[490px] relative z-10 flex flex-col items-center justify-center px-6 sm:px-10 py-8 overflow-y-auto">

        {/* Mobile logo */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
          className="flex lg:hidden items-center gap-3 mb-6 self-start">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%)" }}>
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-body-sm font-bold text-slate-100">Karnataka State Police</div>
            <div className="text-micro text-blue-400/70 uppercase tracking-widest">Intelligence Division</div>
          </div>
        </motion.div>

        {/* Login card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-[430px]"
          style={{
            background: "rgba(8,15,34,0.92)",
            border: "1px solid rgba(30,41,59,0.9)",
            borderTop: "1px solid rgba(59,130,246,0.22)",
            borderRadius: 20, padding: "2.1rem",
            boxShadow: "0 32px 80px rgba(0,0,0,0.7), 0 0 60px rgba(37,99,235,0.07), 0 0 0 1px rgba(255,255,255,0.03) inset",
            backdropFilter: "blur(28px)",
          }}
        >
          {/* Card header */}
          <div className="mb-6">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%)", boxShadow: "0 3px 14px rgba(37,99,235,0.4)" }}>
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-body-sm font-bold text-slate-200">KSP Intelligence Hub</div>
                <div className="text-micro text-slate-500">Secure access portal</div>
              </div>
            </div>
            <h1 className="text-slate-100 font-bold leading-snug mb-1.5"
              style={{ fontSize: "1.4rem", letterSpacing: "-0.02em" }}>
              Sign in to your account
            </h1>
            <p className="text-caption text-slate-500">Select your clearance level to continue.</p>
          </div>

          {/* Role selector */}
          <div className="mb-5">
            <div className="text-label text-slate-500 mb-2.5">Select Clearance Level</div>
            <div className="space-y-1.5" role="radiogroup" aria-label="Clearance level">
              {DEMO_ROLES.map(role => (
                <React.Fragment key={role.id}>
                  <RoleCard role={role} isActive={selectedRole.id === role.id}
                    onSelect={() => { setSelectedRole(role); setError(""); }} />
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="mb-4" style={{ height: 1, background: "linear-gradient(90deg,transparent,rgba(30,41,59,0.8) 30%,rgba(30,41,59,0.8) 70%,transparent)" }} />

          {/* Credentials */}
          <div className="space-y-2.5 mb-5">
            <div>
              <label className="text-label text-slate-500 block mb-1.5" htmlFor="login-username">Username</label>
              <div className="flex items-center gap-2.5"
                style={{ background: "rgba(6,13,31,0.85)", border: "1px solid rgba(20,30,50,0.95)", borderRadius: 9, padding: "9px 13px" }}>
                <Lock className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                <span id="login-username" className="text-body-sm text-slate-400 font-mono flex-1 truncate">{credentials.username}</span>
                <span className="text-micro font-semibold px-1.5 py-0.5 rounded shrink-0"
                  style={{ background: "rgba(37,99,235,0.12)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.18)" }}>Demo</span>
              </div>
            </div>
            <div>
              <label className="text-label text-slate-500 block mb-1.5" htmlFor="login-password">Password</label>
              <div className="flex items-center gap-2.5"
                style={{ background: "rgba(6,13,31,0.85)", border: "1px solid rgba(20,30,50,0.95)", borderRadius: 9, padding: "9px 13px" }}>
                <Lock className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                <span id="login-password" className="text-body-sm text-slate-400 font-mono flex-1">
                  {showPassword ? credentials.password : "•".repeat(credentials.password.length)}
                </span>
                <button type="button" aria-label={showPassword ? "Hide" : "Show"}
                  onClick={() => setShowPassword(v => !v)}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}
                  className="text-slate-600 hover:text-slate-400 transition shrink-0 rounded">
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="alert-banner critical mb-4">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sign-in button */}
          <button type="button" className="login-btn" onClick={handleLogin} onKeyDown={handleKeyDown}
            disabled={isLoading} aria-label={`Sign in as ${selectedRole.title}`}>
            <AnimatePresence mode="wait">
              {loginStep === "authenticating" ? (
                <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex items-center gap-2 justify-center">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block shrink-0" />
                  Authenticating…
                </motion.span>
              ) : loginStep === "done" ? (
                <motion.span key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex items-center gap-2 justify-center">
                  <CheckCircle className="w-4 h-4 shrink-0" /> Verified — Loading Platform…
                </motion.span>
              ) : (
                <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex items-center gap-2 justify-center">
                  Access Intelligence Hub <ArrowRight className="w-4 h-4 shrink-0" />
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          <div className="flex items-start gap-2 mt-5 pt-4"
            style={{ borderTop: "1px solid rgba(15,23,42,0.9)" }}>
            <Shield className="w-3.5 h-3.5 text-slate-700 shrink-0 mt-0.5" />
            <p className="text-micro text-slate-700 leading-relaxed">
              Demonstration system. All access logged under DPDP Act. Unauthorised access is prohibited.
            </p>
          </div>
        </motion.div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          className="mt-5 text-center text-micro text-slate-700 font-mono">
          © 2026 KARNATAKA STATE POLICE · AI INTELLIGENCE DIVISION
        </motion.p>
      </div>
    </div>
  );
}
