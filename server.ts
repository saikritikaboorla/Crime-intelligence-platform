import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

import {
  mockCases,
  mockComplainants,
  mockVictims,
  mockAccused,
  mockActSections,
  mockFinancialTransactions,
  mockArrestSurrenders,
  mockDistricts,
  mockUnits,
  mockCrimeHeads,
  mockCrimeSubHeads,
  mockEmployees
} from "./src/mockData";

const app = express();
const PORT = process.env.X_ZOHO_CATALYST_LISTEN_PORT || process.env.PORT || 3000;
console.log("AppSail PORT configured:", PORT, "X_ZOHO_CATALYST_LISTEN_PORT:", process.env.X_ZOHO_CATALYST_LISTEN_PORT, "PORT:", process.env.PORT);

app.use(express.json({ limit: "10mb" }));

// In-memory audit logs store
const auditLogs: any[] = [
  {
    id: "LOG_001",
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    userRole: "Supervisor",
    actionType: "System Init",
    details: "KSP Crime Intelligence Platform initialized.",
    query: ""
  }
];

let logCounter = 1000;
const generateLogId = () => {
  return `LOG_${Date.now()}_${++logCounter}_${Math.floor(Math.random() * 1000)}`;
};

// Initialize Gemini Client helper dynamically
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "ksp-crime-intel-platform"
      }
    }
  });
}

// -------------------------------------------------------------
// API Routes
// -------------------------------------------------------------

// Audit Log endpoint
app.get("/api/audit-logs", (req, res) => {
  res.json(auditLogs);
});

app.post("/api/audit-logs", (req, res) => {
  const { userRole, actionType, details, query } = req.body;
  const newLog = {
    id: generateLogId(),
    timestamp: new Date().toISOString(),
    userRole: userRole || "Investigator",
    actionType: actionType || "Data View",
    details: details || "Accessed analytical module.",
    query: query || ""
  };
  auditLogs.unshift(newLog);
  res.json(newLog);
});

