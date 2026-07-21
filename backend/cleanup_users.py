import os
from dotenv import load_dotenv
load_dotenv()
import requests
import psycopg2

SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
headers = {"Authorization": f"Bearer {SERVICE_ROLE_KEY}", "apikey": SERVICE_ROLE_KEY}

KEEP_EMAILS = {
    "staff@gmail.com",
    "wardmember@gmail.com",
    "counselor@gmail.com",
    "mlaofficeambattur@gmail.com",
}

DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")

conn = psycopg2.connect(host=DB_HOST, port=DB_PORT, database=DB_NAME, user=DB_USER, password=DB_PASS)

resp = requests.get(f"{SUPABASE_URL}/auth/v1/admin/users", headers=headers)
if resp.status_code != 200:
    print(f"Error fetching users: {resp.status_code} {resp.text}")
    exit(1)

users = resp.json().get("users", [])
deleted_count = 0
for u in users:
    email = u.get("email")
    uid = u.get("id")
    if email not in KEEP_EMAILS:
        print(f"Deleting {email} ({uid})...")
        del_resp = requests.delete(f"{SUPABASE_URL}/auth/v1/admin/users/{uid}", headers=headers)
        if del_resp.status_code in (200, 204):
            print(f"  Deleted from Supabase Auth")
            deleted_count += 1
        else:
            print(f"  Failed: {del_resp.status_code} {del_resp.text}")

        # Also remove from local admins table if linked
        with conn.cursor() as cur:
            cur.execute("DELETE FROM admins WHERE supabase_user_id = %s", (uid,))
            if cur.rowcount > 0:
                print(f"  Removed {cur.rowcount} record(s) from admins table")
        conn.commit()

print(f"\nDone. {deleted_count} users deleted.")

# Show remaining users
resp2 = requests.get(f"{SUPABASE_URL}/auth/v1/admin/users", headers=headers)
remaining = resp2.json().get("users", [])
print(f"\nRemaining Supabase Auth users ({len(remaining)}):")
for u in remaining:
    print(f"  {u.get('email')}")

conn.close()
