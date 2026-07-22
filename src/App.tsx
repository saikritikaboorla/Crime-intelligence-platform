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
  X
} from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ScatterChart, Scatter, LabelList } from "recharts";
import { Message, UserRole, AuditLog } from "./types";
import NetworkGraph from "./components/NetworkGraph";
import { mockFinancialTransactions } from "./mockData";

export default function App() {
  // Roles and clearance states
  const [activeRole, setActiveRole] = useState<UserRole>("Investigator");
  const [selectedLanguage, setSelectedLanguage] = useState<"en" | "kn">("en");
  const [activeTab, setActiveTab] = useState<string>("conversational");
  
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
  const startVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast("Voice recognition is not supported in this browser environment.", "error");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = selectedLanguage === "kn" ? "kn-IN" : "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      logAuditEvent("Voice Start", "Initiated voice speech translation input channel.");
    };

    recognition.onresult = (event: any) => {
      const speechToText = event.results[0][0].transcript;
      setChatInput(speechToText);
      handleSendMessage(undefined, speechToText);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
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

  return (
    <div className="flex h-screen w-screen bg-slate-950 font-sans text-slate-200 overflow-hidden selection:bg-blue-500/30 selection:text-blue-200">
      
      {/* Sidebar: Navigation - Desktop (hidden on mobile) */}
      <nav className="hidden lg:flex w-72 bg-slate-900 border-r border-slate-800 flex-col shrink-0 h-full z-20 overflow-y-auto">
        {/* KSP Official Command Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 border border-blue-400 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/30 shrink-0">
              <span className="text-base font-black tracking-tighter text-white">KSP</span>
            </div>
            <div>
              <h2 className="text-xs font-black text-slate-100 tracking-wider uppercase">Karnataka Police</h2>
              <p className="text-[10px] font-mono text-amber-500/90 tracking-widest uppercase mt-0.5">Intel division</p>
            </div>
          </div>
          <div className="mt-4 bg-slate-900/80 border border-slate-800/80 px-2.5 py-1 rounded flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> SECURE NODE 01
            </span>
            <span className="font-mono text-slate-500">v1.4-LOCKED</span>
          </div>
        </div>

        {/* Workspace Navigation List */}
        <div className="flex-grow p-4 space-y-1.5">
          {[
            { id: "conversational", icon: MessageSquare, label: "Conversational Search", desc: "Scan FIR logs, suspect dossiers" },
            { id: "network", icon: Users, label: "Criminal Network Map", desc: "Entity linkage & transactions" },
            { id: "hotspots", icon: TrendingUp, label: "Hotspots & Trends", desc: "Spatial crime velocity indexes" },
            { id: "sociological", icon: LineChart, label: "Sociological Insights", desc: "Urbanization & economic stress" },
            { id: "profiling", icon: UserCheck, label: "Offender Dossiers", desc: "MOs & predictive recidivism" },
            { id: "decision", icon: BrainCircuit, label: "Decision Support Console", desc: "Automated case leads & timeline" },
            { id: "financial", icon: DollarSign, label: "Financial Trace", desc: "Mule accounts & sequence layering" },
            { id: "forecasting", icon: AlertTriangle, label: "Early Warning Alarms", desc: "Signal modeling & patrols" },
            { id: "audit", icon: History, label: "Secure Audit Vault", desc: "DPDP Act compliance registry" }
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`w-full p-2.5 rounded-xl border text-left flex gap-3 transition group relative overflow-hidden ${
                  isSelected
                    ? "bg-slate-800 border-blue-500/40 text-blue-400 shadow-md ring-1 ring-blue-500/20"
                    : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 hover:border-slate-800"
                }`}
              >
                <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? "bg-blue-500/10 text-blue-400" : "bg-slate-950 text-slate-500 group-hover:text-slate-300"}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <div className={`text-xs font-bold leading-tight ${isSelected ? "text-blue-300" : "text-slate-300 group-hover:text-slate-100"}`}>{tab.label}</div>
                  <div className="text-[10px] text-slate-500 font-medium truncate mt-0.5">{tab.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Session & Operator Profile Card */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 space-y-3 shrink-0">
          <div className="bg-slate-900 border border-slate-850 p-3 rounded-xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-full border border-blue-500/20 bg-slate-950 flex items-center justify-center font-bold text-xs text-blue-400 shrink-0">
              IP
            </div>
            <div className="truncate">
              <div className="text-[11px] font-bold text-slate-300">Insp. Meera Bai</div>
              <div className="text-[9px] text-slate-500 font-mono uppercase mt-0.5">KGID: KSP-2026882</div>
            </div>
          </div>
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
              <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 border border-blue-400 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/30 shrink-0">
                    <span className="text-base font-black tracking-tighter text-white">KSP</span>
                  </div>
                  <div>
                    <h2 className="text-xs font-black text-slate-100 tracking-wider uppercase">Karnataka Police</h2>
                    <p className="text-[10px] font-mono text-amber-500/90 tracking-widest uppercase mt-0.5">Intel division</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-grow p-4 space-y-1.5">
                {[
                  { id: "conversational", icon: MessageSquare, label: "Conversational Search", desc: "Scan FIR logs, suspect dossiers" },
                  { id: "network", icon: Users, label: "Criminal Network Map", desc: "Entity linkage & transactions" },
                  { id: "hotspots", icon: TrendingUp, label: "Hotspots & Trends", desc: "Spatial crime velocity indexes" },
                  { id: "sociological", icon: LineChart, label: "Sociological Insights", desc: "Urbanization & economic stress" },
                  { id: "profiling", icon: UserCheck, label: "Offender Dossiers", desc: "MOs & predictive recidivism" },
                  { id: "decision", icon: BrainCircuit, label: "Decision Support Console", desc: "Automated case leads & timeline" },
                  { id: "financial", icon: DollarSign, label: "Financial Trace", desc: "Mule accounts & sequence layering" },
                  { id: "forecasting", icon: AlertTriangle, label: "Early Warning Alarms", desc: "Signal modeling & patrols" },
                  { id: "audit", icon: History, label: "Secure Audit Vault", desc: "DPDP Act compliance registry" }
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isSelected = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        handleTabChange(tab.id);
                        setIsSidebarOpen(false);
                      }}
                      className={`w-full p-2.5 rounded-xl border text-left flex gap-3 transition group relative overflow-hidden ${
                        isSelected
                          ? "bg-slate-800 border-blue-500/40 text-blue-400 shadow-md ring-1 ring-blue-500/20"
                          : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 hover:border-slate-800"
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? "bg-blue-500/10 text-blue-400" : "bg-slate-950 text-slate-500 group-hover:text-slate-300"}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <div className={`text-xs font-bold leading-tight ${isSelected ? "text-blue-300" : "text-slate-300 group-hover:text-slate-100"}`}>{tab.label}</div>
                        <div className="text-[10px] text-slate-500 font-medium truncate mt-0.5">{tab.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="p-4 border-t border-slate-800 bg-slate-950/40 space-y-3 shrink-0">
                <div className="bg-slate-900 border border-slate-850 p-3 rounded-xl flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full border border-blue-500/20 bg-slate-950 flex items-center justify-center font-bold text-xs text-blue-400 shrink-0">
                    IP
                  </div>
                  <div className="truncate">
                    <div className="text-[11px] font-bold text-slate-300">Insp. Meera Bai</div>
                    <div className="text-[9px] text-slate-500 font-mono uppercase mt-0.5">KGID: KSP-2026882</div>
                  </div>
                </div>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col overflow-hidden h-full">
        {/* Top Header Command Bar */}
        <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 lg:px-6 shadow-md z-10 shrink-0">
          <div className="flex items-center gap-2 lg:gap-3">
            {/* Hamburger Menu Toggle on Mobile */}
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 -ml-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition lg:hidden"
              title="Toggle Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="h-6 w-1 bg-blue-500 rounded-full hidden sm:block" />
            <div>
              <h1 className="text-xs sm:text-sm font-bold tracking-tight text-slate-100 uppercase truncate max-w-[120px] sm:max-w-none">Crime Intelligence Hub</h1>
              <p className="text-[8px] sm:text-[10px] text-slate-500 mt-0.5 hidden xs:block">Karnataka State Police Decision Support</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* System Directory Quick-Help Button */}
            <button
              onClick={() => {
                setShowHelp(!showHelp);
                logAuditEvent("Help View", `${showHelp ? "Closed" : "Opened"} the interactive schema directory.`);
              }}
              className={`text-xs font-bold py-1.5 px-3 rounded-lg border flex items-center gap-1.5 transition ${
                showHelp
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                  : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              {showHelp ? "Hide Schema Guide" : "Schema Guide"}
            </button>

            {/* Bilingual Translation Switcher */}
            <div className="bg-slate-950/80 border border-slate-800 p-0.5 rounded-lg flex shrink-0">
              <button
                onClick={() => {
                  setSelectedLanguage("en");
                  logAuditEvent("Language Switch", "Changed platform interface language to English.");
                }}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition ${
                  selectedLanguage === "en" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                EN
              </button>
              <button
                onClick={() => {
                  setSelectedLanguage("kn");
                  logAuditEvent("Language Switch", "Changed platform interface language to Kannada.");
                }}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition ${
                  selectedLanguage === "kn" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
                }`}
              >
                ಕನ್ನಡ
              </button>
            </div>

            {/* Active Security Clearance Selector */}
            <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 px-2.5 py-1 rounded-lg shrink-0">
              <Lock className="w-3 h-3 text-slate-500" />
              <span className="text-[10px] text-slate-400 font-semibold mr-0.5">Clearance:</span>
              <select
                value={activeRole}
                onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                className="bg-transparent text-[10px] font-bold text-blue-400 focus:outline-none cursor-pointer"
              >
                <option value="Investigator" className="bg-slate-900 text-slate-300">Investigator (L1)</option>
                <option value="Analyst" className="bg-slate-900 text-slate-300">Analyst (L2)</option>
                <option value="Supervisor" className="bg-slate-900 text-slate-300">Supervisor (L3)</option>
                <option value="Policymaker" className="bg-slate-900 text-slate-300">Policymaker (L4)</option>
              </select>
            </div>

            {/* Tactical Warn Beacon Button linking to Forecasting */}
            <button
              onClick={() => handleTabChange("forecasting")}
              className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 transition animate-pulse shrink-0"
              title="Active Warning Beacon Triggered"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Warnings Active (3)
            </button>
          </div>
        </header>

        {/* Main Workspace Layout */}
        <main className="flex-1 overflow-hidden flex flex-col bg-slate-950">
          
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
          <div className="flex-1 overflow-hidden p-3 sm:p-6 flex flex-col">
            <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-4 sm:p-6 flex-1 flex flex-col backdrop-blur-md relative overflow-hidden">
            
            <AnimatePresence mode="wait">
              {activeTab === "conversational" && (
                <motion.div
                  key="tab_conversational"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  className="flex flex-col h-full grow gap-4"
                >
                  {/* Chat header panel */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800/60 pb-4 gap-2">
                  <div>
                    <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-amber-500" />
                      Conversational Crime Intelligence Interface
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">Scans FIR databases, suspect dossiers, and money flow grids using neural retrieval models</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={downloadChatHistory}
                      className="bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg py-1.5 px-3 text-xs text-slate-300 font-semibold flex items-center gap-1.5 transition"
                    >
                      <Download className="w-3.5 h-3.5 text-amber-500" />
                      Save History (PDF/Print)
                    </button>
                    <button
                      onClick={toggleSpeakingState}
                      className={`border rounded-lg py-1.5 px-3 text-xs font-semibold flex items-center gap-1.5 transition ${
                        isSpeaking
                          ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                          : "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300"
                      }`}
                    >
                      {isSpeaking ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-amber-500" />}
                      Audio Feedback: {isSpeaking ? "ACTIVE" : "OFF"}
                    </button>
                  </div>
                </div>

                {/* Main conversation sandbox */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 grow min-h-[400px]">
                  {/* Left Column: Operational Intel Dossier (Fulfills explaining every single thing + cross-linking) */}
                  <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-xl space-y-5 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="border-b border-slate-800 pb-2">
                        <h3 className="text-xs font-black uppercase tracking-widest text-amber-500">
                          Operational Intel Dossier
                        </h3>
                        <p className="text-[9px] text-slate-500 uppercase font-mono mt-1">MODULE: CHAT_CORES_GROUNDED</p>
                      </div>

                      {/* Purpose and Utility */}
                      <div className="space-y-1.5">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Crime-Solver Purpose</h4>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          This module translates natural language queries into grounded retrieval calls. Investigators use this to search raw case narratives, victim files, and suspicious account nodes to verify active timelines.
                        </p>
                      </div>

                      {/* Schema Variable Directory */}
                      <div className="space-y-2 pt-2 border-t border-slate-800">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Database Variables Mapped</h4>
                        <div className="space-y-1.5 font-mono text-[9px]">
                          <div className="bg-slate-900 px-2 py-1 rounded border border-slate-800 flex justify-between">
                            <span className="text-blue-400">FIRNo</span>
                            <span className="text-slate-500">Case Unique Identifier</span>
                          </div>
                          <div className="bg-slate-900 px-2 py-1 rounded border border-slate-800 flex justify-between">
                            <span className="text-blue-400">BriefFacts</span>
                            <span className="text-slate-500">Incident Narrative Text</span>
                          </div>
                          <div className="bg-slate-900 px-2 py-1 rounded border border-slate-800 flex justify-between">
                            <span className="text-blue-400">Citations</span>
                            <span className="text-slate-500">Factual Grounding Docs</span>
                          </div>
                        </div>
                      </div>

                      {/* Quick Suggested Inputs */}
                      <div className="space-y-2 pt-2 border-t border-slate-800">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Suggested Queries</h4>
                        <div className="space-y-1.5 text-[10px]">
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
                              className="w-full text-left p-1.5 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 transition truncate"
                            >
                              {q.text}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* INTER-LINK WORKFLOW CONTROLS (Fulfills all links properly linked to each other) */}
                    <div className="pt-3 border-t border-slate-800 space-y-2">
                      <h4 className="text-[10px] font-bold text-amber-500/80 uppercase tracking-wider">Cross-Module Actions</h4>
                      <div className="space-y-1">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab("network");
                            logAuditEvent("Cross Link", "Transitioned from Chat to Network Map.");
                          }}
                          className="w-full text-left py-1.5 px-2 bg-blue-600/10 border border-blue-500/20 rounded hover:bg-blue-600/20 text-blue-400 text-[10px] font-bold transition flex items-center justify-between"
                        >
                          <span>Accused Link Map</span>
                          <span>&rarr;</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab("profiling");
                            logAuditEvent("Cross Link", "Transitioned from Chat to Offender Profiling.");
                          }}
                          className="w-full text-left py-1.5 px-2 bg-blue-600/10 border border-blue-500/20 rounded hover:bg-blue-600/20 text-blue-400 text-[10px] font-bold transition flex items-center justify-between"
                        >
                          <span>Offender dossiers</span>
                          <span>&rarr;</span>
                        </button>
                      </div>
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
                          <div className="bg-slate-900 border border-slate-800 text-slate-300 p-2 rounded-lg shrink-0 h-9 w-9 flex items-center justify-center animate-spin">
                            <RefreshCw className="w-4.5 h-4.5" />
                          </div>
                          <div className="space-y-1">
                            <span className="text-[10px] text-slate-500 font-bold">KSP AI CORE SCANNING DATABASE...</span>
                            <div className="bg-slate-900/50 p-3.5 rounded-2xl rounded-tl-none border border-slate-800 text-xs text-slate-400 italic">
                              Analyzing cross-references, transaction tables, and network profiles...
                            </div>
                          </div>
                        </div>
                      )}

                      <div ref={chatBottomRef} />
                    </div>

                    {/* Chat input form */}
                    <form onSubmit={handleSendMessage} className="border-t border-slate-800/80 bg-slate-950 p-3 flex gap-2">
                      <button
                        type="button"
                        onClick={startVoiceInput}
                        className={`p-2.5 rounded-lg border transition ${
                          isListening
                            ? "bg-rose-500/20 border-rose-500/40 text-rose-400 animate-pulse"
                            : "bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300"
                        }`}
                        title="Voice Input (STT)"
                      >
                        <Mic className="w-5 h-5" />
                      </button>
                      <input
                        type="text"
                        placeholder={selectedLanguage === "kn" ? "ಕರ್ನಾಟಕ ಪೊಲೀಸ್ ದತ್ತಸಂಚಯವನ್ನು ಇಲ್ಲಿ ಪ್ರಶ್ನಿಸಿ..." : "Ask the KSP database (e.g. Ramesh Kumar criminal history...)"}
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        className="flex-grow bg-slate-900 border border-slate-800 rounded-lg py-2.5 px-4 text-slate-100 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                      <button
                        type="submit"
                        disabled={isChatLoading || !chatInput.trim()}
                        className="bg-amber-500 hover:bg-amber-600 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-bold py-2 px-5 rounded-lg text-sm transition"
                      >
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
                    <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                      <Users className="w-5 h-5 text-emerald-400" />
                      Criminal Network & Relationship Analysis
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">Visualization of direct and indirect links between accused, victims, logistics hubs, and financial accounts</p>
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
                    <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-amber-500" />
                      Spatial Hotspots & Trend Analytics
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">District-level registration hot zones, monthly velocity tracking, and classification breakdowns</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 grow min-h-[400px]">
                  {/* Left Column: Operational Intel Dossier (Fulfills explaining every single thing + cross-linking) */}
                  <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-xl space-y-4 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="border-b border-slate-800 pb-2">
                        <h3 className="text-xs font-black uppercase tracking-widest text-amber-500">
                          Hotspot Intel Dossier
                        </h3>
                        <p className="text-[9px] text-slate-500 uppercase font-mono mt-1">MODULE: HOTZONE_SPATIAL_VELOCITY</p>
                      </div>

                      {/* Purpose */}
                      <div className="space-y-1">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Crime-Solver Purpose</h4>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          This dashboard computes real-time geographical crime velocity. Use this matrix to schedule police beats, dispatch warning alerts, and compare spatial trends against local demographic factors.
                        </p>
                      </div>

                      {/* Schema Variable Directory */}
                      <div className="space-y-2 pt-2 border-t border-slate-800">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Database Variables Mapped</h4>
                        <div className="space-y-1.5 font-mono text-[9px]">
                          <div className="bg-slate-900 px-2 py-1 rounded border border-slate-800 flex justify-between">
                            <span className="text-amber-500">Hotspot risk</span>
                            <span className="text-slate-500">Spatial cluster percentage</span>
                          </div>
                          <div className="bg-slate-900 px-2 py-1 rounded border border-slate-800 flex justify-between">
                            <span className="text-amber-500">Velocity</span>
                            <span className="text-slate-500">Incident growth rate</span>
                          </div>
                          <div className="bg-slate-900 px-2 py-1 rounded border border-slate-800 flex justify-between">
                            <span className="text-amber-500">Class head</span>
                            <span className="text-slate-500">IPC Statutory Category</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* INTER-LINK WORKFLOW CONTROLS */}
                    <div className="pt-3 border-t border-slate-800 space-y-2">
                      <h4 className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Cross-Module Actions</h4>
                      <div className="space-y-1">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab("sociological");
                            logAuditEvent("Cross Link", "Transitioned from Hotspots to Sociological correlation analysis.");
                          }}
                          className="w-full text-left py-1.5 px-2 bg-blue-600/10 border border-blue-500/20 rounded hover:bg-blue-600/20 text-blue-400 text-[10px] font-bold transition flex items-center justify-between"
                        >
                          <span>Compare Socio-drivers</span>
                          <span>&rarr;</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab("forecasting");
                            logAuditEvent("Cross Link", "Transitioned from Hotspots to Predictive Forecasting warnings.");
                          }}
                          className="w-full text-left py-1.5 px-2 bg-blue-600/10 border border-blue-500/20 rounded hover:bg-blue-600/20 text-blue-400 text-[10px] font-bold transition flex items-center justify-between"
                        >
                          <span>Review Dispatch Beats</span>
                          <span>&rarr;</span>
                        </button>
                      </div>
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
              <motion.div
                key="tab_sociological"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="flex flex-col h-full grow gap-6 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800/60 pb-4 gap-2">
                  <div>
                    <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                      <LineChart className="w-5 h-5 text-sky-400" />
                      Sociological Crime Insights & Correlations
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">Cross-correlation of demographic, urbanization, migration indices, and local unemployment stresses against crime heads</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 grow min-h-[400px]">
                  {/* Left Column: Sociological Intel Dossier (Fulfills explaining every single thing + cross-linking) */}
                  <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-xl space-y-4 flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="border-b border-slate-800 pb-2">
                        <h3 className="text-xs font-black uppercase tracking-widest text-sky-400">
                          Socio Intel Dossier
                        </h3>
                        <p className="text-[9px] text-slate-500 uppercase font-mono mt-1">MODULE: SOCIOLOGICAL_FACTORS_MAP</p>
                      </div>

                      {/* Purpose */}
                      <div className="space-y-1">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Crime-Solver Purpose</h4>
                        <p className="text-[11px] text-slate-300 leading-relaxed">
                          This model computes Pearson correlations between environmental stress factors and registered crime heads. Use these indices to isolate core criminological root-causes instead of just reacting to incidents.
                        </p>
                      </div>

                      {/* Schema Variable Directory */}
                      <div className="space-y-2 pt-2 border-t border-slate-800">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Demographic Variables</h4>
                        <div className="space-y-1 font-mono text-[9px]">
                          <div className="bg-slate-900 px-2 py-1 rounded border border-slate-800 flex justify-between">
                            <span className="text-sky-400">Urbanization %</span>
                            <span className="text-slate-500">Infrastructure growth density</span>
                          </div>
                          <div className="bg-slate-900 px-2 py-1 rounded border border-slate-800 flex justify-between">
                            <span className="text-sky-400">Econ Stress %</span>
                            <span className="text-slate-500">Unemployment & daily wage levels</span>
                          </div>
                          <div className="bg-slate-900 px-2 py-1 rounded border border-slate-800 flex justify-between">
                            <span className="text-sky-400">Migration %</span>
                            <span className="text-slate-500">Temporary labor inflows</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* INTER-LINK WORKFLOW CONTROLS */}
                    <div className="pt-3 border-t border-slate-800 space-y-2">
                      <h4 className="text-[10px] font-bold text-sky-400 uppercase tracking-wider">Cross-Module Actions</h4>
                      <div className="space-y-1">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab("hotspots");
                            logAuditEvent("Cross Link", "Transitioned from Sociological to Hotspot Spatial Tracking.");
                          }}
                          className="w-full text-left py-1.5 px-2 bg-blue-600/10 border border-blue-500/20 rounded hover:bg-blue-600/20 text-blue-400 text-[10px] font-bold transition flex items-center justify-between"
                        >
                          <span>Track Spatial Hotspots</span>
                          <span>&rarr;</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab("conversational");
                            setChatInput("Summarize how economic stress and urbanization correlate to cyber phishing scams");
                            logAuditEvent("Cross Link", "Transitioned from Sociological to Chat with socio query.");
                          }}
                          className="w-full text-left py-1.5 px-2 bg-blue-600/10 border border-blue-500/20 rounded hover:bg-blue-600/20 text-blue-400 text-[10px] font-bold transition flex items-center justify-between"
                        >
                          <span>Ask AI for Socio-analysis</span>
                          <span>&rarr;</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Scatter plot and details */}
                  <div className="lg:col-span-3 bg-slate-950/60 border border-slate-800 p-5 rounded-xl">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-amber-500 mb-4">Correlation: Urbanization Index vs. Total Case Registry Count</h3>
                    <div className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                          <CartesianGrid stroke="#1e293b" />
                          <XAxis type="number" dataKey="urbanization" name="Urbanization" unit="%" stroke="#64748b" fontSize={11} label={{ value: 'Urbanization Index (%)', position: 'insideBottom', offset: -5 }} />
                          <YAxis type="number" dataKey="totalCrimes" name="Total Incidents" stroke="#64748b" fontSize={11} label={{ value: 'Incidents Count', angle: -90, position: 'insideLeft' }} />
                          <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: "#020617", border: "1px solid #334155" }} />
                          <Scatter name="Districts" data={socioData} fill="#0ea5e9">
                            <LabelList dataKey="districtName" position="top" style={{ fill: '#e2e8f0', fontSize: 10, fontWeight: 'bold' }} />
                          </Scatter>
                        </ScatterChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* District breakdown matrix table */}
                <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                        <th className="p-3">District</th>
                        <th className="p-3 text-center">Urbanization</th>
                        <th className="p-3 text-center">Migration</th>
                        <th className="p-3 text-center">Econ. Stress</th>
                        <th className="p-3 text-center">Literacy</th>
                        <th className="p-3 text-center">Density</th>
                        <th className="p-3 text-right">Property Crimes</th>
                        <th className="p-3 text-right">Cyber Fraud</th>
                        <th className="p-3 text-right">Total Cases</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40 text-slate-300">
                      {socioData.map((d, index) => (
                        <tr key={index} className="hover:bg-slate-900/30">
                          <td className="p-3 font-semibold text-slate-200">{d.districtName}</td>
                          <td className="p-3 text-center">{d.urbanization}%</td>
                          <td className="p-3 text-center">{d.migration}%</td>
                          <td className="p-3 text-center">{d.stress}%</td>
                          <td className="p-3 text-center">{d.education}%</td>
                          <td className="p-3 text-center">{d.density}/km²</td>
                          <td className="p-3 text-right text-amber-400 font-medium">{d.propertyCrimes}</td>
                          <td className="p-3 text-right text-rose-400 font-medium">{d.cyberCrimes}</td>
                          <td className="p-3 text-right font-bold text-slate-100">{d.totalCrimes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </motion.div>
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
                  <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-emerald-400" />
                    Criminology-Based Offender Profiling & Risk Scoring
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Detailed criminal timeline resolution, behavioral modus operandi, and predictive recidivism danger indices (FR-5)</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left: Repeat Offender list */}
                  <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-3 col-span-1">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Habitual Suspect Roster</h3>
                    
                    <div className="space-y-2">
                      {offenders.map((off, idx) => {
                        const isSel = selectedOffender?.personId === off.personId;
                        const lvlColor = off.riskLevel === "CRITICAL" ? "bg-rose-500/10 text-rose-400 border-rose-500/30" : off.riskLevel === "HIGH" ? "bg-amber-500/10 text-amber-400 border-amber-500/30" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
                        return (
                          <button
                            key={idx}
                            onClick={() => setSelectedOffender(off)}
                            className={`w-full p-3.5 rounded-lg border text-left flex items-start justify-between gap-2 transition ${
                              isSel ? "bg-slate-900 border-emerald-500/50" : "bg-slate-950 border-slate-900 hover:border-slate-800"
                            }`}
                          >
                            <div>
                              <div className="text-xs font-bold text-slate-200">{off.name}</div>
                              <div className="text-[10px] text-slate-500 mt-0.5">PersonID: {off.personId}</div>
                              <div className="text-[10px] text-slate-400 font-bold mt-1.5">{off.totalOffences} Registered Offenses</div>
                            </div>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider shrink-0 ${lvlColor}`}>
                              {off.riskLevel} ({off.riskScore})
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
                    <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                      <BrainCircuit className="w-5 h-5 text-amber-500" />
                      Investigator Decision Support
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">Automated case narratives, chronological event timelines, MO comparison, and next tactical leads (FR-6)</p>
                  </div>

                  {/* Case selector dropdown */}
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
                      <option value={1001}>FIR 202600001 (Koramangala Theft)</option>
                      <option value={1002}>FIR 202600002 (Cubbon Park Narcotics)</option>
                      <option value={1003}>FIR 202600003 (Mysuru Burglary)</option>
                      <option value={1004}>FIR 202600004 (Mangaluru Phishing)</option>
                      <option value={1005}>FIR 202600005 (Koramangala Murder)</option>
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
                            {decisionSupport.accusedList.map((a: string, idx: number) => (
                              <span key={idx} className="bg-slate-900 border border-slate-800 text-slate-200 px-2.5 py-1 rounded-lg text-xs font-semibold">
                                {a}
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
                  <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-rose-500" />
                    Financial Crime & Transaction Link Analysis
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Automated tracking of suspicious transaction flows, unverified mule accounts, and layering sequences (FR-7)</p>
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
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                            <th className="p-3">Tx ID</th>
                            <th className="p-3">From Account</th>
                            <th className="p-3">To Account</th>
                            <th className="p-3 text-right">Amount</th>
                            <th className="p-3">Sender Name</th>
                            <th className="p-3">Recipient Name</th>
                            <th className="p-3">Risk Assessment</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/40 text-slate-300">
                          {mockFinancialTransactions.map((tx, idx) => (
                            <tr key={idx} className="hover:bg-slate-900/30">
                              <td className="p-3 font-semibold text-slate-400">TX_{tx.TransactionID}</td>
                              <td className="p-3 font-mono">{tx.FromAccount}</td>
                              <td className="p-3 font-mono text-amber-400">{tx.ToAccount}</td>
                              <td className="p-3 text-right font-bold text-rose-400">₹{tx.Amount.toLocaleString()}</td>
                              <td className="p-3 text-slate-400">{tx.SenderName}</td>
                              <td className="p-3 font-semibold text-slate-200">{tx.RecipientName}</td>
                              <td className="p-3">
                                {tx.IsSuspicious ? (
                                  <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 py-0.5 px-2 rounded-full text-[10px] font-bold block text-center animate-pulse">
                                    Flagged
                                  </span>
                                ) : (
                                  <span className="bg-slate-800 text-slate-500 py-0.5 px-2 rounded-full text-[10px] block text-center">
                                    Passed
                                  </span>
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
                  <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                    Crime Forecasting & Early Warning Alarms
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Emerging crime patterns, gang cluster modeling, and actionable localized preventive advisories (FR-8)</p>
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
                  <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <History className="w-5 h-5 text-emerald-400" />
                    Secure Audit Vault & Data Governance Log
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Role-based access monitoring, full traceability of actions, queries, and cryptographic compliance logs (FR-10)</p>
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

                    <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                      {auditLogs.map((log) => (
                        <div key={log.id} className="bg-slate-900 border border-slate-850 p-3.5 rounded-xl space-y-1.5 text-xs border-l-2 border-l-emerald-500">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-300 uppercase tracking-widest text-[9px] bg-slate-950 border border-slate-800 px-2 py-0.5 rounded">
                              {log.userRole} Clearance
                            </span>
                            <span className="text-[10px] text-slate-500 font-semibold">{new Date(log.timestamp).toLocaleTimeString()}</span>
                          </div>
                          
                          <div className="flex items-center gap-1.5 font-bold text-slate-200">
                            <span className="text-emerald-400 font-bold">{log.actionType}:</span>
                            <span>{log.details}</span>
                          </div>

                          {log.query && (
                            <p className="bg-slate-950 p-2 rounded border border-slate-900 text-slate-400 text-[11px] font-mono whitespace-nowrap overflow-x-auto">
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
      <footer className="h-8 bg-slate-900 border-t border-slate-800 flex items-center px-6 justify-between text-[10px] text-slate-500 font-mono shrink-0">
        <div className="flex gap-4">
          <span>SESSION: KSP_HQ_882</span>
          <span>LATENCY: 14ms</span>
          <span>RESOURCES: CATALYST_CORE_V1</span>
        </div>
        <div className="flex gap-4 items-center">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
            ENCRYPTION ACTIVE
          </span>
          <span className="text-slate-600">© 2026 KARNATAKA STATE POLICE | AI DIVISION</span>
        </div>
      </footer>

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
  );
}
