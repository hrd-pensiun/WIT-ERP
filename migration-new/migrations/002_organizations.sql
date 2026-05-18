-- ============================================================
-- 002_organizations.sql
-- Core organization structure: entities, departments, divisions
-- ============================================================

CREATE TABLE IF NOT EXISTS entities (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             uuid NOT NULL,
  code                  varchar(20),
  name                  varchar(200) NOT NULL,
  type                  varchar(50) DEFAULT 'branch'
                          CHECK (type IN ('branch','unit_business','subsidiary')),
  address               text,
  city                  varchar(100),
  province              varchar(100),
  phone                 varchar(30),
  email                 varchar(200),
  npwp                  varchar(30),
  bpjs_tk_number        varchar(50),
  bpjs_kes_number       varchar(50),
  latitude              numeric(10,7),
  longitude             numeric(10,7),
  radius_meters         integer DEFAULT 100,
  grace_period_minutes  integer DEFAULT 15,
  is_headquarters       boolean NOT NULL DEFAULT false,
  status                varchar(20) NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active','inactive')),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  deleted_at            timestamptz,
  created_by            uuid,
  updated_by            uuid
);

CREATE TABLE IF NOT EXISTS departments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid NOT NULL,
  entity_id   uuid REFERENCES entities(id),
  code        varchar(20),
  name        varchar(200) NOT NULL,
  description text,
  status      varchar(20) NOT NULL DEFAULT 'active',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  deleted_at  timestamptz,
  created_by  uuid,
  updated_by  uuid
);

CREATE TABLE IF NOT EXISTS divisions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL,
  entity_id     uuid REFERENCES entities(id),
  department_id uuid REFERENCES departments(id),
  code          varchar(20),
  name          varchar(200) NOT NULL,
  description   text,
  status        varchar(20) NOT NULL DEFAULT 'active',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz,
  created_by    uuid,
  updated_by    uuid
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_entities_tenant ON entities(tenant_id);
CREATE INDEX IF NOT EXISTS idx_departments_tenant ON departments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_divisions_tenant ON divisions(tenant_id);

-- RLS
ALTER TABLE entities       ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE divisions      ENABLE ROW LEVEL SECURITY;

CREATE POLICY entities_all    ON entities    FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY departments_all ON departments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY divisions_all   ON divisions   FOR ALL TO authenticated USING (true) WITH CHECK (true);
