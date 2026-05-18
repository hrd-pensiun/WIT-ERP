-- ============================================================
-- 001_seed_master_data.sql
-- Master data: entity, job grades, work shifts, leave types,
-- work calendar (2026 public holidays)
-- NOTE: Ganti TENANT_ID di bawah dengan UUID tenant Anda
-- ============================================================

-- Konstanta tenant (ganti sesuai tenant aktual)
DO $$
DECLARE
  v_tenant  uuid := '00000000-0000-0000-0000-000000000001';
  v_entity  uuid := '00000000-0000-0000-0000-000000000010';
  v_shift   uuid := '00000000-0000-0000-0000-000000000020';
BEGIN

-- ============================================================
-- ENTITY (Kantor Pusat)
-- ============================================================
INSERT INTO entities (id, tenant_id, code, name, type, address, city, province,
  phone, email, radius_meters, grace_period_minutes, is_headquarters, status)
VALUES (
  v_entity, v_tenant, 'HQ', 'PT Wahana Inovasi Teknologi', 'branch',
  'Jl. Sudirman No. 1, Jakarta Selatan', 'Jakarta', 'DKI Jakarta',
  '021-12345678', 'info@wit.co.id',
  100, 15, true, 'active'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- JOB GRADES
-- ============================================================
INSERT INTO hr_job_grades (id, tenant_id, code, name, level, min_salary, max_salary, status) VALUES
  ('00000000-0000-0000-0001-000000000001', v_tenant, 'G1', 'Grade 1 - Junior',     1,  3500000,   6000000,  'active'),
  ('00000000-0000-0000-0001-000000000002', v_tenant, 'G2', 'Grade 2 - Mid',        2,  6000000,   10000000, 'active'),
  ('00000000-0000-0000-0001-000000000003', v_tenant, 'G3', 'Grade 3 - Senior',     3,  10000000,  18000000, 'active'),
  ('00000000-0000-0000-0001-000000000004', v_tenant, 'G4', 'Grade 4 - Lead',       4,  18000000,  30000000, 'active'),
  ('00000000-0000-0000-0001-000000000005', v_tenant, 'G5', 'Grade 5 - Manager',    5,  30000000,  50000000, 'active'),
  ('00000000-0000-0000-0001-000000000006', v_tenant, 'G6', 'Grade 6 - Director',   6,  50000000,  100000000,'active')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- WORK SHIFT
-- ============================================================
INSERT INTO hr_work_shifts (id, tenant_id, entity_id, code, name, start_time, end_time,
  grace_period_minutes, break_duration_minutes, is_night_shift, status)
VALUES
  (v_shift, v_tenant, v_entity, 'WIB', 'Shift Reguler WIB', '08:00', '17:00', 15, 60, false, 'active'),
  ('00000000-0000-0000-0000-000000000021', v_tenant, v_entity, 'FLEX', 'Flexible / WFH', '09:00', '18:00', 30, 60, false, 'active')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- LEAVE TYPES
-- ============================================================
INSERT INTO hr_leave_types (id, tenant_id, code, name, days_per_year, carry_over_allowed,
  max_carry_over_days, min_service_months, is_paid, requires_approval, status) VALUES
  ('00000000-0000-0000-0002-000000000001', v_tenant, 'CTT', 'Cuti Tahunan',         12, true,  6, 12, true,  true, 'active'),
  ('00000000-0000-0000-0002-000000000002', v_tenant, 'CSK', 'Cuti Sakit',           14, false, 0,  0, true,  true, 'active'),
  ('00000000-0000-0000-0002-000000000003', v_tenant, 'CIZ', 'Cuti Izin / Keperluan', 3, false, 0,  0, true,  true, 'active'),
  ('00000000-0000-0000-0002-000000000004', v_tenant, 'CMH', 'Cuti Melahirkan',      90, false, 0,  0, true,  true, 'active'),
  ('00000000-0000-0000-0002-000000000005', v_tenant, 'CDB', 'Cuti Duka / Bela Sungkawa', 3, false, 0, 0, true, true, 'active'),
  ('00000000-0000-0000-0002-000000000006', v_tenant, 'CLB', 'Cuti Lebaran',          3, false, 0,  0, true,  false,'active')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- WORK CALENDARS — Hari Libur Nasional 2026
-- ============================================================
INSERT INTO hr_work_calendars (tenant_id, entity_id, date, is_holiday, holiday_name, holiday_type) VALUES
  (v_tenant, v_entity, '2026-01-01', true, 'Tahun Baru Masehi',                   'national'),
  (v_tenant, v_entity, '2026-01-27', true, 'Isra Miraj Nabi Muhammad SAW',        'national'),
  (v_tenant, v_entity, '2026-02-17', true, 'Tahun Baru Imlek 2577',               'national'),
  (v_tenant, v_entity, '2026-03-03', true, 'Hari Raya Nyepi',                     'national'),
  (v_tenant, v_entity, '2026-03-20', true, 'Wafat Yesus Kristus (Jumat Agung)',   'national'),
  (v_tenant, v_entity, '2026-03-22', true, 'Hari Paskah',                         'national'),
  (v_tenant, v_entity, '2026-03-31', true, 'Hari Raya Idul Fitri 1447 H',        'national'),
  (v_tenant, v_entity, '2026-04-01', true, 'Hari Raya Idul Fitri 1447 H (H+1)', 'national'),
  (v_tenant, v_entity, '2026-04-02', true, 'Cuti Bersama Idul Fitri',            'cuti_bersama'),
  (v_tenant, v_entity, '2026-04-03', true, 'Cuti Bersama Idul Fitri',            'cuti_bersama'),
  (v_tenant, v_entity, '2026-05-01', true, 'Hari Buruh Internasional',            'national'),
  (v_tenant, v_entity, '2026-05-14', true, 'Kenaikan Isa Almasih',               'national'),
  (v_tenant, v_entity, '2026-05-23', true, 'Hari Waisak',                        'national'),
  (v_tenant, v_entity, '2026-06-01', true, 'Hari Lahir Pancasila',               'national'),
  (v_tenant, v_entity, '2026-06-07', true, 'Hari Raya Idul Adha 1447 H',        'national'),
  (v_tenant, v_entity, '2026-06-27', true, 'Tahun Baru Islam 1448 H',            'national'),
  (v_tenant, v_entity, '2026-08-17', true, 'Hari Kemerdekaan RI',                'national'),
  (v_tenant, v_entity, '2026-09-05', true, 'Maulid Nabi Muhammad SAW',           'national'),
  (v_tenant, v_entity, '2026-12-25', true, 'Hari Natal',                         'national'),
  (v_tenant, v_entity, '2026-12-26', true, 'Cuti Bersama Natal',                 'cuti_bersama')
ON CONFLICT (tenant_id, entity_id, date) DO NOTHING;

END $$;
