-- ============================================================
-- 009_employee_histories.sql
-- Employee salaries, allowances, and all history/profile tables
-- ============================================================

CREATE TABLE IF NOT EXISTS employee_salaries (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL,
  user_profile_id uuid NOT NULL REFERENCES user_profiles(id),
  effective_date  date NOT NULL,
  amount          numeric(15,2) NOT NULL DEFAULT 0,
  reason          varchar(100),
  reason_other    text,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS employee_allowances (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL,
  user_profile_id     uuid NOT NULL REFERENCES user_profiles(id),
  salary_component_id uuid REFERENCES salary_components(id),
  amount              numeric(15,2) NOT NULL DEFAULT 0,
  effective_date      date NOT NULL,
  end_date            date,
  notes               text,
  status              varchar(20) NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active','inactive')),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  deleted_at          timestamptz,
  created_by          uuid,
  updated_by          uuid
);

CREATE TABLE IF NOT EXISTS employee_allowance_histories (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             uuid NOT NULL,
  employee_allowance_id uuid REFERENCES employee_allowances(id),
  user_profile_id       uuid REFERENCES user_profiles(id),
  salary_component_id   uuid REFERENCES salary_components(id),
  change_type           varchar(20) NOT NULL
                          CHECK (change_type IN ('create','update','delete')),
  old_amount            numeric(15,2),
  new_amount            numeric(15,2),
  effective_date        date,
  reason                varchar(100),
  reason_other          text,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS employee_family_members (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid NOT NULL,
  user_profile_id  uuid NOT NULL REFERENCES user_profiles(id),
  name             varchar(200) NOT NULL,
  relation         varchar(50) NOT NULL,
  phone            varchar(30),
  birth_date       date,
  dependent_for_tax boolean NOT NULL DEFAULT false,
  notes            text,
  sort_order       integer NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS employee_education_histories (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL,
  user_profile_id uuid NOT NULL REFERENCES user_profiles(id),
  level           varchar(50) NOT NULL,
  institution     varchar(200) NOT NULL,
  major           varchar(200),
  start_year      integer,
  end_year        integer,
  gpa             numeric(4,2),
  notes           text,
  sort_order      integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS employee_informal_education_histories (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL,
  user_profile_id uuid NOT NULL REFERENCES user_profiles(id),
  name            varchar(200) NOT NULL,
  provider        varchar(200),
  year            integer,
  certificate     varchar(200),
  notes           text,
  sort_order      integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS employee_organization_experiences (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL,
  user_profile_id uuid NOT NULL REFERENCES user_profiles(id),
  organization    varchar(200) NOT NULL,
  role            varchar(200) NOT NULL,
  start_year      integer,
  end_year        integer,
  notes           text,
  sort_order      integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS employee_work_histories (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          uuid NOT NULL,
  user_profile_id    uuid NOT NULL REFERENCES user_profiles(id),
  company            varchar(200) NOT NULL,
  position           varchar(200) NOT NULL,
  start_date         date,
  end_date           date,
  reason_for_leaving text,
  notes              text,
  sort_order         integer NOT NULL DEFAULT 0,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS employee_portfolios (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL,
  user_profile_id uuid NOT NULL REFERENCES user_profiles(id),
  title           varchar(200) NOT NULL,
  role            varchar(200),
  year            integer,
  url             text,
  description     text,
  sort_order      integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_emp_salaries_user     ON employee_salaries(user_profile_id);
CREATE INDEX IF NOT EXISTS idx_emp_allowances_user   ON employee_allowances(user_profile_id);
CREATE INDEX IF NOT EXISTS idx_emp_family_user        ON employee_family_members(user_profile_id);
CREATE INDEX IF NOT EXISTS idx_emp_edu_user           ON employee_education_histories(user_profile_id);
CREATE INDEX IF NOT EXISTS idx_emp_work_hist_user     ON employee_work_histories(user_profile_id);

-- RLS
ALTER TABLE employee_salaries                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_allowances                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_allowance_histories         ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_family_members              ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_education_histories         ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_informal_education_histories ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_organization_experiences    ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_work_histories              ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_portfolios                  ENABLE ROW LEVEL SECURITY;

CREATE POLICY emp_salaries_all          ON employee_salaries                    FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY emp_allowances_all        ON employee_allowances                  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY emp_allowance_hist_all    ON employee_allowance_histories         FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY emp_family_all            ON employee_family_members              FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY emp_edu_all               ON employee_education_histories         FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY emp_informal_edu_all      ON employee_informal_education_histories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY emp_org_exp_all           ON employee_organization_experiences    FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY emp_work_hist_all         ON employee_work_histories              FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY emp_portfolios_all        ON employee_portfolios                  FOR ALL TO authenticated USING (true) WITH CHECK (true);
