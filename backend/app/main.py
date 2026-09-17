from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.auth import router as auth_router
from app.api.v1.sync import router as sync_router
from app.api.v1.skills import router as skills_router
from app.api.v1.stats import router as stats_router

app = FastAPI(
    title="Skill Tracker Server API",
    description="Central Homelab Consolidation Backend & Sync Engine (Paso 4)",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth_router, prefix="/api/v1")
app.include_router(sync_router, prefix="/api/v1")
app.include_router(skills_router, prefix="/api/v1")
app.include_router(stats_router, prefix="/api/v1")

@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "service": "skill-tracker-backend"}
