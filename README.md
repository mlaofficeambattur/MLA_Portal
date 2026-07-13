# MLA Citizen Portal & Namma MLA Analytics System

A comprehensive web portal for the MLA Ambattur constituency. It allows citizens to book consultations, raise public grievances online, and provides an admin-only Management Information System (MIS) dashboard to analyze external daily sheets imported from the Namma MLA App.

## Tech Stack

*   **Frontend**: React + Vite (Tailwind/Vanilla CSS, Lucide icons, Recharts)
*   **Backend**: FastAPI (Python 3.10+)
*   **Database**: PostgreSQL (hosted on Supabase)
*   **Storage & Auth**: Supabase Storage (for attachments) & Supabase JWT Auth
*   **SMS Gateway**: MSG91 (optional flow notifications)

---

## Features

1.  📅 **Citizen Appointment Booking**: Slot-based schedule management.
2.  📋 **Grievance Intake**: Online complaint filing with support for multimedia attachments.
3.  📊 **Namma MLA Complaint Analytics**:
    *   **Drag & Drop Daily Import**: Excel sheet validation for duplicate entries, missing required fields, and format errors.
    *   **MIS Executive Dashboard**: Professional KPI counters, daily trend lines, category donut distributions, officer workloads, and ward heatmaps.
    *   **Drill Down Mechanics**: Click any chart segment to view the detailed paginated list of matching complaints.
    *   **Leaderboard**: Track officer ranks based on resolution speed and completion rates.
    *   **Data Center**: Export filtered logs to CSV and print dashboard summaries.

---

## Getting Started

### Prerequisites
*   Node.js (version 18+)
*   Python (version 3.10+)
*   Supabase Project (PostgreSQL database, Auth configurations, and a Storage bucket named `grievance-attachments` set to public access).

---

### Backend Setup

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Create and activate a clean Python virtual environment:
    ```bash
    python3 -m venv venv
    source venv/bin/activate
    ```
3.  Install dependencies:
    ```bash
    pip install --upgrade pip
    pip install -r requirements.txt
    ```
4.  Configure the environment variables:
    ```bash
    cp .env.example .env
    # Edit the created .env file with your database parameters and Supabase keys
    ```
5.  Start the FastAPI local development server:
    ```bash
    uvicorn main:app --reload --host 127.0.0.1 --port 8000
    ```
    *Note: Table schemas for appointments, grievances, SMS logs, and Namma MLA analytics will be automatically initialized or updated on server start.*

---

### Frontend Setup

1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies (includes Recharts and Lucide icons):
    ```bash
    npm install --legacy-peer-deps
    ```
3.  Configure the environment variables:
    ```bash
    cp .env.example .env
    # Verify VITE_API_BASE points to http://localhost:8000/api
    ```
4.  Start the Vite dev server:
    ```bash
    npm run dev -- --host 127.0.0.1 --port 5173
    ```

---

## Environment Variable Schema

### Backend Environment Variables (`backend/.env`)

Ensure the following keys are populated:
*   `DB_HOST`: Supabase PostgreSQL pooler address
*   `DB_PORT`: PostgreSQL connection port (typically `6543`)
*   `DB_NAME`: Target database name (e.g. `postgres`)
*   `DB_USER`: Database login user
*   `DB_PASS`: Database login password
*   `JWT_SECRET`: HS256 secret key for signing API sessions
*   `SUPABASE_URL`: Supabase project URL
*   `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role API key
*   `SMS_PROVIDER`: Set to `msg91` to dispatch real messages, or `mock` to print notifications to the console.

### Frontend Environment Variables (`frontend/.env`)
*   `VITE_API_BASE`: Endpoint URL of the running FastAPI server (`http://localhost:8000/api`).

---

## License

This system is maintained by the MLA Office, Ambattur Constituency.

