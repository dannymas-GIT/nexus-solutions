#!/usr/bin/env python3
"""
Standalone test script for Local Storage integration.
This script tests file operations without requiring FastAPI or other dependencies.
"""
import asyncio
import os
import tempfile
from pathlib import Path
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Add the backend directory to the path so we can import modules
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), "backend"))

from app.services.storage import get_storage_service
from app.core.config import settings

class LocalStorageTest:
    """Test class for Local Storage operations."""
    
    def __init__(self):
        self.storage_service = get_storage_service()
        logger.info(f"Using storage service: {self.storage_service.__class__.__name__}")
        logger.info(f"Storage path: {settings.LOCAL_STORAGE_PATH}")
    
    async def create_test_folder(self):
        """Create a test folder."""
        folder_name = "test_folder"
        logger.info(f"Creating test folder: {folder_name}")
        
        folder_id = await self.storage_service.create_folder(folder_name)
        logger.info(f"Folder created: {folder_id}")
        
        return folder_name
    
    async def create_test_file(self, folder_name=""):
        """Create a test file and upload it."""
        # Create a test file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".txt") as temp_file:
            test_content = f"This is a test file for local storage."
            temp_file.write(test_content.encode('utf-8'))
            temp_path = temp_file.name
        
        # Upload the file
        destination = f"{folder_name}/test_file.txt" if folder_name else "test_file.txt"
        logger.info(f"Uploading test file to: {destination}")
        
        file_url = await self.storage_service.upload_file(Path(temp_path), destination)
        
        # Clean up temp file
        os.unlink(temp_path)
        
        logger.info(f"File uploaded successfully. URL: {file_url}")
        return destination, file_url
    
    async def list_files(self, folder_path=""):
        """List files in a folder."""
        logger.info(f"Listing files in folder: '{folder_path}' or root if empty")
        
        try:
            files = await self.storage_service.list_files(folder_path)
            
            logger.info(f"Files in '{folder_path or 'root'}':")
            for file in files:
                logger.info(f"  - {file['name']} ({file['type']})")
            
            return files
        except Exception as e:
            logger.error(f"Error listing files: {e}")
            return []
    
    async def download_test_file(self, file_path):
        """Download a test file."""
        # Create a temporary directory for the download
        with tempfile.TemporaryDirectory() as temp_dir:
            download_path = Path(temp_dir) / "downloaded_file.txt"
            
            logger.info(f"Downloading file {file_path} to {download_path}")
            
            result_path = await self.storage_service.download_file(file_path, download_path)
            
            # Read the content to verify
            content = download_path.read_text()
            logger.info(f"Downloaded file content: {content}")
            
            return content
    
    async def delete_test_file(self, file_path):
        """Delete a test file."""
        logger.info(f"Deleting file: {file_path}")
        
        success = await self.storage_service.delete_file(file_path)
        
        if success:
            logger.info(f"File deleted successfully: {file_path}")
        else:
            logger.error(f"Failed to delete file: {file_path}")
        
        return success
    
    async def run_tests(self):
        """Run all tests."""
        print("=" * 80)
        print("TESTING LOCAL STORAGE INTEGRATION")
        print("=" * 80)
        
        print("\n1. Creating test folder...")
        folder_name = await self.create_test_folder()
        
        print("\n2. Creating test file...")
        file_path, file_url = await self.create_test_file(folder_name)
        
        print("\n3. Listing files in root folder...")
        await self.list_files()
        
        print("\n4. Listing files in test folder...")
        await self.list_files(folder_name)
        
        print("\n5. Downloading test file...")
        content = await self.download_test_file(file_path)
        
        print("\n6. Deleting test file...")
        await self.delete_test_file(file_path)
        
        print("\n7. Listing files after deletion...")
        await self.list_files(folder_name)
        
        print("\n8. Deleting test folder...")
        await self.delete_test_file(folder_name)
        
        print("\n9. Listing files in root after folder deletion...")
        await self.list_files()
        
        print("\n" + "=" * 80)
        print("ALL TESTS COMPLETED SUCCESSFULLY!")
        print("=" * 80)


async def main():
    test = LocalStorageTest()
    await test.run_tests()


if __name__ == "__main__":
    asyncio.run(main()) 