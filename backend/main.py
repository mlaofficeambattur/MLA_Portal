import sys
import os
import uuid
import csv
import ssl
import requests as _orig_requests
from requests.adapters import HTTPAdapter

class _SupabaseSSLAdapter(HTTPAdapter):
    def init_poolmanager(self, *args, **kwargs):
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        kwargs['ssl_context'] = ctx
        return super().init_poolmanager(*args, **kwargs)

_http = _orig_requests.Session()
_http.mount('https://', _SupabaseSSLAdapter())

requests = _http

from io import StringIO
sys.path.append(os.path.dirname(os.path.abspath(__file__)))


from datetime import datetime, date, time, timedelta
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, Field

# Local modules
import db
import supabase_storage
import notifications
import namma_mla_analytics

class NammaMlaImportRequest(BaseModel):
    filename: str
    rows: List[dict]



# JWT Authentication Config
SECRET_KEY = os.getenv("JWT_SECRET", "super-secret-key-for-mla-appointment-booking")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 240

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/admin/login")

app = FastAPI(title="MLA Appointment Booking & Grievance System API")


# Enable CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------
# Pydantic Schemas
# -----------------

class Token(BaseModel):
    access_token: str
    token_type: str
    role: Optional[str] = None

class LoginRequest(BaseModel):
    username: str
    password: str

class AvailabilityCreate(BaseModel):
    available_date: date
    start_time: str # "HH:MM"
    end_time: str # "HH:MM"
    slot_duration: int = Field(..., ge=1, le=1440) # duration in minutes

class CitizenCreate(BaseModel):
    full_name: str
    mobile_number: str
    address: str
    email: Optional[str] = None

class AppointmentBookRequest(BaseModel):
    slot_id: int
    citizen: CitizenCreate
    purpose: str
    # Optional Fields
    aadhaar_number: Optional[str] = None
    ward_number: Optional[str] = None
    grievance_category: Optional[str] = None

class AppointmentStatusUpdate(BaseModel):
    status: str # 'PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW', 'RESCHEDULED'
    new_slot_id: Optional[int] = None # For rescheduling

class GrievanceAttachmentSchema(BaseModel):
    file_type: str # 'IMAGE', 'VIDEO', 'DOCUMENT'
    file_url: str

class GrievanceSubmitRequest(BaseModel):
    citizen: CitizenCreate
    constituency: str = "Ambattur"
    ward_number: str
    category: str
    description: str
    attachments: List[GrievanceAttachmentSchema] = []
    appointment_id: Optional[int] = None

class GrievanceStatusUpdate(BaseModel):
    status: str # 'PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'
    remarks: str

class NewsCreate(BaseModel):
    headline: str
    description: str
    category: str
    date: str

class NewsUpdate(BaseModel):
    headline: str
    description: str
    category: str
    date: str
    is_active: bool

# -----------------
# Auth Helpers
# -----------------

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_admin(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials with Auth provider",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception
    
    import requests
    url = f"{supabase_storage.SUPABASE_URL}/auth/v1/user"
    headers = {
        "Authorization": f"Bearer {token}",
        "apikey": supabase_storage.SUPABASE_SERVICE_ROLE_KEY
    }
    try:
        res = requests.get(url, headers=headers, timeout=5)
        if res.status_code != 200:
            raise credentials_exception
        user_info = res.json()
    except Exception as e:
        print(f"Error validating token with Supabase: {e}")
        raise credentials_exception

    supabase_user_id = user_info.get("id")
    email = user_info.get("email")
    
    if not supabase_user_id or not email:
        raise credentials_exception

    # Verify or auto-provision in database
    with db.get_db_cursor() as cursor:
        cursor.execute("SELECT id, role, designation, ward, action FROM admins WHERE supabase_user_id = %s;", (supabase_user_id,))
        admin = cursor.fetchone()
        
        if admin is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: You do not have portal privileges. Contact the MLA office to get registered."
            )
                
        return {"id": admin[0], "supabase_user_id": supabase_user_id, "role": admin[1], "designation": admin[2], "ward": admin[3], "action": admin[4], "email": email}


VALID_ROLES = {"SUPER_ADMIN", "OFFICE_STAFF", "ML", "WARD_MEMBER", "COUNSELOR", "MLA_ASSISTANT", "READ_ONLY"}

def require_role(*allowed_roles):
    """Dependency factory that checks if the current user has one of the allowed roles."""
    async def role_checker(current_user: dict = Depends(get_current_admin)):
        if current_user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role(s): {', '.join(allowed_roles)}"
            )
        return current_user
    return role_checker

def require_write(current_user: dict = Depends(get_current_admin)):
    """Dependency that checks if the current user has write permission (action != 'Read').
    SUPER_ADMIN role bypasses this check."""
    if current_user["role"] != "SUPER_ADMIN" and current_user.get("action") == "Read":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Your account has read-only access."
        )
    return current_user

# -----------------
# API Endpoints
# -----------------

@app.on_event("startup")
def startup_event():
    db.init_db_pool()
    db.initialize_database_schema()
    supabase_storage.init_bucket()
    try:
        with db.get_db_cursor() as cursor:
            db.cleanup_expired_records(cursor)
    except Exception as e:
        print(f"Error executing startup data cleanup: {e}")


# --- ADMIN AUTHENTICATION ---

@app.post("/api/admin/login", response_model=Token)
def admin_login(form_data: OAuth2PasswordRequestForm = Depends()):
    import requests
    url = f"{supabase_storage.SUPABASE_URL}/auth/v1/token?grant_type=password"
    headers = {
        "Content-Type": "application/json",
        "apikey": supabase_storage.SUPABASE_SERVICE_ROLE_KEY
    }
    payload = {
        "email": form_data.username,
        "password": form_data.password
    }
    try:
        res = requests.post(url, headers=headers, json=payload, timeout=10)
        if res.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        data = res.json()
        access_token = data.get("access_token")
        
        user_info = data.get("user", {})
        supabase_user_id = user_info.get("id")
        email = user_info.get("email")
        
        if not supabase_user_id or not email:
            raise HTTPException(status_code=401, detail="Invalid token from Supabase")
            
        with db.get_db_cursor() as cursor:
            cursor.execute("SELECT id, role, action FROM admins WHERE supabase_user_id = %s;", (supabase_user_id,))
            admin = cursor.fetchone()
            if admin is None:
                if email == "mlaofficeambattur@gmail.com":
                    cursor.execute(
                        "INSERT INTO admins (supabase_user_id, role, action) VALUES (%s, %s, %s) RETURNING id, role, action;",
                        (supabase_user_id, "SUPER_ADMIN", "Read_Write")
                    )
                    admin = cursor.fetchone()
                    print(f"Auto-provisioned SUPER_ADMIN for {email}")
                else:
                    raise HTTPException(status_code=403, detail="Access denied: You do not have portal privileges. Contact the MLA office to get registered.")
                    
        return {"access_token": access_token, "token_type": "bearer", "role": admin[1] if admin else "SUPER_ADMIN", "action": admin[2] if admin else "Read_Write"}
    except HTTPException as he:
        raise he
    except requests.exceptions.ConnectionError as e:
        print(f"Login connection error: {e}")
        raise HTTPException(status_code=503, detail="Authentication service is temporarily unreachable. Please check your internet connection and try again.")
    except Exception as e:
        print(f"Login proxy error: {e}")
        raise HTTPException(status_code=500, detail="Authentication service error. Please try again later.")

# Alternative JSON body login endpoint for client convenience
@app.post("/api/admin/login-json", response_model=Token)
def admin_login_json(req: LoginRequest):
    import requests
    url = f"{supabase_storage.SUPABASE_URL}/auth/v1/token?grant_type=password"
    headers = {
        "Content-Type": "application/json",
        "apikey": supabase_storage.SUPABASE_SERVICE_ROLE_KEY
    }
    payload = {
        "email": req.username,
        "password": req.password
    }
    try:
        res = requests.post(url, headers=headers, json=payload, timeout=10)
        if res.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        data = res.json()
        access_token = data.get("access_token")
        
        user_info = data.get("user", {})
        supabase_user_id = user_info.get("id")
        email = user_info.get("email")
        
        if not supabase_user_id or not email:
            raise HTTPException(status_code=401, detail="Invalid token from Supabase")
        
        with db.get_db_cursor() as cursor:
            cursor.execute("SELECT id, role, action FROM admins WHERE supabase_user_id = %s;", (supabase_user_id,))
            admin = cursor.fetchone()
            if admin is None:
                if email == "mlaofficeambattur@gmail.com":
                    cursor.execute(
                        "INSERT INTO admins (supabase_user_id, role, action) VALUES (%s, %s, %s) RETURNING id, role, action;",
                        (supabase_user_id, "SUPER_ADMIN", "Read_Write")
                    )
                    admin = cursor.fetchone()
                    print(f"Auto-provisioned SUPER_ADMIN for {email}")
                else:
                    raise HTTPException(status_code=403, detail="Access denied: You do not have portal privileges. Contact the MLA office to get registered.")
        return {"access_token": access_token, "token_type": "bearer", "role": admin[1], "action": admin[2]}
    except HTTPException as he:
        raise he
    except requests.exceptions.ConnectionError as e:
        print(f"Login connection error: {e}")
        raise HTTPException(status_code=503, detail="Authentication service is temporarily unreachable. Please check your internet connection and try again.")
    except Exception as e:
        print(f"Login proxy error: {e}")
        raise HTTPException(status_code=500, detail="Authentication service error. Please try again later.")

