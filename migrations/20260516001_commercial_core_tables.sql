-- ============================================================
-- Migration 20260516001: Commercial Core Tables + Lead Cost Analysis
-- ============================================================

-- Helper: update_updated_at_column trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 1. commercial_rate_cards
-- Master data harga per role/kombinasi
-- ============================================================
CREATE TABLE IF NOT EXISTS commercial_rate_cards (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_type    text NOT NULL DEFAULT 'Consultant',
  group_name      text NOT NULL DEFAULT 'IT Consulting',
  role_name       text NOT NULL,
  hpp_rate        numeric(15,2) NOT NULL DEFAULT 0,
  publish_rate    numeric(15,2) NOT NULL DEFAULT 0,
  special_rate    numeric(15,2) DEFAULT 0,
  is_active       boolean DEFAULT true,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

ALTER TABLE commercial_rate_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access commercial_rate_cards" ON commercial_rate_cards FOR ALL USING (true);
GRANT ALL ON commercial_rate_cards TO anon, authenticated;

CREATE INDEX idx_rate_cards_active ON commercial_rate_cards(is_active);
CREATE INDEX idx_rate_cards_type_group ON commercial_rate_cards(project_type, group_name);

CREATE TRIGGER trg_rate_cards_updated_at
  BEFORE UPDATE ON commercial_rate_cards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 2. commercial_projects
-- Header project + pricing snapshot
-- ============================================================
CREATE TABLE IF NOT EXISTS commercial_projects (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_code    text UNIQUE NOT NULL,
  project_name    text NOT NULL,
  project_type    text DEFAULT 'Consultant',
  client_name     text,
  status          text DEFAULT 'draft' CHECK (status IN ('draft','quotation','won','delivery','completed','lost')),
  health          text DEFAULT 'green' CHECK (health IN ('green','yellow','red')),

  -- Pricing snapshot
  total_hpp       numeric(15,2) DEFAULT 0,
  total_publish   numeric(15,2) DEFAULT 0,
  total_special   numeric(15,2) DEFAULT 0,
  grand_total     numeric(15,2) DEFAULT 0,
  margin_pct      numeric(5,2) DEFAULT 0,

  -- Deductions
  deductions_data jsonb DEFAULT '{}'::jsonb,
  topp_data       jsonb DEFAULT '{}'::jsonb,

  -- Deal
  quotation_publish numeric(15,2) DEFAULT 0,
  actual_deal       numeric(15,2) DEFAULT 0,

  -- Referensi lead
  lead_id         uuid,

  notes           text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now(),
  deleted_at      timestamptz
);

ALTER TABLE commercial_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access commercial_projects" ON commercial_projects FOR ALL USING (true);
GRANT ALL ON commercial_projects TO anon, authenticated;

CREATE INDEX idx_projects_status ON commercial_projects(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_lead ON commercial_projects(lead_id) WHERE lead_id IS NOT NULL;

CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON commercial_projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 3. commercial_project_manpower
-- Manpower rows snapshot
-- ============================================================
CREATE TABLE IF NOT EXISTS commercial_project_manpower (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid NOT NULL REFERENCES commercial_projects(id) ON DELETE CASCADE,
  role_name       text NOT NULL,
  qty             integer DEFAULT 1,
  months          integer DEFAULT 1,
  hpp_rate        numeric(15,2) DEFAULT 0,
  publish_rate    numeric(15,2) DEFAULT 0,
  special_rate    numeric(15,2) DEFAULT 0,
  sort_order      integer DEFAULT 0,
  created_at      timestamptz DEFAULT now(),
  deleted_at      timestamptz
);

ALTER TABLE commercial_project_manpower ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access commercial_project_manpower" ON commercial_project_manpower FOR ALL USING (true);
GRANT ALL ON commercial_project_manpower TO anon, authenticated;

CREATE INDEX idx_mp_project ON commercial_project_manpower(project_id);

-- ============================================================
-- 4. lead_cost_analyses
-- Cost analysis per lead (3 skema)
-- ============================================================
CREATE TABLE IF NOT EXISTS lead_cost_analyses (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id         uuid NOT NULL,
  scheme_type     text NOT NULL CHECK (scheme_type IN ('manpower', 'procurement', 'product')),

  -- Man Power data (JSON snapshot)
  manpower_data          jsonb,
  manpower_total_hpp     numeric(15,2) DEFAULT 0,
  manpower_total_publish numeric(15,2) DEFAULT 0,

  -- Procurement data
  procurement_data      jsonb,
  procurement_total     numeric(15,2) DEFAULT 0,
  instalasi_cost        numeric(15,2) DEFAULT 0,
  commissioning_cost    numeric(15,2) DEFAULT 0,
  shipping_cost         numeric(15,2) DEFAULT 0,

  -- Deductions & pricing snapshot
  deductions_data       jsonb DEFAULT '{}'::jsonb,
  topp_data             jsonb DEFAULT '{}'::jsonb,
  quotation_publish     numeric(15,2) DEFAULT 0,
  actual_deal           numeric(15,2) DEFAULT 0,

  -- Grand total
  grand_total           numeric(15,2) DEFAULT 0,
  margin_pct            numeric(5,2) DEFAULT 0,

  notes                 text,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now(),
  created_by            uuid,
  deleted_at            timestamptz
);

ALTER TABLE lead_cost_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access lead_cost_analyses" ON lead_cost_analyses FOR ALL USING (true);
GRANT ALL ON lead_cost_analyses TO anon, authenticated;

CREATE INDEX idx_cost_analysis_lead ON lead_cost_analyses(lead_id) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_cost_analysis_updated_at
  BEFORE UPDATE ON lead_cost_analyses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 5. View: v_commercial_project_summary
-- ============================================================
CREATE OR REPLACE VIEW v_commercial_project_summary AS
SELECT
  p.id,
  p.project_code,
  p.project_name,
  p.client_name,
  p.status,
  p.health,
  p.total_hpp,
  p.total_publish,
  p.grand_total,
  p.margin_pct,
  p.quotation_publish,
  p.actual_deal,
  COALESCE(SUM(m.qty), 0) AS total_manpower_qty,
  COUNT(m.id) AS total_manpower_rows,
  p.created_at,
  p.updated_at
FROM commercial_projects p
LEFT JOIN commercial_project_manpower m ON m.project_id = p.id AND p.deleted_at IS NULL
GROUP BY p.id;

-- ============================================================
-- 6. Auto project code generator
-- ============================================================
CREATE OR REPLACE FUNCTION get_next_project_code()
RETURNS text AS $$
DECLARE
  next_seq integer;
  current_year text;
BEGIN
  current_year := EXTRACT(YEAR FROM NOW())::text;
  SELECT COALESCE(MAX(CAST(SPLIT_PART(project_code, '-', 3) AS integer)), 0) + 1
  INTO next_seq
  FROM commercial_projects
  WHERE SPLIT_PART(project_code, '-', 2) = current_year;
  RETURN 'CMP-' || current_year || '-' || LPAD(next_seq::text, 4, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION trg_assign_project_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.project_code IS NULL THEN
    NEW.project_code := get_next_project_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_projects_assign_code
  BEFORE INSERT ON commercial_projects
  FOR EACH ROW
  WHEN (NEW.project_code IS NULL)
  EXECUTE FUNCTION trg_assign_project_code();

-- ============================================================
-- 7. Seed: Rate Card entries
-- ============================================================
INSERT INTO commercial_rate_cards (project_type, group_name, role_name, hpp_rate, publish_rate, special_rate) VALUES
  ('Consultant', 'IT Consulting', 'Consultant Strategic', 25000000, 37500000, 42500000),
  ('Consultant', 'IT Consulting', 'Consultant Senior', 17500000, 26250000, 30000000),
  ('Consultant', 'IT Consulting', 'Consultant', 12500000, 18750000, 22500000),
  ('Consultant', 'IT Consulting', 'Consultant Junior', 8500000, 12750000, 15000000),
  ('Consultant', 'IT Consulting', 'Project Manager', 20000000, 30000000, 35000000),
  ('Consultant', 'IT Consulting', 'Business Analyst', 15000000, 22500000, 27500000),
  ('Consultant', 'IT Consulting', 'System Analyst', 15000000, 22500000, 27500000),
  ('Consultant', 'IT Consulting', 'Technical Writer', 10000000, 15000000, 18500000),
  ('Consultant', 'IT Consulting', 'Quality Assurance', 12500000, 18750000, 22500000),
  ('Consultant', 'IT Consulting', 'Data Analyst', 15000000, 22500000, 27500000),
  ('Consultant', 'IT Consulting', 'Data Scientist', 25000000, 37500000, 42500000),
  ('Consultant', 'ERP Consulting', 'Functional Consultant Senior', 20000000, 30000000, 35000000),
  ('Consultant', 'ERP Consulting', 'Functional Consultant', 15000000, 22500000, 27500000),
  ('Consultant', 'ERP Consulting', 'Technical Consultant Senior', 20000000, 30000000, 35000000),
  ('Consultant', 'ERP Consulting', 'Technical Consultant', 15000000, 22500000, 27500000),
  ('Consultant', 'ERP Consulting', 'Trainer', 12500000, 18750000, 22500000),
  ('Consultant', 'ERP Consulting', 'Change Management', 17500000, 26250000, 30000000),
  ('Networking', 'Network Engineering', 'Network Architect', 25000000, 37500000, 42500000),
  ('Networking', 'Network Engineering', 'Network Engineer Senior', 20000000, 30000000, 35000000),
  ('Networking', 'Network Engineering', 'Network Engineer', 15000000, 22500000, 27500000),
  ('Networking', 'Network Engineering', 'Network Technician', 10000000, 15000000, 18500000),
  ('Networking', 'Network Engineering', 'Security Engineer', 20000000, 30000000, 35000000),
  ('Networking', 'Network Engineering', 'NOC Operator', 10000000, 15000000, 18500000),
  ('Networking', 'Network Engineering', 'Field Technician', 8500000, 12750000, 15000000),
  ('Project', 'Project Management', 'Senior Project Manager', 25000000, 37500000, 42500000),
  ('Project', 'Project Management', 'Project Manager', 20000000, 30000000, 35000000),
  ('Project', 'Project Management', 'Project Coordinator', 12500000, 18750000, 22500000),
  ('Project', 'Project Management', 'Project Administrator', 10000000, 15000000, 18500000),
  ('Project', 'Project Management', 'Risk Manager', 20000000, 30000000, 35000000),
  ('Project', 'Project Management', 'Procurement Specialist', 15000000, 22500000, 27500000),
  ('Project', 'Project Management', 'Document Controller', 10000000, 15000000, 18500000),
  ('Web', 'Web Development', 'Web Developer Senior', 20000000, 30000000, 35000000),
  ('Web', 'Web Development', 'Web Developer', 15000000, 22500000, 27500000),
  ('Web', 'Web Development', 'Web Developer Junior', 10000000, 15000000, 18500000),
  ('Web', 'Web Development', 'UI/UX Designer', 15000000, 22500000, 27500000),
  ('Web', 'Web Development', 'Frontend Developer', 15000000, 22500000, 27500000),
  ('Web', 'Web Development', 'Backend Developer', 17500000, 26250000, 30000000),
  ('Web', 'Web Development', 'Full Stack Developer', 20000000, 30000000, 35000000),
  ('Web', 'Web Development', 'DevOps Engineer', 20000000, 30000000, 35000000),
  ('WMS', 'Warehouse Management', 'WMS Consultant', 17500000, 26250000, 30000000),
  ('WMS', 'Warehouse Management', 'WMS Developer', 17500000, 26250000, 30000000)
ON CONFLICT DO NOTHING;
