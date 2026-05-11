-- Migration: employee_leave_balances
-- Tracks leave quota, carry-over, and usage per employee per year.
-- remaining_days is computed client-side: COALESCE(custom_quota, base_quota) + carry_over_days - used_days

CREATE TABLE IF NOT EXISTS employee_leave_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  user_profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES hr_leave_types(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  -- base_quota is copied from hr_leave_types.days_per_year at the time of init
  base_quota INTEGER NOT NULL DEFAULT 0,
  -- custom_quota overrides base_quota for this specific employee; NULL means use base_quota
  custom_quota INTEGER,
  carry_over_days INTEGER NOT NULL DEFAULT 0,
  used_days INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,
  UNIQUE (tenant_id, user_profile_id, leave_type_id, year)
);

CREATE INDEX IF NOT EXISTS idx_elb_tenant_user ON employee_leave_balances(tenant_id, user_profile_id);
CREATE INDEX IF NOT EXISTS idx_elb_year ON employee_leave_balances(year);

ALTER TABLE employee_leave_balances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS elb_auth ON employee_leave_balances;
CREATE POLICY elb_auth
  ON employee_leave_balances FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON employee_leave_balances TO authenticated;
