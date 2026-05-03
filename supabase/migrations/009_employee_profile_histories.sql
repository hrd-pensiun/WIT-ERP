ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS ptkp_status VARCHAR(10) NOT NULL DEFAULT 'TK/0',
  ADD COLUMN IF NOT EXISTS tax_position VARCHAR(20) NOT NULL DEFAULT 'staff';

ALTER TABLE user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_ptkp_status_check;
ALTER TABLE user_profiles
  ADD CONSTRAINT user_profiles_ptkp_status_check
  CHECK (ptkp_status IN ('TK/0', 'TK/1', 'TK/2', 'TK/3', 'K/0', 'K/1', 'K/2', 'K/3', 'K/I/0', 'K/I/1', 'K/I/2', 'K/I/3'));

ALTER TABLE user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_tax_position_check;
ALTER TABLE user_profiles
  ADD CONSTRAINT user_profiles_tax_position_check
  CHECK (tax_position IN ('staff', 'non-staff'));

CREATE TABLE IF NOT EXISTS employee_family_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  user_profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  relation VARCHAR(50),
  phone VARCHAR(20),
  birth_date DATE,
  dependent_for_tax BOOLEAN DEFAULT FALSE,
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employee_education_histories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  user_profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  level VARCHAR(50) NOT NULL,
  institution VARCHAR(150),
  major VARCHAR(120),
  start_year INTEGER,
  end_year INTEGER,
  gpa NUMERIC(4,2),
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employee_informal_education_histories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  user_profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  name VARCHAR(150) NOT NULL,
  provider VARCHAR(150),
  year INTEGER,
  certificate VARCHAR(150),
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employee_organization_experiences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  user_profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  organization VARCHAR(150) NOT NULL,
  role VARCHAR(120),
  start_year INTEGER,
  end_year INTEGER,
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employee_work_histories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  user_profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  company VARCHAR(150) NOT NULL,
  position VARCHAR(120),
  start_date DATE,
  end_date DATE,
  reason_for_leaving TEXT,
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS employee_portfolios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  user_profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  title VARCHAR(150) NOT NULL,
  role VARCHAR(120),
  year INTEGER,
  url TEXT,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employee_family_members_profile
  ON employee_family_members(tenant_id, user_profile_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_employee_education_histories_profile
  ON employee_education_histories(tenant_id, user_profile_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_employee_informal_education_profile
  ON employee_informal_education_histories(tenant_id, user_profile_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_employee_org_experiences_profile
  ON employee_organization_experiences(tenant_id, user_profile_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_employee_work_histories_profile
  ON employee_work_histories(tenant_id, user_profile_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_employee_portfolios_profile
  ON employee_portfolios(tenant_id, user_profile_id, sort_order);

ALTER TABLE employee_family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_education_histories ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_informal_education_histories ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_organization_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_work_histories ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_portfolios ENABLE ROW LEVEL SECURITY;
