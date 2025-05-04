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
logs_dir.mkdir(exist_ok=True)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(Path("./logs/app.log"))
    ]
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Nexus Business Builder API",
    description="API for generating comprehensive business plans",
    version="0.1.0"
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
        "message": "Welcome to Nexus Business Builder API",
        "docs": "/docs",
        "health": "/health"
    }

# Import and include routes
from .api.routes import storage, documents
app.include_router(storage.router, prefix="/api/v1")
app.include_router(documents.router, prefix="/api/v1")

@app.on_event("startup")
async def startup_event():
    logger.info("Starting Nexus Business Builder API...")
    # Future startup tasks:
    # - Connect to database
    # - Initialize services
    # - Validate integrations
    
@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down Nexus Business Builder API...")
    # Future shutdown tasks:
    # - Close database connections
    # - Clean up resources

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 