import os
import requests
from dotenv import load_dotenv

# Load env file in case of standalone execution (e.g. migration script)
env_path = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(env_path):
    load_dotenv(dotenv_path=env_path, override=True)
else:
    load_dotenv(override=True)

SUPABASE_URL = os.getenv("SUPABASE_URL")
if SUPABASE_URL:
    SUPABASE_URL = SUPABASE_URL.strip().rstrip("/")
    if SUPABASE_URL.endswith("/rest/v1"):
        SUPABASE_URL = SUPABASE_URL[:-8].rstrip("/")

SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
BUCKET_NAME = "grievance-attachments"


def init_bucket():
    """Checks if the bucket exists. If not, creates it as private."""
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        print("Warning: Supabase Storage environment variables are not set. Skipping bucket initialization.")
        return
        
    url = f"{SUPABASE_URL}/storage/v1/bucket/{BUCKET_NAME}"
    headers = {
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "apikey": SUPABASE_SERVICE_ROLE_KEY
    }
    try:
        res = requests.get(url, headers=headers)
        is_not_found = (res.status_code == 404) or (res.status_code == 400 and "Bucket not found" in res.text)
        if res.status_code == 200:
            print(f"Supabase Storage bucket '{BUCKET_NAME}' already exists.")
            return
        elif is_not_found:
            print(f"Supabase Storage bucket '{BUCKET_NAME}' does not exist. Creating...")
            create_url = f"{SUPABASE_URL}/storage/v1/bucket"
            create_res = requests.post(
                create_url,
                headers=headers,
                json={"id": BUCKET_NAME, "name": BUCKET_NAME, "public": False}
            )
            if create_res.status_code == 200:
                print(f"Supabase Storage bucket '{BUCKET_NAME}' created successfully.")
            else:
                print(f"Failed to create bucket: {create_res.status_code} - {create_res.text}")
        else:
            print(f"Unexpected response checking bucket: {res.status_code} - {res.text}")
    except Exception as e:
        print(f"Error checking/creating bucket: {e}")

def upload_file(file_data: bytes, filename: str, content_type: str) -> str:
    """Uploads a file to Supabase Storage and returns its permanent private URL."""
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        raise Exception("Supabase Storage environment variables are not set.")

    url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET_NAME}/{filename}"
    headers = {
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Content-Type": content_type
    }
    
    # We use requests to send binary file data directly
    res = requests.post(url, headers=headers, data=file_data)
    if res.status_code not in [200, 201]:
        raise Exception(f"Supabase Storage upload failed: {res.status_code} - {res.text}")
        
    # Return the permanent private URL format
    return f"{SUPABASE_URL}/storage/v1/object/authenticated/{BUCKET_NAME}/{filename}"

def get_signed_url(file_url: str, expires_in: int = 7200) -> str:
    """Generates a temporary signed URL for viewing a private storage file."""
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        return file_url
        
    if f"/{BUCKET_NAME}/" not in file_url:
        # Not a Supabase storage URL (maybe local path/URL from old records)
        return file_url

    # Extract the file path relative to the bucket
    # Handles both authenticated/unauthenticated URL formats
    file_url_clean = file_url.split("?")[0]
    path = file_url_clean.split(f"/{BUCKET_NAME}/")[-1]

    url = f"{SUPABASE_URL}/storage/v1/object/sign/{BUCKET_NAME}/{path}"
    headers = {
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Content-Type": "application/json"
    }
    
    try:
        res = requests.post(url, headers=headers, json={"expiresIn": expires_in})
        if res.status_code == 200:
            signed_url = res.json().get("signedURL") or res.json().get("signedUrl")
            if signed_url:
                if signed_url.startswith("/"):
                    if not signed_url.startswith("/storage/v1/"):
                        signed_url = f"/storage/v1{signed_url}"
                    return f"{SUPABASE_URL}{signed_url}"
                else:
                    if f"{SUPABASE_URL}/object/" in signed_url:
                        signed_url = signed_url.replace(f"{SUPABASE_URL}/object/", f"{SUPABASE_URL}/storage/v1/object/")
                return signed_url
    except Exception as e:
        print(f"Error signing URL for {file_url}: {e}")
        
    return file_url

def get_private_url(signed_url: str) -> str:
    """Converts a signed URL (or any URL) back to the permanent private URL format."""
    if not SUPABASE_URL:
        return signed_url
    if f"/{BUCKET_NAME}/" not in signed_url:
        return signed_url
    # Strip query parameters
    url_clean = signed_url.split("?")[0]
    # Replace '/sign/' with '/' if it was a signed URL
    if "/object/sign/" in url_clean:
        url_clean = url_clean.replace("/object/sign/", "/object/")
    # Ensure it has the authenticated structure or standard object structure
    if "/object/authenticated/" not in url_clean:
        url_clean = url_clean.replace(f"/object/{BUCKET_NAME}/", f"/object/authenticated/{BUCKET_NAME}/")
    return url_clean

