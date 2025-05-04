import os
import json
import requests
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import BinaryIO, List, Dict, Any, Optional
import base64
import mimetypes

from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.serialization import pkcs12
import jwt

from ...core.config import settings
from .base import StorageService

logger = logging.getLogger(__name__)

class OneDriveStorageService(StorageService):
    """
    OneDrive storage service for uploading, downloading, and managing files using Microsoft Graph API.
    Uses certificate-based authentication with Azure AD.
    """
    
    def __init__(self):
        self.tenant_id = settings.AZURE_TENANT_ID
        self.client_id = settings.AZURE_CLIENT_ID
        self.cert_path = settings.CERT_PATH
        self.cert_password = settings.CERT_PASSWORD
        self.api_version = settings.GRAPH_API_VERSION
        self.root_folder = settings.ONEDRIVE_ROOT_FOLDER
        
        # Access token cache
        self._access_token = None
        self._token_expiry = datetime.now()
        
        # Ensure the root folder exists when service is initialized
        self._ensure_root_folder_exists()
    
    async def get_access_token(self) -> str:
        """Get a valid access token, refreshing if necessary."""
        # Check if token is still valid (with 5 minute buffer)
        if self._access_token and self._token_expiry > (datetime.now() + timedelta(minutes=5)):
            return self._access_token
        
        # Load the PFX file
        with open(self.cert_path, "rb") as f:
            pfx_data = f.read()
        
        # Extract private key
        private_key, certificate, _ = pkcs12.load_key_and_certificates(
            pfx_data,
            self.cert_password.encode('utf-8')
        )
        
        # JWT header
        header = {
            "alg": "RS256",
            "typ": "JWT",
            "x5t": base64.b64encode(certificate.fingerprint(hashes.SHA1())).decode('utf-8')
        }
        
        # Calculate expiration time (1 hour from now)
        now = datetime.now()
        exp = now + timedelta(hours=1)
        
        # JWT payload
        payload = {
            "aud": f"https://login.microsoftonline.com/{self.tenant_id}/oauth2/v2.0/token",
            "iss": self.client_id,
            "sub": self.client_id,
            "jti": base64.urlsafe_b64encode(os.urandom(16)).decode('utf-8'),
            "nbf": int(now.timestamp()),
            "exp": int(exp.timestamp()),
        }
        
        # Create the JWT assertion
        private_key_pem = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        )
        
        token = jwt.encode(
            payload=payload,
            key=private_key_pem,
            algorithm="RS256",
            headers=header
        )
        
        # Exchange JWT for access token
        token_url = f"https://login.microsoftonline.com/{self.tenant_id}/oauth2/v2.0/token"
        token_data = {
            "grant_type": "client_credentials",
            "client_id": self.client_id,
            "client_assertion_type": "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
            "client_assertion": token,
            "scope": "https://graph.microsoft.com/.default"
        }
        
        response = requests.post(token_url, data=token_data)
        
        if response.status_code == 200:
            token_data = response.json()
            self._access_token = token_data["access_token"]
            # Set token expiry time (usually 1 hour, but can be different)
            expires_in = token_data.get("expires_in", 3600)  # Default to 1 hour if not specified
            self._token_expiry = datetime.now() + timedelta(seconds=expires_in)
            return self._access_token
        else:
            logger.error(f"Failed to get access token: {response.status_code} - {response.text}")
            raise Exception(f"Failed to get access token: {response.status_code} - {response.text}")
    
    def _get_headers(self, token: str, content_type: Optional[str] = "application/json") -> Dict[str, str]:
        """Get the headers for a request."""
        headers = {
            "Authorization": f"Bearer {token}",
        }
        
        if content_type:
            headers["Content-Type"] = content_type
            
        return headers
    
    async def _get_root_drive(self) -> str:
        """Get the ID of the root drive."""
        token = await self.get_access_token()
        
        # Get the drives for the site
        url = f"https://graph.microsoft.com/v1.0/sites/root/drives"
        response = requests.get(url, headers=self._get_headers(token))
        
        if response.status_code != 200:
            logger.error(f"Failed to get drives: {response.status_code} - {response.text}")
            raise Exception(f"Failed to get drives: {response.status_code} - {response.text}")
        
        drives = response.json().get("value", [])
        if not drives:
            logger.error("No drives found")
            raise Exception("No drives found")
        
        # Use the first document library found
        return drives[0]["id"]
    
    async def _ensure_root_folder_exists(self) -> str:
        """Ensure the root folder exists and return its ID."""
        token = await self.get_access_token()
        drive_id = await self._get_root_drive()
        
        # Check if the root folder exists
        url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{self.root_folder}"
        response = requests.get(url, headers=self._get_headers(token))
        
        if response.status_code == 200:
            # Folder exists, return its ID
            return response.json()["id"]
        
        # Create the folder
        logger.info(f"Creating root folder: {self.root_folder}")
        url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root/children"
        data = {
            "name": self.root_folder,
            "folder": {},
            "@microsoft.graph.conflictBehavior": "rename"
        }
        
        response = requests.post(url, headers=self._get_headers(token), json=data)
        
        if response.status_code not in [201, 200]:
            logger.error(f"Failed to create root folder: {response.status_code} - {response.text}")
            raise Exception(f"Failed to create root folder: {response.status_code} - {response.text}")
        
        return response.json()["id"]
    
    async def upload_file(self, file_path: Path, destination_path: str) -> str:
        """
        Upload a file to OneDrive.
        
        Args:
            file_path: Local path to the file to upload
            destination_path: Path where the file should be stored (relative to root folder)
            
        Returns:
            URL for the uploaded file
        """
        # Ensure file exists
        if not file_path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
        
        # Get file data
        with open(file_path, "rb") as f:
            file_data = f.read()
        
        # Get MIME type
        content_type, _ = mimetypes.guess_type(str(file_path))
        if not content_type:
            content_type = "application/octet-stream"
        
        # Upload using stream method
        return await self.upload_stream(file_data, destination_path, content_type)
    
    async def upload_stream(self, file_stream: BinaryIO, destination_path: str, content_type: str) -> str:
        """
        Upload a file stream to OneDrive.
        
        Args:
            file_stream: File-like object or bytes containing the file data
            destination_path: Path where the file should be stored (relative to root folder)
            content_type: MIME type of the file
            
        Returns:
            URL for the uploaded file
        """
        token = await self.get_access_token()
        drive_id = await self._get_root_drive()
        
        # Ensure parent folders exist
        path_parts = destination_path.split('/')
        filename = path_parts[-1]
        parent_path = '/'.join(path_parts[:-1]) if len(path_parts) > 1 else ""
        
        # Get or create parent folder path
        parent_id = None
        if parent_path:
            parent_id = await self.create_folder(parent_path)
        
        # Use the simple upload API for files up to 4MB
        # For larger files, you would need to use the upload session API
        
        # Build the upload URL
        if parent_path:
            url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/items/{parent_id}:/{filename}:/content"
        else:
            url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{self.root_folder}/{filename}:/content"
        
        headers = self._get_headers(token, content_type)
        
        # Convert to bytes if it's a file-like object
        if hasattr(file_stream, 'read') and callable(file_stream.read):
            file_data = file_stream.read()
        else:
            file_data = file_stream
        
        response = requests.put(url, headers=headers, data=file_data)
        
        if response.status_code not in [200, 201]:
            logger.error(f"Failed to upload file: {response.status_code} - {response.text}")
            raise Exception(f"Failed to upload file: {response.status_code} - {response.text}")
        
        # Return the webUrl from the response
        return response.json().get("webUrl", "")
    
    async def download_file(self, file_path: str, destination_path: Path) -> Path:
        """
        Download a file from OneDrive.
        
        Args:
            file_path: Path to the file in OneDrive (relative to root folder)
            destination_path: Local path where the file should be saved
            
        Returns:
            Local path to the downloaded file
        """
        token = await self.get_access_token()
        drive_id = await self._get_root_drive()
        
        # Build the download URL
        url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{self.root_folder}/{file_path}:/content"
        
        response = requests.get(url, headers=self._get_headers(token, None))
        
        if response.status_code != 200:
            logger.error(f"Failed to download file: {response.status_code} - {response.text}")
            raise Exception(f"Failed to download file: {response.status_code} - {response.text}")
        
        # Ensure parent directory exists
        destination_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Write the file
        with open(destination_path, "wb") as f:
            f.write(response.content)
        
        return destination_path
    
    async def get_file_url(self, file_path: str) -> str:
        """
        Get a URL for a file in OneDrive.
        
        Args:
            file_path: Path to the file in OneDrive (relative to root folder)
            
        Returns:
            URL for the file
        """
        token = await self.get_access_token()
        drive_id = await self._get_root_drive()
        
        # Build the URL
        url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{self.root_folder}/{file_path}"
        
        response = requests.get(url, headers=self._get_headers(token))
        
        if response.status_code != 200:
            logger.error(f"Failed to get file URL: {response.status_code} - {response.text}")
            raise Exception(f"Failed to get file URL: {response.status_code} - {response.text}")
        
        return response.json().get("webUrl", "")
    
    async def list_files(self, folder_path: str) -> List[Dict[str, Any]]:
        """
        List files in a folder.
        
        Args:
            folder_path: Path to the folder in OneDrive (relative to root folder)
            
        Returns:
            List of file metadata
        """
        token = await self.get_access_token()
        drive_id = await self._get_root_drive()
        
        # Build the URL
        path = f"{self.root_folder}/{folder_path}" if folder_path else self.root_folder
        url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{path}:/children"
        
        response = requests.get(url, headers=self._get_headers(token))
        
        if response.status_code != 200:
            logger.error(f"Failed to list files: {response.status_code} - {response.text}")
            raise Exception(f"Failed to list files: {response.status_code} - {response.text}")
        
        return response.json().get("value", [])
    
    async def delete_file(self, file_path: str) -> bool:
        """
        Delete a file from OneDrive.
        
        Args:
            file_path: Path to the file in OneDrive (relative to root folder)
            
        Returns:
            True if the file was deleted, False otherwise
        """
        token = await self.get_access_token()
        drive_id = await self._get_root_drive()
        
        # Build the URL
        url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{self.root_folder}/{file_path}"
        
        response = requests.delete(url, headers=self._get_headers(token))
        
        if response.status_code == 204:
            return True
        
        logger.error(f"Failed to delete file: {response.status_code} - {response.text}")
        return False
    
    async def create_folder(self, folder_path: str) -> str:
        """
        Create a folder in OneDrive.
        
        Args:
            folder_path: Path to the folder to create (relative to root folder)
            
        Returns:
            ID of the created folder
        """
        token = await self.get_access_token()
        drive_id = await self._get_root_drive()
        
        # Split the path into parts
        path_parts = folder_path.split('/')
        
        # Start with the root folder
        current_path = self.root_folder
        parent_id = None
        
        # Create each folder in the path
        for part in path_parts:
            if not part:
                continue
            
            current_path = f"{current_path}/{part}"
            
            # Check if the folder exists
            url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{current_path}"
            response = requests.get(url, headers=self._get_headers(token))
            
            if response.status_code == 200:
                # Folder exists, get its ID
                parent_id = response.json()["id"]
                continue
            
            # Folder doesn't exist, create it
            if parent_id:
                url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/items/{parent_id}/children"
            else:
                url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root/children"
            
            data = {
                "name": part,
                "folder": {},
                "@microsoft.graph.conflictBehavior": "rename"
            }
            
            response = requests.post(url, headers=self._get_headers(token), json=data)
            
            if response.status_code not in [201, 200]:
                logger.error(f"Failed to create folder: {response.status_code} - {response.text}")
                raise Exception(f"Failed to create folder: {response.status_code} - {response.text}")
            
            parent_id = response.json()["id"]
        
        return parent_id
    
    async def folder_exists(self, folder_path: str) -> bool:
        """
        Check if a folder exists in OneDrive.
        
        Args:
            folder_path: Path to the folder to check (relative to root folder)
            
        Returns:
            True if the folder exists, False otherwise
        """
        token = await self.get_access_token()
        drive_id = await self._get_root_drive()
        
        # Build the URL
        path = f"{self.root_folder}/{folder_path}" if folder_path else self.root_folder
        url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{path}"
        
        response = requests.get(url, headers=self._get_headers(token))
        
        return response.status_code == 200 