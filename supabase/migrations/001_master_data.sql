-- WIT-ERP Master Data Schema
-- Sprint 1: Entity, Organization, Calendar, Payroll Config
-- Run this in InsForge SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. ENTITIES (Cabang/Unit Bisnis)
-- ============================================

CREATE TABLE IF NOT EXISTS entities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  code VARCHAR(20) NOT NULL,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) DEFAULT 'branch' CHECK (type IN ('branch', 'unit_business', 'subsidiary')),
  address TEXT,
  city VARCHAR(50),
  province VARCHAR(50),
  phone VARCHAR(20),
  email VARCHAR(100),
  npwp VARCHAR(30),
  bpjs_tk_number VARCHAR(20),
  bpjs_kes_number VARCHAR(20),
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  radius_meters INTEGER DEFAULT 100 CHECK (radius_meters BETWEEN 10 AND 500),
  grace_period_minutes INTEGER DEFAULT 15 CHECK (grace_period_minutes BETWEEN 0 AND 60),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  created_by UUID,
  updated_by UUID,
  
  UNIQUE(tenant_id, code)
);

-- Index for entities
CREATE INDEX IF NOT EXISTS idx_entities_tenant ON entities(tenant_id);
CREATE INDEX IF NOT EXISTS idx_entities_status ON entities(status);
CREATE INDEX IF NOT EXISTS idx_entities_code ON entities(code);

-- ============================================
-- 2. DEPARTMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  entity_id UUID REFERENCES entities(id),
  code VARCHAR(20) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  manager_id UUID, -- Will be updated after user_profiles created
  cost_center VARCHAR(50),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  created_by UUID,
  updated_by UUID,
  
  UNIQUE(tenant_id, code)
);

CREATE INDEX IF NOT EXISTS idx_departments_tenant ON departments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_departments_entity ON departments(entity_id);

-- ============================================
-- 3. DIVISIONS (Sub-departemen, nullable parent)
-- ============================================

CREATE TABLE IF NOT EXISTS divisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  department_id UUID NOT NULL REFERENCES departments(id),
  code VARCHAR(20) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  created_by UUID,
  updated_by UUID,
  
  UNIQUE(tenant_id, department_id, code)
);

CREATE INDEX IF NOT EXISTS idx_divisions_tenant ON divisions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_divisions_department ON divisions(department_id);

-- ============================================
-- 4. HR POSITIONS (Jabatan)
-- ============================================

CREATE TABLE IF NOT EXISTS hr_positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  entity_id UUID REFERENCES entities(id),
  code VARCHAR(20) NOT NULL,
  name VARCHAR(100) NOT NULL,
  level INTEGER DEFAULT 1 CHECK (level BETWEEN 1 AND 10),
  description TEXT,
  responsibilities TEXT[],
  requirements TEXT[],
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  created_by UUID,
  updated_by UUID,
  
  UNIQUE(tenant_id, code)
);

CREATE INDEX IF NOT EXISTS idx_hr_positions_tenant ON hr_positions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_hr_positions_entity ON hr_positions(entity_id);

-- ============================================
-- 5. HR JOB GRADES
-- ============================================

CREATE TABLE IF NOT EXISTS hr_job_grades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  code VARCHAR(20) NOT NULL,
  name VARCHAR(100) NOT NULL,
  level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 10),
  description TEXT,
  min_salary NUMERIC(20,4),
  max_salary NUMERIC(20,4),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  created_by UUID,
  updated_by UUID,
  
  UNIQUE(tenant_id, code)
);

CREATE INDEX IF NOT EXISTS idx_hr_job_grades_tenant ON hr_job_grades(tenant_id);

-- ============================================
-- 6. SALARY COMPONENTS (Template)
-- ============================================

CREATE TABLE IF NOT EXISTS salary_components (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  entity_id UUID REFERENCES entities(id), -- NULL = global tenant
  code VARCHAR(20) NOT NULL,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) CHECK (type IN ('earning', 'deduction')),
  is_taxable BOOLEAN DEFAULT TRUE,
  is_fixed BOOLEAN DEFAULT TRUE,
  default_amount NUMERIC(20,4) DEFAULT 0,
  calculation_type VARCHAR(20) DEFAULT 'fixed' CHECK (calculation_type IN ('fixed', 'percentage', 'formula')),
  affects_thp BOOLEAN DEFAULT TRUE,
  affects_topp BOOLEAN DEFAULT FALSE,
  description TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  created_by UUID,
  updated_by UUID,
  
  UNIQUE(tenant_id, code)
);

CREATE INDEX IF NOT EXISTS idx_salary_components_tenant ON salary_components(tenant_id);
CREATE INDEX IF NOT EXISTS idx_salary_components_type ON salary_components(type);

-- ============================================
-- 7. SALARY MATRIX
-- ============================================