// Conversational AI Query
app.post("/api/query", async (req, res) => {
  const { message, history = [], language = "en", userRole = "Investigator" } = req.body;

  // Log audit trail
  const logId = generateLogId();
  auditLogs.unshift({
    id: logId,
    timestamp: new Date().toISOString(),
    userRole: userRole,
    actionType: "Chat Query",
    details: `User queried the conversational AI in ${language === "kn" ? "Kannada" : "English"}.`,
    query: message
  });

  if (!message) {
    return res.status(400).json({ error: "Message is required." });
  }

  // Fetch the Gemini client dynamically
  const activeClient = getGeminiClient();

  // If Gemini is not initialized, run in simulation mode with mock responses
  if (!activeClient) {
    // Simulated intelligent response
    const lowercaseMsg = message.toLowerCase();
    let simText = "I have scanned the KSP database. Could you please specify a FIR number, suspect name, or district for deeper analysis?";
    let citations: any[] = [];

    if (lowercaseMsg.includes("ramesh") || lowercaseMsg.includes("ranga")) {
      simText = "Investigator, I found 3 matches for 'Ramesh Kumar (Ranga)' (PersonID: P_RAMESH_01). He is registered as a repeat offender with a high risk score of 85/100. He is currently linked to FIR 101010202202600001 (Koramangala Theft), FIR 101020203202600003 (Mysuru Burglary), and FIR 101010202202600007 (Koramangala Warehouse Armed Robbery). His standard modus operandi is night burglaries and armed robberies using heavy iron bars. He frequently collaborates with Suresh Hegde (P_SURESH_02). Shall I pull up his criminal network graph or investigation timelines?";
      citations = [
        { firNo: "101010202202600001", caseId: 1001, title: "Armed Robbery in Koramangala", reason: "Direct suspect linked to night snatching" },
        { firNo: "101010202202600007", caseId: 1007, title: "Koramangala Appliances Robbery", reason: "Identified by voice/build by night guard" }
      ];
    } else if (lowercaseMsg.includes("fir") || lowercaseMsg.includes("1001") || lowercaseMsg.includes("202600001")) {
      simText = "Displaying records for FIR No: 101010202202600001 registered at Koramangala Police Station on 2026-01-10. This is classified as Heinous under IPC Sections 379 and 380 (Property Theft & Dwelling Theft). The complainant is Venkatesh Prasad, and the accused are Ramesh Kumar and Suresh Hegde. The incident involved three masked individuals snatching a gold chain and wallet. The investigation status is currently 'Under Investigation'. Similar past cases indicate an emerging robbery hotspot in South Bengaluru.";
      citations = [{ firNo: "101010202202600001", caseId: 1001, title: "Koramangala Robbery Case", reason: "Exact match for requested FIR record" }];
    } else if (lowercaseMsg.includes("suresh") || lowercaseMsg.includes("hegde")) {
      simText = "Suresh Hegde (PersonID: P_SURESH_02, Age: 30) is linked as a primary suspect in FIR 101010202202600001 (Theft) and FIR 101050202202600005 (Koramangala Murder Case). He is also highlighted in our Financial Link Analysis as receiving regular round-number deposits (such as ₹45,000) from Kiran Gowda right before drug transactions, and ₹85,000 from an unknown electronics fence. He appears to act as a financial and logistics coordinator for local gang activities in South Bengaluru.";
      citations = [
        { firNo: "101010202202600001", caseId: 1001, title: "Koramangala Robbery", reason: "Listed as co-accused" },
        { firNo: "101010202202600005", caseId: 1005, title: "Koramangala Murder Case", reason: "Under investigation for personal grudge link" }
      ];
    } else if (lowercaseMsg.includes("cyber") || lowercaseMsg.includes("fraud") || lowercaseMsg.includes("phishing") || lowercaseMsg.includes("1004")) {
      simText = "Analyzing Cyber Fraud Case (FIR 101030204202600004) registered at Kadri, Mangaluru on 2026-03-28. The victim K. Raghunath was defrauded of ₹12.4 Lakhs via OTP/phishing. The funds were quickly layered across multiple accounts: transferred first to Mule Account SBI-8822 (linked to Vikram Malhotra), then to Mule Account HDFC-1102, and finally integrated into crypto via a peer-to-peer exchange. I recommend requesting a freeze order on SBI-8822 and HDFC-1102 immediately and issuing a lookup circular for Vikram Malhotra.";
      citations = [
        { firNo: "101030204202600004", caseId: 1004, title: "Mangaluru Phishing Fraud", reason: "Direct financial fraud case description" }
      ];
    } else if (lowercaseMsg.includes("drug") || lowercaseMsg.includes("narcotics") || lowercaseMsg.includes("cannabis") || lowercaseMsg.includes("weed")) {
      simText = "Retrieving Narcotics records. FIR 101010201202600002 was registered at Cubbon Park Police Station on 2026-02-14 regarding a raid near UB City where 1.2 kg of Hydroponic Weed was seized from Kiran Gowda. Kiran Gowda's financial trail shows transfers to Suresh Hegde, suggesting Suresh is organizing or financing the supply from Mangaluru. This forms an active inter-district narcotics network.";
      citations = [
        { firNo: "101010201202600002", caseId: 1002, title: "UB City Narcotics Raid", reason: "Narcotics trafficking arrest" }
      ];
    } else if (language === "kn") {
      simText = "ಕರ್ನಾಟಕ ರಾಜ್ಯ ಪೊಲೀಸ್ ಅಪರಾಧ ದತ್ತಸಂಚಯಕ್ಕೆ ಸುಸ್ವಾಗತ. ನಾನು ಕೆಎಸ್ಪಿ ಕೃತಕ ಬುದ್ಧಿಮತ್ತೆ ಸಹಾಯಕ. ರಮೇಶ್ ಕುಮಾರ್, ಸುರೇಶ್ ಹೆಗ್ಡೆ, ಅಥವಾ ಎಫ್ಐಆರ್ 1001 ರ ಬಗ್ಗೆ ವಿಚಾರಿಸಲು ದಯವಿಟ್ಟು ಕೇಳಿ. (Translated: Welcome to KSP database. Please ask about Ramesh Kumar, Suresh Hegde, or FIR 1001.)";
    }

    return res.json({
      text: simText,
      language,
      citations
    });
  }

  // If Gemini is active, let's assemble the query prompt with schema context
  try {
    const serializedSchema = `
DATA TABLES AVAILABLE:
1. CaseMaster: ${JSON.stringify(mockCases.map(c => ({ id: c.CaseMasterID, No: c.CrimeNo, Date: c.CrimeRegisteredDate, Station: c.PoliceStationID, Major: c.CrimeMajorHeadID, Minor: c.CrimeMinorHeadID, lat: c.latitude, lng: c.longitude, facts: c.BriefFacts })))}
2. Accused: ${JSON.stringify(mockAccused)}
3. Victim: ${JSON.stringify(mockVictims)}
4. Complainants: ${JSON.stringify(mockComplainants)}
5. ActSectionAssociation: ${JSON.stringify(mockActSections)}
6. FinancialTransactions: ${JSON.stringify(mockFinancialTransactions)}
7. ArrestSurrender: ${JSON.stringify(mockArrestSurrenders)}
8. Districts: ${JSON.stringify(mockDistricts.map(d => ({ id: d.DistrictID, name: d.DistrictName, socio: d.SocioEconomic })))}
9. Units/Stations: ${JSON.stringify(mockUnits)}

DIRECTIONS FOR RESPONSE:
- You are an expert Criminological AI Agent supporting Karnataka State Police (KSP) investigators.
- Users can query in English or Kannada. Speak in the selected language. If they query in Kannada, respond in Kannada, but keep citations matching original FIR numbers.
- Answer their query objectively using ONLY the facts present in the data tables above. Do not hallucinate outside cases.
- Cite the exact FIR numbers (CrimeNo) and suspect names whenever relevant using JSON citations.
- Include a section "REASONING PATH:" at the very bottom explaining exactly how you correlated the files, victims, or suspects.
- Keep the tone formal, highly professional, analytical, and authoritative.
- Output a JSON structure at the end of your text containing the citations, like this:
  ||CITATIONS||[{"firNo": "...", "caseId": 1001, "title": "...", "reason": "..."}]||CITATIONS||
    `;

    const chatHistory: any[] = [];
    let lastRole = "";
    for (const h of history) {
      const role = h.sender === "user" ? "user" : "model";
      const text = h.text?.trim();
      if (!text) continue;

      if (role === lastRole) {
        if (chatHistory.length > 0) {
          chatHistory[chatHistory.length - 1].parts.push({ text });
        }
      } else {
        chatHistory.push({
          role,
          parts: [{ text }]
        });
        lastRole = role;
      }
    }

    const prompt = `
[User Role: ${userRole}]
[Preferred Response Language: ${language === "kn" ? "Kannada" : "English"}]
User query: "${message}"

Respond using the guidelines. Address the question fully. If you need to translate, please do so. Make sure the citations array is accurate.
    `;

    // Ensure alternating user/model turns
    if (lastRole === "user") {
      chatHistory[chatHistory.length - 1].parts.push({ text: prompt });
    } else {
      chatHistory.push({
        role: "user",
        parts: [{ text: prompt }]
      });
    }

    const response = await activeClient.models.generateContent({
      model: "gemini-3.6-flash",
      contents: chatHistory,
      config: {
        systemInstruction: serializedSchema,
        temperature: 0.2
      }
    });

    let rawText = response.text || "No response received from the intelligence layer.";

    // Extract citations from response text if embedded in the custom format
    let citations: any[] = [];
    const citationsMatch = rawText.match(/\|\|CITATIONS\|\|([\s\S]*?)\|\|CITATIONS\|\|/);
    if (citationsMatch) {
      try {
        citations = JSON.parse(citationsMatch[1].trim());
        // Clean up the text of the citation tag
        rawText = rawText.replace(/\|\|CITATIONS\|\|[\s\S]*?\|\|CITATIONS\|\|/, "").trim();
      } catch (err) {
        console.error("Failed to parse citations from Gemini output:", err);
      }
    }

    // Default heuristic fallback for citations if none extracted
    if (citations.length === 0) {
      mockCases.forEach(c => {
        if (message.includes(c.CaseNo) || rawText.includes(c.CrimeNo)) {
          citations.push({
            firNo: c.CrimeNo,
            caseId: c.CaseMasterID,
            title: c.CrimeNo.startsWith("104") ? `Theft in Hubballi` : `Case at station ${c.PoliceStationID}`,
            reason: "Mentioned or correlated in the analytical response."
          });
        }
      });
    }

    res.json({
      text: rawText,
      language,
      citations
    });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: "The intelligence server encountered an error processing your query. Please try again." });
  }
});

