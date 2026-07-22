# Crime-intelligence-platform
An Intelligent Conversational AI and Crime Analytics Platform that enables investigators, analysts, and policymakers to interact with the state crime database using natural language queries, while also providing advanced analytical capabilities grounded in criminology and sociological insights. 
# KSP Crime Database — Conversational AI & Analytics Platform

An intelligent conversational AI system built on top of the Karnataka State Police (KSP) Catalyst crime database. Lets investigators, analysts, and policymakers query crime records in natural language (English & Kannada, text or voice), uncover hidden relationships between accused/victims/locations/finances, and get explainable, criminology-grounded insights — without writing a single line of SQL.

---

## What This Project Does

- **Ask questions in plain language** — "Who else was involved in similar robberies in Mysuru last month?" — and get an answer, not a dashboard to dig through.
- **Uncover hidden connections** between accused, victims, locations, and financial transactions using network analysis.
- **Spot crime trends and hotspots** across time, geography, and modus operandi.
- **Explain crime patterns sociologically** — linking crime data to demographics and socio-economic indicators.
- **Profile repeat offenders** with a risk score and the reasoning behind it.
- **Support investigators** with auto-generated case summaries, similar past cases, and leads.
- **Forecast emerging hotspots** and send early warnings.
- **Show its work** — every answer is backed by citations to the exact records used (no hallucinated facts).
- **Stay secure** — role-based access (Investigator / Analyst / Supervisor / Policymaker) with full audit logging.

Full requirements, architecture, and design decisions are documented in [`KSP_Crime_AI_Documentation.md`](./KSP_Crime_AI_Documentation.md).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend / Chat UI | React.js |
| Backend / API | Python (FastAPI) |
| AI / Language Understanding | Claude (Anthropic API) |
| Database (structured data + similarity search) | PostgreSQL + pgvector |
| Relationship / Network Analysis | Neo4j |
| Voice Interface | Whisper (speech-to-text) + Coqui TTS (text-to-speech) |
| Charts & Graph Visuals | Recharts + Cytoscape.js |
| Deployment | Docker |
| PDF Export | ReportLab (Python) |

> See Section 7 of the documentation for the reasoning behind each choice.

---

## Project Structure (proposed)

```
ksp-crime-ai/
├── backend/
│   ├── app/
│   │   ├── api/              # FastAPI routes (chat, auth, export, etc.)
│   │   ├── ai/                # Claude integration, prompt templates, RAG logic
│   │   ├── db/                 # PostgreSQL models & Catalyst DB connectors
│   │   ├── graph/             # Neo4j queries & network analysis logic
│   │   ├── voice/              # Whisper + Coqui TTS integration
│   │   ├── analytics/         # Trend, hotspot, and risk-scoring logic
│   │   └── export/             # PDF export (ReportLab)
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/       # Chat UI, charts, network graph viewer
│   │   ├── i18n/                # English/Kannada translations
│   │   └── pages/
│   ├── package.json
│   └── Dockerfile
├── docs/
│   └── KSP_Crime_AI_Documentation.md
├── docker-compose.yml
└── README.md
```

---


## Documentation

Full project documentation — problem understanding, objectives, requirements, architecture, database design, and AI architecture — lives in [`KSP_Crime_AI_Documentation.md`](./KSP_Crime_AI_Documentation.md).

## License & Data Sensitivity

⚠️ This project handles sensitive law-enforcement data. Do not commit real crime records, credentials, or PII to version control. Follow your organization's data governance and classification policies at all times.