CREATE TABLE IF NOT EXISTS salary_matrix (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  entity_id UUID REFERENCES entities(id),
  job_grade_id UUID NOT NULL REFERENCES hr_job_grades(id),
  step INTEGER NOT NULL CHECK (step > 0),
  amount NUMERIC(20,4) NOT NULL CHECK (amount >= 0),
  effective_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  created_by UUID,
  updated_by UUID,
  
  UNIQUE(tenant_id, job_grade_id, step, effective_date)
);

CREATE INDEX IF NOT EXISTS idx_salary_matrix_tenant ON salary_matrix(tenant_id);
CREATE INDEX IF NOT EXISTS idx_salary_matrix_grade ON salary_matrix(job_grade_id);
CREATE INDEX IF NOT EXISTS idx_salary_matrix_effective ON salary_matrix(effective_date);

-- ============================================
-- 8. WORK SHIFTS
-- ============================================

CREATE TABLE IF NOT EXISTS hr_work_shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  entity_id UUID REFERENCES entities(id),
  code VARCHAR(20) NOT NULL,
  name VARCHAR(100) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  grace_period_minutes INTEGER DEFAULT 15 CHECK (grace_period_minutes BETWEEN 0 AND 60),
  break_duration_minutes INTEGER DEFAULT 60,
  is_night_shift BOOLEAN DEFAULT FALSE,
  description TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  created_by UUID,
  updated_by UUID,
  
  UNIQUE(tenant_id, code),
  CONSTRAINT chk_shift_times CHECK (start_time < end_time)
);

CREATE INDEX IF NOT EXISTS idx_hr_work_shifts_tenant ON hr_work_shifts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_hr_work_shifts_entity ON hr_work_shifts(entity_id);

-- ============================================
-- 9. WORK CALENDARS (Holidays)
-- ============================================

CREATE TABLE IF NOT EXISTS hr_work_calendars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  entity_id UUID REFERENCES entities(id),
  date DATE NOT NULL,
  is_holiday BOOLEAN DEFAULT FALSE,
  holiday_name VARCHAR(100),
  holiday_type VARCHAR(20) CHECK (holiday_type IN ('national', 'company', 'cuti_bersama')),
  work_shift_id UUID REFERENCES hr_work_shifts(id),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  created_by UUID,
  updated_by UUID,
  
  UNIQUE(tenant_id, entity_id, date)
);

CREATE INDEX IF NOT EXISTS idx_hr_work_calendars_tenant ON hr_work_calendars(tenant_id);
CREATE INDEX IF NOT EXISTS idx_hr_work_calendars_date ON hr_work_calendars(date);
CREATE INDEX IF NOT EXISTS idx_hr_work_calendars_entity_date ON hr_work_calendars(entity_id, date);

-- ============================================
-- 10. LEAVE TYPES
-- ============================================

CREATE TABLE IF NOT EXISTS hr_leave_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  code VARCHAR(20) NOT NULL,
  name VARCHAR(100) NOT NULL,
  days_per_year INTEGER DEFAULT 0,
  carry_over_allowed BOOLEAN DEFAULT FALSE,
  max_carry_over_days INTEGER DEFAULT 0,
  min_service_months INTEGER DEFAULT 0,
  is_paid BOOLEAN DEFAULT TRUE,
  requires_approval BOOLEAN DEFAULT TRUE,
  approval_levels INTEGER DEFAULT 1 CHECK (approval_levels BETWEEN 1 AND 3),
  description TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  created_by UUID,
  updated_by UUID,
  
  UNIQUE(tenant_id, code)
);

CREATE INDEX IF NOT EXISTS idx_hr_leave_types_tenant ON hr_leave_types(tenant_id);

-- ============================================
-- 11. BOPP CATEGORIES
-- ============================================

CREATE TABLE IF NOT EXISTS bopp_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  code VARCHAR(20) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  created_by UUID,
  updated_by UUID,
  
  UNIQUE(tenant_id, code)
);

CREATE INDEX IF NOT EXISTS idx_bopp_categories_tenant ON bopp_categories(tenant_id);

-- ============================================
-- 12. BOPP FORMULAS
-- ============================================

CREATE TABLE IF NOT EXISTS bopp_formulas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  category_id UUID REFERENCES bopp_categories(id),
  name VARCHAR(100) NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  marketing_percent NUMERIC(5,2) DEFAULT 0 CHECK (marketing_percent BETWEEN 0 AND 100),
  se_percent NUMERIC(5,2) DEFAULT 0 CHECK (se_percent BETWEEN 0 AND 100),
  management_percent NUMERIC(5,2) DEFAULT 0 CHECK (management_percent BETWEEN 0 AND 100),
  tech_percent NUMERIC(5,2) DEFAULT 0 CHECK (tech_percent BETWEEN 0 AND 100),
  operational_percent NUMERIC(5,2) DEFAULT 0 CHECK (operational_percent BETWEEN 0 AND 100),
  description TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  created_by UUID,
  updated_by UUID,
  
  CONSTRAINT chk_bopp_percentages CHECK (
    marketing_percent + se_percent + management_percent + 
    tech_percent + operational_percent <= 100
  )
);