// Analytics: Crime Trends
app.get("/api/analytics/trends", (req, res) => {
  // Aggregate crime data for charting
  const crimeByMonth = [
    { month: "Jan", count: 1, Heinous: 1, NonHeinous: 0 },
    { month: "Feb", count: 1, Heinous: 1, NonHeinous: 0 },
    { month: "Mar", count: 2, Heinous: 1, NonHeinous: 1 },
    { month: "Apr", count: 1, Heinous: 1, NonHeinous: 0 },
    { month: "May", count: 2, Heinous: 1, NonHeinous: 1 },
    { month: "Jun", count: 1, Heinous: 1, NonHeinous: 0 }
  ];

  const crimeByType = mockCrimeSubHeads.map(sub => {
    const cases = mockCases.filter(c => c.CrimeMinorHeadID === sub.CrimeSubHeadID);
    return {
      name: sub.CrimeSubHeadName,
      value: cases.length
    };
  }).filter(item => item.value > 0);

  const hotspots = mockCases.map(c => ({
    caseId: c.CaseMasterID,
    firNo: c.CrimeNo,
    lat: c.latitude,
    lng: c.longitude,
    weight: c.GravityOffenceID === 1 ? 10 : 5,
    facts: c.BriefFacts,
    station: mockUnits.find(u => u.UnitID === c.PoliceStationID)?.UnitName || "Unknown Station"
  }));

  res.json({
    crimeByMonth,
    crimeByType,
    hotspots
  });
});

