-- ============================================================
-- 003_hr_core.sql
-- HR core: job grades, positions, shifts, calendars, leave types
-- ============================================================

CREATE TABLE IF NOT EXISTS hr_job_grades (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL,
  code        varchar(20) NOT NULL,
  name        varchar(100) NOT NULL,
  level       integer NOT NULL DEFAULT 1,
  description text,
  min_salary  numeric(15,2) DEFAULT 0,
  max_salary  numeric(15,2) DEFAULT 0,
  status      varchar(20) NOT NULL DEFAULT 'active',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  deleted_at  timestamptz,
  created_by  uuid,
  updated_by  uuid
);

CREATE TABLE IF NOT EXISTS hr_positions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL,
  entity_id       uuid REFERENCES entities(id),
  job_grade_id    uuid REFERENCES hr_job_grades(id),
  code            varchar(20),
  name            varchar(200) NOT NULL,
  level           integer DEFAULT 1,
  description     text,
  responsibilities text,
  requirements    text,
  status          varchar(20) NOT NULL DEFAULT 'active',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz,
  created_by      uuid,
  updated_by      uuid
);

CREATE TABLE IF NOT EXISTS hr_work_shifts (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id              uuid NOT NULL,
  entity_id              uuid REFERENCES entities(id),
  code                   varchar(20),
  name                   varchar(100) NOT NULL,
  start_time             time NOT NULL,
  end_time               time NOT NULL,
  grace_period_minutes   integer DEFAULT 15,
  break_duration_minutes integer DEFAULT 60,
  is_night_shift         boolean DEFAULT false,
  description            text,
  status                 varchar(20) NOT NULL DEFAULT 'active',
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now(),
  deleted_at             timestamptz
);

CREATE TABLE IF NOT EXISTS hr_work_calendars (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL,
  entity_id    uuid REFERENCES entities(id),
  date         date NOT NULL,
  is_holiday   boolean NOT NULL DEFAULT true,
  holiday_name varchar(200),
  holiday_type varchar(30) DEFAULT 'national'
                 CHECK (holiday_type IN ('national','company','cuti_bersama')),
  work_shift_id uuid REFERENCES hr_work_shifts(id),
  description  text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  deleted_at   timestamptz,
  UNIQUE (tenant_id, entity_id, date)
);

CREATE TABLE IF NOT EXISTS hr_leave_types (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             uuid NOT NULL,
  code                  varchar(20) NOT NULL,
  name                  varchar(100) NOT NULL,
  days_per_year         integer NOT NULL DEFAULT 12,
  carry_over_allowed    boolean DEFAULT false,
  max_carry_over_days   integer DEFAULT 0,
  min_service_months    integer DEFAULT 0,
  is_paid               boolean DEFAULT true,
  requires_approval     boolean DEFAULT true,
  approval_levels       integer DEFAULT 1,
  description           text,
  status                varchar(20) NOT NULL DEFAULT 'active',
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  deleted_at            timestamptz,
  created_by            uuid,
  updated_by            uuid
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_hr_job_grades_tenant   ON hr_job_grades(tenant_id);
CREATE INDEX IF NOT EXISTS idx_hr_positions_tenant    ON hr_positions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_hr_positions_entity    ON hr_positions(entity_id);
CREATE INDEX IF NOT EXISTS idx_hr_work_shifts_tenant  ON hr_work_shifts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_hr_work_cal_tenant     ON hr_work_calendars(tenant_id);
CREATE INDEX IF NOT EXISTS idx_hr_leave_types_tenant  ON hr_leave_types(tenant_id);

-- RLS
ALTER TABLE hr_job_grades      ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_positions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_work_shifts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_work_calendars   ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_leave_types      ENABLE ROW LEVEL SECURITY;

CREATE POLICY hr_job_grades_all    ON hr_job_grades    FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY hr_positions_all     ON hr_positions     FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY hr_work_shifts_all   ON hr_work_shifts   FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY hr_work_cal_all      ON hr_work_calendars FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY hr_leave_types_all   ON hr_leave_types   FOR ALL TO authenticated USING (true) WITH CHECK (true);
