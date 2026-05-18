-- ============================================================
-- 004_user_profiles.sql
-- User profiles (linked to auth.users)
-- ============================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL,
  user_id             uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  entity_id           uuid REFERENCES entities(id),
  position_id         uuid REFERENCES hr_positions(id),
  job_grade_id        uuid REFERENCES hr_job_grades(id),
  employee_number     varchar(30),
  full_name           varchar(200) NOT NULL,
  email               varchar(200),
  phone               varchar(30),
  birth_date          date,
  gender              varchar(10) CHECK (gender IN ('male','female')),
  nik                 varchar(20),
  npwp                varchar(30),
  bpjs_number         varchar(30),
  address             text,
  join_date           date,
  end_date            date,
  employment_status   varchar(30) NOT NULL DEFAULT 'permanent'
                        CHECK (employment_status IN ('permanent','contract','probation','intern')),
  status              varchar(20) NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active','inactive','terminated')),
  profile_photo_url   text,
  bank_name           varchar(100),
  bank_account_number varchar(50),
  bank_account_name   varchar(200),
  ptkp_status         varchar(10) DEFAULT 'TK0'
                        CHECK (ptkp_status IN ('TK0','TK1','TK2','TK3','K0','K1','K2','K3')),
  tax_position        varchar(20) DEFAULT 'internal'
                        CHECK (tax_position IN ('internal','external')),
  app_role            varchar(50) NOT NULL DEFAULT 'employee',
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  deleted_at          timestamptz,
  created_by          uuid,
  updated_by          uuid
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_tenant   ON user_profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id  ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_entity   ON user_profiles(entity_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_emp_no
  ON user_profiles(tenant_id, employee_number) WHERE deleted_at IS NULL;

-- RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_profiles_all ON user_profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);
