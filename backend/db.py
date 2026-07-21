import os
import psycopg2
from psycopg2 import pool
from contextlib import contextmanager
from dotenv import load_dotenv

# Load .env file
env_path = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(env_path):
    load_dotenv(dotenv_path=env_path, override=True)
else:
    load_dotenv(override=True) # Load from default paths

# Environment configurations for PostgreSQL
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "mla_appointments")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASS = os.getenv("DB_PASS", "")

connection_pool = None

def get_db_connection_params():
    return {
        "host": DB_HOST,
        "port": DB_PORT,
        "database": DB_NAME,
        "user": DB_USER,
        "password": DB_PASS
    }

def init_db_pool():
    global connection_pool
    # If connection pool is closed or None, initialize it
    if connection_pool is None:
        try:
            params = get_db_connection_params()
            print(f"Initializing connection pool targeting host: {DB_HOST}, database: {DB_NAME}")
            connection_pool = psycopg2.pool.SimpleConnectionPool(
                1, 20,
                **params
            )
            print("Database connection pool initialized successfully.")
        except Exception as e:
            print(f"Error initializing database pool: {e}")
            connection_pool = None

@contextmanager
def get_db_cursor():
    global connection_pool
    if connection_pool is None:
        init_db_pool()
        if connection_pool is None:
            raise Exception("Database connection pool is not initialized.")
            
    try:
        conn = connection_pool.getconn()
        # Verify connection is alive, otherwise raise exception to trigger reconnect
        conn.autocommit = True
        with conn.cursor() as test_cursor:
            test_cursor.execute("SELECT 1;")
        conn.autocommit = False
    except (psycopg2.InterfaceError, psycopg2.OperationalError, Exception) as pool_err:
        print(f"Detected stale or broken connection, resetting pool: {pool_err}")
        try:
            if connection_pool:
                connection_pool.closeall()
        except Exception:
            pass
        connection_pool = None
        init_db_pool()
        if connection_pool is None:
            raise Exception("Failed to reconnect database pool.")
        conn = connection_pool.getconn()
        conn.autocommit = False

    try:
        with conn.cursor() as cursor:
            yield cursor
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        try:
            connection_pool.putconn(conn)
        except Exception:
            pass

