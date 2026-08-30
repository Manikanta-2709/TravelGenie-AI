# TravelGenie AI — Your Smart Travel Planner

> Plan personalized trips with real-time weather, budget estimates and AI-powered itineraries — all in one place. **Stateless, live-data, multi-agent architecture.**

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-2.0-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Groq](https://img.shields.io/badge/Groq-LLM-F55036?style=flat)](https://groq.com)
[![LangGraph](https://img.shields.io/badge/LangGraph-Workflow-000000?style=flat)](https://langchain-ai.github.io/langgraph/)
[![License](https://img.shields.io/badge/License-MIT-35E6A1?style=flat)](LICENSE)

Live, stateless travel planning platform that synthesizes a complete trip dashboard from **live internet data** on every request — no database, no cached mocks. Built with **FastAPI + LangGraph** (backend) and **React + Vite + Tailwind** (frontend).

**Live Demo:** Frontend on [Netlify/Vercel] • Backend on [Render](https://travelgenie-backend-lvga.onrender.com) → `GET /` for service info

---

## Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Live Data Sources](#live-data-sources)
- [API Reference](#api-reference)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Frontend Guide](#frontend-guide)
- [Deployment](#deployment)
- [V2 Dashboard Schema](#v2-dashboard-schema)
- [Contributing](#contributing)

---

## Features

### For Travelers
- **Smart Destination Recommendation** — AI suggests the best destination from origin, budget, days & interests, or respects a user-specified target destination.
- **Transparent Budget Breakdown** — Travel / Hotel / Food / Activities / Misc split with `daily_avg` and `per_person` metrics.
- **Live Weather (Open-Meteo)** — Current temperature, condition, humidity + packing advice & best-time-to-visit. No API key required.
- **Real Road Routing (OSRM)** — Actual driving distance/duration between origin & destination via OSRM public router, not crow-fly estimates.
- **Multi-Modal Transport** — Train (IRCTC), Flight (Google Flights), Bus (RedBus), Drive (Google Maps) with per-km fare heuristics, duration, pros & deep links.
- **Verified Hotels** — Groq LLM + live web verification with maps & booking links.
- **Day-by-Day Itinerary** — Morning/Afternoon/Evening slots with real place names, geocoded `lat/lng`, `maps_url`, inter-place `travel_from_previous`, and walking metrics.
- **Curated Recommendations** — Food, Hidden Gems, Shopping, Safety Tips — via Wikipedia/Wikivoyage + curated knowledge base with maps links.
- **Dark Luxury UI** — Teal `#071A1D` / Emerald `#35E6A1` theme, glassmorphism, accordion itinerary, multi-currency (INR/USD/EUR/GBP), responsive.

### For Developers
- **100% Stateless** — `POST /plan-trip` fetches everything live; nothing is persisted. Ideal for serverless/ephemeral deploys.
- **LangGraph Orchestration** — `destination → budget → weather → itinerary → final_response` with typed `TravelWorkflowState` and graceful fallbacks.
- **Defensive Normalization** — Frontend `api.js` normalizes all V2 fields (asArray/asObject/asString/asNumber) to handle LLM variance.
- **Fallbacks at Every Node** — If Groq/Weather/Routing fails, proportional budget, interest-based destination, and template itinerary ensure degraded-but-valid response.

---

## Architecture

```
[ React SPA (Vite) ] ── POST /plan-trip ──▶ [ FastAPI: backend/main.py ]
                                                    │
                                          [ TravelWorkflow (LangGraph) ]
                                          ┌─────────────────────────────────┐
                                          │ destination_agent ─┐            │
                                          │ budget_agent       ├─▶ Groq LLM │
                                          │ weather_agent      │  Open-Meteo│
                                          │ itinerary_agent    │  OSRM      │
                                          │ final_response_node│  Wikipedia │
                                          │  ├─ route & transport (OSRM)   │
                                          │  ├─ knowledge (Wiki/Wikivoyage)│
                                          │  ├─ hotels (Groq+web)           │
                                          │  ├─ V2 itinerary geocoding      │
                                          │  └─ metrics & budget assembly  │
                                          └─────────────────────────────────┘
                                                    │
                                          V2 Dashboard JSON (hero, overview,
                                          transport, route, hotels, itinerary,
                                          recommendations, metrics, sources)
```

**Workflow file:** `backend/workflows/travel_workflow.py:59` — `TravelWorkflow` class compiles a `StateGraph` with 5 nodes linear chain ending at `END`. State type: `TravelWorkflowState:42`.

**4 Collaborative Agents:**

| Agent | File | Role | LLM / Service |
|-------|------|------|---------------|
| **DestinationAgent** | `backend/agents/destination_agent.py` | Picks destination from interests+budget OR honors user `destination` | Groq `qwen/qwen3.8-27b` → `groq/compound-mini` fallback |
| **BudgetAgent** | `backend/agents/budget_agent.py` | Splits total into travel/stay/food/activities | Groq + proportional fallback |
| **WeatherAgent** | `backend/agents/weather_agent.py` | Live weather + travel advice | `WeatherService` → Open-Meteo via `backend/services/weather_service.py` |
| **ItineraryAgent** | `backend/agents/itinerary_agent.py` | Day-wise morning/afternoon/evening plan with place lists | Groq |

All agents expose `get_destination()`, `calculate_budget()`, `analyze_weather()`, `generate_itinerary()` respectively.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend Framework** | FastAPI 2.x, Uvicorn, Pydantic v2, SQLAlchemy (unused — stateless) |
| **AI Orchestration** | LangGraph `StateGraph`, Groq API (`requests` + `GroqService` with retry & model fallback) |
| **Live Data Services** | `KnowledgeService` (Wikipedia REST + Wikivoyage + Open-Meteo Geocoding + OSRM), `DistanceService`, `WeatherService`, `HotelService` |
| **Frontend** | React 18, React Router v7, Axios, Vite 6, Tailwind CSS 3.4, lucide-react, PostCSS/Autoprefixer |
| **Deployment** | Render (Python web service, `render.yaml:1`), Netlify (`netlify.toml`), Vercel (`vercel.json`) |
| **Python Deps** | `fastapi`, `uvicorn`, `gunicorn`, `pydantic`, `sqlalchemy`, `requests`, `python-dotenv`, `langgraph`, `httpx` |

---

## Project Structure

```
TravelGenie-AI/
├── backend/
│   ├── main.py                 # FastAPI app — GET / , GET /health , POST /plan-trip
│   ├── workflows/
│   │   └── travel_workflow.py  # LangGraph StateGraph + V2 assembly (796 LOC)
│   ├── agents/
│   │   ├── destination_agent.py
│   │   ├── budget_agent.py
│   │   ├── weather_agent.py
│   │   └── itinerary_agent.py
│   ├── services/
│   │   ├── groq_service.py     # Groq wrapper — retries, 429 backoff, model fallback chain
│   │   ├── knowledge_service.py# Wikipedia, Wikivoyage, Open-Meteo geocoding, OSRM routing
│   │   ├── distance_service.py # Real OSRM distance + 4 transport options (train/flight/bus/drive)
│   │   ├── weather_service.py  # Open-Meteo live weather
│   │   └── hotel_service.py    # LLM hotel discovery + verification
│   ├── schemas/
│   │   └── trip_schema.py      # TripRequest / TripPlanResponse (Pydantic V2)
│   ├── prompts/                # destination_prompt.txt etc. (system prompts)
│   ├── api/routes/             # (reserved)
│   ├── .env.example
│   └── requirements.txt
├── Frontend/
│   ├── src/
│   │   ├── App.jsx             # Router + CurrencyProvider + Navbar/Footer shell
│   │   ├── pages/
│   │   │   ├── Home.jsx        # Hero + 4 curated categories + agent pipeline explainer
│   │   │   ├── Planner.jsx     # TravelForm + LoadingScreen + planTrip() flow
│   │   │   └── Results.jsx     # TripHero + OverviewGrid + TransportHotels + Accordion + Recommendations
│   │   ├── components/
│   │   │   ├── TravelForm.jsx      # Presets, interests, budget slider, validation
│   │   │   ├── TripHero.jsx        # Destination image + stats overlay
│   │   │   ├── OverviewGrid.jsx    # Budget / Weather / Best Time / AI Score
│   │   │   ├── TransportHotels.jsx # Transport rows + hotel cards
│   │   │   ├── AccordionItinerary.jsx
│   │   │   ├── RecommendationsGrid.jsx
│   │   │   ├── AgentFlow.jsx       # AGENT_STEPS constant (4 agents)
│   │   │   ├── LoadingScreen.jsx
│   │   │   └── ... (Navbar, ContactModal, CurrencySwitcher, etc.)
│   │   ├── services/api.js     # axios client + normalizeApiResponse + planTrip/checkHealth
│   │   ├── context/CurrencyContext.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js          # dev server :5173
│   ├── tailwind.config.js      # theme colors: #071A1D, #0B2426, #35E6A1, #4FFFC0, #B9C9C6
│   ├── package.json
│   ├── netlify.toml
│   └── vercel.json
├── render.yaml                 # Render Python web service config
├── requirements.txt            # Root (Render) — mirrors backend deps
└── README.md
```

---

## Live Data Sources

| Source | What it provides | Key | Used in |
|--------|------------------|-----|---------|
| **Open-Meteo Geocoding** | Lat/lon for any place name | None | `KnowledgeService.geocode()` |
| **Open-Meteo Weather** | Current temp/condition/humidity | None | `WeatherService` → `WeatherAgent` |
| **OSRM Public Router** | Real road distance & duration | None | `KnowledgeService.get_road_route()` → `DistanceService` |
| **Wikipedia REST API** | Destination summary + hero image | None | `KnowledgeService.get_wiki_summary()` → `hero` |
| **Wikivoyage** | See / Eat / Buy / Stay safe sections | None | `KnowledgeService.get_wikivoyage_insights()` → `recommendations` |
| **Groq LLM** | Destination, itinerary, hotels | `GROQ_API_KEY` **required** | All 4 agents + `HotelService` |

> **No OpenWeather API needed** — weather is via Open-Meteo (free, no key). `OPENWEATHER_API_KEY` in `render.yaml:10` is legacy/optional.

---

## API Reference

Base URL local: `http://localhost:8000` · Prod: `https://travelgenie-backend-lvga.onrender.com`

### `GET /`
Service info.

```json
{
  "service": "TravelGenie AI",
  "version": "2.0.0",
  "mode": "stateless — all data fetched live from the internet",
  "data_sources": ["Open-Meteo", "OSRM", "Wikipedia", "Wikivoyage", "Groq LLM"]
}
```

### `GET /health`
```json
{ "status": "healthy", "groq_configured": true }
```

### `POST /plan-trip`
**Request** (`backend/schemas/trip_schema.py:8` — `TripRequest`):

```json
{
  "starting_city": "Hyderabad",
  "destination": "Goa",
  "budget": 18000,
  "days": 4,
  "travelers": 2,
  "interests": ["Beaches", "Food", "Relaxation"],
  "preferred_travel_mode": "Train"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `starting_city` | string | ✅ | Non-blank, trimmed |
| `budget` | number | ✅ | `>0` INR |
| `days` | int | ✅ | `1–30` |
| `travelers` | int | `2` | `1–20` |
| `interests` | string[] | `["Nature"]` | CSV string also accepted |
| `destination` | string \| null | optional | If set, skips AI recommendation |
| `preferred_travel_mode` | string \| null | optional | `Train` / `Flight` / `Bus` / `Drive` |

**Response** — V2 Dashboard JSON (see [V2 Dashboard Schema](#v2-dashboard-schema)). `status` is `success` or `degraded` (workflow fallback). Always `schema_version: 2`.

**cURL:**

```bash
curl -X POST http://localhost:8000/plan-trip \
  -H "Content-Type: application/json" \
  -d '{
    "starting_city": "Hyderabad",
    "budget": 15000,
    "days": 3,
    "travelers": 2,
    "interests": ["Nature", "Food"],
    "destination": "Goa"
  }'
```

**Error codes:** `422` validation error (Pydantic), `500` degraded payload with `errors[]`.

---

## Getting Started

### Prerequisites
- **Python 3.11+** · **Node.js 18+ / npm** · **Groq API key** ([console.groq.com](https://console.groq.com))

### 1. Clone

```bash
git clone https://github.com/<you>/TravelGenie-AI.git
cd TravelGenie-AI
```

### 2. Backend Setup

```bash
# Create & activate venv (Windows)
python -m venv backend/venv
backend\venv\Scripts\activate

# Unix/macOS
python3 -m venv backend/venv
source backend/venv/bin/activate

# Install deps
pip install -r requirements.txt
# or
pip install -r backend/requirements.txt

# Env
copy backend\.env.example backend\.env   # Windows
# cp backend/.env.example backend/.env   # Unix

# Edit backend/.env and set:
# GROQ_API_KEY=your_groq_api_key_here
# GROQ_MODEL=qwen/qwen3.8-27b   (optional)

# Run
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000

# Verify
# http://localhost:8000/        → service info
# http://localhost:8000/docs    → Swagger UI
# http://localhost:8000/health  → health check
```

### 3. Frontend Setup

```bash
cd Frontend
npm install

# Env — create Frontend/.env (optional, defaults to Render URL)
echo "VITE_API_URL=http://localhost:8000" > .env

npm run dev      # → http://localhost:5173
npm run build    # production build → Frontend/dist/
npm run preview  # preview production build
```

> **CORS** is open in dev (`allow_origins=["*"]` in `backend/main.py:35`). For production, restrict to your frontend domain.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GROQ_API_KEY` | ✅ | — | Groq API key — all LLM agents fail gracefully to fallbacks without it |
| `GROQ_MODEL` | ❌ | `qwen/qwen3.8-27b` | Primary model; fallback chain: `qwen/qwen3.6-27b`, `openai/gpt-oss-120b`, `openai/gpt-oss-20b`, `groq/compound-mini` |
| `GROQ_API_URL` | ❌ | `https://api.groq.com/openai/v1/chat/completions` | Override Groq endpoint |
| `OPENWEATHER_API_KEY` | ❌ | — | Legacy; not used (weather via Open-Meteo) |

Copy template: `backend/.env.example:1`

### Frontend (`Frontend/.env`)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | ❌ | `https://travelgenie-backend-lvga.onrender.com` | Backend base URL (`Frontend/src/services/api.js:11`) |

---

## Frontend Guide

- **Routing** (`Frontend/src/App.jsx:22`): `/` → Home, `/planner` → Planner, `/results` → Results, `*` → Home fallback. `CurrencyProvider` wraps all routes.
- **Home** (`Home.jsx`): Hero with background `/hero-bg.jpg`, 4 `FEATURES` badges, 4 `CURATED_CATEGORIES` (each navigates to `/planner` with preset state), 4-agent tab switcher (`AgentFlow.AGENT_STEPS`), Get-in-Touch modal trigger.
- **Planner** (`Planner.jsx`): `TravelForm` → `planTrip(formData)` (`api.js:220`) → `navigate('/results', { state: { tripData, formData }})`. Simulates step progression (850ms interval) while awaiting backend (120s timeout).
- **Results** (`Results.jsx`): Guards missing `tripData`, renders `TripHero`, `OverviewGrid`, `TransportHotels`, `AccordionItinerary`, `RecommendationsGrid`. “Plan Another Trip” → `/planner`.
- **API Client** (`services/api.js`): `axios` with `baseURL: VITE_API_URL`, 120s timeout, `normalizeApiResponse()` defensive coercion, `planTrip` payload normalization (camelCase ↔ snake_case).
- **Theme**: Dark teal `#071A1D` bg, card `#0B2426`, border `#214A47`, accent `#35E6A1` → `#4FFFC0` gradients, muted `#B9C9C6`. See `tailwind.config.js:10`.

---

## Deployment

### Backend — Render

`render.yaml:1` already configured:

```yaml
services:
  - type: web
    name: travelgenie-backend
    env: python
    region: singapore
    plan: free
    buildCommand: "pip install -r requirements.txt"
    startCommand: "uvicorn backend.main:app --host 0.0.0.0 --port $PORT"
    envVars:
      - key: GROQ_API_KEY
        sync: false
      - key: OPENWEATHER_API_KEY
        sync: false
```

Steps: Connect GitHub repo → Render picks up `render.yaml` → set `GROQ_API_KEY` in dashboard → deploy. Health check: `GET /health`.

Alternative: **Docker / Fly.io / Railway** — same `uvicorn backend.main:app --host 0.0.0.0 --port $PORT` start command.

### Frontend — Netlify / Vercel

- **Netlify**: `Frontend/netlify.toml` present. Build command `npm run build`, publish `dist`, set `VITE_API_URL` env var to your Render URL.
- **Vercel**: `Frontend/vercel.json` present. Import project, framework = Vite, env `VITE_API_URL` = Render URL.
- **Manual**: `cd Frontend && npm run build` → deploy `dist/` to any static host.

> Ensure `VITE_API_URL` points to the deployed backend, not localhost.

---

## V2 Dashboard Schema

`POST /plan-trip` returns (`backend/workflows/travel_workflow.py:617`):

```json
{
  "status": "success",
  "schema_version": 2,
  "hero": {
    "destination": "Goa",
    "tagline": "Top coastal beach getaway.",
    "image_url": "https://upload.wikimedia.org/.../Goa.jpg",
    "image_attribution": "Goa",
    "trip_score": 88,
    "origin": "Hyderabad",
    "distance_km": 612,
    "duration_min": 720,
    "travelers": 2,
    "days": 4,
    "budget_label": "₹18,000"
  },
  "overview": {
    "budget": { "travel": 3600, "hotel": 7200, "food": 4500, "activities": 2700, "misc": 0, "total": 18000, "daily_avg": 4500, "per_person": 9000 },
    "weather": { "temp": "28°C", "condition": "Sunny", "humidity": "70%", "best_time": "October – March", "advice": "Carry light clothing..." },
    "best_time": "October – March",
    "ai_score": 88,
    "route_efficiency": 85
  },
  "transport": [ { "mode": "train", "title": "Indian Railways Express", "duration": "11h 08m", "estimated_fare": "₹550 – ₹880", "booking_url": "https://...", "recommended": true } ],
  "route": { "distance_km": 612, "duration_min": 720, "directions_url": "https://www.google.com/maps/dir/?api=1&...", "recommended_mode": "Indian Railways Express" },
  "hotels": [ { "name": "Taj Resort Goa", "maps_url": "https://...", "booking_url": "https://..." } ],
  "itinerary": [
    {
      "day": 1,
      "title": "Day 1: Anjuna Beach",
      "stay_location": "Hotel in Goa",
      "place_count": 3,
      "walking_km": 4.2,
      "morning": { "summary": "Visit Anjuna Beach...", "places": [{ "name": "Anjuna Beach", "category": "nature", "lat": 15.5, "lon": 73.7, "maps_url": "https://...", "travel_from_previous": "12.3 km" }] },
      "afternoon": { "summary": "...", "places": [] },
      "evening": { "summary": "...", "places": [] },
      "slots": { "morning": {}, "afternoon": {}, "evening": {} }
    }
  ],
  "recommendations": {
    "food": [{ "name": "Goan Fish Thali", "cuisine": "Coastal Seafood", "description": "...", "cost": "₹300 / thali", "rating": "4.9 ⭐", "maps_url": "https://..." }],
    "hidden_gems": [],
    "shopping": [],
    "safety_tips": ["Only swim between flags..."]
  },
  "metrics": { "route_efficiency": 85, "walking_km": 12.4, "transport_hours": 14.2, "ai_score": 88 },
  "sources": { "weather": "Open-Meteo (live)", "routing": "OSRM (live)", "knowledge": "Wikipedia / Wikivoyage (live)", "hotels": "Groq LLM + live web verification" },
  "errors": []
}
```

Degraded mode (`status: "degraded"`) returns same shape with `trip_score: 70` and `errors: ["Workflow warning: ..."]` — see `travel_workflow.py:720`.

---

## Screenshots

> Add real screenshots to `Frontend/public/` or `docs/` and reference here.

| Home | Planner | Results |
|------|---------|---------|
| Hero + Categories + Agents | TravelForm + Presets | TripHero + Itinerary Accordion |

---

## Contributing

PRs welcome! Please:

1. Fork & branch (`feat/xyz`, `fix/xyz`)
2. Run `pip install -r requirements.txt` and `cd Frontend && npm install`
3. Test backend: `python backend/e2e_check.py` / `pytest backend/tests/` and frontend: `npm run dev` + manual `/plan-trip` check via Swagger
4. Keep stateless contract — no DB, no persistence
5. Open PR with description + screenshots if UI

---

## License

MIT — see [LICENSE](LICENSE) (add one if missing).

---

## Acknowledgements

- **Groq** for low-latency LLM inference
- **Open-Meteo** for free geocoding & weather
- **OSRM** for open road routing
- **Wikipedia / Wikivoyage** for destination knowledge
- **LangGraph** for agent orchestration

---

<p align="center">Built with ❤️ by the TravelGenie AI team — <em>Let's make your next trip unforgettable!</em></p>
