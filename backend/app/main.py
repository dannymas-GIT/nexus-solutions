import logging
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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

app = FastAPI(
    title="Nexus Solutions API",
    description="Corporate data convergence, Idea Studio, executive deliverables, and client portal API",
    version="0.1.1",
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
    return {"status": "healthy", "version": "0.1.1"}


@app.get("/api/health")
async def api_health_check():
    """Alias for reverse-proxy health checks expecting /api/health."""
    return {"status": "healthy", "version": "0.1.1"}


@app.get("/")
async def root():
    return {
        "message": "Welcome to Nexus Solutions API",
        "docs": "/docs",
        "health": "/api/health",
    }


from .api.routes import documents, idea_studio, leads, portal, storage

app.include_router(storage.router, prefix="/api/v1")
app.include_router(documents.router, prefix="/api/v1")
app.include_router(leads.router, prefix="/api/v1")
# Client deliverable review (Income Scout / Greenhouse publish); API key + JWT auth inside router
app.include_router(portal.router, prefix="/api")
# Shared Idea Studio tenant-scoped proxy (TheHelm control-api; tenant=nexus-solutions)
app.include_router(idea_studio.router, prefix="/api")


@app.on_event("startup")
async def startup_event():
    logger.info("Starting Nexus Solutions API...")


@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down Nexus Solutions API...")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