def initialize_database_schema():
    """Initializes the database schema if tables do not exist."""
    # First, try to connect to the targeted DB. If it doesn't exist, we will report in manually instructions.
    try:
        conn = psycopg2.connect(**get_db_connection_params())
        conn.autocommit = True
        with conn.cursor() as cursor:
            # Check if tables exist by querying pg_tables
            cursor.execute("SELECT EXISTS (SELECT FROM pg_tables WHERE tablename = 'admins');")
            exists = cursor.fetchone()[0]
            if not exists:
                print("Admins table not found. Executing schema.sql...")
                schema_path = os.path.join(os.path.dirname(__file__), "schema.sql")
                with open(schema_path, "r") as f:
                    schema_sql = f.read()
                cursor.execute(schema_sql)
                print("Database schema initialized successfully.")
            else:
                # Table exists, check if new Supabase Auth fields are present in admins
                cursor.execute("SELECT COLUMN_NAME FROM information_schema.columns WHERE table_name = 'admins' AND column_name = 'supabase_user_id';")
                if not cursor.fetchone():
                    print("Old admins schema detected. Re-initializing schema...")
                    cursor.execute("DROP TABLE IF EXISTS admins CASCADE;")
                    schema_path = os.path.join(os.path.dirname(__file__), "schema.sql")
                    with open(schema_path, "r") as f:
                        schema_sql = f.read()
                    cursor.execute(schema_sql)
                    print("Re-initialized schema to Supabase Auth layout.")

                # Check if new fields are present in grievances
                cursor.execute("SELECT COLUMN_NAME FROM information_schema.columns WHERE table_name = 'grievances' AND column_name = 'source_type';")
                if not cursor.fetchone():
                    print("New columns for external grievance intake not found. Running database migrations...")
                    cursor.execute("""
                        ALTER TABLE grievances ADD COLUMN IF NOT EXISTS source_type VARCHAR(50) DEFAULT 'DIRECT_PORTAL' NOT NULL;
                        ALTER TABLE grievances ADD COLUMN IF NOT EXISTS source_system VARCHAR(100);
                        ALTER TABLE grievances ADD COLUMN IF NOT EXISTS external_reference_id VARCHAR(100);
                        ALTER TABLE grievances ADD COLUMN IF NOT EXISTS received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL;
                    """)
                    print("Database migrations applied successfully.")

                # Check if admins table has designation and ward columns
                cursor.execute("SELECT COLUMN_NAME FROM information_schema.columns WHERE table_name = 'admins' AND column_name = 'designation';")
                if not cursor.fetchone():
                    print("Adding designation and ward columns to admins table...")
                    cursor.execute("""
                        ALTER TABLE admins ADD COLUMN IF NOT EXISTS designation VARCHAR(100);
                        ALTER TABLE admins ADD COLUMN IF NOT EXISTS ward VARCHAR(50);
                    """)
                    print("Admins table migration applied successfully.")

                # Check if admins table has action column
                cursor.execute("SELECT COLUMN_NAME FROM information_schema.columns WHERE table_name = 'admins' AND column_name = 'action';")
                if not cursor.fetchone():
                    print("Adding action column to admins table...")
                    cursor.execute("""
                        ALTER TABLE admins ADD COLUMN IF NOT EXISTS action VARCHAR(10) DEFAULT 'Read' NOT NULL;
                    """)
                    print("Action column migration applied successfully.")

                # Check if notification_logs table exists
                cursor.execute("SELECT EXISTS (SELECT FROM pg_tables WHERE tablename = 'notification_logs');")
                logs_exists = cursor.fetchone()[0]
                if not logs_exists:
                    print("Creating table notification_logs...")
                    cursor.execute("""
                        CREATE TABLE notification_logs (
                            id SERIAL PRIMARY KEY,
                            phone VARCHAR(20) NOT NULL,
                            message TEXT NOT NULL,
                            status VARCHAR(20) DEFAULT 'PENDING' NOT NULL,
                            provider VARCHAR(50) DEFAULT 'MOCK' NOT NULL,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                            sent_at TIMESTAMP
                        );
                    """)
                    print("Table notification_logs created successfully.")

                # Check if news table exists
                cursor.execute("SELECT EXISTS (SELECT FROM pg_tables WHERE tablename = 'news');")
                news_exists = cursor.fetchone()[0]
                if not news_exists:
                    print("Creating table news...")
                    cursor.execute("""
                        CREATE TABLE news (
                            id SERIAL PRIMARY KEY,
                            headline TEXT NOT NULL,
                            description TEXT NOT NULL,
                            category VARCHAR(100) NOT NULL,
                            date DATE NOT NULL DEFAULT CURRENT_DATE,
                            is_active BOOLEAN DEFAULT TRUE NOT NULL,
                            created_by INTEGER REFERENCES admins(id) ON DELETE SET NULL,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
                        );
                    """)
                    print("Table news created successfully.")

                # Check if namma_mla_uploads table exists
                cursor.execute("SELECT EXISTS (SELECT FROM pg_tables WHERE tablename = 'namma_mla_uploads');")
                uploads_exists = cursor.fetchone()[0]
                if not uploads_exists:
                    print("Creating table namma_mla_uploads...")
                    cursor.execute("""
                        CREATE TABLE namma_mla_uploads (
                            upload_batch_id UUID PRIMARY KEY,
                            filename VARCHAR(255) NOT NULL,
                            total_rows INTEGER NOT NULL,
                            imported_rows INTEGER NOT NULL,
                            duplicate_rows INTEGER NOT NULL,
                            invalid_rows INTEGER NOT NULL,
                            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                            uploaded_by INTEGER REFERENCES admins(id) ON DELETE SET NULL
                        );
                    """)
                    print("Table namma_mla_uploads created successfully.")

                # Check if namma_mla_complaints table exists
                cursor.execute("SELECT EXISTS (SELECT FROM pg_tables WHERE tablename = 'namma_mla_complaints');")
                complaints_exists = cursor.fetchone()[0]
                if not complaints_exists:
                    print("Creating table namma_mla_complaints...")
                    cursor.execute("""
                        CREATE TABLE namma_mla_complaints (
                            id SERIAL PRIMARY KEY,
                            complaint_id VARCHAR(100) UNIQUE NOT NULL,
                            title VARCHAR(255) NOT NULL,
                            description TEXT,
                            category VARCHAR(100),
                            priority VARCHAR(50),
                            status VARCHAR(50),
                            citizen_name VARCHAR(200),
                            mobile VARCHAR(15),
                            ward_number VARCHAR(50),
                            constituency VARCHAR(100),
                            city VARCHAR(100),
                            state VARCHAR(100),
                            resolution_note TEXT,
                            resolved_at TIMESTAMP,
                            created_at TIMESTAMP,
                            assignee VARCHAR(100),
                            imported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
                            imported_by INTEGER REFERENCES admins(id) ON DELETE SET NULL,
                            upload_batch_id UUID REFERENCES namma_mla_uploads(upload_batch_id) ON DELETE CASCADE NOT NULL
                        );
                    """)
                    print("Table namma_mla_complaints created successfully.")

        conn.close()
    except Exception as e:
        print(f"Database initialization error (probably database does not exist yet): {e}")


