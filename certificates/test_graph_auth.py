import os
import requests
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.hazmat.primitives.serialization import pkcs12
import datetime
import jwt
import base64

# Replace these values with your own
TENANT_ID = "8fe97a37-6956-4bc2-8253-f97f816bc733"  # Directory ID
CLIENT_ID = "4bc94816-f1d4-4cff-8bf7-e4efb061d662"  # Application ID

# Certificate path
CERT_PATH = "/opt/projects/NexusBusinessBuilder/certificates/NexusBusinessAgent.pfx"
CERT_PASSWORD = "NexusAgent123"

def get_token():
    # Load the PFX file
    with open(CERT_PATH, "rb") as f:
        pfx_data = f.read()
    
    # Extract private key
    private_key, certificate, _ = pkcs12.load_key_and_certificates(
        pfx_data, 
        CERT_PASSWORD.encode('utf-8')
    )
    
    # JWT header
    header = {
        "alg": "RS256",
        "typ": "JWT",
        "x5t": base64.b64encode(certificate.fingerprint(hashes.SHA1())).decode('utf-8')
    }
    
    # Calculate expiration time (1 hour from now)
    now = datetime.datetime.utcnow()
    exp = now + datetime.timedelta(hours=1)
    
    # JWT payload
    payload = {
        "aud": f"https://login.microsoftonline.com/{TENANT_ID}/oauth2/v2.0/token",
        "iss": CLIENT_ID,
        "sub": CLIENT_ID,
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
    token_url = f"https://login.microsoftonline.com/{TENANT_ID}/oauth2/v2.0/token"
    token_data = {
        "grant_type": "client_credentials",
        "client_id": CLIENT_ID,
        "client_assertion_type": "urn:ietf:params:oauth:client-assertion-type:jwt-bearer",
        "client_assertion": token,
        "scope": "https://graph.microsoft.com/.default"
    }
    
    response = requests.post(token_url, data=token_data)
    
    if response.status_code == 200:
        return response.json()["access_token"]
    else:
        print(f"Error: {response.status_code}")
        print(response.text)
        return None

def test_graph_api():
    token = get_token()
    if not token:
        print("Failed to obtain token")
        return
    
    print("✅ Authentication successful! Token obtained.")
    
    # Test a simple Graph API call
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # List users (requires User.Read.All permission)
    print("\nTesting access to Users...")
    response = requests.get(
        "https://graph.microsoft.com/v1.0/users?$top=5",
        headers=headers
    )
    
    if response.status_code == 200:
        print("✅ Users access successful!")
        users_data = response.json().get('value', [])
        print(f"Found {len(users_data)} users")
        for user in users_data[:3]:  # Show only first 3 users
            print(f"- {user.get('displayName')} ({user.get('userPrincipalName')})")
    else:
        print(f"❌ Users access failed: {response.status_code}")
        print(response.text)
    
    # List drives for a specific site collection (requires Sites.Read.All or Sites.ReadWrite.All)
    print("\nTesting access to SharePoint site drives...")
    response = requests.get(
        "https://graph.microsoft.com/v1.0/sites/root/drives",
        headers=headers
    )
    
    if response.status_code == 200:
        print("✅ SharePoint drives access successful!")
        drives_data = response.json().get('value', [])
        if drives_data:
            print(f"Found {len(drives_data)} drives")
            for drive in drives_data[:3]:  # Show only first 3 drives
                print(f"- {drive.get('name')} (ID: {drive.get('id')})")
        else:
            print("No drives found")
    else:
        print(f"❌ SharePoint drives access failed: {response.status_code}")
        print(response.text)
    
    # Test application permission to read all users' drives
    print("\nTesting access to all OneDrive instances...")
    response = requests.get(
        "https://graph.microsoft.com/v1.0/drives",
        headers=headers
    )
    
    if response.status_code == 200:
        print("✅ All drives access successful!")
        drives_data = response.json().get('value', [])
        print(f"Found {len(drives_data)} drives")
        for drive in drives_data[:3]:  # Show only first 3 drives
            print(f"- {drive.get('name')} (Owner: {drive.get('owner', {}).get('user', {}).get('displayName')})")
    else:
        print(f"❌ All drives access failed: {response.status_code}")
        print(response.text)
        
    # Test specific SharePoint site by ID (if you want to test this, replace SITE_ID with a real SharePoint site ID)
    print("\nTesting access with test file creation...")
    
    # Create small JSON content for testing
    test_content = {
        "name": "test_file.txt",
        "description": "Created by NexusBusinessAgent for testing",
        "fileSize": 123
    }
    
    # Try to write to the test folder
    test_item = {
        "name": "NexusBusinessAgentTest",
        "folder": {},
        "@microsoft.graph.conflictBehavior": "replace"
    }
    
    # Try to create a test folder in the root document library
    print("\nTrying to create a test folder...")
    response = requests.post(
        "https://graph.microsoft.com/v1.0/sites/root/drive/root/children",
        headers=headers,
        json=test_item
    )
    
    if response.status_code in [201, 200]:
        print("✅ Test folder creation successful!")
        folder_data = response.json()
        folder_id = folder_data.get('id')
        print(f"Folder ID: {folder_id}")
        print(f"Folder webURL: {folder_data.get('webUrl')}")
        
        # Try to create a test file in the new folder
        file_content = "This is a test file created by NexusBusinessAgent on " + datetime.datetime.now().isoformat()
        file_data = {
            "name": "test_file.txt",
            "file": {},
            "@microsoft.graph.conflictBehavior": "replace"
        }
        
        print("\nTrying to create a test file...")
        upload_url = f"https://graph.microsoft.com/v1.0/sites/root/drive/items/{folder_id}/children"
        response = requests.post(
            upload_url,
            headers=headers,
            json=file_data
        )
        
        if response.status_code in [201, 200]:
            print("✅ File metadata creation successful!")
            file_data = response.json()
            file_id = file_data.get('id')
            
            # Upload content to the file
            upload_url = f"https://graph.microsoft.com/v1.0/sites/root/drive/items/{file_id}/content"
            content_headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "text/plain"
            }
            response = requests.put(
                upload_url,
                headers=content_headers,
                data=file_content
            )
            
            if response.status_code in [201, 200]:
                print("✅ File content upload successful!")
                print(f"File URL: {response.json().get('webUrl')}")
            else:
                print(f"❌ File content upload failed: {response.status_code}")
                print(response.text)
        else:
            print(f"❌ File metadata creation failed: {response.status_code}")
            print(response.text)
    else:
        print(f"❌ Test folder creation failed: {response.status_code}")
        print(response.text)

if __name__ == "__main__":
    test_graph_api() 