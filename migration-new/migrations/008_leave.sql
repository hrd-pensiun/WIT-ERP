-- ============================================================
-- 008_leave.sql
-- Leave requests and employee leave balances
-- ============================================================

CREATE TABLE IF NOT EXISTS leave_requests (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid NOT NULL,
  user_profile_id  uuid NOT NULL REFERENCES user_profiles(id),
  leave_type_id    uuid NOT NULL REFERENCES hr_leave_types(id),
  start_date       date NOT NULL,
  end_date         date NOT NULL,
  days_requested   integer NOT NULL DEFAULT 1,
  reason           text,
  attachment_url   text,
  is_advance       boolean DEFAULT false,
  status           varchar(20) NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','approved','rejected','cancelled')),
  approved_by      uuid REFERENCES user_profiles(id),
  approved_at      timestamptz,
  rejection_reason text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  updated_by       uuid
);

CREATE TABLE IF NOT EXISTS employee_leave_balances (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid NOT NULL,
  user_profile_id  uuid NOT NULL REFERENCES user_profiles(id),
  leave_type_id    uuid NOT NULL REFERENCES hr_leave_types(id),
  year             integer NOT NULL,
  base_quota       integer NOT NULL DEFAULT 0,
  carry_over_days  integer NOT NULL DEFAULT 0,
  custom_quota     integer,
  used_days        integer NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_profile_id, leave_type_id, year)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_leave_requests_tenant ON leave_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_user   ON leave_requests(user_profile_id);
CREATE INDEX IF NOT EXISTS idx_leave_balances_tenant ON employee_leave_balances(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leave_balances_user   ON employee_leave_balances(user_profile_id);

-- RLS
ALTER TABLE leave_requests         ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_leave_balances ENABLE ROW LEVEL SECURITY;

CREATE POLICY leave_requests_all          ON leave_requests          FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY employee_leave_balances_all ON employee_leave_balances FOR ALL TO authenticated USING (true) WITH CHECK (true);
