#!/usr/bin/env python3
"""
Standalone test script for OneDrive integration.
This script tests file operations without requiring FastAPI or other dependencies.
"""
import os
import json
import requests
import logging
from datetime import datetime, timedelta
from pathlib import Path
import base64
import tempfile
import mimetypes

from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.serialization import pkcs12
import jwt

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Load environment variables
TENANT_ID = "8fe97a37-6956-4bc2-8253-f97f816bc733"
CLIENT_ID = "4bc94816-f1d4-4cff-8bf7-e4efb061d662"
CERT_PATH = "/opt/projects/NexusBusinessBuilder/certificates/NexusBusinessAgent.pfx"
CERT_PASSWORD = "NexusAgent123"
ROOT_FOLDER = "NexusBusinessPlan"

class OneDriveTest:
    """Test class for OneDrive operations."""
    
    def __init__(self):
        self.tenant_id = TENANT_ID
        self.client_id = CLIENT_ID
        self.cert_path = CERT_PATH
        self.cert_password = CERT_PASSWORD
        self.root_folder = ROOT_FOLDER
        
        # Access token cache
        self._access_token = None
        self._token_expiry = datetime.now()
    
    def get_access_token(self):
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
    
    def _get_headers(self, token, content_type="application/json"):
        """Get the headers for a request."""
        headers = {
            "Authorization": f"Bearer {token}",
        }
        
        if content_type:
            headers["Content-Type"] = content_type
            
        return headers
    
    def get_root_drive(self):
        """Get the ID of the root drive."""
        token = self.get_access_token()
        
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
        
        print(f"Found {len(drives)} drives:")
        for drive in drives:
            print(f"  - {drive['name']} (ID: {drive['id']})")
        
        # Use the first document library found
        return drives[0]["id"]
    
    def ensure_root_folder_exists(self):
        """Ensure the root folder exists and return its ID."""
        token = self.get_access_token()
        drive_id = self.get_root_drive()
        
        # Check if the root folder exists
        url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{self.root_folder}"
        response = requests.get(url, headers=self._get_headers(token))
        
        if response.status_code == 200:
            # Folder exists, return its ID
            folder_id = response.json()["id"]
            print(f"Root folder '{self.root_folder}' already exists (ID: {folder_id})")
            return folder_id
        
        # Create the folder
        print(f"Creating root folder: {self.root_folder}")
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
        
        folder_id = response.json()["id"]
        print(f"Root folder created successfully (ID: {folder_id})")
        return folder_id
    
    def list_files(self, folder_path=""):
        """List files in a folder."""
        token = self.get_access_token()
        drive_id = self.get_root_drive()
        
        # Build the URL
        path = f"{self.root_folder}/{folder_path}" if folder_path else self.root_folder
        url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{path}:/children"
        
        response = requests.get(url, headers=self._get_headers(token))
        
        if response.status_code != 200:
            logger.error(f"Failed to list files: {response.status_code} - {response.text}")
            raise Exception(f"Failed to list files: {response.status_code} - {response.text}")
        
        files = response.json().get("value", [])
        
        print(f"Files in '{path}':")
        for file in files:
            file_type = "Folder" if "folder" in file else "File"
            print(f"  - {file['name']} ({file_type})")
        
        return files
    
    def create_test_file(self):
        """Create a test text file and upload it."""
        token = self.get_access_token()
        drive_id = self.get_root_drive()
        
        # Create a test file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".txt") as temp_file:
            test_content = f"This is a test file created on {datetime.now().isoformat()}"
            temp_file.write(test_content.encode('utf-8'))
            temp_path = temp_file.name
        
        # Upload the file
        filename = f"test_{datetime.now().strftime('%Y%m%d%H%M%S')}.txt"
        url = f"https://graph.microsoft.com/v1.0/drives/{drive_id}/root:/{self.root_folder}/{filename}:/content"
        
        headers = self._get_headers(token, "text/plain")
        
        print(f"Uploading test file: {filename}")
        response = requests.put(url, headers=headers, data=test_content.encode('utf-8'))
        
        os.unlink(temp_path)  # Clean up temp file
        
        if response.status_code not in [200, 201]:
            logger.error(f"Failed to upload file: {response.status_code} - {response.text}")
            raise Exception(f"Failed to upload file: {response.status_code} - {response.text}")
        
        file_data = response.json()
        file_url = file_data.get("webUrl", "")
        
        print(f"File uploaded successfully!")
        print(f"File URL: {file_url}")
        
        return filename, file_url
    
    def run_tests(self):
        """Run all tests."""
        print("=" * 80)
        print("TESTING ONEDRIVE INTEGRATION")
        print("=" * 80)
        
        print("\n1. Getting access token...")
        token = self.get_access_token()
        print(f"Access token obtained successfully!")
        
        print("\n2. Getting root drive...")
        drive_id = self.get_root_drive()
        print(f"Root drive ID: {drive_id}")
        
        print("\n3. Ensuring root folder exists...")
        folder_id = self.ensure_root_folder_exists()
        
        print("\n4. Listing files in root folder...")
        self.list_files()
        
        print("\n5. Creating test file...")
        filename, file_url = self.create_test_file()
        
        print("\n6. Listing files again to verify...")
        self.list_files()
        
        print("\n" + "=" * 80)
        print("ALL TESTS COMPLETED SUCCESSFULLY!")
        print("=" * 80)


if __name__ == "__main__":
    test = OneDriveTest()
    test.run_tests() 