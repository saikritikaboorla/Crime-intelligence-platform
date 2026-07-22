# KSP Crime Intelligence Hub

> **An AI-powered Crime Analytics & Intelligence Platform built for Karnataka State Police**

**Live URL:** https://crime-platform-50044257151.development.catalystappsail.in/

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

The **KSP Crime Intelligence Hub** is a production-grade AI platform that transforms the Karnataka State Police FIR relational database into an interactive intelligence system. It enables investigators, analysts, supervisors, and policymakers to:

- Ask questions in plain English or Kannada and receive structured, cited intelligence reports
- Explore criminal networks visually with an interactive SVG graph
- Analyse crime trends, hotspots, and sociological correlations through polished data visualisations
- Profile repeat offenders with risk scoring and modus operandi analysis
- Receive AI-generated decision support for active cases
- Track suspicious financial transactions and money-laundering chains
- Get early-warning forecasts for emerging crime hotspots
- Maintain a tamper-evident audit trail for DPDP Act compliance

---

## Key Features

| Feature | Description |
|---|---|
| **Mission Control Dashboard** | Executive landing page with AI Daily Brief, live KPIs, alerts, quick actions, and trend mini-chart |
| **Conversational AI Search** | Natural language queries (English & Kannada, text + voice) with explainable citations |
| **Criminal Network Graph** | Interactive SVG graph of accused–victim–case–account relationships with zoom/pan/filter |
| **Crime Hotspots & Trends** | Area/bar charts tracking monthly crime velocity and IPC head distribution |
| **Sociological Insights** | 4-chart dashboard (bar, stacked-bar, scatter, radar) with AI insight cards under each viz |
| **Offender Profiling** | Repeat offender dossiers with recidivism risk scores, MO analysis, and timelines |
| **Decision Support** | Automated case summaries, chronological timelines, similar past cases, tactical leads |
| **Financial Trace** | Mule account detection, 3-phase money-laundering chain visualisation |
| **Early Warning Alarms** | Predictive gang/crime cluster signals with patrol deployment actions |
| **Secure Audit Vault** | Role-based access logs, DPDP Act compliance, cryptographic audit trail |

---

## AI Capabilities

- **Gemini 2.0 Flash** (`@google/genai`) powers conversational queries with grounded, citation-backed responses
- **Intelligent simulation fallback** — when no API key is set, the system responds with realistic mock intelligence derived from the actual dataset
- **Structured Intelligence Reports** — AI responses are formatted with Summary, Key Findings, Persons Involved, Evidence, Risk Assessment, and Recommended Actions
- **Bilingual support** — English and Kannada (kn-IN) for both text and voice (Web Speech API)
- **Cross-module AI linking** — chat responses link directly to network graphs, offender profiles, and decision support panels

---

## Crime Analytics Capabilities

