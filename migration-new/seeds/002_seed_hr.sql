-- ============================================================
-- 002_seed_hr.sql
-- HR seed: departments, divisions, positions, salary components,
-- salary matrix, entity payroll config, allowance matrix
-- ============================================================

DO $$
DECLARE
  v_tenant  uuid := '00000000-0000-0000-0000-000000000001';
  v_entity  uuid := '00000000-0000-0000-0000-000000000010';

  -- Job Grade IDs (from seed 001)
  g1 uuid := '00000000-0000-0000-0001-000000000001';
  g2 uuid := '00000000-0000-0000-0001-000000000002';
  g3 uuid := '00000000-0000-0000-0001-000000000003';
  g4 uuid := '00000000-0000-0000-0001-000000000004';
  g5 uuid := '00000000-0000-0000-0001-000000000005';
  g6 uuid := '00000000-0000-0000-0001-000000000006';

  -- Department IDs
  dept_tech  uuid := '00000000-0000-0000-0003-000000000001';
  dept_comm  uuid := '00000000-0000-0000-0003-000000000002';
  dept_hr    uuid := '00000000-0000-0000-0003-000000000003';
  dept_fin   uuid := '00000000-0000-0000-0003-000000000004';

  -- Salary component IDs
  sc_basic   uuid := '00000000-0000-0000-0004-000000000001';
  sc_trans   uuid := '00000000-0000-0000-0004-000000000002';
  sc_meal    uuid := '00000000-0000-0000-0004-000000000003';
  sc_phone   uuid := '00000000-0000-0000-0004-000000000004';
  sc_project uuid := '00000000-0000-0000-0004-000000000005';
  sc_bpjstk  uuid := '00000000-0000-0000-0004-000000000006';
  sc_bpjskes uuid := '00000000-0000-0000-0004-000000000007';
  sc_pph21   uuid := '00000000-0000-0000-0004-000000000008';
BEGIN

-- ============================================================
-- DEPARTMENTS
-- ============================================================
INSERT INTO departments (id, tenant_id, entity_id, code, name, status) VALUES
  (dept_tech, v_tenant, v_entity, 'TECH', 'Technology & Engineering', 'active'),
  (dept_comm, v_tenant, v_entity, 'COMM', 'Commercial & Sales',       'active'),
  (dept_hr,   v_tenant, v_entity, 'HRD',  'Human Resources',          'active'),
  (dept_fin,  v_tenant, v_entity, 'FIN',  'Finance & Accounting',     'active')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- DIVISIONS
-- ============================================================
INSERT INTO divisions (id, tenant_id, entity_id, department_id, code, name, status) VALUES
  ('00000000-0000-0000-0003-000000000010', v_tenant, v_entity, dept_tech, 'FE',   'Frontend Development',  'active'),
  ('00000000-0000-0000-0003-000000000011', v_tenant, v_entity, dept_tech, 'BE',   'Backend Development',   'active'),
  ('00000000-0000-0000-0003-000000000012', v_tenant, v_entity, dept_tech, 'QA',   'Quality Assurance',     'active'),
  ('00000000-0000-0000-0003-000000000013', v_tenant, v_entity, dept_tech, 'UIUX', 'UI/UX Design',          'active'),
  ('00000000-0000-0000-0003-000000000020', v_tenant, v_entity, dept_comm, 'SALES','Sales',                 'active'),
  ('00000000-0000-0000-0003-000000000021', v_tenant, v_entity, dept_comm, 'PM',   'Project Management',    'active')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- POSITIONS
-- ============================================================
INSERT INTO hr_positions (id, tenant_id, entity_id, job_grade_id, code, name, level, status) VALUES
  -- Tech
  ('00000000-0000-0000-0005-000000000001', v_tenant, v_entity, g1, 'FE-JR',  'Junior Frontend Developer',   1, 'active'),
  ('00000000-0000-0000-0005-000000000002', v_tenant, v_entity, g2, 'FE-MD',  'Mid Frontend Developer',       2, 'active'),
  ('00000000-0000-0000-0005-000000000003', v_tenant, v_entity, g3, 'FE-SR',  'Senior Frontend Developer',    3, 'active'),
  ('00000000-0000-0000-0005-000000000004', v_tenant, v_entity, g1, 'BE-JR',  'Junior Backend Developer',     1, 'active'),
  ('00000000-0000-0000-0005-000000000005', v_tenant, v_entity, g2, 'BE-MD',  'Mid Backend Developer',        2, 'active'),
  ('00000000-0000-0000-0005-000000000006', v_tenant, v_entity, g3, 'BE-SR',  'Senior Backend Developer',     3, 'active'),
  ('00000000-0000-0000-0005-000000000007', v_tenant, v_entity, g4, 'TL',     'Tech Lead',                    4, 'active'),
  ('00000000-0000-0000-0005-000000000008', v_tenant, v_entity, g2, 'QA-MD',  'QA Engineer',                  2, 'active'),
  ('00000000-0000-0000-0005-000000000009', v_tenant, v_entity, g2, 'UIUX',   'UI/UX Designer',               2, 'active'),
  -- Commercial
  ('00000000-0000-0000-0005-000000000010', v_tenant, v_entity, g2, 'BDO',    'Business Development Officer', 2, 'active'),
  ('00000000-0000-0000-0005-000000000011', v_tenant, v_entity, g4, 'PM',     'Project Manager',              4, 'active'),
  ('00000000-0000-0000-0005-000000000012', v_tenant, v_entity, g5, 'COMMGR', 'Commercial Manager',           5, 'active'),
  -- HR & Finance
  ('00000000-0000-0000-0005-000000000013', v_tenant, v_entity, g3, 'HRBP',   'HR Business Partner',          3, 'active'),
  ('00000000-0000-0000-0005-000000000014', v_tenant, v_entity, g3, 'FINANCE','Finance Officer',               3, 'active'),
  ('00000000-0000-0000-0005-000000000015', v_tenant, v_entity, g6, 'DIR',    'Director',                     6, 'active')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SALARY COMPONENTS
