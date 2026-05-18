-- ============================================================
-- 013_crm_core.sql
-- CRM: lead status, leads, opportunities
-- ============================================================

CREATE TABLE IF NOT EXISTS commercial_lead_status (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid NOT NULL,
  name       varchar(100) NOT NULL,
  color      varchar(30),
  sort_order integer NOT NULL DEFAULT 0,
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS crm_leads (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             uuid NOT NULL,
  entity_id             uuid REFERENCES entities(id),
  lead_number           varchar(50),
  title                 varchar(255),
  lead_source           varchar(50) DEFAULT 'other'
                          CHECK (lead_source IN ('website','referral','social_media','email','phone','event','walk_in','partner','other')),
  lead_source_detail    text,
  campaign_id           uuid,
  company_name          varchar(200),
  company_address       text,
  industry              varchar(100),
  company_size          varchar(50),
  company_website       varchar(200),
  contact_name          varchar(200),
  contact_email         varchar(200),
  contact_phone         varchar(30),
  contact_position      varchar(100),
  budget_confirmed      boolean DEFAULT false,
  budget_value          text,
  bant_notes            text,
  authority_confirmed   boolean DEFAULT false,
  authority_detail      text,
  need_confirmed        boolean DEFAULT false,
  need_detail           text,
  timeline_confirmed    boolean DEFAULT false,
  timeline_detail       text,
  bant_score            integer DEFAULT 0,
  pic_sales_id          uuid REFERENCES user_profiles(id),
  se_assigned_id        uuid REFERENCES user_profiles(id),
  project_type_id       uuid,
  status                varchar(30) NOT NULL DEFAULT 'new',
  priority              varchar(20) DEFAULT 'medium'
                          CHECK (priority IN ('low','medium','high','urgent')),
  estimated_value       numeric(20,2),
  currency              varchar(10) DEFAULT 'IDR',
  probability           integer DEFAULT 10,
  expected_close_date   date,
  scope_of_work         text,
  terms_and_conditions  text,
  quotation_valid_days  integer DEFAULT 14,
  notes                 text,
  last_activity_at      timestamptz,
  next_follow_up        date,
  product_interest      jsonb DEFAULT '[]',
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  deleted_at            timestamptz,
  created_by            uuid,
  updated_by            uuid
);

CREATE TABLE IF NOT EXISTS crm_opportunities (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                uuid NOT NULL,
  lead_id                  uuid REFERENCES crm_leads(id) ON DELETE SET NULL,
  title                    varchar(300) NOT NULL,
  description              text,
  value                    numeric(20,2) DEFAULT 0,
  currency                 varchar(10) DEFAULT 'IDR',
  category_id              uuid,
  expected_start_date      date,
  expected_duration_months integer,
  expected_close_date      date,
  actual_close_date        date,
  stage                    varchar(50) NOT NULL DEFAULT 'New',
  probability              integer DEFAULT 10,
  pic_sales_id             uuid REFERENCES user_profiles(id),
  se_assigned_id           uuid REFERENCES user_profiles(id),
  loss_reason              varchar(100),
  loss_reason_detail       text,
  competitor_name          varchar(200),
  estimated_bopp_amount    numeric(20,2),
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now(),
  deleted_at               timestamptz,
  created_by               uuid,
  updated_by               uuid
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_crm_leads_tenant     ON crm_leads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_status     ON crm_leads(status);
CREATE INDEX IF NOT EXISTS idx_crm_leads_deleted    ON crm_leads(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_crm_opp_tenant       ON crm_opportunities(tenant_id);
CREATE INDEX IF NOT EXISTS idx_crm_opp_lead         ON crm_opportunities(lead_id);

-- RLS
ALTER TABLE commercial_lead_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_leads              ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_opportunities      ENABLE ROW LEVEL SECURITY;

CREATE POLICY commercial_lead_status_all ON commercial_lead_status FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY crm_leads_all              ON crm_leads              FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY crm_opportunities_all      ON crm_opportunities      FOR ALL TO authenticated USING (true) WITH CHECK (true);