def cleanup_expired_records(cursor):
    """Deletes appointments and availability records whose date is in the past."""
    try:
        # 1. Delete appointments whose slot_start date is before today
        cursor.execute(
            """
            DELETE FROM appointments 
            WHERE slot_id IN (
                SELECT id FROM slots WHERE slot_start::date < CURRENT_DATE
            );
            """
        )
        # 2. Delete availability records whose available_date is before today (cascades to slots)
        cursor.execute(
            """
            DELETE FROM availability 
            WHERE available_date < CURRENT_DATE;
            """
        )
    except Exception as e:
        print(f"Error during expired records cleanup: {e}")


# Transactional slot booking with row-level locking
def book_slot_transaction(slot_id: int, citizen_details: dict, purpose: str, optional_details: dict) -> dict:
    """
    Executes the critical transaction to book a slot.
    Uses FOR UPDATE to lock the selected slot and prevent race conditions.
    """
    global connection_pool
    if connection_pool is None:
        init_db_pool()
        if connection_pool is None:
            raise Exception("Database connection pool is not initialized.")
        
    try:
        conn = connection_pool.getconn()
    except Exception as pool_err:
        print(f"Error checking out connection for booking, resetting pool: {pool_err}")
        init_db_pool()
        if connection_pool is None:
            raise Exception("Failed to reconnect database pool for transaction.")
        conn = connection_pool.getconn()
        
    conn.autocommit = False
    
    try:
        with conn.cursor() as cursor:
            # 1. Start Transaction & Lock the selected slot row
            # This is the exact FOR UPDATE row-level locking requirement
            cursor.execute("SELECT id, status, slot_start FROM slots WHERE id = %s FOR UPDATE;", (slot_id,))
            slot = cursor.fetchone()
            
            if not slot:
                raise Exception("Selected slot does not exist.")
                
            db_slot_id, status, slot_start = slot
            
            from datetime import datetime
            if slot_start < datetime.now():
                raise Exception("Cannot book a slot in the past.")
                
            if status != 'AVAILABLE':
                raise Exception(f"Slot is no longer available. Status: {status}")
                
            # 2. Insert or select Citizen
            # Check if citizen exists with the same mobile number (or insert new one)
            cursor.execute(
                "SELECT id FROM citizens WHERE mobile_number = %s;",
                (citizen_details["mobile_number"],)
            )
            citizen = cursor.fetchone()
            if citizen:
                citizen_id = citizen[0]
                # Update details if changed
                cursor.execute(
                    "UPDATE citizens SET full_name = %s, address = %s, email = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s;",
                    (citizen_details["full_name"], citizen_details["address"], citizen_details.get("email"), citizen_id)
                )
            else:
                cursor.execute(
                    "INSERT INTO citizens (full_name, mobile_number, address, email) VALUES (%s, %s, %s, %s) RETURNING id;",
                    (citizen_details["full_name"], citizen_details["mobile_number"], citizen_details["address"], citizen_details.get("email"))
                )
                citizen_id = cursor.fetchone()[0]
                
            # 3. Create unique token number
            # Simple token format: TKN-YYYYMMDD-SLOTID
            date_str = slot_start.strftime("%Y%m%d")
            token_number = f"TKN-{date_str}-{slot_id}"
            
            # 4. Create appointment
            cursor.execute(
                """
                INSERT INTO appointments (citizen_id, slot_id, purpose, status, token_number, aadhaar_number, ward_number, grievance_category)
                VALUES (%s, %s, %s, 'PENDING', %s, %s, %s, %s)
                RETURNING id, token_number;
                """,
                (
                    citizen_id,
                    slot_id,
                    purpose,
                    token_number,
                    optional_details.get("aadhaar_number"),
                    optional_details.get("ward_number"),
                    optional_details.get("grievance_category")
                )
            )
            appointment_id, db_token = cursor.fetchone()
            
            # 5. Update slot status to BOOKED
            cursor.execute(
                "UPDATE slots SET status = 'BOOKED' WHERE id = %s;",
                (slot_id,)
            )
            
            # 6. Commit Transaction
            conn.commit()
            
            return {
                "appointment_id": appointment_id,
                "token_number": db_token,
                "slot_start": slot_start
            }
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        connection_pool.putconn(conn)

