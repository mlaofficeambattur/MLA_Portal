-- Drop tables if they exist (for easy resetting/seeding)
DROP TABLE IF EXISTS news CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS grievance_attachments CASCADE;
DROP TABLE IF EXISTS grievance_status_history CASCADE;
DROP TABLE IF EXISTS grievances CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS slots CASCADE;
DROP TABLE IF EXISTS availability CASCADE;
DROP TABLE IF EXISTS citizens CASCADE;
DROP TABLE IF EXISTS admins CASCADE;

-- Table: admins
CREATE TABLE admins (
    id SERIAL PRIMARY KEY,
    supabase_user_id UUID UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'OFFICE_STAFF' NOT NULL, -- 'SUPER_ADMIN', 'OFFICE_STAFF', 'MLA_ASSISTANT', 'READ_ONLY', 'WARD_MEMBER', 'COUNSELOR'
    designation VARCHAR(100),
    ward VARCHAR(50),
    action VARCHAR(10) DEFAULT 'Read' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: citizens
CREATE TABLE citizens (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(200) NOT NULL,
    mobile_number VARCHAR(15) UNIQUE NOT NULL,
    address TEXT,
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: availability
CREATE TABLE availability (
    id SERIAL PRIMARY KEY,
    available_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_duration INTEGER NOT NULL, -- duration in minutes
    created_by INTEGER REFERENCES admins(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: slots
CREATE TABLE slots (
    id SERIAL PRIMARY KEY,
    availability_id INTEGER REFERENCES availability(id) ON DELETE CASCADE,
    slot_start TIMESTAMP NOT NULL,
    slot_end TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'AVAILABLE', -- 'AVAILABLE', 'BOOKED', 'BLOCKED'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: appointments
CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    citizen_id INTEGER REFERENCES citizens(id) ON DELETE CASCADE,
    slot_id INTEGER REFERENCES slots(id) ON DELETE SET NULL,
    purpose TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'PENDING', -- 'PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW', 'RESCHEDULED'
    token_number VARCHAR(50),
    aadhaar_number VARCHAR(12),
    ward_number VARCHAR(50),
    grievance_category VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: grievances
CREATE TABLE grievances (
    id_seq SERIAL UNIQUE,
    id TEXT GENERATED ALWAYS AS ('AMB-GID-' || id_seq::text) STORED PRIMARY KEY,
    citizen_id INTEGER REFERENCES citizens(id) ON DELETE CASCADE,
    appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL, -- Optional linkage
    constituency VARCHAR(100) DEFAULT 'Ambattur' NOT NULL,
    ward_number VARCHAR(50) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'PENDING' NOT NULL, -- 'PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'
    assigned_officer VARCHAR(100),
    officer_comments TEXT,
    source_type VARCHAR(50) DEFAULT 'DIRECT_PORTAL' NOT NULL, -- 'DIRECT_PORTAL', 'MANUAL_IMPORT'
    source_system VARCHAR(100), -- e.g. 'CM_HELPLINE'
    external_reference_id VARCHAR(100),
    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);


-- Table: grievance_status_history (Audit Trail)
CREATE TABLE grievance_status_history (
    id SERIAL PRIMARY KEY,
    grievance_id TEXT REFERENCES grievances(id) ON DELETE CASCADE,
    old_status VARCHAR(30),
    new_status VARCHAR(30),
    remarks TEXT,
    updated_by INTEGER REFERENCES admins(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Table: grievance_attachments (Scalable Media Attachments)
CREATE TABLE grievance_attachments (
    id SERIAL PRIMARY KEY,
    grievance_id TEXT REFERENCES grievances(id) ON DELETE CASCADE,
    file_type VARCHAR(20) NOT NULL, -- 'IMAGE', 'VIDEO', 'DOCUMENT'
    file_url TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Table: notifications (Future Message Dispatch Queue)
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    citizen_id INTEGER REFERENCES citizens(id) ON DELETE CASCADE,
    notification_type VARCHAR(50),
    channel VARCHAR(20), -- 'SMS', 'EMAIL', 'IN_APP'
    title TEXT,
    message TEXT,
    status VARCHAR(20) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Table: notification_logs (SMS Dispatch Logs)
CREATE TABLE notification_logs (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING' NOT NULL,
    provider VARCHAR(50) DEFAULT 'MOCK' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    sent_at TIMESTAMP
);

-- Table: news (Daily News & Notifications)
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

-- Table: namma_mla_uploads (Upload history logging)
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

-- Table: namma_mla_complaints (Imported daily complaints from external app)
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


