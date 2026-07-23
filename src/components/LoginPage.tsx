import React, { useState, useEffect } from "react";
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

// ── Demo roles (unchanged — all functionality preserved) ──────────────────────
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

// ── Background network illustration ───────────────────────────────────────────
// Minimal, low-opacity network — purely decorative, never competes with login card
const BG_NODES = [
  { x: 18, y: 22, r: 3.5, type: "case"    },
  { x: 42, y: 14, r: 2.8, type: "suspect" },
  { x: 68, y: 28, r: 3.2, type: "case"    },
  { x: 82, y: 55, r: 2.5, type: "account" },
  { x: 55, y: 48, r: 4.0, type: "case"    },
  { x: 28, y: 58, r: 2.6, type: "suspect" },
  { x: 72, y: 72, r: 2.8, type: "account" },
  { x: 15, y: 75, r: 2.4, type: "victim"  },
  { x: 44, y: 82, r: 3.0, type: "suspect" },
  { x: 88, y: 38, r: 2.2, type: "victim"  },
  { x: 35, y: 35, r: 2.0, type: "account" },
  { x: 60, y: 88, r: 2.6, type: "case"    },
];

const BG_EDGES = [
  [0,1],[1,2],[2,4],[3,4],[4,5],[4,6],[5,7],[6,8],[0,5],[2,9],[1,10],[8,11],
];

function bgNodeStroke(type: string) {
  switch (type) {
    case "case":    return "rgba(59,130,246,0.5)";
    case "suspect": return "rgba(239,68,68,0.4)";
    case "account": return "rgba(245,158,11,0.4)";
    case "victim":  return "rgba(16,185,129,0.4)";
    default:        return "rgba(100,116,139,0.3)";
  }
}

function bgNodeFill(type: string) {
  switch (type) {
    case "case":    return "rgba(30,64,175,0.25)";
    case "suspect": return "rgba(153,27,27,0.2)";
    case "account": return "rgba(146,64,14,0.2)";
    case "victim":  return "rgba(6,95,70,0.2)";
    default:        return "rgba(30,41,59,0.2)";
  }
}

// Subtle floating animation applied per node via inline style delay
function floatStyle(i: number): React.CSSProperties {
  const duration = 5 + (i % 4) * 1.5;
  const delay = (i * 0.7) % 3;
  return {
    animation: `bgNodeFloat ${duration}s ease-in-out ${delay}s infinite`,
  };
}

function BackgroundIllustration() {
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), 100); return () => clearTimeout(t); }, []);

  return (
    <div
      className="absolute inset-0 pointer-events-none select-none overflow-hidden"
      aria-hidden="true"
      style={{ opacity: ready ? 1 : 0, transition: "opacity 1.2s ease" }}
    >
      {/* Radial glow orbs — very subtle */}
      <div style={{
        position: "absolute", width: 600, height: 600,
        top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        background: "radial-gradient(ellipse, rgba(37,99,235,0.055) 0%, transparent 65%)",
        borderRadius: "50%",
      }} />
      <div style={{
        position: "absolute", width: 360, height: 360,
        top: "15%", right: "8%",
        background: "radial-gradient(ellipse, rgba(99,102,241,0.04) 0%, transparent 60%)",
        borderRadius: "50%",
      }} />
      <div style={{
        position: "absolute", width: 280, height: 280,
        bottom: "10%", left: "5%",
        background: "radial-gradient(ellipse, rgba(16,185,129,0.03) 0%, transparent 60%)",
        borderRadius: "50%",
      }} />

      {/* Network SVG — low opacity, blurred */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        style={{
          position: "absolute", inset: 0,
          width: "100%", height: "100%",
          filter: "blur(0.4px)",
          opacity: 0.55,
        }}
      >
        {/* Edges first (behind nodes) */}
        {BG_EDGES.map(([a, b], i) => {
          const na = BG_NODES[a], nb = BG_NODES[b];
          return (
            <line
              key={i}
              x1={na.x} y1={na.y} x2={nb.x} y2={nb.y}
              stroke="rgba(59,130,246,0.18)"
              strokeWidth="0.25"
            />
          );
        })}

        {/* Nodes */}
        {BG_NODES.map((node, i) => (
          <g key={i} style={floatStyle(i)}>
            <circle
              cx={node.x} cy={node.y} r={node.r + 2.5}
              fill="none"
              stroke={bgNodeStroke(node.type)}
              strokeWidth="0.15"
              opacity="0.4"
            />
            <circle
              cx={node.x} cy={node.y} r={node.r}
              fill={bgNodeFill(node.type)}
              stroke={bgNodeStroke(node.type)}
              strokeWidth="0.3"
            />
          </g>
        ))}
      </svg>
    </div>
  );
}