# Transactional grievance submission
def submit_grievance_transaction(citizen_details: dict, constituency: str, ward_number: str, category: str, description: str, attachments: list, appointment_id: int = None) -> str:
    """
    Executes transaction to submit a grievance.
    Finds/updates or inserts citizen by mobile number.
    Inserts grievance, creates attachment records, and records initial status history.
    """
    global connection_pool
    if connection_pool is None:
        init_db_pool()
        if connection_pool is None:
            raise Exception("Database connection pool is not initialized.")
        
    try:
        conn = connection_pool.getconn()
    except Exception as pool_err:
        print(f"Error checking out connection for grievance submit, resetting pool: {pool_err}")
        init_db_pool()
        if connection_pool is None:
            raise Exception("Failed to reconnect database pool for transaction.")
        conn = connection_pool.getconn()
        
    conn.autocommit = False
    
    try:
        with conn.cursor() as cursor:
            # 1. Insert or select Citizen by mobile number
            cursor.execute(
                "SELECT id FROM citizens WHERE mobile_number = %s;",
                (citizen_details["mobile_number"],)
            )
            citizen = cursor.fetchone()
            if citizen:
                citizen_id = citizen[0]
                cursor.execute(
                    "UPDATE citizens SET full_name = %s, address = %s, email = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s;",
                    (citizen_details["full_name"], citizen_details["address"], citizen_details.get("email"), citizen_id)
                )
            else:
                cursor.execute(
                    "INSERT INTO citizens (full_name, mobile_number, address, email) VALUES (%s, %s, %s, %s) RETURNING id;",
                    (citizen_details["full_name"], citizen_details["mobile_number"], citizen_details["address"], citizen_details.get("email"))
                )
                citizen_id = cursor.fetchone()[0]
                
            # 2. Insert Grievance
            cursor.execute(
                """
                INSERT INTO grievances (citizen_id, appointment_id, constituency, ward_number, category, description, status)
                VALUES (%s, %s, %s, %s, %s, %s, 'PENDING')
                RETURNING id;
                """,
                (citizen_id, appointment_id, constituency, ward_number, category, description)
            )
            grievance_id = cursor.fetchone()[0]
            
            # 3. Insert Attachments
            for attachment in attachments:
                cursor.execute(
                    """
                    INSERT INTO grievance_attachments (grievance_id, file_type, file_url)
                    VALUES (%s, %s, %s);
                    """,
                    (grievance_id, attachment["file_type"], attachment["file_url"])
                )
                
            # 4. Insert Initial Status History
            cursor.execute(
                """
                INSERT INTO grievance_status_history (grievance_id, old_status, new_status, remarks)
                VALUES (%s, NULL, 'PENDING', 'Grievance submitted by citizen.');
                """,
                (grievance_id,)
            )
            
            # 5. Commit
            conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        connection_pool.putconn(conn)
    return grievance_id


