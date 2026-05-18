-- ============================================================
-- 005_salary_core.sql
-- Salary components, matrix, and allowance matrix
-- ============================================================

CREATE TABLE IF NOT EXISTS salary_components (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL,
  entity_id         uuid REFERENCES entities(id),
  code              varchar(20) NOT NULL,
  name              varchar(200) NOT NULL,
  type              varchar(20) NOT NULL DEFAULT 'earning'
                      CHECK (type IN ('earning','deduction')),
  is_taxable        boolean DEFAULT true,
  is_fixed          boolean DEFAULT true,
  default_amount    numeric(15,2) DEFAULT 0,
  calculation_type  varchar(20) DEFAULT 'fixed'
                      CHECK (calculation_type IN ('fixed','percentage','formula')),
  affects_thp       boolean DEFAULT true,
  affects_topp      boolean DEFAULT false,
  description       text,
  status            varchar(20) NOT NULL DEFAULT 'active',
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  deleted_at        timestamptz,
  created_by        uuid,
  updated_by        uuid
);

CREATE TABLE IF NOT EXISTS salary_matrix (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL,
  entity_id      uuid REFERENCES entities(id),
  job_grade_id   uuid REFERENCES hr_job_grades(id),
  step           integer NOT NULL DEFAULT 1,
  amount         numeric(15,2) NOT NULL DEFAULT 0,
  effective_date date NOT NULL,
  end_date       date,
  status         varchar(20) NOT NULL DEFAULT 'active',
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  deleted_at     timestamptz,
  created_by     uuid,
  updated_by     uuid
);

CREATE TABLE IF NOT EXISTS allowance_matrix (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            uuid NOT NULL,
  job_grade_id         uuid NOT NULL REFERENCES hr_job_grades(id),
  salary_component_id  uuid NOT NULL REFERENCES salary_components(id),
  amount               numeric(15,2) NOT NULL DEFAULT 0,
  updated_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, job_grade_id, salary_component_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_salary_components_tenant ON salary_components(tenant_id);
CREATE INDEX IF NOT EXISTS idx_salary_matrix_tenant     ON salary_matrix(tenant_id);
CREATE INDEX IF NOT EXISTS idx_allowance_matrix_tenant  ON allowance_matrix(tenant_id);

-- RLS
ALTER TABLE salary_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_matrix     ENABLE ROW LEVEL SECURITY;
ALTER TABLE allowance_matrix  ENABLE ROW LEVEL SECURITY;

CREATE POLICY salary_components_all ON salary_components FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY salary_matrix_all     ON salary_matrix     FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY allowance_matrix_all  ON allowance_matrix  FOR ALL TO authenticated USING (true) WITH CHECK (true);
