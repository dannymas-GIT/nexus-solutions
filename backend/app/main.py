from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from dotenv import load_dotenv
import logging
from pathlib import Path

# Load environment variables
load_dotenv()

# Create logs directory if it doesn't exist
logs_dir = Path("./logs")
try:
    logs_dir.mkdir(exist_ok=True)
    file_handler = logging.FileHandler(logs_dir / "app.log")
except (OSError, PermissionError):
    file_handler = logging.StreamHandler()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(), file_handler]
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Nexus Solutions API",
    description="Dual-offering platform: Nexus Launch (business plans) and Nexus Intelligence (data convergence)",
    version="0.2.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development only, restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "0.1.0"}

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Welcome to Nexus Solutions API",
        "docs": "/docs",
        "health": "/health",
        "workspaces": ["launch", "intelligence"]
    }

# Import and include routes
from .api.routes import storage, documents, auth, workspaces, intake, kpis, connectors
from .core.database import init_db

app.include_router(storage.router, prefix="/api/v1")
app.include_router(documents.router, prefix="/api/v1")
app.include_router(auth.router, prefix="/api/v1")
app.include_router(workspaces.router, prefix="/api/v1")
app.include_router(intake.router, prefix="/api/v1")
app.include_router(kpis.router, prefix="/api/v1")
app.include_router(connectors.router, prefix="/api/v1")

@app.on_event("startup")
async def startup_event():
    logger.info("Starting Nexus Solutions API...")
    try:
        init_db()
        logger.info("Database tables initialized")
    except Exception as e:
        logger.warning(f"Database init skipped or failed: {e}")
    
@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down Nexus Business Builder API...")
    # Future shutdown tasks:
    # - Close database connections
    # - Clean up resources

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 