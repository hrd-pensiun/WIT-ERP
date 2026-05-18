-- ============================================================
-- 004_seed_sample_data.sql
-- Sample data: user profiles, sample leads, sample project
-- CATATAN: Jalankan HANYA di environment development/staging
-- Jangan jalankan di production tanpa menyesuaikan data
-- ============================================================

DO $$
DECLARE
  v_tenant   uuid := '00000000-0000-0000-0000-000000000001';
  v_entity   uuid := '00000000-0000-0000-0000-000000000010';

  -- Position IDs (from seed 002)
  pos_be_sr  uuid := '00000000-0000-0000-0005-000000000006';
  pos_pm     uuid := '00000000-0000-0000-0005-000000000011';
  pos_bdo    uuid := '00000000-0000-0000-0005-000000000010';
  pos_dir    uuid := '00000000-0000-0000-0005-000000000015';
  pos_hrbp   uuid := '00000000-0000-0000-0005-000000000013';

  -- Job Grade IDs
  g3 uuid := '00000000-0000-0000-0001-000000000003';
  g4 uuid := '00000000-0000-0000-0001-000000000004';
  g5 uuid := '00000000-0000-0000-0001-000000000005';
  g6 uuid := '00000000-0000-0000-0001-000000000006';

  -- User Profile IDs
  u_admin    uuid := '00000000-0000-0000-0006-000000000001';
  u_sales    uuid := '00000000-0000-0000-0006-000000000002';
  u_pm       uuid := '00000000-0000-0000-0006-000000000003';
  u_dev      uuid := '00000000-0000-0000-0006-000000000004';
  u_hr       uuid := '00000000-0000-0000-0006-000000000005';

  -- Lead & Project IDs
  lead1_id   uuid := '00000000-0000-0000-0007-000000000001';
  lead2_id   uuid := '00000000-0000-0000-0007-000000000002';
  proj1_id   uuid := '00000000-0000-0000-0008-000000000001';
BEGIN

-- ============================================================
-- USER PROFILES (sample — tanpa auth.users linkage)
-- ============================================================
INSERT INTO user_profiles (id, tenant_id, entity_id, position_id, job_grade_id,
  employee_number, full_name, email, phone, join_date, employment_status,
  status, ptkp_status, app_role) VALUES
  (u_admin, v_tenant, v_entity, pos_dir,   g6, 'EMP-001', 'Administrator',        'admin@wit.co.id',   '08111000001', '2020-01-01', 'permanent', 'active', 'TK0', 'admin'),
  (u_sales, v_tenant, v_entity, pos_bdo,   g4, 'EMP-002', 'Budi Santoso',         'budi@wit.co.id',    '08222000002', '2021-03-01', 'permanent', 'active', 'K1',  'commercial'),
  (u_pm,    v_tenant, v_entity, pos_pm,    g5, 'EMP-003', 'Citra Dewi',           'citra@wit.co.id',   '08333000003', '2021-06-01', 'permanent', 'active', 'K0',  'employee'),
  (u_dev,   v_tenant, v_entity, pos_be_sr, g3, 'EMP-004', 'Dian Permana',         'dian@wit.co.id',    '08444000004', '2022-01-15', 'permanent', 'active', 'TK0', 'employee'),
  (u_hr,    v_tenant, v_entity, pos_hrbp,  g3, 'EMP-005', 'Eka Sari Wahyuni',     'eka@wit.co.id',     '08555000005', '2022-04-01', 'permanent', 'active', 'K0',  'hr')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SAMPLE LEADS
-- ============================================================
INSERT INTO crm_leads (id, tenant_id, lead_number, title, company_name, contact_name,
  contact_email, contact_phone, lead_source, status, priority,
  estimated_value, budget_confirmed, budget_value,
  need_confirmed, need_detail, pic_sales_id, notes, created_at) VALUES

  (lead1_id, v_tenant, 'LD/2026/0001',
   'Pengembangan Platform E-Commerce',
   'PT Maju Bersama Digital', 'Riko Harisandi',
   'riko@majubersama.co.id', '08111222333',
   'referral', 'qualified', 'high',
   500000000, true, '500000000',
   true, 'Butuh platform e-commerce B2B dengan fitur multi-tenant dan payment gateway lokal',
   u_sales, 'Lead dari referral partner. Sudah presentasi awal, klien sangat tertarik.',
   now() - interval '15 days'),

  (lead2_id, v_tenant, 'LD/2026/0002',
   'Implementasi ERP HR & Payroll',
   'PT Industri Nusantara', 'Santi Rahayu',
   'santi@industrinusantara.co.id', '08222333444',
   'website', 'proposal', 'medium',
   350000000, true, '350000000',
   true, 'Migrasi dari sistem legacy ke sistem ERP modern. Scope: HR, Payroll, Leave Management',
   u_sales, 'Demo sudah dilakukan 2x. Sedang tunggu approval budget dari board.',
   now() - interval '7 days')

ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- LEAD COST ANALYSIS (untuk lead1)
-- ============================================================
INSERT INTO lead_cost_analyses (tenant_id, lead_id, scheme_type,
  manpower_data, manpower_total_hpp, manpower_total_publish,
  quotation_publish, actual_deal, grand_total, margin_pct, created_by) VALUES
