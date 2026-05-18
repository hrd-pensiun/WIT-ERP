-- ============================================================
-- 012_position_eligibility.sql
-- Position allowance and fine eligibility
-- ============================================================

CREATE TABLE IF NOT EXISTS position_allowance_eligibility (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL,
  position_id         uuid NOT NULL REFERENCES hr_positions(id) ON DELETE CASCADE,
  salary_component_id uuid NOT NULL REFERENCES salary_components(id),
  is_eligible         boolean NOT NULL DEFAULT false,
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, position_id, salary_component_id)
);

CREATE TABLE IF NOT EXISTS position_fine_eligibility (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL,
  position_id uuid NOT NULL REFERENCES hr_positions(id) ON DELETE CASCADE,
  fine_type   varchar(30) NOT NULL
                CHECK (fine_type IN ('late','no_checkin','no_checkout')),
  is_subject  boolean NOT NULL DEFAULT false,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, position_id, fine_type)
);

-- RLS
ALTER TABLE position_allowance_eligibility ENABLE ROW LEVEL SECURITY;
ALTER TABLE position_fine_eligibility      ENABLE ROW LEVEL SECURITY;

CREATE POLICY pos_allowance_elig_all ON position_allowance_eligibility FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY pos_fine_elig_all      ON position_fine_eligibility      FOR ALL TO authenticated USING (true) WITH CHECK (true);
