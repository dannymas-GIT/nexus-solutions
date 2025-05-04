import os
import shutil
import logging
from datetime import datetime
from pathlib import Path
from typing import BinaryIO, List, Dict, Any, Optional
import mimetypes

from ...core.config import settings
from .base import StorageService

logger = logging.getLogger(__name__)

class LocalStorageService(StorageService):
    """
    Local storage service for uploading, downloading, and managing files on the local file system.
    """
    
    def __init__(self):
        self.storage_path = Path(settings.LOCAL_STORAGE_PATH)
        
        # Ensure storage directory exists
        self._ensure_storage_path_exists()
    
    def _ensure_storage_path_exists(self):
        """Ensure the storage directory exists."""
        self.storage_path.mkdir(parents=True, exist_ok=True)
        logger.info(f"Local storage path set to: {self.storage_path}")
    
    def _get_full_path(self, path: str) -> Path:
        """Get the full path of a file or folder."""
        normalized_path = path.lstrip('/')
        return self.storage_path / normalized_path
    
    async def upload_file(self, file_path: Path, destination_path: str) -> str:
        """
        Upload a file to local storage.
        
        Args:
            file_path: Local path to the file to upload
            destination_path: Path where the file should be stored (relative to root folder)
            
        Returns:
            URL for the uploaded file (using file:// protocol)
        """
        # Ensure file exists
        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
        
        # Get the destination full path
        dest_full_path = self._get_full_path(destination_path)
        
        # Create parent directories if they don't exist
        dest_full_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Copy the file
        shutil.copy2(file_path, dest_full_path)
        logger.info(f"File uploaded from {file_path} to {dest_full_path}")
        
        # Return a file:// URL
        return f"file://{dest_full_path.absolute()}"
    
    async def upload_stream(self, file_stream: BinaryIO, destination_path: str, content_type: str) -> str:
        """
        Upload a file from a binary stream to local storage.
        
        Args:
            file_stream: Binary stream containing file data
            destination_path: Path where the file should be stored (relative to root folder)
            content_type: MIME type of the file
            
        Returns:
            URL for the uploaded file (using file:// protocol)
        """
        # Get the destination full path
        dest_full_path = self._get_full_path(destination_path)
        
        # Create parent directories if they don't exist
        dest_full_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Write the file from the stream
        with open(dest_full_path, 'wb') as f:
            # Read the stream in chunks to handle large files
            chunk_size = 1024 * 1024  # 1MB chunks
            chunk = file_stream.read(chunk_size)
            while chunk:
                f.write(chunk)
                chunk = file_stream.read(chunk_size)
        
        logger.info(f"File uploaded from stream to {dest_full_path}")
        
        # Return a file:// URL
        return f"file://{dest_full_path.absolute()}"
    
    async def download_file(self, file_path: str, destination_path: Path) -> Path:
        """
        Download a file from local storage.
        
        Args:
            file_path: Path to the file in storage (relative to root folder)
            destination_path: Local path where the file should be saved
            
        Returns:
            Path to the downloaded file
        """
        # Get the source full path
        source_full_path = self._get_full_path(file_path)
        
        # Ensure file exists
        if not source_full_path.exists():
            raise FileNotFoundError(f"File not found in storage: {source_full_path}")
        
        # Create parent directories if they don't exist
        destination_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Copy the file
        shutil.copy2(source_full_path, destination_path)
        logger.info(f"File downloaded from {source_full_path} to {destination_path}")
        
        return destination_path
    
    async def get_file_url(self, file_path: str) -> str:
        """
        Get the URL for a file in local storage.
        
        Args:
            file_path: Path to the file in storage (relative to root folder)
            
        Returns:
            URL for the file (using file:// protocol)
        """
        full_path = self._get_full_path(file_path)
        
        # Ensure file exists
        if not full_path.exists():
            raise FileNotFoundError(f"File not found in storage: {full_path}")
        
        return f"file://{full_path.absolute()}"
    
    async def list_files(self, folder_path: str) -> List[Dict[str, Any]]:
        """
        List files in a folder.
        
        Args:
            folder_path: Path to the folder in storage (relative to root folder)
            
        Returns:
            List of file information dictionaries
        """
        folder_full_path = self._get_full_path(folder_path)
        
        # Ensure folder exists
        if not folder_full_path.exists():
            raise FileNotFoundError(f"Folder not found in storage: {folder_full_path}")
        
        # Get list of files and folders
        files_list = []
        for item in folder_full_path.iterdir():
            item_type = "folder" if item.is_dir() else "file"
            
            # Get file size and modified date if it's a file
            size = item.stat().st_size if item.is_file() else 0
            modified = datetime.fromtimestamp(item.stat().st_mtime).isoformat()
            
            # Get MIME type if it's a file
            content_type = None
            if item.is_file():
                content_type, _ = mimetypes.guess_type(str(item))
                if not content_type:
                    content_type = "application/octet-stream"
            
            files_list.append({
                "name": item.name,
                "path": str(item.relative_to(self.storage_path)),
                "type": item_type,
                "size": size,
                "modified": modified,
                "content_type": content_type
            })
        
        return files_list
    
    async def delete_file(self, file_path: str) -> bool:
        """
        Delete a file from local storage.
        
        Args:
            file_path: Path to the file in storage (relative to root folder)
            
        Returns:
            True if file was deleted, False otherwise
        """
        file_full_path = self._get_full_path(file_path)
        
        # Check if file exists
        if not file_full_path.exists():
            logger.warning(f"File not found for deletion: {file_full_path}")
            return False
        
        # Delete the file
        try:
            if file_full_path.is_dir():
                shutil.rmtree(file_full_path)
            else:
                file_full_path.unlink()
            logger.info(f"Deleted file/folder: {file_full_path}")
            return True
        except Exception as e:
            logger.error(f"Error deleting {file_full_path}: {str(e)}")
            return False
    
    async def create_folder(self, folder_path: str) -> str:
        """
        Create a folder in local storage.
        
        Args:
            folder_path: Path to the folder to create (relative to root folder)
            
        Returns:
            Path to the created folder
        """
        folder_full_path = self._get_full_path(folder_path)
        
        # Create the folder (and parents if needed)
        folder_full_path.mkdir(parents=True, exist_ok=True)
        logger.info(f"Created folder: {folder_full_path}")
        
        return str(folder_full_path)
    
    async def folder_exists(self, folder_path: str) -> bool:
        """
        Check if a folder exists in local storage.
        
        Args:
            folder_path: Path to the folder to check (relative to root folder)
            
        Returns:
            True if folder exists, False otherwise
        """
        folder_full_path = self._get_full_path(folder_path)
        return folder_full_path.exists() and folder_full_path.is_dir() 