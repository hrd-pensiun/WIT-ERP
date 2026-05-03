-- Konfigurasi payroll per entity: UMR, BPJS, dan pajak
CREATE TABLE IF NOT EXISTS entity_payroll_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  city VARCHAR(50),
  province VARCHAR(50),
  umr_amount NUMERIC(20,4) NOT NULL DEFAULT 0,
  bpjs_tk_employee_rate NUMERIC(7,4) NOT NULL DEFAULT 2.0000,
  bpjs_tk_company_rate NUMERIC(7,4) NOT NULL DEFAULT 3.7000,
  bpjs_tk_salary_cap NUMERIC(20,4),
  bpjs_health_employee_rate NUMERIC(7,4) NOT NULL DEFAULT 1.0000,
  bpjs_health_company_rate NUMERIC(7,4) NOT NULL DEFAULT 4.0000,
  bpjs_health_salary_cap NUMERIC(20,4),
  pph21_method VARCHAR(20) NOT NULL DEFAULT 'ter'
    CHECK (pph21_method IN ('gross', 'gross_up', 'net', 'ter', 'flat')),
  pph21_rate NUMERIC(7,4) NOT NULL DEFAULT 5.0000,
  npwp_required BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  created_by UUID,
  updated_by UUID,
  UNIQUE (tenant_id, entity_id, effective_date)
);

CREATE INDEX IF NOT EXISTS idx_entity_payroll_cfg_tenant_entity
  ON entity_payroll_configs (tenant_id, entity_id);
CREATE INDEX IF NOT EXISTS idx_entity_payroll_cfg_effective
  ON entity_payroll_configs (entity_id, effective_date DESC);

ALTER TABLE entity_payroll_configs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS entity_payroll_cfg_authenticated_all ON entity_payroll_configs;
CREATE POLICY entity_payroll_cfg_authenticated_all
  ON entity_payroll_configs
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON entity_payroll_configs TO authenticated;
