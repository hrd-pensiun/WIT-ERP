-- ============================================================
-- 010_payroll.sql
-- Payroll periods, details, and calibration logs
-- ============================================================

CREATE TABLE IF NOT EXISTS payroll_periods (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             uuid NOT NULL,
  entity_id             uuid REFERENCES entities(id),
  paygroup_name         varchar(50) NOT NULL DEFAULT 'default',
  period_year           integer NOT NULL,
  period_month          integer NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  name                  varchar(100),
  start_date            date,
  end_date              date,
  attendance_start_date date,
  attendance_end_date   date,
  status                varchar(20) NOT NULL DEFAULT 'draft'
                          CHECK (status IN ('draft','processing','approved','paid')),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  created_by            uuid
);

CREATE TABLE IF NOT EXISTS payroll_details (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 uuid NOT NULL,
  payroll_period_id         uuid NOT NULL REFERENCES payroll_periods(id) ON DELETE CASCADE,
  user_profile_id           uuid NOT NULL REFERENCES user_profiles(id),
  basic_salary              numeric(15,2) NOT NULL DEFAULT 0,
  allowance_details         jsonb DEFAULT '[]',
  total_allowances          numeric(15,2) NOT NULL DEFAULT 0,
  deduction_details         jsonb DEFAULT '[]',
  total_deductions          numeric(15,2) NOT NULL DEFAULT 0,
  attendance_deduction_amount numeric(15,2) DEFAULT 0,
  bpjs_tk_amount            numeric(15,2) DEFAULT 0,
  bpjs_kes_amount           numeric(15,2) DEFAULT 0,
  pph21_amount              numeric(15,2) DEFAULT 0,
  pph21_method              varchar(20),
  gross_salary              numeric(15,2) NOT NULL DEFAULT 0,
  net_salary                numeric(15,2) NOT NULL DEFAULT 0,
  take_home_pay             numeric(15,2) NOT NULL DEFAULT 0,
  status                    varchar(20) NOT NULL DEFAULT 'draft'
                              CHECK (status IN ('draft','reviewed','approved','paid')),
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now(),
  UNIQUE (payroll_period_id, user_profile_id)
);

CREATE TABLE IF NOT EXISTS payroll_calibration_logs (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payroll_detail_id   uuid NOT NULL REFERENCES payroll_details(id) ON DELETE CASCADE,
  edited_by_user_id   uuid REFERENCES user_profiles(id),
  edited_by_name      varchar(200),
  summary             text,
  snapshot            jsonb DEFAULT '{}',
  edited_at           timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payroll_periods_tenant  ON payroll_periods(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payroll_details_tenant  ON payroll_details(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payroll_details_period  ON payroll_details(payroll_period_id);
CREATE INDEX IF NOT EXISTS idx_payroll_calib_detail    ON payroll_calibration_logs(payroll_detail_id);

-- RLS
ALTER TABLE payroll_periods           ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_details           ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_calibration_logs  ENABLE ROW LEVEL SECURITY;

CREATE POLICY payroll_periods_all          ON payroll_periods          FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY payroll_details_all          ON payroll_details          FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY payroll_calibration_logs_all ON payroll_calibration_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
