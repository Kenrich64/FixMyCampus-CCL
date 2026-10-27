-- FixMyCampus PostgreSQL Schema
-- Migration 001: Initial Schema

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. Sequence for Complaint Reference Number
CREATE SEQUENCE IF NOT EXISTS complaint_ref_seq START WITH 1;

-- 3. Complaints Table
CREATE TABLE IF NOT EXISTS complaints (
    id SERIAL PRIMARY KEY,
    reference_number VARCHAR(30) NOT NULL UNIQUE,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(60) NOT NULL CHECK (category IN (
        'Classroom equipment',
        'Laboratory equipment',
        'Electrical problems',
        'Plumbing and sanitation',
        'Hostel maintenance',
        'Wi-Fi and network connectivity',
        'Furniture damage',
        'Cleanliness',
        'Safety and infrastructure',
        'Other'
    )),
    location VARCHAR(150) NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'rejected')),
    student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    assigned_to VARCHAR(150) DEFAULT NULL,
    evidence_s3_key VARCHAR(500) DEFAULT NULL,
    resolution_note TEXT DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_complaints_student_id ON complaints(student_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_priority ON complaints(priority);
CREATE INDEX IF NOT EXISTS idx_complaints_category ON complaints(category);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON complaints(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_complaints_reference ON complaints(reference_number);

-- 4. Complaint History Table (Audit Trail / Timeline)
CREATE TABLE IF NOT EXISTS complaint_history (
    id SERIAL PRIMARY KEY,
    complaint_id INTEGER NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    changed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    changed_by_name VARCHAR(120) NOT NULL,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN (
        'submitted',
        'status_changed',
        'priority_changed',
        'assigned',
        'note_added',
        'evidence_uploaded'
    )),
    old_value VARCHAR(255) DEFAULT NULL,
    new_value VARCHAR(255) DEFAULT NULL,
    note TEXT DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_history_complaint_id ON complaint_history(complaint_id);
CREATE INDEX IF NOT EXISTS idx_history_created_at ON complaint_history(created_at ASC);
