from typing import Optional
from ...core.config import settings
from .base import StorageService
from .onedrive import OneDriveStorageService
# from app.services.storage.sharepoint import SharePointStorageService
from .local import LocalStorageService

_storage_service: Optional[StorageService] = None


def get_storage_service() -> StorageService:
    """
    Factory function to get the configured storage service.
    Uses the STORAGE_PROVIDER setting to determine which service to use.
    Implements a singleton pattern.
    """
    global _storage_service
    
    if _storage_service is not None:
        return _storage_service
    
    if settings.STORAGE_PROVIDER == "onedrive":
        _storage_service = OneDriveStorageService()
    # elif settings.STORAGE_PROVIDER == "sharepoint":
    #     _storage_service = SharePointStorageService()
    elif settings.STORAGE_PROVIDER == "local":
        _storage_service = LocalStorageService()
    else:
        raise ValueError(f"Unknown storage provider: {settings.STORAGE_PROVIDER}")
    
    return _storage_service 