#!/usr/bin/env python3
"""
Setup script to initialize the Nexus Business Builder environment.
This sets up the necessary directories and files for the application.
"""
import os
import shutil
from pathlib import Path
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Project root directory
ROOT_DIR = Path(__file__).resolve().parent

# Backend directory
BACKEND_DIR = ROOT_DIR / "backend"

# Create required directories
def create_directories():
    """Create required directories if they don't exist."""
    directories = [
        BACKEND_DIR / "logs",
        BACKEND_DIR / "data" / "templates" / "docx",
        BACKEND_DIR / "data" / "templates" / "pptx",
        BACKEND_DIR / "data" / "templates" / "pdf",
        BACKEND_DIR / "data" / "config_examples",
        ROOT_DIR / "configs",
        ROOT_DIR / "output"
    ]
    
    for directory in directories:
        if not directory.exists():
            directory.mkdir(parents=True, exist_ok=True)
            logger.info(f"Created directory: {directory}")

# Copy certificates to the backend
def copy_certificates():
    """Copy certificate files to the backend directory."""
    cert_source = ROOT_DIR / "certificates"
    cert_dest = BACKEND_DIR / "certificates"
    
    if not cert_dest.exists():
        cert_dest.mkdir(parents=True, exist_ok=True)
    
    # Copy certificate files
    for cert_file in cert_source.glob("*.pfx"):
        shutil.copy(cert_file, cert_dest / cert_file.name)
        logger.info(f"Copied certificate: {cert_file} to {cert_dest}")
    
    for cert_file in cert_source.glob("*.cer"):
        shutil.copy(cert_file, cert_dest / cert_file.name)
        logger.info(f"Copied certificate: {cert_file} to {cert_dest}")

# Copy environment file
def copy_env_file():
    """Copy environment file to the backend directory."""
    env_source = ROOT_DIR / "azure_env.env"
    env_dest = BACKEND_DIR / ".env"
    
    if env_source.exists():
        shutil.copy(env_source, env_dest)
        logger.info(f"Copied environment file: {env_source} to {env_dest}")
    else:
        logger.warning(f"Environment file not found: {env_source}")

def main():
    """Main function to run setup."""
    logger.info("Setting up Nexus Business Builder environment...")
    
    # Create directories
    create_directories()
    
    # Copy certificates
    copy_certificates()
    
    # Copy environment file
    copy_env_file()
    
    logger.info("Environment setup complete!")
    
    # Instructions
    print("\n" + "="*80)
    print("Nexus Business Builder Setup Complete")
    print("="*80)
    print("\nTo start the backend server, run:")
    print("    cd backend")
    print("    uvicorn app.main:app --reload")
    print("\nAPI documentation will be available at:")
    print("    http://localhost:8000/docs")
    print("\nHealth check endpoint:")
    print("    http://localhost:8000/health")
    print("\nStorage API endpoints:")
    print("    http://localhost:8000/api/v1/storage/status")
    print("    http://localhost:8000/api/v1/storage/files")
    print("\n" + "="*80)

if __name__ == "__main__":
    main() 