(
  v_tenant, lead1_id, 'standard',
  '[
    {"role_name": "Senior Backend Developer", "qty": 1, "months": 4, "hpp_rate": 14000000, "publish_rate": 30000000, "work_mode": "Remote"},
    {"role_name": "Mid Frontend Developer",   "qty": 2, "months": 4, "hpp_rate": 8000000,  "publish_rate": 18000000, "work_mode": "Remote"},
    {"role_name": "UI/UX Designer",           "qty": 1, "months": 2, "hpp_rate": 8000000,  "publish_rate": 18000000, "work_mode": "Remote"},
    {"role_name": "Project Manager",          "qty": 1, "months": 4, "hpp_rate": 22000000, "publish_rate": 40000000, "work_mode": "Remote"}
  ]'::jsonb,
  118000000,  -- total hpp
  240000000,  -- total publish
  220000000,  -- quotation publish (after discount)
  200000000,  -- actual deal
  200000000,  -- grand total
  0.41,       -- margin 41%
  u_sales
) ON CONFLICT DO NOTHING;

-- ============================================================
-- SAMPLE PROJECT (converted from lead1)
-- ============================================================
INSERT INTO commercial_projects (id, tenant_id, lead_id, project_code, project_name,
  company_name, client_name, project_type, status, health,
  pic_commercial_id, pm_id,
  po_value, total_hpp, total_publish, actual_deal, grand_total, margin_pct,
  kickoff_date, start_dev_date, end_date,
  notes, created_at) VALUES
(
  proj1_id, v_tenant, lead1_id,
  'PRJ/2026/0001',
  'Pengembangan Platform E-Commerce PT Maju Bersama Digital',
  'PT Maju Bersama Digital', 'Riko Harisandi',
  'Web Development', 'on-going', 'on_track',
  u_sales, u_pm,
  200000000, 118000000, 240000000, 200000000, 200000000, 0.41,
  '2026-04-01', '2026-04-15', '2026-07-31',
  'Proyek e-commerce B2B. Kickoff sudah dilakukan 1 April 2026.',
  now() - interval '10 days'
) ON CONFLICT (id) DO NOTHING;

-- Project Contacts
INSERT INTO project_contacts (tenant_id, project_id, full_name, role, phone, email, is_primary, sort_order) VALUES
  (v_tenant, proj1_id, 'Riko Harisandi',  'Director',       '08111222333', 'riko@majubersama.co.id',   true,  0),
  (v_tenant, proj1_id, 'Lina Kurniawati', 'Finance Manager','08999888777', 'lina@majubersama.co.id',   false, 1),
  (v_tenant, proj1_id, 'Agus Setiawan',   'IT Manager',     '08777666555', 'agus@majubersama.co.id',   false, 2)
ON CONFLICT DO NOTHING;

-- Project Members
INSERT INTO project_members (tenant_id, project_id, user_profile_id, role, allocation_percent, is_active, joined_at) VALUES
  (v_tenant, proj1_id, u_pm,  'Project Manager', 100, true, '2026-04-01'),
  (v_tenant, proj1_id, u_dev, 'Backend Developer', 100, true, '2026-04-15')
ON CONFLICT (project_id, user_profile_id) DO NOTHING;

-- Project Manpower
INSERT INTO commercial_project_manpower (tenant_id, project_id, role_name, qty, months, hpp_rate, publish_rate, work_mode, sort_order) VALUES
  (v_tenant, proj1_id, 'Senior Backend Developer', 1, 4, 14000000, 30000000, 'Remote', 0),
  (v_tenant, proj1_id, 'Mid Frontend Developer',   2, 4,  8000000, 18000000, 'Remote', 1),
  (v_tenant, proj1_id, 'UI/UX Designer',           1, 2,  8000000, 18000000, 'Remote', 2),
  (v_tenant, proj1_id, 'Project Manager',          1, 4, 22000000, 40000000, 'Remote', 3)
ON CONFLICT DO NOTHING;

