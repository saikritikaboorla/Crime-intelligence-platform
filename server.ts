import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import catalyst from "zcatalyst-sdk-node";
dotenv.config();

import {
  mockCases, mockComplainants, mockVictims, mockAccused,
  mockActSections, mockFinancialTransactions, mockArrestSurrenders,
  mockDistricts, mockUnits, mockCrimeHeads, mockCrimeSubHeads,
  mockEmployees, mockSections, mockActs, csvCaseStatuses,
  csvGravityOffences, csvCourts, csvChargesheets, csvOccupations,
  csvReligions, csvCastes, csvRanks, csvDesignations
} from "./src/mockData";

const app = express();
const PORT = process.env.X_ZOHO_CATALYST_LISTEN_PORT || process.env.PORT || 3000;
console.log("AppSail PORT:", PORT);
app.use(express.json({ limit: "10mb" }));

// ── In-memory audit log ──────────────────────────────────────────────────────
const auditLogs: any[] = [{
  id: "LOG_001",
  timestamp: new Date(Date.now() - 7200000).toISOString(),
  userRole: "Supervisor", actionType: "System Init",
  details: "KSP Crime Intelligence Platform initialised from CSV data layer.", query: ""
}];
let logCounter = 1000;
const generateLogId = () => `LOG_${Date.now()}_${++logCounter}_${Math.floor(Math.random()*1000)}`;

// ── Gemini helper ────────────────────────────────────────────────────────────
function getGeminiClient(): GoogleGenAI | null {
  const k = process.env.GEMINI_API_KEY;
  if (!k || k === "MY_GEMINI_API_KEY") return null;
  return new GoogleGenAI({ apiKey: k, httpOptions: { headers: { "User-Agent": "ksp-crime-intel-platform" } } });
}

// ── Helper lookups ───────────────────────────────────────────────────────────
const stationName  = (id: number) => mockUnits.find(u => u.UnitID === id)?.UnitName ?? "Unknown Station";
const districtOfStation = (id: number) => mockUnits.find(u => u.UnitID === id)?.DistrictID ?? 0;
const statusName   = (id: number) => csvCaseStatuses.find(s => s.CaseStatusID === id)?.CaseStatusName ?? "Unknown";
const gravityName  = (id: number) => csvGravityOffences.find(g => g.GravityOffenceID === id)?.LookupValue ?? "Unknown";
const crimeHead    = (id: number) => mockCrimeHeads.find(h => h.CrimeHeadID === id)?.CrimeGroupName ?? "Unknown";
const crimeSubHead = (id: number) => mockCrimeSubHeads.find(h => h.CrimeSubHeadID === id)?.CrimeSubHeadName ?? "Unknown";
const officerName  = (id: number) => mockEmployees.find(e => e.EmployeeID === id)?.FirstName ?? "Unknown Officer";
const rankName     = (id: number) => csvRanks.find(r => r.RankID === id)?.RankName ?? "";
const courtName    = (id: number) => csvCourts.find(c => c.CourtID === id)?.CourtName ?? "Unknown Court";

/** Build explainable-AI evidence metadata for every data-grounded chat reply */
function buildEvidenceMeta(opts: {
  citations: any[];
  tables: { table: string; fields: string[]; filter?: string; resultCount?: number }[];
  groundingBasis?: string;
  confidence?: number;
}) {
  const n = opts.citations.length;
  const confidence = opts.confidence ?? (n === 0 ? 32 : Math.min(97, 52 + n * 8));
  const groundingBasis = opts.groundingBasis ?? (
    n === 0
      ? "No matching FIR records in CSV data layer"
      : `Grounded in ${n} FIR record${n === 1 ? "" : "s"}`
  );
  return {
    citations: opts.citations,
    confidence,
    groundingBasis,
    reasoningPath: opts.tables,
  };
}

function citationFromCase(c: typeof mockCases[0], reason: string, sourceTable = "CaseMaster") {
  const station = stationName(c.PoliceStationID);
  return {
    firNo: c.CrimeNo,
    caseId: c.CaseMasterID,
    title: `${crimeSubHead(c.CrimeMinorHeadID)} — ${station}`,
    reason,
    stationName: station,
    recordId: `CaseMasterID=${c.CaseMasterID}`,
    sourceTable,
  };
}

function formatCaseList(cases: typeof mockCases, context: string, replyLang: "en" | "kn" = "en") {
  if (!cases.length) {
    return {
      text: replyLang === "kn"
        ? `ಯಾವುದೇ ಎಫ್‌ಐಆರ್ ಹೊಂದಾಣಿಕೆಯಾಗಿಲ್ಲ ${context}. ದಯವಿಟ್ಟು ಫಿಲ್ಟರ್‌ಗಳನ್ನು ಬದಲಾಯಿಸಿ.`
        : `No FIRs matched ${context}. Try widening the crime branch, district, or police station filter.`,
      ...buildEvidenceMeta({
        citations: [],
        tables: [
          { table: "CaseMaster", fields: ["CaseMasterID", "CrimeNo", "PoliceStationID", "CrimeMajorHeadID", "CrimeMinorHeadID"], filter: context, resultCount: 0 },
          { table: "Unit", fields: ["UnitID", "UnitName", "DistrictID"], filter: "station/district join", resultCount: 0 },
        ],
        groundingBasis: replyLang === "kn" ? "ಯಾವುದೇ ಎಫ್‌ಐಆರ್ ಹೊಂದಾಣಿಕೆಯಾಗಿಲ್ಲ" : "Filter search — zero FIR matches",
        confidence: 40,
      }),
    };
  }

  const rows = cases.slice(0, 6).map((c, idx) => {
    const accused = mockAccused.filter(a => a.CaseMasterID === c.CaseMasterID).map(a => a.AccusedName);
    const victims = mockVictims.filter(v => v.CaseMasterID === c.CaseMasterID).map(v => v.VictimName);
    return replyLang === "kn"
      ? `${idx + 1}. ಎಫ್‌ಐಆರ್ ${c.CrimeNo} - ${crimeSubHead(c.CrimeMinorHeadID)}, ${stationName(c.PoliceStationID)}\n   ಸ್ಥಿತಿ: ${statusName(c.CaseStatusID)} | ನೋಂದಣಿ ದಿನಾಂಕ: ${c.CrimeRegisteredDate}\n   ಆರೋಪಿಗಳು: ${accused.join(", ") || "ದಾಖಲಾಗಿಲ್ಲ"} | ಬಲಿಪಶುಗಳು: ${victims.join(", ") || "ದಾಖಲಾಗಿಲ್ಲ"}`
      : `${idx + 1}. FIR ${c.CrimeNo} - ${crimeSubHead(c.CrimeMinorHeadID)}, ${stationName(c.PoliceStationID)}\n   Status: ${statusName(c.CaseStatusID)} | Registered: ${c.CrimeRegisteredDate}\n   Accused: ${accused.join(", ") || "Not recorded"} | Victims: ${victims.join(", ") || "Not recorded"}`;
  });

  const text = replyLang === "kn"
    ? `${context} ಗಾಗಿ ${cases.length} ಹೊಂದಾಣಿಕೆಯಾಗುವ ಎಫ್‌ಐಆರ್ ಪತ್ತೆಯಾಗಿದೆ:\n\n${rows.join("\n\n")}\n\nಹೆಚ್ಚಿನ ವಿವರಗಳಿಗಾಗಿ ಎಫ್‌ಐಆರ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ.`
    : `Found ${cases.length} matching FIR${cases.length === 1 ? "" : "s"} for ${context}:\n\n${rows.join("\n\n")}\n\nUse any FIR number above for a full case summary, or ask a follow-up such as "analyze network for FIR ${cases[0].CrimeNo}".`;
  
  const citations = cases.slice(0, 6).map(c => citationFromCase(c, `Matched ${context}`));

  return {
    text,
    ...buildEvidenceMeta({
      citations,
      tables: [
        { table: "CaseMaster", fields: ["CaseMasterID", "CrimeNo", "PoliceStationID", "CrimeMajorHeadID", "CrimeMinorHeadID", "CaseStatusID"], filter: context, resultCount: cases.length },
        { table: "Accused", fields: ["AccusedName", "CaseMasterID", "PersonID"], filter: "joined on CaseMasterID", resultCount: mockAccused.filter(a => cases.some(c => c.CaseMasterID === a.CaseMasterID)).length },
        { table: "Victim", fields: ["VictimName", "CaseMasterID"], filter: "joined on CaseMasterID", resultCount: mockVictims.filter(v => cases.some(c => c.CaseMasterID === v.CaseMasterID)).length },
        { table: "Unit", fields: ["UnitID", "UnitName"], filter: "PoliceStationID lookup", resultCount: citations.length },
        { table: "CrimeSubHead", fields: ["CrimeSubHeadID", "CrimeHeadName"], filter: "CrimeMinorHeadID lookup", resultCount: citations.length },
      ],
      groundingBasis: replyLang === "kn" ? `${citations.length} ಎಫ್‌ಐಆರ್ ದಾಖಲೆಗಳ ಆಧಾರಿತ` : `Grounded in ${citations.length} FIR record${citations.length === 1 ? "" : "s"} from CaseMaster`,
    }),
  };
}

