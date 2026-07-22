# Crime Intelligence Hub — Karnataka State Police (KSP)

An intelligent conversational AI & analytics platform built for the Karnataka State Police (KSP) crime database. Lets investigators, analysts, and policymakers query crime records in natural language (English & Kannada, text or voice), uncover hidden relationships between accused/victims/locations/finances, and receive explainable, criminology-grounded insights without writing SQL queries.

**Live URL:** https://crime-platform-50044257151.development.catalystappsail.in/

---

## What This Project Does

- **Ask questions in plain language** — *"Who else was involved in similar robberies in Mysuru last month?"* — and get structured, cited answers.
- **Uncover hidden connections** between accused, victims, locations, and financial transactions using an interactive network graph.
- **Spot crime trends and hotspots** across time, geography, and modus operandi with dynamic charts.
- **Explain crime patterns sociologically** — correlating crime data with demographics and socio-economic indicators across 6 Karnataka districts, grounded in social disorganization theory and strain theory.
- **Profile repeat offenders** with risk scoring, MO analysis, and reasoning paths.
- **Support investigators** with automated case summaries, similar past cases, timelines, and investigative leads.
- **Forecast emerging hotspots** and provide early warning alarms.
- **Explainable AI** — every answer is backed by citations to exact FIR records used.
- **Security & Governance** — role-based clearance (Investigator / Analyst / Supervisor / Policymaker) with full audit logging.

Full requirements, architecture, and design decisions are documented in [`KSP_Crime_AI_Documentation.md`](./KSP_Crime_AI_Documentation.md).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend / Dashboard** | React 19 + TypeScript + Vite + Tailwind CSS |
| **Backend / API Server** | Node.js (Express API with TypeScript) |
| **AI / Criminological Reasoning** | Gemini 3.6 Flash (`@google/genai`) with simulation fallback |
| **Interactive Graph Visualizer** | Custom Interactive SVG Network Graph (Zooming, Panning, Concentric & Hierarchy Layouts) |
| **Data Visualization & Analytics** | Recharts (Area, Bar, Scatter Charts) |
| **Voice Interface** | Web Speech API (`SpeechRecognition` & `SpeechSynthesis`) |
| **Animations & UI** | Framer Motion (`motion/react`) & Lucide Icons |
| **Deployment** | Zoho Catalyst AppSail |

---

## Project Structure

```
Crime-intelligence-platform/
├── server.ts                 # Express API server & Vite dev middleware
├── src/
│   ├── App.tsx               # Main Crime Intelligence Hub UI & Navigation
│   ├── components/
│   │   └── NetworkGraph.tsx  # Interactive SVG Criminal Network Map
│   ├── mockData.ts           # KSP Crime Database mock dataset (aligned with Police FIR ER Diagram)
│   ├── types.ts              # TypeScript data types & schema interfaces
│   ├── index.css             # Design tokens & styling
│   └── main.tsx              # React application entrypoint
├── public/
│   └── favicon.svg           # Police badge themed favicon
├── index.html                # Application page template (title: "Crime Intelligence")
├── package.json              # Dependencies & scripts
├── tsconfig.json             # TypeScript configuration
├── vite.config.ts            # Vite bundler configuration
├── metadata.json             # Catalyst/AppSail app metadata (controls browser tab title)
├── app-config.json           # Catalyst AppSail deployment config
├── catalyst.json             # Catalyst project config
├── Police_FIR_ER_Diagram.pdf # KSP database ER schema (source of truth for data model)
├── KSP_Crime_AI_Documentation.md # Detailed documentation & architecture blueprint
└── README.md                 # This file
```

---

## Dataset

The application uses a mock dataset in `src/mockData.ts` that is **fully aligned with the Police FIR ER Diagram** (`Police_FIR_ER_Diagram (1).pdf`). It includes:

- **8 FIR cases** across 6 Karnataka districts (Bengaluru, Mysuru, Mangaluru, Hubballi-Dharwad, Belagavi, Kalaburagi)
- **Crime types:** Property/Theft, Murder/Assault, Cyber Fraud, Narcotics Trafficking
- **Accused:** 8 records with associate links (Ramesh Kumar, Suresh Hegde, Vikram Malhotra, Kiran Gowda, etc.)
- **Victims & Complainants:** 8 records each
- **Financial Transactions:** 6 suspicious transaction trails (phishing layering, drug proceeds, fence payoffs)
- **Socio-Economic Indices** per district: Urbanization %, Migration Rate %, Economic Stress %, Education Level %, Population Density
- **Act/Section Associations:** IPC, BNS, NDPS, IT Act sections linked to each FIR case

---

## Modules & Tabs

| Tab | Requirement | What it shows |
|-----|-------------|---------------|
| **Conversational Search** | FR-1 | Chat with AI in English/Kannada (text + voice), explainable citations, cross-module links |
| **Criminal Network** | FR-2, FR-7 | Interactive SVG graph of accused–victim–case–account relationships |
| **Crime Trends** | FR-3 | Area/bar charts of crime by month and type |
| **Sociological Insights** | FR-4 | 3-panel chart dashboard: socio-economic risk indices, crime type distribution, urbanization×crimes scatter with criminological analysis cards |
| **Offender Profiling** | FR-5 | Repeat offender roster with risk scores, timelines, and MO analysis |
| **Decision Support** | FR-6 | Case summaries, similar cases, investigation lead recommendations |
| **Forecasting** | FR-8 | Early warning alerts, district risk scores, predictive hotspots |
| **Audit Logs** | FR-10 | Full timestamped audit trail of all user actions |

---

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or bun
- Catalyst CLI (`npm install -g @zohocrm/catalyst-cli`) for deployment

### Running Locally

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set Environment Variables (Optional):**
   Copy `.env.example` to `.env` and set your Gemini API key:
   ```bash
   GEMINI_API_KEY="your_api_key_here"
   ```
   *(Note: If no API key is set, the system uses intelligent simulation mode.)*

3. **Start Development Server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

4. **Type Check:**
   ```bash
   npm run lint
   ```

5. **Build for Production:**
   ```bash
   npm run build
   npm start
   ```

### Deploying to Catalyst AppSail

```bash
catalyst deploy
```

Requires Catalyst CLI installed and authenticated (`catalyst login`).

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | API key for Gemini AI model |
| `PORT` / `X_ZOHO_CATALYST_LISTEN_PORT` | Port for the Express server (default: 3000) |
| `NODE_ENV` | Environment mode (`development` / `production`) |

---

## Documentation

Full project documentation — problem understanding, objectives, functional requirements, architecture, and module specifications — lives in [`KSP_Crime_AI_Documentation.md`](./KSP_Crime_AI_Documentation.md).
