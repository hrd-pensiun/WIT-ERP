-- ============================================================
-- 014_commercial_nomenclature.sql
-- Nomenclature, project types, rate cards
-- ============================================================

CREATE TABLE IF NOT EXISTS commercial_nomenclature (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL,
  entity        varchar(50) NOT NULL,       -- e.g. 'Lead', 'Project', 'Quotation'
  prefix        varchar(20) NOT NULL,
  year_type     varchar(10) DEFAULT 'YYYY'  -- 'YY' | 'YYYY' | 'none'
                  CHECK (year_type IN ('YY','YYYY','none')),
  separator     varchar(5) DEFAULT '/',
  seq_digits    integer NOT NULL DEFAULT 4,
  last_sequence integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, entity)
);

CREATE TABLE IF NOT EXISTS commercial_project_types (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL,
  name        varchar(100) NOT NULL,
  description text,
  is_active   boolean NOT NULL DEFAULT true,
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS commercial_rate_cards (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL,
  project_type varchar(100),
  group_name   varchar(100),
  role_name    varchar(200) NOT NULL,
  hpp_rate     numeric(15,2) NOT NULL DEFAULT 0,
  special_rate numeric(15,2) NOT NULL DEFAULT 0,
  publish_rate numeric(15,2) NOT NULL DEFAULT 0,
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  deleted_at   timestamptz
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_nomenclature_tenant    ON commercial_nomenclature(tenant_id);
CREATE INDEX IF NOT EXISTS idx_project_types_tenant   ON commercial_project_types(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rate_cards_tenant      ON commercial_rate_cards(tenant_id);

-- RLS
ALTER TABLE commercial_nomenclature   ENABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_project_types  ENABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_rate_cards     ENABLE ROW LEVEL SECURITY;

CREATE POLICY commercial_nomenclature_all  ON commercial_nomenclature  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY commercial_project_types_all ON commercial_project_types FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY commercial_rate_cards_all    ON commercial_rate_cards    FOR ALL TO authenticated USING (true) WITH CHECK (true);