// Analytics: Criminal Network & Relationship Analysis
app.get("/api/analytics/network", (req, res) => {
  const nodes: any[] = [];
  const edges: any[] = [];
  const nodeSet = new Set<string>();
  const edgeSet = new Set<string>();

  const addNode = (id: string, label: string, type: string, details: any) => {
    if (!nodeSet.has(id)) {
      nodeSet.add(id);
      nodes.push({ id, label, type, ...details });
    }
  };

  const addEdge = (id: string, source: string, target: string, relation: string, extra: any = {}) => {
    if (!edgeSet.has(id)) {
      edgeSet.add(id);
      edges.push({ id, source, target, relation, ...extra });
    }
  };

  // 1. Accused nodes & relationships
  mockAccused.forEach(acc => {
    const suspectId = `suspect_${acc.PersonID}`;
    addNode(suspectId, acc.AccusedName, "Suspect", {
      age: acc.AgeYear,
      gender: acc.GenderID === 1 ? "M" : "F"
    });

    const caseId = `case_${acc.CaseMasterID}`;
    const matchedCase = mockCases.find(c => c.CaseMasterID === acc.CaseMasterID);
    if (matchedCase) {
      addNode(caseId, `FIR ${matchedCase.CaseNo}`, "Case", {
        crimeNo: matchedCase.CrimeNo,
        registeredDate: matchedCase.CrimeRegisteredDate,
        brief: matchedCase.BriefFacts
      });

      addEdge(`${suspectId}_ACCUSED_IN_${caseId}`, suspectId, caseId, "ACCUSED_IN");
    }

    // Direct associate links (normalized bi-directionally)
    acc.AssociateIDs.forEach(assocId => {
      const targetSuspectId = `suspect_${assocId}`;
      const matchedAssoc = mockAccused.find(a => a.PersonID === assocId);
      if (matchedAssoc) {
        addNode(targetSuspectId, matchedAssoc.AccusedName, "Suspect", {
          age: matchedAssoc.AgeYear,
          gender: matchedAssoc.GenderID === 1 ? "M" : "F"
        });

        const edgeId = suspectId < targetSuspectId
          ? `${suspectId}_ASSOCIATE_${targetSuspectId}`
          : `${targetSuspectId}_ASSOCIATE_${suspectId}`;
        const source = suspectId < targetSuspectId ? suspectId : targetSuspectId;
        const target = suspectId < targetSuspectId ? targetSuspectId : suspectId;

        addEdge(edgeId, source, target, "ASSOCIATE_OF");
      }
    });
  });

  // 2. Add Victim links
  mockVictims.forEach(v => {
    const victimId = `victim_${v.VictimMasterID}`;
    addNode(victimId, v.VictimName, "Victim", {
      age: v.AgeYear,
      police: v.VictimPolice === "1"
    });

    const caseId = `case_${v.CaseMasterID}`;
    if (nodeSet.has(caseId)) {
      addEdge(`${victimId}_VICTIM_IN_${caseId}`, victimId, caseId, "VICTIM_IN");
    }
  });

  // 3. Add Financial Bank accounts and links
  mockFinancialTransactions.forEach(tx => {
    const fromAccId = `account_${tx.FromAccount}`;
    const toAccId = `account_${tx.ToAccount}`;

    addNode(fromAccId, tx.FromAccount, "Account", {
      owner: tx.SenderName,
      isSuspicious: tx.IsSuspicious
    });

    addNode(toAccId, tx.ToAccount, "Account", {
      owner: tx.RecipientName,
      isSuspicious: tx.IsSuspicious
    });

    addEdge(`tx_${tx.TransactionID}`, fromAccId, toAccId, "TRANSACTIONS", {
      amount: tx.Amount,
      date: tx.TransactionDate,
      reason: tx.RiskReason
    });

    // Link account back to case if relevant
    const caseId = `case_${tx.CaseMasterID}`;
    if (nodeSet.has(caseId)) {
      addEdge(`${fromAccId}_LINKED_CASE_${caseId}`, fromAccId, caseId, "LINKED_TO_CASE");
    }
  });

  res.json({ nodes, edges });
});

