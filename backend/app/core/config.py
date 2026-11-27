from pathlib import Path
import secrets
from typing import List, Optional, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parents[2]
REPO_ROOT = BACKEND_DIR.parent

DEFAULT_CORS_ORIGINS = [
    "https://nexus-solutions.us",
    "https://www.nexus-solutions.us",
    "http://localhost:3000",
    "http://localhost:5173",
]


class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8

    # CORS Configuration (comma-separated string or JSON list)
    BACKEND_CORS_ORIGINS: List[str] = DEFAULT_CORS_ORIGINS.copy()

    @field_validator("BACKEND_CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str], None]) -> List[str]:
        if v is None or v == "":
            return DEFAULT_CORS_ORIGINS.copy()
        if isinstance(v, str) and not v.startswith("["):
            origins = [i.strip() for i in v.split(",") if i.strip()]
            return origins or DEFAULT_CORS_ORIGINS.copy()
        if isinstance(v, list):
            return [str(i).strip() for i in v if str(i).strip()]
        raise ValueError(v)

    # Project Configuration
    PROJECT_NAME: str = "Nexus Solutions"
    NEXUS_WORKSPACE_ROOT: str = str(REPO_ROOT)

    # Admin / Storage API key (falls back to PORTAL_API_KEY when unset)
    NEXUS_ADMIN_API_KEY: Optional[str] = None

    # Optional notification recipient for corporate audit leads
    LEADS_NOTIFY_EMAIL: Optional[str] = None

    # Azure AD Configuration (supply via environment variables)
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

    # Local storage settings
    LOCAL_STORAGE_PATH: str = str(BACKEND_DIR / "output")

    # Template paths
    DOCX_TEMPLATES_PATH: str = str(BACKEND_DIR / "data" / "templates" / "docx")
    PPTX_TEMPLATES_PATH: str = str(BACKEND_DIR / "data" / "templates" / "pptx")
    PDF_TEMPLATES_PATH: str = str(BACKEND_DIR / "data" / "templates" / "pdf")

    # OpenAI Configuration
    OPENAI_API_KEY: Optional[str] = None

    # Database Configuration
    DATABASE_URL: Optional[str] = None

    # Idea Studio (shared TheHelm control-api integration)
    IDEA_STUDIO_API_BASE_URL: Optional[str] = None
    IDEA_STUDIO_PUBLIC_URL: Optional[str] = None
    IDEA_STUDIO_TENANT_ID: str = "nexus-solutions"
    IDEA_STUDIO_STAGING_DOMAIN: str = "nexus-solutions.us"
    IDEA_STUDIO_API_TOKEN: Optional[str] = None
    IDEA_STUDIO_TIMEOUT_SECONDS: int = 180

    model_config = SettingsConfigDict(case_sensitive=True, env_file=".env", extra="ignore")


settings = Settings()
