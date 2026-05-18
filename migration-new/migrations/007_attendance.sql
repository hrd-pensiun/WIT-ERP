-- ============================================================
-- 007_attendance.sql
-- Attendance records, fine config, and fine tiers
-- ============================================================

CREATE TABLE IF NOT EXISTS attendance_records (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL,
  user_profile_id   uuid NOT NULL REFERENCES user_profiles(id),
  entity_id         uuid REFERENCES entities(id),
  work_shift_id     uuid REFERENCES hr_work_shifts(id),
  date              date NOT NULL,
  check_in          timestamptz,
  check_out         timestamptz,
  check_in_lat      numeric(10,7),
  check_in_lng      numeric(10,7),
  check_out_lat     numeric(10,7),
  check_out_lng     numeric(10,7),
  check_in_status   varchar(20) DEFAULT 'on_time'
                      CHECK (check_in_status IN ('on_time','late','early')),
  check_out_status  varchar(20) DEFAULT 'on_time'
                      CHECK (check_out_status IN ('on_time','overtime','early')),
  work_hours        numeric(5,2) DEFAULT 0,
  overtime_hours    numeric(5,2) DEFAULT 0,
  is_holiday        boolean DEFAULT false,
  is_leave          boolean DEFAULT false,
  leave_type_id     uuid REFERENCES hr_leave_types(id),
  notes             text,
  status            varchar(20) NOT NULL DEFAULT 'present'
                      CHECK (status IN ('present','absent','late','leave','sick','permission')),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  updated_by        uuid,
  UNIQUE (tenant_id, user_profile_id, date)
);

CREATE TABLE IF NOT EXISTS attendance_fine_config (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL,
  entity_id           uuid REFERENCES entities(id),
  late_method         varchar(20) NOT NULL DEFAULT 'fixed'
                        CHECK (late_method IN ('fixed','tiered','proportional')),
  late_fixed_amount   numeric(15,2) DEFAULT 0,
  late_fine_per_hour  numeric(15,2) DEFAULT 0,
  late_min_minutes    integer DEFAULT 0,
  late_max_amount     numeric(15,2),
  no_checkin_amount   numeric(15,2) DEFAULT 0,
  no_checkout_amount  numeric(15,2) DEFAULT 0,
  is_active           boolean DEFAULT true,
  description         text,
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, entity_id)
);

CREATE TABLE IF NOT EXISTS attendance_fine_tiers (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL,
  fine_config_id uuid NOT NULL REFERENCES attendance_fine_config(id) ON DELETE CASCADE,
  min_minutes    integer NOT NULL,
  max_minutes    integer,
  amount         numeric(15,2) NOT NULL DEFAULT 0
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_attendance_tenant     ON attendance_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_attendance_user       ON attendance_records(user_profile_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date       ON attendance_records(date);
CREATE INDEX IF NOT EXISTS idx_fine_config_tenant    ON attendance_fine_config(tenant_id);

-- RLS
ALTER TABLE attendance_records     ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_fine_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_fine_tiers  ENABLE ROW LEVEL SECURITY;

CREATE POLICY attendance_records_all     ON attendance_records     FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY attendance_fine_config_all ON attendance_fine_config FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY attendance_fine_tiers_all  ON attendance_fine_tiers  FOR ALL TO authenticated USING (true) WITH CHECK (true);
