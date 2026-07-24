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

// ── CONVERSATIONAL AI ────────────────────────────────────────────────────────
app.post("/api/query", async (req, res) => {
  const { message, history = [], language = "en", userRole = "Investigator" } = req.body;
  auditLogs.unshift({ id: generateLogId(), timestamp: new Date().toISOString(), userRole,
    actionType: "Chat Query",
    details: `Queried AI in ${language === "kn" ? "Kannada" : "English"}.`, query: message });
  if (!message) return res.status(400).json({ error: "Message is required." });

  const client = getGeminiClient();

  // ── Simulation mode (no API key) ─────────────────────────────────────────
  if (!client) {
    const q = message.toLowerCase();
    let text = "I have scanned the KSP database. Please specify a FIR number, suspect name, or district for deeper analysis.";
    let citations: any[] = [];

    if (q.includes("ramesh") || q.includes("ranga")) {
      const cases = mockAccused.filter(a => a.PersonID === "A1").map(a => a.CaseMasterID);
      const caseNos = cases.map(id => mockCases.find(c => c.CaseMasterID === id)?.CrimeNo).filter(Boolean);
      text = `Ramesh Kumar (Ranga) — PersonID A1 — is a high-risk repeat offender linked to ${cases.length} FIRs: ${caseNos.join(", ")}. MO: nighttime snatching, armed robberies, pry-bar burglaries. Risk Score: 92/100 (CRITICAL). Known associates: Suresh Hegde (A2), Vikram Malhotra (A4).`;
      citations = cases.map(id => { const c = mockCases.find(x => x.CaseMasterID === id); return c ? { firNo: c.CrimeNo, caseId: id, title: crimeSubHead(c.CrimeMinorHeadID) + " — " + stationName(c.PoliceStationID), reason: "Ramesh Kumar listed as accused (PersonID A1)" } : null; }).filter(Boolean);
    } else if (q.includes("suresh") || q.includes("hegde")) {
      const cases = mockAccused.filter(a => a.PersonID === "A2").map(a => a.CaseMasterID);
      const caseNos = cases.map(id => mockCases.find(c => c.CaseMasterID === id)?.CrimeNo).filter(Boolean);
      text = `Suresh Hegde — PersonID A2 — linked to ${cases.length} FIRs: ${caseNos.join(", ")}. Acts as financial coordinator and logistics organiser. Received ₹85,000 from electronics fence (Tx 9006) and ₹45,000 from drug network (Tx 9002). Risk Score: 90/100 (CRITICAL).`;
      citations = cases.map(id => { const c = mockCases.find(x => x.CaseMasterID === id); return c ? { firNo: c.CrimeNo, caseId: id, title: crimeSubHead(c.CrimeMinorHeadID) + " — " + stationName(c.PoliceStationID), reason: "Suresh Hegde listed as accused (PersonID A2)" } : null; }).filter(Boolean);
    } else if (q.includes("vikram") || q.includes("malhotra") || q.includes("cyber") || q.includes("phishing") || q.includes("fraud")) {
      const cases = mockAccused.filter(a => a.PersonID === "A4").map(a => a.CaseMasterID);
      text = `Vikram Malhotra — PersonID A4 — cyber fraud specialist linked to ${cases.length} FIRs. FIR ${mockCases.find(c=>c.CaseMasterID===1004)?.CrimeNo}: K. Raghunath defrauded ₹12.4 lakh via phishing. Funds layered: SBI mule → HDFC mule → crypto P2P exchange (Txs 9003–9005, 9018). Recommend freeze orders on MULE-SBI-8822-0011 and MULE-HDFC-1102-0022.`;
      citations = cases.map(id => { const c = mockCases.find(x => x.CaseMasterID === id); return c ? { firNo: c.CrimeNo, caseId: id, title: "Cyber Fraud — " + stationName(c.PoliceStationID), reason: "Vikram Malhotra accused (PersonID A4)" } : null; }).filter(Boolean);
    } else if (q.includes("kiran") || q.includes("drug") || q.includes("narcotics") || q.includes("ndps")) {
      const c1 = mockCases.find(c => c.CaseMasterID === 1002);
      const c2 = mockCases.find(c => c.CaseMasterID === 1011);
      text = `Kiran Gowda — PersonID A3 — arrested in two NDPS cases. FIR ${c1?.CrimeNo}: 1.2 kg Hydroponic Cannabis seized near UB City, Bengaluru (Feb 2026). FIR ${c2?.CrimeNo}: MDMA tablets seized at Cubbon Park (Jul 2026). Financial link: ₹45,000 transferred to Suresh Hegde coordinator account (Tx 9002). Supply chain traces to Mangaluru.`;
      citations = [c1, c2].filter(Boolean).map(c => ({ firNo: c!.CrimeNo, caseId: c!.CaseMasterID, title: "Narcotics — " + stationName(c!.PoliceStationID), reason: "Kiran Gowda (A3) accused" }));
    } else if (q.includes("financial") || q.includes("money") || q.includes("laundering") || q.includes("mule")) {
      const suspicious = mockFinancialTransactions.filter(t => t.IsSuspicious);
      const total = suspicious.reduce((s, t) => s + t.Amount, 0);
      text = `Financial intelligence summary: ${suspicious.length} suspicious transactions detected totalling ₹${total.toLocaleString("en-IN")}. Key laundering chain: FIR 1004 (Mangaluru phishing) — ₹4 lakh layered across 3 mule accounts to crypto within 75 minutes (Txs 9003–9005, 9018). Active mule accounts: MULE-SBI-8822-0011, MULE-HDFC-1102-0022, MULE-PNB-6677-0055.`;
      citations = suspicious.slice(0,3).map(t => { const c = mockCases.find(x => x.CaseMasterID === t.CaseMasterID); return { firNo: c?.CrimeNo ?? "N/A", caseId: t.CaseMasterID, title: `Tx ${t.TransactionID}: ₹${t.Amount.toLocaleString("en-IN")}`, reason: t.RiskReason ?? "Suspicious transaction" }; });
    } else if (q.match(/\b10\d{15}\b/) || q.match(/\b202600\d{3}\b/) || q.includes("fir")) {
      const caseMatch = mockCases.find(c => message.includes(c.CrimeNo) || message.includes(c.CaseNo) || message.includes(String(c.CaseMasterID)));
      if (caseMatch) {
        const accused = mockAccused.filter(a => a.CaseMasterID === caseMatch.CaseMasterID);
        const victims = mockVictims.filter(v => v.CaseMasterID === caseMatch.CaseMasterID);
        const sections = mockActSections.filter(s => s.CaseMasterID === caseMatch.CaseMasterID).map(s => `${s.ActID} §${s.SectionID}`).join(", ");
        text = `FIR ${caseMatch.CrimeNo} — registered ${caseMatch.CrimeRegisteredDate} at ${stationName(caseMatch.PoliceStationID)}.\nGravity: ${gravityName(caseMatch.GravityOffenceID)} | Status: ${statusName(caseMatch.CaseStatusID)}\nOffence: ${crimeSubHead(caseMatch.CrimeMinorHeadID)} (${crimeHead(caseMatch.CrimeMajorHeadID)})\nSections: ${sections}\nAccused: ${accused.map(a=>a.AccusedName).join(", ") || "Unknown"}\nVictims: ${victims.map(v=>v.VictimName).join(", ") || "Unknown"}\nBrief: ${caseMatch.BriefFacts}`;
        citations = [{ firNo: caseMatch.CrimeNo, caseId: caseMatch.CaseMasterID, title: crimeSubHead(caseMatch.CrimeMinorHeadID) + " — " + stationName(caseMatch.PoliceStationID), reason: "Direct FIR match" }];
      } else {
        text = `No exact FIR match found. We have ${mockCases.length} active FIRs in the database. Please provide a valid CrimeNo or CaseNo (e.g., 202600001).`;
      }
    } else if (q.includes("bengaluru") || q.includes("bangalore")) {
      const cases = mockCases.filter(c => [201,202,203,204,205].includes(c.PoliceStationID));
      text = `Bengaluru City has ${cases.length} active FIRs. Top offence types: ${[...new Set(cases.map(c => crimeSubHead(c.CrimeMinorHeadID)))].join(", ")}. Koramangala and Cubbon Park are highest-density stations. Key suspects: Ramesh Kumar (A1, 8 cases), Suresh Hegde (A2, 6 cases). Recommend enhanced night patrols near Koramangala Ring Road.`;
      citations = cases.slice(0,3).map(c => ({ firNo: c.CrimeNo, caseId: c.CaseMasterID, title: crimeSubHead(c.CrimeMinorHeadID) + " — " + stationName(c.PoliceStationID), reason: "Bengaluru City jurisdiction" }));
    } else if (language === "kn") {
      text = "ಕರ್ನಾಟಕ ರಾಜ್ಯ ಪೊಲೀಸ್ ಅಪರಾಧ ಗುಪ್ತಚರ ವ್ಯವಸ್ಥೆಗೆ ಸ್ವಾಗತ. ದಯವಿಟ್ಟು ಆರೋಪಿ ಹೆಸರು, ಎಫ್‌ಐಆರ್ ಸಂಖ್ಯೆ ಅಥವಾ ಜಿಲ್ಲೆಯ ಹೆಸರು ನಮೂದಿಸಿ.";
    }

    return res.json({ text, language, citations });
  }

  // ── Gemini mode ──────────────────────────────────────────────────────────
  try {
    const systemCtx = `
You are an expert Criminological AI Agent for Karnataka State Police (KSP).
Respond only from the data below. Do not hallucinate.
Cite exact FIR CrimeNos. Embed citations as: ||CITATIONS||[...]||CITATIONS||
Respond in ${language === "kn" ? "Kannada" : "English"}.

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
    const prompt = `[Role: ${userRole}] [Lang: ${language}]\nQuery: "${message}"`;
    if (lastRole === "user") chatHistory[chatHistory.length-1].parts.push({ text: prompt });
    else chatHistory.push({ role: "user", parts: [{ text: prompt }] });

    const response = await client.models.generateContent({
      model: "gemini-2.0-flash", contents: chatHistory,
      config: { systemInstruction: systemCtx, temperature: 0.2 }
    });

    let rawText = response.text || "No response received.";
    let citations: any[] = [];
    const m = rawText.match(/\|\|CITATIONS\|\|([\s\S]*?)\|\|CITATIONS\|\|/);
    if (m) {
      try { citations = JSON.parse(m[1].trim()); } catch {}
      rawText = rawText.replace(/\|\|CITATIONS\|\|[\s\S]*?\|\|CITATIONS\|\|/, "").trim();
    }
    if (!citations.length) {
      mockCases.forEach(c => {
        if (message.includes(c.CaseNo) || rawText.includes(c.CrimeNo))
          citations.push({ firNo: c.CrimeNo, caseId: c.CaseMasterID, title: crimeSubHead(c.CrimeMinorHeadID) + " — " + stationName(c.PoliceStationID), reason: "Mentioned in response" });
      });
    }
    res.json({ text: rawText, language, citations });
  } catch (err: any) {
    console.error("Gemini error:", err);
    res.status(500).json({ error: "Intelligence server error. Please retry." });
  }
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
