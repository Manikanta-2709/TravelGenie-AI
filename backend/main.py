from fastapi import FastAPI

from backend.api.routes.trip_routes import router as trip_router

app = FastAPI(
    title="TravelGenie AI API",
    description="AI-powered travel planning powered by a LangGraph workflow.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.include_router(trip_router)


@app.get("/health", tags=["System"], summary="Check API health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}
