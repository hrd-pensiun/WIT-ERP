-- ============================================================
-- 016_lead_documents.sql
-- Lead-linked documents: MOM, quotations, cost analyses,
-- project briefs, technical analyses, quotation summaries
-- ============================================================

CREATE TABLE IF NOT EXISTS lead_mom (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL,
  lead_id         uuid NOT NULL REFERENCES crm_leads(id) ON DELETE CASCADE,
  title           varchar(300),
  meeting_date    date,
  participants    text,
  notes           text,
  link_attachment text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz,
  created_by      uuid
);

CREATE TABLE IF NOT EXISTS lead_quotations (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid NOT NULL,
  lead_id          uuid NOT NULL REFERENCES crm_leads(id) ON DELETE CASCADE,
  quotation_number varchar(50),
  title            varchar(300),
  amount           numeric(20,2) DEFAULT 0,
  status           varchar(30) DEFAULT 'draft'
                     CHECK (status IN ('draft','sent','accepted','rejected','expired')),
  notes            text,
  valid_until      date,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  deleted_at       timestamptz,
  created_by       uuid
);

CREATE TABLE IF NOT EXISTS lead_cost_analyses (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             uuid NOT NULL,
  lead_id               uuid NOT NULL REFERENCES crm_leads(id) ON DELETE CASCADE,
  scheme_type           varchar(50) DEFAULT 'standard',
  manpower_data         jsonb DEFAULT '[]',
  manpower_total_hpp    numeric(20,2) DEFAULT 0,
  manpower_total_publish numeric(20,2) DEFAULT 0,
  deductions_data       jsonb DEFAULT '[]',
  topp_data             jsonb DEFAULT '{}',
  quotation_publish     numeric(20,2) DEFAULT 0,
  actual_deal           numeric(20,2) DEFAULT 0,
  grand_total           numeric(20,2) DEFAULT 0,
  margin_pct            numeric(7,4) DEFAULT 0,
  notes                 text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  deleted_at            timestamptz,
  created_by            uuid
);

CREATE TABLE IF NOT EXISTS lead_project_briefs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL,
  lead_id         uuid NOT NULL REFERENCES crm_leads(id) ON DELETE CASCADE,
  description     text,
  file_name       varchar(300),
  file_url        text,
  file_size       bigint,
  link_attachment text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz,
  created_by      uuid
);

CREATE TABLE IF NOT EXISTS lead_technical_analyses (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL,
  lead_id         uuid NOT NULL REFERENCES crm_leads(id) ON DELETE CASCADE,
  title           varchar(255),
  content         text,
  link_attachment text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz,
  created_by      uuid
);

CREATE TABLE IF NOT EXISTS lead_quotation_summaries (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL,
  lead_id      uuid NOT NULL REFERENCES crm_leads(id) ON DELETE CASCADE,
  total_amount numeric(20,2) DEFAULT 0,
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  deleted_at   timestamptz
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lead_mom_lead        ON lead_mom(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_quotations_lead ON lead_quotations(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_cost_lead       ON lead_cost_analyses(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_brief_lead      ON lead_project_briefs(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_tech_lead       ON lead_technical_analyses(lead_id);

-- RLS
ALTER TABLE lead_mom                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_quotations           ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_cost_analyses        ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_project_briefs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_technical_analyses   ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_quotation_summaries  ENABLE ROW LEVEL SECURITY;

CREATE POLICY lead_mom_all                 ON lead_mom                 FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY lead_quotations_all          ON lead_quotations          FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY lead_cost_analyses_all       ON lead_cost_analyses       FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY lead_project_briefs_all      ON lead_project_briefs      FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY lead_technical_analyses_all  ON lead_technical_analyses  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY lead_quotation_summaries_all ON lead_quotation_summaries FOR ALL TO authenticated USING (true) WITH CHECK (true);
