-- WIT-ERP Sprint 2: HR Module Schema
-- Run this in InsForge SQL Editor after 001_master_data.sql

-- ============================================
-- 1. USER PROFILES (Karyawan)
-- ============================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID, -- Auth user reference (nullable until auth setup)
  tenant_id UUID NOT NULL,
  entity_id UUID REFERENCES entities(id),
  department_id UUID REFERENCES departments(id),
  division_id UUID REFERENCES divisions(id),
  position_id UUID REFERENCES hr_positions(id),
  job_grade_id UUID REFERENCES hr_job_grades(id),
  work_shift_id UUID REFERENCES hr_work_shifts(id),
  employee_number VARCHAR(20) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100),
  phone VARCHAR(20),
  emergency_contact_name VARCHAR(100),
  emergency_contact_phone VARCHAR(20),
  address TEXT,
  city VARCHAR(50),
  date_of_birth DATE,
  gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
  religion VARCHAR(20),
  blood_type VARCHAR(5),
  marital_status VARCHAR(20) CHECK (marital_status IN ('single', 'married', 'divorced', 'widowed')),
  npwp VARCHAR(30),
  bpjs_tk_number VARCHAR(20),
  bpjs_kes_number VARCHAR(20),
  bank_name VARCHAR(50),
  bank_account_number VARCHAR(30),
  bank_account_name VARCHAR(100),
  employment_type VARCHAR(20) DEFAULT 'permanent' CHECK (employment_type IN ('permanent', 'contract', 'freelance', 'intern')),
  join_date DATE NOT NULL,
  end_date DATE,
  probation_end_date DATE,
  resignation_date DATE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'resigned', 'terminated')),
  profile_photo_url TEXT,
  documents JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  created_by UUID,
  updated_by UUID,
  
  UNIQUE(tenant_id, employee_number)
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_tenant ON user_profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_entity ON user_profiles(entity_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_dept ON user_profiles(department_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON user_profiles(status);

-- ============================================
-- 2. EMPLOYEE ALLOWANCES (Instance dari template)
-- ============================================

CREATE TABLE IF NOT EXISTS employee_allowances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  user_profile_id UUID NOT NULL REFERENCES user_profiles(id),
  salary_component_id UUID NOT NULL REFERENCES salary_components(id),
  amount NUMERIC(20,4) NOT NULL DEFAULT 0,
  effective_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  notes TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  created_by UUID,
  updated_by UUID
);

CREATE INDEX IF NOT EXISTS idx_emp_allowances_profile ON employee_allowances(user_profile_id);
CREATE INDEX IF NOT EXISTS idx_emp_allowances_component ON employee_allowances(salary_component_id);

-- ============================================
-- 3. ATTENDANCE RECORDS
-- ============================================

CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  user_profile_id UUID NOT NULL REFERENCES user_profiles(id),
  entity_id UUID REFERENCES entities(id),
  work_shift_id UUID REFERENCES hr_work_shifts(id),
  date DATE NOT NULL,
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  check_in_lat NUMERIC(10,7),
  check_in_lng NUMERIC(10,7),
  check_out_lat NUMERIC(10,7),
  check_out_lng NUMERIC(10,7),
  check_in_status VARCHAR(20) CHECK (check_in_status IN ('on_time', 'late', 'early')),
  check_out_status VARCHAR(20) CHECK (check_out_status IN ('on_time', 'overtime', 'early')),
  work_hours NUMERIC(4,2),
  overtime_hours NUMERIC(4,2) DEFAULT 0,
  is_holiday BOOLEAN DEFAULT FALSE,
  is_leave BOOLEAN DEFAULT FALSE,
  leave_type_id UUID REFERENCES hr_leave_types(id),
  notes TEXT,
  status VARCHAR(20) DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'leave', 'sick', 'permission')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID,
  
  UNIQUE(tenant_id, user_profile_id, date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_profile ON attendance_records(user_profile_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_records(date);
CREATE INDEX IF NOT EXISTS idx_attendance_entity ON attendance_records(entity_id);

-- ============================================
-- 4. LEAVE REQUESTS
-- ============================================

CREATE TABLE IF NOT EXISTS leave_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  user_profile_id UUID NOT NULL REFERENCES user_profiles(id),
  leave_type_id UUID NOT NULL REFERENCES hr_leave_types(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_requested INTEGER NOT NULL,
  reason TEXT,
  attachment_url TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  approved_by UUID REFERENCES user_profiles(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID
);

CREATE INDEX IF NOT EXISTS idx_leave_requests_profile ON leave_requests(user_profile_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_dates ON leave_requests(start_date, end_date);

-- ============================================
-- 5. OVERTIME REQUESTS
-- ============================================

CREATE TABLE IF NOT EXISTS overtime_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  user_profile_id UUID NOT NULL REFERENCES user_profiles(id),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  hours_requested NUMERIC(4,2) NOT NULL,
  reason TEXT,
  project_id UUID, -- Will link to projects table later
  is_holiday BOOLEAN DEFAULT FALSE,
  multiplier NUMERIC(3,2) DEFAULT 1.5 CHECK (multiplier IN (1.0, 1.5, 2.0, 3.0, 4.0)),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'paid')),
  approved_by UUID REFERENCES user_profiles(id),
  approved_at TIMESTAMPTZ,
  paid_amount NUMERIC(20,4),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID
);

CREATE INDEX IF NOT EXISTS idx_ot_requests_profile ON overtime_requests(user_profile_id);
CREATE INDEX IF NOT EXISTS idx_ot_requests_status ON overtime_requests(status);

-- ============================================
-- 6. PAYROLL PERIODS
-- ============================================

CREATE TABLE IF NOT EXISTS payroll_periods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  entity_id UUID REFERENCES entities(id),
  period_year INTEGER NOT NULL,
  period_month INTEGER NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  payment_date DATE,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'approved', 'paid', 'closed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID,
  
  UNIQUE(tenant_id, entity_id, period_year, period_month)
);