// Analytics: Sociological Insights
app.get("/api/analytics/sociological", (req, res) => {
  const correlations = mockDistricts.map(d => {
    const districtCases = mockCases.filter(c => {
      const station = mockUnits.find(u => u.UnitID === c.PoliceStationID);
      return station?.DistrictID === d.DistrictID;
    });

    const propertyCrimes = districtCases.filter(c => c.CrimeMajorHeadID === 2).length;
    const bodyCrimes = districtCases.filter(c => c.CrimeMajorHeadID === 1).length;
    const cyberCrimes = districtCases.filter(c => c.CrimeMajorHeadID === 3).length;
    const drugCrimes = districtCases.filter(c => c.CrimeMajorHeadID === 4).length;

    return {
      districtName: d.DistrictName,
      urbanization: d.SocioEconomic.urbanizationIndex,
      migration: d.SocioEconomic.migrationRate,
      stress: d.SocioEconomic.economicStressIndex,
      education: d.SocioEconomic.educationLevelIndex,
      density: d.SocioEconomic.populationDensity,
      propertyCrimes,
      bodyCrimes,
      cyberCrimes,
      drugCrimes,
      totalCrimes: districtCases.length
    };
  });

  res.json(correlations);
});

// Analytics: Criminology-Based Offender Profiling
app.get("/api/analytics/offenders", (req, res) => {
  const offenderProfiles = [
    {
      personId: "P_RAMESH_01",
      name: "Ramesh Kumar (Ranga)",
      age: 28,
      gender: "Male",
      totalOffences: 3,
      crimeHeads: ["Robbery / Theft", "Burglary"],
      modusOperandi: "Nighttime entry using pry bars, snatching by motorcycle pillion. Focuses on gold and electronic assets. Operates across Bengaluru and Mysuru.",
      knownAssociates: ["Suresh Hegde", "Vikram Malhotra"],
      riskScore: 85,
      riskLevel: "HIGH",
      reasons: [
        "Repeat conviction and active arrest history in three separate property files.",
        "Use of weapons (knives) in armed street muggings (FIR 1001).",
        "Inter-district mobility between major cities (Bengaluru, Mysuru, Hubballi)."
      ],
      timeline: [
        { date: "2026-01-10", event: "Named as suspect in Koramangala Gold Snatching Case (FIR 1001)", status: "Under Investigation" },
        { date: "2026-01-15", event: "Arrested by Koramangala IO Meera Bai; produced before judicial court", status: "Custody" },
        { date: "2026-03-05", event: "Latent fingerprints match house robbery in Mysuru (FIR 1003)", status: "Linked" },
        { date: "2026-05-20", event: "Identified in Armed Robbery at Electronics Warehouse (FIR 1007)", status: "Active Suspect" }
      ]
    },
    {
      personId: "P_SURESH_02",
      name: "Suresh Hegde",
      age: 30,
      gender: "Male",
      totalOffences: 2,
      crimeHeads: ["Theft", "Murder", "Financial Transactions"],
      modusOperandi: "Financial coordinator, fence connection, and logistics organizer. Rarely commits primary offense alone, recruits youth.",
      knownAssociates: ["Ramesh Kumar", "Kiran Gowda"],
      riskScore: 90,
      riskLevel: "CRITICAL",
      reasons: [
        "Active link as organizer in high-profile Koramangala Murder (FIR 1005).",
        "Direct transactional links receiving money from drug networks and stolen inventory fences.",
        "Facilitating local street gang operational logistics."
      ],
      timeline: [
        { date: "2026-01-10", event: "Named co-accused in gold snatching incident (FIR 1001)", status: "Fleeing" },
        { date: "2026-02-14", event: "Received illicit money transfers from arrested drug peddler Kiran Gowda", status: "Under Audit" },
        { date: "2026-04-12", event: "Under active investigation for Koramangala Merchant Murder (FIR 1005)", status: "Wanted" },
        { date: "2026-05-21", event: "Received ₹85,000 from unknown buyer account linked to warehouse goods fence", status: "Flagged" }
      ]
    },
    {
      personId: "P_VIKRAM_03",
      name: "Vikram Malhotra",
      age: 32,
      gender: "Male",
      totalOffences: 2,
      crimeHeads: ["Cyber Fraud", "Robbery Support"],
      modusOperandi: "Cyber phishing, setting up digital mule networks, and routing scammed funds through crypto laundering.",
      knownAssociates: ["Ramesh Kumar"],
      riskScore: 72,
      riskLevel: "MEDIUM",
      reasons: [
        "Linked to high-tech phishing scam netting ₹12.4 Lakhs from senior citizen (FIR 1004).",
        "Technical facilitator for routing physical crime cash-out into untraceable crypto wallets."
      ],
      timeline: [
        { date: "2026-03-27", event: "Phishing attack launched, withdrawing funds through multi-tier mule accounts", status: "Active" },
        { date: "2026-03-28", event: "Case registered under IT Act Section 66D at Mangaluru (FIR 1004)", status: "Wanted" }
      ]
    }
  ];

  res.json(offenderProfiles);
});

