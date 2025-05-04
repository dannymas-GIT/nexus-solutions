import os
import secrets
from typing import Any, Dict, List, Optional, Union
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
    PROJECT_NAME: str = "Nexus Business Builder"
    
    # Azure AD Configuration
    AZURE_TENANT_ID: Optional[str] = "8fe97a37-6956-4bc2-8253-f97f816bc733"
    AZURE_CLIENT_ID: Optional[str] = "4bc94816-f1d4-4cff-8bf7-e4efb061d662"
    CERT_PATH: Optional[str] = "/opt/projects/NexusBusinessBuilder/certificates/NexusBusinessAgent.pfx"
    CERT_PASSWORD: Optional[str] = "NexusAgent123"
    
    # Graph API Configuration
    GRAPH_API_VERSION: str = "v1.0"
    
    # Storage Configuration
    STORAGE_PROVIDER: str = "onedrive"  # Options: onedrive, sharepoint, local
    
    # SharePoint settings
    SHAREPOINT_SITE_NAME: Optional[str] = None
    SHAREPOINT_DOCUMENT_LIBRARY: str = "documents"
    
    # OneDrive settings
    ONEDRIVE_ROOT_FOLDER: str = "NexusSolutions"
    
    # Local storage settings
    LOCAL_STORAGE_PATH: str = "/opt/projects/NexusBusinessBuilder/backend/output"
    
    # Template paths
    DOCX_TEMPLATES_PATH: str = "./data/templates/docx"
    PPTX_TEMPLATES_PATH: str = "./data/templates/pptx"
    PDF_TEMPLATES_PATH: str = "./data/templates/pdf"
    
    # OpenAI Configuration
    OPENAI_API_KEY: Optional[str] = None
    
    # Database Configuration
    DATABASE_URL: Optional[str] = None
    
    class Config:
        case_sensitive = True
        env_file = ".env"


settings = Settings() 