# News CRUD operations

def get_all_news(only_active: bool = True):
    """Fetch all news items, ordered by date descending."""
    global connection_pool
    if connection_pool is None:
        init_db_pool()
        if connection_pool is None:
            raise Exception("Database connection pool is not initialized.")

    try:
        conn = connection_pool.getconn()
    except Exception as pool_err:
        init_db_pool()
        if connection_pool is None:
            raise Exception("Failed to reconnect database pool.")
        conn = connection_pool.getconn()

    try:
        with conn.cursor() as cursor:
            if only_active:
                cursor.execute(
                    "SELECT id, headline, description, category, date, is_active, created_at, updated_at FROM news WHERE is_active = TRUE ORDER BY date DESC, created_at DESC;"
                )
            else:
                cursor.execute(
                    "SELECT id, headline, description, category, date, is_active, created_at, updated_at FROM news ORDER BY date DESC, created_at DESC;"
                )
            rows = cursor.fetchall()
            return [
                {
                    "id": r[0],
                    "headline": r[1],
                    "description": r[2],
                    "category": r[3],
                    "date": r[4].isoformat() if r[4] else None,
                    "is_active": r[5],
                    "created_at": r[6].isoformat() if r[6] else None,
                    "updated_at": r[7].isoformat() if r[7] else None
                }
                for r in rows
            ]
    except Exception as e:
        raise e
    finally:
        connection_pool.putconn(conn)


def create_news(headline: str, description: str, category: str, date: str, admin_id: int) -> int:
    """Create a new news item."""
    global connection_pool
    if connection_pool is None:
        init_db_pool()
        if connection_pool is None:
            raise Exception("Database connection pool is not initialized.")

    try:
        conn = connection_pool.getconn()
    except Exception as pool_err:
        init_db_pool()
        if connection_pool is None:
            raise Exception("Failed to reconnect database pool.")
        conn = connection_pool.getconn()

    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO news (headline, description, category, date, created_by)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id;
                """,
                (headline, description, category, date, admin_id)
            )
            news_id = cursor.fetchone()[0]
            conn.commit()
            return news_id
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        connection_pool.putconn(conn)


def update_news(news_id: int, headline: str, description: str, category: str, date: str, is_active: bool) -> bool:
    """Update an existing news item."""
    global connection_pool
    if connection_pool is None:
        init_db_pool()
        if connection_pool is None:
            raise Exception("Database connection pool is not initialized.")

    try:
        conn = connection_pool.getconn()
    except Exception as pool_err:
        init_db_pool()
        if connection_pool is None:
            raise Exception("Failed to reconnect database pool.")
        conn = connection_pool.getconn()

    try:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                UPDATE news
                SET headline = %s, description = %s, category = %s, date = %s, is_active = %s, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s;
                """,
                (headline, description, category, date, is_active, news_id)
            )
            affected = cursor.rowcount
            conn.commit()
            return affected > 0
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        connection_pool.putconn(conn)


def delete_news(news_id: int) -> bool:
    """Delete a news item."""
    global connection_pool
    if connection_pool is None:
        init_db_pool()
        if connection_pool is None:
            raise Exception("Database connection pool is not initialized.")

    try:
        conn = connection_pool.getconn()
    except Exception as pool_err:
        init_db_pool()
        if connection_pool is None:
            raise Exception("Failed to reconnect database pool.")
        conn = connection_pool.getconn()

    try:
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM news WHERE id = %s;", (news_id,))
            affected = cursor.rowcount
            conn.commit()
            return affected > 0
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        connection_pool.putconn(conn)

