-- ============================================================
-- 003_seed_commercial.sql
-- Commercial seed: lead statuses, project types, rate cards,
-- nomenclature configs
-- ============================================================

DO $$
DECLARE
  v_tenant uuid := '00000000-0000-0000-0000-000000000001';
BEGIN

-- ============================================================
-- COMMERCIAL LEAD STATUS
-- ============================================================
INSERT INTO commercial_lead_status (tenant_id, name, color, sort_order, is_active) VALUES
  (v_tenant, 'New',         '#3b82f6', 1, true),
  (v_tenant, 'Contacted',   '#f97316', 2, true),
  (v_tenant, 'Qualified',   '#a855f7', 3, true),
  (v_tenant, 'Proposal',    '#eab308', 4, true),
  (v_tenant, 'Negotiation', '#06b6d4', 5, true),
  (v_tenant, 'Won',         '#22c55e', 6, true),
  (v_tenant, 'Lost',        '#ef4444', 7, true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- COMMERCIAL PROJECT TYPES
-- ============================================================
INSERT INTO commercial_project_types (tenant_id, name, description, is_active, sort_order) VALUES
  (v_tenant, 'Web Development',         'Pengembangan aplikasi berbasis web',                     true, 1),
  (v_tenant, 'Mobile Development',      'Pengembangan aplikasi Android / iOS',                    true, 2),
  (v_tenant, 'ERP Implementation',      'Implementasi sistem ERP (SAP, Odoo, custom)',            true, 3),
  (v_tenant, 'UI/UX Design',            'Desain antarmuka dan pengalaman pengguna',               true, 4),
  (v_tenant, 'Data Engineering',        'Pipeline data, ETL, data warehouse, BI dashboard',       true, 5),
  (v_tenant, 'AI / ML Integration',     'Integrasi AI/ML ke sistem yang sudah ada',               true, 6),
  (v_tenant, 'IT Consulting',           'Konsultasi arsitektur dan strategi teknologi',           true, 7),
  (v_tenant, 'System Integration',      'Integrasi API dan sistem heterogen',                     true, 8),
  (v_tenant, 'Quality Assurance',       'Pengujian manual, automation testing, load testing',     true, 9),
  (v_tenant, 'DevOps & Infrastructure', 'Setup CI/CD, cloud infrastructure, monitoring',          true, 10)
ON CONFLICT DO NOTHING;

-- ============================================================
-- COMMERCIAL RATE CARDS
-- ============================================================
INSERT INTO commercial_rate_cards (tenant_id, project_type, group_name, role_name, hpp_rate, special_rate, publish_rate, is_active) VALUES
  -- Web Development
  (v_tenant, 'Web Development', 'Frontend', 'Junior Frontend Developer',   4000000,  6000000,  9000000,  true),
  (v_tenant, 'Web Development', 'Frontend', 'Mid Frontend Developer',      8000000,  12000000, 18000000, true),
  (v_tenant, 'Web Development', 'Frontend', 'Senior Frontend Developer',   14000000, 20000000, 30000000, true),
  (v_tenant, 'Web Development', 'Backend',  'Junior Backend Developer',    4000000,  6000000,  9000000,  true),
  (v_tenant, 'Web Development', 'Backend',  'Mid Backend Developer',       8000000,  12000000, 18000000, true),
  (v_tenant, 'Web Development', 'Backend',  'Senior Backend Developer',    14000000, 20000000, 30000000, true),
  (v_tenant, 'Web Development', 'Backend',  'Tech Lead',                   22000000, 28000000, 42000000, true),
  (v_tenant, 'Web Development', 'Design',   'UI/UX Designer',              8000000,  12000000, 18000000, true),
  (v_tenant, 'Web Development', 'QA',       'QA Engineer',                 8000000,  11000000, 16000000, true),
  (v_tenant, 'Web Development', 'PM',       'Project Manager',             22000000, 28000000, 40000000, true),
  -- Mobile Development
  (v_tenant, 'Mobile Development', 'Mobile', 'Junior Mobile Developer',   4500000,  7000000,  10500000, true),
  (v_tenant, 'Mobile Development', 'Mobile', 'Mid Mobile Developer',      9000000,  14000000, 21000000, true),
  (v_tenant, 'Mobile Development', 'Mobile', 'Senior Mobile Developer',   16000000, 22000000, 33000000, true),
  (v_tenant, 'Mobile Development', 'Mobile', 'Tech Lead Mobile',          24000000, 30000000, 45000000, true),
  (v_tenant, 'Mobile Development', 'Design', 'UI/UX Designer',            8000000,  12000000, 18000000, true),
  -- ERP Implementation
  (v_tenant, 'ERP Implementation', 'Functional', 'ERP Functional Consultant', 15000000, 22000000, 33000000, true),
  (v_tenant, 'ERP Implementation', 'Technical',  'ERP Technical Consultant',  12000000, 18000000, 27000000, true),
  (v_tenant, 'ERP Implementation', 'PM',         'Project Manager',           22000000, 28000000, 42000000, true),
  -- Data Engineering
  (v_tenant, 'Data Engineering', 'Data', 'Data Engineer',                 12000000, 18000000, 27000000, true),
  (v_tenant, 'Data Engineering', 'Data', 'Senior Data Engineer',          18000000, 25000000, 37500000, true),
  (v_tenant, 'Data Engineering', 'BI',   'BI Developer',                  10000000, 15000000, 22500000, true),
  -- IT Consulting
  (v_tenant, 'IT Consulting', 'Consulting', 'IT Consultant',              18000000, 25000000, 40000000, true),
  (v_tenant, 'IT Consulting', 'Consulting', 'Senior IT Consultant',       28000000, 38000000, 60000000, true),
  (v_tenant, 'IT Consulting', 'Consulting', 'Solution Architect',         35000000, 48000000, 75000000, true)
ON CONFLICT DO NOTHING;

-- ============================================================
-- COMMERCIAL NOMENCLATURE
-- ============================================================
INSERT INTO commercial_nomenclature (tenant_id, entity, prefix, year_type, separator, seq_digits, last_sequence) VALUES
  (v_tenant, 'Lead',      'LD',  'YYYY', '/', 4, 0),
  (v_tenant, 'Project',   'PRJ', 'YYYY', '/', 4, 0),
  (v_tenant, 'Quotation', 'QT',  'YYYY', '/', 4, 0)
ON CONFLICT (tenant_id, entity) DO NOTHING;

END $$;
