# ✈️ TravelGenie AI — Intelligent Travel Planner Agent

A modern, responsive, multi-agent AI travel planning platform built for Hackathons.

---

## 📌 Project Overview

**TravelGenie AI** uses a collaborative multi-agent architecture to generate personalized travel plans:
1. **Destination Agent**: Selects optimal locations based on departure city and travel vibes.
2. **Budget Agent**: Validates costs against total budget and splits expenses (Stay, Food, Transit, Activities).
3. **Weather Agent**: Gathers seasonal forecasts and supplies packing advisories.
4. **Itinerary Agent**: Curates balanced, day-by-day sightseeing schedules.

---

## 💻 Frontend (React + Vite + Tailwind CSS)

### Tech Stack
- **React 18** with **Vite**
- **Tailwind CSS** (Custom glassmorphism & typography)
- **React Router v7** (Client-side routing for `/`, `/planner`, `/results`)
- **Axios** (API communication with local simulator fallback)
- **Lucide React** (Icons)

### 🚀 Running Frontend Locally
```bash
# 1. Install dependencies
npm install

# 2. Start Vite development server
npm run dev

# 3. Open browser at
http://localhost:5173
```

---

## 🛠️ Backend Implementation Guide (For Your Backend Teammate)

Your backend teammate needs to create an API server running at **`http://localhost:8000`**.

### 1. API Contract Specifications

#### **Endpoint**
- **Method:** `POST`
- **URL:** `http://localhost:8000/plan-trip`
- **Headers:** `Content-Type: application/json`

#### **Request Body (Frontend -> Backend)**
```json
{
  "starting_city": "Guntur",
  "budget": "15000",
  "days": "3",
  "interests": ["Nature", "Food"],
  "travelers": "2"
}
```

#### **Response Body (Backend -> Frontend)**
```json
{
  "destination": "Coorg",
  "budget": "₹14,000",
  "weather": "21°C, Misty & Pleasant",
  "tips": "Carry a light jacket and comfortable walking shoes for plantation walks.",
  "itinerary": [
    {
      "day": 1,
      "title": "Arrival & Sunset View",
      "description": "Depart from Guntur and arrive in Coorg. Check into homestay and visit Raja's Seat for sunset."
    },
    {
      "day": 2,
      "title": "Coffee Plantation & Waterfalls",
      "description": "Guided walking tour through organic coffee estates followed by a refreshing visit to Abbey Falls."
    },
    {
      "day": 3,
      "title": "Heritage Fort & Local Markets",
      "description": "Explore historic Madikeri Fort, shop for homemade chocolates and regional spices, then depart."
    }
  ]
}
```

---

### 2. Ready-to-Run Backend Boilerplate (Python + FastAPI)

Your backend teammate can create a folder `backend/` and run:

```bash
pip install fastapi uvicorn pydantic
```

Then create `main.py`:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

app = FastAPI(title="TravelGenie AI Backend")

# IMPORTANT: Enable CORS so frontend on localhost:5173 can communicate
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TripRequest(BaseModel):
    starting_city: str
    budget: str
    days: str
    interests: List[str]
    travelers: str

@app.post("/plan-trip")
async def plan_trip(req: TripRequest):
    # TODO: Connect with your LLM / CrewAI / LangChain agent swarm here
    # Example agent logic:
    days_count = max(1, int(req.days))
    
    itinerary = []
    for i in range(1, days_count + 1):
        itinerary.append({
            "day": i,
            "title": f"Day {i} Exploration",
            "description": f"Enjoy activities centered around {', '.join(req.interests)} tailored for {req.travelers} travelers."
        })

    return {
        "destination": "Coorg",
        "budget": f"₹{req.budget}",
        "weather": "22°C, Pleasant",
        "tips": "Carry comfortable walking shoes and light rain gear.",
        "itinerary": itinerary
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
```

Run backend server:
```bash
python main.py
```

---

## 📁 Frontend Directory Structure

```text
├── public/
│   └── hero-bg.jpg            # Panoramic landscape background
├── src/
│   ├── components/
│   │   ├── Navbar.jsx         # Header navigation & Contact trigger
│   │   ├── ContactModal.jsx   # "Get in Touch" popup modal
│   │   ├── TravelForm.jsx     # User preferences form + live calculator
│   │   ├── AgentFlow.jsx      # 4-Agent visual step-by-step pipeline
│   │   ├── LoadingScreen.jsx  # Animated progress bar & live agent thoughts
│   │   ├── ResultCard.jsx     # Destination showcase, metrics & checklist
│   │   └── ItineraryCard.jsx  # Day tabs, schedule timeline & copy action
│   ├── pages/
│   │   ├── Home.jsx           # Landing page matching exact UI mockup
│   │   ├── Planner.jsx        # Planning page with multi-agent orchestration
│   │   └── Results.jsx        # Generated travel plan dashboard
│   ├── services/
│   │   └── api.js             # Axios client with fallback agent simulator
│   ├── App.jsx                # Layout root & modal state
│   ├── main.jsx               # React DOM entry
│   └── index.css              # Typography, custom fonts & styling
└── package.json
```