# Update grievance status with status history logging
def update_grievance_status_transaction(grievance_id: str, new_status: str, remarks: str, admin_id: int) -> bool:
    """
    Updates the status of a grievance and writes a history audit log.
    """
    global connection_pool
    if connection_pool is None:
        init_db_pool()
        if connection_pool is None:
            raise Exception("Database connection pool is not initialized.")
            
    try:
        conn = connection_pool.getconn()
    except Exception as pool_err:
        init_db_pool()
        if connection_pool is None:
            raise Exception("Failed to reconnect database pool for transaction.")
        conn = connection_pool.getconn()
        
    conn.autocommit = False
    
    try:
        with conn.cursor() as cursor:
            # 1. Fetch current status
            cursor.execute("SELECT status FROM grievances WHERE id = %s FOR UPDATE;", (grievance_id,))
            row = cursor.fetchone()
            if not row:
                raise Exception("Grievance not found.")
            old_status = row[0]
            
            # 2. Update status and remarks/officer comments
            cursor.execute(
                """
                UPDATE grievances 
                SET status = %s, officer_comments = %s 
                WHERE id = %s;
                """,
                (new_status, remarks, grievance_id)
            )
            
            # 3. Add to status history
            cursor.execute(
                """
                INSERT INTO grievance_status_history (grievance_id, old_status, new_status, remarks, updated_by)
                VALUES (%s, %s, %s, %s, %s);
                """,
                (grievance_id, old_status, new_status, remarks, admin_id)
            )
            
            conn.commit()
            return True
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        connection_pool.putconn(conn)

def import_external_grievance_row(cursor, citizen_details: dict, grievance_details: dict, admin_id: int) -> str:
    """
    Imports a single grievance inside an active transaction cursor.
    Matches citizen by mobile number. Prevents duplicate imports by checking external_reference_id.
    """
    # 1. Citizen Match
    mobile = citizen_details["mobile_number"].strip()
    cursor.execute("SELECT id FROM citizens WHERE mobile_number = %s;", (mobile,))
    citizen = cursor.fetchone()
    if citizen:
        citizen_id = citizen[0]
        # Update full_name, address, email if provided
        cursor.execute(
            """
            UPDATE citizens 
            SET full_name = %s, 
                address = COALESCE(NULLIF(%s, ''), address), 
                email = COALESCE(NULLIF(%s, ''), email), 
                updated_at = CURRENT_TIMESTAMP 
            WHERE id = %s;
            """,
            (citizen_details["full_name"], citizen_details.get("address", ""), citizen_details.get("email", ""), citizen_id)
        )
    else:
        cursor.execute(
            """
            INSERT INTO citizens (full_name, mobile_number, address, email)
            VALUES (%s, %s, %s, %s)
            RETURNING id;
            """,
            (citizen_details["full_name"], mobile, citizen_details.get("address", ""), citizen_details.get("email", ""))
        )
        citizen_id = cursor.fetchone()[0]
        
    # 2. Check duplicate external reference
    ext_ref = grievance_details.get("external_reference_id")
    if ext_ref:
        cursor.execute("SELECT id FROM grievances WHERE external_reference_id = %s;", (ext_ref,))
        if cursor.fetchone():
            raise Exception(f"Grievance with external reference ID '{ext_ref}' has already been imported.")
            
    # 3. Insert Grievance
    cursor.execute(
        """
        INSERT INTO grievances (
            citizen_id, constituency, ward_number, category, description, 
            status, source_type, source_system, external_reference_id, received_at
        )
        VALUES (%s, 'Ambattur', %s, %s, %s, 'PENDING', 'MANUAL_IMPORT', 'CM_HELPLINE', %s, %s)
        RETURNING id;
        """,
        (
            citizen_id,
            grievance_details["ward_number"],
            grievance_details["category"],
            grievance_details["description"],
            ext_ref,
            grievance_details.get("received_at")
        )
    )
    grievance_id = cursor.fetchone()[0]
    
    # 4. Insert Audit History
    cursor.execute(
        """
        INSERT INTO grievance_status_history (grievance_id, old_status, new_status, remarks, updated_by)
        VALUES (%s, NULL, 'PENDING', 'Grievance imported from CM Helpline.', %s);
        """,
        (grievance_id, admin_id)
    )
    
    return grievance_id