CREATE INDEX IF NOT EXISTS idx_payroll_periods_tenant ON payroll_periods(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payroll_periods_entity ON payroll_periods(entity_id);

-- ============================================
-- 7. PAYROLL DETAILS
-- ============================================

CREATE TABLE IF NOT EXISTS payroll_details (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  payroll_period_id UUID NOT NULL REFERENCES payroll_periods(id),
  user_profile_id UUID NOT NULL REFERENCES user_profiles(id),
  
  -- Basic Salary
  basic_salary NUMERIC(20,4) NOT NULL DEFAULT 0,
  
  -- Allowances (stored as JSON for flexibility)
  allowance_details JSONB DEFAULT '[]',
  total_allowances NUMERIC(20,4) DEFAULT 0,
  
  -- Deductions
  deduction_details JSONB DEFAULT '[]',
  total_deductions NUMERIC(20,4) DEFAULT 0,
  
  -- BPJS
  bpjs_tk_amount NUMERIC(20,4) DEFAULT 0,
  bpjs_kes_amount NUMERIC(20,4) DEFAULT 0,
  
  -- PPh 21
  pph21_amount NUMERIC(20,4) DEFAULT 0,
  pph21_method VARCHAR(20) CHECK (pph21_method IN ('gross', 'gross_up', 'net', 'ter')),
  
  -- Overtime
  overtime_hours NUMERIC(5,2) DEFAULT 0,
  overtime_amount NUMERIC(20,4) DEFAULT 0,
  
  -- Attendance deductions
  attendance_deduction_amount NUMERIC(20,4) DEFAULT 0,
  
  -- THR (prorated)
  thr_amount NUMERIC(20,4) DEFAULT 0,
  
  -- Totals
  gross_salary NUMERIC(20,4) DEFAULT 0,
  net_salary NUMERIC(20,4) DEFAULT 0,
  take_home_pay NUMERIC(20,4) DEFAULT 0,
  
  -- BOPP/TOPP
  is_bopp_eligible BOOLEAN DEFAULT FALSE,
  is_topp_eligible BOOLEAN DEFAULT FALSE,
  bopp_amount NUMERIC(20,4) DEFAULT 0,
  topp_amount NUMERIC(20,4) DEFAULT 0,
  
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'paid')),
  paid_at TIMESTAMPTZ,
  paid_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID,
  
  UNIQUE(payroll_period_id, user_profile_id)
);

CREATE INDEX IF NOT EXISTS idx_payroll_details_period ON payroll_details(payroll_period_id);
CREATE INDEX IF NOT EXISTS idx_payroll_details_profile ON payroll_details(user_profile_id);

-- ============================================
-- RLS ENABLE
-- ============================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_allowances ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE overtime_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_details ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies will be added after auth setup
