-- ============================================================
-- HONTECH AUTOCENTER - SUPABASE CLOUD POSTGRESQL SCHEMA
-- Compatible with: Supabase PostgreSQL & Realtime WebSockets
-- Target Architecture: Vercel (Edge CDN) + Supabase (Serverless BaaS)
-- ============================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 2. USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'assistant' CHECK (role IN ('owner', 'admin', 'assistant', 'sa')),
    branch VARCHAR(100) NOT NULL DEFAULT 'Branch A',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Password Reset / Google / Backup
    reset_password_token VARCHAR(255) DEFAULT NULL,
    reset_password_expires TIMESTAMPTZ DEFAULT NULL,
    google_id VARCHAR(255) UNIQUE DEFAULT NULL,
    google_email VARCHAR(255) DEFAULT NULL,
    backup_email VARCHAR(255) DEFAULT NULL,
    backup_email_otp VARCHAR(10) DEFAULT NULL,
    backup_email_otp_expires TIMESTAMPTZ DEFAULT NULL,
    
    -- MFA & Status
    mfa_secret VARCHAR(255) DEFAULT NULL,
    mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    backup_codes TEXT DEFAULT NULL,
    is_online BOOLEAN NOT NULL DEFAULT FALSE,
    last_active TIMESTAMPTZ DEFAULT NULL,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. JOBS TABLE (Active & Historical Repair Queue)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.jobs (
    id SERIAL PRIMARY KEY,
    job_id VARCHAR(50) NOT NULL UNIQUE,
    source VARCHAR(20) NOT NULL DEFAULT 'Walk-in' CHECK (source IN ('Walk-in', 'Online')),
    plate VARCHAR(20) NOT NULL,
    name VARCHAR(255) NOT NULL,
    contact VARCHAR(50) DEFAULT NULL,
    vehicle VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    concern TEXT DEFAULT NULL,
    
    -- Workshop Bay & Lane Allocation
    lane_type VARCHAR(50) NOT NULL DEFAULT '',
    bay_assigned INT DEFAULT NULL,
    location VARCHAR(50) NOT NULL DEFAULT 'None',
    branch VARCHAR(50) NOT NULL DEFAULT 'Branch A',
    
    -- Scheduling & Intake Times
    date_received DATE NOT NULL DEFAULT CURRENT_DATE,
    arrival VARCHAR(10) NOT NULL DEFAULT '',
    departure VARCHAR(10) NOT NULL DEFAULT '',
    appt_date DATE DEFAULT NULL,
    appt_time VARCHAR(10) NOT NULL DEFAULT '',
    confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Tracking & Statuses
    claim_stub VARCHAR(30) NOT NULL DEFAULT '',
    parts_available VARCHAR(20) NOT NULL DEFAULT 'Pending',
    evaluation TEXT NOT NULL DEFAULT '',
    status VARCHAR(50) NOT NULL DEFAULT 'Pending',
    promised_date DATE DEFAULT NULL,
    carry_over_status VARCHAR(255) NOT NULL DEFAULT '',
    remarks TEXT NOT NULL DEFAULT '',
    sa_name VARCHAR(255) NOT NULL DEFAULT '',
    
    -- 2-Hour SLA & Recommendations
    goal_status VARCHAR(20) NOT NULL DEFAULT 'N/A',
    recommendation VARCHAR(30) NOT NULL DEFAULT 'None',
    recommendation_notes TEXT NOT NULL DEFAULT '',
    
    -- Completion & Timestamps
    date_completed DATE DEFAULT NULL,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 4. 2-HOUR EXPRESS DELAY ISSUES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.express_lane_issues (
    id SERIAL PRIMARY KEY,
    job_id VARCHAR(50) NOT NULL,
    plate VARCHAR(20) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    vehicle VARCHAR(255) NOT NULL,
    sa_name VARCHAR(255) NOT NULL,
    arrival_time VARCHAR(10) NOT NULL,
    elapsed_minutes INT NOT NULL DEFAULT 0,
    reason_category VARCHAR(100) NOT NULL,
    reason_details TEXT NOT NULL,
    reported_by_id INT DEFAULT NULL,
    reported_by_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 5. JOB AUDIT LOGS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.job_audit_logs (
    id SERIAL PRIMARY KEY,
    job_id VARCHAR(50) NOT NULL,
    plate VARCHAR(20) NOT NULL,
    field_name VARCHAR(100) NOT NULL,
    old_value TEXT DEFAULT NULL,
    new_value TEXT DEFAULT NULL,
    edit_reason TEXT NOT NULL,
    edited_by_id INT DEFAULT NULL,
    edited_by_name VARCHAR(255) NOT NULL,
    edited_by_role VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 6. PERFORMANCE INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs (status);
CREATE INDEX IF NOT EXISTS idx_jobs_branch ON public.jobs (branch);
CREATE INDEX IF NOT EXISTS idx_jobs_date_received ON public.jobs (date_received);
CREATE INDEX IF NOT EXISTS idx_jobs_plate ON public.jobs (plate);
CREATE INDEX IF NOT EXISTS idx_jobs_claim_stub ON public.jobs (claim_stub);
CREATE INDEX IF NOT EXISTS idx_jobs_is_deleted ON public.jobs (is_deleted);

-- ============================================================
-- 7. ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================================
-- Enable RLS on all tables
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.express_lane_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_audit_logs ENABLE ROW LEVEL SECURITY;

-- JOBS POLICIES:
-- Allow anyone (including Lounge TV display) to view active non-deleted jobs
CREATE POLICY "Allow public read jobs" ON public.jobs
    FOR SELECT USING (true);

-- Allow inserting new intakes
CREATE POLICY "Allow insert jobs" ON public.jobs
    FOR INSERT WITH CHECK (true);

-- Allow updates (bays, status, notes)
CREATE POLICY "Allow update jobs" ON public.jobs
    FOR UPDATE USING (true) WITH CHECK (true);

-- No hard delete policy! (Protects against accidental mass deletion)

-- USERS POLICIES:
CREATE POLICY "Allow read users" ON public.users
    FOR SELECT USING (true);

CREATE POLICY "Allow update users" ON public.users
    FOR UPDATE USING (true) WITH CHECK (true);

-- AUDIT LOGS POLICIES:
CREATE POLICY "Allow read audit logs" ON public.job_audit_logs
    FOR SELECT USING (true);

CREATE POLICY "Allow insert audit logs" ON public.job_audit_logs
    FOR INSERT WITH CHECK (true);

-- EXPRESS LANE ISSUES POLICIES:
CREATE POLICY "Allow read express issues" ON public.express_lane_issues
    FOR SELECT USING (true);

CREATE POLICY "Allow insert express issues" ON public.express_lane_issues
    FOR INSERT WITH CHECK (true);

-- ============================================================
-- 8. REALTIME REPLICATION (Waiting Lounge Live WebSocket Sync)
-- ============================================================
-- Enables instant live push notifications on table updates (~50ms latency)
ALTER PUBLICATION supabase_realtime ADD TABLE public.jobs;

-- ============================================================
-- 9. DEFAULT SEED USERS (For Immediate Staging Testing)
-- Password for all seed users is: password123
-- (Bcrypt hash: $2y$10$wT0vVbQxJb90zJk12.1e.OzNqZ73XW3XU2O7h2z5s8T5a1m6d5d5a)
-- ============================================================
INSERT INTO public.users (name, email, password, role, branch, is_active)
VALUES 
    ('HonTech Owner', 'owner@hontech.ph', '$2y$10$wT0vVbQxJb90zJk12.1e.OzNqZ73XW3XU2O7h2z5s8T5a1m6d5d5a', 'owner', 'Marikina Branch', TRUE),
    ('System Admin', 'admin@hontech.ph', '$2y$10$wT0vVbQxJb90zJk12.1e.OzNqZ73XW3XU2O7h2z5s8T5a1m6d5d5a', 'admin', 'Marikina Branch', TRUE),
    ('Lead Advisor', 'sa@hontech.ph', '$2y$10$wT0vVbQxJb90zJk12.1e.OzNqZ73XW3XU2O7h2z5s8T5a1m6d5d5a', 'sa', 'Marikina Branch', TRUE),
    ('Front Desk', 'assistant@hontech.ph', '$2y$10$wT0vVbQxJb90zJk12.1e.OzNqZ73XW3XU2O7h2z5s8T5a1m6d5d5a', 'assistant', 'Marikina Branch', TRUE)
ON CONFLICT (email) DO NOTHING;
