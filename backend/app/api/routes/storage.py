from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.responses import JSONResponse
from pathlib import Path
import tempfile
import os
import logging
from typing import List

from ...services.storage import get_storage_service
from ...services.storage.base import StorageService

router = APIRouter(prefix="/storage", tags=["storage"])
logger = logging.getLogger(__name__)


@router.get("/status")
async def storage_status():
    """Check if storage service is configured and working."""
    try:
        # Just get the service to test if initialization works
        storage_service = get_storage_service()
        return {"status": "ok", "provider": storage_service.__class__.__name__}
    except Exception as e:
        logger.exception("Failed to initialize storage service")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    destination_path: str = None,
    background_tasks: BackgroundTasks = None,
    storage_service: StorageService = Depends(get_storage_service)
):
    """
    Upload a file to storage.
    
    Args:
        file: The file to upload
        destination_path: Path where to store the file (relative to root folder)
    """
    try:
        # Use the filename as destination path if not provided
        if not destination_path:
            destination_path = file.filename
        
        # Create a temporary file
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            # Write the uploaded file to the temporary file
            content = await file.read()
            temp_file.write(content)
            temp_path = temp_file.name
        
        # Upload the file
        file_url = await storage_service.upload_file(Path(temp_path), destination_path)
        
        # Schedule temp file deletion
        if background_tasks:
            background_tasks.add_task(os.unlink, temp_path)
        else:
            os.unlink(temp_path)
        
        return {"filename": file.filename, "destination": destination_path, "url": file_url}
    
    except Exception as e:
        logger.exception(f"Failed to upload file: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/files")
async def list_files(
    folder_path: str = "",
    storage_service: StorageService = Depends(get_storage_service)
):
    """
    List files in a folder.
    
    Args:
        folder_path: Path to the folder (relative to root folder)
    """
    try:
        files = await storage_service.list_files(folder_path)
        return {"folder": folder_path, "files": files}
    except Exception as e:
        logger.exception(f"Failed to list files: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/create-folder")
async def create_folder(
    folder_path: str,
    storage_service: StorageService = Depends(get_storage_service)
):
    """
    Create a folder in storage.
    
    Args:
        folder_path: Path to the folder to create (relative to root folder)
    """
    try:
        folder_id = await storage_service.create_folder(folder_path)
        return {"folder": folder_path, "id": folder_id}
    except Exception as e:
        logger.exception(f"Failed to create folder: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/files/{file_path:path}")
async def delete_file(
    file_path: str,
    storage_service: StorageService = Depends(get_storage_service)
):
    """
    Delete a file from storage.
    
    Args:
        file_path: Path to the file to delete (relative to root folder)
    """
    try:
        success = await storage_service.delete_file(file_path)
        if success:
            return {"status": "ok", "file": file_path}
        else:
            raise HTTPException(status_code=404, detail=f"File not found or could not be deleted: {file_path}")
    except Exception as e:
        logger.exception(f"Failed to delete file: {e}")
        raise HTTPException(status_code=500, detail=str(e)) 