// ── Role card ─────────────────────────────────────────────────────────────────
function RoleCard({
  role,
  isActive,
  onSelect,
}: {
  role: DemoRole;
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={isActive}
      onClick={onSelect}
      className="w-full text-left transition-all duration-150"
      style={{
        background: isActive ? "rgba(37,99,235,0.08)" : "rgba(6,13,31,0.6)",
        border: `1px solid ${isActive ? "rgba(59,130,246,0.4)" : "rgba(15,23,42,0.9)"}`,
        borderRadius: 12,
        padding: "12px 14px",
        boxShadow: isActive ? "0 0 0 1px rgba(59,130,246,0.1) inset" : "none",
        outline: "none",
      }}
    >
      <div className="flex items-center gap-3">
        {/* Initials avatar */}
        <div
          className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 text-caption font-bold ${role.iconBg} ${role.iconColor}`}
        >
          {role.initials}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-body-sm font-semibold text-slate-200 leading-none">{role.title}</span>
            <span className={`badge ${role.badgeClass} shrink-0`}>{role.badge}</span>
          </div>
          <div className="text-micro text-slate-500 mt-1 leading-snug">{role.description}</div>
        </div>

        {/* Selection indicator */}
        <div
          className="w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-all duration-150"
          style={{
            borderColor: isActive ? "#3b82f6" : "rgba(51,65,85,0.6)",
            background: isActive ? "#3b82f6" : "transparent",
          }}
        >
          {isActive && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
        </div>
      </div>
    </button>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function LoginPage({ onLogin }: LoginPageProps) {
  const [selectedRole, setSelectedRole] = useState<DemoRole>(DEMO_ROLES[2]); // default: Investigator
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading]       = useState(false);
  const [loginStep, setLoginStep]       = useState<"idle" | "authenticating" | "done">("idle");
  const [error, setError]               = useState("");

  // Auto-populated credentials derived from selected role (unchanged)
  const credentials = {
    username: `demo.${selectedRole.id}@ksp.gov.in`,
    password: "KSP@Demo2026",
  };

  const handleLogin = async () => {
    if (loginStep !== "idle") return;
    setError("");
    setLoginStep("authenticating");
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setLoginStep("done");
    await new Promise(r => setTimeout(r, 400));
    onLogin(selectedRole);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div
      className="h-screen w-screen overflow-hidden flex"
      style={{ background: "#060d1f", fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}
    >
      {/* ── Fixed background illustration ── */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <BackgroundIllustration />
      </div>

      {/* ── Left branding panel (desktop only) ── */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="hidden lg:flex flex-col justify-center gap-8 relative z-10 flex-1 px-16 py-12"
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)", boxShadow: "0 4px 16px rgba(37,99,235,0.3)" }}
          >
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
          <h2 className="text-slate-100 font-bold leading-tight mb-4" style={{ fontSize: "1.875rem", letterSpacing: "-0.025em" }}>
            Unified intelligence.<br />
            <span style={{ color: "#60a5fa" }}>Actionable insights.</span>
          </h2>
          <p className="text-body-sm text-slate-500 leading-relaxed max-w-xs">
            Connecting FIR records, criminal networks, financial flows, and predictive analytics for all 6 Karnataka districts.
          </p>
        </div>

        {/* Feature list */}
        <div className="space-y-2.5">
          {[
            { icon: BrainCircuit, label: "Gemini 2.0 AI Engine",  sub: "Natural language FIR queries"    },
            { icon: Users,        label: "Criminal Network Graph", sub: "Entity relationship mapping"     },
            { icon: TrendingUp,   label: "Predictive Forecasting", sub: "District-level early warnings"   },
            { icon: MapPin,       label: "6 Karnataka Districts",  sub: "Bengaluru, Mysuru, Mangaluru +3" },
          ].map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.09, duration: 0.4 }}
                className="flex items-center gap-3"
              >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "rgba(37,99,235,0.1)", border: "1px solid rgba(59,130,246,0.15)" }}>
                  <Icon className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <div>
                  <div className="text-body-sm font-semibold text-slate-300">{f.label}</div>
                  <div className="text-micro text-slate-600">{f.sub}</div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-8 pt-2 border-t border-slate-800/40">
          {[{ value: "8", label: "Active FIRs" }, { value: "6", label: "Districts" }, { value: "3", label: "Offenders" }].map((s, i) => (
            <div key={i}>
              <div className="text-heading2 font-bold text-slate-200">{s.value}</div>
              <div className="text-micro text-slate-600 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Thin vertical divider (desktop) ── */}
      <div className="hidden lg:block w-px my-10 relative z-10"
        style={{ background: "linear-gradient(to bottom, transparent, rgba(30,41,59,0.5) 20%, rgba(30,41,59,0.5) 80%, transparent)" }} />

      {/* ── Right login panel ── */}
      <div className="flex-shrink-0 w-full lg:w-[480px] relative z-10 flex flex-col items-center justify-center px-6 sm:px-10 py-8 overflow-y-auto">

        {/* Mobile logo */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex lg:hidden items-center gap-3 mb-6 self-start"
        >
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)" }}>
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-body-sm font-bold text-slate-100">Karnataka State Police</div>
            <div className="text-micro text-blue-400/70 uppercase tracking-widest">Intelligence Division</div>
          </div>
        </motion.div>

        {/* ── Login card ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="w-full max-w-[420px]"
          style={{
            background: "rgba(13,21,38,0.93)",
            border: "1px solid rgba(30,41,59,0.9)",
            borderRadius: 18,
            padding: "2rem",
            boxShadow: "0 24px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.02) inset",
            backdropFilter: "blur(24px)",
          }}
        >
          {/* Card header */}
          <div className="mb-6">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)", boxShadow: "0 3px 12px rgba(37,99,235,0.35)" }}>
                <Shield className="w-4.5 h-4.5 text-white" />
              </div>
              <div>
                <div className="text-body-sm font-bold text-slate-200">KSP Intelligence Hub</div>
                <div className="text-micro text-slate-500">Secure access portal</div>
              </div>
            </div>
            <h1 className="text-slate-100 font-bold leading-snug mb-1.5" style={{ fontSize: "1.375rem", letterSpacing: "-0.02em" }}>
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
                  <RoleCard
                    role={role}
                    isActive={selectedRole.id === role.id}
                    onSelect={() => { setSelectedRole(role); setError(""); }}
                  />
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="mb-4" style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(30,41,59,0.8) 30%, rgba(30,41,59,0.8) 70%, transparent)" }} />

          {/* Credentials */}
          <div className="space-y-2.5 mb-5">
            <div>
              <label className="text-label text-slate-500 block mb-1.5" htmlFor="login-username">Username</label>
              <div className="flex items-center gap-2.5"
                style={{ background: "rgba(6,13,31,0.8)", border: "1px solid rgba(15,23,42,0.95)", borderRadius: 9, padding: "9px 13px" }}>
                <Lock className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                <span id="login-username" className="text-body-sm text-slate-400 font-mono flex-1 truncate">{credentials.username}</span>
                <span className="text-micro font-semibold px-1.5 py-0.5 rounded shrink-0"
                  style={{ background: "rgba(37,99,235,0.1)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.15)" }}>Demo</span>
              </div>
            </div>
            <div>
              <label className="text-label text-slate-500 block mb-1.5" htmlFor="login-password">Password</label>
              <div className="flex items-center gap-2.5"
                style={{ background: "rgba(6,13,31,0.8)", border: "1px solid rgba(15,23,42,0.95)", borderRadius: 9, padding: "9px 13px" }}>
                <Lock className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                <span id="login-password" className="text-body-sm text-slate-400 font-mono flex-1">
                  {showPassword ? credentials.password : "•".repeat(credentials.password.length)}
                </span>
                <button type="button" aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword(v => !v)}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}
                  className="text-slate-600 hover:text-slate-400 transition shrink-0 rounded">
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          {/* Error */}
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
                <motion.span key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2 justify-center">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block shrink-0" />
                  Authenticating…
                </motion.span>
              ) : loginStep === "done" ? (
                <motion.span key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 justify-center">
                  <CheckCircle className="w-4 h-4 shrink-0" /> Verified — Loading…
                </motion.span>
              ) : (
                <motion.span key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 justify-center">
                  Access Intelligence Hub <ArrowRight className="w-4 h-4 shrink-0" />
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          {/* Footer note */}
          <div className="flex items-start gap-2 mt-5 pt-4"
            style={{ borderTop: "1px solid rgba(15,23,42,0.9)" }}>
            <Shield className="w-3.5 h-3.5 text-slate-700 shrink-0 mt-0.5" />
            <p className="text-micro text-slate-700 leading-relaxed">
              Demonstration system. Access logged under DPDP Act. Unauthorised access prohibited.
            </p>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
          className="mt-5 text-center text-micro text-slate-700 font-mono"
        >
          © 2026 KARNATAKA STATE POLICE · AI INTELLIGENCE DIVISION
        </motion.p>
      </div>
    </div>
  );
}
