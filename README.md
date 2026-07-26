# KSP Crime Intelligence Hub

> **An AI-powered Crime Analytics & Intelligence Platform built for Karnataka State Police**

**Live URL:** [crime-platform-50044257151.development.catalystappsail.in](https://crime-platform-50044257151.development.catalystappsail.in/)

<img width="1600" height="995" alt="image" src="https://github.com/user-attachments/assets/e2aa0691-aa07-4a0d-98bb-e9615d1fafec" />

---

## Problem Statement

Karnataka State Police investigators, analysts, and supervisors face a critical operational bottleneck: crime records are siloed across FIR databases, accused registries, financial transaction logs, and district socio-economic datasets. Extracting actionable intelligence requires manual cross-referencing across multiple systems — a process that is slow, error-prone, and inaccessible to non-technical users.

There is no unified interface to:

- Query FIR records in natural language
- Visualise criminal networks and financial money flows
- Correlate socio-economic factors with crime patterns
- Profile repeat offenders and predict recidivism
- Generate automated investigative leads and early warnings

---

## Solution Overview

The **KSP Crime Intelligence Hub** transforms the Karnataka State Police FIR relational database into an interactive intelligence system. It enables investigators, analysts, supervisors, and policymakers to:

- Ask questions in plain English or Kannada and receive structured, cited intelligence reports
- Explore criminal networks visually with an interactive SVG graph
- Analyse crime trends, hotspots, and sociological correlations through data visualisations
- Profile repeat offenders with risk scoring and modus operandi analysis
- Track suspicious financial transactions and money-laundering chains
- Get early-warning forecasts for emerging crime hotspots, with a tamper-evident audit trail for DPDP Act compliance

<img width="1600" height="999" alt="image" src="https://github.com/user-attachments/assets/f128a859-c7a2-4883-99ae-56ba968bfacf" />


## Features

| Tab / Module | Requirement | Description |
|---|---|---|
| **Mission Control** | — | Executive dashboard: AI daily brief, live KPIs, alerts, quick actions, trend mini-chart |
| **Conversational AI Search** | FR-1 | Natural-language queries in English & Kannada (text + voice) with cited, explainable answers |
| **Criminal Network Graph** | FR-2, FR-7 | Interactive SVG graph of accused–victim–case–account relationships, with zoom/pan/filter |
| **Crime Hotspots & Trends** | FR-3 | Monthly crime velocity area chart + IPC category bar chart |
| **Sociological Insights** | FR-4 | 4-chart dashboard (bar, stacked-bar, scatter, radar) with an AI insight card under each chart |
| **Offender Profiling** | FR-5 | Repeat-offender dossiers with recidivism risk scores, MO analysis, and timelines |
| **Decision Support** | FR-6 | Automated case summaries, chronological timelines, similar past cases, tactical leads |
| **Financial Trace** | FR-7 | Mule-account detection and 3-phase money-laundering chain visualisation |
| **Early Warning Alarms** | FR-8 | Predictive gang/crime cluster signals with patrol deployment actions |
| **Audit Vault** | FR-10 | Role-based, DPDP-compliant, tamper-evident audit trail of all user actions |

<!--
  ADD A NETWORK GRAPH SCREENSHOT HERE.
  Save as `screenshots/network-graph.png` and uncomment below.
-->
<!-- ![Criminal Network Graph](./screenshots/network-graph.png) -->

<!--
  ADD A SOCIOLOGICAL INSIGHTS SCREENSHOT HERE.
  Save as `screenshots/sociological-insights.png` and uncomment below.
-->
<!-- ![Sociological Insights](./screenshots/sociological-insights.png) -->

---

## AI Engine

- **Gemini 2.0 Flash** (`@google/genai`) powers conversational queries with grounded, citation-backed responses.
- **Simulation fallback** — when no API key is set, the system returns realistic mock intelligence derived from the actual dataset, so it works out of the box.
- Every response is structured (Summary, Key Findings, Persons Involved, Evidence, Risk Assessment, Recommended Actions) and cites the exact FIR records used.

```
User Query (text / voice)
        │
        ▼
Language Detection (EN / KN)
        │
        ▼
POST /api/query
        │
        ├── Gemini API key present? ── YES ──► Gemini 2.0 Flash → structured, cited report
        └── NO ───────────────────────────────► Simulation Engine → cited mock report
        │
        ▼
Audit Log Written → Response rendered in Chat UI
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser — React SPA                       │
│   Mission Control · Chat AI · Network Graph · Insights        │
│   Profiling · Decision Support · Financial Trace · Forecasting│
└───────────────────────────┬───────────────────────────────────┘
                            │ HTTP REST
┌───────────────────────────▼───────────────────────────────────┐
│         Express API Server (server.ts) on Catalyst AppSail    │
│  /api/query → Gemini AI + mock fallback                       │
│  /api/analytics/* → computed from mockData.ts                 │
│  /api/audit-logs → audit store                                │
└───────────────────────────┬───────────────────────────────────┘
                            │
┌───────────────────────────▼───────────────────────────────────┐
│        Data Layer — src/mockData.ts (aligned with the         │
│        Police FIR ER Diagram): FIR Cases · Accused · Victims  │
│        · Financial Transactions · Districts · Socio-Economic  │
└─────────────────────────────────────────────────────────────┘
```

Deployed on **Zoho Catalyst AppSail** (managed Node.js hosting). Catalyst Data Store, Authentication, File Store, Cache, and Search are the planned production migration path for the in-memory stores used in this prototype — see [`KSP_Crime_AI_Documentation.md`](./KSP_Crime_AI_Documentation.md) for the full service-by-service plan.

---

## Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19 + TypeScript + Vite 6 + Tailwind CSS 4 |
| **Backend / API** | Node.js + Express (TypeScript) |
| **AI Engine** | Google Gemini 2.0 Flash (`@google/genai`), with simulation fallback |
| **Network Graph** | Custom interactive SVG (zoom, pan, concentric & hierarchy layouts) |
| **Charts** | Recharts 3 (Area, Bar, Scatter, Radar, stacked Bar) |
| **Animations** | Framer Motion (`motion/react`) + CSS keyframes |
| **Icons** | Lucide React |
| **Voice** | Web Speech API (SpeechRecognition + SpeechSynthesis), English & Kannada |
| **Deployment** | Zoho Catalyst AppSail |

---

## Security & Governance

- **Role-based clearance levels:** Investigator (L1) · Analyst (L2) · Supervisor (L3) · Policymaker (L4)
- **DPDP Act compliance:** every query, navigation, and AI interaction generates a non-repudiable audit log
- **Citation grounding:** every AI response cites the exact FIR records used as evidence
- **Explainable AI:** no black-box outputs — every answer includes its reasoning chain and source citations

---

## Setup

**Prerequisites:** Node.js v18+, npm, and the Catalyst CLI (`npm install -g @zohocrm/catalyst-cli`) if you plan to deploy.

```bash
git clone <repository-url>
cd Crime-intelligence-platform
npm install
cp .env.example .env        # optional — set GEMINI_API_KEY, or leave unset for simulation mode
npm run dev                 # open http://localhost:3000
npm run build && npm start  # production build + run
```

To deploy: `catalyst login && npm run build && catalyst deploy` (uses `app-config.json` / `catalyst.json`).

---

## Future Scope

- Migrate from `mockData.ts` to a live Catalyst Data Store with a real FIR ingestion pipeline
- Integrate Catalyst Authentication for SSO with the Karnataka Police identity system
- Add Catalyst Functions for serverless analytics and Catalyst Search for full-text FIR indexing
- Add a geographical heatmap overlay using district GPS coordinates
- Extend voice support to Telugu, Tamil, and Hindi
- Implement PDF export of intelligence reports and real-time alert push notifications

---

## Documentation

Full architecture, functional requirements, database schema, folder structure, and API reference are documented in [`KSP_Crime_AI_Documentation.md`](./KSP_Crime_AI_Documentation.md).

Dataset schema is defined in [`Police_FIR_ER_Diagram (1).pdf`](./Police_FIR_ER_Diagram%20(1).pdf).

## License

MIT