CREATE INDEX IF NOT EXISTS idx_bopp_formulas_tenant ON bopp_formulas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bopp_formulas_category ON bopp_formulas(category_id);

-- ============================================
-- SEED DATA
-- ============================================

-- Insert default leave types
INSERT INTO hr_leave_types (tenant_id, code, name, days_per_year, carry_over_allowed, max_carry_over_days, description)
VALUES 
  ('00000000-0000-0000-0000-000000000000', 'ANNUAL', 'Cuti Tahunan', 12, true, 6, 'Cuti tahunan sesuai UU'),
  ('00000000-0000-0000-0000-000000000000', 'SICK', 'Cuti Sakit', 0, false, 0, 'Cuti sakit tanpa batas (dengan surat dokter)'),
  ('00000000-0000-0000-0000-000000000000', 'MATERNITY', 'Cuti Melahirkan', 90, false, 0, 'Cuti melahirkan untuk karyawan wanita'),
  ('00000000-0000-0000-0000-000000000000', 'PATERNITY', 'Cuti Ayah', 3, false, 0, 'Cuti ayah untuk karyawan pria'),
  ('00000000-0000-0000-0000-000000000000', 'MARRIAGE', 'Cuti Menikah', 3, false, 0, 'Cuti untuk acara pernikahan'),
  ('00000000-0000-0000-0000-000000000000', 'BEREAVEMENT', 'Cuti Duka', 3, false, 0, 'Cuti duka cita'),
  ('00000000-0000-0000-0000-000000000000', 'UNPAID', 'Cuti Tidak Dibayar', 0, false, 0, 'Cuti tanpa gaji')
ON CONFLICT DO NOTHING;

-- Insert default BOPP categories
INSERT INTO bopp_categories (tenant_id, code, name, description)
VALUES 
  ('00000000-0000-0000-0000-000000000000', 'WEBSITE', 'Website Development', 'Pengembangan website dan web application'),
  ('00000000-0000-0000-0000-000000000000', 'MOBILE_APP', 'Mobile App Development', 'Pengembangan aplikasi mobile iOS/Android'),
  ('00000000-0000-0000-0000-000000000000', 'CUSTOM_SOFTWARE', 'Custom Software', 'Pengembangan software custom'),
  ('00000000-0000-0000-0000-000000000000', 'CONSULTING', 'IT Consulting', 'Konsultasi IT dan business analysis'),
  ('00000000-0000-0000-0000-000000000000', 'MAINTENANCE', 'Maintenance', 'Maintenance dan support berkala')
ON CONFLICT DO NOTHING;

-- Insert default salary components
INSERT INTO salary_components (tenant_id, code, name, type, is_taxable, is_fixed, affects_thp, description)
VALUES 
  ('00000000-0000-0000-0000-000000000000', 'BASIC', 'Gaji Pokok', 'earning', true, true, true, 'Gaji pokok karyawan'),
  ('00000000-0000-0000-0000-000000000000', 'JABATAN', 'Tunjangan Jabatan', 'earning', true, true, true, 'Tunjangan berdasarkan jabatan'),
  ('00000000-0000-0000-0000-000000000000', 'TRANSP', 'Tunjangan Transportasi', 'earning', false, true, true, 'Tunjangan transportasi'),
  ('00000000-0000-0000-0000-000000000000', 'KOMUNI', 'Tunjangan Komunikasi', 'earning', false, true, true, 'Tunjangan pulsa/telepon'),
  ('00000000-0000-0000-0000-000000000000', 'KEHADIR', 'Tunjangan Kehadiran', 'earning', false, true, true, 'Tunjangan kehadiran'),
  ('00000000-0000-0000-0000-000000000000', 'KES', 'Tunjangan Kesehatan', 'earning', false, true, true, 'Tunjangan kesehatan'),
  ('00000000-0000-0000-0000-000000000000', 'BPJS_TK', 'Potongan BPJS TK', 'deduction', false, true, true, 'Potongan BPJS Ketenagakerjaan'),
  ('00000000-0000-0000-0000-000000000000', 'BPJS_KES', 'Potongan BPJS Kesehatan', 'deduction', false, true, true, 'Potongan BPJS Kesehatan'),
  ('00000000-0000-0000-0000-000000000000', 'PPH21', 'Potongan PPh 21', 'deduction', false, true, true, 'Potongan pajak penghasilan')
ON CONFLICT DO NOTHING;

-- ============================================
-- RLS POLICIES (Enable after tables created)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE divisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_job_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_matrix ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_work_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_work_calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE bopp_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE bopp_formulas ENABLE ROW LEVEL SECURITY;

-- Note: Actual RLS policies will be added based on auth setup
-- For now, tables are created with RLS enabled but no policies
