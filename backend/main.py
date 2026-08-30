"""TravelGenie AI — stateless FastAPI backend.

No database, no persistence: every /plan-trip call fetches fresh data live
from the internet (Open-Meteo, OSRM, Wikipedia, Wikivoyage, web search, Groq)
and returns the V2 dashboard schema.
"""

import logging
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

PROJECT_ROOT = Path(__file__).resolve().parent
if str(PROJECT_ROOT.parent) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT.parent))

load_dotenv(PROJECT_ROOT / ".env")

from backend.schemas.trip_schema import TripPlanResponse, TripRequest  # noqa: E402
from backend.workflows.travel_workflow import TravelWorkflow  # noqa: E402

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger("travelgenie")

app = FastAPI(
    title="TravelGenie AI Backend",
    description="Live internet-powered travel planning (stateless, V2 dashboard schema).",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

workflow = TravelWorkflow()


@app.get("/")
async def read_root():
    return {
        "service": "TravelGenie AI",
        "version": "2.0.0",
        "mode": "stateless — all data fetched live from the internet",
        "data_sources": [
            "Open-Meteo (weather + geocoding)",
            "OSRM (real road routing)",
            "Wikipedia (summaries, images, coordinates)",
            "Wikivoyage (See/Eat/Buy/Stay safe)",
            "Groq LLM (analysis + itinerary)",
        ],
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy", "groq_configured": bool(os.getenv("GROQ_API_KEY"))}


@app.post("/plan-trip", response_model=TripPlanResponse)
async def plan_trip(req: TripRequest):
    """Plan a trip entirely from live internet data. Nothing is saved."""
    logger.info(
        "Planning trip: %s -> %s | %sd | ₹%s | %d travelers",
        req.starting_city, req.destination or "auto", req.days, req.budget, req.travelers,
    )
    result = workflow.run(req.model_dump())
    logger.info("Trip plan ready (status=%s)", result.get("status"))
    return result