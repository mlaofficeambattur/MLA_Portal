import os
from dotenv import load_dotenv
load_dotenv()
import requests

SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
headers = {"Authorization": f"Bearer {SERVICE_ROLE_KEY}", "apikey": SERVICE_ROLE_KEY}

print("=== Supabase Auth Users ===")
resp = requests.get(f"{SUPABASE_URL}/auth/v1/admin/users", headers=headers)
if resp.status_code == 200:
    users = resp.json().get("users", [])
    print(f"Total: {len(users)}")
    for u in users:
        print(f"  {u.get('email')}  (id: {u.get('id')})")
else:
    print(f"Error: {resp.status_code} {resp.text}")

print()

print("=== Local Admins Table ===")
import psycopg2
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")
conn = psycopg2.connect(host=DB_HOST, port=DB_PORT, database=DB_NAME, user=DB_USER, password=DB_PASS)
with conn.cursor() as cur:
    cur.execute("SELECT a.id, a.supabase_user_id, a.role, a.action FROM admins a ORDER BY a.id")
    admins = cur.fetchall()
    print(f"Total: {len(admins)}")
    for a in admins:
        print(f"  id={a[0]}  role={a[2]}  action={a[3]}  supabase_user_id={a[1]}")
conn.close()
