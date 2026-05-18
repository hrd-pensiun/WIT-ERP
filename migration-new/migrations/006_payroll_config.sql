-- ============================================================
-- 006_payroll_config.sql
-- Payroll configuration: entity configs, cutoff, overrides
-- ============================================================

CREATE TABLE IF NOT EXISTS entity_payroll_configs (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 uuid NOT NULL,
  entity_id                 uuid NOT NULL REFERENCES entities(id),
  effective_date            date NOT NULL,
  city                      varchar(100),
  province                  varchar(100),
  umr_amount                numeric(15,2) NOT NULL DEFAULT 0,
  bpjs_tk_employee_rate     numeric(5,4) NOT NULL DEFAULT 0.02,
  bpjs_tk_company_rate      numeric(5,4) NOT NULL DEFAULT 0.037,
  bpjs_tk_salary_cap        numeric(15,2),
  bpjs_health_employee_rate numeric(5,4) NOT NULL DEFAULT 0.01,
  bpjs_health_company_rate  numeric(5,4) NOT NULL DEFAULT 0.04,
  bpjs_health_salary_cap    numeric(15,2),
  pph21_method              varchar(20) NOT NULL DEFAULT 'gross'
                              CHECK (pph21_method IN ('gross','gross_up','net','ter','flat')),
  pph21_rate                numeric(5,4) NOT NULL DEFAULT 0,
  npwp_required             boolean NOT NULL DEFAULT false,
  notes                     text,
  status                    varchar(20) NOT NULL DEFAULT 'active',
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, entity_id, effective_date)
);

CREATE TABLE IF NOT EXISTS payroll_cutoff_configs (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 uuid NOT NULL,
  entity_id                 uuid REFERENCES entities(id),
  paygroup_name             varchar(50) NOT NULL DEFAULT 'default',
  att_cutoff_start_day      integer NOT NULL DEFAULT 1,
  att_cutoff_start_prev_month boolean DEFAULT false,
  att_cutoff_end_day        integer NOT NULL DEFAULT 31,
  pay_cutoff_start_day      integer NOT NULL DEFAULT 1,
  pay_cutoff_start_prev_month boolean DEFAULT false,
  pay_cutoff_end_day        integer NOT NULL DEFAULT 31,
  enable_prorata            boolean DEFAULT true,
  prorata_divisor           integer DEFAULT 30,
  is_default                boolean DEFAULT false,
  status                    varchar(20) NOT NULL DEFAULT 'active',
  notes                     text,
  updated_at                timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, entity_id, paygroup_name)
);

CREATE TABLE IF NOT EXISTS payroll_period_overrides (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            uuid NOT NULL,
  entity_id            uuid REFERENCES entities(id),
  period_year          integer NOT NULL,
  period_month         integer NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  paygroup_name        varchar(50) NOT NULL DEFAULT 'default',
  attendance_start_date date,
  attendance_end_date   date,
  payroll_start_date    date,
  payroll_end_date      date,
  reason               text,
  updated_at           timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, entity_id, period_year, period_month, paygroup_name)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_epc_tenant    ON entity_payroll_configs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pcc_tenant    ON payroll_cutoff_configs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ppo_tenant    ON payroll_period_overrides(tenant_id);

-- RLS
ALTER TABLE entity_payroll_configs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_cutoff_configs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_period_overrides  ENABLE ROW LEVEL SECURITY;

CREATE POLICY entity_payroll_configs_all   ON entity_payroll_configs   FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY payroll_cutoff_configs_all   ON payroll_cutoff_configs   FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY payroll_period_overrides_all ON payroll_period_overrides FOR ALL TO authenticated USING (true) WITH CHECK (true);
