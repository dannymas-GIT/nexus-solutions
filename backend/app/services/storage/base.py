from abc import ABC, abstractmethod
from typing import BinaryIO, List, Optional, Dict, Any
from pathlib import Path


class StorageService(ABC):
    """Base abstract class for storage services."""
    
    @abstractmethod
    async def upload_file(self, file_path: Path, destination_path: str) -> str:
        """
        Upload a file to storage.
        
        Args:
            file_path: Local path to the file to upload
            destination_path: Path where the file should be stored
            
        Returns:
            URL or identifier for the uploaded file
        """
        pass
    
    @abstractmethod
    async def upload_stream(self, file_stream: BinaryIO, destination_path: str, content_type: str) -> str:
        """
        Upload a file stream to storage.
        
        Args:
            file_stream: File-like object containing the file data
            destination_path: Path where the file should be stored
            content_type: MIME type of the file
            
        Returns:
            URL or identifier for the uploaded file
        """
        pass
    
    @abstractmethod
    async def download_file(self, file_path: str, destination_path: Path) -> Path:
        """
        Download a file from storage.
        
        Args:
            file_path: Path to the file in storage
            destination_path: Local path where the file should be saved
            
        Returns:
            Local path to the downloaded file
        """
        pass
    
    @abstractmethod
    async def get_file_url(self, file_path: str) -> str:
        """
        Get a URL for a file in storage.
        
        Args:
            file_path: Path to the file in storage
            
        Returns:
            URL for the file
        """
        pass
    
    @abstractmethod
    async def list_files(self, folder_path: str) -> List[Dict[str, Any]]:
        """
        List files in a folder.
        
        Args:
            folder_path: Path to the folder in storage
            
        Returns:
            List of file metadata
        """
        pass
    
    @abstractmethod
    async def delete_file(self, file_path: str) -> bool:
        """
        Delete a file from storage.
        
        Args:
            file_path: Path to the file in storage
            
        Returns:
            True if the file was deleted, False otherwise
        """
        pass
    
    @abstractmethod
    async def create_folder(self, folder_path: str) -> str:
        """
        Create a folder in storage.
        
        Args:
            folder_path: Path to the folder to create
            
        Returns:
            Path to the created folder
        """
        pass
    
    @abstractmethod
    async def folder_exists(self, folder_path: str) -> bool:
        """
        Check if a folder exists in storage.
        
        Args:
            folder_path: Path to the folder to check
            
        Returns:
            True if the folder exists, False otherwise
        """
        pass 