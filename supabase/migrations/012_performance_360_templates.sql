-- Performance 360: template penilaian + pertanyaan (per tenant)
-- Run after 011_performance_360_rater_settings.sql

CREATE TABLE IF NOT EXISTS performance_360_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  name VARCHAR(500) NOT NULL,
  description TEXT,
  period_kind VARCHAR(32) NOT NULL,
  period_year INTEGER,
  period_custom_label VARCHAR(500),
  period_start DATE,
  period_end DATE,
  rating_scale_max INTEGER NOT NULL DEFAULT 5,
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_perf360_tpl_tenant ON performance_360_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_perf360_tpl_status ON performance_360_templates(tenant_id, status);

CREATE TABLE IF NOT EXISTS performance_360_template_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID NOT NULL REFERENCES performance_360_templates(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  category VARCHAR(200) NOT NULL,
  question_type VARCHAR(32) NOT NULL,
  weight NUMERIC(6, 2) NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_perf360_tq_template ON performance_360_template_questions(template_id);

COMMENT ON TABLE performance_360_templates IS 'Template 360° per tenant (informasi periode + skala)';
COMMENT ON TABLE performance_360_template_questions IS 'Pertanyaan per template; hapus template menghapus pertanyaan (CASCADE)';

ALTER TABLE performance_360_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_360_template_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS performance_360_templates_authenticated_all ON performance_360_templates;
CREATE POLICY performance_360_templates_authenticated_all
  ON performance_360_templates
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS performance_360_template_questions_authenticated_all ON performance_360_template_questions;
CREATE POLICY performance_360_template_questions_authenticated_all
  ON performance_360_template_questions
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON performance_360_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON performance_360_template_questions TO authenticated;
