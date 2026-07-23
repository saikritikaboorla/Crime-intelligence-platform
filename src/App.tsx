import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Shield,
  MessageSquare,
  Users,
  TrendingUp,
  LineChart,
  UserCheck,
  BrainCircuit,
  DollarSign,
  AlertTriangle,
  History,
  Activity,
  User,
  MapPin,
  FileText,
  Volume2,
  VolumeX,
  Mic,
  Download,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  Sparkles,
  Lock,
  Eye,
  RefreshCw,
  Menu,
  X,
  LogOut
} from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ScatterChart, Scatter, LabelList } from "recharts";
import { Message, UserRole, AuditLog } from "./types";
import NetworkGraph from "./components/NetworkGraph";
import MissionControl from "./components/MissionControl";
import SociologicalInsights from "./components/SociologicalInsights";
import LoginPage from "./components/LoginPage";
import { mockFinancialTransactions } from "./mockData";

export default function App() {
  // Auth gate
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Roles and clearance states
  const [activeRole, setActiveRole] = useState<UserRole>("Investigator");
  const [selectedLanguage, setSelectedLanguage] = useState<"en" | "kn">("en");
  const [activeTab, setActiveTab] = useState<string>("mission");
  
  // Conversational AI state
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg_init",
      sender: "bot",
      text: "KSP Crime Intelligence core active. Ready to assist, Investigator. Ask about FIR status, suspect records (e.g., 'Ramesh Kumar'), cyber phishing trails, or location analysis. Support is bilingual (English/ಕನ್ನಡ).",
      timestamp: new Date().toLocaleTimeString(),
      language: "en"
    }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentCitation, setCurrentCitation] = useState<any | null>(null);

  // Dynamic analytics data state
  const [trendData, setTrendData] = useState<any>({ crimeByMonth: [], crimeByType: [], hotspots: [] });
  const [networkData, setNetworkData] = useState<any>({ nodes: [], edges: [] });
  const [socioData, setSocioData] = useState<any[]>([]);
  const [offenders, setOffenders] = useState<any[]>([]);
  const [selectedOffender, setSelectedOffender] = useState<any | null>(null);
  
  // Decision support state
  const [selectedCaseId, setSelectedCaseId] = useState<number>(1001);
  const [decisionSupport, setDecisionSupport] = useState<any | null>(null);
  
  // Forecasting and warning state
  const [forecasting, setForecasting] = useState<any>({ warnings: [], hotspotsRisk: [] });
  
  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [systemAlertsCount, setSystemAlertsCount] = useState(3);
  const [showHelp, setShowHelp] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // References
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const speechSynthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    document.title = "Crime Intelligence";
    speechSynthRef.current = window.speechSynthesis;
    // Initial fetch of analytical components
    fetchTrends();
    fetchNetwork();
    fetchSocio();
    fetchOffenders();
    fetchDecisionSupport(1001);
    fetchForecasting();
    fetchAuditLogs();
  }, []);

  useEffect(() => {
    // Auto scroll chat
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Log audit event on server and local
  const logAuditEvent = async (actionType: string, details: string, queryText?: string) => {
    try {
      const res = await fetch("/api/audit-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userRole: activeRole,
          actionType,
          details,
          query: queryText
        })
      });
      const newLog = await res.json();
      setAuditLogs(prev => [newLog, ...prev]);
    } catch (err) {
      console.error("Audit log error:", err);
    }
  };

  // Switch role and log
  const handleRoleChange = (role: UserRole) => {
    setActiveRole(role);
    logAuditEvent("Clearance Change", `Switched security clearance level to ${role}.`);
  };

  // Tab change and log
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    logAuditEvent("Navigate Tab", `Accessed ${tab.toUpperCase()} analysis panel.`);
  };

  // Fetch backend analytics
  const fetchTrends = async () => {
    try {
      const res = await fetch("/api/analytics/trends");
      const data = await res.json();
      setTrendData(data);
    } catch (err) {
      console.error("Error fetching trends:", err);
    }
  };

  const fetchNetwork = async () => {
    try {
      const res = await fetch("/api/analytics/network");
      const data = await res.json();
      setNetworkData(data);
    } catch (err) {
      console.error("Error fetching network:", err);
    }
  };

  const fetchSocio = async () => {
    try {
      const res = await fetch("/api/analytics/sociological");
      const data = await res.json();
      setSocioData(data);
    } catch (err) {
      console.error("Error fetching socio:", err);
    }
  };

  const fetchOffenders = async () => {
    try {
      const res = await fetch("/api/analytics/offenders");
      const data = await res.json();
      setOffenders(data);
      if (data.length > 0) setSelectedOffender(data[0]);
    } catch (err) {
      console.error("Error fetching offenders:", err);
    }
  };

  const fetchDecisionSupport = async (caseId: number) => {
    try {
      const res = await fetch(`/api/analytics/decision-support/${caseId}`);
      const data = await res.json();
      setDecisionSupport(data);
    } catch (err) {
      console.error("Error fetching decision support:", err);
    }
  };

  const fetchForecasting = async () => {
    try {
      const res = await fetch("/api/analytics/forecasting");
      const data = await res.json();
      setForecasting(data);
    } catch (err) {
      console.error("Error fetching forecasting:", err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch("/api/audit-logs");
      const data = await res.json();
      setAuditLogs(data);
    } catch (err) {
      console.error("Error fetching audit logs:", err);
    }
  };

  // Chat Submission
  const handleSendMessage = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const query = customText || chatInput;
    if (!query.trim()) return;

    const userMsg: Message = {
      id: `msg_${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString(),
      language: selectedLanguage
    };

    setMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: query,
          history: messages,
          language: selectedLanguage,
          userRole: activeRole
        })
      });

      const data = await res.json();
      const botMsg: Message = {
        id: `msg_bot_${Date.now()}`,
        sender: "bot",
        text: data.text,
        timestamp: new Date().toLocaleTimeString(),
        language: data.language || "en",
        citations: data.citations
      };

      setMessages(prev => [...prev, botMsg]);
      
      // Auto speak if enabled
      if (isSpeaking) {
        speakResponse(data.text, data.language);
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setMessages(prev => [
        ...prev,
        {
          id: `msg_err_${Date.now()}`,
          sender: "bot",
          text: "Intelligence server connection timeout. Simulated fallbacks active.",
          timestamp: new Date().toLocaleTimeString(),
          language: "en"
        }
      ]);
    } finally {
      setIsChatLoading(false);
      // Reload audit logs to sync
      fetchAuditLogs();
    }
  };

  // Speech to Text (STT) voice recording
  const recognitionRef = useRef<any>(null);

  const startVoiceInput = () => {
    // If already listening, stop the current session
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    // Don't start if AI is already processing
    if (isChatLoading) {
      showToast("Please wait for the current query to complete.", "info");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast("Voice recognition is not supported in this browser. Try Chrome or Edge.", "error");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = selectedLanguage === "kn" ? "kn-IN" : "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setIsListening(true);
      logAuditEvent("Voice Start", "Initiated voice speech translation input channel.");
    };

    recognition.onresult = (event: any) => {
      const speechToText = event.results[0][0].transcript;
      setChatInput(speechToText);
      setIsListening(false);
      recognitionRef.current = null;
      handleSendMessage(undefined, speechToText);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
      recognitionRef.current = null;
      if (event.error === "not-allowed" || event.error === "permission-denied") {
        showToast("Microphone access denied. Please allow microphone permissions and try again.", "error");
      } else if (event.error === "no-speech") {
        showToast("No speech detected. Please try again and speak clearly.", "info");
      } else if (event.error === "network") {
        showToast("Network error during voice recognition. Please check your connection.", "error");
      } else if (event.error !== "aborted") {
        showToast("Voice recognition error. Please try again.", "error");
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    try {
      recognition.start();
    } catch (err) {
      setIsListening(false);
      recognitionRef.current = null;
      showToast("Could not start voice recognition. Please try again.", "error");
    }
  };

  // Text to Speech (TTS) reading
  const speakResponse = (text: string, langCode: string) => {
    if (!speechSynthRef.current) return;
    speechSynthRef.current.cancel(); // Stop current speech
    
    // Clean markdown before speaking
    const cleanedText = text.replace(/[*#_`]/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanedText);
    utterance.lang = langCode === "kn" ? "kn-IN" : "en-US";
    
    // Find matching Indian/Kannada voice if possible
    const voices = speechSynthRef.current.getVoices();
    const matchedVoice = voices.find(v => v.lang.includes(langCode === "kn" ? "kn" : "en-IN"));
    if (matchedVoice) utterance.voice = matchedVoice;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    speechSynthRef.current.speak(utterance);
  };

  const toggleSpeakingState = () => {
    if (isSpeaking) {
      speechSynthRef.current?.cancel();
      setIsSpeaking(false);
    } else {
      // Speak the last bot message
      const lastBotMsg = [...messages].reverse().find(m => m.sender === "bot");
      if (lastBotMsg) {
        speakResponse(lastBotMsg.text, lastBotMsg.language);
      }
    }
  };

  // Download printable transcript (FR-1)
  const downloadChatHistory = () => {
    logAuditEvent("PDF Export", "Triggered conversation history transcript local packaging.");
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const formattedMessages = messages
      .map(
        m => `
      <div style="margin-bottom: 20px; padding: 15px; border-radius: 8px; background-color: ${
        m.sender === "user" ? "#f1f5f9" : "#e2e8f0"
      };">
        <strong style="color: #1e293b; font-size: 13px;">${m.sender === "user" ? "INVESTIGATOR" : "KSP AI CORE"} [${m.timestamp}]</strong>
        <p style="margin: 5px 0 0 0; font-size: 14px; line-height: 1.5; color: #334155;">${m.text}</p>
      </div>
    `
      )
      .join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>KSP Crime Intel Transcript</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; max-width: 800px; margin: 0 auto; }
            h1 { font-size: 24px; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 30px; }
            .meta { font-size: 12px; color: #64748b; margin-bottom: 30px; line-height: 1.6; }
          </style>
        </head>
        <body>
          <h1>Karnataka State Police — Conversational Crime Intelligence Record</h1>
          <div class="meta">
            <strong>Exported on:</strong> ${new Date().toLocaleString()}<br/>
            <strong>Active Security Clearance:</strong> ${activeRole}<br/>
            <strong>Database Node:</strong> Catalyst Production Store
          </div>
          <div>${formattedMessages}</div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Handle login: map demo role to platform role
  const handleLogin = (demoRole: { id: string; title: string }) => {
    const roleMap: Record<string, UserRole> = {
      admin:       "Policymaker",
      analyst:     "Analyst",
      investigator:"Investigator",
      senior:      "Supervisor",
    };
    setActiveRole(roleMap[demoRole.id] ?? "Investigator");
    setIsAuthenticated(true);
    logAuditEvent("Login", `Authenticated as ${demoRole.title}`);
  };

  // Handle logout: clear session and return to login
  const handleLogout = () => {
    logAuditEvent("Logout", `Session terminated by ${activeRole}.`);
    setShowLogoutConfirm(false);
    setIsAuthenticated(false);
    setActiveTab("mission");
    setMessages([{
      id: "msg_init",
      sender: "bot",
      text: "KSP Crime Intelligence core active. Ready to assist, Investigator. Ask about FIR status, suspect records (e.g., 'Ramesh Kumar'), cyber phishing trails, or location analysis. Support is bilingual (English/ಕನ್ನಡ).",
      timestamp: new Date().toLocaleTimeString(),
      language: "en"
    }]);
  };

  return (
    <AnimatePresence mode="wait">
      {!isAuthenticated ? (
        <motion.div
          key="login"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
          style={{ position: "fixed", inset: 0, zIndex: 100 }}
        >
          <LoginPage onLogin={handleLogin} />
        </motion.div>
      ) : (
    <motion.div
      key="app"
      initial={{ opacity: 0, scale: 1.01 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
    <div className="flex h-screen w-screen bg-slate-950 font-sans text-slate-300 overflow-hidden" style={{fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif", background: '#060d1f'}}>
      
      {/* Sidebar: Navigation - Desktop (hidden on mobile) */}
      <nav className="hidden lg:flex w-64 flex-col shrink-0 h-full z-20 overflow-y-auto" style={{background: '#0d1526', borderRight: '1px solid rgba(15,23,42,0.95)'}}>
        {/* KSP Header */}
        <div className="p-5 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shadow-lg shrink-0" style={{background: 'linear-gradient(135deg, #1e40af 0%, #1d4ed8 100%)'}}>
              <Shield className="w-4.5 h-4.5 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-100 tracking-tight">Karnataka Police</div>
              <div className="text-micro text-amber-500/80 tracking-widest uppercase mt-0.5">Intelligence Division</div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-micro text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
            Secure Node · v1.4
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-grow p-3 space-y-0.5 overflow-y-auto">
          {/* Overview section */}
          <div className="text-micro text-slate-600 px-3 py-2 uppercase tracking-widest font-semibold">Overview</div>
          {[
            { id: "mission",       icon: Activity,      label: "Mission Control",        desc: "Executive dashboard" },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => handleTabChange(tab.id)}
                className={`nav-item ${isSelected ? "active" : ""}`}>
                <div className="nav-icon"><Icon className="w-4 h-4" /></div>
                <div className="truncate min-w-0">
                  <div className="nav-label text-slate-200">{tab.label}</div>
                  <div className="nav-desc">{tab.desc}</div>
                </div>
              </button>
            );
          })}

          <div className="text-micro text-slate-600 px-3 py-2 mt-3 uppercase tracking-widest font-semibold">Investigation</div>
          {[
            { id: "conversational", icon: MessageSquare, label: "AI Chat Search",    desc: "Query FIR records" },
            { id: "network",        icon: Users,         label: "Criminal Network",  desc: "Entity linkages" },
            { id: "profiling",      icon: UserCheck,     label: "Offender Profiles", desc: "Risk & MO analysis" },
            { id: "decision",       icon: BrainCircuit,  label: "Decision Support",  desc: "Case leads & timeline" },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => handleTabChange(tab.id)}
                className={`nav-item ${isSelected ? "active" : ""}`}>
                <div className="nav-icon"><Icon className="w-4 h-4" /></div>
                <div className="truncate min-w-0">
                  <div className="nav-label text-slate-200">{tab.label}</div>
                  <div className="nav-desc">{tab.desc}</div>
                </div>
              </button>
            );
          })}

          <div className="text-micro text-slate-600 px-3 py-2 mt-3 uppercase tracking-widest font-semibold">Analytics</div>
          {[
            { id: "hotspots",     icon: TrendingUp,    label: "Hotspots & Trends",   desc: "Spatial crime velocity" },
            { id: "sociological", icon: LineChart,      label: "Sociological Insights",desc: "Socio-economic factors" },
            { id: "financial",    icon: DollarSign,     label: "Financial Trace",      desc: "Money flow analysis" },
            { id: "forecasting",  icon: AlertTriangle,  label: "Early Warnings",       desc: "Predictive signals" },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => handleTabChange(tab.id)}
                className={`nav-item ${isSelected ? "active" : ""}`}>
                <div className="nav-icon"><Icon className="w-4 h-4" /></div>
                <div className="truncate min-w-0">
                  <div className="nav-label text-slate-200">{tab.label}</div>
                  <div className="nav-desc">{tab.desc}</div>
                </div>
              </button>
            );
          })}

          <div className="text-micro text-slate-600 px-3 py-2 mt-3 uppercase tracking-widest font-semibold">Governance</div>
          {[
            { id: "audit", icon: History, label: "Audit Vault", desc: "DPDP compliance logs" },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => handleTabChange(tab.id)}
                className={`nav-item ${isSelected ? "active" : ""}`}>
                <div className="nav-icon"><Icon className="w-4 h-4" /></div>
                <div className="truncate min-w-0">
                  <div className="nav-label text-slate-200">{tab.label}</div>
                  <div className="nav-desc">{tab.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Operator Profile + Logout */}
        <div className="p-3 border-t border-slate-800/50 shrink-0 space-y-1.5">
          <div className="sidebar-profile">
            <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-bold text-xs text-blue-400 shrink-0">
              {activeRole === "Policymaker" ? "SA" : activeRole === "Analyst" ? "CA" : activeRole === "Supervisor" ? "SP" : "IO"}
            </div>
            <div className="truncate min-w-0 flex-1">
              <div className="text-body-sm font-semibold text-slate-300 truncate">
                {activeRole === "Policymaker" ? "Administrator" : activeRole === "Analyst" ? "Crime Analyst" : activeRole === "Supervisor" ? "Sr. Police Officer" : "Insp. Meera Bai"}
              </div>
              <div className="text-micro text-slate-600 font-mono uppercase truncate">KGID: KSP-2026882</div>
            </div>
            <span className="operator-role-badge shrink-0">{activeRole.slice(0,4)}</span>
          </div>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="logout-btn-sidebar"
            aria-label="Sign out"
          >
            <div className="logout-icon"><LogOut className="w-4 h-4" /></div>
            <span>Sign Out</span>
          </button>
        </div>
      </nav>

      {/* Sidebar: Navigation - Mobile Drawer (using Framer Motion for premium feel) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-30 lg:hidden"
            />
            {/* Drawer */}
            <motion.nav
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed top-0 left-0 bottom-0 w-72 bg-slate-900 border-r border-slate-800 flex flex-col h-full z-40 overflow-y-auto lg:hidden"
            >
              <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
                    <Shield className="w-4.5 h-4.5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-100">Karnataka Police</div>
                    <div className="text-micro text-amber-500/80 tracking-widest uppercase mt-0.5">Intelligence Division</div>
                  </div>
                </div>
                <button onClick={() => setIsSidebarOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-grow p-3 space-y-0.5 overflow-y-auto">
                <div className="text-micro text-slate-600 px-3 py-2 uppercase tracking-widest font-semibold">Overview</div>
                {[
                  { id: "mission", icon: Activity, label: "Mission Control", desc: "Executive dashboard" },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isSelected = activeTab === tab.id;
                  return (
                    <button key={tab.id} onClick={() => { handleTabChange(tab.id); setIsSidebarOpen(false); }}
                      className={`nav-item ${isSelected ? "active" : ""}`}>
                      <div className="nav-icon"><Icon className="w-4 h-4" /></div>
                      <div className="truncate min-w-0">
                        <div className="nav-label text-slate-200">{tab.label}</div>
                        <div className="nav-desc">{tab.desc}</div>
                      </div>
                    </button>
                  );
                })}
                <div className="text-micro text-slate-600 px-3 py-2 mt-3 uppercase tracking-widest font-semibold">Investigation</div>
                {[
                  { id: "conversational", icon: MessageSquare, label: "AI Chat Search",    desc: "Query FIR records" },
                  { id: "network",        icon: Users,         label: "Criminal Network",  desc: "Entity linkages" },
                  { id: "profiling",      icon: UserCheck,     label: "Offender Profiles", desc: "Risk & MO analysis" },
                  { id: "decision",       icon: BrainCircuit,  label: "Decision Support",  desc: "Case leads & timeline" },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isSelected = activeTab === tab.id;
                  return (
                    <button key={tab.id} onClick={() => { handleTabChange(tab.id); setIsSidebarOpen(false); }}
                      className={`nav-item ${isSelected ? "active" : ""}`}>
                      <div className="nav-icon"><Icon className="w-4 h-4" /></div>
                      <div className="truncate min-w-0">
                        <div className="nav-label text-slate-200">{tab.label}</div>
                        <div className="nav-desc">{tab.desc}</div>
                      </div>
                    </button>
                  );
                })}
                <div className="text-micro text-slate-600 px-3 py-2 mt-3 uppercase tracking-widest font-semibold">Analytics</div>
                {[
                  { id: "hotspots",     icon: TrendingUp,   label: "Hotspots & Trends",    desc: "Spatial crime velocity" },
                  { id: "sociological", icon: LineChart,     label: "Sociological Insights", desc: "Socio-economic factors" },
                  { id: "financial",    icon: DollarSign,    label: "Financial Trace",       desc: "Money flow analysis" },
                  { id: "forecasting",  icon: AlertTriangle, label: "Early Warnings",        desc: "Predictive signals" },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isSelected = activeTab === tab.id;
                  return (
                    <button key={tab.id} onClick={() => { handleTabChange(tab.id); setIsSidebarOpen(false); }}
                      className={`nav-item ${isSelected ? "active" : ""}`}>
                      <div className="nav-icon"><Icon className="w-4 h-4" /></div>
                      <div className="truncate min-w-0">
                        <div className="nav-label text-slate-200">{tab.label}</div>
                        <div className="nav-desc">{tab.desc}</div>
                      </div>
                    </button>
                  );
                })}
                <div className="text-micro text-slate-600 px-3 py-2 mt-3 uppercase tracking-widest font-semibold">Governance</div>
                {[
                  { id: "audit", icon: History, label: "Audit Vault", desc: "DPDP compliance logs" },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isSelected = activeTab === tab.id;
                  return (
                    <button key={tab.id} onClick={() => { handleTabChange(tab.id); setIsSidebarOpen(false); }}
                      className={`nav-item ${isSelected ? "active" : ""}`}>
                      <div className="nav-icon"><Icon className="w-4 h-4" /></div>
                      <div className="truncate min-w-0">
                        <div className="nav-label text-slate-200">{tab.label}</div>
                        <div className="nav-desc">{tab.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="p-3 border-t border-slate-800/50 shrink-0 space-y-1.5">
                <div className="sidebar-profile">
                  <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-bold text-xs text-blue-400 shrink-0">
                    {activeRole === "Policymaker" ? "SA" : activeRole === "Analyst" ? "CA" : activeRole === "Supervisor" ? "SP" : "IO"}
                  </div>
                  <div className="truncate min-w-0 flex-1">
                    <div className="text-body-sm font-semibold text-slate-300 truncate">
                      {activeRole === "Policymaker" ? "Administrator" : activeRole === "Analyst" ? "Crime Analyst" : activeRole === "Supervisor" ? "Sr. Police Officer" : "Insp. Meera Bai"}
                    </div>
                    <div className="text-micro text-slate-600 font-mono uppercase">KGID: KSP-2026882</div>
                  </div>
                </div>
                <button
                  onClick={() => { setIsSidebarOpen(false); setShowLogoutConfirm(true); }}
                  className="logout-btn-sidebar"
                  aria-label="Sign out"
                >
                  <div className="logout-icon"><LogOut className="w-4 h-4" /></div>
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col overflow-hidden h-full">
        {/* Top Header Command Bar */}
        <header className="h-14 border-b flex items-center justify-between px-4 lg:px-5 shadow-sm z-10 shrink-0 backdrop-blur-md" style={{background: 'rgba(13,21,38,0.97)', borderBottomColor: 'rgba(15,23,42,0.95)'}}>
          <div className="flex items-center gap-2 lg:gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition lg:hidden"
              title="Toggle Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="h-5 w-px bg-slate-700 hidden sm:block" />
            <div>
              <h1 className="text-sm font-semibold text-slate-200 tracking-tight truncate max-w-[140px] sm:max-w-none">KSP Intelligence Platform</h1>
              <p className="text-micro text-slate-500 hidden sm:block">Karnataka State Police · Secure AI Division</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => { setShowHelp(!showHelp); logAuditEvent("Help View", `${showHelp ? "Closed" : "Opened"} the interactive schema directory.`); }}
              className={`text-micro font-semibold py-1.5 px-2.5 rounded-lg border flex items-center gap-1.5 transition ${
                showHelp ? "bg-amber-500/10 border-amber-500/30 text-amber-400" : "bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Schema Guide</span>
            </button>

            <div className="bg-slate-800/60 border border-slate-700/60 p-0.5 rounded-lg flex shrink-0">
              {(["en", "kn"] as const).map(lang => (
                <button key={lang} onClick={() => { setSelectedLanguage(lang); logAuditEvent("Language Switch", `Changed language to ${lang}.`); }}
                  className={`px-2.5 py-1 text-micro font-bold rounded-md transition ${selectedLanguage === lang ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-slate-200"}`}>
                  {lang === "en" ? "EN" : "ಕನ್ನಡ"}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 bg-slate-800/60 border border-slate-700/60 px-2.5 py-1.5 rounded-lg shrink-0">
              <Lock className="w-3 h-3 text-slate-500" />
              <select value={activeRole} onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                className="bg-transparent text-micro font-semibold text-blue-400 focus:outline-none cursor-pointer">
                <option value="Investigator" className="bg-slate-900 text-slate-300">Investigator (L1)</option>
                <option value="Analyst"      className="bg-slate-900 text-slate-300">Analyst (L2)</option>
                <option value="Supervisor"   className="bg-slate-900 text-slate-300">Supervisor (L3)</option>
                <option value="Policymaker"  className="bg-slate-900 text-slate-300">Policymaker (L4)</option>
              </select>
            </div>

            <button onClick={() => handleTabChange("forecasting")}
              className="bg-rose-500/10 hover:bg-rose-500/15 text-rose-400 border border-rose-500/25 py-1.5 px-2.5 rounded-lg text-micro font-semibold flex items-center gap-1.5 transition shrink-0 animate-pulse-ring">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">3 Warnings</span>
            </button>

            {/* Header logout — desktop only, compact */}
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="hidden sm:flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg border border-slate-700/50 bg-slate-800/40 text-slate-500 hover:text-rose-400 hover:border-rose-500/25 hover:bg-rose-500/8 transition text-micro font-semibold shrink-0"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Sign Out</span>
            </button>
          </div>
        </header>

        {/* Main Workspace Layout */}
        <main className="flex-1 overflow-hidden flex flex-col" style={{background: '#060d1f'}}>
          
          {/* Interactive Help & Schema Guide Overlay (Fulfills explaining every single thing) */}
          <AnimatePresence>
            {showHelp && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-slate-900 border-b border-slate-800 overflow-hidden shrink-0"
              >
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs leading-relaxed max-h-[250px] overflow-y-auto">
                  <div className="space-y-2">
                    <h3 className="text-amber-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Shield className="w-4 h-4" /> 1. Operational Relational Map
                    </h3>
                    <p className="text-slate-400 text-[11px]">
                      The platform operates on a tightly relational schema: **Complainants** file **FIR Cases** &rarr; Cases identify **Accused Suspects** &rarr; Suspects link to **Laundering Accounts** &rarr; Alerts generate **Forecasting coordinates** & preventive patrol beat locations.
                    </p>
                  </div>
                  <div className="space-y-2 border-l border-slate-800 pl-6">
                    <h3 className="text-blue-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4" /> 2. Financial & Recidivism Drivers
                    </h3>
                    <p className="text-slate-400 text-[11px]">
                      **Recidivism Risk Score (0-100)**: Calculated by mapping repeat convictions and weapon usage.  
                      **Mule Accounts**: Identified when inbound RTGS transfers are followed immediately by outbounds to layered wallets within 30 mins.
                    </p>
                  </div>
                  <div className="space-y-2 border-l border-slate-800 pl-6">
                    <h3 className="text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4" /> 3. District Hotspot Predictors
                    </h3>
                    <p className="text-slate-400 text-[11px]">
                      **Urbanization Index**: High density (e.g. Bangalore City at 92%) correlates directly with cyber phishing vectors.  
                      **Economic Stress**: Assessed by unemployment rates, indicating trends in street level assault heads.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Dynamic Panel Canvas - Scaled to fit screen perfectly */}
          <div className="flex-1 overflow-hidden p-3 sm:p-5 flex flex-col">
            <div className="bg-slate-900/10 border border-slate-800/30 rounded-2xl p-4 sm:p-5 flex-1 flex flex-col relative overflow-hidden" style={{backdropFilter: 'blur(4px)'}}>
            
            <AnimatePresence mode="wait">
              {activeTab === "mission" && (
                <MissionControl
                  onNavigate={handleTabChange}
                  forecasting={forecasting}
                  trendData={trendData}
                />
              )}

              {activeTab === "conversational" && (
                <motion.div
                  key="tab_conversational"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="flex flex-col h-full grow gap-4"
                >
                  {/* Chat header panel */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-700/60 pb-4 gap-3">
                    <div>
                      <h2 className="section-title">
                        <MessageSquare className="w-5 h-5 text-amber-400" />
                        Conversational Crime Intelligence
                      </h2>
                      <p className="section-subtitle mt-1">Natural language search across FIR records, suspect dossiers, and financial flows</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={downloadChatHistory}
                        className="btn btn-secondary btn-sm">
                        <Download className="w-3.5 h-3.5 text-amber-400" />
                        Save History
                      </button>
                      <button onClick={toggleSpeakingState}
                        className={`btn btn-sm ${isSpeaking ? "bg-rose-500/15 border-rose-400/40 text-rose-300" : "btn-secondary"}`}>
                        {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-amber-400" />}
                        Audio: {isSpeaking ? "ON" : "OFF"}
                      </button>
                    </div>
                  </div>

                  {/* Main conversation sandbox */}
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 grow min-h-[400px]">
                    {/* Left Column: Operational Intel Dossier */}
                    <div className="dossier-panel">
                      <div className="space-y-4">
                        <div className="pb-3 border-b border-slate-800/70">
                          <h3 className="text-label text-amber-500/90">
                            Operational Intel Dossier
                          </h3>
                          <p className="text-micro text-slate-600 font-mono mt-1 uppercase">MODULE: CHAT_CORES_GROUNDED</p>
                        </div>

                        {/* Purpose and Utility */}
                        <div className="space-y-1.5">
                          <h4 className="dossier-label text-slate-500">Crime-Solver Purpose</h4>
                          <p className="text-caption text-slate-400 leading-relaxed">
                            Translates natural language queries into grounded retrieval calls. Search raw case narratives, victim files, and suspicious account nodes to verify active timelines.
                          </p>
                        </div>

                        {/* Schema Variable Directory */}
                        <div className="space-y-1.5 pt-2 border-t border-slate-800/50">
                          <h4 className="dossier-label text-slate-500">Database Variables</h4>
                          <div className="space-y-1 font-mono text-micro">
                            <div className="dossier-var-row">
                              <span className="text-blue-400">FIRNo</span>
                              <span className="text-slate-600">Case Identifier</span>
                            </div>
                            <div className="dossier-var-row">
                              <span className="text-blue-400">BriefFacts</span>
                              <span className="text-slate-600">Incident Narrative</span>
                            </div>
                            <div className="dossier-var-row">
                              <span className="text-blue-400">Citations</span>
                              <span className="text-slate-600">Grounding Docs</span>
                            </div>
                          </div>
                        </div>

                        {/* Quick Suggested Inputs */}
                        <div className="space-y-1.5 pt-2 border-t border-slate-800/50">
                          <h4 className="dossier-label text-slate-500">Suggested Queries</h4>
                          <div className="space-y-1.5 text-caption">
                            {[
                              { text: "Who are the repeat offenders in property theft?", lang: "en" },
                              { text: "ರಮೇಶ್ ಕುಮಾರ್ ಅವರ ಅಪರಾಧ ಇತಿಹಾಸವೇನು?", lang: "kn" },
                              { text: "Analyze the cyber phishing flow", lang: "en" }
                            ].map((q, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  setSelectedLanguage(q.lang as any);
                                  setChatInput(q.text);
                                }}
                                className="w-full text-left p-2 rounded-lg border border-slate-800/60 hover:border-slate-700 bg-slate-900/40 text-slate-400 hover:text-slate-200 transition text-left leading-snug"
                              >
                                {q.text}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Cross-Module Actions */}
                      <div className="pt-3 border-t border-slate-800/50 space-y-1.5">
                        <h4 className="dossier-label text-amber-500/70">Cross-Module Actions</h4>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab("network");
                            logAuditEvent("Cross Link", "Transitioned from Chat to Network Map.");
                          }}
                          className="cross-action-btn"
                        >
                          <span>Accused Link Map</span>
                          <span>→</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab("profiling");
                            logAuditEvent("Cross Link", "Transitioned from Chat to Offender Profiling.");
                          }}
                          className="cross-action-btn"
                        >
                          <span>Offender Dossiers</span>
                          <span>→</span>
                        </button>
                      </div>
                    </div>

                    {/* Right Column: Dynamic Messages scroll window */}
                    <div className="lg:col-span-3 flex flex-col bg-slate-950/40 border border-slate-800/60 rounded-xl overflow-hidden h-[450px]">
                    
                    <div className="flex-grow p-4 overflow-y-auto space-y-4">
                      {messages.map((m) => (
                        <div
                          key={m.id}
                          className={`flex gap-3 max-w-[85%] ${m.sender === "user" ? "ml-auto flex-row-reverse" : ""}`}
                        >
                          <div className={`p-2 rounded-lg shrink-0 h-9 w-9 flex items-center justify-center border ${
                            m.sender === "user" ? "bg-amber-500/20 border-amber-500/30 text-amber-400" : "bg-slate-900 border-slate-800 text-slate-300"
                          }`}>
                            {m.sender === "user" ? <User className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                          </div>
                          
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-[10px] text-slate-500">
                              <span className="font-semibold text-slate-400">
                                {m.sender === "user" ? "INVESTIGATOR" : "KSP AI CORE"}
                              </span>
                              <span>·</span>
                              <span>{m.timestamp}</span>
                            </div>
                            
                            <div className={`p-3.5 rounded-2xl text-sm leading-relaxed ${
                              m.sender === "user"
                                ? "bg-slate-900 border border-amber-500/30 text-slate-100 rounded-tr-none"
                                : "bg-slate-900/60 border border-slate-800 text-slate-200 rounded-tl-none"
                            }`}>
                              {m.text}

                              {/* Render Citations under AI answers (FR-9) */}
                              {m.citations && m.citations.length > 0 && (
                                <div className="mt-3.5 pt-3.5 border-t border-slate-800/80 space-y-2">
                                  <div className="text-[10px] uppercase font-bold text-amber-500 tracking-wider flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    Explainable Evidence Trails (Citations):
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1.5">
                                    {m.citations.map((cit, cIdx) => (
                                      <button
                                        key={cIdx}
                                        onClick={() => setCurrentCitation(cit)}
                                        className="text-left bg-slate-950 hover:bg-slate-900 border border-slate-800 p-2 rounded-lg text-xs flex items-center justify-between gap-1 transition"
                                      >
                                        <div className="truncate">
                                          <div className="font-bold text-slate-300 truncate">FIR: {cit.firNo}</div>
                                          <div className="text-[10px] text-slate-500 truncate">{cit.title}</div>
                                        </div>
                                        <ArrowRight className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}

                      {isChatLoading && (
                        <div className="flex gap-3 max-w-[80%]">
                          <div className="bg-slate-900 border border-slate-800 text-slate-300 p-2 rounded-lg shrink-0 h-9 w-9 flex items-center justify-center">
                            <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                          </div>
                          <div className="space-y-1.5">
                            <span className="text-caption text-slate-500 font-semibold uppercase tracking-wider">KSP AI scanning database…</span>
                            <div className="bg-slate-900/60 p-3.5 rounded-2xl rounded-tl-none border border-slate-800 space-y-2">
                              <div className="skeleton h-3 w-48 rounded" />
                              <div className="skeleton h-3 w-36 rounded" />
                              <div className="skeleton h-3 w-56 rounded" />
                            </div>
                          </div>
                        </div>
                      )}

                      <div ref={chatBottomRef} />
                    </div>

                    {/* Chat input form */}
                    <form onSubmit={handleSendMessage} className="border-t border-slate-800/60 bg-slate-950/80 p-3 flex gap-2">
                      <button type="button" onClick={startVoiceInput}
                        className={`p-2.5 rounded-lg border transition shrink-0 ${
                          isListening ? "bg-rose-500/20 border-rose-500/40 text-rose-400 animate-pulse" : "bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-400"
                        }`} title={isListening ? "Tap to stop recording" : "Voice Input (tap to start)"} aria-label={isListening ? "Stop voice recording" : "Start voice recording"}>
                        <Mic className="w-4.5 h-4.5" />
                      </button>
                      <input type="text"
                        placeholder={selectedLanguage === "kn" ? "ಕರ್ನಾಟಕ ಪೊಲೀಸ್ ದತ್ತಸಂಚಯವನ್ನು ಇಲ್ಲಿ ಪ್ರಶ್ನಿಸಿ..." : "Ask the KSP database (e.g. Ramesh Kumar history, phishing trail...)"}
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        className="input flex-grow text-sm"
                      />
                      <button type="submit" disabled={isChatLoading || !chatInput.trim()}
                        className="btn btn-primary shrink-0">
                        Query AI
                      </button>
                    </form>

                    </div>
                  </div>

                  {/* Modal for Citation Details */}
                {currentCitation && (
                  <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 max-w-lg w-full rounded-2xl p-6 space-y-4 shadow-2xl animate-scaleIn">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <h4 className="font-bold text-amber-500 flex items-center gap-1.5">
                          <FileText className="w-5 h-5" />
                          Database Citation Record
                        </h4>
                        <button
                          onClick={() => setCurrentCitation(null)}
                          className="text-slate-400 hover:text-slate-200 text-xs font-bold"
                        >
                          CLOSE
                        </button>
                      </div>
                      <div className="space-y-2 text-sm text-slate-300">
                        <p><strong>FIR Number:</strong> <span className="text-amber-400">{currentCitation.firNo}</span></p>
                        <p><strong>Unified Case ID:</strong> {currentCitation.caseId}</p>
                        <p><strong>Record Classification:</strong> {currentCitation.title}</p>
                        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs italic text-slate-400 mt-2">
                          <strong>Grounded Citation Reason:</strong> "{currentCitation.reason}"
                        </div>
                      </div>
                      <div className="flex justify-end pt-2">
                        <button
                          onClick={() => {
                            setSelectedCaseId(currentCitation.caseId);
                            fetchDecisionSupport(currentCitation.caseId);
                            handleTabChange("decision");
                            setCurrentCitation(null);
                          }}
                          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-1.5 px-4 rounded-lg text-xs transition flex items-center gap-1"
                        >
                          Open Case Decision Console <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              </motion.div>
            )}

            {activeTab === "network" && (
              <motion.div
                key="tab_network"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="flex flex-col h-full grow gap-4"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800/60 pb-4 gap-2">
                  <div>
                    <h2 className="section-title">
                      <Users className="w-5 h-5 text-emerald-400" />
                      Criminal Network & Relationship Analysis
                    </h2>
                    <p className="section-subtitle mt-1">Visualization of direct and indirect links between accused, victims, logistics hubs, and financial accounts</p>
                  </div>
                </div>

                <div className="w-full grow flex flex-col gap-4">
                  <div className="flex-1">
                    <NetworkGraph
                      nodes={networkData.nodes || []}
                      edges={networkData.edges || []}
                      onSelectNode={(node) => {
                        logAuditEvent("Network Select", `Explored association map for node ${node.label} (${node.type}).`);
                        // If case node, update decision support case selection
                        if (node.type === "Case" && node.id) {
                          const caseMasterId = parseInt(node.id.split("_")[1]);
                          if (caseMasterId) {
                            setSelectedCaseId(caseMasterId);
                            fetchDecisionSupport(caseMasterId);
                          }
                        } else if (node.type === "Suspect") {
                          const matchedOffender = offenders.find(o => o.name.includes(node.label) || node.label.includes(o.name));
                          if (matchedOffender) {
                            setSelectedOffender(matchedOffender);
                            handleTabChange("profiling");
                          }
                        }
                      }}
                    />
                  </div>

                  {/* COMPACT CROSS-MODULE INTER-LINKING ACTION ROW */}
                  <div className="bg-slate-900/60 border border-slate-800/80 p-3 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span className="text-slate-400 font-medium">Relational Intelligence mapping complete. Cross-explore with other nodes:</span>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab("conversational");
                          setChatInput("Analyze the cyber phishing flow linkages");
                          logAuditEvent("Cross Link", "Transitioned from Network Map to Chat with prefill.");
                        }}
                        className="flex-1 sm:flex-none py-1.5 px-3 bg-blue-600/10 border border-blue-500/20 hover:bg-blue-600/20 text-blue-400 rounded-lg font-bold transition flex items-center justify-center gap-1.5"
                      >
                        <span>Query in AI Chat</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab("financial");
                          logAuditEvent("Cross Link", "Transitioned from Network Map to Financial trace.");
                        }}
                        className="flex-1 sm:flex-none py-1.5 px-3 bg-blue-600/10 border border-blue-500/20 hover:bg-blue-600/20 text-blue-400 rounded-lg font-bold transition flex items-center justify-center gap-1.5"
                      >
                        <span>Audit Laundering Flows</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "hotspots" && (
              <motion.div
                key="tab_hotspots"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="flex flex-col h-full grow gap-6 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800/60 pb-4 gap-2">
                  <div>
                    <h2 className="section-title">
                      <TrendingUp className="w-5 h-5 text-amber-500" />
                      Spatial Hotspots & Trend Analytics
                    </h2>
                    <p className="section-subtitle mt-1">District-level registration hot zones, monthly velocity tracking, and classification breakdowns</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-micro text-slate-600 mb-4 overflow-x-auto whitespace-nowrap pb-1">
                  <span className="text-slate-700">Mission Control</span>
                  <span className="text-slate-800">›</span>
                  <span className="text-amber-500/70 font-semibold">Hotspots & Trends</span>
                  <span className="text-slate-800">›</span>
                  <span className="text-slate-700">Sociological Insights</span>
                  <span className="text-slate-800">›</span>
                  <span className="text-slate-700">Forecasting</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 grow min-h-[400px]">
                  {/* Left Column: Operational Intel Dossier */}
                  <div className="dossier-panel">
                    <div className="space-y-4">
                      <div className="pb-3 border-b border-slate-800/70">
                        <h3 className="text-label text-amber-500/90">Hotspot Intel Dossier</h3>
                        <p className="text-micro text-slate-600 font-mono mt-1 uppercase">MODULE: HOTZONE_SPATIAL_VELOCITY</p>
                      </div>

                      {/* Purpose */}
                      <div className="space-y-1.5">
                        <h4 className="dossier-label text-slate-500">Crime-Solver Purpose</h4>
                        <p className="text-caption text-slate-400 leading-relaxed">
                          Computes geographical crime velocity. Use to schedule police beats, dispatch warning alerts, and compare spatial trends against demographic factors.
                        </p>
                      </div>

                      {/* Schema Variable Directory */}
                      <div className="space-y-1.5 pt-2 border-t border-slate-800/50">
                        <h4 className="dossier-label text-slate-500">Database Variables</h4>
                        <div className="space-y-1 font-mono text-micro">
                          <div className="dossier-var-row">
                            <span className="text-amber-500">Hotspot risk</span>
                            <span className="text-slate-600">Cluster %</span>
                          </div>
                          <div className="dossier-var-row">
                            <span className="text-amber-500">Velocity</span>
                            <span className="text-slate-600">Growth rate</span>
                          </div>
                          <div className="dossier-var-row">
                            <span className="text-amber-500">Class head</span>
                            <span className="text-slate-600">IPC Category</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* INTER-LINK WORKFLOW CONTROLS */}
                    <div className="pt-3 border-t border-slate-800/50 space-y-1.5">
                      <h4 className="dossier-label text-amber-500/70">Cross-Module Actions</h4>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab("sociological");
                          logAuditEvent("Cross Link", "Transitioned from Hotspots to Sociological correlation analysis.");
                        }}
                        className="cross-action-btn"
                      >
                        <span>Compare Socio-drivers</span>
                        <span>→</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab("forecasting");
                          logAuditEvent("Cross Link", "Transitioned from Hotspots to Predictive Forecasting warnings.");
                        }}
                        className="cross-action-btn"
                      >
                        <span>Review Dispatch Beats</span>
                        <span>→</span>
                      </button>
                    </div>
                  </div>

                  {/* Right 3 columns: Interactive content fitting the page */}
                  <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4 h-[450px] overflow-y-auto">
                    {/* District interactive heat list */}
                    <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-xl flex flex-col justify-between md:col-span-1 h-full">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500 border-b border-slate-800 pb-2">Active District Grid</h3>
                      <div className="flex-1 overflow-y-auto space-y-2 mt-2 pr-1">
                        {forecasting.hotspotsRisk && forecasting.hotspotsRisk.map((h: any, idx: number) => {
                          const scoreColor = h.risk > 80 ? "text-rose-400" : h.risk > 60 ? "text-amber-400" : "text-emerald-400";
                          return (
                            <div key={idx} className="bg-slate-900 border border-slate-800/60 p-2.5 rounded-lg flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <MapPin className="w-3.5 h-3.5 text-rose-500 animate-bounce shrink-0" />
                                <div className="min-w-0">
                                  <div className="text-[11px] font-bold text-slate-200 truncate">{h.name}</div>
                                  <div className="text-[9px] text-slate-500 truncate">{h.activeTrend} trend</div>
                                </div>
                              </div>
                              <div className="text-right shrink-0">
                                <div className={`text-[10px] font-bold ${scoreColor}`}>Risk: {h.risk}%</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Crime distribution charts side-by-side */}
                    <div className="md:col-span-2 space-y-3 h-full flex flex-col justify-between">
                      {/* Area Chart */}
                      <div className="bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-xl flex-1 flex flex-col justify-between">
                        <h3 className="text-[11px] font-bold uppercase tracking-wider text-amber-500">Monthly Crime Velocity (Velocity Tracker)</h3>
                        <div className="h-[140px] w-full mt-2">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData.crimeByMonth || []}>
                              <defs>
                                <linearGradient id="colorHeinous" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorNonHeinous" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                              <XAxis dataKey="month" stroke="#64748b" fontSize={9} />
                              <YAxis stroke="#64748b" fontSize={9} />
                              <Tooltip contentStyle={{ backgroundColor: "#020617", border: "1px solid #334155" }} />
                              <Area type="monotone" dataKey="Heinous" stroke="#f43f5e" fillOpacity={1} fill="url(#colorHeinous)" name="Heinous" />
                              <Area type="monotone" dataKey="NonHeinous" stroke="#f59e0b" fillOpacity={1} fill="url(#colorNonHeinous)" name="Non-Heinous" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Bar Chart */}
                      <div className="bg-slate-950/60 border border-slate-800/80 p-3.5 rounded-xl flex-1 flex flex-col justify-between">
                        <h3 className="text-[11px] font-bold uppercase tracking-wider text-amber-500">Crime Head Statutory IPC Distribution</h3>
                        <div className="h-[140px] w-full mt-2">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={trendData.crimeByType || []}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                              <XAxis dataKey="name" stroke="#64748b" fontSize={8} />
                              <YAxis stroke="#64748b" fontSize={9} />
                              <Tooltip contentStyle={{ backgroundColor: "#020617", border: "1px solid #334155" }} />
                              <Bar dataKey="value" fill="#10b981" radius={[3, 3, 0, 0]} name="Count" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "sociological" && (
              <SociologicalInsights
                socioData={socioData}
                onNavigate={handleTabChange}
                setChatInput={setChatInput}
                logAuditEvent={logAuditEvent}
              />
            )}

            {activeTab === "profiling" && (
              <motion.div
                key="tab_profiling"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6 flex flex-col h-full grow overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800"
              >
                <div>
                  <h2 className="section-title">
                    <UserCheck className="w-5 h-5 text-emerald-400" />
                    Criminology-Based Offender Profiling & Risk Scoring
                  </h2>
                  <p className="section-subtitle mt-1">Detailed criminal timeline resolution, behavioral modus operandi, and predictive recidivism danger indices (FR-5)</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left: Repeat Offender list */}
                  <div className="card col-span-1 space-y-3">
                    <h3 className="text-label text-emerald-400">Habitual Suspect Roster</h3>
                    
                    <div className="space-y-2">
                      {offenders.map((off, idx) => {
                        const isSel = selectedOffender?.personId === off.personId;
                        const lvlColor = off.riskLevel === "CRITICAL" ? "badge-red" : off.riskLevel === "HIGH" ? "badge-amber" : "badge-green";
                        return (
                          <button
                            key={idx}
                            onClick={() => setSelectedOffender(off)}
                            className={`w-full p-3.5 rounded-xl border text-left flex items-start justify-between gap-2 transition ${
                              isSel ? "border-emerald-500/30 bg-emerald-500/5" : "border-slate-800/50 bg-slate-900/30 hover:border-slate-700/70"
                            }`}
                          >
                            <div>
                              <div className="text-body-sm font-semibold text-slate-200">{off.name}</div>
                              <div className="text-micro text-slate-600 mt-0.5 font-mono">PersonID: {off.personId}</div>
                              <div className="text-caption text-slate-400 font-semibold mt-1.5">{off.totalOffences} Registered Offenses</div>
                            </div>
                            <span className={`badge shrink-0 ${lvlColor}`}>
                              {off.riskLevel}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right: Selected Offender Deep Profile Report */}
                  {selectedOffender && (
                    <div className="lg:col-span-2 bg-slate-950/60 border border-slate-800 p-5 rounded-xl space-y-5 animate-fadeIn">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800 pb-3.5 gap-2">
                        <div>
                          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                            Active Criminal Profile
                          </span>
                          <h3 className="text-base font-bold text-slate-100 mt-1">{selectedOffender.name}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 font-semibold">Recidivism Score:</span>
                          <span className={`text-sm font-black px-2.5 py-1 rounded-lg border ${
                            selectedOffender.riskScore > 80
                              ? "bg-rose-500/20 text-rose-400 border-rose-500/40"
                              : "bg-amber-500/20 text-amber-400 border-amber-500/40"
                          }`}>
                            {selectedOffender.riskScore} / 100
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div className="bg-slate-900 border border-slate-850 p-3.5 rounded-xl space-y-2">
                          <h4 className="font-bold text-slate-300">Modus Operandi Behavior</h4>
                          <p className="text-slate-400 leading-relaxed italic">"{selectedOffender.modusOperandi}"</p>
                        </div>
                        <div className="bg-slate-900 border border-slate-850 p-3.5 rounded-xl space-y-2">
                          <h4 className="font-bold text-slate-300">Offense Focus</h4>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {selectedOffender.crimeHeads.map((ch: any, idx: number) => (
                              <span key={idx} className="bg-slate-950 text-slate-300 px-2.5 py-0.5 rounded border border-slate-800 text-[10px] font-semibold">
                                {ch}
                              </span>
                            ))}
                          </div>
                          <div className="pt-2">
                            <span className="text-slate-400 block font-bold">Known Associates:</span>
                            <span className="text-slate-300 font-medium">{selectedOffender.knownAssociates.join(", ")}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500">Recidivism Danger Scoring Drivers</h4>
                        <div className="bg-slate-900/50 border border-slate-850 p-3 rounded-xl space-y-1.5 text-xs">
                          {selectedOffender.reasons.map((res: string, idx: number) => (
                            <div key={idx} className="flex items-start gap-2 text-slate-400">
                              <span className="text-amber-500 mt-0.5 shrink-0">&#9670;</span>
                              <span>{res}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Investigative Tracking Timeline</h4>
                        <div className="border-l border-slate-800 ml-2 pl-4 space-y-3.5 text-xs">
                          {selectedOffender.timeline.map((tl: any, idx: number) => (
                            <div key={idx} className="relative">
                              <span className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-emerald-500 border border-slate-950" />
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="font-bold text-slate-200">{tl.event}</div>
                                  <div className="text-[10px] text-slate-500 mt-0.5">{tl.date}</div>
                                </div>
                                <span className="bg-slate-900 text-slate-400 px-2 py-0.5 rounded border border-slate-850 text-[9px] font-bold uppercase shrink-0">
                                  {tl.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === "decision" && (
              <motion.div
                key="tab_decision"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6 flex flex-col h-full grow overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h2 className="section-title">
                      <BrainCircuit className="w-5 h-5 text-amber-500" />
                      Investigator Decision Support
                    </h2>
                    <p className="section-subtitle mt-1">Automated case narratives, chronological event timelines, MO comparison, and next tactical leads (FR-6)</p>
                  </div>

                  {/* Case selector dropdown — populated dynamically from trendData hotspots */}
                  <div className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-bold">Case Master Record:</span>
                    <select
                      value={selectedCaseId}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        setSelectedCaseId(val);
                        fetchDecisionSupport(val);
                      }}
                      className="bg-transparent text-xs text-amber-400 font-bold focus:outline-none cursor-pointer"
                    >
                      {trendData.hotspots && trendData.hotspots.length > 0
                        ? trendData.hotspots.map((h: any) => (
                            <option key={h.caseId} value={h.caseId}>
                              FIR {h.firNo.slice(-9)} — {h.crimeType ?? h.station}
                            </option>
                          ))
                        : <option value={1001}>FIR 202600001</option>
                      }
                    </select>
                  </div>
                </div>

                {decisionSupport && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
                    
                    {/* Left: Summary facts and Timeline */}
                    <div className="lg:col-span-2 space-y-6">
                      <div className="bg-slate-950/60 border border-slate-800 p-5 rounded-xl space-y-3.5">
                        <div className="flex justify-between items-start flex-wrap gap-2">
                          <div>
                            <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20 font-bold uppercase">
                              FIR Details Dossier
                            </span>
                            <h3 className="text-sm font-bold text-slate-200 mt-1">FIR NO: {decisionSupport.firNo}</h3>
                          </div>
                          <div className="text-right text-xs text-slate-400">
                            <p>Registered Date: <strong>{decisionSupport.registeredDate}</strong></p>
                            <p>Assigned IO: <strong className="text-emerald-400">{decisionSupport.investigatingOfficer}</strong></p>
                          </div>
                        </div>

                        <div className="bg-slate-900 border border-slate-850 p-4 rounded-xl text-xs text-slate-300 leading-relaxed italic">
                          <strong>Incident Brief Facts:</strong> "{decisionSupport.brief}"
                        </div>

                        <div className="pt-2">
                          <span className="text-xs text-slate-400 font-bold block mb-2">Accused Listed in Case:</span>
                          <div className="flex flex-wrap gap-2">
                            {decisionSupport.accusedList.map((a: any, idx: number) => (
                              <span key={idx} className={`border px-2.5 py-1 rounded-lg text-xs font-semibold ${a.isRepeat ? "bg-red-900/30 border-red-700/50 text-red-300" : "bg-slate-900 border-slate-800 text-slate-200"}`}>
                                {typeof a === "string" ? a : a.name}
                                {a.isRepeat && <span className="ml-1 text-[9px] text-red-400 font-bold uppercase">REPEAT</span>}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Timeline */}
                      <div className="bg-slate-950/60 border border-slate-800 p-5 rounded-xl space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500">Chronological Event Timeline</h3>
                        <div className="border-l border-slate-800 ml-2.5 pl-5 space-y-4 text-xs">
                          {decisionSupport.timeline.map((tl: any, idx: number) => (
                            <div key={idx} className="relative">
                              <span className="absolute -left-[24px] top-1.5 w-2 h-2 rounded-full bg-amber-500 border border-slate-950" />
                              <div className="text-xs font-bold text-slate-300">{tl.label}</div>
                              <div className="text-[10px] text-slate-500 mt-0.5">{new Date(tl.time).toLocaleString()}</div>
                              <p className="text-slate-400 mt-1">{tl.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right: Recommendations and Similar past cases */}
                    <div className="space-y-6 col-span-1">
                      
                      {/* Recommendations */}
                      <div className="bg-slate-950/60 border border-slate-800 p-5 rounded-xl space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                          <BrainCircuit className="w-4 h-4 text-amber-400" />
                          Recommended Tactical Leads
                        </h3>
                        <div className="space-y-3">
                          {decisionSupport.recommendedLeads.map((lead: string, idx: number) => (
                            <div key={idx} className="bg-slate-900 border border-slate-850 p-3 rounded-lg text-xs leading-relaxed text-slate-300 flex items-start gap-2">
                              <span className="text-amber-500 font-bold shrink-0">#{idx + 1}</span>
                              <span>{lead}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Similar Past cases */}
                      <div className="bg-slate-950/60 border border-slate-800 p-5 rounded-xl space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-sky-400">Precedent Cases (Same Modus Operandi)</h3>
                        {decisionSupport.similarCases.length === 0 ? (
                          <div className="text-xs text-slate-500 italic">No exact match precedent found with same sub-classification.</div>
                        ) : (
                          <div className="space-y-3">
                            {decisionSupport.similarCases.map((sim: any, idx: number) => (
                              <button
                                key={idx}
                                onClick={() => {
                                  setSelectedCaseId(sim.caseMasterId);
                                  fetchDecisionSupport(sim.caseMasterId);
                                }}
                                className="w-full text-left bg-slate-900 hover:bg-slate-850 border border-slate-800/80 hover:border-slate-750 p-3 rounded-lg space-y-1.5 transition block"
                              >
                                <div className="flex justify-between text-[10px] font-bold">
                                  <span className="text-sky-400">FIR {sim.caseNo}</span>
                                  <span className="text-slate-500">{sim.date}</span>
                                </div>
                                <p className="text-slate-400 text-xs line-clamp-2 italic">"{sim.brief}"</p>
                                <span className="inline-block bg-slate-950 text-[9px] font-bold text-slate-500 border border-slate-900 px-1.5 py-0.5 rounded uppercase mt-1">
                                  Outcome: {sim.status}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "financial" && (
              <motion.div
                key="tab_financial"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6 flex flex-col h-full grow overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800"
              >
                <div>
                  <h2 className="section-title">
                    <DollarSign className="w-5 h-5 text-rose-500" />
                    Financial Crime & Transaction Link Analysis
                  </h2>
                  <p className="section-subtitle mt-1">Automated tracking of suspicious transaction flows, unverified mule accounts, and layering sequences (FR-7)</p>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  {/* Left explanation of Laundering Phases */}
                  <div className="bg-slate-950/60 border border-slate-800 p-5 rounded-xl space-y-4.5 col-span-1">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-rose-500">Mule Account Integration Alerts</h3>
                    <p className="text-xs leading-relaxed text-slate-300">
                      Our intelligence layer matches transactions in the database with financial fraud MOs (e.g. immediate cashouts, high velocity layering):
                    </p>

                    <div className="space-y-3 text-xs">
                      <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-lg space-y-1.5">
                        <div className="flex items-center gap-2 text-rose-400 font-bold uppercase text-[10px]">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                          <span>Phase 1: Placement</span>
                        </div>
                        <p className="text-slate-400 text-[11px]">Victim bank deposits cash/RTGS funds into initial mule account SBI-8822 immediately preceding warning alarms.</p>
                      </div>

                      <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-lg space-y-1.5">
                        <div className="flex items-center gap-2 text-amber-400 font-bold uppercase text-[10px]">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                          <span>Phase 2: Layering</span>
                        </div>
                        <p className="text-slate-400 text-[11px]">Rapid outbound transfer of 98.7% of scammed funds to HDFC-1102 within 30 minutes to bypass automated AML holds.</p>
                      </div>

                      <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-lg space-y-1.5">
                        <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase text-[10px]">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                          <span>Phase 3: Integration</span>
                        </div>
                        <p className="text-slate-400 text-[11px]">Laundering completed via offshore peer-to-peer cryptocurrency nodes, exchanging cash to cold wallets.</p>
                      </div>
                    </div>
                  </div>

                  {/* Right Transaction Table logs */}
                  <div className="xl:col-span-2 bg-slate-950/60 border border-slate-800 p-5 rounded-xl space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500">Audit Ledger: Flagged Illicit Cashflows</h3>
                    <div className="overflow-x-auto rounded-xl border border-slate-800/60">
                      <table className="table-enterprise w-full">
                        <thead>
                          <tr>
                            <th className="text-left">Tx ID</th>
                            <th className="text-left">From Account</th>
                            <th className="text-left">To Account</th>
                            <th className="text-right">Amount</th>
                            <th className="text-left">Sender</th>
                            <th className="text-left">Recipient</th>
                            <th className="text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mockFinancialTransactions.map((tx, idx) => (
                            <tr key={idx}>
                              <td className="font-mono text-caption text-slate-500">TX_{tx.TransactionID}</td>
                              <td className="font-mono text-caption">{tx.FromAccount}</td>
                              <td className="font-mono text-caption text-amber-400/80">{tx.ToAccount}</td>
                              <td className="text-right font-bold text-rose-400">₹{tx.Amount.toLocaleString()}</td>
                              <td className="text-slate-500 text-caption">{tx.SenderName}</td>
                              <td className="font-medium text-slate-300">{tx.RecipientName}</td>
                              <td className="text-center">
                                {tx.IsSuspicious ? (
                                  <span className="badge badge-red">Flagged</span>
                                ) : (
                                  <span className="badge badge-slate">Passed</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="bg-rose-500/5 border border-rose-500/20 p-4 rounded-xl text-xs space-y-1.5">
                      <div className="text-rose-400 font-bold flex items-center gap-1.5 uppercase">
                        <AlertTriangle className="w-4.5 h-4.5 text-rose-500" />
                        Suspicious Correlation Vector Detected
                      </div>
                      <p className="text-slate-400 leading-relaxed">
                        Suresh Hegde (P_SURESH_02) account SBI-8822-4412 is resolving as a centralized recipient of both drug distribution proceeds (from Kiran Gowda) and fences pay-out for high-end stolen appliances. Initiating coordination with commercial bank fraud desks is highly recommended.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "forecasting" && (
              <motion.div
                key="tab_forecasting"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6 flex flex-col h-full grow overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800"
              >
                <div>
                  <h2 className="section-title">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    Crime Forecasting & Early Warning Alarms
                  </h2>
                  <p className="section-subtitle mt-1">Emerging crime patterns, gang cluster modeling, and actionable localized preventive advisories (FR-8)</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {forecasting.warnings && forecasting.warnings.map((w: any, idx: number) => {
                    const sevColor = w.severity === "HIGH" ? "bg-rose-500/10 border-rose-500/30 text-rose-400" : "bg-amber-500/10 border-amber-500/30 text-amber-400";
                    return (
                      <div key={idx} className="bg-slate-950/60 border border-slate-800 p-5 rounded-xl space-y-4 flex flex-col justify-between">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border tracking-wider ${sevColor}`}>
                              {w.severity} SEVERITY ({w.confidence}% Conf)
                            </span>
                            <span className="text-[10px] text-slate-500 font-bold">ALARM {w.id}</span>
                          </div>
                          
                          <h3 className="text-sm font-bold text-slate-100">{w.title}</h3>
                          
                          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                            <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                            <span>{w.location}</span>
                          </div>

                          <div className="bg-slate-900 border border-slate-850 p-3.5 rounded-xl text-xs text-slate-300 leading-relaxed italic">
                            <strong>AI Grounding Reasoning:</strong> "{w.reasoning}"
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-800/80 space-y-2 text-xs">
                          <strong className="text-amber-500 uppercase tracking-widest text-[10px] block">Proposed Preventive Action Plan:</strong>
                          <p className="text-slate-400 leading-relaxed">{w.actionProposed}</p>
                          <button
                            onClick={() => {
                              logAuditEvent("Warning Action", `Acknowledged early warning plan ${w.id} and routed patrol beats.`);
                              showToast(`Patrol deployment order issued successfully for: ${w.location}`, "success");
                            }}
                            className="w-full mt-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-1.5 px-3 rounded-lg text-[11px] transition"
                          >
                            Route Beat & Acknowledge Warning
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {activeTab === "audit" && (
              <motion.div
                key="tab_audit"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6 flex flex-col h-full grow overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800"
              >
                <div>
                  <h2 className="section-title">
                    <History className="w-5 h-5 text-emerald-400" />
                    Secure Audit Vault & Data Governance Log
                  </h2>
                  <p className="section-subtitle mt-1">Role-based access monitoring, full traceability of actions, queries, and cryptographic compliance logs (FR-10)</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Governance Info */}
                  <div className="bg-slate-950/60 border border-slate-800 p-5 rounded-xl space-y-4 col-span-1">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Data Protection Compliance</h3>
                    <p className="text-xs leading-relaxed text-slate-300">
                      The KSP Platform adheres fully to secure role-based access frameworks and the Digital Personal Data Protection (DPDP) Act constraints:
                    </p>

                    <div className="space-y-3 text-xs">
                      <div className="flex items-start gap-2 text-slate-400">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>All personal identification records are masked beyond necessary investigative access lines.</span>
                      </div>
                      <div className="flex items-start gap-2 text-slate-400">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>Every natural language chat session generates a cryptographic, non-repudiable audit log instantly.</span>
                      </div>
                      <div className="flex items-start gap-2 text-slate-400">
                        <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>Judicial-level evidence tracking ensures citation reference accuracy.</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Live Logs */}
                  <div className="lg:col-span-2 bg-slate-950/60 border border-slate-800 p-5 rounded-xl space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500">Live Audit Vault Log</h3>
                      <button
                        onClick={() => {
                          setAuditLogs([]);
                          logAuditEvent("System Audit Clear", "Audit view reset by administrator.");
                        }}
                        className="text-xs text-rose-400 hover:text-rose-300 transition font-bold uppercase text-[10px]"
                      >
                        Reset Local View
                      </button>
                    </div>

                    <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                      {auditLogs.map((log) => (
                        <div key={log.id} className="bg-slate-900/60 border border-slate-800/50 border-l-2 border-l-emerald-500/60 p-3.5 rounded-xl space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="badge badge-slate text-micro">
                              {log.userRole}
                            </span>
                            <span className="text-micro text-slate-600 font-mono">{new Date(log.timestamp).toLocaleTimeString()}</span>
                          </div>
                          
                          <div className="flex items-center gap-1.5">
                            <span className="text-caption font-bold text-emerald-400">{log.actionType}:</span>
                            <span className="text-caption text-slate-300">{log.details}</span>
                          </div>

                          {log.query && (
                            <p className="bg-slate-950/80 p-2 rounded-lg border border-slate-800/60 text-micro text-slate-500 font-mono">
                              Query: "{log.query}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>

          </div>
        </div>

      </main>

      {/* Footer / Status Bar */}
      <footer className="h-7 border-t flex items-center px-5 justify-between text-micro text-slate-700 font-mono shrink-0" style={{background: 'rgba(13,21,38,0.95)', borderTopColor: 'rgba(15,23,42,0.95)'}}>
        <div className="flex gap-4 items-center">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            SECURE · ENCRYPTED
          </span>
          <span className="hidden sm:inline">SESSION: KSP_HQ_882</span>
          <span className="hidden md:inline">CATALYST CORE v1</span>
        </div>
        <span className="hidden sm:inline text-slate-700">© 2026 KARNATAKA STATE POLICE · AI DIVISION</span>
      </footer>

      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div
            key="logout-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="logout-overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-title"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="logout-card"
            >
              {/* Icon */}
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-5">
                <LogOut className="w-5 h-5 text-rose-400" />
              </div>

              {/* Text */}
              <h2 id="logout-title" className="text-heading3 text-slate-100 mb-2">Sign out of Intelligence Hub?</h2>
              <p className="text-body-sm text-slate-500 leading-relaxed mb-6">
                Your session will be terminated. All unsaved query history will be cleared.
                You will be returned to the login screen.
              </p>

              {/* Session info */}
              <div className="flex items-center gap-2.5 p-3 rounded-xl mb-6"
                style={{ background: "rgba(6,13,31,0.7)", border: "1px solid rgba(15,23,42,0.9)" }}>
                <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/25 flex items-center justify-center font-bold text-xs text-blue-400 shrink-0">
                  {activeRole === "Policymaker" ? "SA" : activeRole === "Analyst" ? "CA" : activeRole === "Supervisor" ? "SP" : "IO"}
                </div>
                <div>
                  <div className="text-body-sm font-semibold text-slate-300">
                    {activeRole === "Policymaker" ? "Administrator" : activeRole === "Analyst" ? "Crime Analyst" : activeRole === "Supervisor" ? "Sr. Police Officer" : "Insp. Meera Bai"}
                  </div>
                  <div className="text-micro text-slate-600 font-mono uppercase">{activeRole} Clearance · KGID: KSP-2026882</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="btn btn-secondary flex-1"
                  autoFocus
                >
                  Stay Signed In
                </button>
                <button
                  onClick={handleLogout}
                  className="btn btn-danger flex-1 flex items-center justify-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Toast Notifications */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-12 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-md ${
              toast.type === "success"
                ? "bg-emerald-950/95 border-emerald-500/30 text-emerald-300"
                : toast.type === "error"
                ? "bg-rose-950/95 border-rose-500/30 text-rose-300"
                : "bg-blue-950/95 border-blue-500/30 text-blue-300"
            }`}
          >
            <Shield className={`w-4 h-4 ${toast.type === "success" ? "text-emerald-400" : toast.type === "error" ? "text-rose-400" : "text-blue-400"}`} />
            <span className="text-xs font-semibold">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  </div>
    </motion.div>
      )}
    </AnimatePresence>
  );
}
