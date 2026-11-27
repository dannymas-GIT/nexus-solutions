import logging
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.routes import (
    admin_users,
    auth,
    convergence,
    documents,
    idea_studio,
    leads,
    portal,
    storage,
)
from .core.config import settings

load_dotenv()

logs_dir = Path("./logs")
handlers: list[logging.Handler] = [logging.StreamHandler()]
try:
    logs_dir.mkdir(exist_ok=True)
    handlers.append(logging.FileHandler(logs_dir / "app.log"))
except OSError:
    pass

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=handlers,
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    logger.info("Starting Nexus Solutions API...")
    yield
    logger.info("Shutting down Nexus Solutions API...")


app = FastAPI(
    title="Nexus Solutions API",
    description="Corporate data convergence, KPI intelligence, executive reports, RBAC, Idea Studio, and client portal API",
    version="0.3.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "0.3.0"}


@app.get("/api/health")
async def api_health_check():
    """Alias for reverse-proxy health checks expecting /api/health."""
    return {"status": "healthy", "version": "0.3.0"}


@app.get("/")
async def root():
    return {
        "message": "Welcome to Nexus Solutions API",
        "docs": "/docs",
        "health": "/api/health",
    }


app.include_router(storage.router, prefix="/api/v1")
app.include_router(documents.router, prefix="/api/v1")
app.include_router(leads.router, prefix="/api/v1")
app.include_router(convergence.router, prefix="/api/v1")
# Auth, Profile (/api/v1/auth/*, /api/users/me/password) and Admin Users (/api/admin/users/*)
app.include_router(auth.router, prefix="/api")
app.include_router(admin_users.router, prefix="/api")
# Client deliverable review (Income Scout / Greenhouse / Report Studio publish)
app.include_router(portal.router, prefix="/api")
# Shared Idea Studio tenant-scoped proxy (TheHelm control-api; tenant=nexus-solutions)
app.include_router(idea_studio.router, prefix="/api")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
