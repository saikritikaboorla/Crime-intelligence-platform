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
  LogOut,
  Search,
  Filter,
  Layers
} from "lucide-react";
import { AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ScatterChart, Scatter, LabelList } from "recharts";
import { Message, UserRole, AuditLog } from "./types";
import NetworkGraph from "./components/NetworkGraph";
import MissionControl from "./components/MissionControl";
import SociologicalInsights from "./components/SociologicalInsights";
import LoginPage from "./components/LoginPage";
import HeatmapAnalytics from "./components/HeatmapAnalytics";
import { mockFinancialTransactions } from "./mockData";

type DiscoveryOption = {
  id: number;
  name: string;
  count: number;
  branchId?: number;
  districtId?: number;
};

type DiscoveryFilters = {
  crimeBranches: DiscoveryOption[];
  crimeSubBranches: DiscoveryOption[];
  districts: DiscoveryOption[];
  stations: DiscoveryOption[];
};

const emptyDiscoveryFilters: DiscoveryFilters = {
  crimeBranches: [],
  crimeSubBranches: [],
  districts: [],
  stations: []
};

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
  const [discoveryFilters, setDiscoveryFilters] = useState<DiscoveryFilters>(emptyDiscoveryFilters);
  const [selectedCrimeBranch, setSelectedCrimeBranch] = useState("");
  const [selectedCrimeSubBranch, setSelectedCrimeSubBranch] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedStation, setSelectedStation] = useState("");

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
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  
  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [systemAlertsCount, setSystemAlertsCount] = useState(3);
  const [showHelp, setShowHelp] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  // Financial Trace Page interactive states
  const [finRiskFilter, setFinRiskFilter] = useState<"ALL" | "SUSPICIOUS" | "NORMAL">("ALL");
  const [finViewMode, setFinViewMode] = useState<"AGGREGATED" | "DETAILED">("AGGREGATED");
  const [finSearchQuery, setFinSearchQuery] = useState<string>("");
  const [finHoveredNode, setFinHoveredNode] = useState<string | null>(null);
  const [finHoveredEdge, setFinHoveredEdge] = useState<any | null>(null);

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
    fetchHeatmap();
    fetchAuditLogs();
    fetchDiscoveryFilters();
  }, []);

  useEffect(() => {
    // Scroll only the chat message container, not the whole page
    if (chatBottomRef.current) {
      const container = chatBottomRef.current.parentElement;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }
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

  const fetchHeatmap = async () => {
    try {
      const res = await fetch("/api/analytics/heatmap");
      const data = await res.json();
      setHeatmapData(data);
    } catch (err) {
      console.error("Error fetching heatmap:", err);
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

  const fetchDiscoveryFilters = async () => {
    try {
      const res = await fetch("/api/discovery/filters");
      const data = await res.json();
      setDiscoveryFilters(data);
    } catch (err) {
      console.error("Error fetching discovery filters:", err);
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

  const handleFilterSearch = () => {
    if (isChatLoading) {
      showToast("Please wait for the current query to complete.", "info");
      return;
    }

    const branch = discoveryFilters.crimeBranches.find(item => String(item.id) === selectedCrimeBranch);
    const subBranch = discoveryFilters.crimeSubBranches.find(item => String(item.id) === selectedCrimeSubBranch);
    const district = discoveryFilters.districts.find(item => String(item.id) === selectedDistrict);
    const station = discoveryFilters.stations.find(item => String(item.id) === selectedStation);

    if (!branch && !subBranch && !district && !station) {
      showToast("Choose at least one crime branch, district, or station filter.", "info");
      return;
    }

    const parts = ["Find FIRs"];
    if (subBranch) parts.push(`for sub-branch ${subBranch.name}`);
    else if (branch) parts.push(`for crime branch ${branch.name}`);
    if (district) parts.push(`in district ${district.name}`);
    if (station) parts.push(`at ${station.name}`);

    const query = parts.join(" ");
    setSelectedLanguage("en");
    setChatInput(query);
    logAuditEvent("Filter Search", `Generated filtered chat query: ${query}`, query);
    handleSendMessage(undefined, query);
  };

  const clearDiscoveryFilters = () => {
    setSelectedCrimeBranch("");
    setSelectedCrimeSubBranch("");
    setSelectedDistrict("");
    setSelectedStation("");
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

  const filteredCrimeSubBranches = discoveryFilters.crimeSubBranches.filter(item => !selectedCrimeBranch || item.branchId === Number(selectedCrimeBranch));
  const filteredStations = discoveryFilters.stations.filter(item => !selectedDistrict || item.districtId === Number(selectedDistrict));

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
            { id: "heatmap",      icon: MapPin,         label: "Heatmap Analytics",    desc: "Geographic crime density" },
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
                  { id: "heatmap",      icon: MapPin,        label: "Heatmap Analytics",     desc: "Geographic crime density" },
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
                  className="flex flex-col h-full grow gap-4 min-h-0"
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
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0" style={{minHeight: '0'}}>
                    {/* Left Column: Operational Intel Dossier — FULL HEIGHT */}
                    <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl flex flex-col overflow-hidden min-h-0 h-full">
                      {/* Fixed header */}
                      <div className="flex-shrink-0 px-4 pt-4 pb-3 border-b border-slate-800/70">
                        <h3 className="text-label text-amber-500/90">
                          Operational Intel Dossier
                        </h3>
                        <p className="text-micro text-slate-600 font-mono mt-1 uppercase">MODULE: CHAT_CORES_GROUNDED</p>
                      </div>

                      {/* SCROLLABLE body */}
                      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">

                        {/* Suggested Queries — FIRST, most prominent */}
                        <div className="bg-amber-500/5 border border-amber-500/15 rounded-xl p-3 space-y-2">
                          <h4 className="dossier-label text-amber-500/90 flex items-center gap-1.5">
                            <Sparkles className="w-3 h-3 text-amber-400" />
                            Suggested Queries
                          </h4>
                          <div className="space-y-1.5 text-caption">
                            {[
                              { text: "Who are the repeat offenders in property theft?", lang: "en" },
                              { text: "ರಮೇಶ್ ಕುಮಾರ್ ಅವರ ಅಪರಾಧ ಇತಿಹಾಸವೇನು?", lang: "kn" },
                              { text: "Analyze the cyber phishing flow", lang: "en" },
                              { text: "Show all drug trafficking cases in Bengaluru", lang: "en" },
                              { text: "List mule accounts linked to FIR 202600004", lang: "en" },
                              { text: "What is the financial laundering trail for Vikram Malhotra?", lang: "en" },
                              { text: "Which district has the highest crime rate?", lang: "en" },
                              { text: "ಸುರೇಶ್ ಹೆಗ್ಡೆ ಅವರ ಎಲ್ಲ ಪ್ರಕರಣಗಳನ್ನು ತೋರಿಸಿ", lang: "kn" },
                              { text: "Show all murder cases and their suspects", lang: "en" },
                              { text: "What are Kiran Gowda's known associates?", lang: "en" },
                              { text: "List all arrests made in Kalaburagi district", lang: "en" },
                              { text: "Which cases have chargesheet filed?", lang: "en" },
                              { text: "Analyze extortion cases and financial connections", lang: "en" },
                              { text: "ಮಂಗಳೂರಿನಲ್ಲಿ ಯಾವ ಅಪರಾಧಗಳು ನಡೆದಿವೆ?", lang: "kn" },
                              { text: "Show victims who are police personnel", lang: "en" },
                            ].map((q, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  setSelectedLanguage(q.lang as any);
                                  setChatInput(q.text);
                                }}
                                className="w-full text-left py-2.5 px-2.5 rounded-lg border border-slate-800/60 hover:border-amber-500/50 bg-slate-900/40 text-slate-400 hover:text-slate-200 hover:bg-amber-500/5 transition leading-snug"
                              >
                                {q.text}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Cross-Module Actions */}
                        <div className="pt-1 border-t border-slate-800/50 space-y-1.5">
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
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab("heatmap");
                              logAuditEvent("Cross Link", "Transitioned from Chat to Heatmap Analytics.");
                            }}
                            className="cross-action-btn"
                          >
                            <span>Heatmap Analytics</span>
                            <span>→</span>
                          </button>
                        </div>

                        {/* Purpose and Utility */}
                        <div className="space-y-1.5 pt-1 border-t border-slate-800/50">
                          <h4 className="dossier-label text-slate-500">Crime-Solver Purpose</h4>
                          <p className="text-caption text-slate-400 leading-relaxed">
                            Translates natural language queries into grounded retrieval calls. Search raw case narratives, victim files, and suspicious account nodes to verify active timelines.
                          </p>
                        </div>

                        {/* FIR Discovery Filters */}
                        <div className="space-y-2 pt-2 border-t border-slate-800/50">
                          <h4 className="dossier-label text-slate-500 flex items-center gap-1.5">
                            <Filter className="w-3.5 h-3.5 text-amber-500" />
                            Find FIR by Filters
                          </h4>
                          <div className="space-y-2">
                            <select
                              value={selectedCrimeBranch}
                              onChange={(e) => {
                                setSelectedCrimeBranch(e.target.value);
                                setSelectedCrimeSubBranch("");
                              }}
                              className="input text-xs py-2"
                            >
                              <option value="">Any crime branch</option>
                              {discoveryFilters.crimeBranches.map(item => (
                                <option key={item.id} value={item.id}>{item.name} ({item.count})</option>
                              ))}
                            </select>
                            <select
                              value={selectedCrimeSubBranch}
                              onChange={(e) => setSelectedCrimeSubBranch(e.target.value)}
                              className="input text-xs py-2"
                            >
                              <option value="">Any sub-branch</option>
                              {filteredCrimeSubBranches.map(item => (
                                <option key={item.id} value={item.id}>{item.name} ({item.count})</option>
                              ))}
                            </select>
                            <select
                              value={selectedDistrict}
                              onChange={(e) => {
                                setSelectedDistrict(e.target.value);
                                setSelectedStation("");
                              }}
                              className="input text-xs py-2"
                            >
                              <option value="">Any district</option>
                              {discoveryFilters.districts.map(item => (
                                <option key={item.id} value={item.id}>{item.name} ({item.count})</option>
                              ))}
                            </select>
                            <select
                              value={selectedStation}
                              onChange={(e) => setSelectedStation(e.target.value)}
                              className="input text-xs py-2"
                            >
                              <option value="">Any police station</option>
                              {filteredStations.map(item => (
                                <option key={item.id} value={item.id}>{item.name} ({item.count})</option>
                              ))}
                            </select>
                          </div>
                          <div className="grid grid-cols-2 gap-2 pt-1">
                            <button type="button" onClick={handleFilterSearch} className="btn btn-primary btn-sm justify-center">
                              <Search className="w-3.5 h-3.5" />
                              Search
                            </button>
                            <button type="button" onClick={clearDiscoveryFilters} className="btn btn-secondary btn-sm justify-center">
                              Clear
                            </button>
                          </div>
                        </div>

                        {/* Database Variables */}
                        <div className="space-y-1.5 pt-2 border-t border-slate-800/50">
                          <h4 className="dossier-label text-slate-500">Database Variables</h4>
                          <div className="space-y-1 font-mono text-micro">
                            {[
                              { key: "FIRNo", val: "Case Identifier" },
                              { key: "BriefFacts", val: "Incident Narrative" },
                              { key: "Citations", val: "Grounding Docs" },
                              { key: "AccusedName", val: "Suspect Record" },
                              { key: "PersonID", val: "Cross-case Link" },
                              { key: "latitude/longitude", val: "GPS Coordinates" },
                              { key: "IsSuspicious", val: "Financial Flag" },
                              { key: "RiskReason", val: "Mule Rationale" },
                              { key: "ArrestDate", val: "Custody Record" },
                              { key: "DistrictName", val: "Jurisdiction" },
                            ].map(({ key, val }) => (
                              <div key={key} className="dossier-var-row">
                                <span className="text-blue-400">{key}</span>
                                <span className="text-slate-600">{val}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                      </div>{/* end scrollable body */}
                    </div>

                    {/* Right Column: Dynamic Messages scroll window */}
                    <div className="lg:col-span-3 flex flex-col bg-slate-950/40 border border-slate-800/60 rounded-xl overflow-hidden min-h-0 h-full">
                    
                    <div className="flex-grow overflow-y-auto space-y-4 p-4 scroll-smooth" style={{ scrollBehavior: 'smooth' }}>
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
                    <form onSubmit={handleSendMessage} className="mt-auto border-t border-slate-800/60 bg-slate-950/80 p-3 flex gap-2">
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
                className="space-y-8 flex flex-col h-full grow overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-800 pb-12"
              >
                {/* ── Header & Control Bar ── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-950/90 border border-slate-800 p-5 rounded-xl">
                  <div>
                    <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2.5">
                      <DollarSign className="w-6 h-6 text-rose-500" />
                      Financial Crime & Transaction Link Analysis
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Automated tracking of suspicious transaction flows, unverified mule accounts, and layering sequences (FR-7)
                    </p>
                  </div>

                  {/* Filter & View Mode Controls */}
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Search Input */}
                    <div className="relative min-w-[200px]">
                      <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search account / person..."
                        value={finSearchQuery}
                        onChange={(e) => setFinSearchQuery(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-sky-500/50"
                      />
                    </div>

                    {/* Risk Filter */}
                    <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
                      <button
                        onClick={() => setFinRiskFilter("ALL")}
                        className={`px-3 py-1 rounded-md font-semibold transition-all ${
                          finRiskFilter === "ALL" ? "bg-sky-500/20 text-sky-300 border border-sky-500/30" : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => setFinRiskFilter("SUSPICIOUS")}
                        className={`px-3 py-1 rounded-md font-semibold transition-all ${
                          finRiskFilter === "SUSPICIOUS" ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        Flagged Only
                      </button>
                      <button
                        onClick={() => setFinRiskFilter("NORMAL")}
                        className={`px-3 py-1 rounded-md font-semibold transition-all ${
                          finRiskFilter === "NORMAL" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        Passed
                      </button>
                    </div>

                    {/* View Mode Toggle */}
                    <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
                      <button
                        onClick={() => setFinViewMode("AGGREGATED")}
                        className={`px-3 py-1 rounded-md font-semibold transition-all ${
                          finViewMode === "AGGREGATED" ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" : "text-slate-400 hover:text-slate-200"
                        }`}
                        title="Aggregate multiple flows between account pairs to prevent overlapping lines"
                      >
                        Aggregated
                      </button>
                      <button
                        onClick={() => setFinViewMode("DETAILED")}
                        className={`px-3 py-1 rounded-md font-semibold transition-all ${
                          finViewMode === "DETAILED" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "text-slate-400 hover:text-slate-200"
                        }`}
                        title="Show all individual transaction flows"
                      >
                        Detailed
                      </button>
                    </div>
                  </div>
                </div>

                {/* ── KPI Summary Cards ── */}
                {(() => {
                  const filtered = mockFinancialTransactions.filter((t) => {
                    if (finRiskFilter === "SUSPICIOUS" && !t.IsSuspicious) return false;
                    if (finRiskFilter === "NORMAL" && t.IsSuspicious) return false;
                    if (finSearchQuery) {
                      const q = finSearchQuery.toLowerCase();
                      const match =
                        t.FromAccount.toLowerCase().includes(q) ||
                        t.ToAccount.toLowerCase().includes(q) ||
                        t.SenderName.toLowerCase().includes(q) ||
                        t.RecipientName.toLowerCase().includes(q) ||
                        (t.RiskReason && t.RiskReason.toLowerCase().includes(q)) ||
                        String(t.TransactionID).includes(q);
                      if (!match) return false;
                    }
                    return true;
                  });

                  const suspicious = filtered.filter((t) => t.IsSuspicious);
                  const totalVolume = filtered.reduce((sum, t) => sum + t.Amount, 0);
                  const totalFlaggedAmount = suspicious.reduce((sum, t) => sum + t.Amount, 0);
                  const uniqueAccounts = new Set([
                    ...filtered.map((t) => t.FromAccount),
                    ...filtered.map((t) => t.ToAccount),
                  ]).size;

                  const kpis = [
                    {
                      label: "Total Cashflow Volume",
                      value: `₹${(totalVolume / 100000).toFixed(2)} Lakh`,
                      subText: `${filtered.length} transactions recorded`,
                      icon: <DollarSign className="w-6 h-6 text-sky-400" />,
                      color: "border-sky-500/30 bg-sky-500/5 hover:border-sky-500/50",
                      valueClass: "text-sky-300",
                    },
                    {
                      label: "Flagged Transactions",
                      value: suspicious.length,
                      subText: `${((suspicious.length / Math.max(filtered.length, 1)) * 100).toFixed(0)}% suspicious rate`,
                      icon: <AlertTriangle className="w-6 h-6 text-rose-400" />,
                      color: "border-rose-500/30 bg-rose-500/5 hover:border-rose-500/50",
                      valueClass: "text-rose-300",
                    },
                    {
                      label: "Total Flagged Amount",
                      value: `₹${(totalFlaggedAmount / 100000).toFixed(2)} Lakh`,
                      subText: "Requires freeze & recovery action",
                      icon: <TrendingUp className="w-6 h-6 text-amber-400" />,
                      color: "border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50",
                      valueClass: "text-amber-300",
                    },
                    {
                      label: "Active Accounts Monitored",
                      value: uniqueAccounts,
                      subText: "Source & mule bank accounts",
                      icon: <Users className="w-6 h-6 text-emerald-400" />,
                      color: "border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/50",
                      valueClass: "text-emerald-300",
                    },
                  ];

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                      {kpis.map((kpi, i) => (
                        <div key={i} className={`rounded-xl border p-5 space-y-3 transition-all ${kpi.color}`}>
                          <div className="flex items-center justify-between">
                            <span className="text-xs uppercase tracking-wider font-bold text-slate-400">{kpi.label}</span>
                            <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">{kpi.icon}</div>
                          </div>
                          <div>
                            <div className={`text-3xl font-extrabold tabular-nums tracking-tight ${kpi.valueClass}`}>{kpi.value}</div>
                            <p className="text-xs text-slate-400 mt-1">{kpi.subText}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                {/* ── Money-Laundering Chain: 3-Phase Flow ── */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-6 space-y-4 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-rose-500" />
                        Money-Laundering Chain: 3-Phase Flow Analysis
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Automated detection of placement → layering → integration sequences in criminal proceeds
                      </p>
                    </div>
                    {/* Visual Legend */}
                    <div className="flex items-center gap-4 text-xs font-semibold">
                      <span className="flex items-center gap-1.5 text-slate-300">
                        <span className="w-3 h-3 rounded-full bg-slate-700 border border-slate-500"></span> Source
                      </span>
                      <span className="flex items-center gap-1.5 text-rose-400">
                        <span className="w-3 h-3 rounded-full bg-rose-500/30 border border-rose-500"></span> Placement
                      </span>
                      <span className="flex items-center gap-1.5 text-amber-400">
                        <span className="w-3 h-3 rounded-full bg-amber-500/30 border border-amber-500"></span> Layering
                      </span>
                      <span className="flex items-center gap-1.5 text-emerald-400">
                        <span className="w-3 h-3 rounded-full bg-emerald-500/30 border border-emerald-500"></span> Integration
                      </span>
                    </div>
                  </div>

                  {/* Flow Diagram SVG */}
                  <div className="overflow-x-auto py-2">
                    <svg viewBox="0 0 850 160" className="w-full max-w-4xl mx-auto" style={{ minWidth: 680 }}>
                      <defs>
                        <marker id="arrow-red-lg" markerWidth="9" markerHeight="9" refX="4.5" refY="4.5" orient="auto">
                          <polygon points="0 0, 9 4.5, 0 9" fill="#ef4444" />
                        </marker>
                        <marker id="arrow-amber-lg" markerWidth="9" markerHeight="9" refX="4.5" refY="4.5" orient="auto">
                          <polygon points="0 0, 9 4.5, 0 9" fill="#f59e0b" />
                        </marker>
                        <marker id="arrow-green-lg" markerWidth="9" markerHeight="9" refX="4.5" refY="4.5" orient="auto">
                          <polygon points="0 0, 9 4.5, 0 9" fill="#10b981" />
                        </marker>
                      </defs>

                      {/* Box 0: Victim Source */}
                      <g className="cursor-pointer transition-transform hover:scale-105">
                        <rect x="20" y="32" width="160" height="64" rx="10" ry="10" fill="#0f172a" stroke="#475569" strokeWidth="2" />
                        <text x="100" y="56" textAnchor="middle" fill="#94a3b8" fontSize="12" fontWeight="bold">VICTIM / SOURCE</text>
                        <text x="100" y="72" textAnchor="middle" fill="#cbd5e1" fontSize="11" fontFamily="monospace">ICICI-7741 / AXIS-7709</text>
                        <text x="100" y="87" textAnchor="middle" fill="#f87171" fontSize="12" fontWeight="bold">₹4.00 Lakh</text>
                      </g>

                      {/* Box 1: Mule Account */}
                      <g className="cursor-pointer transition-transform hover:scale-105">
                        <rect x="235" y="32" width="165" height="64" rx="10" ry="10" fill="#1a0a0a" stroke="#ef4444" strokeWidth="2" />
                        <text x="317" y="56" textAnchor="middle" fill="#fca5a5" fontSize="12" fontWeight="bold">MULE ACCOUNT (A)</text>
                        <text x="317" y="72" textAnchor="middle" fill="#ef4444" fontSize="11" fontFamily="monospace">SBI-8822-4412</text>
                        <text x="317" y="87" textAnchor="middle" fill="#f87171" fontSize="12" fontWeight="bold">₹3.95 Lakh</text>
                      </g>

                      {/* Box 2: Layering Account */}
                      <g className="cursor-pointer transition-transform hover:scale-105">
                        <rect x="455" y="32" width="160" height="64" rx="10" ry="10" fill="#181302" stroke="#f59e0b" strokeWidth="2" />
                        <text x="535" y="56" textAnchor="middle" fill="#fcd34d" fontSize="12" fontWeight="bold">LAYERING ACCT (B)</text>
                        <text x="535" y="72" textAnchor="middle" fill="#f59e0b" fontSize="11" fontFamily="monospace">HDFC-1102-0022</text>
                        <text x="535" y="87" textAnchor="middle" fill="#fbbf24" fontSize="12" fontWeight="bold">₹3.90 Lakh</text>
                      </g>

                      {/* Box 3: Crypto Integration */}
                      <g className="cursor-pointer transition-transform hover:scale-105">
                        <rect x="670" y="32" width="160" height="64" rx="10" ry="10" fill="#021a12" stroke="#10b981" strokeWidth="2" />
                        <text x="750" y="56" textAnchor="middle" fill="#6ee7b7" fontSize="12" fontWeight="bold">CRYPTO / ATM</text>
                        <text x="750" y="72" textAnchor="middle" fill="#10b981" fontSize="11" fontFamily="monospace">BTC-COLD-9x3f</text>
                        <text x="750" y="87" textAnchor="middle" fill="#34d399" fontSize="12" fontWeight="bold">₹3.90 Lakh</text>
                      </g>

                      {/* Arrow 0 -> 1 */}
                      <line x1="180" y1="64" x2="230" y2="64" stroke="#ef4444" strokeWidth="2.5" markerEnd="url(#arrow-red-lg)" strokeDasharray="8 4">
                        <animate attributeName="stroke-dashoffset" from="36" to="0" dur="1.2s" repeatCount="indefinite" />
                      </line>

                      {/* Arrow 1 -> 2 */}
                      <line x1="400" y1="64" x2="450" y2="64" stroke="#f59e0b" strokeWidth="2.5" markerEnd="url(#arrow-amber-lg)" strokeDasharray="8 4">
                        <animate attributeName="stroke-dashoffset" from="36" to="0" dur="1.4s" repeatCount="indefinite" />
                      </line>

                      {/* Arrow 2 -> 3 */}
                      <line x1="615" y1="64" x2="665" y2="64" stroke="#10b981" strokeWidth="2.5" markerEnd="url(#arrow-green-lg)" strokeDasharray="8 4">
                        <animate attributeName="stroke-dashoffset" from="36" to="0" dur="1.6s" repeatCount="indefinite" />
                      </line>

                      {/* Phase Badges below arrows */}
                      <rect x="185" y="108" width="80" height="22" rx="4" fill="#1f1315" stroke="#ef4444" strokeWidth="1" />
                      <text x="225" y="123" textAnchor="middle" fill="#ef4444" fontSize="10.5" fontWeight="bold">PLACEMENT</text>

                      <rect x="405" y="108" width="70" height="22" rx="4" fill="#1d1708" stroke="#f59e0b" strokeWidth="1" />
                      <text x="440" y="123" textAnchor="middle" fill="#f59e0b" fontSize="10.5" fontWeight="bold">LAYERING</text>

                      <rect x="618" y="108" width="85" height="22" rx="4" fill="#091b15" stroke="#10b981" strokeWidth="1" />
                      <text x="660" y="123" textAnchor="middle" fill="#10b981" fontSize="10.5" fontWeight="bold">INTEGRATION</text>
                    </svg>
                  </div>
                </div>

                {/* ── NEW Aggregated Analytics Section (Temporal & Category Trends) ── */}
                {(() => {
                  // Aggregate data by date
                  const dateMap: Record<string, { date: string; flagged: number; normal: number; total: number }> = {};
                  mockFinancialTransactions.forEach((tx) => {
                    const rawDate = tx.TransactionDate ? tx.TransactionDate.split("T")[0] : "2026-01-01";
                    const d = new Date(rawDate);
                    const formatted = !isNaN(d.getTime())
                      ? `${d.toLocaleString("en-US", { month: "short" })} ${d.getDate()}`
                      : rawDate;

                    if (!dateMap[formatted]) {
                      dateMap[formatted] = { date: formatted, flagged: 0, normal: 0, total: 0 };
                    }
                    if (tx.IsSuspicious) {
                      dateMap[formatted].flagged += tx.Amount;
                    } else {
                      dateMap[formatted].normal += tx.Amount;
                    }
                    dateMap[formatted].total += tx.Amount;
                  });

                  const temporalData = Object.values(dateMap);

                  // Aggregate data by Crime Category / Risk Type
                  const categoryAgg = [
                    {
                      category: "Phishing & Mule Layering",
                      amount: mockFinancialTransactions
                        .filter((t) => t.RiskReason?.toLowerCase().includes("mule") || t.RiskReason?.toLowerCase().includes("phishing") || t.RiskReason?.toLowerCase().includes("layering"))
                        .reduce((sum, t) => sum + t.Amount, 0),
                      count: mockFinancialTransactions.filter((t) => t.RiskReason?.toLowerCase().includes("mule") || t.RiskReason?.toLowerCase().includes("phishing") || t.RiskReason?.toLowerCase().includes("layering")).length,
                      fill: "#ef4444",
                    },
                    {
                      category: "Narcotics Settlement",
                      amount: mockFinancialTransactions
                        .filter((t) => t.RiskReason?.toLowerCase().includes("drug") || t.RiskReason?.toLowerCase().includes("narcotics") || t.RiskReason?.toLowerCase().includes("mdma"))
                        .reduce((sum, t) => sum + t.Amount, 0),
                      count: mockFinancialTransactions.filter((t) => t.RiskReason?.toLowerCase().includes("drug") || t.RiskReason?.toLowerCase().includes("narcotics") || t.RiskReason?.toLowerCase().includes("mdma")).length,
                      fill: "#f59e0b",
                    },
                    {
                      category: "Extortion Proceeds",
                      amount: mockFinancialTransactions
                        .filter((t) => t.RiskReason?.toLowerCase().includes("extortion") || t.RiskReason?.toLowerCase().includes("hawala"))
                        .reduce((sum, t) => sum + t.Amount, 0),
                      count: mockFinancialTransactions.filter((t) => t.RiskReason?.toLowerCase().includes("extortion") || t.RiskReason?.toLowerCase().includes("hawala")).length,
                      fill: "#8b5cf6",
                    },
                    {
                      category: "Embezzlement & Fraud",
                      amount: mockFinancialTransactions
                        .filter((t) => t.RiskReason?.toLowerCase().includes("embezzled") || t.RiskReason?.toLowerCase().includes("sim swap") || t.RiskReason?.toLowerCase().includes("job fraud"))
                        .reduce((sum, t) => sum + t.Amount, 0),
                      count: mockFinancialTransactions.filter((t) => t.RiskReason?.toLowerCase().includes("embezzled") || t.RiskReason?.toLowerCase().includes("sim swap") || t.RiskReason?.toLowerCase().includes("job fraud")).length,
                      fill: "#0284c7",
                    },
                    {
                      category: "Arms & Robbery Payoffs",
                      amount: mockFinancialTransactions
                        .filter((t) => t.RiskReason?.toLowerCase().includes("arms") || t.RiskReason?.toLowerCase().includes("robbery") || t.RiskReason?.toLowerCase().includes("murder"))
                        .reduce((sum, t) => sum + t.Amount, 0),
                      count: mockFinancialTransactions.filter((t) => t.RiskReason?.toLowerCase().includes("arms") || t.RiskReason?.toLowerCase().includes("robbery") || t.RiskReason?.toLowerCase().includes("murder")).length,
                      fill: "#10b981",
                    },
                  ];

                  return (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Chart 1: Temporal Cashflow Aggregation */}
                      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-3 shadow-xl">
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                          <div>
                            <h3 className="text-sm font-bold uppercase tracking-wider text-sky-400 flex items-center gap-2">
                              <TrendingUp className="w-4 h-4 text-sky-500" />
                              Temporal Cashflow Volume Aggregation
                            </h3>
                            <p className="text-xs text-slate-400 mt-0.5">
                              Daily cash movement split by flagged suspicious vs verified normal funds
                            </p>
                          </div>
                        </div>

                        <div className="h-64 pt-2">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={temporalData} margin={{ top: 10, right: 15, left: 10, bottom: 25 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                              <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 11 }} angle={-20} textAnchor="end" />
                              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`} />
                              <Tooltip
                                contentStyle={{ backgroundColor: "#090d16", borderColor: "#334155", borderRadius: "8px", fontSize: "12px", color: "#f8fafc" }}
                                formatter={(val: any, name: any) => [`₹${Number(val).toLocaleString("en-IN")}`, name === "flagged" ? "Flagged Suspicious" : "Verified Normal"]}
                              />
                              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                              <Bar dataKey="flagged" name="Flagged Suspicious" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                              <Bar dataKey="normal" name="Verified Normal" fill="#0284c7" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Chart 2: Modus Operandi Aggregation */}
                      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-3 shadow-xl">
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                          <div>
                            <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                              <DollarSign className="w-4 h-4 text-amber-500" />
                              Illicit Funds Aggregated by Crime Category
                            </h3>
                            <p className="text-xs text-slate-400 mt-0.5">
                              Distribution of total flagged volume across criminal operational channels
                            </p>
                          </div>
                        </div>

                        <div className="h-64 pt-2">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart layout="vertical" data={categoryAgg} margin={{ top: 10, right: 20, left: 40, bottom: 10 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                              <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={(val) => `₹${(val / 100000).toFixed(1)}L`} />
                              <YAxis type="category" dataKey="category" tick={{ fill: "#cbd5e1", fontSize: 11 }} width={140} />
                              <Tooltip
                                contentStyle={{ backgroundColor: "#090d16", borderColor: "#334155", borderRadius: "8px", fontSize: "12px", color: "#f8fafc" }}
                                formatter={(val: any) => [`₹${Number(val).toLocaleString("en-IN")}`, "Total Volume"]}
                              />
                              <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                                {categoryAgg.map((entry, idx) => (
                                  <Cell key={`cell-${idx}`} fill={entry.fill} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* ── Account-to-Account Flow Network SVG (Zero Overlap & High Readability) ── */}
                <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-6 space-y-4 shadow-xl">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-sky-400 flex items-center gap-2">
                        <Users className="w-4.5 h-4.5 text-sky-500" />
                        Account-to-Account Flow Network
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Interactive transaction matrix. Hover over nodes or flow lines for account details and risk reasons.
                      </p>
                    </div>

                    {/* Network Legend */}
                    <div className="flex flex-wrap items-center gap-4 text-xs font-semibold bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-lg">
                      <span className="flex items-center gap-1.5 text-rose-400">
                        <span className="w-4 h-1 bg-rose-500 rounded"></span> Flagged Suspicious Flow
                      </span>
                      <span className="flex items-center gap-1.5 text-amber-400">
                        <span className="w-4 h-1 bg-amber-500 rounded"></span> Standard Flow
                      </span>
                      <span className="text-slate-500">|</span>
                      <span className="text-slate-400">Line Thickness = Transaction Amount</span>
                    </div>
                  </div>

                  {(() => {
                    const filteredTxs = mockFinancialTransactions.filter((t) => {
                      if (finRiskFilter === "SUSPICIOUS" && !t.IsSuspicious) return false;
                      if (finRiskFilter === "NORMAL" && t.IsSuspicious) return false;
                      if (finSearchQuery) {
                        const q = finSearchQuery.toLowerCase();
                        return (
                          t.FromAccount.toLowerCase().includes(q) ||
                          t.ToAccount.toLowerCase().includes(q) ||
                          t.SenderName.toLowerCase().includes(q) ||
                          t.RecipientName.toLowerCase().includes(q) ||
                          (t.RiskReason && t.RiskReason.toLowerCase().includes(q))
                        );
                      }
                      return true;
                    });

                    // Build node & edge list (aggregated or detailed)
                    let edgesToRender: any[] = [];
                    if (finViewMode === "AGGREGATED") {
                      const linkMap: Record<string, any> = {};
                      filteredTxs.forEach((tx) => {
                        const key = `${tx.FromAccount}___${tx.ToAccount}`;
                        if (!linkMap[key]) {
                          linkMap[key] = {
                            from: tx.FromAccount,
                            to: tx.ToAccount,
                            amount: 0,
                            count: 0,
                            isSuspicious: false,
                            sender: tx.SenderName,
                            recipient: tx.RecipientName,
                            reasons: [],
                          };
                        }
                        linkMap[key].amount += tx.Amount;
                        linkMap[key].count += 1;
                        if (tx.IsSuspicious) linkMap[key].isSuspicious = true;
                        if (tx.RiskReason && !linkMap[key].reasons.includes(tx.RiskReason)) {
                          linkMap[key].reasons.push(tx.RiskReason);
                        }
                      });
                      edgesToRender = Object.values(linkMap);
                    } else {
                      edgesToRender = filteredTxs.map((tx) => ({
                        from: tx.FromAccount,
                        to: tx.ToAccount,
                        amount: tx.Amount,
                        count: 1,
                        isSuspicious: tx.IsSuspicious,
                        sender: tx.SenderName,
                        recipient: tx.RecipientName,
                        reasons: [tx.RiskReason],
                      }));
                    }

                    const fromAccts = [...new Set(edgesToRender.map((e) => e.from))];
                    const toAccts = [...new Set(edgesToRender.map((e) => e.to))];
                    const maxAmount = Math.max(...edgesToRender.map((e) => e.amount), 1);

                    const svgW = 920;
                    const nodeH = 36;
                    const nodeW = 165;
                    const leftX = 30;
                    const rightX = 725;
                    const startY = 45;
                    const stepY = 46; // Step 46px > Node height 36px => Zero overlap!

                    const maxNodes = Math.max(fromAccts.length, toAccts.length, 1);
                    const svgH = Math.max(580, startY + maxNodes * stepY + 30);

                    const fromY = (i: number) => startY + i * stepY;
                    const toY = (i: number) => startY + i * stepY;

                    return (
                      <div className="relative overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-2">
                        {/* Hover Tooltip Overlay */}
                        {finHoveredEdge && (
                          <div className="absolute top-4 right-4 z-20 bg-slate-900/95 border border-slate-700 p-3.5 rounded-xl shadow-2xl max-w-sm text-xs space-y-1 text-slate-200">
                            <div className="font-bold text-sky-400 flex items-center gap-1.5">
                              <span>{finHoveredEdge.from}</span>
                              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                              <span>{finHoveredEdge.to}</span>
                            </div>
                            <div className="text-slate-300 font-semibold">
                              Total Flow: <span className="text-rose-400 font-bold">₹{finHoveredEdge.amount.toLocaleString("en-IN")}</span> ({finHoveredEdge.count} tx)
                            </div>
                            <div className="text-slate-400 text-[11px]">
                              Sender: {finHoveredEdge.sender} → Recipient: {finHoveredEdge.recipient}
                            </div>
                            {finHoveredEdge.reasons.length > 0 && (
                              <div className="text-rose-300/90 italic text-[11px] pt-1 border-t border-slate-800">
                                <strong>Risk Reason:</strong> {finHoveredEdge.reasons.join("; ")}
                              </div>
                            )}
                          </div>
                        )}

                        <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full mx-auto" style={{ minWidth: 720 }}>
                          {/* Section Headers */}
                          <text x={leftX + nodeW / 2} y={22} textAnchor="middle" fill="#64748b" fontSize="12" fontWeight="bold" letterSpacing="1">
                            SOURCE ACCOUNTS ({fromAccts.length})
                          </text>
                          <text x={rightX + nodeW / 2} y={22} textAnchor="middle" fill="#64748b" fontSize="12" fontWeight="bold" letterSpacing="1">
                            DESTINATION / MULE ACCOUNTS ({toAccts.length})
                          </text>

                          {/* Render Flow Edges */}
                          {edgesToRender.map((edge, i) => {
                            const fi = fromAccts.indexOf(edge.from);
                            const ti = toAccts.indexOf(edge.to);
                            if (fi === -1 || ti === -1) return null;

                            const y1 = fromY(fi) + nodeH / 2;
                            const y2 = toY(ti) + nodeH / 2;
                            const x1 = leftX + nodeW;
                            const x2 = rightX;

                            const ratio = edge.amount / maxAmount;
                            const strokeW = Math.max(1.5, ratio * 6);
                            const isSusp = edge.isSuspicious;

                            const strokeColor = isSusp ? "#ef4444" : "#f59e0b";
                            const opacity = finHoveredNode
                              ? edge.from === finHoveredNode || edge.to === finHoveredNode
                                ? 1
                                : 0.15
                              : 0.85;

                            const midX = (x1 + x2) / 2;
                            const path = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;

                            // Alternating label vertical offset to eliminate label collision
                            const dyOffset = i % 2 === 0 ? -10 : 12;
                            const labelX = midX;
                            const labelY = (y1 + y2) / 2 + dyOffset;

                            const amtStr = `₹${(edge.amount / 1000).toFixed(0)}K${edge.count > 1 ? ` (${edge.count})` : ""}`;

                            return (
                              <g
                                key={`edge-${i}`}
                                onMouseEnter={() => setFinHoveredEdge(edge)}
                                onMouseLeave={() => setFinHoveredEdge(null)}
                                className="cursor-pointer transition-opacity"
                                style={{ opacity }}
                              >
                                <path d={path} fill="none" stroke={strokeColor} strokeWidth={strokeW} strokeLinecap="round" />

                                {/* Label Background Badge to prevent overlap with strokes */}
                                <rect
                                  x={labelX - 32}
                                  y={labelY - 11}
                                  width={64}
                                  height={16}
                                  rx={4}
                                  ry={4}
                                  fill="#030712"
                                  stroke={isSusp ? "#ef4444" : "#334155"}
                                  strokeWidth="1"
                                />
                                <text x={labelX} y={labelY} textAnchor="middle" fill={isSusp ? "#fca5a5" : "#fcd34d"} fontSize="11" fontWeight="bold" fontFamily="monospace">
                                  {amtStr}
                                </text>
                              </g>
                            );
                          })}

                          {/* From-Account Nodes (Left) */}
                          {fromAccts.map((acct, i) => {
                            const y = fromY(i);
                            const isHovered = finHoveredNode === acct;
                            return (
                              <g
                                key={`from-${acct}`}
                                onMouseEnter={() => setFinHoveredNode(acct)}
                                onMouseLeave={() => setFinHoveredNode(null)}
                                className="cursor-pointer"
                              >
                                <rect
                                  x={leftX}
                                  y={y}
                                  width={nodeW}
                                  height={nodeH}
                                  rx={6}
                                  ry={6}
                                  fill={isHovered ? "#1e293b" : "#0f172a"}
                                  stroke={isHovered ? "#38bdf8" : "#334155"}
                                  strokeWidth={isHovered ? "2" : "1.5"}
                                />
                                <text x={leftX + nodeW / 2} y={y + 22} textAnchor="middle" fill="#cbd5e1" fontSize="12" fontWeight="bold" fontFamily="monospace">
                                  {acct}
                                </text>
                              </g>
                            );
                          })}

                          {/* To-Account Nodes (Right) */}
                          {toAccts.map((acct, i) => {
                            const y = toY(i);
                            const isMule = acct.includes("MULE") || acct.includes("SBI-8822") || acct.includes("CRYPTO");
                            const isHovered = finHoveredNode === acct;
                            return (
                              <g
                                key={`to-${acct}`}
                                onMouseEnter={() => setFinHoveredNode(acct)}
                                onMouseLeave={() => setFinHoveredNode(null)}
                                className="cursor-pointer"
                              >
                                <rect
                                  x={rightX}
                                  y={y}
                                  width={nodeW}
                                  height={nodeH}
                                  rx={6}
                                  ry={6}
                                  fill={isHovered ? "#2a0f12" : "#1a0a0a"}
                                  stroke={isMule ? "#ef4444" : "#f59e0b"}
                                  strokeWidth={isHovered ? "2.5" : "1.5"}
                                />
                                <text x={rightX + nodeW / 2} y={y + 22} textAnchor="middle" fill={isMule ? "#fca5a5" : "#fcd34d"} fontSize="12" fontWeight="bold" fontFamily="monospace">
                                  {acct}
                                </text>
                              </g>
                            );
                          })}
                        </svg>
                      </div>
                    );
                  })()}
                </div>

                {/* ── Transaction Table / Audit Ledger ── */}
                <div className="bg-slate-950/80 border border-slate-800 p-6 rounded-xl space-y-4 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                      <FileText className="w-4.5 h-4.5 text-amber-500" />
                      Audit Ledger: Flagged Illicit Cashflows
                    </h3>
                    <span className="text-xs text-slate-400 font-semibold">
                      Showing {mockFinancialTransactions.length} records from FIR Financial Database
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-800">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-900/90 border-b border-slate-800 text-xs font-bold text-slate-300 uppercase tracking-wider">
                          <th className="py-3 px-4">Tx ID</th>
                          <th className="py-3 px-2 text-center">Flow</th>
                          <th className="py-3 px-4">From Account</th>
                          <th className="py-3 px-4">To Account</th>
                          <th className="py-3 px-4 text-right">Amount</th>
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4">Sender → Recipient</th>
                          <th className="py-3 px-4">Risk Reason</th>
                          <th className="py-3 px-4 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850">
                        {[...mockFinancialTransactions]
                          .filter((t) => {
                            if (finRiskFilter === "SUSPICIOUS" && !t.IsSuspicious) return false;
                            if (finRiskFilter === "NORMAL" && t.IsSuspicious) return false;
                            if (finSearchQuery) {
                              const q = finSearchQuery.toLowerCase();
                              return (
                                t.FromAccount.toLowerCase().includes(q) ||
                                t.ToAccount.toLowerCase().includes(q) ||
                                t.SenderName.toLowerCase().includes(q) ||
                                t.RecipientName.toLowerCase().includes(q) ||
                                (t.RiskReason && t.RiskReason.toLowerCase().includes(q))
                              );
                            }
                            return true;
                          })
                          .sort((a, b) => (b.IsSuspicious ? 1 : 0) - (a.IsSuspicious ? 1 : 0))
                          .map((tx, idx) => {
                            const isSusp = tx.IsSuspicious;
                            const rowBg = idx % 2 === 0 ? "bg-slate-950/60" : "bg-slate-900/40";
                            const borderColor = isSusp ? "border-l-4 border-l-rose-500" : "border-l-4 border-l-slate-700";

                            const rawDate = tx.TransactionDate || "";
                            let formattedDate = rawDate;
                            try {
                              const d = new Date(rawDate);
                              if (!isNaN(d.getTime())) {
                                formattedDate = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
                              }
                            } catch {}

                            return (
                              <tr key={idx} className={`${rowBg} ${borderColor} hover:bg-slate-850/80 transition-colors`}>
                                <td className="py-3 px-4 font-mono text-xs text-slate-300 font-semibold">TX_{tx.TransactionID}</td>
                                <td className="py-3 px-2 text-center">
                                  <ArrowRight className={`w-4 h-4 mx-auto ${isSusp ? "text-rose-400" : "text-slate-500"}`} />
                                </td>
                                <td className="py-3 px-4 font-mono text-xs text-slate-200">{tx.FromAccount}</td>
                                <td className={`py-3 px-4 font-mono text-xs ${isSusp ? "text-rose-300 font-bold" : "text-amber-300 font-semibold"}`}>
                                  {tx.ToAccount}
                                </td>
                                <td className="py-3 px-4 text-right font-bold text-sm text-rose-400 tabular-nums">
                                  ₹{tx.Amount.toLocaleString("en-IN")}
                                </td>
                                <td className="py-3 px-4 text-xs text-slate-400 whitespace-nowrap">{formattedDate}</td>
                                <td className="py-3 px-4 text-xs text-slate-300">
                                  <span className="font-semibold text-slate-200">{tx.SenderName}</span>
                                  <span className="text-slate-500 mx-1.5">→</span>
                                  <span className="text-slate-300">{tx.RecipientName}</span>
                                </td>
                                <td className={`py-3 px-4 text-xs leading-relaxed ${isSusp ? "text-rose-200/90 font-medium" : "text-slate-400"}`}>
                                  {tx.RiskReason || "Standard non-flagged fund transfer"}
                                </td>
                                <td className="py-3 px-4 text-center whitespace-nowrap">
                                  {isSusp ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40">
                                      Flagged
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase bg-slate-800 text-slate-400 border border-slate-700">
                                      Passed
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ── Alert Banner ── */}
                <div className="bg-rose-500/10 border border-rose-500/30 p-5 rounded-xl text-xs space-y-2 shadow-lg">
                  <div className="text-rose-400 font-bold flex items-center gap-2 uppercase tracking-wide text-sm">
                    <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
                    Suspicious Correlation Vector Detected
                  </div>
                  <p className="text-slate-300 leading-relaxed text-xs">
                    Suresh Hegde (P_SURESH_02) account SBI-8822-4412 is resolving as a centralized recipient of both drug distribution proceeds (from Kiran Gowda) and fences pay-out for high-end stolen appliances. Initiating coordination with commercial bank fraud desks is highly recommended.
                  </p>
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

            {activeTab === "heatmap" && (
              <motion.div
                key="tab_heatmap"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="flex flex-col h-full grow"
              >
                <HeatmapAnalytics
                  heatmapData={heatmapData}
                  onNavigate={handleTabChange}
                  logAuditEvent={logAuditEvent}
                />
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
