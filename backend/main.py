from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.routes.trip_routes import router as trip_router
from backend.database.db import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager for database initialization on startup."""
    init_db()
    yield


app = FastAPI(
    title="TravelGenie AI API",
    description="AI-powered multi-agent travel planning workflow with FastAPI and LangGraph.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(trip_router)


@app.get("/", tags=["System"], summary="Root API Endpoint")
def read_root() -> dict[str, str]:
    """Return welcome message verifying API status."""
    return {"message": "TravelGenie API Running"}


@app.get("/health", tags=["System"], summary="Check API health")
def health_check() -> dict[str, str]:
    """Health check status endpoint."""
    return {"status": "ok"}
