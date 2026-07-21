import os
import sys
import argparse
import requests
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(env_path):
    load_dotenv(dotenv_path=env_path, override=True)

SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "postgres")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASS = os.getenv("DB_PASS", "")

def get_headers():
    return {
        "Authorization": f"Bearer {SERVICE_ROLE_KEY}",
        "apikey": SERVICE_ROLE_KEY,
        "Content-Type": "application/json",
    }

def get_supabase_user_id(email: str):
    resp = requests.get(
        f"{SUPABASE_URL}/auth/v1/admin/users",
        headers=get_headers(),
        params={"filter": email},
    )
    if resp.status_code == 200:
        data = resp.json()
        users = data.get("users", [])
        if users:
            return users[0].get("id")
    print(f"Could not find user {email} in Supabase Auth")
    return None

def create_supabase_user(email: str, password: str):
    resp = requests.post(
        f"{SUPABASE_URL}/auth/v1/admin/users",
        headers=get_headers(),
        json={"email": email, "password": password, "email_confirm": True},
    )
    if resp.status_code == 200:
        user_id = resp.json().get("id")
        print(f"Supabase Auth user created: {email} -> {user_id}")
        return user_id
    elif resp.status_code == 422:
        print(f"User {email} already exists in Supabase Auth. Updating password...")
        user_id = get_supabase_user_id(email)
        if user_id:
            update_resp = requests.put(
                f"{SUPABASE_URL}/auth/v1/admin/users/{user_id}",
                headers=get_headers(),
                json={"password": password},
            )
            if update_resp.status_code == 200:
                print(f"Password updated for {email}")
            else:
                print(f"Failed to update password: {update_resp.status_code} {update_resp.text}")
            return user_id
        return None
    else:
        print(f"Supabase API error: {resp.status_code} {resp.text}")
        return None

def insert_admin_record(supabase_user_id: str, role: str, action: str):
    import psycopg2
    conn = psycopg2.connect(
        host=DB_HOST, port=DB_PORT, database=DB_NAME,
        user=DB_USER, password=DB_PASS,
    )
    conn.autocommit = True
    with conn.cursor() as cursor:
        cursor.execute("SELECT id FROM admins WHERE supabase_user_id = %s;", (supabase_user_id,))
        existing = cursor.fetchone()
        if existing:
            print(f"Admin record already exists with id={existing[0]}")
            return existing[0]
        cursor.execute(
            "INSERT INTO admins (supabase_user_id, role, action) VALUES (%s, %s, %s) RETURNING id;",
            (supabase_user_id, role, action)
        )
        admin_id = cursor.fetchone()[0]
        print(f"Admin record created: id={admin_id}, role={role}, action={action}")
        return admin_id
    conn.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Create/update an admin in Supabase Auth + admins table")
    parser.add_argument("email", help="Admin email address")
    parser.add_argument("password", help="Admin password")
    parser.add_argument("--role", default="SUPER_ADMIN")
    parser.add_argument("--action", default="Read_Write")
    args = parser.parse_args()

    user_id = create_supabase_user(args.email, args.password)
    if not user_id:
        sys.exit(1)

    admin_id = insert_admin_record(user_id, args.role, args.action)
    if not admin_id:
        sys.exit(1)

    print(f"\nYou can now log in with:")
    print(f"  Email:    {args.email}")
    print(f"  Password: {args.password}")