// Analytics: Investigator Decision Support
app.get("/api/analytics/decision-support/:caseId", (req, res) => {
  const caseId = parseInt(req.params.caseId);
  const matchedCase = mockCases.find(c => c.CaseMasterID === caseId);

  if (!matchedCase) {
    return res.status(404).json({ error: "Case not found." });
  }

  // Generate Automated case summaries & recommendations
  const stationName = mockUnits.find(u => u.UnitID === matchedCase.PoliceStationID)?.UnitName || "Unknown Station";
  const officers = mockEmployees.filter(e => e.UnitID === matchedCase.PoliceStationID);
  const leadOfficer = officers[0] ? officers[0].FirstName : "Sandeep Patil";

  const criminalHistoryMatch = mockAccused.filter(acc => acc.CaseMasterID === caseId);
  const suspectNames = criminalHistoryMatch.map(a => a.AccusedName);

  // Similar past cases by CrimeMinorHeadID
  const similarPastCases = mockCases
    .filter(c => c.CaseMasterID !== caseId && c.CrimeMinorHeadID === matchedCase.CrimeMinorHeadID)
    .map(c => ({
      caseMasterId: c.CaseMasterID,
      caseNo: c.CaseNo,
      date: c.CrimeRegisteredDate,
      brief: c.BriefFacts,
      status: c.CaseStatusID === 2 ? "Under Investigation" : "Charge Sheeted"
    }));

  const recommendations = [
    "Cross-verify alibis of associates " + suspectNames.join(" and ") + " for the incident timeframe.",
    "Issue immediate CDR (Call Detail Record) requests for deceased / suspect nodes matching towers in " + stationName + " jurisdiction.",
    "Initiate formal bank lock mandates on flagged transactional nodes from nearby accounts.",
    "Deploy night patrol beats near GPS coord (lat: " + matchedCase.latitude + ", lng: " + matchedCase.longitude + ") during peak hours (22:00 to 02:00) as spatial patterns predict repeat burglaries."
  ];

  res.json({
    caseId,
    firNo: matchedCase.CrimeNo,
    registeredDate: matchedCase.CrimeRegisteredDate,
    brief: matchedCase.BriefFacts,
    station: stationName,
    investigatingOfficer: leadOfficer,
    accusedList: suspectNames,
    similarCases: similarPastCases,
    recommendedLeads: recommendations,
    timeline: [
      { time: matchedCase.IncidentFromDate, label: "Crime Incident Started", description: "Estimated start of crime based on complaint details." },
      { time: matchedCase.IncidentToDate, label: "Crime Incident Completed", description: "Estimated conclusion of crime scene activities." },
      { time: matchedCase.InfoReceivedPSDate, label: "Information Received at Station", description: "Time when duty officer logged the information." },
      { time: matchedCase.CrimeRegisteredDate, label: "FIR Formally Registered", description: "Formal case entry into the police crime register." }
    ]
  });
});