-- Project Checklist (default 16 items)
INSERT INTO project_checklist_items (tenant_id, project_id, category, item_name, status, sort_order) VALUES
  (v_tenant, proj1_id, 'credentials',  'NDA (Non-Disclosure Agreement)', 'done',    1),
  (v_tenant, proj1_id, 'credentials',  'Quotation',                      'done',    2),
  (v_tenant, proj1_id, 'credentials',  'Summary Quotation',              'done',    3),
  (v_tenant, proj1_id, 'credentials',  'MOU / PKS',                      'done',    4),
  (v_tenant, proj1_id, 'credentials',  'First Payment',                  'done',    5),
  (v_tenant, proj1_id, 'development',  'User Requirement',               'done',    6),
  (v_tenant, proj1_id, 'development',  'BRD, FSD, TSD',                  'on_going',7),
  (v_tenant, proj1_id, 'development',  'Asset Repository',               'on_going',8),
  (v_tenant, proj1_id, 'development',  'Minute of Meeting',              'on_going',9),
  (v_tenant, proj1_id, 'development',  'Weekly Report',                  'on_going',10),
  (v_tenant, proj1_id, 'development',  'UAT / SIT',                      'pending', 11),
  (v_tenant, proj1_id, 'development',  'BAST',                           'pending', 12),
  (v_tenant, proj1_id, 'handover',     'Manual Book',                    'pending', 13),
  (v_tenant, proj1_id, 'handover',     'Code Documentation',             'pending', 14),
  (v_tenant, proj1_id, 'handover',     'Repository',                     'pending', 15),
  (v_tenant, proj1_id, 'handover',     'API Docs',                       'pending', 16)
ON CONFLICT DO NOTHING;

-- Payment Terms
INSERT INTO project_payment_terms (tenant_id, project_id, term_name, percentage, nominal, due_date, paid_date, status, sort_order) VALUES
  (v_tenant, proj1_id, 'Down Payment',    30, 60000000,  '2026-04-01', '2026-04-03', 'paid',            0),
  (v_tenant, proj1_id, 'Termin 1',        30, 60000000,  '2026-05-15', '2026-05-18', 'paid',            1),
  (v_tenant, proj1_id, 'Termin 2',        30, 60000000,  '2026-06-30', NULL,          'waiting_payment', 2),
  (v_tenant, proj1_id, 'Pelunasan',       10, 20000000,  '2026-07-31', NULL,          'pending',         3)
ON CONFLICT DO NOTHING;

-- Project Milestones
INSERT INTO project_milestones (tenant_id, project_id, title, target_date, is_payment_trigger, payment_percent, status, completed_at) VALUES
  (v_tenant, proj1_id, 'Kickoff Meeting',         '2026-04-01', false, 0,    'completed', '2026-04-01'),
  (v_tenant, proj1_id, 'Finalisasi BRD & Desain', '2026-04-30', true,  30.0, 'in_progress', NULL),
  (v_tenant, proj1_id, 'Sprint 1 - Core Features','2026-05-31', false, 0,    'pending', NULL),
  (v_tenant, proj1_id, 'Sprint 2 - Integration',  '2026-06-30', true,  30.0, 'pending', NULL),
  (v_tenant, proj1_id, 'UAT & Go Live',           '2026-07-31', true,  40.0, 'pending', NULL)
ON CONFLICT DO NOTHING;

-- Sample Tasks
INSERT INTO project_tasks (tenant_id, project_id, title, assigned_to, status, priority, start_date, due_date, estimated_hours, progress_percent) VALUES
  (v_tenant, proj1_id, 'Setup project repository & CI/CD',    u_dev, 'done',        'high',   '2026-04-15', '2026-04-17', 8,  100),
  (v_tenant, proj1_id, 'Desain database schema',              u_dev, 'done',        'high',   '2026-04-18', '2026-04-22', 16, 100),
  (v_tenant, proj1_id, 'API Authentication & Authorization',  u_dev, 'in_progress', 'high',   '2026-04-23', '2026-04-30', 24, 60),
  (v_tenant, proj1_id, 'Modul Product Management',           u_dev, 'todo',        'medium', '2026-05-01', '2026-05-15', 32, 0),
  (v_tenant, proj1_id, 'Modul Order & Cart',                 u_dev, 'todo',        'medium', '2026-05-16', '2026-05-31', 40, 0)
ON CONFLICT DO NOTHING;

-- Sample Employee Salaries
INSERT INTO employee_salaries (tenant_id, user_profile_id, effective_date, amount, reason) VALUES
  (v_tenant, u_sales, '2026-01-01', 22000000, 'Initial salary'),
  (v_tenant, u_pm,    '2026-01-01', 38000000, 'Initial salary'),
  (v_tenant, u_dev,   '2026-01-01', 14000000, 'Initial salary'),
  (v_tenant, u_hr,    '2026-01-01', 14000000, 'Initial salary')
ON CONFLICT DO NOTHING;

-- Sample Leave Balances (2026)
INSERT INTO employee_leave_balances (tenant_id, user_profile_id, leave_type_id, year, base_quota, carry_over_days, used_days) VALUES
  (v_tenant, u_sales, '00000000-0000-0000-0002-000000000001', 2026, 12, 3, 2),
  (v_tenant, u_pm,    '00000000-0000-0000-0002-000000000001', 2026, 12, 0, 5),
  (v_tenant, u_dev,   '00000000-0000-0000-0002-000000000001', 2026, 12, 0, 1),
  (v_tenant, u_hr,    '00000000-0000-0000-0002-000000000001', 2026, 12, 2, 0)
ON CONFLICT (tenant_id, user_profile_id, leave_type_id, year) DO NOTHING;

END $$;