function findCasesByDiscoveryTerms(message: string, replyLang: "en" | "kn" = "en") {
  const q = message.toLowerCase();
  const matchedHead = mockCrimeHeads.find(h => h.Active && q.includes(h.CrimeGroupName.toLowerCase()));
  const matchedSubHead = mockCrimeSubHeads.find(h => q.includes(h.CrimeSubHeadName.toLowerCase()));
  const matchedDistrict = mockDistricts.find(d => q.includes(d.DistrictName.toLowerCase()));
  const matchedStation = mockUnits.find(u => q.includes(u.UnitName.toLowerCase()));
  const isDiscoveryQuery = q.includes("find fir") || q.includes("show fir") || q.includes("list fir") || q.includes("matching fir") || q.includes("ಎಫ್‌ಐಆರ್");

  if (!matchedHead && !matchedSubHead && !matchedDistrict && !matchedStation && !isDiscoveryQuery) return null;

  let cases = [...mockCases];
  const criteria: string[] = [];

  if (matchedSubHead) {
    cases = cases.filter(c => c.CrimeMinorHeadID === matchedSubHead.CrimeSubHeadID);
    criteria.push(`sub-branch ${matchedSubHead.CrimeSubHeadName}`);
  } else if (matchedHead) {
    cases = cases.filter(c => c.CrimeMajorHeadID === matchedHead.CrimeHeadID);
    criteria.push(`crime branch ${matchedHead.CrimeGroupName}`);
  }

  if (matchedDistrict) {
    cases = cases.filter(c => districtOfStation(c.PoliceStationID) === matchedDistrict.DistrictID);
    criteria.push(`district ${matchedDistrict.DistrictName}`);
  }

  if (matchedStation) {
    cases = cases.filter(c => c.PoliceStationID === matchedStation.UnitID);
    criteria.push(`station ${matchedStation.UnitName}`);
  }

  if (!criteria.length && isDiscoveryQuery) criteria.push("available CSV case records");

  cases.sort((a, b) => new Date(b.CrimeRegisteredDate).getTime() - new Date(a.CrimeRegisteredDate).getTime());
  return formatCaseList(cases, criteria.join(", "), replyLang);
}

// ── AUDIT LOGS ───────────────────────────────────────────────────────────────
app.get("/api/audit-logs", (_req, res) => res.json(auditLogs));

app.post("/api/audit-logs", (req, res) => {
  const { userRole, actionType, details, query } = req.body;
  const log = { id: generateLogId(), timestamp: new Date().toISOString(),
    userRole: userRole || "Investigator", actionType: actionType || "Data View",
    details: details || "Accessed analytical module.", query: query || "" };
  auditLogs.unshift(log);
  res.json(log);
});

// ── DISCOVERY FILTERS ───────────────────────────────────────────────────────
app.get("/api/discovery/filters", (_req, res) => {
  const crimeBranches = mockCrimeHeads
    .filter(h => h.Active)
    .map(h => ({
      id: h.CrimeHeadID,
      name: h.CrimeGroupName,
      count: mockCases.filter(c => c.CrimeMajorHeadID === h.CrimeHeadID).length
    }))
    .filter(h => h.count > 0);

  const crimeSubBranches = mockCrimeSubHeads
    .map(h => ({
      id: h.CrimeSubHeadID,
      branchId: h.CrimeHeadID,
      name: h.CrimeSubHeadName,
      count: mockCases.filter(c => c.CrimeMinorHeadID === h.CrimeSubHeadID).length
    }))
    .filter(h => h.count > 0);

  const activeDistrictIds = new Set(mockCases.map(c => districtOfStation(c.PoliceStationID)));
  const districts = mockDistricts
    .filter(d => activeDistrictIds.has(d.DistrictID))
    .map(d => ({
      id: d.DistrictID,
      name: d.DistrictName,
      count: mockCases.filter(c => districtOfStation(c.PoliceStationID) === d.DistrictID).length
    }));

  const activeStationIds = new Set(mockCases.map(c => c.PoliceStationID));
  const stations = mockUnits
    .filter(u => activeStationIds.has(u.UnitID))
    .map(u => ({
      id: u.UnitID,
      districtId: u.DistrictID,
      name: u.UnitName,
      count: mockCases.filter(c => c.PoliceStationID === u.UnitID).length
    }));

  res.json({ crimeBranches, crimeSubBranches, districts, stations });
});

