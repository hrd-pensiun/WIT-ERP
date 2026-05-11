-- Migration: allowance_matrix
-- Default tunjangan per komponen per job grade (tanpa step/merit).
-- amount di sini adalah nominal default; bisa di-override via employee_allowances per individu.

CREATE TABLE IF NOT EXISTS allowance_matrix (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id           UUID NOT NULL,
  job_grade_id        UUID NOT NULL REFERENCES hr_job_grades(id) ON DELETE CASCADE,
  salary_component_id UUID NOT NULL REFERENCES salary_components(id) ON DELETE CASCADE,
  amount              NUMERIC(20,4) NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  created_by          UUID,
  updated_by          UUID,
  UNIQUE (tenant_id, job_grade_id, salary_component_id)
);

CREATE INDEX IF NOT EXISTS idx_am_grade     ON allowance_matrix(job_grade_id);
CREATE INDEX IF NOT EXISTS idx_am_component ON allowance_matrix(salary_component_id);
CREATE INDEX IF NOT EXISTS idx_am_tenant    ON allowance_matrix(tenant_id);

ALTER TABLE allowance_matrix ENABLE ROW LEVEL SECURITY;

CREATE POLICY am_auth ON allowance_matrix FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON allowance_matrix TO authenticated;