@app.post("/api/admin/logout")
def admin_logout(token: str = Depends(oauth2_scheme), current_admin: dict = Depends(get_current_admin)):
    url = f"{supabase_storage.SUPABASE_URL}/auth/v1/logout"
    headers = {
        "Authorization": f"Bearer {token}",
        "apikey": supabase_storage.SUPABASE_SERVICE_ROLE_KEY
    }
    try:
        requests.post(url, headers=headers, timeout=5)
    except Exception as e:
        print(f"Logout proxy warning: {e}")
    return {"message": "Logged out successfully"}

class ForgotPasswordRequest(BaseModel):
    email: str

@app.post("/api/admin/forgot-password")
def forgot_password(req: ForgotPasswordRequest):
    """Requests a password recovery email from Supabase Auth."""
    import requests
    url = f"{supabase_storage.SUPABASE_URL}/auth/v1/recover"
    headers = {
        "Content-Type": "application/json",
        "apikey": supabase_storage.SUPABASE_SERVICE_ROLE_KEY
    }
    payload = {
        "email": req.email
    }
    try:
        res = requests.post(url, headers=headers, json=payload, timeout=10)
        if res.status_code != 200:
            data = res.json()
            error_msg = data.get("error_description") or data.get("msg") or "Failed to request password recovery."
            raise HTTPException(status_code=400, detail=error_msg)
            
        return {"success": True, "message": "Password recovery email sent successfully. Please check your inbox."}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Forgot password proxy error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error connecting to Auth provider")

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str

@app.get("/api/admin/me")
def get_admin_profile(current_admin: dict = Depends(get_current_admin)):
    """Retrieves current admin email, role, designation, and ward."""
    return {
        "email": current_admin.get("email"),
        "role": current_admin.get("role"),
        "designation": current_admin.get("designation"),
        "ward": current_admin.get("ward"),
        "action": current_admin.get("action"),
        "id": current_admin.get("id")
    }

@app.post("/api/admin/change-password", dependencies=[Depends(require_write)])
def change_admin_password(
    req: ChangePasswordRequest,
    token: str = Depends(oauth2_scheme),
    current_admin: dict = Depends(require_role("SUPER_ADMIN"))
):
    """Verifies old password via login, then updates to new password in Supabase Auth."""
    import requests
    # 1. Verify old password by attempting a login proxy
    login_url = f"{supabase_storage.SUPABASE_URL}/auth/v1/token?grant_type=password"
    login_headers = {
        "Content-Type": "application/json",
        "apikey": supabase_storage.SUPABASE_SERVICE_ROLE_KEY
    }
    login_payload = {
        "email": current_admin["email"],
        "password": req.old_password
    }
    try:
        res_login = requests.post(login_url, headers=login_headers, json=login_payload)
        if res_login.status_code != 200:
            raise HTTPException(status_code=400, detail="Incorrect current password")
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to verify old password: {str(e)}")
        
    # 2. Update to new password
    update_url = f"{supabase_storage.SUPABASE_URL}/auth/v1/user"
    update_headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}",
        "apikey": supabase_storage.SUPABASE_SERVICE_ROLE_KEY
    }
    update_payload = {
        "password": req.new_password
    }
    try:
        res_update = requests.put(update_url, headers=update_headers, json=update_payload)
        if res_update.status_code != 200:
            detail_msg = "Failed to update password in Auth provider"
            try:
                detail_msg = res_update.json().get("msg") or res_update.json().get("error_description") or detail_msg
            except Exception:
                pass
            raise HTTPException(status_code=400, detail=detail_msg)
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to communicate with Auth provider: {str(e)}")
        
    return {"success": True, "message": "Password updated successfully!"}

class ResetPasswordRequest(BaseModel):
    new_password: str

@app.post("/api/admin/reset-password")
def reset_admin_password(
    req: ResetPasswordRequest,
    token: str = Depends(oauth2_scheme),
    current_admin: dict = Depends(get_current_admin)
):
    """Updates the password for the current authenticated admin (used in forgot password flow)."""
    import requests
    update_url = f"{supabase_storage.SUPABASE_URL}/auth/v1/user"
    update_headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}",
        "apikey": supabase_storage.SUPABASE_SERVICE_ROLE_KEY
    }
    update_payload = {
        "password": req.new_password
    }
    try:
        res_update = requests.put(update_url, headers=update_headers, json=update_payload)
        if res_update.status_code != 200:
            detail_msg = "Failed to update password in Auth provider"
            try:
                detail_msg = res_update.json().get("msg") or res_update.json().get("error_description") or detail_msg
            except Exception:
                pass
            raise HTTPException(status_code=400, detail=detail_msg)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to communicate with Auth provider: {str(e)}")
        
    return {"success": True, "message": "Password reset successfully!"}

class CreateStaffRequest(BaseModel):
    email: str
    password: str
    role: str
    ward: Optional[str] = None
    action: Optional[str] = 'Read'

