-- Migration: position_allowance_eligibility
-- Menentukan komponen tunjangan mana yang berlaku untuk jabatan tertentu.
-- Jika row tidak ada atau is_eligible = false, jabatan tidak mendapat tunjangan tersebut.

CREATE TABLE IF NOT EXISTS position_allowance_eligibility (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id           UUID NOT NULL,
  position_id         UUID NOT NULL REFERENCES hr_positions(id) ON DELETE CASCADE,
  salary_component_id UUID NOT NULL REFERENCES salary_components(id) ON DELETE CASCADE,
  is_eligible         BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  created_by          UUID,
  updated_by          UUID,
  UNIQUE (tenant_id, position_id, salary_component_id)
);

CREATE INDEX IF NOT EXISTS idx_pae_position  ON position_allowance_eligibility(position_id);
CREATE INDEX IF NOT EXISTS idx_pae_component ON position_allowance_eligibility(salary_component_id);
CREATE INDEX IF NOT EXISTS idx_pae_tenant    ON position_allowance_eligibility(tenant_id);

ALTER TABLE position_allowance_eligibility ENABLE ROW LEVEL SECURITY;

CREATE POLICY pae_auth ON position_allowance_eligibility FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON position_allowance_eligibility TO authenticated;
