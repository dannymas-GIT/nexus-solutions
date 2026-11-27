from __future__ import annotations

import hmac
import logging
import os
import tempfile
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, File, Header, HTTPException, UploadFile

from ...services.storage import get_storage_service
from ...services.storage.base import StorageService

router = APIRouter(prefix="/storage", tags=["storage"])
logger = logging.getLogger(__name__)


def require_admin_api_key(
    x_admin_api_key: Optional[str] = Header(None, alias="X-Admin-Api-Key"),
    authorization: Optional[str] = Header(None, alias="Authorization"),
) -> None:
    """Require an operator API key for storage and admin endpoints."""
    expected = (
        os.environ.get("NEXUS_ADMIN_API_KEY")
        or os.environ.get("PORTAL_API_KEY")
        or ""
    ).strip()
    if not expected:
        raise HTTPException(
            status_code=503,
            detail="Storage/admin API key is not configured on server",
        )
    provided = (x_admin_api_key or "").strip()
    if not provided and authorization and authorization.lower().startswith("bearer "):
        provided = authorization[7:].strip()
    if not provided or not hmac.compare_digest(provided, expected):
        raise HTTPException(status_code=401, detail="Unauthorized")


@router.get("/status")
async def storage_status(_: None = Depends(require_admin_api_key)):
    """Check if storage service is configured and working."""
    try:
        storage_service = get_storage_service()
        return {"status": "ok", "provider": storage_service.__class__.__name__}
    except Exception as e:
        logger.exception("Failed to initialize storage service")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    destination_path: Optional[str] = None,
    background_tasks: BackgroundTasks = None,
    _: None = Depends(require_admin_api_key),
    storage_service: StorageService = Depends(get_storage_service),
):
    """Upload a file to storage."""
    try:
        if not destination_path:
            destination_path = file.filename

        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_path = temp_file.name

        file_url = await storage_service.upload_file(Path(temp_path), destination_path)

        if background_tasks:
            background_tasks.add_task(os.unlink, temp_path)
        else:
            os.unlink(temp_path)

        return {"filename": file.filename, "destination": destination_path, "url": file_url}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Failed to upload file: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/files")
async def list_files(
    folder_path: str = "",
    _: None = Depends(require_admin_api_key),
    storage_service: StorageService = Depends(get_storage_service),
):
    """List files in a folder."""
    try:
        files = await storage_service.list_files(folder_path)
        return {"folder": folder_path, "files": files}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Failed to list files: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/create-folder")
async def create_folder(
    folder_path: str,
    _: None = Depends(require_admin_api_key),
    storage_service: StorageService = Depends(get_storage_service),
):
    """Create a folder in storage."""
    try:
        folder_id = await storage_service.create_folder(folder_path)
        return {"folder": folder_path, "id": folder_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Failed to create folder: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/files/{file_path:path}")
async def delete_file(
    file_path: str,
    _: None = Depends(require_admin_api_key),
    storage_service: StorageService = Depends(get_storage_service),
):
    """Delete a file from storage."""
    try:
        success = await storage_service.delete_file(file_path)
        if success:
            return {"status": "ok", "file": file_path}
        raise HTTPException(
            status_code=404,
            detail=f"File not found or could not be deleted: {file_path}",
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Failed to delete file: {e}")
        raise HTTPException(status_code=500, detail=str(e))
