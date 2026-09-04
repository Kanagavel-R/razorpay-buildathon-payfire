"""PayFire FastAPI Application Entrypoint."""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db
from app.api import health, scenarios, chaos, incidents, ai, simulations, safety, execution, audit


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    init_db()
    print(f"[{settings.APP_NAME}] Database initialized successfully ({settings.DATABASE_URL})")
    yield
    print(f"[{settings.APP_NAME}] Shutting down.")


app = FastAPI(
    title="PayFire — AI Payment Chaos Lab",
    description="Pre-deployment testing, simulation, and safety verification platform for payment recovery strategies.",
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS + ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers under /api
app.include_router(health.router, prefix="/api")
app.include_router(scenarios.router, prefix="/api")
app.include_router(chaos.router, prefix="/api")
app.include_router(incidents.router, prefix="/api")
app.include_router(ai.router, prefix="/api")
app.include_router(simulations.router, prefix="/api")
app.include_router(safety.router, prefix="/api")
app.include_router(execution.router, prefix="/api")
app.include_router(audit.router, prefix="/api")


@app.get("/")
def root():
    return {
        "name": "PayFire — AI Payment Chaos Lab",
        "tagline": "Break payments before they break your revenue.",
        "docs_url": "/docs",
        "health_check": "/api/health",
        "version": settings.APP_VERSION,
    }