// ── CONVERSATIONAL AI ────────────────────────────────────────────────────────
app.post("/api/query", async (req, res) => {
  const { message, history = [], language = "en", userRole = "Investigator" } = req.body;
  auditLogs.unshift({ id: generateLogId(), timestamp: new Date().toISOString(), userRole,
    actionType: "Chat Query",
    details: `Queried AI in ${language === "kn" ? "Kannada" : "English"}.`, query: message });
  if (!message) return res.status(400).json({ error: "Message is required." });

  const client = getGeminiClient();

  // Auto-detect Kannada script in the query when UI language was left on English
  const hasKannada = /[\u0C80-\u0CFF]/.test(message);
  const replyLang = hasKannada || language === "kn" ? "kn" : "en";

  // ── Simulation mode (no API key) ─────────────────────────────────────────
  if (!client) {
    const q = message.toLowerCase();
    const knHint = replyLang === "kn";
    let text = knHint
      ? "ಕೆಎಸ್‌ಪಿ ಡೇಟಾಬೇಸ್ ಸ್ಕ್ಯಾನ್ ಮಾಡಲಾಗಿದೆ. ದಯವಿಟ್ಟು ಎಫ್‌ಐಆರ್ ಸಂಖ್ಯೆ, ಆರೋಪಿ ಹೆಸರು ಅಥವಾ ಜಿಲ್ಲೆಯನ್ನು ನಮೂದಿಸಿ."
      : "I have scanned the KSP database. Please specify a FIR number, suspect name, or district for deeper analysis.";
    let evidence = buildEvidenceMeta({
      citations: [],
      tables: [{ table: "CaseMaster", fields: ["CrimeNo", "BriefFacts"], filter: "awaiting query terms", resultCount: 0 }],
      groundingBasis: knHint ? "ಯಾವುದೇ ಎಫ್‌ಐಆರ್ ಹೊಂದಾಣಿಕೆಯಾಗಿಲ್ಲ" : "No FIR records matched yet",
      confidence: 30,
    });

    const packCases = (caseIds: number[], reason: string, tables: any[], basis: string) => {
      const citations = caseIds.map(id => {
        const c = mockCases.find(x => x.CaseMasterID === id);
        return c ? citationFromCase(c, reason) : null;
      }).filter(Boolean);
      return buildEvidenceMeta({ citations: citations as any[], tables, groundingBasis: basis });
    };

    if (q.includes("ramesh") || q.includes("ranga") || message.includes("ರಮೇಶ್")) {
      const cases = mockAccused.filter(a => a.PersonID === "A1").map(a => a.CaseMasterID);
      const caseNos = cases.map(id => mockCases.find(c => c.CaseMasterID === id)?.CrimeNo).filter(Boolean);
      text = knHint
        ? `ರಮೇಶ್ ಕುಮಾರ್ (ರಂಗ) — PersonID A1 — ${cases.length} ಎಫ್‌ಐಆರ್‌ಗಳಿಗೆ ಸಂಬಂಧಿಸಿದ ಮರು-ಅಪರಾಧಿ: ${caseNos.join(", ")}. ಮೋಡಸ್: ರಾತ್ರಿ ಸ್ನ್ಯಾಚಿಂಗ್, ಸಶಸ್ತ್ರ ದರೋಡೆ. ಅಪಾಯ ಅಂಕ: 92/100. ಸಹಚರರು: ಸುರೇಶ್ ಹೆಗ್ಡೆ (A2), ವಿಕ್ರಮ್ ಮಲ್ಹೋತ್ರಾ (A4).`
        : `Ramesh Kumar (Ranga) — PersonID A1 — is a high-risk repeat offender linked to ${cases.length} FIRs: ${caseNos.join(", ")}. MO: nighttime snatching, armed robberies, pry-bar burglaries. Risk Score: 92/100 (CRITICAL). Known associates: Suresh Hegde (A2), Vikram Malhotra (A4).`;
      evidence = packCases(cases, "Ramesh Kumar listed as accused (PersonID A1)", [
        { table: "Accused", fields: ["AccusedName", "PersonID", "CaseMasterID"], filter: "PersonID=A1", resultCount: cases.length },
        { table: "CaseMaster", fields: ["CrimeNo", "PoliceStationID", "CrimeMinorHeadID"], filter: "joined CaseMasterID", resultCount: cases.length },
      ], `Grounded in ${cases.length} FIR records (Accused.csv)`);
    } else if (q.includes("suresh") || q.includes("hegde") || message.includes("ಸುರೇಶ್") || message.includes("ಹೆಗ್ಡೆ")) {
      const cases = mockAccused.filter(a => a.PersonID === "A2").map(a => a.CaseMasterID);
      const caseNos = cases.map(id => mockCases.find(c => c.CaseMasterID === id)?.CrimeNo).filter(Boolean);
      text = knHint
        ? `ಸುರೇಶ್ ಹೆಗ್ಡೆ — PersonID A2 — ${cases.length} ಎಫ್‌ಐಆರ್: ${caseNos.join(", ")}. ಹಣಕಾಸು ಸಂಯೋಜಕ. Tx 9006 ₹85,000 ಮತ್ತು Tx 9002 ₹45,000 ಸ್ವೀಕೃತ. ಅಪಾಯ: 90/100.`
        : `Suresh Hegde — PersonID A2 — linked to ${cases.length} FIRs: ${caseNos.join(", ")}. Acts as financial coordinator and logistics organiser. Received ₹85,000 from electronics fence (Tx 9006) and ₹45,000 from drug network (Tx 9002). Risk Score: 90/100 (CRITICAL).`;
      evidence = packCases(cases, "Suresh Hegde listed as accused (PersonID A2)", [
        { table: "Accused", fields: ["AccusedName", "PersonID"], filter: "PersonID=A2", resultCount: cases.length },
        { table: "FinancialTransaction", fields: ["TransactionID", "Amount", "IsSuspicious"], filter: "linked case proceeds", resultCount: 2 },
      ], `Grounded in ${cases.length} FIR records + FinancialTransaction.csv`);
    } else if (q.includes("vikram") || q.includes("malhotra") || q.includes("cyber") || q.includes("phishing") || q.includes("fraud") || message.includes("ವಿಕ್ರಮ್")) {
      const cases = mockAccused.filter(a => a.PersonID === "A4").map(a => a.CaseMasterID);
      text = knHint
        ? `ವಿಕ್ರಮ್ ಮಲ್ಹೋತ್ರಾ — PersonID A4 — ಸೈಬರ್ ವಂಚನೆ. ಎಫ್‌ಐಆರ್ ${mockCases.find(c=>c.CaseMasterID===1004)?.CrimeNo}: ಕೆ. ರಘುನಾಥ್ ₹12.4 ಲಕ್ಷ. ಮ್ಯೂಲ್: MULE-SBI-8822-0011 → MULE-HDFC-1102-0022 → ಕ್ರಿಪ್ಟೋ (Tx 9003–9005, 9018).`
        : `Vikram Malhotra — PersonID A4 — cyber fraud specialist linked to ${cases.length} FIRs. FIR ${mockCases.find(c=>c.CaseMasterID===1004)?.CrimeNo}: K. Raghunath defrauded ₹12.4 lakh via phishing. Funds layered: SBI mule → HDFC mule → crypto P2P exchange (Txs 9003–9005, 9018). Recommend freeze orders on MULE-SBI-8822-0011 and MULE-HDFC-1102-0022.`;
      evidence = packCases(cases, "Vikram Malhotra accused (PersonID A4)", [
        { table: "Accused", fields: ["PersonID", "CaseMasterID"], filter: "PersonID=A4", resultCount: cases.length },
        { table: "FinancialTransaction", fields: ["FromAccount", "ToAccount", "Amount", "IsSuspicious"], filter: "CaseMasterID=1004", resultCount: 4 },
      ], "Derived from Accused + FinancialTransaction tables");
    } else if (q.includes("kiran") || q.includes("drug") || q.includes("narcotics") || q.includes("ndps") || message.includes("ಕಿರಣ") || message.includes("ಮಾದಕ")) {
      const c1 = mockCases.find(c => c.CaseMasterID === 1002);
      const c2 = mockCases.find(c => c.CaseMasterID === 1011);
      text = knHint
        ? `ಕಿರಣ್ ಗೌಡ — PersonID A3 — ಎರಡು NDPS ಪ್ರಕರಣಗಳು. ಎಫ್‌ಐಆರ್ ${c1?.CrimeNo}: 1.2 ಕೆಜಿ ಕ್ಯಾನಾಬಿಸ್ (ಬೆಂಗಳೂರು). ಎಫ್‌ಐಆರ್ ${c2?.CrimeNo}: MDMA (ಕಬ್ಬನ್ ಪಾರ್ಕ್). Tx 9002 ₹45,000 → ಸುರೇಶ್ ಹೆಗ್ಡೆ.`
        : `Kiran Gowda — PersonID A3 — arrested in two NDPS cases. FIR ${c1?.CrimeNo}: 1.2 kg Hydroponic Cannabis seized near UB City, Bengaluru (Feb 2026). FIR ${c2?.CrimeNo}: MDMA tablets seized at Cubbon Park (Jul 2026). Financial link: ₹45,000 transferred to Suresh Hegde coordinator account (Tx 9002). Supply chain traces to Mangaluru.`;
      evidence = packCases([1002, 1011], "Kiran Gowda (A3) accused", [
        { table: "CaseMaster", fields: ["CrimeNo", "CrimeMajorHeadID"], filter: "NDPS cases 1002,1011", resultCount: 2 },
        { table: "FinancialTransaction", fields: ["TransactionID", "Amount"], filter: "Tx 9002", resultCount: 1 },
      ], "Grounded in 2 FIR records (CaseMaster + ArrestSurrender)");
    } else if (q.includes("financial") || q.includes("money") || q.includes("laundering") || q.includes("mule") || message.includes("ಹಣ") || message.includes("ಮ್ಯೂಲ್")) {
      const suspicious = mockFinancialTransactions.filter(t => t.IsSuspicious);
      const total = suspicious.reduce((s, t) => s + t.Amount, 0);
      text = knHint
        ? `ಹಣಕಾಸು ಗುಪ್ತಚರ: ${suspicious.length} ಅನುಮಾನಾಸ್ಪದ ವಹಿವಾಟುಗಳು, ಒಟ್ಟು ₹${total.toLocaleString("en-IN")}. ಪ್ರಮುಖ ಚೈನ್: Case 1004 — Tx 9003–9005, 9018. ಮ್ಯೂಲ್ ಖಾತೆಗಳು: MULE-SBI-8822-0011, MULE-HDFC-1102-0022.`
        : `Financial intelligence summary: ${suspicious.length} suspicious transactions detected totalling ₹${total.toLocaleString("en-IN")}. Key laundering chain: FIR 1004 (Mangaluru phishing) — ₹4 lakh layered across 3 mule accounts to crypto within 75 minutes (Txs 9003–9005, 9018). Active mule accounts: MULE-SBI-8822-0011, MULE-HDFC-1102-0022, MULE-PNB-6677-0055.`;
      const citations = suspicious.slice(0, 5).map(t => {
        const c = mockCases.find(x => x.CaseMasterID === t.CaseMasterID);
        return {
          firNo: c?.CrimeNo ?? "N/A", caseId: t.CaseMasterID,
          title: `Tx ${t.TransactionID}: ₹${t.Amount.toLocaleString("en-IN")}`,
          reason: t.RiskReason ?? "Suspicious transaction",
          stationName: c ? stationName(c.PoliceStationID) : undefined,
          recordId: `TransactionID=${t.TransactionID}`,
          sourceTable: "FinancialTransaction",
        };
      });
      evidence = buildEvidenceMeta({
        citations,
        tables: [
          { table: "FinancialTransaction", fields: ["TransactionID", "FromAccount", "ToAccount", "Amount", "IsSuspicious", "RiskReason"], filter: "IsSuspicious=1", resultCount: suspicious.length },
          { table: "CaseMaster", fields: ["CrimeNo", "CaseMasterID"], filter: "joined on CaseMasterID", resultCount: citations.length },
        ],
        groundingBasis: knHint ? `${suspicious.length} ಫ್ಲ್ಯಾಗ್ ಮಾಡಿದ ಹಣಕಾಸು ವಹಿವಾಟುಗಳ ಆಧಾರಿತ` : `Derived from financial transaction table (${suspicious.length} flagged rows)`,
      });
    } else {
      const discoveryResult = findCasesByDiscoveryTerms(message, replyLang);
      if (discoveryResult) {
        text = discoveryResult.text;
        evidence = {
          citations: discoveryResult.citations,
          confidence: discoveryResult.confidence,
          groundingBasis: discoveryResult.groundingBasis,
          reasoningPath: discoveryResult.reasoningPath,
        };
      }
    }

    const defaultPrompt = knHint
      ? "ಕೆಎಸ್‌ಪಿ ಡೇಟಾಬೇಸ್ ಸ್ಕ್ಯಾನ್ ಮಾಡಲಾಗಿದೆ. ದಯವಿಟ್ಟು ಎಫ್‌ಐಆರ್ ಸಂಖ್ಯೆ, ಆರೋಪಿ ಹೆಸರು ಅಥವಾ ಜಿಲ್ಲೆಯನ್ನು ನಮೂದಿಸಿ."
      : "I have scanned the KSP database. Please specify a FIR number, suspect name, or district for deeper analysis.";

    if (text === defaultPrompt && (q.match(/\b10\d{15}\b/) || q.match(/\b202600\d{3}\b/) || q.includes("fir") || message.includes("ಎಫ್"))) {
      const caseMatch = mockCases.find(c => message.includes(c.CrimeNo) || message.includes(c.CaseNo) || message.includes(String(c.CaseMasterID)));
      if (caseMatch) {
        const accused = mockAccused.filter(a => a.CaseMasterID === caseMatch.CaseMasterID);
        const victims = mockVictims.filter(v => v.CaseMasterID === caseMatch.CaseMasterID);
        const sections = mockActSections.filter(s => s.CaseMasterID === caseMatch.CaseMasterID).map(s => `${s.ActID} §${s.SectionID}`).join(", ");
        text = knHint
          ? `ಎಫ್‌ಐಆರ್ ${caseMatch.CrimeNo} — ${caseMatch.CrimeRegisteredDate} ರಂದು ${stationName(caseMatch.PoliceStationID)} ನಲ್ಲಿ ನೋಂದಾಯಿತ.\nಗಂಭೀರತೆ: ${gravityName(caseMatch.GravityOffenceID)} | ಸ್ಥಿತಿ: ${statusName(caseMatch.CaseStatusID)}\nಅಪರಾಧ: ${crimeSubHead(caseMatch.CrimeMinorHeadID)}\nವಿಭಾಗಗಳು: ${sections}\nಆರೋಪಿ: ${accused.map(a=>a.AccusedName).join(", ") || "ಅಜ್ಞಾತ"}\nಬಲಿಪಶು: ${victims.map(v=>v.VictimName).join(", ") || "ಅಜ್ಞಾತ"}\nಸಂಕ್ಷಿಪ್ತ: ${caseMatch.BriefFacts}`
          : `FIR ${caseMatch.CrimeNo} — registered ${caseMatch.CrimeRegisteredDate} at ${stationName(caseMatch.PoliceStationID)}.\nGravity: ${gravityName(caseMatch.GravityOffenceID)} | Status: ${statusName(caseMatch.CaseStatusID)}\nOffence: ${crimeSubHead(caseMatch.CrimeMinorHeadID)} (${crimeHead(caseMatch.CrimeMajorHeadID)})\nSections: ${sections}\nAccused: ${accused.map(a=>a.AccusedName).join(", ") || "Unknown"}\nVictims: ${victims.map(v=>v.VictimName).join(", ") || "Unknown"}\nBrief: ${caseMatch.BriefFacts}`;
        evidence = buildEvidenceMeta({
          citations: [citationFromCase(caseMatch, "Direct FIR match")],
          tables: [
            { table: "CaseMaster", fields: ["CrimeNo", "BriefFacts", "PoliceStationID", "GravityOffenceID"], filter: `CaseMasterID=${caseMatch.CaseMasterID}`, resultCount: 1 },
            { table: "Accused", fields: ["AccusedName"], filter: "CaseMasterID join", resultCount: accused.length },
            { table: "Victim", fields: ["VictimName"], filter: "CaseMasterID join", resultCount: victims.length },
            { table: "ActSectionAssociation", fields: ["ActID", "SectionID"], filter: "CaseMasterID join", resultCount: sections ? 1 : 0 },
          ],
          groundingBasis: knHint ? "೧ ಎಫ್‌ಐಆರ್ ದಾಖಲೆಯ ಆಧಾರಿತ" : "Grounded in 1 FIR record",
          confidence: 94,
        });
      } else {
        text = knHint
          ? `ನಿಖರ ಎಫ್‌ಐಆರ್ ಹೊಂದಾಣಿಕೆ ಇಲ್ಲ. ಡೇಟಾಬೇಸ್‌ನಲ್ಲಿ ${mockCases.length} ಸಕ್ರಿಯ ಎಫ್‌ಐಆರ್‌ಗಳಿವೆ. ಮಾನ್ಯ CrimeNo/CaseNo ನೀಡಿ (ಉದಾ. 202600001).`
          : `No exact FIR match found. We have ${mockCases.length} active FIRs in the database. Please provide a valid CrimeNo or CaseNo (e.g., 202600001).`;
      }
    }

    if (text === defaultPrompt && (q.includes("bengaluru") || q.includes("bangalore") || message.includes("ಬೆಂಗಳೂರು") || message.includes("ಮಂಗಳೂರು"))) {
      const cases = mockCases.filter(c => [201, 202, 203, 204, 205].includes(c.PoliceStationID));
      text = knHint
        ? `ಬೆಂಗಳೂರು ನಗರದಲ್ಲಿ ${cases.length} ಸಕ್ರಿಯ ಎಫ್‌ಐಆರ್‌ಗಳು. ಪ್ರಮುಖ ಅಪರಾಧಗಳು: ${[...new Set(cases.map(c => crimeSubHead(c.CrimeMinorHeadID)))].join(", ")}. ಕೊರಮಂಗಲ ಮತ್ತು ಕಬ್ಬನ್ ಪಾರ್ಕ್ ಹೆಚ್ಚು ಸಾಂದ್ರತೆ.`
        : `Bengaluru City has ${cases.length} active FIRs. Top offence types: ${[...new Set(cases.map(c => crimeSubHead(c.CrimeMinorHeadID)))].join(", ")}. Koramangala and Cubbon Park are highest-density stations. Key suspects: Ramesh Kumar (A1, 8 cases), Suresh Hegde (A2, 6 cases). Recommend enhanced night patrols near Koramangala Ring Road.`;
      evidence = packCases(cases.slice(0, 4).map(c => c.CaseMasterID), "Bengaluru City jurisdiction", [
        { table: "CaseMaster", fields: ["CrimeNo", "PoliceStationID"], filter: "stations 201-205", resultCount: cases.length },
        { table: "Unit", fields: ["UnitName", "DistrictID"], filter: "DistrictID=101", resultCount: 5 },
      ], `Grounded in ${Math.min(4, cases.length)} FIR records`);
    }

    return res.json({ text, language: replyLang, ...evidence });
  }

  // ── Gemini mode ──────────────────────────────────────────────────────────
  try {
    const systemCtx = `
You are an expert Criminological AI Agent for Karnataka State Police (KSP).
Respond only from the data below. Do not hallucinate.
Cite exact FIR CrimeNos. Embed citations as: ||CITATIONS||[...]||CITATIONS||
Respond in ${replyLang === "kn" ? "Kannada (ಕನ್ನಡ)" : "English"}.
Also embed evidence meta as: ||EVIDENCE||{"confidence":80,"groundingBasis":"Grounded in N FIR records","reasoningPath":[{"table":"CaseMaster","fields":["CrimeNo"],"resultCount":1}]}||EVIDENCE||

CASES (${mockCases.length}):
${JSON.stringify(mockCases.map(c => ({ id: c.CaseMasterID, no: c.CrimeNo, date: c.CrimeRegisteredDate, station: stationName(c.PoliceStationID), gravity: gravityName(c.GravityOffenceID), status: statusName(c.CaseStatusID), head: crimeHead(c.CrimeMajorHeadID), subhead: crimeSubHead(c.CrimeMinorHeadID), lat: c.latitude, lng: c.longitude, facts: c.BriefFacts })))}

ACCUSED (${mockAccused.length}):
${JSON.stringify(mockAccused.map(a => ({ mid: a.AccusedMasterID, caseId: a.CaseMasterID, name: a.AccusedName, age: a.AgeYear, pid: a.PersonID, associates: a.AssociateIDs })))}

VICTIMS (${mockVictims.length}):
${JSON.stringify(mockVictims.map(v => ({ vid: v.VictimMasterID, caseId: v.CaseMasterID, name: v.VictimName, age: v.AgeYear })))}

FINANCIAL TRANSACTIONS (${mockFinancialTransactions.length}):
${JSON.stringify(mockFinancialTransactions.map(t => ({ id: t.TransactionID, caseId: t.CaseMasterID, from: t.FromAccount, to: t.ToAccount, amount: t.Amount, date: t.TransactionDate, suspicious: t.IsSuspicious, reason: t.RiskReason })))}

ARRESTS (${mockArrestSurrenders.length}):
${JSON.stringify(mockArrestSurrenders.map(a => ({ id: a.ArrestSurrenderID, caseId: a.CaseMasterID, accusedId: a.AccusedMasterID, date: a.ArrestSurrenderDate, officer: officerName(a.IOID) })))}

DISTRICTS (${mockDistricts.length}):
${JSON.stringify(mockDistricts.map(d => ({ id: d.DistrictID, name: d.DistrictName, urban: d.SocioEconomic.urbanizationIndex, stress: d.SocioEconomic.economicStressIndex, migration: d.SocioEconomic.migrationRate, education: d.SocioEconomic.educationLevelIndex, density: d.SocioEconomic.populationDensity })))}
`;

    const chatHistory: any[] = [];
    let lastRole = "";
    for (const h of history) {
      const role = h.sender === "user" ? "user" : "model";
      const txt = h.text?.trim();
      if (!txt) continue;
      if (role === lastRole) { chatHistory[chatHistory.length-1].parts.push({ text: txt }); }
      else { chatHistory.push({ role, parts: [{ text: txt }] }); lastRole = role; }
    }
    const prompt = `[Role: ${userRole}] [Lang: ${replyLang}]\nQuery: "${message}"`;
    if (lastRole === "user") chatHistory[chatHistory.length-1].parts.push({ text: prompt });
    else chatHistory.push({ role: "user", parts: [{ text: prompt }] });

    const response = await client.models.generateContent({
      model: "gemini-2.0-flash", contents: chatHistory,
      config: { systemInstruction: systemCtx, temperature: 0.2 }
    });

    let rawText = response.text || "No response received.";
    let citations: any[] = [];
    let confidence = 70;
    let groundingBasis = replyLang === "kn" ? "ಕನ್ನಡ ಅಪರಾಧ ದತ್ತಸಂಚಯ ಆಧಾರಿತ" : "AI response grounded in CSV crime database";
    let reasoningPath: any[] = [
      { table: "CaseMaster", fields: ["CrimeNo", "BriefFacts", "PoliceStationID"], filter: "Gemini retrieval", resultCount: 0 },
    ];

    const m = rawText.match(/\|\|CITATIONS\|\|([\s\S]*?)\|\|CITATIONS\|\|/);
    if (m) {
      try { citations = JSON.parse(m[1].trim()); } catch {}
      rawText = rawText.replace(/\|\|CITATIONS\|\|[\s\S]*?\|\|CITATIONS\|\|/, "").trim();
    }
    const em = rawText.match(/\|\|EVIDENCE\|\|([\s\S]*?)\|\|EVIDENCE\|\|/);
    if (em) {
      try {
        const parsed = JSON.parse(em[1].trim());
        if (parsed.confidence != null) confidence = parsed.confidence;
        if (parsed.groundingBasis) groundingBasis = parsed.groundingBasis;
        if (Array.isArray(parsed.reasoningPath)) reasoningPath = parsed.reasoningPath;
      } catch {}
      rawText = rawText.replace(/\|\|EVIDENCE\|\|[\s\S]*?\|\|EVIDENCE\|\|/, "").trim();
    }
    if (!citations.length) {
      mockCases.forEach(c => {
        if (message.includes(c.CaseNo) || rawText.includes(c.CrimeNo))
          citations.push(citationFromCase(c, "Mentioned in response"));
      });
    }
    if (citations.length) {
      groundingBasis = replyLang === "kn" ? `${citations.length} ಎಫ್‌ಐಆರ್ ದಾಖಲೆಗಳ ಆಧಾರಿತ` : `Grounded in ${citations.length} FIR record${citations.length === 1 ? "" : "s"}`;
      confidence = Math.min(97, 55 + citations.length * 8);
      reasoningPath = [
        { table: "CaseMaster", fields: ["CrimeNo", "BriefFacts", "PoliceStationID"], filter: "cited in AI answer", resultCount: citations.length },
        { table: "Accused", fields: ["AccusedName", "PersonID"], filter: "joined when suspects referenced", resultCount: mockAccused.filter(a => citations.some(c => c.caseId === a.CaseMasterID)).length },
      ];
    }
    res.json({ text: rawText, language: replyLang, citations, confidence, groundingBasis, reasoningPath });
  } catch (err: any) {
    console.error("Gemini error:", err);
    res.status(500).json({ error: "Intelligence server error. Please retry." });
  }
});

