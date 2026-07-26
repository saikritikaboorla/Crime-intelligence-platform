import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Shield, Lock, Eye, EyeOff, ArrowRight, CheckCircle,
  AlertTriangle, BrainCircuit, Users, MapPin, TrendingUp, Languages
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

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

// Network nodes for animated background graph
const BG_NODES = [
  { x: 12, y: 18, r: 3.2, t: "case"    },
  { x: 38, y: 10, r: 2.5, t: "suspect" },
  { x: 65, y: 22, r: 3.0, t: "case"    },
  { x: 85, y: 52, r: 2.2, t: "account" },
  { x: 52, y: 45, r: 3.8, t: "case"    },
  { x: 25, y: 55, r: 2.4, t: "suspect" },
  { x: 75, y: 70, r: 2.5, t: "account" },
  { x: 10, y: 72, r: 2.2, t: "victim"  },
  { x: 42, y: 80, r: 2.8, t: "suspect" },
  { x: 90, y: 35, r: 2.0, t: "victim"  },
  { x: 30, y: 32, r: 1.8, t: "account" },
  { x: 58, y: 88, r: 2.4, t: "case"    },
  { x: 18, y: 42, r: 2.0, t: "suspect" },
  { x: 70, y: 42, r: 2.2, t: "case"    },
  { x: 48, y: 62, r: 1.6, t: "victim"  },
  // Extra nodes for richer graph
  { x: 5,  y: 90, r: 1.5, t: "case"    },
  { x: 93, y: 15, r: 1.8, t: "suspect" },
  { x: 20, y: 78, r: 2.0, t: "account" },
  { x: 80, y: 85, r: 1.6, t: "victim"  },
  { x: 55, y: 5,  r: 2.2, t: "case"    },
  { x: 45, y: 28, r: 1.4, t: "suspect" },
  { x: 62, y: 60, r: 1.8, t: "account" },
  { x: 32, y: 68, r: 1.6, t: "victim"  },
  { x: 78, y: 22, r: 1.5, t: "case"    },
];

const BG_EDGES = [
  [0,1],[1,2],[2,4],[3,4],[4,5],[4,6],[5,7],[6,8],[0,5],[2,9],[1,10],[8,11],[0,12],[2,13],[4,14],[10,12],
  [15,7],[16,9],[17,7],[18,11],[19,1],[20,4],[21,6],[22,5],[23,13],[15,12],[16,23],[17,22],[19,20],[20,2],
];

function nodeStroke(t: string) {
  if (t === "case")    return "rgba(37,99,235,0.55)";
  if (t === "suspect") return "rgba(225,29,72,0.45)";
  if (t === "account") return "rgba(217,119,6,0.45)";
  return "rgba(16,185,129,0.45)";
}
function nodeFill(t: string) {
  if (t === "case")    return "rgba(30,58,138,0.3)";
  if (t === "suspect") return "rgba(136,19,55,0.25)";
  if (t === "account") return "rgba(120,53,15,0.25)";
  return "rgba(6,78,59,0.25)";
}

