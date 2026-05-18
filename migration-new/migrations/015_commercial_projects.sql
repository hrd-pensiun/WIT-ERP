-- ============================================================
-- 015_commercial_projects.sql
-- Commercial projects and manpower
-- ============================================================

CREATE TABLE IF NOT EXISTS commercial_projects (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id            uuid NOT NULL,
  lead_id              uuid REFERENCES crm_leads(id) ON DELETE SET NULL,
  project_code         varchar(50),
  project_name         varchar(300) NOT NULL,
  company_name         varchar(200),
  client_name          varchar(200),
  project_type         varchar(100),
  status               varchar(30) NOT NULL DEFAULT 'draft'
                         CHECK (status IN ('draft','administration','kick-off','on-going','completed','overdue','hold')),
  health               varchar(20) DEFAULT 'on_track'
                         CHECK (health IN ('on_track','at_risk','critical','completed')),

  -- Team
  pic_commercial_id    uuid REFERENCES user_profiles(id),
  pic_adm_id           uuid REFERENCES user_profiles(id),
  pm_id                uuid REFERENCES user_profiles(id),

  -- Financials
  po_value             numeric(20,2) DEFAULT 0,
  total_hpp            numeric(20,2) DEFAULT 0,
  total_publish        numeric(20,2) DEFAULT 0,
  quotation_publish    numeric(20,2) DEFAULT 0,
  actual_deal          numeric(20,2) DEFAULT 0,
  grand_total          numeric(20,2) DEFAULT 0,
  margin_pct           numeric(7,4) DEFAULT 0,
  deductions_data      jsonb DEFAULT '[]',
  topp_data            jsonb DEFAULT '{}',
  term_of_payment      varchar(100),

  -- Dates
  start_date           date,
  kickoff_date         date,
  start_dev_date       date,
  end_date             date,

  -- URLs & meeting
  project_url          text,
  online_meeting_url   text,
  notetaker_account    text,
  meeting_schedule     jsonb DEFAULT '{}',

  -- Snapshots (data carried over from lead)
  lead_data_snapshot   jsonb DEFAULT '{}',
  mom_snapshot         jsonb DEFAULT '[]',
  cost_analysis_snapshot jsonb DEFAULT '{}',
  summary_snapshot     jsonb DEFAULT '{}',

  notes                text,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  deleted_at           timestamptz,
  created_by           uuid,
  updated_by           uuid
);

CREATE TABLE IF NOT EXISTS commercial_project_manpower (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL,
  project_id   uuid NOT NULL REFERENCES commercial_projects(id) ON DELETE CASCADE,
  role_name    varchar(200) NOT NULL,
  qty          integer NOT NULL DEFAULT 1,
  months       integer NOT NULL DEFAULT 1,
  hpp_rate     numeric(15,2) NOT NULL DEFAULT 0,
  publish_rate numeric(15,2) NOT NULL DEFAULT 0,
  special_rate numeric(15,2) DEFAULT 0,
  work_mode    varchar(20) DEFAULT 'Remote'
                 CHECK (work_mode IN ('Remote','Hybrid','Onsite')),
  sort_order   integer NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_comm_projects_tenant   ON commercial_projects(tenant_id);
CREATE INDEX IF NOT EXISTS idx_comm_projects_status   ON commercial_projects(status);
CREATE INDEX IF NOT EXISTS idx_comm_projects_lead     ON commercial_projects(lead_id);
CREATE INDEX IF NOT EXISTS idx_comm_manpower_project  ON commercial_project_manpower(project_id);

-- RLS
ALTER TABLE commercial_projects        ENABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_project_manpower ENABLE ROW LEVEL SECURITY;

CREATE POLICY commercial_projects_all        ON commercial_projects        FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY commercial_project_manpower_all ON commercial_project_manpower FOR ALL TO authenticated USING (true) WITH CHECK (true);