// ── FINANCIAL TRANSACTIONS (CSV-backed for client charts) ────────────────────
app.get("/api/analytics/financial", (_req, res) => {
  const rows = mockFinancialTransactions.map(t => {
    const c = mockCases.find(x => x.CaseMasterID === t.CaseMasterID);
    return {
      ...t,
      firNo: c?.CrimeNo ?? null,
      caseNo: c?.CaseNo ?? null,
      station: c ? stationName(c.PoliceStationID) : null,
      crimeType: c ? crimeSubHead(c.CrimeMinorHeadID) : null,
    };
  });
  res.json({
    transactions: rows,
    summary: {
      total: rows.length,
      suspicious: rows.filter(t => t.IsSuspicious).length,
      volume: rows.reduce((s, t) => s + t.Amount, 0),
      flaggedVolume: rows.filter(t => t.IsSuspicious).reduce((s, t) => s + t.Amount, 0),
    },
  });
});

// ── MISSION CONTROL METRICS (CSV-backed) ───────────────────────────────────
app.get("/api/analytics/mission-control", (_req, res) => {
  const activeInvestigations = mockCases.filter(c => c.CaseStatusID === 2).length;

  // Keep this in step with the offender profiling endpoint: repeat offenders
  // are scored from their linked FIRs, financial flags and chargesheets.
  const personMap = new Map<string, typeof mockAccused[0][]>();
  mockAccused.forEach(a => {
    const entries = personMap.get(a.PersonID) ?? [];
    entries.push(a);
    personMap.set(a.PersonID, entries);
  });
  const highRiskSuspects = [...personMap.values()].filter(entries => {
    if (entries.length < 2) return false;
    const caseIds = [...new Set(entries.map(e => e.CaseMasterID))];
    const cases = caseIds.map(id => mockCases.find(c => c.CaseMasterID === id)).filter(Boolean) as typeof mockCases;
    const hasFinancialLink = mockFinancialTransactions.some(t => caseIds.includes(t.CaseMasterID) && t.IsSuspicious);
    const hasHeinous = cases.some(c => c.GravityOffenceID === 1);
    const chargesheeted = csvChargesheets.some(cs => caseIds.includes(cs.CaseMasterID));
    const riskScore = Math.min(99, 40 + entries.length * 8 + (hasFinancialLink ? 10 : 0) + (hasHeinous ? 10 : 0) + (chargesheeted ? 5 : 0));
    return riskScore >= 70; // HIGH or CRITICAL in /api/analytics/offenders
  }).length;

  const hotspotDistricts = mockDistricts.filter(d => mockUnits.some(u => u.DistrictID === d.DistrictID)).filter(d => {
    const cases = mockCases.filter(c => districtOfStation(c.PoliceStationID) === d.DistrictID);
    const heinous = cases.filter(c => c.GravityOffenceID === 1).length;
    const recentCases = cases.filter(c => new Date(c.CrimeRegisteredDate) >= new Date("2026-05-01")).length;
    const risk = Math.min(99, Math.round(
      (heinous / Math.max(cases.length, 1)) * 40 +
      (d.SocioEconomic.economicStressIndex / 100) * 30 +
      (recentCases / Math.max(cases.length, 1)) * 20 +
      (d.SocioEconomic.migrationRate / 20) * 10
    ));
    return risk >= 50;
  }).length;

  const suspiciousTransactions = mockFinancialTransactions.filter(t => t.IsSuspicious).length;
  res.json({ activeInvestigations, highRiskSuspects, hotspotDistricts, suspiciousTransactions });
});