-- ============================================================
INSERT INTO salary_components (id, tenant_id, entity_id, code, name, type, is_taxable, is_fixed, calculation_type, affects_thp, status) VALUES
  (sc_basic,   v_tenant, v_entity, 'BASIC',   'Gaji Pokok',             'earning',   true,  true,  'fixed',      true,  'active'),
  (sc_trans,   v_tenant, v_entity, 'TRANS',   'Tunjangan Transportasi', 'earning',   false, true,  'fixed',      true,  'active'),
  (sc_meal,    v_tenant, v_entity, 'MEAL',    'Tunjangan Makan',        'earning',   false, true,  'fixed',      true,  'active'),
  (sc_phone,   v_tenant, v_entity, 'PHONE',   'Tunjangan Komunikasi',   'earning',   false, true,  'fixed',      true,  'active'),
  (sc_project, v_tenant, v_entity, 'PROJECT', 'Tunjangan Proyek',       'earning',   true,  false, 'fixed',      true,  'active'),
  (sc_bpjstk,  v_tenant, v_entity, 'BPJSTK',  'BPJS Ketenagakerjaan',  'deduction', false, true,  'percentage', false, 'active'),
  (sc_bpjskes, v_tenant, v_entity, 'BPJSKES', 'BPJS Kesehatan',        'deduction', false, true,  'percentage', false, 'active'),
  (sc_pph21,   v_tenant, v_entity, 'PPH21',   'PPh 21',                'deduction', false, false, 'formula',    false, 'active')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SALARY MATRIX (per grade, step 1)
-- ============================================================
INSERT INTO salary_matrix (tenant_id, entity_id, job_grade_id, step, amount, effective_date, status) VALUES
  (v_tenant, v_entity, g1, 1,  4000000,  '2026-01-01', 'active'),
  (v_tenant, v_entity, g2, 1,  8000000,  '2026-01-01', 'active'),
  (v_tenant, v_entity, g3, 1,  14000000, '2026-01-01', 'active'),
  (v_tenant, v_entity, g4, 1,  22000000, '2026-01-01', 'active'),
  (v_tenant, v_entity, g5, 1,  38000000, '2026-01-01', 'active'),
  (v_tenant, v_entity, g6, 1,  70000000, '2026-01-01', 'active')
ON CONFLICT DO NOTHING;

-- ============================================================
-- ALLOWANCE MATRIX (tunjangan per grade)
-- ============================================================
INSERT INTO allowance_matrix (tenant_id, job_grade_id, salary_component_id, amount) VALUES
  -- Transportasi
  (v_tenant, g1, sc_trans, 500000),
  (v_tenant, g2, sc_trans, 750000),
  (v_tenant, g3, sc_trans, 1000000),
  (v_tenant, g4, sc_trans, 1500000),
  (v_tenant, g5, sc_trans, 2000000),
  (v_tenant, g6, sc_trans, 2500000),
  -- Makan
  (v_tenant, g1, sc_meal, 600000),
  (v_tenant, g2, sc_meal, 700000),
  (v_tenant, g3, sc_meal, 800000),
  (v_tenant, g4, sc_meal, 1000000),
  (v_tenant, g5, sc_meal, 1200000),
  (v_tenant, g6, sc_meal, 1500000),
  -- Komunikasi
  (v_tenant, g1, sc_phone, 0),
  (v_tenant, g2, sc_phone, 200000),
  (v_tenant, g3, sc_phone, 300000),
  (v_tenant, g4, sc_phone, 500000),
  (v_tenant, g5, sc_phone, 750000),
  (v_tenant, g6, sc_phone, 1000000)
ON CONFLICT (tenant_id, job_grade_id, salary_component_id) DO UPDATE SET amount = EXCLUDED.amount;

-- ============================================================
-- ENTITY PAYROLL CONFIG
-- ============================================================
INSERT INTO entity_payroll_configs (
  tenant_id, entity_id, effective_date, city, province, umr_amount,
  bpjs_tk_employee_rate, bpjs_tk_company_rate, bpjs_tk_salary_cap,
  bpjs_health_employee_rate, bpjs_health_company_rate, bpjs_health_salary_cap,
  pph21_method, pph21_rate, npwp_required, status
) VALUES (
  v_tenant, v_entity, '2026-01-01', 'Jakarta', 'DKI Jakarta', 5067381,
  0.02, 0.037, NULL,
  0.01, 0.04, 12000000,
  'gross', 0, false, 'active'
) ON CONFLICT (tenant_id, entity_id, effective_date) DO NOTHING;

-- ============================================================
-- PAYROLL CUTOFF CONFIG
-- ============================================================
INSERT INTO payroll_cutoff_configs (
  tenant_id, entity_id, paygroup_name,
  att_cutoff_start_day, att_cutoff_end_day,
  pay_cutoff_start_day, pay_cutoff_end_day,
  enable_prorata, prorata_divisor, is_default, status
) VALUES (
  v_tenant, v_entity, 'default',
  26, 25,   -- attendance cutoff: 26 prev month to 25 current
  1, 31,    -- payroll cutoff: 1-31 same month
  true, 30, true, 'active'
) ON CONFLICT (tenant_id, entity_id, paygroup_name) DO NOTHING;

END $$;
