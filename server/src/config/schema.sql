CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'employee',
  otp_required_for_login BOOLEAN DEFAULT FALSE,
  avatar VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS departments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  employee_id VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) DEFAULT '',
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  department VARCHAR(255),
  designation VARCHAR(255),
  join_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) DEFAULT 'active',
  annual_salary NUMERIC DEFAULT 0,
  filing_status VARCHAR(50) DEFAULT 'unmarried',
  base_salary NUMERIC DEFAULT 0,
  gender VARCHAR(50) DEFAULT 'male',
  ssf_contributor BOOLEAN DEFAULT FALSE,
  cit_contribution NUMERIC DEFAULT 0,
  insurance_premium NUMERIC DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'Present',
  check_in TIMESTAMP,
  check_out TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(employee_id, date)
);

CREATE TABLE IF NOT EXISTS leave_requests (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
  type VARCHAR(50) DEFAULT 'Annual',
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  reason TEXT DEFAULT '',
  status VARCHAR(50) DEFAULT 'Pending',
  approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS document_requests (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
  requested_by_role VARCHAR(50) NOT NULL,
  type VARCHAR(255) NOT NULL,
  purpose TEXT DEFAULT '',
  status VARCHAR(50) DEFAULT 'Pending',
  reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP,
  rejection_reason TEXT DEFAULT '',
  generated_html TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS otps (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  purpose VARCHAR(50) DEFAULT 'login',
  is_used BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payrolls (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
  month VARCHAR(50) NOT NULL,
  annual_salary NUMERIC DEFAULT 0,
  basic NUMERIC NOT NULL,
  allowance NUMERIC DEFAULT 0,
  deductions NUMERIC DEFAULT 0,
  tax_deduction NUMERIC DEFAULT 0,
  other_deductions NUMERIC DEFAULT 0,
  attendance_days_in_month INT DEFAULT 0,
  present_days INT DEFAULT 0,
  half_day_present_days INT DEFAULT 0,
  absent_days INT DEFAULT 0,
  leave_days INT DEFAULT 0,
  wfh_days INT DEFAULT 0,
  per_day_salary NUMERIC DEFAULT 0,
  attendance_deduction NUMERIC DEFAULT 0,
  gross_pay NUMERIC DEFAULT 0,
  filing_status VARCHAR(50) DEFAULT 'unmarried',
  tax_meta JSONB DEFAULT '{}',
  net_pay NUMERIC NOT NULL,
  status VARCHAR(50) DEFAULT 'Processed',
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  payslip_html TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(employee_id, month)
);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'Info',
  read BOOLEAN DEFAULT FALSE,
  related_model VARCHAR(255),
  related_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS announcements (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'General',
  audience VARCHAR(50) DEFAULT 'All',
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  effective_from TIMESTAMP,
  effective_to TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS holidays (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  date DATE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  type VARCHAR(50) DEFAULT 'Public',
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  documentation TEXT DEFAULT '',
  manager_id INTEGER UNIQUE REFERENCES employees(id) ON DELETE SET NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS project_members (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  employee_id INTEGER UNIQUE REFERENCES employees(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  assigned_to INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'Todo',
  points INTEGER DEFAULT 1,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  progress_report TEXT DEFAULT '',
  progress_requested BOOLEAN DEFAULT FALSE,
  extension_requested BOOLEAN DEFAULT FALSE,
  extension_days INTEGER DEFAULT 0,
  extension_reason TEXT DEFAULT '',
  transfer_requested BOOLEAN DEFAULT FALSE,
  transfer_reason TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SaaS Expansion Tables
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS latitude NUMERIC;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS longitude NUMERIC;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS is_geofenced BOOLEAN DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS contracts (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'unsigned',
  signature_data TEXT DEFAULT '',
  signed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS okrs (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
  objective VARCHAR(255) NOT NULL,
  key_results TEXT NOT NULL,
  progress INTEGER DEFAULT 0,
  target_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  feedback TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS job_postings (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  department VARCHAR(255),
  location VARCHAR(200) DEFAULT '',
  status VARCHAR(50) DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS job_applications (
  id SERIAL PRIMARY KEY,
  job_id INTEGER REFERENCES job_postings(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  resume_url TEXT DEFAULT '',
  status VARCHAR(50) DEFAULT 'Applied',
  feedback TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shifts (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  notes TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Migration for existing databases
ALTER TABLE employees ADD COLUMN IF NOT EXISTS gender VARCHAR(50) DEFAULT 'male';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS ssf_contributor BOOLEAN DEFAULT FALSE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS cit_contribution NUMERIC DEFAULT 0;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS insurance_premium NUMERIC DEFAULT 0;

-- Enterprise Tables
CREATE TABLE IF NOT EXISTS expense_claims (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  amount NUMERIC NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT DEFAULT '',
  receipt_url TEXT DEFAULT '',
  status VARCHAR(50) DEFAULT 'Pending', -- Pending, Approved, Rejected
  reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP,
  rejection_reason TEXT DEFAULT '',
  month VARCHAR(50) NOT NULL, -- Format YYYY-MM
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assets (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  serial_number VARCHAR(255) UNIQUE NOT NULL,
  category VARCHAR(100) NOT NULL,
  assigned_to INTEGER REFERENCES employees(id) ON DELETE SET NULL,
  assigned_at TIMESTAMP,
  status VARCHAR(50) DEFAULT 'Available', -- Available, Assigned, Damaged, Under Repair
  notes TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS performance_reviews (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
  review_cycle VARCHAR(100) NOT NULL, -- e.g., '2026-H1'
  self_rating NUMERIC DEFAULT 0,
  self_feedback TEXT DEFAULT '',
  manager_rating NUMERIC DEFAULT 0,
  manager_feedback TEXT DEFAULT '',
  overall_rating NUMERIC DEFAULT 0,
  status VARCHAR(50) DEFAULT 'Pending Self', -- Pending Self, Pending Manager, Completed
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Migration for payrolls
ALTER TABLE payrolls ADD COLUMN IF NOT EXISTS ot_hours NUMERIC DEFAULT 0;
ALTER TABLE payrolls ADD COLUMN IF NOT EXISTS ot_pay NUMERIC DEFAULT 0;
ALTER TABLE payrolls ADD COLUMN IF NOT EXISTS festival_bonus NUMERIC DEFAULT 0;
ALTER TABLE payrolls ADD COLUMN IF NOT EXISTS reimbursement NUMERIC DEFAULT 0;
ALTER TABLE payrolls ADD COLUMN IF NOT EXISTS employer_ssf NUMERIC DEFAULT 0;

-- Drop constraints preventing multi-project assignment
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_manager_id_key CASCADE;
ALTER TABLE project_members DROP CONSTRAINT IF EXISTS project_members_employee_id_key CASCADE;

-- Meetings and Interview Scheduler
CREATE TABLE IF NOT EXISTS hr_meetings (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(50) DEFAULT 'Interview', -- Interview, Performance Review, Onboarding, Meeting
  employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE, -- Optional (for current employees)
  candidate_name VARCHAR(255) DEFAULT '', -- Optional (for new hire candidate interviews)
  conducted_by INTEGER REFERENCES employees(id) ON DELETE SET NULL, -- HR host/interviewer
  scheduled_at TIMESTAMP NOT NULL,
  status VARCHAR(50) DEFAULT 'Scheduled', -- Scheduled, Completed, Cancelled
  notes TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar VARCHAR(255);