// Analytics: Crime Forecasting & Early Warning
app.get("/api/analytics/forecasting", (req, res) => {
  // Early warning alerts
  const warnings = [
    {
      id: "W_001",
      title: "Emerging Property Robbery Hotspot",
      location: "Koramangala 4th & 5th Block, Bengaluru",
      confidence: 94,
      severity: "HIGH",
      reasoning: "Three incidents of nighttime chain snatching and warehouse looting registered in the last 4 months within a 1.5km radius. Modus operandi matches repeat offender Ramesh Kumar's gang pattern.",
      actionProposed: "Deploy evening police interceptors; conduct surprise checkpoints on black motorcycles near Koramangala Ring Road junction."
    },
    {
      id: "W_002",
      title: "Mule Account Fraud Campaign Alert",
      location: "South-DK District (Mangaluru)",
      confidence: 82,
      severity: "MEDIUM",
      reasoning: "Phishing scam linked to Vikram Malhotra indicates immediate multi-tier layering transfers to local public sector accounts followed by rapid crypto conversion. High risk of wider campaigns targeting senior citizens.",
      actionProposed: "Collaborate with SBI and HDFC branches in Mangaluru for immediate ledger hold on newly created high-velocity personal accounts."
    },
    {
      id: "W_003",
      title: "Inter-District Drug Supply Vector",
      location: "Mangaluru to Bengaluru Corridor (UB City area)",
      confidence: 76,
      severity: "HIGH",
      reasoning: "Interrogations of Kiran Gowda (P_KIRAN_04) reveal active shipments of hydroponic marijuana routed via private intercity logistics. Suresh Hegde is organizing Bengaluru-end deliveries.",
      actionProposed: "Perform random inspections of private bus courier drops at Bengaluru terminals during early morning hours."
    }
  ];

  // Predictive hotspot heatmap scores for districts
  const hotspotsRisk = [
    { name: "Bengaluru City (Koramangala)", risk: 88, activeTrend: "UPWARD" },
    { name: "Bengaluru City (Cubbon Park)", risk: 65, activeTrend: "STABLE" },
    { name: "Mysuru (Lakshmipuram)", risk: 42, activeTrend: "STABLE" },
    { name: "Mangaluru (Kadri)", risk: 78, activeTrend: "UPWARD" },
    { name: "Hubballi-Dharwad", risk: 54, activeTrend: "DOWNWARD" },
    { name: "Kalaburagi Town", risk: 70, activeTrend: "UPWARD" }
  ];

  res.json({
    warnings,
    hotspotsRisk
  });
});

// Vite middleware setup (Express v4 / v5 dynamic)
if (process.env.NODE_ENV === "development") {
  startVite();
} else {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
  app.get("*", (req, res) => {
    res.sendFile(path.join(distPath, "index.html"));
  });
  app.listen(Number(PORT), () => {
    console.log(`Production Server running on port ${PORT}`);
  });
}

async function startVite() {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa"
  });
  app.use(vite.middlewares);

  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Development Server running on http://localhost:${PORT}`);
  });
}