// ── Animated 3D Background ────────────────────────────────────────────────────
function Background3D() {
  const [mounted, setMounted] = useState(false);
  const [tick, setTick] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t); }, []);

  // Animate floating particles via canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width  = window.innerWidth;
    const H = canvas.height = window.innerHeight;

    const particles = Array.from({ length: 90 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.4 + 0.3,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      alpha: Math.random() * 0.45 + 0.05,
      hue: Math.random() > 0.7 ? 220 : Math.random() > 0.5 ? 260 : 200,
    }));

    // Data-stream horizontal lines
    const streams = Array.from({ length: 8 }, () => ({
      y: Math.random() * H,
      x: -300,
      speed: Math.random() * 0.8 + 0.3,
      alpha: Math.random() * 0.12 + 0.04,
      length: Math.random() * 220 + 80,
    }));

    let animId: number;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      // Draw connections between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(59,130,246,${0.06 * (1 - dist / 110)})`;
            ctx.lineWidth = 0.4;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw particles
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;

        ctx.beginPath();
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3);
        grad.addColorStop(0, `hsla(${p.hue},85%,65%,${p.alpha})`);
        grad.addColorStop(1, `hsla(${p.hue},85%,65%,0)`);
        ctx.fillStyle = grad;
        ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Data streams
      for (const s of streams) {
        s.x += s.speed;
        if (s.x > W + 300) s.x = -s.length - 100;
        const grad = ctx.createLinearGradient(s.x, s.y, s.x + s.length, s.y);
        grad.addColorStop(0, `rgba(59,130,246,0)`);
        grad.addColorStop(0.4, `rgba(59,130,246,${s.alpha})`);
        grad.addColorStop(1, `rgba(129,140,248,0)`);
        ctx.beginPath();
        ctx.strokeStyle = grad;
        ctx.lineWidth = 0.7;
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x + s.length, s.y);
        ctx.stroke();
      }

      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div
      className="absolute inset-0 pointer-events-none select-none overflow-hidden"
      aria-hidden="true"
      style={{ opacity: mounted ? 1 : 0, transition: "opacity 1.2s ease" }}
    >
      {/* ── CSS keyframes injected inline ── */}
      <style>{`
        @keyframes drift1    { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(25px,-20px) scale(1.08)} }
        @keyframes drift2    { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-30px,18px) scale(1.05)} }
        @keyframes drift3    { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(18px,28px) scale(1.06)} }
        @keyframes nodeFloat { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-8px)} }
        @keyframes lineFlow  { 0%{stroke-dashoffset:60} 100%{stroke-dashoffset:0} }
        @keyframes pulse-ring { 0%{transform:scale(1);opacity:0.5} 100%{transform:scale(2.2);opacity:0} }
        @keyframes scanline  { 0%{transform:translateY(-100%)} 100%{transform:translateY(100vh)} }
        @keyframes moveGrid3D {
          0%   { transform: perspective(900px) rotateX(68deg) translateY(0px) scale(1.6); }
          100% { transform: perspective(900px) rotateX(68deg) translateY(60px) scale(1.6); }
        }
      `}</style>

      {/* Dark executive midnight base */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(135deg, #020617 0%, #040b1a 35%, #06101f 65%, #020912 100%)",
      }} />

      {/* Canvas particle field */}
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />

      {/* Ambient glow orbs */}
      <div style={{
        position: "absolute", width: 900, height: 900,
        top: "40%", left: "42%", transform: "translate(-50%,-50%)",
        background: "radial-gradient(ellipse, rgba(29,78,216,0.09) 0%, transparent 62%)",
        borderRadius: "50%", animation: "drift1 32s ease-in-out infinite",
      }} />
      <div style={{
        position: "absolute", width: 600, height: 600,
        top: "8%", right: "5%",
        background: "radial-gradient(ellipse, rgba(79,70,229,0.07) 0%, transparent 60%)",
        borderRadius: "50%", animation: "drift2 42s ease-in-out infinite",
      }} />
      <div style={{
        position: "absolute", width: 500, height: 500,
        bottom: "5%", left: "5%",
        background: "radial-gradient(ellipse, rgba(16,185,129,0.045) 0%, transparent 60%)",
        borderRadius: "50%", animation: "drift3 36s ease-in-out infinite",
      }} />

      {/* Moving 3D Perspective Grid */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        <svg
          style={{
            position: "absolute", width: "100%", height: "200%", top: "-50%",
            transformOrigin: "50% 100%",
            animation: "moveGrid3D 16s linear infinite",
            opacity: 0.65,
          }}
          preserveAspectRatio="none"
        >
          <defs>
            <pattern id="grid3dDark" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(37,99,235,0.10)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid3dDark)" />
        </svg>
      </div>

      {/* Scanline sweep effect */}
      <div style={{
        position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none",
      }}>
        <div style={{
          position: "absolute", left: 0, right: 0, height: 2,
          background: "linear-gradient(90deg, transparent, rgba(59,130,246,0.04), rgba(59,130,246,0.08), rgba(59,130,246,0.04), transparent)",
          animation: "scanline 12s linear infinite",
        }} />
      </div>

      {/* Floating Network Nodes + Pulsing Rings */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          filter: "blur(0.15px)", opacity: 0.55,
        }}
      >
        {BG_EDGES.map(([a, b], i) => {
          const na = BG_NODES[a], nb = BG_NODES[b];
          if (!na || !nb) return null;
          return (
            <line key={i}
              x1={na.x} y1={na.y} x2={nb.x} y2={nb.y}
              stroke="rgba(37,99,235,0.20)" strokeWidth="0.18"
              strokeDasharray="2.5 2.5"
              style={{ animation: `lineFlow ${4 + (i % 4) * 0.8}s linear ${(i * 0.35) % 2}s infinite` }}
            />
          );
        })}
        {BG_NODES.map((node, i) => (
          <g key={i} style={{ animation: `nodeFloat ${6 + (i % 5) * 1.2}s ease-in-out ${(i * 0.6) % 3}s infinite` }}>
            {/* Outer pulsing ring */}
            <circle cx={node.x} cy={node.y} r={node.r + 4}
              fill="none" stroke={nodeStroke(node.t)} strokeWidth="0.12"
              style={{ animation: `pulse-ring ${3 + (i % 3) * 0.7}s ease-out ${(i * 0.5) % 2}s infinite`, transformOrigin: `${node.x}% ${node.y}%` }}
              opacity="0.4"
            />
            {/* Mid ring */}
            <circle cx={node.x} cy={node.y} r={node.r + 2}
              fill="none" stroke={nodeStroke(node.t)} strokeWidth="0.15" opacity="0.3" />
            {/* Core node */}
            <circle cx={node.x} cy={node.y} r={node.r}
              fill={nodeFill(node.t)} stroke={nodeStroke(node.t)} strokeWidth="0.35" />
          </g>
        ))}
      </svg>

      {/* Corner hex decorations */}
      <svg style={{ position: "absolute", top: 0, left: 0, width: 200, height: 200, opacity: 0.06 }} viewBox="0 0 200 200">
        <polygon points="100,10 160,40 160,110 100,140 40,110 40,40" fill="none" stroke="#3b82f6" strokeWidth="0.8"/>
        <polygon points="100,30 145,52 145,98 100,120 55,98 55,52" fill="none" stroke="#3b82f6" strokeWidth="0.5"/>
      </svg>
      <svg style={{ position: "absolute", bottom: 0, right: 0, width: 180, height: 180, opacity: 0.05 }} viewBox="0 0 200 200">
        <polygon points="100,10 160,40 160,110 100,140 40,110 40,40" fill="none" stroke="#818cf8" strokeWidth="0.8"/>
      </svg>
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
  const { t } = useLanguage();
  const roleTitle = t(`login.roles.${role.id}.title`, role.title);
  const roleDesc = t(`login.roles.${role.id}.desc`, role.description);

  return (
    <button
      type="button" role="radio" aria-checked={isActive} onClick={onSelect}
      className="w-full text-left transition-all duration-150"
      style={{
        background: isActive ? "rgba(37,99,235,0.1)" : "rgba(6,13,31,0.65)",
        border: `1px solid ${isActive ? "rgba(59,130,246,0.45)" : "rgba(30,41,59,0.9)"}`,
        borderRadius: 14, padding: "14px 18px",
        boxShadow: isActive ? "0 0 0 1px rgba(59,130,246,0.12) inset, 0 4px 16px rgba(37,99,235,0.1)" : "none",
        outline: "none",
      }}
    >
      <div className="flex items-center gap-4">
        <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 text-caption font-bold ${role.iconBg} ${role.iconColor}`}>
          {role.initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-body-sm font-semibold text-slate-200 leading-none">{roleTitle}</span>
            <span className={`badge ${role.badgeClass} shrink-0`}>{role.badge}</span>
          </div>
          <div className="text-micro text-slate-500 mt-1 leading-snug">{roleDesc}</div>
        </div>
        <div
          className="w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all duration-150"
          style={{ borderColor: isActive ? "#3b82f6" : "rgba(51,65,85,0.6)", background: isActive ? "#3b82f6" : "transparent" }}
        >
          {isActive && <div className="w-2 h-2 rounded-full bg-white" />}
        </div>
      </div>
    </button>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function LoginPage({ onLogin }: LoginPageProps) {
  const { language, setLanguage, t } = useLanguage();
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
        className="hidden lg:flex flex-col justify-center gap-6 relative z-10 flex-1 px-14 py-12"
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%)", boxShadow: "0 4px 20px rgba(37,99,235,0.4)" }}>
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-body-sm font-bold text-slate-100 tracking-tight">{t("common.appName")}</div>
            <div className="text-micro text-blue-400/70 tracking-widest uppercase mt-0.5">{t("common.appSubTitle")}</div>
          </div>
        </div>

        {/* Headline — smaller font size */}
        <div>
          <div className="text-label text-blue-400/70 mb-2" style={{ fontSize: "0.75rem" }}>{t("common.platformTitle")}</div>
          <h2 className="text-slate-100 font-bold leading-tight mb-3"
            style={{ fontSize: "1.5rem", letterSpacing: "-0.025em" }}>
            {t("login.headline")}<br />
            <span style={{ background: "linear-gradient(90deg,#60a5fa,#818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              {t("login.headlineSub")}
            </span>
          </h2>
        </div>

        {/* Feature list */}
        <div className="space-y-2">
          {[
            { icon: BrainCircuit, label: t("login.features.gemini"),   sub: t("login.features.geminiSub"),    color: "#60a5fa" },
            { icon: Users,        label: t("login.features.graph"),     sub: t("login.features.graphSub"),     color: "#818cf8" },
            { icon: TrendingUp,   label: t("login.features.forecast"),  sub: t("login.features.forecastSub"),  color: "#34d399" },
            { icon: MapPin,       label: t("login.features.districts"), sub: t("login.features.districtsSub"), color: "#f59e0b" },
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
                  <div className="font-semibold text-slate-300 group-hover:text-slate-100 transition-colors" style={{ fontSize: "0.8125rem" }}>{f.label}</div>
                  <div className="text-slate-500" style={{ fontSize: "0.75rem" }}>{f.sub}</div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Animated stats */}
        <div className="flex items-center gap-8 pt-2 border-t border-slate-800/40">
          {[
            { value: firs,      label: t("login.stats.activeFirs")  },
            { value: districts, label: t("login.stats.districts")    },
            { value: offenders, label: t("login.stats.offenders")    },
          ].map((s, i) => (
            <div key={i}>
              <div className="text-heading2 font-bold text-slate-200 tabular-nums">{s.value}</div>
              <div className="text-slate-500 mt-0.5" style={{ fontSize: "0.75rem" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Divider */}
      <div className="hidden lg:block w-px my-10 relative z-10"
        style={{ background: "linear-gradient(to bottom,transparent,rgba(30,41,59,0.6) 20%,rgba(30,41,59,0.6) 80%,transparent)" }} />

      {/* Right login panel — scrollable so nothing gets cut off */}
      <div className="flex-shrink-0 w-full lg:w-[540px] relative z-10 flex flex-col items-center px-8 sm:px-12 py-8 overflow-y-auto">
        {/* Spacer so content can be scrolled up to */}
        <div className="flex-shrink-0 h-6 w-full" />

        {/* Top bar with language switcher */}
        <div className="w-full max-w-[480px] flex justify-between items-center mb-4">
          <div className="flex lg:hidden items-center gap-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%)" }}>
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="text-body-sm font-bold text-slate-100">{t("common.appName")}</div>
          </div>
          <div className="ml-auto flex items-center gap-2 bg-slate-900/90 p-1.5 rounded-xl border border-slate-700/60 shadow-lg">
            <Languages className="w-4 h-4 text-blue-400 ml-2 mr-1" />
            <button
              type="button"
              onClick={() => setLanguage("en")}
              className={`px-3 py-1.5 text-sm font-bold rounded-lg transition ${language === "en" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-slate-200"}`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguage("kn")}
              className={`px-3 py-1.5 text-sm font-bold rounded-lg transition ${language === "kn" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-slate-200"}`}
            >
              ಕನ್ನಡ
            </button>
          </div>
        </div>

        {/* Login card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-[480px]"
          style={{
            background: "rgba(8,15,34,0.92)",
            border: "1px solid rgba(30,41,59,0.9)",
            borderTop: "1px solid rgba(59,130,246,0.22)",
            borderRadius: 24, padding: "2.5rem",
            boxShadow: "0 32px 80px rgba(0,0,0,0.7), 0 0 60px rgba(37,99,235,0.07), 0 0 0 1px rgba(255,255,255,0.03) inset",
            backdropFilter: "blur(28px)",
          }}
        >
          {/* Card header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%)", boxShadow: "0 3px 14px rgba(37,99,235,0.4)" }}>
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="text-body-sm font-bold text-slate-200">{t("login.portalTitle")}</div>
                <div className="text-micro text-slate-500">{t("login.portalSub")}</div>
              </div>
            </div>
            <h1 className="text-slate-100 font-bold leading-snug mb-2"
              style={{ fontSize: "1.6rem", letterSpacing: "-0.02em" }}>
              {t("login.title")}
            </h1>
            <p className="text-caption text-slate-500">{t("login.subtitle")}</p>
          </div>

          {/* Role selector */}
          <div className="mb-6">
            <div className="text-label text-slate-500 mb-3">{t("login.selectClearance")}</div>
            <div className="space-y-2" role="radiogroup" aria-label="Clearance level">
              {DEMO_ROLES.map(role => (
                <React.Fragment key={role.id}>
                  <RoleCard role={role} isActive={selectedRole.id === role.id}
                    onSelect={() => { setSelectedRole(role); setError(""); }} />
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="mb-5" style={{ height: 1, background: "linear-gradient(90deg,transparent,rgba(30,41,59,0.8) 30%,rgba(30,41,59,0.8) 70%,transparent)" }} />

          {/* Credentials */}
          <div className="space-y-3 mb-6">
            <div>
              <label className="text-label text-slate-500 block mb-2" htmlFor="login-username">{t("login.username")}</label>
              <div className="flex items-center gap-3"
                style={{ background: "rgba(6,13,31,0.85)", border: "1px solid rgba(20,30,50,0.95)", borderRadius: 10, padding: "12px 16px" }}>
                <Lock className="w-4 h-4 text-slate-600 shrink-0" />
                <span id="login-username" className="text-body-sm text-slate-400 font-mono flex-1 truncate">{credentials.username}</span>
                <span className="text-micro font-semibold px-2 py-1 rounded shrink-0"
                  style={{ background: "rgba(37,99,235,0.12)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.18)" }}>{t("login.demoBadge")}</span>
              </div>
            </div>
            <div>
              <label className="text-label text-slate-500 block mb-2" htmlFor="login-password">{t("login.password")}</label>
              <div className="flex items-center gap-3"
                style={{ background: "rgba(6,13,31,0.85)", border: "1px solid rgba(20,30,50,0.95)", borderRadius: 10, padding: "12px 16px" }}>
                <Lock className="w-4 h-4 text-slate-600 shrink-0" />
                <span id="login-password" className="text-body-sm text-slate-400 font-mono flex-1">
                  {showPassword ? credentials.password : "•".repeat(credentials.password.length)}
                </span>
                <button type="button" aria-label={showPassword ? t("login.hide") : t("login.show")}
                  onClick={() => setShowPassword(v => !v)}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
                  className="text-slate-600 hover:text-slate-400 transition shrink-0 rounded">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="alert-banner critical mb-5">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
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
                  className="flex items-center gap-3 justify-center">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block shrink-0" />
                  {t("login.authenticating")}
                </motion.span>
              ) : loginStep === "done" ? (
                <motion.span key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex items-center gap-3 justify-center">
                  <CheckCircle className="w-5 h-5 shrink-0" /> {t("login.verified")}
                </motion.span>
              ) : (
                <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex items-center gap-3 justify-center">
                  {t("login.signInBtn")} <ArrowRight className="w-5 h-5 shrink-0" />
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          <div className="flex items-start gap-3 mt-6 pt-5"
            style={{ borderTop: "1px solid rgba(15,23,42,0.9)" }}>
            <Shield className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
            <p className="text-micro text-slate-700 leading-relaxed">
              {t("login.disclaimer")}
            </p>
          </div>
        </motion.div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          className="mt-6 mb-8 text-center text-micro text-slate-700 font-mono">
          {t("login.footer")}
        </motion.p>

        {/* Bottom spacer so footer isn't glued to bottom edge */}
        <div className="flex-shrink-0 h-6 w-full" />
      </div>
    </div>
  );
}