- District-level crime velocity tracking (monthly, by IPC head)
- Socio-economic risk correlation (urbanization × crime, economic stress × violent crime)
- Criminological theory grounding (Social Disorganization Theory, Merton's Strain Theory)
- Repeat offender recidivism scoring (0–100 scale)
- Financial transaction layering detection (placement → layering → integration)
- Predictive early-warning signals with confidence percentages
- District radar profiles across 5 risk dimensions

---

## Sociological Insights Module

The Sociological Insights page presents four distinct data visualisations, each followed by an AI Insight card with four fields:

1. **Socio-Economic Risk Indices** — Grouped bar chart comparing urbanization, economic stress, migration, and education across all 6 districts
2. **Crime Type Distribution** — Stacked bar chart showing property, violent, cyber, and narcotics cases per district
3. **Urbanization vs. Total FIR Cases** — Bubble scatter chart (bubble size ∝ case count, colour-coded by district) revealing the urbanization–crime correlation
4. **District Risk Profile Radar** — Interactive radar chart with a district selector, showing 5 risk dimensions simultaneously (urbanization, economic stress, migration, low education, crime load)

Each chart includes an **AI Insight card** with:
- **Key Observation** — what the chart directly shows
- **Trend Summary** — the pattern across districts
- **Why It Matters** — criminological significance
- **Suggested Action** — concrete policing recommendation

Three criminological theory cards (Social Disorganization, Strain Theory, Protective Factors) provide academic grounding anchored to actual district values from the dataset.

---

## Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19 + TypeScript + Vite 6 + Tailwind CSS 4 |
| **Backend / API** | Node.js + Express (TypeScript) |
| **AI Engine** | Google Gemini 2.0 Flash (`@google/genai`) with simulation fallback |
| **Network Graph** | Custom Interactive SVG (zoom, pan, concentric & hierarchy layouts) |
| **Charts** | Recharts 3 (Area, Bar, Scatter, Radar, stacked Bar) |
| **Animations** | Framer Motion (`motion/react`) + CSS keyframe animations |
| **Icons** | Lucide React |
| **Voice** | Web Speech API (SpeechRecognition + SpeechSynthesis) |
| **Deployment** | Zoho Catalyst AppSail |

---

## Zoho Catalyst Architecture

This project is deployed on **Zoho Catalyst AppSail** — Catalyst's fully managed Node.js hosting service.

```
Catalyst AppSail
└── Node.js runtime (Express + Vite SSR)
    ├── Serves built React frontend (dist/)
    ├── Exposes REST API routes (/api/*)
    ├── Integrates with Google Gemini AI
    └── In-memory audit log store (production: Catalyst Data Store)
```

**Catalyst services used / recommended for production:**

| Service | Current Use | Production Path |
|---|---|---|
| **AppSail** | Node.js hosting | ✅ Active |
| **Catalyst Functions** | API logic | Migrate Express routes to Catalyst Functions |
| **Catalyst Data Store** | FIR records, audit logs | Replace in-memory stores |
| **Catalyst Authentication** | Role-based access | Integrate Catalyst Auth for SSO |
| **Catalyst File Store** | FIR attachments, PDFs | Store evidence files |
| **Catalyst Cache** | Analytics query caching | Cache frequent aggregations |
| **Catalyst Search** | Full-text FIR search | Replace linear scan with Catalyst Search |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser (React SPA)                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│  │ Mission  │ │   Chat   │ │ Network  │ │Sociological  │  │
│  │ Control  │ │   AI     │ │  Graph   │ │  Insights    │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│  │Profiling │ │Decision  │ │Financial │ │  Forecasting │  │
│  │          │ │ Support  │ │  Trace   │ │  + Audit     │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP REST
┌─────────────────────▼───────────────────────────────────────┐
│              Express API Server (server.ts)                  │
│  /api/query          → Gemini AI + mock fallback             │
│  /api/analytics/*    → Computed from mockData.ts             │
│  /api/audit-logs     → In-memory log store                   │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│              Data Layer (src/mockData.ts)                    │
│  FIR Cases · Accused · Victims · Financial Transactions      │
│  Districts · SocioEconomic Indices · Acts/Sections           │
│  (Aligned with Police FIR ER Diagram PDF)                    │
└─────────────────────────────────────────────────────────────┘
```

---

## AI Workflow

```
User Query (text / voice)
        │
        ▼
Language Detection (EN / KN)
        │
        ▼
API POST /api/query
        │
        ├─── Gemini API key present? ──── YES ──► Gemini 2.0 Flash
        │                                          │  System prompt: KSP analyst role
        │                                          │  Context: full mockData summary
        │                                          │  Response: structured intel report
        │                                          │
        └─── NO ──────────────────────────────────► Simulation Engine
                                                   │  Keyword match on query
                                                   │  Returns cited mock response
                                                   │  with FIR citations
                                                   │
                                                   ▼
                                          Audit Log Written
                                                   │
                                                   ▼
                                          Response → Chat UI
                                          (citations rendered as cards)
```

---

## Database Overview

All data is sourced from `src/mockData.ts`, which is fully aligned with the **Police FIR ER Diagram** (`Police_FIR_ER_Diagram (1).pdf`).

| Entity | Records | Key Fields |
|---|---|---|
| `CaseMaster` | 8 FIRs | CrimeNo, CaseNo, IncidentDate, GPS coords, BriefFacts |
| `Accused` | 8 records | PersonID (cross-case linking), AssociateIDs, Age, Gender |
| `Victim` | 8 records | Name, Age, Gender, VictimPolice flag |
| `ComplainantDetails` | 8 records | Name, Age, Occupation, Religion, Caste |
| `ArrestSurrender` | 3 records | Type, Date, District, IOID, CourtID |
| `ActSectionAssociation` | 11 records | IPC/BNS/NDPS/IT Act sections per case |
| `FinancialTransaction` | 6 records | From/To accounts, Amount, IsSuspicious, RiskReason |
| `District` | 6 records | SocioEconomicIndicator (urbanization, stress, migration, education, density) |
| `Unit` | 7 records | Police Station name, DistrictID |
| `Employee` | 5 records | Investigating officers with KGID, Rank |
| `CrimeHead` / `CrimeSubHead` | 4 / 6 records | IPC major/minor head classifications |

**Districts covered:** Bengaluru City · Mysuru · Mangaluru (DK) · Hubballi-Dharwad · Belagavi · Kalaburagi

---

## Folder Structure

```
Crime-intelligence-platform/
├── server.ts                          # Express API server + Vite dev middleware
├── src/
│   ├── App.tsx                        # Main app shell: sidebar, header, tab routing
│   ├── main.tsx                       # React entry point
│   ├── index.css                      # Enterprise design system tokens + global styles
│   ├── mockData.ts                    # KSP FIR dataset (aligned with ER diagram)
│   ├── types.ts                       # TypeScript schema interfaces
│   └── components/
│       ├── NetworkGraph.tsx           # Interactive SVG criminal network map
│       ├── MissionControl.tsx         # Executive landing dashboard
│       └── SociologicalInsights.tsx   # 4-chart sociological analysis module
├── public/
│   └── favicon.svg                    # Police badge favicon
├── index.html                         # App HTML template
├── package.json                       # Dependencies and scripts
├── tsconfig.json                      # TypeScript config
├── vite.config.ts                     # Vite bundler config
├── metadata.json                      # Catalyst AppSail app metadata
├── app-config.json                    # Catalyst AppSail deployment config
├── catalyst.json                      # Catalyst project config
├── .catalystrc                        # Catalyst CLI auth config
├── .env.example                       # Environment variable template
├── Police_FIR_ER_Diagram (1).pdf      # Source-of-truth database schema
└── KSP_Crime_AI_Documentation.md      # Detailed architecture documentation
```

---

## Installation & Local Setup

### Prerequisites

- Node.js v18 or higher
- npm
- Catalyst CLI (for deployment): `npm install -g @zohocrm/catalyst-cli`

### Steps

```bash
# 1. Clone the repository
git clone <repository-url>
cd Crime-intelligence-platform

# 2. Install dependencies
npm install

# 3. Configure environment variables (optional — AI simulation works without a key)
cp .env.example .env
# Edit .env and set GEMINI_API_KEY="your_key_here"

# 4. Start development server
npm run dev
# Open http://localhost:3000

# 5. Type check
npm run lint

# 6. Production build
npm run build

# 7. Run production server locally
npm start
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Optional | Google Gemini API key. If absent, intelligent simulation mode activates automatically |
| `PORT` | Optional | Server port (default: 3000) |
| `X_ZOHO_CATALYST_LISTEN_PORT` | Catalyst only | Injected automatically by Catalyst AppSail runtime |
| `NODE_ENV` | Optional | `development` or `production` |

---

## Deployment — Zoho Catalyst AppSail

```bash
# 1. Authenticate with Catalyst
catalyst login

# 2. Build the application
npm run build

# 3. Deploy to AppSail
catalyst deploy
```

The `app-config.json` and `catalyst.json` files configure the AppSail service. The deployment serves the built React frontend from `dist/` and runs `dist/server.cjs` as the Node.js backend.

**Live URL:** https://crime-platform-50044257151.development.catalystappsail.in/

---

## API Overview

All API routes are served by `server.ts` under the `/api` prefix.

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/query` | Conversational AI query (Gemini or simulation) |
| `GET` | `/api/analytics/trends` | Monthly crime velocity + type distribution |
| `GET` | `/api/analytics/network` | Criminal network nodes and edges |
| `GET` | `/api/analytics/sociological` | District socio-economic + crime data |
| `GET` | `/api/analytics/offenders` | Repeat offender profiles with risk scores |
| `GET` | `/api/analytics/decision-support/:id` | Case summary, timeline, leads for a FIR |
| `GET` | `/api/analytics/forecasting` | Early warning signals + district risk scores |
| `GET` | `/api/audit-logs` | Retrieve full audit trail |
| `POST` | `/api/audit-logs` | Write a new audit log entry |

---

## Modules & Tabs

| Tab | Requirement | Description |
|---|---|---|
| **Mission Control** | — | Executive dashboard: AI brief, KPIs, alerts, quick actions, trend chart |
| **Conversational Search** | FR-1 | AI chat in English/Kannada (text + voice) with cited intelligence reports |
| **Criminal Network** | FR-2, FR-7 | SVG graph of accused–victim–case–account relationships |
| **Crime Trends** | FR-3 | Monthly velocity area chart + IPC category bar chart |
| **Sociological Insights** | FR-4 | 4-chart module with AI insight cards and criminological theory analysis |
| **Offender Profiling** | FR-5 | Repeat offender dossiers with recidivism scores and timelines |
| **Decision Support** | FR-6 | Case briefs, chronological timelines, similar cases, tactical leads |
| **Financial Trace** | FR-7 | Mule account ledger, 3-phase laundering chain analysis |
| **Early Warning Alarms** | FR-8 | Predictive gang/crime signals with patrol deployment actions |
| **Audit Vault** | FR-10 | DPDP-compliant timestamped audit trail of all user actions |

---

## Security & Governance

- **Role-based clearance levels:** Investigator (L1) · Analyst (L2) · Supervisor (L3) · Policymaker (L4)
- **DPDP Act compliance:** Every query, navigation, and AI interaction generates a non-repudiable audit log
- **Citation grounding:** Every AI response cites exact FIR records used as evidence
- **Explainable AI:** No black-box outputs — every answer includes the reasoning chain and source citations

---

## Future Scope

- Migrate from `mockData.ts` to live Catalyst Data Store with real FIR ingestion pipeline
- Integrate Catalyst Authentication for SSO with Karnataka Police identity system
- Add Catalyst Functions for serverless analytics computation
- Implement Catalyst Search for full-text FIR narrative indexing
- Add geographical heatmap overlay using district GPS coordinates
- Extend voice support to additional regional languages (Telugu, Tamil, Hindi)
- Implement PDF export of full intelligence reports
- Add real-time alert push notifications via Catalyst Push

---

## Documentation

Full architecture, functional requirements, and design decisions are documented in [`KSP_Crime_AI_Documentation.md`](./KSP_Crime_AI_Documentation.md).

Dataset schema is defined in [`Police_FIR_ER_Diagram (1).pdf`](./Police_FIR_ER_Diagram%20(1).pdf).
