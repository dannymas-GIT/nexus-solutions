import os
import secrets
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
from pydantic import AnyHttpUrl, validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = secrets.token_urlsafe(32)
    # 60 minutes * 24 hours * 8 days = 8 days
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8
    
    # CORS Configuration
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = []

    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    # Project Configuration
    PROJECT_NAME: str = "Nexus Solutions"
    
    # Azure AD Configuration - MUST be set via .env in production
    AZURE_TENANT_ID: Optional[str] = None
    AZURE_CLIENT_ID: Optional[str] = None
    CERT_PATH: Optional[str] = None
    CERT_PASSWORD: Optional[str] = None
    
    # Graph API Configuration
    GRAPH_API_VERSION: str = "v1.0"
    
    # Storage Configuration
    STORAGE_PROVIDER: str = "local"  # Options: onedrive, sharepoint, local
    
    # SharePoint settings
    SHAREPOINT_SITE_NAME: Optional[str] = None
    SHAREPOINT_DOCUMENT_LIBRARY: str = "documents"
    
    # OneDrive settings
    ONEDRIVE_ROOT_FOLDER: str = "NexusSolutions"
    
    # Local storage - project-relative
    LOCAL_STORAGE_PATH: str = str(_PROJECT_ROOT / "backend" / "output")
    
    # Template paths - relative to project root
    DOCX_TEMPLATES_PATH: str = str(_PROJECT_ROOT / "data" / "templates" / "docx")
    PPTX_TEMPLATES_PATH: str = str(_PROJECT_ROOT / "data" / "templates" / "pptx")
    PDF_TEMPLATES_PATH: str = str(_PROJECT_ROOT / "data" / "templates" / "pdf")
    
    # Workspace root for document tree / file access
    WORKSPACE_ROOT: str = str(_PROJECT_ROOT)
    
    # OpenAI Configuration
    OPENAI_API_KEY: Optional[str] = None
    
    # Database Configuration
    DATABASE_URL: Optional[str] = None
    
    class Config:
        case_sensitive = True
        env_file = ".env"


settings = Settings() 