// ── TRENDS ───────────────────────────────────────────────────────────────────
app.get("/api/analytics/trends", (_req, res) => {
  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  const crimeByMonth = monthNames.map((month, i) => {
    const monthCases = mockCases.filter(c => new Date(c.CrimeRegisteredDate).getMonth() === i);
    return {
      month,
      count: monthCases.length,
      Heinous: monthCases.filter(c => c.GravityOffenceID === 1).length,
      NonHeinous: monthCases.filter(c => c.GravityOffenceID !== 1).length,
    };
  }).filter(m => m.count > 0);

  const crimeByType = mockCrimeSubHeads.map(sub => ({
    name: sub.CrimeSubHeadName,
    value: mockCases.filter(c => c.CrimeMinorHeadID === sub.CrimeSubHeadID).length,
  })).filter(i => i.value > 0);

  const hotspots = mockCases.map(c => ({
    caseId: c.CaseMasterID,
    firNo: c.CrimeNo,
    lat: c.latitude,
    lng: c.longitude,
    weight: c.GravityOffenceID === 1 ? 10 : 5,
    facts: c.BriefFacts,
    station: stationName(c.PoliceStationID),
    crimeType: crimeSubHead(c.CrimeMinorHeadID),
    status: statusName(c.CaseStatusID),
    date: c.CrimeRegisteredDate,
  }));

  res.json({ crimeByMonth, crimeByType, hotspots });
});