@app.post("/api/admin/create-staff", dependencies=[Depends(require_write)])
def create_staff(
    req: CreateStaffRequest,
    current_admin: dict = Depends(require_role("SUPER_ADMIN"))
):
    import requests



    url = f"{supabase_storage.SUPABASE_URL}/auth/v1/admin/users"
    headers = {
        "apikey": supabase_storage.SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {supabase_storage.SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json"
    }
    payload = {"email": req.email, "password": req.password, "email_confirm": True}

    res = requests.post(url, headers=headers, json=payload, timeout=10)

    if res.status_code == 422:
        error_data = res.json()
        if error_data.get("error_code") == "email_exists":
            list_res = requests.get(
                f"{supabase_storage.SUPABASE_URL}/auth/v1/admin/users?email={req.email}",
                headers=headers
            )
            users_data = list_res.json().get("users", [])
            if not users_data:
                raise HTTPException(status_code=500, detail="User exists in Auth but could not retrieve ID.")
            supabase_user_id = users_data[0]["id"]
        else:
            raise HTTPException(status_code=400, detail=error_data.get("msg", "Failed to create user in Auth"))
    elif res.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to create user in Auth provider")
    else:
        supabase_user_id = res.json().get("id")

    with db.get_db_cursor() as cursor:
        cursor.execute("SELECT id FROM admins WHERE supabase_user_id = %s;", (supabase_user_id,))
        existing = cursor.fetchone()
        if existing:
            return {"success": True, "message": f"Staff with email {req.email} already exists in the portal."}

        cursor.execute("SELECT id FROM admins WHERE role = %s;", (req.role,))
        if cursor.fetchone():
            return {"success": True, "message": f"Staff with role '{req.role}' already exists."}

        auto_write_roles = {"COUNSELOR", "WARD_MEMBER", "SUPER_ADMIN"}
        resolved_action = "Read_Write" if req.role.upper() in auto_write_roles else req.action
        cursor.execute(
            "INSERT INTO admins (supabase_user_id, role, ward, action) VALUES (%s, %s, %s, %s) RETURNING id;",
            (supabase_user_id, req.role, req.ward, resolved_action)
        )
        admin_id = cursor.fetchone()[0]

    return {
        "success": True,
        "message": f"Staff created successfully with role {req.role}.",
        "admin_id": admin_id,
        "email": req.email
    }

@app.get("/api/admin/staff-list")
def list_staff(current_admin: dict = Depends(require_role("SUPER_ADMIN"))):
    with db.get_db_cursor() as cursor:
        cursor.execute("SELECT id, supabase_user_id, role, ward, action, created_at FROM admins ORDER BY created_at DESC;")
        staff = cursor.fetchall()
    return [
        {
            "id": s[0],
            "supabase_user_id": str(s[1]),
            "role": s[2],
            "ward": s[3],
            "action": s[4],
            "created_at": s[5].isoformat() if s[5] else None
        }
        for s in staff
    ]

class UpdateStaffRequest(BaseModel):
    role: Optional[str] = None
    ward: Optional[str] = None
    action: Optional[str] = None

@app.patch("/api/admin/staff/{staff_id}")
def update_staff(staff_id: int, req: UpdateStaffRequest, current_admin: dict = Depends(require_role("SUPER_ADMIN"))):
    updates = {}
    if req.role is not None:
        updates["role"] = req.role
    updates["ward"] = req.ward
    if req.action is not None:
        updates["action"] = req.action

    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    set_clause = ", ".join(f"{k} = %s" for k in updates)
    values = list(updates.values()) + [staff_id]

    with db.get_db_cursor() as cursor:
        cursor.execute(f"UPDATE admins SET {set_clause} WHERE id = %s RETURNING id, role, ward;", values)
        updated = cursor.fetchone()
        if not updated:
            raise HTTPException(status_code=404, detail="Staff not found")

    return {"id": updated[0], "role": updated[1], "ward": updated[2]}

@app.delete("/api/admin/staff/{staff_id}", dependencies=[Depends(require_write)])
def delete_staff(staff_id: int, current_admin: dict = Depends(require_role("SUPER_ADMIN"))):
    with db.get_db_cursor() as cursor:
        cursor.execute("SELECT supabase_user_id FROM admins WHERE id = %s;", (staff_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Staff not found")
        supabase_user_id = row[0]

        if supabase_user_id:
            url = f"{supabase_storage.SUPABASE_URL}/auth/v1/admin/users/{supabase_user_id}"
            headers = {
                "Authorization": f"Bearer {supabase_storage.SUPABASE_SERVICE_ROLE_KEY}",
                "apikey": supabase_storage.SUPABASE_SERVICE_ROLE_KEY,
            }
            try:
                res = requests.delete(url, headers=headers, timeout=5)
                if res.status_code not in (200, 204):
                    print(f"Warning: Failed to delete Supabase Auth user {supabase_user_id}: {res.status_code} {res.text}")
            except Exception as e:
                print(f"Warning: Error deleting Supabase Auth user: {e}")

        cursor.execute("DELETE FROM admins WHERE id = %s RETURNING id;", (staff_id,))
        cursor.fetchone()
    return {"success": True, "message": "Staff and associated login account deleted successfully."}

class ResetStaffPasswordRequest(BaseModel):
    new_password: str

@app.post("/api/admin/staff/{staff_id}/reset-password", dependencies=[Depends(require_write)])
def reset_staff_password(
    staff_id: int,
    req: ResetStaffPasswordRequest,
    current_admin: dict = Depends(require_role("SUPER_ADMIN"))
):
    """Allows SUPER_ADMIN to reset any staff member's password directly (for forgot password scenarios)."""
    import requests

    # 1. Look up the staff member's supabase_user_id
    with db.get_db_cursor() as cursor:
        cursor.execute("SELECT supabase_user_id FROM admins WHERE id = %s;", (staff_id,))
        staff = cursor.fetchone()
        if not staff:
            raise HTTPException(status_code=404, detail="Staff not found")
        supabase_user_id = staff[0]

    if not supabase_user_id:
        raise HTTPException(status_code=400, detail="Staff member has no Auth user linked. Contact support.")

    # 2. Update password via Supabase Admin API
    url = f"{supabase_storage.SUPABASE_URL}/auth/v1/admin/users/{supabase_user_id}"
    headers = {
        "apikey": supabase_storage.SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {supabase_storage.SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json"
    }
    payload = {"password": req.new_password}

    try:
        res = requests.put(url, headers=headers, json=payload, timeout=10)
        if res.status_code != 200:
            detail_msg = "Failed to update password in Auth provider"
            try:
                detail_msg = res.json().get("msg") or res.json().get("error_description") or detail_msg
            except Exception:
                pass
            raise HTTPException(status_code=400, detail=detail_msg)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to communicate with Auth provider: {str(e)}")

    return {"success": True, "message": "Password reset successfully for staff member."}

# --- PUBLIC SLOTS APIS ---


@app.get("/api/slots/dates")
def get_available_dates():
    """Fetches all future dates that have available slots."""
    today = date.today()
    with db.get_db_cursor() as cursor:
        db.cleanup_expired_records(cursor)
        cursor.execute(
            """
            SELECT DISTINCT s.slot_start::date 
            FROM slots s 
            WHERE s.slot_start >= %s AND s.status = 'AVAILABLE'
            ORDER BY s.slot_start::date;
            """,
            (today,)
        )
        dates = [row[0].strftime("%Y-%m-%d") for row in cursor.fetchall()]
    return {"dates": dates}

@app.get("/api/slots/{date_str}")
def get_slots_by_date(date_str: str):
    """Fetches all slots for a specific date (YYYY-MM-DD)."""
    try:
        target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")
        
    with db.get_db_cursor() as cursor:
        db.cleanup_expired_records(cursor)
        cursor.execute(
            """
            SELECT id, availability_id, slot_start, slot_end, status 
            FROM slots 
            WHERE slot_start::date = %s
            ORDER BY slot_start;
            """,
            (target_date,)
        )
        slots = []
        for row in cursor.fetchall():
            slots.append({
                "id": row[0],
                "availability_id": row[1],
                "slot_start": row[2].isoformat(),
                "slot_end": row[3].isoformat(),
                "status": row[4]
            })
    return {"slots": slots}

# --- PUBLIC BOOKING API ---

@app.post("/api/appointments/book")
def book_appointment(req: AppointmentBookRequest):
    """Books a slot using a secure transactional row-level lock."""
    try:
        citizen_details = {
            "full_name": req.citizen.full_name,
            "mobile_number": req.citizen.mobile_number,
            "address": req.citizen.address
        }
        optional_details = {
            "aadhaar_number": req.aadhaar_number,
            "ward_number": req.ward_number,
            "grievance_category": req.grievance_category
        }
        
        result = db.book_slot_transaction(
            slot_id=req.slot_id,
            citizen_details=citizen_details,
            purpose=req.purpose,
            optional_details=optional_details
        )
        
        # Calculate reporting time (e.g. 10 minutes before slot start)
        reporting_time = (result["slot_start"] - timedelta(minutes=10)).strftime("%I:%M %p")
        
        # Send confirmation SMS
        try:
            appt_date = result["slot_start"].strftime("%Y-%m-%d")
            appt_time = result["slot_start"].strftime("%I:%M %p")
            notifications.send_appointment_confirmation(
                phone=req.citizen.mobile_number,
                token_number=result["token_number"],
                appointment_date=appt_date,
                appointment_time=appt_time
            )
        except Exception as e_sms:
            print(f"Error sending booking SMS: {e_sms}")
            
        return {
            "success": True,
            "message": "Appointment booked successfully!",
            "appointment_id": result["appointment_id"],
            "token_number": result["token_number"],
            "slot_start": result["slot_start"].isoformat(),
            "reporting_time": reporting_time
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# --- PUBLIC APPOINTMENT TRACKING ---
@app.get("/api/appointments/track/{token_number}")
def track_appointment(token_number: str, phone: str):
    """Retrieves appointment details using token number and citizen phone number for validation."""
    with db.get_db_cursor() as cursor:
        cursor.execute(
            """
            SELECT 
                a.id, a.purpose, a.status, a.token_number, a.aadhaar_number, a.ward_number, a.grievance_category, a.created_at,
                c.full_name, c.mobile_number, c.address,
                s.slot_start, s.slot_end
            FROM appointments a
            JOIN citizens c ON a.citizen_id = c.id
            JOIN slots s ON a.slot_id = s.id
            WHERE a.token_number = %s AND c.mobile_number = %s;
            """,
            (token_number, phone)
        )
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Appointment not found or phone number mismatch.")
            
        reporting_time = (row[11] - timedelta(minutes=10)).strftime("%I:%M %p")
        
        return {
            "appointment": {
                "id": row[0],
                "purpose": row[1],
                "status": row[2],
                "token_number": row[3],
                "aadhaar_number": row[4],
                "ward_number": row[5],
                "grievance_category": row[6],
                "created_at": row[7].isoformat(),
                "citizen": {
                    "full_name": row[8],
                    "mobile_number": row[9],
                    "address": row[10]
                },
                "slot": {
                    "slot_start": row[11].isoformat(),
                    "slot_end": row[12].isoformat()
                },
                "reporting_time": reporting_time
            }
        }

# --- ADMIN AVAILABILITY MANAGEMENT ---

@app.post("/api/admin/availability", dependencies=[Depends(require_write)])
def create_availability(req: AvailabilityCreate, current_admin: dict = Depends(require_role("SUPER_ADMIN"))):
    """Creates a new availability range and automatically generates slots."""
    if req.available_date < date.today():
        raise HTTPException(status_code=400, detail="Cannot create availability for a past date.")
        
    try:
        start_t = datetime.strptime(req.start_time, "%H:%M").time()
        end_t = datetime.strptime(req.end_time, "%H:%M").time()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid time format. Use HH:MM.")
        
    if start_t >= end_t:
        raise HTTPException(status_code=400, detail="Start time must be before end time.")
        
    with db.get_db_cursor() as cursor:
        # Create availability record
        cursor.execute(
            """
            INSERT INTO availability (available_date, start_time, end_time, slot_duration, created_by)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id;
            """,
            (req.available_date, start_t, end_t, req.slot_duration, current_admin["id"])
        )
        availability_id = cursor.fetchone()[0]
        
        # Slot generation
        start_datetime = datetime.combine(req.available_date, start_t)
        end_datetime = datetime.combine(req.available_date, end_t)
        
        curr = start_datetime
        slots_to_insert = []
        duration = timedelta(minutes=req.slot_duration)
        
        while curr + duration <= end_datetime:
            slot_end = curr + duration
            slots_to_insert.append((availability_id, curr, slot_end))
            curr = slot_end
            
        for slot in slots_to_insert:
            cursor.execute(
                """
                INSERT INTO slots (availability_id, slot_start, slot_end, status)
                VALUES (%s, %s, %s, 'AVAILABLE');
                """,
                slot
            )
            
    return {"success": True, "message": f"Availability created. Generated {len(slots_to_insert)} slots.", "availability_id": availability_id}

@app.put("/api/admin/availability/{availability_id}", dependencies=[Depends(require_write)])
def update_availability(availability_id: int, req: AvailabilityCreate, current_admin: dict = Depends(require_role("SUPER_ADMIN"))):
    """Updates an availability range and regenerates slots. Blocks if slots are already booked."""
    try:
        start_t = datetime.strptime(req.start_time, "%H:%M").time()
        end_t = datetime.strptime(req.end_time, "%H:%M").time()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid time format. Use HH:MM.")
        
    if start_t >= end_t:
        raise HTTPException(status_code=400, detail="Start time must be before end time.")
        
    with db.get_db_cursor() as cursor:
        # Check if availability exists
        cursor.execute("SELECT id FROM availability WHERE id = %s;", (availability_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Availability range not found.")
            
        # Check if any slots are already booked
        cursor.execute("SELECT COUNT(*) FROM slots WHERE availability_id = %s AND status = 'BOOKED';", (availability_id,))
        booked_count = cursor.fetchone()[0]
        if booked_count > 0:
            raise HTTPException(
                status_code=400, 
                detail=f"Cannot edit availability. {booked_count} slot(s) are already booked. Please manage or cancel the appointments first."
            )
            
        # Delete old slots
        cursor.execute("DELETE FROM slots WHERE availability_id = %s;", (availability_id,))
        
        # Update availability record
        cursor.execute(
            """
            UPDATE availability 
            SET available_date = %s, start_time = %s, end_time = %s, slot_duration = %s
            WHERE id = %s;
            """,
            (req.available_date, start_t, end_t, req.slot_duration, availability_id)
        )
        
        # Regenerate slots
        start_datetime = datetime.combine(req.available_date, start_t)
        end_datetime = datetime.combine(req.available_date, end_t)
        
        curr = start_datetime
        slots_to_insert = []
        duration = timedelta(minutes=req.slot_duration)
        
        while curr + duration <= end_datetime:
            slot_end = curr + duration
            slots_to_insert.append((availability_id, curr, slot_end))
            curr = slot_end
            
        for slot in slots_to_insert:
            cursor.execute(
                """
                INSERT INTO slots (availability_id, slot_start, slot_end, status)
                VALUES (%s, %s, %s, 'AVAILABLE');
                """,
                slot
            )
            
    return {"success": True, "message": f"Availability updated. Regenerated {len(slots_to_insert)} slots."}

@app.delete("/api/admin/availability/{availability_id}", dependencies=[Depends(require_write)])
def delete_availability(availability_id: int, current_admin: dict = Depends(require_role("SUPER_ADMIN"))):
    """Deletes an availability range and its slots. Blocks if slots are already booked."""
    with db.get_db_cursor() as cursor:
        # Check if availability exists
        cursor.execute("SELECT id FROM availability WHERE id = %s;", (availability_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Availability range not found.")
            
        # Check if any slots are already booked
        cursor.execute("SELECT COUNT(*) FROM slots WHERE availability_id = %s AND status = 'BOOKED';", (availability_id,))
        booked_count = cursor.fetchone()[0]
        if booked_count > 0:
            raise HTTPException(
                status_code=400, 
                detail=f"Cannot delete availability. {booked_count} slot(s) are already booked. Please cancel the appointments first."
            )
            
        # Delete slots and availability
        cursor.execute("DELETE FROM availability WHERE id = %s;", (availability_id,))
        
    return {"success": True, "message": "Availability and its slots deleted successfully."}

@app.get("/api/admin/availability")
def list_availability(current_admin: dict = Depends(get_current_admin)):
    """Lists all availability windows."""
    with db.get_db_cursor() as cursor:
        db.cleanup_expired_records(cursor)
        cursor.execute(
            """
            SELECT id, available_date, start_time, end_time, slot_duration 
            FROM availability 
            ORDER BY available_date DESC, start_time ASC;
            """
        )
        availabilities = []
        for row in cursor.fetchall():
            availabilities.append({
                "id": row[0],
                "available_date": row[1].strftime("%Y-%m-%d"),
                "start_time": row[2].strftime("%H:%M"),
                "end_time": row[3].strftime("%H:%M"),
                "slot_duration": row[4]
            })
    return {"availabilities": availabilities}

# --- ADMIN APPOINTMENTS MANAGEMENT ---

@app.get("/api/admin/appointments")
def get_all_appointments(current_admin: dict = Depends(get_current_admin)):
    """Lists all appointments with citizen and slot details."""
    with db.get_db_cursor() as cursor:
        db.cleanup_expired_records(cursor)
        cursor.execute(
            """
            SELECT 
                a.id as appointment_id,
                a.purpose,
                a.status as appointment_status,
                a.token_number,
                a.aadhaar_number,
                a.ward_number,
                a.grievance_category,
                a.created_at as booked_at,
                c.id as citizen_id,
                c.full_name,
                c.mobile_number,
                c.address,
                s.id as slot_id,
                s.slot_start,
                s.slot_end
            FROM appointments a
            JOIN citizens c ON a.citizen_id = c.id
            JOIN slots s ON a.slot_id = s.id
            ORDER BY s.slot_start DESC;
            """
        )
        appointments = []
        for row in cursor.fetchall():
            appointments.append({
                "id": row[0],
                "purpose": row[1],
                "status": row[2],
                "token_number": row[3],
                "aadhaar_number": row[4],
                "ward_number": row[5],
                "grievance_category": row[6],
                "created_at": row[7].isoformat(),
                "citizen": {
                    "id": row[8],
                    "full_name": row[9],
                    "mobile_number": row[10],
                    "address": row[11]
                },
                "slot": {
                    "id": row[12],
                    "slot_start": row[13].isoformat(),
                    "slot_end": row[14].isoformat()
                }
            })
    return {"appointments": appointments}

@app.put("/api/admin/appointments/{appointment_id}", dependencies=[Depends(require_write)])
def update_appointment_status(appointment_id: int, req: AppointmentStatusUpdate, current_admin: dict = Depends(require_role("SUPER_ADMIN"))):
    """Updates appointment status (CONFIRMED, CANCELLED, COMPLETED, NO_SHOW, RESCHEDULED)."""
    with db.get_db_cursor() as cursor:
        # Check if appointment exists and get citizen mobile + current token
        cursor.execute(
            """
            SELECT a.slot_id, a.status, c.mobile_number, a.token_number 
            FROM appointments a 
            JOIN citizens c ON a.citizen_id = c.id 
            WHERE a.id = %s;
            """,
            (appointment_id,)
        )
        appt = cursor.fetchone()
        if not appt:
            raise HTTPException(status_code=404, detail="Appointment not found.")
            
        old_slot_id, old_status, phone_number, old_token_number = appt
        new_status = req.status.upper()
        
        # If status is changing to CANCELLED, we free up the old slot
        if new_status == 'CANCELLED' and old_status != 'CANCELLED':
            cursor.execute("UPDATE slots SET status = 'AVAILABLE' WHERE id = %s;", (old_slot_id,))
            cursor.execute("UPDATE appointments SET status = %s WHERE id = %s;", (new_status, appointment_id))
            
            # Send cancellation SMS
            try:
                notifications.send_appointment_cancelled(phone_number, old_token_number)
            except Exception as e_sms:
                print(f"Error sending cancellation SMS: {e_sms}")
            
        # If status is changing FROM CANCELLED back to CONFIRMED or PENDING, check if old slot is available
        elif old_status == 'CANCELLED' and new_status in ['PENDING', 'CONFIRMED']:
            cursor.execute("SELECT status FROM slots WHERE id = %s;", (old_slot_id,))
            slot_status = cursor.fetchone()[0]
            if slot_status != 'AVAILABLE':
                raise HTTPException(status_code=400, detail="Cannot restore appointment. Original slot is no longer available.")
            cursor.execute("UPDATE slots SET status = 'BOOKED' WHERE id = %s;", (old_slot_id,))
            cursor.execute("UPDATE appointments SET status = %s WHERE id = %s;", (new_status, appointment_id))
            
        # If rescheduling (new slot id provided)
        elif new_status == 'RESCHEDULED' or req.new_slot_id is not None:
            if not req.new_slot_id:
                raise HTTPException(status_code=400, detail="New slot ID is required for rescheduling.")
                
            # Lock and check availability of new slot
            cursor.execute("SELECT status, slot_start FROM slots WHERE id = %s FOR UPDATE;", (req.new_slot_id,))
            new_slot = cursor.fetchone()
            if not new_slot:
                raise HTTPException(status_code=404, detail="New slot not found.")
            if new_slot[0] != 'AVAILABLE':
                raise HTTPException(status_code=400, detail="New slot is not available.")
                
            # Free up old slot
            cursor.execute("UPDATE slots SET status = 'AVAILABLE' WHERE id = %s;", (old_slot_id,))
            # Book new slot
            cursor.execute("UPDATE slots SET status = 'BOOKED' WHERE id = %s;", (req.new_slot_id,))
            
            # Generate new token
            date_str = new_slot[1].strftime("%Y%m%d")
            new_token = f"TKN-{date_str}-{req.new_slot_id}"
            
            # Update appointment
            cursor.execute(
                """
                UPDATE appointments 
                SET slot_id = %s, status = 'RESCHEDULED', token_number = %s 
                WHERE id = %s;
                """,
                (req.new_slot_id, new_token, appointment_id)
            )
            
            # Send rescheduling SMS
            try:
                new_date = new_slot[1].strftime("%Y-%m-%d")
                new_time = new_slot[1].strftime("%I:%M %p")
                notifications.send_appointment_rescheduled(
                    phone=phone_number,
                    token_number=new_token,
                    new_date=new_date,
                    new_time=new_time
                )
            except Exception as e_sms:
                print(f"Error sending reschedule SMS: {e_sms}")
            
        else:
            # Just simple status update (CONFIRMED, COMPLETED, NO_SHOW)
            cursor.execute("UPDATE appointments SET status = %s WHERE id = %s;", (new_status, appointment_id))
            
    return {"success": True, "message": f"Appointment status updated to {new_status}."}

@app.get("/api/admin/notifications/logs")
def get_admin_notifications_logs(current_admin: dict = Depends(get_current_admin)):
    """Retrieves all notification logs from the database, ordered by latest dispatch."""
    with db.get_db_cursor() as cursor:
        cursor.execute(
            """
            SELECT id, phone, message, status, provider, created_at, sent_at 
            FROM notification_logs 
            ORDER BY created_at DESC;
            """
        )
        rows = cursor.fetchall()
        logs = []
        for r in rows:
            logs.append({
                "id": r[0],
                "phone": r[1],
                "message": r[2],
                "status": r[3],
                "provider": r[4],
                "created_at": r[5].isoformat() if r[5] else None,
                "sent_at": r[6].isoformat() if r[6] else None
            })
    return {"logs": logs}

# --- STATS / REPORTING API ---

@app.get("/api/admin/stats")
def get_admin_stats(current_admin: dict = Depends(get_current_admin)):
    """Fetches key statistics for the dashboard."""
    today = date.today()
    with db.get_db_cursor() as cursor:
        # Total Bookings
        cursor.execute("SELECT COUNT(*) FROM appointments;")
        total_bookings = cursor.fetchone()[0]
        
        # Today's Bookings
        cursor.execute(
            """
            SELECT COUNT(*) FROM appointments a
            JOIN slots s ON a.slot_id = s.id
            WHERE s.slot_start::date = %s;
            """,
            (today,)
        )
        todays_bookings = cursor.fetchone()[0]
        
        # Upcoming Bookings
        cursor.execute(
            """
            SELECT COUNT(*) FROM appointments a
            JOIN slots s ON a.slot_id = s.id
            WHERE s.slot_start >= %s AND a.status IN ('PENDING', 'CONFIRMED');
            """,
            (datetime.combine(today, time.min),)
        )
        upcoming_bookings = cursor.fetchone()[0]
        
        # Booking Status Breakdown
        cursor.execute("SELECT status, COUNT(*) FROM appointments GROUP BY status;")
        status_breakdown = {row[0]: row[1] for row in cursor.fetchall()}
        
        # Slot Utilization (Booked slots vs Total slots)
        cursor.execute("SELECT COUNT(*) FROM slots;")
        total_slots = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM slots WHERE status = 'BOOKED';")
        booked_slots = cursor.fetchone()[0]
        
        utilization = round((booked_slots / total_slots * 100), 2) if total_slots > 0 else 0
        
    return {
        "total_bookings": total_bookings,
        "todays_bookings": todays_bookings,
        "upcoming_bookings": upcoming_bookings,
        "status_breakdown": status_breakdown,
        "slot_utilization_percent": utilization,
        "total_slots": total_slots,
        "booked_slots": booked_slots
    }

# --- UNIFIED DASHBOARD SUMMARY API ---
@app.get("/api/admin/dashboard")
def get_dashboard_summary(current_admin: dict = Depends(get_current_admin)):
    """Fetches consolidated analytics statistics for the admin dashboard."""
    today = date.today()
    with db.get_db_cursor() as cursor:
        # 1. Appointment Counts
        cursor.execute("SELECT COUNT(*) FROM appointments;")
        total_appointments = cursor.fetchone()[0]
        
        cursor.execute(
            """
            SELECT COUNT(*) FROM appointments a
            JOIN slots s ON a.slot_id = s.id
            WHERE s.slot_start::date = %s;
            """,
            (today,)
        )
        today_appointments = cursor.fetchone()[0]
        
        # 2. Grievance Counts
        cursor.execute("SELECT COUNT(*) FROM grievances;")
        total_grievances = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM grievances WHERE status = 'PENDING';")
        pending_grievances = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM grievances WHERE status = 'RESOLVED';")
        resolved_grievances = cursor.fetchone()[0]
        
        # 3. Slot utilization
        cursor.execute("SELECT COUNT(*) FROM slots;")
        total_slots = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM slots WHERE status = 'BOOKED';")
        booked_slots = cursor.fetchone()[0]
        utilization = round((booked_slots / total_slots * 100), 2) if total_slots > 0 else 0
        
    return {
        "total_appointments": total_appointments,
        "today_appointments": today_appointments,
        "total_grievances": total_grievances,
        "pending_grievances": pending_grievances,
        "resolved_grievances": resolved_grievances,
        "slot_utilization_percent": utilization,
        "role": current_admin.get("role", "OFFICE_STAFF")
    }

# --- PUBLIC GRIEVANCE ATTACHMENT UPLOAD ---
@app.post("/api/grievances/upload")
def upload_grievance_file(file: UploadFile = File(...)):
    """Securely uploads files (images/videos) to Supabase Storage and returns a temporary signed URL."""
    if not supabase_storage.SUPABASE_URL or not supabase_storage.SUPABASE_SERVICE_ROLE_KEY:
        raise HTTPException(
            status_code=500,
            detail="Supabase Storage is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables."
        )
    try:
        # Detect extension
        filename_parts = file.filename.split(".")
        ext = filename_parts[-1].lower() if len(filename_parts) > 1 else ""
        
        # Validate allowed extensions
        allowed_exts = ["jpg", "jpeg", "png", "webp", "mp4", "mov", "pdf"]
        if ext not in allowed_exts:
            raise HTTPException(
                status_code=400,
                detail="Supported file formats are: JPG, JPEG, PNG, WEBP, MP4, MOV, PDF."
            )
            
        # Read file data to check size
        file_data = file.file.read()
        file.file.seek(0)  # Reset pointer to avoid breaking potential upstream reads
        
        is_video = ext in ["mp4", "mov"]
        max_size = 50 * 1024 * 1024 if is_video else 30 * 1024 * 1024
        if len(file_data) > max_size:
            raise HTTPException(
                status_code=400,
                detail=f"File size exceeds limit. Maximum allowed size is {'50MB' if is_video else '30MB'}."
            )
            
        # Generate clean unique hashed filename
        unique_id = uuid.uuid4().hex
        clean_filename = f"{int(datetime.utcnow().timestamp())}_{unique_id}.{ext}"
        
        # Classify file type simple approach
        file_type = "IMAGE"
        if ext in ["mp4", "mov"]:
            file_type = "VIDEO"
        elif ext == "pdf":
            file_type = "DOCUMENT"
            
        # Upload to Supabase Storage
        content_type = file.content_type or "application/octet-stream"
        permanent_url = supabase_storage.upload_file(file_data, clean_filename, content_type)
        
        # Get signed URL for frontend preview (2 hours)
        signed_url = supabase_storage.get_signed_url(permanent_url, expires_in=7200)
        
        return {
            "success": True,
            "file_url": signed_url,
            "file_type": file_type
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"File upload failed: {str(e)}")


# --- PUBLIC GRIEVANCE SUBMISSION ---
@app.post("/api/grievances/submit")
def submit_grievance(req: GrievanceSubmitRequest):
    """Submits a citizen grievance, matching or creating the citizen, and logs initial status."""
    try:
        citizen_details = {
            "full_name": req.citizen.full_name,
            "mobile_number": req.citizen.mobile_number,
            "address": req.citizen.address,
            "email": req.citizen.email
        }
        
        attachments = [
            {
                "file_type": att.file_type,
                "file_url": supabase_storage.get_private_url(att.file_url)
            }
            for att in req.attachments
        ]

        
        grievance_id = db.submit_grievance_transaction(
            citizen_details=citizen_details,
            constituency=req.constituency,
            ward_number=req.ward_number,
            category=req.category,
            description=req.description,
            attachments=attachments,
            appointment_id=req.appointment_id
        )
        
        # Send confirmation SMS
        try:
            notifications.send_grievance_confirmation(
                phone=req.citizen.mobile_number,
                grievance_id=grievance_id
            )
        except Exception as e_sms:
            print(f"Error sending grievance SMS: {e_sms}")
            
        return {
            "success": True,
            "message": "Grievance submitted successfully!",
            "grievance_id": grievance_id
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

# --- PUBLIC GRIEVANCE TRACKING ---
@app.get("/api/grievances/track/{grievance_id}")
def track_grievance(grievance_id: str, phone: str):
    """Retrieves grievance real-time status and audit history using grievance ID and citizen phone."""
    with db.get_db_cursor() as cursor:
        # Fetch grievance and citizen info
        cursor.execute(
            """
            SELECT 
                g.id, g.constituency, g.ward_number, g.category, g.description, g.status, g.officer_comments, g.created_at,
                c.full_name, c.mobile_number, c.address, c.email,
                g.source_type, g.source_system, g.external_reference_id, g.received_at
            FROM grievances g
            JOIN citizens c ON g.citizen_id = c.id
            WHERE g.id = %s AND c.mobile_number = %s;
            """,
            (grievance_id, phone)
        )
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Grievance not found or mobile number mismatch.")
            
        grievance_data = {
            "id": row[0],
            "constituency": row[1],
            "ward_number": row[2],
            "category": row[3],
            "description": row[4],
            "status": row[5],
            "officer_comments": row[6],
            "created_at": row[7].isoformat(),
            "citizen": {
                "full_name": row[8],
                "mobile_number": row[9],
                "address": row[10],
                "email": row[11]
            },
            "source_type": row[12],
            "source_system": row[13],
            "external_reference_id": row[14],
            "received_at": row[15].isoformat() if row[15] else None
        }

        
        # Fetch attachments
        cursor.execute(
            "SELECT file_type, file_url FROM grievance_attachments WHERE grievance_id = %s;",
            (grievance_id,)
        )
        grievance_data["attachments"] = [
            {
                "file_type": r[0],
                "file_url": supabase_storage.get_signed_url(r[1], expires_in=7200)
            }
            for r in cursor.fetchall()
        ]

        
        # Fetch status history
        cursor.execute(
            """
            SELECT old_status, new_status, remarks, created_at 
            FROM grievance_status_history 
            WHERE grievance_id = %s 
            ORDER BY created_at DESC;
            """,
            (grievance_id,)
        )
        grievance_data["history"] = [
            {
                "old_status": r[0],
                "new_status": r[1],
                "remarks": r[2],
                "created_at": r[3].isoformat()
            }
            for r in cursor.fetchall()
        ]
        
    return {"grievance": grievance_data}

# --- ADMIN GRIEVANCE MANAGEMENT LISTING ---
@app.get("/api/admin/grievances")
def get_all_grievances(current_admin: dict = Depends(get_current_admin)):
    """Lists all citizen grievances with citizen details and attachments."""
    with db.get_db_cursor() as cursor:
        cursor.execute(
            """
            SELECT 
                g.id as grievance_id,
                g.constituency,
                g.ward_number,
                g.category,
                g.description,
                g.status as grievance_status,
                g.assigned_officer,
                g.officer_comments,
                g.created_at as filed_at,
                c.id as citizen_id,
                c.full_name,
                c.mobile_number,
                c.address,
                c.email,
                g.appointment_id,
                g.source_type,
                g.source_system,
                g.external_reference_id,
                g.received_at
            FROM grievances g
            JOIN citizens c ON g.citizen_id = c.id
            ORDER BY g.created_at DESC;
            """
        )
        grievances = []
        for row in cursor.fetchall():
            g_id = row[0]
            
            # Fetch attachments for this specific grievance
            with db.get_db_cursor() as sub_cursor:
                sub_cursor.execute(
                    "SELECT file_type, file_url FROM grievance_attachments WHERE grievance_id = %s;",
                    (g_id,)
                )
                attachments = [
                    {
                        "file_type": r[0],
                        "file_url": supabase_storage.get_signed_url(r[1], expires_in=7200)
                    }
                    for r in sub_cursor.fetchall()
                ]


                
            grievances.append({
                "id": g_id,
                "constituency": row[1],
                "ward_number": row[2],
                "category": row[3],
                "description": row[4],
                "status": row[5],
                "assigned_officer": row[6],
                "officer_comments": row[7],
                "created_at": row[8].isoformat(),
                "citizen": {
                    "id": row[9],
                    "full_name": row[10],
                    "mobile_number": row[11],
                    "address": row[12],
                    "email": row[13]
                },
                "appointment_id": row[14],
                "attachments": attachments,
                "source_type": row[15],
                "source_system": row[16],
                "external_reference_id": row[17],
                "received_at": row[18].isoformat() if row[18] else None
            })

            
    return {"grievances": grievances}

# --- ADMIN GRIEVANCE UPDATE ---
@app.put("/api/admin/grievances/{grievance_id}", dependencies=[Depends(require_write)])
def update_grievance_status(grievance_id: str, req: GrievanceStatusUpdate, current_admin: dict = Depends(require_role("SUPER_ADMIN"))):
    """Updates grievance status and registers history audit trail."""
    try:
        # Fetch citizen's mobile number
        with db.get_db_cursor() as cursor:
            cursor.execute(
                """
                SELECT c.mobile_number 
                FROM grievances g 
                JOIN citizens c ON g.citizen_id = c.id 
                WHERE g.id = %s;
                """,
                (grievance_id,)
            )
            res = cursor.fetchone()
            phone_number = res[0] if res else None

        db.update_grievance_status_transaction(
            grievance_id=grievance_id,
            new_status=req.status.upper(),
            remarks=req.remarks,
            admin_id=current_admin["id"]
        )
        
        # Send status update SMS
        if phone_number:
            try:
                notifications.send_grievance_status_update(
                    phone=phone_number,
                    grievance_id=grievance_id,
                    status=req.status.upper()
                )
            except Exception as e_sms:
                print(f"Error sending grievance status update SMS: {e_sms}")
                
        return {"success": True, "message": f"Grievance status updated to {req.status}."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# --- NEWS ENDPOINTS ---

@app.get("/api/news")
def get_public_news():
    """Public endpoint to fetch all active news items."""
    try:
        news_list = db.get_all_news(only_active=True)
        return {"news": news_list}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/news/tamilnadu")
def get_tamilnadu_news():
    """Fetch latest Tamil Nadu news from Google News RSS."""
    import xml.etree.ElementTree as ET
    from datetime import datetime
    import re

    feed_url = "https://news.google.com/rss/search?q=Tamil+Nadu+news&hl=en-IN&gl=IN&ceid=IN:en"

    all_items = []
    try:
        resp = requests.get(feed_url, timeout=10, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        })
        resp.raise_for_status()
        root = ET.fromstring(resp.content)
        for item in root.iter("item"):
            title = item.findtext("title", "")
            link = item.findtext("link", "")
            pub_date_str = item.findtext("pubDate", "")
            source = item.findtext("source", "")

            clean_desc = re.sub(r"<[^>]+>", "", title).strip()
            if len(clean_desc) > 300:
                clean_desc = clean_desc[:300] + "..."

            pub_date = None
            try:
                if pub_date_str:
                    dt = datetime.strptime(pub_date_str, "%a, %d %b %Y %H:%M:%S %z")
                    pub_date = dt.strftime("%Y-%m-%d")
            except (ValueError, TypeError):
                pub_date = datetime.now().strftime("%Y-%m-%d")

            all_items.append({
                "headline": title,
                "description": clean_desc,
                "link": link,
                "date": pub_date or datetime.now().strftime("%Y-%m-%d"),
                "category": "Tamil Nadu"
            })
    except Exception as e:
        print(f"Error fetching Google News RSS: {e}")

    all_items.sort(key=lambda x: x["date"], reverse=True)
    return {"news": all_items[:50]}


@app.get("/api/news/government")
def get_government_news():
    """Scrape government notifications from TN Govt Whats New page."""
    from html.parser import HTMLParser

    class GovtNewsParser(HTMLParser):
        def __init__(self):
            super().__init__()
            self.items = []
            self._in_tr = False
            self._in_td_date = False
            self._in_td_title = False
            self._in_a = False
            self._current_date = ""
            self._current_title = ""
            self._current_link = ""
            self._td_count = 0

        def handle_starttag(self, tag, attrs):
            attrs_dict = dict(attrs)
            if tag == "tr" and "table_row" in attrs_dict.get("class", ""):
                self._in_tr = True
                self._td_count = 0
                self._current_date = ""
                self._current_title = ""
                self._current_link = ""
            if self._in_tr and tag == "td" and "table_data" in attrs_dict.get("class", ""):
                self._td_count += 1
                if self._td_count == 1:
                    self._in_td_date = True
                elif self._td_count == 2:
                    self._in_td_title = True
            if self._in_td_title and tag == "a" and "href" in attrs_dict:
                self._in_a = True
                self._current_link = attrs_dict["href"]

        def handle_endtag(self, tag):
            if tag == "tr":
                self._in_tr = False
                if self._current_date and self._current_title:
                    try:
                        dt = datetime.strptime(self._current_date.strip(), "%B %d, %Y")
                        formatted_date = dt.strftime("%Y-%m-%d")
                    except:
                        formatted_date = self._current_date.strip()
                    self.items.append({
                        "headline": self._current_title.strip(),
                        "link": self._current_link,
                        "date": formatted_date,
                        "category": "Government Notification"
                    })
                self._current_date = ""
                self._current_title = ""
                self._current_link = ""
            if tag == "td":
                self._in_td_date = False
                self._in_td_title = False
            if tag == "a":
                self._in_a = False

        def handle_data(self, data):
            if self._in_td_date:
                self._current_date += data
            if self._in_td_title and not self._in_a:
                self._current_title += data

    feed_url = "https://www.tn.gov.in/test-paginate.php?year=MjAyNg=="
    try:
        resp = requests.get(feed_url, timeout=15, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        })
        resp.raise_for_status()
        parser = GovtNewsParser()
        parser.feed(resp.text)
        return {"news": parser.items}
    except Exception as e:
        print(f"Error fetching government notifications: {e}")
        return {"news": []}


@app.get("/api/admin/news")
def get_admin_news(current_admin: dict = Depends(get_current_admin)):
    """Admin endpoint to fetch all news items (including inactive)."""
    try:
        news_list = db.get_all_news(only_active=False)
        return {"news": news_list}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/admin/news", dependencies=[Depends(require_write)])
def create_news(req: NewsCreate, current_admin: dict = Depends(require_role("SUPER_ADMIN"))):
    """Create a new news item."""
    try:
        news_id = db.create_news(
            headline=req.headline,
            description=req.description,
            category=req.category,
            date=req.date,
            admin_id=current_admin["id"]
        )
        return {"success": True, "message": "News created successfully.", "id": news_id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.put("/api/admin/news/{news_id}", dependencies=[Depends(require_write)])
def update_news(news_id: int, req: NewsUpdate, current_admin: dict = Depends(require_role("SUPER_ADMIN"))):
    """Update an existing news item."""
    try:
        updated = db.update_news(
            news_id=news_id,
            headline=req.headline,
            description=req.description,
            category=req.category,
            date=req.date,
            is_active=req.is_active
        )
        if not updated:
            raise HTTPException(status_code=404, detail="News item not found.")
        return {"success": True, "message": "News updated successfully."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.delete("/api/admin/news/{news_id}", dependencies=[Depends(require_write)])
def delete_news(news_id: int, current_admin: dict = Depends(require_role("SUPER_ADMIN"))):
    """Delete a news item."""
    try:
        deleted = db.delete_news(news_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="News item not found.")
        return {"success": True, "message": "News deleted successfully."}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/admin/grievances/import", dependencies=[Depends(require_write)])
def import_grievances_csv(
    file: UploadFile = File(...),
    current_admin: dict = Depends(require_role("SUPER_ADMIN"))
):
    """
    Ingests grievances from a CSV file uploaded by an Admin.
    Checks and matches citizens by phone number to prevent duplicates.
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported for import.")
        
    try:
        content = file.file.read().decode("utf-8")
        csv_reader = csv.DictReader(StringIO(content))
        if not csv_reader.fieldnames:
            raise Exception("CSV has no headers.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read CSV file: {str(e)}")

    # Map headers to expected fields flexibly
    field_mapping = {}
    original_fields = csv_reader.fieldnames
    for field in original_fields:
        clean = field.strip().lower().replace("_", "").replace(" ", "")
        if clean in ["fullname", "citizenname", "name", "citizen"]:
            field_mapping["full_name"] = field
        elif clean in ["mobilenumber", "phone", "mobile", "phonenumber", "contact"]:
            field_mapping["mobile_number"] = field
        elif clean in ["address", "citizenaddress"]:
            field_mapping["address"] = field
        elif clean in ["email", "emailaddress"]:
            field_mapping["email"] = field
        elif clean in ["wardnumber", "ward"]:
            field_mapping["ward_number"] = field
        elif clean in ["category", "grievancecategory", "type"]:
            field_mapping["category"] = field
        elif clean in ["description", "details", "text"]:
            field_mapping["description"] = field
        elif clean in ["externalreferenceid", "referenceid", "refid", "externalref"]:
            field_mapping["external_reference_id"] = field
        elif clean in ["receivedat", "date", "receiveddate", "time"]:
            field_mapping["received_at"] = field

    # Verify that required columns are mapped
    required_fields = ["full_name", "mobile_number", "ward_number", "category", "description"]
    missing_fields = [f for f in required_fields if f not in field_mapping]
    if missing_fields:
        raise HTTPException(
            status_code=400,
            detail=f"CSV is missing required column headers: {', '.join(missing_fields)}. "
                   f"Please verify headers match: Name, Phone/Mobile, Ward, Category, and Description."
        )

    rows = list(csv_reader)
    if not rows:
        raise HTTPException(status_code=400, detail="The CSV file contains no data rows.")

    results = []
    success_count = 0
    fail_count = 0

    for idx, row in enumerate(rows, start=1):
        try:
            # Extract citizen details
            fullname_val = row.get(field_mapping["full_name"])
            mobile_val = row.get(field_mapping["mobile_number"])
            address_val = row.get(field_mapping["address"], "") if "address" in field_mapping else ""
            email_val = row.get(field_mapping["email"], "") if "email" in field_mapping else ""
            
            # Extract grievance details
            ward_val = row.get(field_mapping["ward_number"])
            category_val = row.get(field_mapping["category"])
            description_val = row.get(field_mapping["description"])
            ext_ref_val = row.get(field_mapping["external_reference_id"], "") if "external_reference_id" in field_mapping else ""
            received_at_str = row.get(field_mapping["received_at"], "") if "received_at" in field_mapping else ""

            # Basic Validation
            if not fullname_val or not fullname_val.strip():
                raise Exception("Full Name is empty.")
            if not mobile_val or not mobile_val.strip():
                raise Exception("Mobile Number is empty.")
            if not ward_val or not ward_val.strip():
                raise Exception("Ward Number is empty.")
            if not category_val or not category_val.strip():
                raise Exception("Category is empty.")
            if not description_val or not description_val.strip():
                raise Exception("Description is empty.")

            # Sanitize phone: must be exactly 10 digits
            clean_phone = "".join(filter(str.isdigit, mobile_val.strip()))
            if len(clean_phone) != 10:
                raise Exception(f"Invalid mobile number format: '{mobile_val}'. Must be a 10-digit number.")

            # Parse received_at datetime
            received_dt = None
            if received_at_str and received_at_str.strip():
                try:
                    received_dt = datetime.fromisoformat(received_at_str.strip())
                except ValueError:
                    try:
                        received_dt = datetime.strptime(received_at_str.strip(), "%Y-%m-%d")
                    except ValueError:
                        try:
                            received_dt = datetime.strptime(received_at_str.strip(), "%d-%m-%Y")
                        except ValueError:
                            # Default to current time
                            received_dt = datetime.utcnow()
            else:
                received_dt = datetime.utcnow()

            citizen_details = {
                "full_name": fullname_val.strip(),
                "mobile_number": clean_phone,
                "address": address_val.strip() if address_val else "",
                "email": email_val.strip() if email_val else None
            }

            grievance_details = {
                "ward_number": ward_val.strip(),
                "category": category_val.strip(),
                "description": description_val.strip(),
                "external_reference_id": ext_ref_val.strip() if ext_ref_val else None,
                "received_at": received_dt
            }

            # Import row inside database transaction
            with db.get_db_cursor() as cursor:
                g_id = db.import_external_grievance_row(
                    cursor=cursor,
                    citizen_details=citizen_details,
                    grievance_details=grievance_details,
                    admin_id=current_admin["id"]
                )

            results.append({
                "row": idx,
                "success": True,
                "grievance_id": g_id,
                "citizen_name": citizen_details["full_name"],
                "external_reference_id": grievance_details["external_reference_id"]
            })
            success_count += 1
        except Exception as e:
            results.append({
                "row": idx,
                "success": False,
                "error": str(e)
            })
            fail_count += 1

    return {
        "success": True,
        "summary": {
            "total": len(rows),
            "imported": success_count,
            "failed": fail_count
        },
        "details": results
    }


# ---------------------------------------------
# NAMMA MLA COMPLAINT ANALYTICS ENDPOINTS
# ---------------------------------------------

@app.post("/api/admin/namma-mla/validate", dependencies=[Depends(require_write)])
async def validate_namma_mla_sheet(
    file: UploadFile = File(...),
    current_admin: dict = Depends(require_role("SUPER_ADMIN"))
):
    """
    Validates uploaded Excel (.xlsx) file and returns a preview of valid,
    duplicate, and invalid rows.
    """
    if not (file.filename.endswith('.xlsx') or file.filename.endswith('.xls')):
        raise HTTPException(status_code=400, detail="Only Excel files (.xlsx, .xls) are supported.")
    
    try:
        contents = await file.read()
        validation_results = namma_mla_analytics.validate_excel_data(contents, file.filename)
        return validation_results
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/admin/namma-mla/import", dependencies=[Depends(require_write)])
def import_namma_mla_data(
    payload: NammaMlaImportRequest,
    current_admin: dict = Depends(require_role("SUPER_ADMIN"))
):
    """
    Imports the pre-validated Excel rows into the database and logs the batch.
    """
    try:
        import_results = namma_mla_analytics.import_validated_data(
            payload.rows, payload.filename, current_admin["id"]
        )
        return import_results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin/namma-mla/analytics")
def get_namma_mla_analytics(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    ward_number: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    assignee: Optional[str] = None,
    constituency: Optional[str] = None,
    search_id: Optional[str] = None,
    search_citizen: Optional[str] = None,
    month: Optional[str] = None,
    current_admin: dict = Depends(get_current_admin)
):
    """
    Retrieves the complete set of government-grade analytics charts and metrics.
    Supports global filtering.
    """
    filters = {
        "start_date": start_date,
        "end_date": end_date,
        "ward_number": ward_number,
        "category": category,
        "status": status,
        "priority": priority,
        "assignee": assignee,
        "constituency": constituency,
        "search_id": search_id,
        "search_citizen": search_citizen,
        "month": month
    }
    try:
        analytics = namma_mla_analytics.get_analytics_data(filters)
        return analytics
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin/namma-mla/complaints")
def get_namma_mla_complaints_list(
    page: int = 1,
    limit: int = 20,
    sort: Optional[str] = None,
    search: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    ward_number: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    assignee: Optional[str] = None,
    constituency: Optional[str] = None,
    search_id: Optional[str] = None,
    search_citizen: Optional[str] = None,
    month: Optional[str] = None,
    current_admin: dict = Depends(get_current_admin)
):
    """
    Retrieves filtered list of complaints, useful for drill-down views.
    """
    filters = {
        "start_date": start_date,
        "end_date": end_date,
        "ward_number": ward_number,
        "category": category,
        "status": status,
        "priority": priority,
        "assignee": assignee,
        "constituency": constituency,
        "search_id": search_id,
        "search_citizen": search_citizen,
        "month": month,
        "search": search
    }
    try:
        complaints_data = namma_mla_analytics.get_complaints_list(filters, page, limit, sort)
        return complaints_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin/namma-mla/leaderboard")
def get_namma_mla_leaderboard(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    ward_number: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    assignee: Optional[str] = None,
    constituency: Optional[str] = None,
    month: Optional[str] = None,
    current_admin: dict = Depends(get_current_admin)
):
    """
    Ranks officers based on total assigned, completion rate and resolution speed.
    """
    filters = {
        "start_date": start_date,
        "end_date": end_date,
        "ward_number": ward_number,
        "category": category,
        "status": status,
        "priority": priority,
        "assignee": assignee,
        "constituency": constituency,
        "month": month
    }
    try:
        leaderboard = namma_mla_analytics.get_leaderboard_data(filters)
        return leaderboard
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin/namma-mla/wards")
def get_namma_mla_wards_performance(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    ward_number: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    assignee: Optional[str] = None,
    constituency: Optional[str] = None,
    month: Optional[str] = None,
    current_admin: dict = Depends(get_current_admin)
):
    """
    Retrieves comparative ward metrics.
    """
    filters = {
        "start_date": start_date,
        "end_date": end_date,
        "ward_number": ward_number,
        "category": category,
        "status": status,
        "priority": priority,
        "assignee": assignee,
        "constituency": constituency,
        "month": month
    }
    try:
        wards = namma_mla_analytics.get_ward_performance(filters)
        return wards
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin/namma-mla/uploads")
def get_namma_mla_uploads_history(
    current_admin: dict = Depends(get_current_admin)
):
    """
    Gets historical spreadsheet upload batches.
    """
    try:
        history = namma_mla_analytics.get_upload_history()
        return history
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/admin/namma-mla/export/csv")
def export_namma_mla_complaints_csv(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    ward_number: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    assignee: Optional[str] = None,
    constituency: Optional[str] = None,
    search_id: Optional[str] = None,
    search_citizen: Optional[str] = None,
    month: Optional[str] = None,
    current_admin: dict = Depends(get_current_admin)
):
    """
    Streams a CSV of filtered complaints for custom local reports.
    """
    import csv
    from fastapi.responses import StreamingResponse
    from io import StringIO
    
    filters = {
        "start_date": start_date,
        "end_date": end_date,
        "ward_number": ward_number,
        "category": category,
        "status": status,
        "priority": priority,
        "assignee": assignee,
        "constituency": constituency,
        "search_id": search_id,
        "search_citizen": search_citizen,
        "month": month
    }
    
    try:
        # Get all matching rows (page=1, limit=1000000 to fetch all)
        data = namma_mla_analytics.get_complaints_list(filters, 1, 1000000)
        complaints = data["complaints"]
        
        def iter_csv():
            output = StringIO()
            writer = csv.writer(output)
            
            # Write Header
            writer.writerow([
                "Complaint ID", "Title", "Description", "Category", "Priority", 
                "Status", "User", "User Mobile", "Ward Number", "Assembly Constituency", 
                "City", "State", "Resolution Note", "Resolved At", "Created At", "Assignee"
            ])
            yield output.getvalue()
            output.seek(0)
            output.truncate(0)
            
            # Write rows
            for c in complaints:
                writer.writerow([
                    c["complaint_id"],
                    c["title"],
                    c["description"] or "",
                    c["category"] or "",
                    c["priority"] or "",
                    c["status"] or "",
                    c["citizen_name"] or "",
                    c["mobile"] or "",
                    c["ward_number"] or "",
                    c["constituency"] or "",
                    c["city"] or "",
                    c["state"] or "",
                    c["resolution_note"] or "",
                    c["resolved_at"] or "",
                    c["created_at"] or "",
                    c["assignee"] or ""
                ])
                yield output.getvalue()
                output.seek(0)
                output.truncate(0)
                
        response = StreamingResponse(iter_csv(), media_type="text/csv")
        response.headers["Content-Disposition"] = "attachment; filename=namma_mla_complaints_export.csv"
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------
# WARD MEMBER ENDPOINTS (role = WARD_MEMBER)
# ---------------------------------------------

class WardMemberDashboardData(BaseModel):
    ward_number: str
    total_grievances: int
    pending_grievances: int
    resolved_grievances: int
    recent_grievances: list

@app.get("/api/ward-member/dashboard", dependencies=[Depends(require_role("WARD_MEMBER", "SUPER_ADMIN", "OFFICE_STAFF"))])
def get_ward_member_dashboard(current_user: dict = Depends(get_current_admin)):
    """Returns grievance data filtered for the ward member's ward.
    The ward number is determined from the admin's stored ward_number field.
    For now, returns open (unassigned) grievances as a default view.
    """
    with db.get_db_cursor() as cursor:
        # Get ward-specific grievances (unassigned ones visible to ward members)
        cursor.execute("""
            SELECT g.id, g.category, g.description, g.status, g.created_at,
                   c.full_name, c.mobile_number, c.address
            FROM grievances g
            JOIN citizens c ON g.citizen_id = c.id
            WHERE g.assigned_officer IS NULL OR g.assigned_officer = ''
            ORDER BY g.created_at DESC
            LIMIT 50;
        """)
        grievances = []
        for row in cursor.fetchall():
            grievances.append({
                "id": row[0],
                "category": row[1],
                "description": row[2],
                "status": row[3],
                "created_at": row[4].isoformat(),
                "citizen": {
                    "full_name": row[5],
                    "mobile_number": row[6],
                    "address": row[7]
                }
            })

        cursor.execute("SELECT COUNT(*) FROM grievances;")
        total = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM grievances WHERE status = 'PENDING';")
        pending = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM grievances WHERE status = 'RESOLVED';")
        resolved = cursor.fetchone()[0]

    return {
        "ward_number": current_user.get("ward_number", "N/A"),
        "stats": {
            "total_grievances": total,
            "pending_grievances": pending,
            "resolved_grievances": resolved
        },
        "grievances": grievances,
        "role": current_user["role"]
    }


@app.get("/api/ward-member/grievances", dependencies=[Depends(require_role("WARD_MEMBER", "SUPER_ADMIN", "OFFICE_STAFF"))])
def get_ward_member_grievances(current_user: dict = Depends(get_current_admin)):
    """Lists all grievances visible to ward members."""
    with db.get_db_cursor() as cursor:
        cursor.execute("""
            SELECT g.id, g.category, g.description, g.status, g.ward_number, g.created_at,
                   c.full_name, c.mobile_number
            FROM grievances g
            JOIN citizens c ON g.citizen_id = c.id
            ORDER BY g.created_at DESC;
        """)
        grievances = []
        for row in cursor.fetchall():
            grievances.append({
                "id": row[0],
                "category": row[1],
                "description": row[2],
                "status": row[3],
                "ward_number": row[4],
                "created_at": row[5].isoformat(),
                "citizen_name": row[6],
                "mobile": row[7]
            })
    return {"grievances": grievances}


# ---------------------------------------------
# COUNSELOR ENDPOINTS (role = COUNSELOR)
# ---------------------------------------------

@app.get("/api/counselor/dashboard", dependencies=[Depends(require_role("COUNSELOR", "SUPER_ADMIN", "OFFICE_STAFF"))])
def get_counselor_dashboard(current_user: dict = Depends(get_current_admin)):
    """Returns a constituency-level overview for counselors."""
    with db.get_db_cursor() as cursor:
        # Appointments summary
        cursor.execute("SELECT COUNT(*) FROM appointments;")
        total_appointments = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM appointments WHERE status = 'PENDING' OR status = 'CONFIRMED';")
        upcoming_appointments = cursor.fetchone()[0]

        # Grievances summary
        cursor.execute("SELECT COUNT(*) FROM grievances;")
        total_grievances = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM grievances WHERE status = 'PENDING';")
        pending_grievances = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM grievances WHERE status = 'RESOLVED';")
        resolved_grievances = cursor.fetchone()[0]

        # Ward-wise grievance count
        cursor.execute("""
            SELECT ward_number, COUNT(*) as cnt
            FROM grievances
            GROUP BY ward_number
            ORDER BY cnt DESC
            LIMIT 10;
        """)
        ward_wise = [{"ward": r[0], "count": r[1]} for r in cursor.fetchall()]

        # Recent appointments
        cursor.execute("""
            SELECT a.id, a.token_number, a.status, a.created_at,
                   c.full_name, s.slot_start
            FROM appointments a
            JOIN citizens c ON a.citizen_id = c.id
            JOIN slots s ON a.slot_id = s.id
            ORDER BY a.created_at DESC
            LIMIT 20;
        """)
        recent_appointments = []
        for row in cursor.fetchall():
            recent_appointments.append({
                "id": row[0],
                "token_number": row[1],
                "status": row[2],
                "created_at": row[3].isoformat(),
                "citizen_name": row[4],
                "slot_start": row[5].isoformat()
            })

        # Recent grievances
        cursor.execute("""
            SELECT g.id, g.category, g.status, g.ward_number, g.created_at,
                   c.full_name
            FROM grievances g
            JOIN citizens c ON g.citizen_id = c.id
            ORDER BY g.created_at DESC
            LIMIT 20;
        """)
        recent_grievances = []
        for row in cursor.fetchall():
            recent_grievances.append({
                "id": row[0],
                "category": row[1],
                "status": row[2],
                "ward_number": row[3],
                "created_at": row[4].isoformat(),
                "citizen_name": row[5]
            })

    return {
        "stats": {
            "total_appointments": total_appointments,
            "upcoming_appointments": upcoming_appointments,
            "total_grievances": total_grievances,
            "pending_grievances": pending_grievances,
            "resolved_grievances": resolved_grievances
        },
        "ward_wise_grievances": ward_wise,
        "recent_appointments": recent_appointments,
        "recent_grievances": recent_grievances,
        "role": current_user["role"]
    }


@app.get("/api/counselor/appointments", dependencies=[Depends(require_role("COUNSELOR", "SUPER_ADMIN", "OFFICE_STAFF"))])
def get_counselor_appointments(current_user: dict = Depends(get_current_admin)):
    """Lists all appointments for counselor view."""
    with db.get_db_cursor() as cursor:
        cursor.execute("""
            SELECT a.id, a.token_number, a.purpose, a.status, a.created_at,
                   c.full_name, c.mobile_number, c.address,
                   s.slot_start, s.slot_end
            FROM appointments a
            JOIN citizens c ON a.citizen_id = c.id
            JOIN slots s ON a.slot_id = s.id
            ORDER BY s.slot_start DESC;
        """)
        appointments = []
        for row in cursor.fetchall():
            appointments.append({
                "id": row[0],
                "token_number": row[1],
                "purpose": row[2],
                "status": row[3],
                "created_at": row[4].isoformat(),
                "citizen": {
                    "full_name": row[5],
                    "mobile_number": row[6],
                    "address": row[7]
                },
                "slot": {
                    "slot_start": row[8].isoformat(),
                    "slot_end": row[9].isoformat()
                }
            })
    return {"appointments": appointments}


@app.get("/api/counselor/grievances", dependencies=[Depends(require_role("COUNSELOR", "SUPER_ADMIN", "OFFICE_STAFF"))])
def get_counselor_grievances(current_user: dict = Depends(get_current_admin)):
    """Lists all grievances for counselor view."""
    with db.get_db_cursor() as cursor:
        cursor.execute("""
            SELECT g.id, g.category, g.description, g.status, g.ward_number,
                   g.created_at, g.assigned_officer,
                   c.full_name, c.mobile_number
            FROM grievances g
            JOIN citizens c ON g.citizen_id = c.id
            ORDER BY g.created_at DESC;
        """)
        grievances = []
        for row in cursor.fetchall():
            grievances.append({
                "id": row[0],
                "category": row[1],
                "description": row[2],
                "status": row[3],
                "ward_number": row[4],
                "created_at": row[5].isoformat(),
                "assigned_officer": row[6],
                "citizen_name": row[7],
                "mobile": row[8]
            })
    return {"grievances": grievances}

