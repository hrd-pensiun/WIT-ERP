-- Gaji override per karyawan (history; entry terbaru dengan effective_date aktif = gaji saat ini)
CREATE TABLE IF NOT EXISTS employee_salaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  user_profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  effective_date DATE NOT NULL,
  amount NUMERIC(20,4) NOT NULL,
  reason VARCHAR(100),
  reason_other TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID
);
CREATE INDEX IF NOT EXISTS idx_emp_sal_user
  ON employee_salaries(tenant_id, user_profile_id, effective_date DESC);
ALTER TABLE employee_salaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY emp_sal_auth ON employee_salaries FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
GRANT SELECT, INSERT ON employee_salaries TO authenticated;

-- Log perubahan tunjangan per karyawan
CREATE TABLE IF NOT EXISTS employee_allowance_histories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  employee_allowance_id UUID REFERENCES employee_allowances(id),
  user_profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  salary_component_id UUID REFERENCES salary_components(id),
  change_type VARCHAR(20) NOT NULL
    CHECK (change_type IN ('create', 'update', 'delete')),
  old_amount NUMERIC(20,4),
  new_amount NUMERIC(20,4),
  effective_date DATE NOT NULL,
  reason VARCHAR(100),
  reason_other TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID
);
CREATE INDEX IF NOT EXISTS idx_eah_allowance
  ON employee_allowance_histories(employee_allowance_id);
ALTER TABLE employee_allowance_histories ENABLE ROW LEVEL SECURITY;
CREATE POLICY eah_auth ON employee_allowance_histories FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
GRANT SELECT, INSERT ON employee_allowance_histories TO authenticated;