// ── TRENDS DETAILED (filtered, with insights) ────────────────────────────────
app.get("/api/analytics/trends-detailed", (req, res) => {
  const { districtId, categoryId, monthKey } = req.query as Record<string, string | undefined>;

  // Build lookup maps
  const districtMap = new Map(mockDistricts.map(d => [d.DistrictID, d.DistrictName]));
  const unitDistrictMap = new Map(mockUnits.filter(u => u.TypeID === 1).map(u => [u.UnitID, u.DistrictID]));

  // Determine districts that have at least one case
  const activeDids = [...new Set(mockCases.map(c => unitDistrictMap.get(c.PoliceStationID)).filter((d): d is number => d !== undefined))];
  const availableDistricts = activeDids
    .map(id => ({ id, name: districtMap.get(id) ?? "Unknown" }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Crime categories that have at least one case
  const activeCatIds = [...new Set(mockCases.map(c => c.CrimeMajorHeadID))];
  const availableCategories = activeCatIds
    .map(id => ({ id, name: mockCrimeHeads.find(h => h.CrimeHeadID === id)?.CrimeGroupName ?? "Unknown" }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Available months (derived from actual data)
  const availableMonthKeys = [...new Set(mockCases.map(c => {
    const d = new Date(c.CrimeRegisteredDate);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }))].sort();

  const monthLabelMap: Record<string, string> = {};
  availableMonthKeys.forEach(k => {
    const [yr, mo] = k.split("-");
    const d = new Date(parseInt(yr), parseInt(mo) - 1, 1);
    monthLabelMap[k] = d.toLocaleString("en-US", { month: "short", year: "numeric" });
  });

  const availableMonths = availableMonthKeys.map(k => ({ key: k, label: monthLabelMap[k] ?? k }));

  // ── Apply filters ──
  const appliedFilters: string[] = [];
  let filtered = mockCases;

  const parsedDistrictId = districtId ? parseInt(districtId, 10) : null;
  const parsedCategoryId = categoryId ? parseInt(categoryId, 10) : null;

  if (parsedDistrictId) {
    filtered = filtered.filter(c => unitDistrictMap.get(c.PoliceStationID) === parsedDistrictId);
    const dn = districtMap.get(parsedDistrictId) ?? districtId;
    appliedFilters.push(`District: ${dn}`);
  }

  if (parsedCategoryId) {
    filtered = filtered.filter(c => c.CrimeMajorHeadID === parsedCategoryId);
    const cn = mockCrimeHeads.find(h => h.CrimeHeadID === parsedCategoryId)?.CrimeGroupName ?? categoryId;
    appliedFilters.push(`Category: ${cn}`);
  }

  if (monthKey) {
    const [yr, mo] = monthKey.split("-").map(Number);
    filtered = filtered.filter(c => {
      const d = new Date(c.CrimeRegisteredDate);
      return d.getFullYear() === yr && (d.getMonth() + 1) === mo;
    });
    appliedFilters.push(`Month: ${monthLabelMap[monthKey] ?? monthKey}`);
  }

  // ── crimeByMonth ──
  // Group by month key from filtered set
  const monthMap = new Map<string, { monthKey: string; month: string; total: number; Heinous: number; NonHeinous: number }>();
  filtered.forEach(c => {
    const d = new Date(c.CrimeRegisteredDate);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("en-US", { month: "short", year: "numeric" });
    if (!monthMap.has(key)) {
      monthMap.set(key, { monthKey: key, month: label, total: 0, Heinous: 0, NonHeinous: 0 });
    }
    const entry = monthMap.get(key)!;
    entry.total++;
    if (c.GravityOffenceID === 1) entry.Heinous++;
    else entry.NonHeinous++;
  });
  const crimeByMonth = [...monthMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v);

  // ── crimeByType ──
  const subHeadMap = new Map<number, { name: string; fullName: string; category: string; value: number }>();
  filtered.forEach(c => {
    const sub = mockCrimeSubHeads.find(s => s.CrimeSubHeadID === c.CrimeMinorHeadID);
    if (!sub) return;
    const cat = mockCrimeHeads.find(h => h.CrimeHeadID === sub.CrimeHeadID)?.CrimeGroupName ?? "Unknown";
    if (!subHeadMap.has(sub.CrimeSubHeadID)) {
      // Truncate name for X-axis (max 14 chars), keep fullName for tooltip
      const shortName = sub.CrimeSubHeadName.length > 14
        ? sub.CrimeSubHeadName.slice(0, 13) + "…"
        : sub.CrimeSubHeadName;
      subHeadMap.set(sub.CrimeSubHeadID, { name: shortName, fullName: sub.CrimeSubHeadName, category: cat, value: 0 });
    }
    subHeadMap.get(sub.CrimeSubHeadID)!.value++;
  });
  const crimeByType = [...subHeadMap.values()]
    .filter(i => i.value > 0)
    .sort((a, b) => b.value - a.value);

  // ── districts grid ──
  const districtRows = activeDids.map(dId => {
    const cases = filtered.filter(c => unitDistrictMap.get(c.PoliceStationID) === dId);
    const allCasesInDistrict = mockCases.filter(c => unitDistrictMap.get(c.PoliceStationID) === dId);
    const heinous = cases.filter(c => c.GravityOffenceID === 1).length;
    const district = mockDistricts.find(d => d.DistrictID === dId);
    const recentCases = cases.filter(c => new Date(c.CrimeRegisteredDate) >= new Date("2026-05-01")).length;
    const risk = Math.min(99, Math.round(
      (heinous / Math.max(cases.length, 1)) * 40 +
      ((district?.SocioEconomic.economicStressIndex ?? 0) / 100) * 30 +
      (recentCases / Math.max(cases.length, 1)) * 20 +
      ((district?.SocioEconomic.migrationRate ?? 0) / 20) * 10
    ));
    const trend = recentCases > cases.length / 2 ? "UPWARD" : recentCases === 0 ? "DOWNWARD" : "STABLE";
    return {
      districtId: dId,
      name: districtMap.get(dId) ?? "Unknown",
      risk,
      activeTrend: trend,
      totalCases: cases.length,
      heinousCases: heinous,
      allCases: allCasesInDistrict.length,
    };
  }).sort((a, b) => b.risk - a.risk);

  // ── Summary ──
  const dates = filtered.map(c => new Date(c.CrimeRegisteredDate)).sort((a, b) => a.getTime() - b.getTime());
  const dateRange = dates.length >= 2
    ? `${dates[0].toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} – ${dates[dates.length - 1].toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`
    : dates.length === 1
      ? dates[0].toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
      : "No data";

  // ── Trend Insights (only from real calculated data) ──
  const insights: { label: string; value: string; direction: "up" | "down" | "neutral" }[] = [];

  if (crimeByType.length > 0) {
    const topCat = crimeByType[0];
    insights.push({
      label: "Highest Crime Sub-Category",
      value: `${topCat.fullName} — ${topCat.value} case${topCat.value !== 1 ? "s" : ""} (${topCat.category})`,
      direction: "up",
    });
  }

  if (crimeByType.length > 1) {
    const bottomCat = crimeByType[crimeByType.length - 1];
    insights.push({
      label: "Lowest Crime Sub-Category",
      value: `${bottomCat.fullName} — ${bottomCat.value} case${bottomCat.value !== 1 ? "s" : ""} (${bottomCat.category})`,
      direction: "down",
    });
  }

  if (crimeByMonth.length >= 2) {
    const last = crimeByMonth[crimeByMonth.length - 1];
    const prev = crimeByMonth[crimeByMonth.length - 2];
    const diff = last.total - prev.total;
    const pct = prev.total > 0 ? Math.round((diff / prev.total) * 100) : null;
    if (diff !== 0) {
      insights.push({
        label: "Month-over-Month Change",
        value: `${last.month}: ${diff > 0 ? "+" : ""}${diff} cases vs ${prev.month}${pct !== null ? ` (${diff > 0 ? "+" : ""}${pct}%)` : ""}`,
        direction: diff > 0 ? "up" : "down",
      });
    }
  }

  if (crimeByMonth.length > 0) {
    const peakMonth = crimeByMonth.reduce((best, m) => m.total > best.total ? m : best, crimeByMonth[0]);
    insights.push({
      label: "Peak Crime Period",
      value: `${peakMonth.month} — ${peakMonth.total} case${peakMonth.total !== 1 ? "s" : ""} registered`,
      direction: "neutral",
    });
  }

  if (districtRows.length > 0 && filtered.length > 0) {
    const topDistrict = districtRows[0];
    if (topDistrict.totalCases > 0) {
      insights.push({
        label: "Highest Risk District",
        value: `${topDistrict.name} — Risk score ${topDistrict.risk}%, ${topDistrict.totalCases} case${topDistrict.totalCases !== 1 ? "s" : ""}`,
        direction: "up",
      });
    }
  }

  const heinousTotal = filtered.filter(c => c.GravityOffenceID === 1).length;
  if (filtered.length > 0) {
    const heinousPct = Math.round((heinousTotal / filtered.length) * 100);
    insights.push({
      label: "Heinous Offence Share",
      value: `${heinousTotal} of ${filtered.length} cases (${heinousPct}%) classified as heinous`,
      direction: heinousPct > 40 ? "up" : heinousPct < 20 ? "down" : "neutral",
    });
  }

  res.json({
    crimeByMonth,
    crimeByType,
    districts: districtRows,
    filters: { availableDistricts, availableCategories, availableMonths },
    summary: {
      totalRecordsAnalyzed: mockCases.length,
      filteredRecords: filtered.length,
      dateRange,
      appliedFilters,
    },
    insights,
  });
});

// ── NETWORK ──────────────────────────────────────────────────────────────────
app.get("/api/analytics/network", (_req, res) => {
  const nodes: any[] = [];
  const edges: any[] = [];
  const nodeSet = new Set<string>();
  const edgeSet = new Set<string>();

  const addNode = (id: string, label: string, type: string, extra: any = {}) => {
    if (!nodeSet.has(id)) { nodeSet.add(id); nodes.push({ id, label, type, ...extra }); }
  };
  const addEdge = (id: string, source: string, target: string, relation: string, extra: any = {}) => {
    if (!edgeSet.has(id)) { edgeSet.add(id); edges.push({ id, source, target, relation, ...extra }); }
  };

  // Accused nodes → case nodes
  mockAccused.forEach(acc => {
    const sid = `suspect_${acc.PersonID}`;
    addNode(sid, acc.AccusedName, "Suspect", { age: acc.AgeYear, gender: acc.GenderID === 1 ? "M" : "F", personId: acc.PersonID });
    const cid = `case_${acc.CaseMasterID}`;
    const mc = mockCases.find(c => c.CaseMasterID === acc.CaseMasterID);
    if (mc) {
      addNode(cid, `FIR ${mc.CaseNo}`, "Case", { crimeNo: mc.CrimeNo, date: mc.CrimeRegisteredDate, type: crimeSubHead(mc.CrimeMinorHeadID), brief: mc.BriefFacts.substring(0, 120) });
      addEdge(`${sid}_IN_${cid}`, sid, cid, "ACCUSED_IN");
    }
    acc.AssociateIDs.forEach(assocPid => {
      const tid = `suspect_${assocPid}`;
      const assoc = mockAccused.find(a => a.PersonID === assocPid);
      if (assoc) {
        addNode(tid, assoc.AccusedName, "Suspect", { age: assoc.AgeYear, gender: assoc.GenderID === 1 ? "M" : "F", personId: assocPid });
        const eid = sid < tid ? `${sid}_ASSOC_${tid}` : `${tid}_ASSOC_${sid}`;
        const src = sid < tid ? sid : tid; const tgt = sid < tid ? tid : sid;
        addEdge(eid, src, tgt, "ASSOCIATE_OF");
      }
    });
  });

  // Victim nodes
  mockVictims.forEach(v => {
    if (!v.VictimName || v.VictimName.startsWith("Society")) return;
    const vid = `victim_${v.VictimMasterID}`;
    addNode(vid, v.VictimName, "Victim", { age: v.AgeYear, police: v.VictimPolice === "1" });
    const cid = `case_${v.CaseMasterID}`;
    if (nodeSet.has(cid)) addEdge(`${vid}_IN_${cid}`, vid, cid, "VICTIM_IN");
  });

  // Financial account nodes
  mockFinancialTransactions.forEach(tx => {
    const fid = `account_${tx.FromAccount.replace(/\s/g,"_")}`;
    const tid = `account_${tx.ToAccount.replace(/\s/g,"_")}`;
    addNode(fid, tx.FromAccount, "Account", { owner: tx.SenderName, suspicious: tx.IsSuspicious });
    addNode(tid, tx.ToAccount, "Account", { owner: tx.RecipientName, suspicious: tx.IsSuspicious });
    addEdge(`tx_${tx.TransactionID}`, fid, tid, "TRANSACTION", { amount: tx.Amount, date: tx.TransactionDate, reason: tx.RiskReason });
    const cid = `case_${tx.CaseMasterID}`;
    if (nodeSet.has(cid)) addEdge(`${fid}_LINKED_${cid}`, fid, cid, "LINKED_TO_CASE");
  });

  res.json({ nodes, edges });
});

// ── SOCIOLOGICAL ─────────────────────────────────────────────────────────────
app.get("/api/analytics/sociological", (_req, res) => {
  // Only districts that have at least one police station in our data
  const activeDistrictIds = new Set(mockUnits.map(u => u.DistrictID));
  const result = mockDistricts
    .filter(d => activeDistrictIds.has(d.DistrictID))
    .map(d => {
      const dc = mockCases.filter(c => districtOfStation(c.PoliceStationID) === d.DistrictID);
      return {
        districtName: d.DistrictName,
        urbanization: d.SocioEconomic.urbanizationIndex,
        migration: d.SocioEconomic.migrationRate,
        stress: d.SocioEconomic.economicStressIndex,
        education: d.SocioEconomic.educationLevelIndex,
        density: d.SocioEconomic.populationDensity,
        propertyCrimes: dc.filter(c => c.CrimeMajorHeadID === 2).length,
        bodyCrimes:     dc.filter(c => c.CrimeMajorHeadID === 1).length,
        cyberCrimes:    dc.filter(c => c.CrimeMajorHeadID === 3).length,
        drugCrimes:     dc.filter(c => c.CrimeMajorHeadID === 4).length,
        womenCrimes:    dc.filter(c => c.CrimeMajorHeadID === 5).length,
        totalCrimes:    dc.length,
      };
    });
  res.json(result);
});

// ── DEMOGRAPHICS ─────────────────────────────────────────────────────────────
// Derived from Accused.csv, Victim.csv, ComplainantDetails.csv, OccupationMaster.csv
app.get("/api/analytics/demographics", (_req, res) => {
  const ageBand = (age: number): string => {
    if (age <= 0)  return "Unknown";
    if (age <= 24) return "18–24";
    if (age <= 30) return "25–30";
    if (age <= 40) return "31–40";
    if (age <= 50) return "41–50";
    return "51+";
  };

  // ── Accused: raw appearance rows (60), grouped by age band
  const accAgeBands: Record<string, number> = {};
  const accGender = { Male: 0, Female: 0 };
  mockAccused.forEach(a => {
    const b = ageBand(a.AgeYear);
    if (b !== "Unknown") accAgeBands[b] = (accAgeBands[b] || 0) + 1;
    if (a.GenderID === 1) accGender.Male++;
    else if (a.GenderID === 2) accGender.Female++;
  });

  // Accused age band → crime type (using all accused rows)
  const headNames: Record<number, string> = {
    1: "Against Body", 2: "Against Property", 3: "Cyber/Financial",
    4: "Narcotics", 5: "Against Women", 6: "Against Children",
    7: "SC/ST", 8: "Public Order", 9: "Corruption", 10: "Road"
  };
  const caseHeadMap: Record<number, number> = {};
  mockCases.forEach(c => { caseHeadMap[c.CaseMasterID] = c.CrimeMajorHeadID; });

  const ageCrimeMatrix: Record<string, Record<string, number>> = {};
  const orderedBands = ["18–24", "25–30", "31–40", "41–50", "51+"];
  orderedBands.forEach(b => { ageCrimeMatrix[b] = {}; });
  mockAccused.forEach(a => {
    const band = ageBand(a.AgeYear);
    if (band === "Unknown") return;
    const headName = headNames[caseHeadMap[a.CaseMasterID]] || "Other";
    ageCrimeMatrix[band][headName] = (ageCrimeMatrix[band][headName] || 0) + 1;
  });

  // ── Victims: age bands + gender (exclude AgeYear=0 placeholders)
  const realVictims = mockVictims.filter(v => v.AgeYear > 0);
  const vicAgeBands: Record<string, number> = {};
  const vicGender = { Male: 0, Female: 0 };
  realVictims.forEach(v => {
    const a = v.AgeYear;
    const b = a < 18 ? "<18" : a <= 30 ? "18–30" : a <= 45 ? "31–45" : a <= 60 ? "46–60" : "61+";
    vicAgeBands[b] = (vicAgeBands[b] || 0) + 1;
    if (v.GenderID === 1) vicGender.Male++;
    else if (v.GenderID === 2) vicGender.Female++;
  });

  // ── Complainant occupation groups (sourced from ComplainantDetails.csv + OccupationMaster.csv)
  const occGroups: Record<string, number[]> = {
    "Private/Professional": [9, 10, 11, 14, 19, 20, 21, 24],
    "Govt / Police":        [12, 13],
    "Homemaker / Retired":  [15, 17],
    "Trader / Self-Employed": [6, 7, 8],
    "Labour / Agriculture": [1, 2, 3, 4, 5, 25],
    "Student":              [16],
    "Unemployed":           [18],
  };
  const occCount: Record<string, number> = {};
  mockComplainants.forEach(c => {
    let group = "Other";
    for (const [g, ids] of Object.entries(occGroups)) {
      if (ids.includes(c.OccupationID)) { group = g; break; }
    }
    occCount[group] = (occCount[group] || 0) + 1;
  });

  res.json({
    accused: {
      totalRows: mockAccused.length,
      gender: accGender,
      ageBands: accAgeBands,
      ageCrimeMatrix,
    },
    victims: {
      totalWithAge: realVictims.length,
      gender: vicGender,
      ageBands: vicAgeBands,
    },
    complainants: {
      total: mockComplainants.length,
      occupationGroups: occCount,
    },
  });
});

// ── OFFENDER PROFILING ───────────────────────────────────────────────────────
app.get("/api/analytics/offenders", (_req, res) => {
  // Group accused by PersonID
  const personMap = new Map<string, typeof mockAccused[0][]>();
  mockAccused.forEach(a => {
    const list = personMap.get(a.PersonID) ?? [];
    list.push(a); personMap.set(a.PersonID, list);
  });

  const profiles: any[] = [];
  personMap.forEach((entries, personId) => {
    if (entries.length < 2) return; // only repeat offenders
    const latest = entries[entries.length - 1];
    const caseIds = [...new Set(entries.map(e => e.CaseMasterID))];
    const cases = caseIds.map(id => mockCases.find(c => c.CaseMasterID === id)).filter(Boolean) as typeof mockCases;
    const crimeTypes = [...new Set(cases.map(c => crimeSubHead(c.CrimeMinorHeadID)))];
    const associates = [...new Set(entries.flatMap(e => e.AssociateIDs))];
    const associateNames = associates.map(pid => mockAccused.find(a => a.PersonID === pid)?.AccusedName).filter(Boolean) as string[];

    const arrests = mockArrestSurrenders.filter(a => caseIds.includes(a.CaseMasterID) && entries.map(e => e.AccusedMasterID).includes(a.AccusedMasterID));
    const chargesheeted = csvChargesheets.filter(cs => caseIds.includes(cs.CaseMasterID)).length > 0;

    // Risk score formula: base 40 + 8 per case + 10 if financial link + 10 if heinous + 5 if chargesheeted
    const hasFinancialLink = mockFinancialTransactions.some(t => caseIds.includes(t.CaseMasterID) && t.IsSuspicious);
    const hasHeinous = cases.some(c => c.GravityOffenceID === 1);
    const rawScore = Math.min(99, 40 + entries.length * 8 + (hasFinancialLink ? 10 : 0) + (hasHeinous ? 10 : 0) + (chargesheeted ? 5 : 0));
    const riskLevel = rawScore >= 85 ? "CRITICAL" : rawScore >= 70 ? "HIGH" : rawScore >= 50 ? "MEDIUM" : "LOW";

    const timeline = cases.map(c => {
      const arrest = mockArrestSurrenders.find(a => a.CaseMasterID === c.CaseMasterID && entries.map(e => e.AccusedMasterID).includes(a.AccusedMasterID));
      return {
        date: arrest ? arrest.ArrestSurrenderDate : c.CrimeRegisteredDate,
        event: arrest
          ? `Arrested for ${crimeSubHead(c.CrimeMinorHeadID)} at ${stationName(c.PoliceStationID)}`
          : `Named suspect in ${crimeSubHead(c.CrimeMinorHeadID)} at ${stationName(c.PoliceStationID)} (FIR ${c.CaseNo})`,
        status: arrest ? (arrest.ArrestSurrenderTypeID === 1 ? "Arrested" : "Surrendered") : "Wanted",
      };
    }).sort((a, b) => a.date.localeCompare(b.date));

    profiles.push({
      personId, name: latest.AccusedName, age: latest.AgeYear,
      gender: latest.GenderID === 1 ? "Male" : latest.GenderID === 2 ? "Female" : "Other",
      totalOffences: caseIds.length,
      crimeHeads: crimeTypes,
      modusOperandi: `Involved in ${crimeTypes.join(", ")}. Active across ${[...new Set(cases.map(c => stationName(c.PoliceStationID)))].join(", ")}.`,
      knownAssociates: [...new Set(associateNames)],
      riskScore: rawScore, riskLevel,
      reasons: [
        `${caseIds.length} distinct FIRs across ${[...new Set(cases.map(c => districtOfStation(c.PoliceStationID)))].length} district(s).`,
        hasHeinous ? "Linked to heinous offences (murder/attempt to murder/armed robbery)." : "Non-heinous property/cyber offences.",
        hasFinancialLink ? "Suspicious financial transactions directly linked to case proceeds." : "No flagged financial links.",
        arrests.length > 0 ? `${arrests.length} prior arrest(s) on record.` : "No arrests yet — active suspect.",
      ],
      timeline,
    });
  });

  // Sort by risk score descending
  profiles.sort((a, b) => b.riskScore - a.riskScore);
  res.json(profiles);
});

// ── DECISION SUPPORT ─────────────────────────────────────────────────────────
app.get("/api/analytics/decision-support/:caseId", (req, res) => {
  const caseId = parseInt(req.params.caseId);
  const mc = mockCases.find(c => c.CaseMasterID === caseId);
  if (!mc) return res.status(404).json({ error: "Case not found." });

  const accused = mockAccused.filter(a => a.CaseMasterID === caseId);
  const victims  = mockVictims.filter(v => v.CaseMasterID === caseId);
  const sections = mockActSections.filter(s => s.CaseMasterID === caseId).map(s => `${s.ActID} §${s.SectionID}`);
  const arrests  = mockArrestSurrenders.filter(a => a.CaseMasterID === caseId);
  const complainant = mockComplainants.find(c => c.CaseMasterID === caseId);
  const distId   = districtOfStation(mc.PoliceStationID);
  const district = mockDistricts.find(d => d.DistrictID === distId);

  // Similar cases by same crime sub-head, different case
  const similar = mockCases
    .filter(c => c.CaseMasterID !== caseId && c.CrimeMinorHeadID === mc.CrimeMinorHeadID)
    .slice(0, 4)
    .map(c => ({
      caseMasterId: c.CaseMasterID, caseNo: c.CaseNo, firNo: c.CrimeNo,
      date: c.CrimeRegisteredDate, station: stationName(c.PoliceStationID),
      status: statusName(c.CaseStatusID), brief: c.BriefFacts.substring(0, 140),
    }));

  // Repeat offenders in this case
  const repeatPersonIds = accused.filter(a => mockAccused.filter(x => x.PersonID === a.PersonID).length > 1).map(a => a.PersonID);

  const recommendations = [
    accused.length ? `Request CDR analysis for accused: ${accused.map(a=>a.AccusedName).join(", ")} — tower dumps near GPS (${mc.latitude}, ${mc.longitude}).` : "Identify and profile suspects; collect witness statements.",
    sections.length ? `Sections invoked: ${sections.join(", ")} — verify chargesheet readiness with ${courtName(mc.CourtID)}.` : "Confirm applicable IPC/BNS sections with the IO.",
    repeatPersonIds.length ? `Repeat offenders detected (${repeatPersonIds.join(", ")}). File for enhanced custody under habitual offender provisions.` : "No known repeat offenders — expand witness canvas.",
    district ? `${district.DistrictName} economic stress index: ${district.SocioEconomic.economicStressIndex}/100. Deploy preventive community policing in high-stress zones.` : "Coordinate with district SP for area-level intelligence.",
    arrests.length ? `${arrests.length} arrest(s) recorded. Ensure production before ${courtName(mc.CourtID)} within statutory deadlines.` : "No arrests yet — issue LOC/NBW if suspects identified.",
  ];

  res.json({
    caseId, firNo: mc.CrimeNo, registeredDate: mc.CrimeRegisteredDate,
    brief: mc.BriefFacts, station: stationName(mc.PoliceStationID),
    gravity: gravityName(mc.GravityOffenceID), status: statusName(mc.CaseStatusID),
    crimeType: crimeSubHead(mc.CrimeMinorHeadID), crimeHead: crimeHead(mc.CrimeMajorHeadID),
    sections,
    investigatingOfficer: officerName(mc.PolicePersonID),
    accusedList: accused.map(a => ({ name: a.AccusedName, age: a.AgeYear, personId: a.PersonID, isRepeat: repeatPersonIds.includes(a.PersonID) })),
    victimList: victims.map(v => ({ name: v.VictimName, age: v.AgeYear, gender: v.GenderID === 1 ? "Male" : "Female", isPolice: v.VictimPolice === "1" })),
    complainant: complainant ? { name: complainant.ComplainantName, age: complainant.AgeYear } : null,
    court: courtName(mc.CourtID),
    similarCases: similar,
    recommendedLeads: recommendations,
    timeline: [
      { time: mc.IncidentFromDate, label: "Incident Started",           description: "Estimated start of crime based on complaint." },
      { time: mc.IncidentToDate,   label: "Incident Concluded",         description: "Estimated end of crime scene activity." },
      { time: mc.InfoReceivedPSDate, label: "Information Received at PS", description: "Time duty officer logged the information." },
      { time: mc.CrimeRegisteredDate, label: "FIR Registered",           description: "Formal entry in the crime register." },
      ...arrests.map(a => ({ time: a.ArrestSurrenderDate, label: a.ArrestSurrenderTypeID === 1 ? "Arrest Made" : "Voluntary Surrender", description: `By IO: ${officerName(a.IOID)}` })),
    ].sort((a, b) => a.time.localeCompare(b.time)),
  });
});

// ── HEATMAP ANALYTICS ────────────────────────────────────────────────────────
app.get("/api/analytics/heatmap", async (req, res) => {
  // Query Zoho Catalyst Data Store if deployed & initialized
  let catalystCases: any[] = [];
  try {
    const catalystApp = catalyst.initialize(req as any);
    const zql = catalystApp.zcql();
    const result = await zql.executeZCQLQuery("SELECT * FROM CaseMaster");
    if (result && Array.isArray(result) && result.length > 0) {
      catalystCases = result.map((r: any) => r.CaseMaster || r);
    }
  } catch (err) {
    // Seamless fallback to CSV data layer
  }

  // Combine CSV cases with Catalyst cases
  const sourceCases = catalystCases.length > 0 ? catalystCases : mockCases;

  // Crime incident layer from CaseMaster (has lat/lng)
  const caseLayer = sourceCases.map(c => {
    const dist = mockDistricts.find(d => d.DistrictID === districtOfStation(c.PoliceStationID));
    return {
      layer: "case",
      caseNo: c.CaseNo,
      crimeNo: c.CrimeNo,
      lat: c.latitude,
      lng: c.longitude,
      district: dist?.DistrictName ?? "Unknown",
      station: stationName(c.PoliceStationID),
      crimeType: crimeSubHead(c.CrimeMinorHeadID),
      crimeHead: crimeHead(c.CrimeMajorHeadID),
      severity: c.GravityOffenceID === 1 ? "heinous" : "standard",
      status: statusName(c.CaseStatusID),
      date: c.CrimeRegisteredDate,
      weight: c.GravityOffenceID === 1 ? 10 : 5,
      isSuspicious: false,
    };
  });

  // Arrest layer — use station GPS from cases in same station
  const arrestLayer = mockArrestSurrenders.map(a => {
    const relCase = mockCases.find(c => c.CaseMasterID === a.CaseMasterID);
    if (!relCase) return null;
    const dist = mockDistricts.find(d => d.DistrictID === a.ArrestSurrenderDistrictId);
    const accused = mockAccused.find(acc => acc.AccusedMasterID === a.AccusedMasterID);
    return {
      layer: "arrest",
      caseNo: relCase.CaseNo,
      crimeNo: relCase.CrimeNo,
      lat: relCase.latitude,
      lng: relCase.longitude,
      district: dist?.DistrictName ?? "Unknown",
      station: stationName(a.PoliceStationID),
      crimeType: crimeSubHead(relCase.CrimeMinorHeadID),
      crimeHead: crimeHead(relCase.CrimeMajorHeadID),
      severity: relCase.GravityOffenceID === 1 ? "heinous" : "standard",
      status: "Arrested",
      date: a.ArrestSurrenderDate,
      weight: 8,
      suspectName: accused?.AccusedName ?? "Unknown",
      isSuspicious: false,
    };
  }).filter(Boolean);

  // Financial fraud layer — use case GPS for linked cases
  const financialLayer = mockFinancialTransactions
    .filter(t => t.IsSuspicious)
    .map(t => {
      const relCase = mockCases.find(c => c.CaseMasterID === t.CaseMasterID);
      if (!relCase) return null;
      const dist = mockDistricts.find(d => d.DistrictID === districtOfStation(relCase.PoliceStationID));
      return {
        layer: "financial",
        caseNo: relCase.CaseNo,
        crimeNo: relCase.CrimeNo,
        lat: relCase.latitude,
        lng: relCase.longitude,
        district: dist?.DistrictName ?? "Unknown",
        station: stationName(relCase.PoliceStationID),
        crimeType: "Financial Fraud / Money Laundering",
        crimeHead: "Financial Crime",
        severity: "heinous",
        status: "Under Investigation",
        date: t.TransactionDate,
        amount: t.Amount,
        weight: 9,
        isSuspicious: true,
        riskReason: t.RiskReason,
      };
    }).filter(Boolean);

  const all = [...caseLayer, ...arrestLayer, ...financialLayer];
  res.json(all);
});

// ── FORECASTING / EARLY WARNINGS ─────────────────────────────────────────────
app.get("/api/analytics/forecasting", (_req, res) => {
  // Compute hotspot risk per district from actual case data
  const hotspotsRisk = mockDistricts
    .filter(d => mockUnits.some(u => u.DistrictID === d.DistrictID))
    .map(d => {
      const cases = mockCases.filter(c => districtOfStation(c.PoliceStationID) === d.DistrictID);
      const heinous = cases.filter(c => c.GravityOffenceID === 1).length;
      const recentCases = cases.filter(c => new Date(c.CrimeRegisteredDate) >= new Date("2026-05-01")).length;
      const risk = Math.min(99, Math.round(
        (heinous / Math.max(cases.length, 1)) * 40 +
        (d.SocioEconomic.economicStressIndex / 100) * 30 +
        (recentCases / Math.max(cases.length, 1)) * 20 +
        (d.SocioEconomic.migrationRate / 20) * 10
      ));
      const trend = recentCases > cases.length / 2 ? "UPWARD" : recentCases === 0 ? "DOWNWARD" : "STABLE";
      return { name: d.DistrictName, risk, activeTrend: trend, totalCases: cases.length, heinousCases: heinous };
    })
    .sort((a, b) => b.risk - a.risk);

  // Dynamic early warnings from actual repeat-offender and financial data
  const repeatOffenderCases = mockAccused.filter(a => mockAccused.filter(x => x.PersonID === a.PersonID).length >= 3);
  const suspiciousFinancial = mockFinancialTransactions.filter(t => t.IsSuspicious);
  const drugCases = mockCases.filter(c => c.CrimeMajorHeadID === 4);
  const cyberCases = mockCases.filter(c => c.CrimeMajorHeadID === 3);

  const warnings: any[] = [];

  if (repeatOffenderCases.length > 0) {
    const topPid = repeatOffenderCases[0].PersonID;
    const topName = repeatOffenderCases[0].AccusedName;
    const topCases = mockAccused.filter(a => a.PersonID === topPid).map(a => a.CaseMasterID);
    const stations = [...new Set(topCases.map(id => stationName(mockCases.find(c=>c.CaseMasterID===id)?.PoliceStationID ?? 0)))];
    warnings.push({
      id: "W_001", title: "Repeat Offender Network Active",
      location: stations.join(", "),
      confidence: Math.min(97, 70 + topCases.length * 5), severity: "HIGH",
      reasoning: `${topName} (PersonID ${topPid}) linked to ${topCases.length} FIRs. Pattern indicates active multi-station criminal network.`,
      actionProposed: `Issue look-out circular for ${topName}. Deploy plainclothes units near known MO locations. Coordinate with all implicated stations.`,
    });
  }

  if (suspiciousFinancial.length >= 3) {
    const muleAccounts = [...new Set(suspiciousFinancial.map(t => t.ToAccount))].slice(0,3);
    const totalAmt = suspiciousFinancial.reduce((s, t) => s + t.Amount, 0);
    warnings.push({
      id: "W_002", title: "Active Money Mule Network Detected",
      location: "Mangaluru → Bengaluru corridor",
      confidence: 85, severity: "HIGH",
      reasoning: `${suspiciousFinancial.length} suspicious transactions totalling ₹${totalAmt.toLocaleString("en-IN")} detected. Three-phase laundering (placement → layering → crypto) confirmed in FIR 1004.`,
      actionProposed: `Freeze mule accounts: ${muleAccounts.join(", ")}. Notify RBI Financial Intelligence Unit. Coordinate with cyber cell for crypto trace.`,
    });
  }

  if (drugCases.length >= 2) {
    const drugStations = [...new Set(drugCases.map(c => stationName(c.PoliceStationID)))];
    warnings.push({
      id: "W_003", title: "Inter-District Drug Supply Network",
      location: drugStations.join(" → "),
      confidence: 78, severity: "HIGH",
      reasoning: `${drugCases.length} NDPS cases registered. Interrogation intelligence indicates Mangaluru-sourced cannabis/MDMA routed to Bengaluru via private logistics. Financial ties to Suresh Hegde coordinator account confirmed.`,
      actionProposed: "Conduct surprise inspections at private courier hubs. Deploy NDPS intelligence units on NH-75 Mangaluru-Bengaluru corridor.",
    });
  }

  if (cyberCases.length >= 2) {
    const cyberDistricts = [...new Set(cyberCases.map(c => { const d = mockDistricts.find(x => x.DistrictID === districtOfStation(c.PoliceStationID)); return d?.DistrictName ?? "Unknown"; }))];
    warnings.push({
      id: "W_004", title: "Cyber Fraud Campaign Targeting Elderly Citizens",
      location: cyberDistricts.join(", "),
      confidence: 80, severity: "MEDIUM",
      reasoning: `${cyberCases.length} cyber fraud/phishing FIRs registered across ${cyberDistricts.length} district(s). Victims predominantly senior citizens. Multi-state organised gang pattern detected.`,
      actionProposed: "Issue public advisories through local media. Brief bank branch managers on OTP-phishing patterns. Share Vikram Malhotra (A4) profile with cyber cells in all districts.",
    });
  }

  res.json({ warnings, hotspotsRisk });
});

// ── STATIC / VITE ─────────────────────────────────────────────────────────────
if (process.env.NODE_ENV === "development") {
  startVite();
} else {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (_req, res) => res.sendFile(path.join(distPath, "index.html")));
  app.listen(Number(PORT), () => console.log(`Production server on port ${PORT}`));
}

async function startVite() {
  const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
  app.use(vite.middlewares);
  app.listen(Number(PORT), "0.0.0.0", () => console.log(`Dev server on http://localhost:${PORT}`));
}
