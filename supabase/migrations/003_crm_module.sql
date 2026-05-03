-- WIT-ERP Sprint 2: CRM Module Schema
-- Run this in InsForge SQL Editor after 002_hr_module.sql

-- ============================================
-- 8. CRM LEADS
-- ============================================

CREATE TABLE IF NOT EXISTS crm_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  entity_id UUID REFERENCES entities(id),
  
  -- Source tracking
  lead_source VARCHAR(50) CHECK (lead_source IN ('website', 'referral', 'social_media', 'email', 'phone', 'event', 'walk_in', 'partner', 'other')),
  lead_source_detail TEXT,
  campaign_id UUID, -- For future marketing integration
  
  -- Company info
  company_name VARCHAR(200),
  industry VARCHAR(100),
  company_size VARCHAR(20) CHECK (company_size IN ('1-10', '11-50', '51-200', '201-500', '500+')),
  company_website VARCHAR(200),
  
  -- Contact info
  contact_name VARCHAR(100) NOT NULL,
  contact_email VARCHAR(100),
  contact_phone VARCHAR(20),
  contact_position VARCHAR(100),
  
  -- BANT Qualification
  budget_confirmed BOOLEAN DEFAULT FALSE,
  authority_confirmed BOOLEAN DEFAULT FALSE,
  need_confirmed BOOLEAN DEFAULT FALSE,
  timeline_confirmed BOOLEAN DEFAULT FALSE,
  bant_score INTEGER DEFAULT 0 CHECK (bant_score BETWEEN 0 AND 100),
  
  -- Assignment
  pic_sales_id UUID REFERENCES user_profiles(id),
  se_assigned_id UUID REFERENCES user_profiles(id), -- Sales Engineer
  
  -- Status pipeline
  status VARCHAR(30) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost', 'nurture')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  
  -- Estimated value
  estimated_value NUMERIC(20,4),
  currency VARCHAR(3) DEFAULT 'IDR',
  probability INTEGER DEFAULT 0 CHECK (probability BETWEEN 0 AND 100),
  expected_close_date DATE,
  
  -- Notes & activity
  notes TEXT,
  last_activity_at TIMESTAMPTZ,
  next_follow_up DATE,
  
  -- Product interest (JSON array)
  product_interest JSONB DEFAULT '[]',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  created_by UUID,
  updated_by UUID
);

CREATE INDEX IF NOT EXISTS idx_crm_leads_tenant ON crm_leads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_status ON crm_leads(status);
CREATE INDEX IF NOT EXISTS idx_crm_leads_pic ON crm_leads(pic_sales_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_bant ON crm_leads(bant_score);
CREATE INDEX IF NOT EXISTS idx_crm_leads_created ON crm_leads(created_at);

-- ============================================
-- 9. CRM ACTIVITIES
-- ============================================

CREATE TABLE IF NOT EXISTS crm_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  lead_id UUID REFERENCES crm_leads(id),
  contact_id UUID, -- For future contact table
  
  activity_type VARCHAR(30) CHECK (activity_type IN ('call', 'email', 'meeting', 'demo', 'proposal', 'visit', 'note', 'task', 'whatsapp')),
  subject VARCHAR(200) NOT NULL,
  description TEXT,
  
  -- Scheduling
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  
  -- Outcome
  outcome VARCHAR(50) CHECK (outcome IN ('successful', 'no_response', 'not_interested', 'follow_up_required', 'rescheduled', 'cancelled')),
  next_action TEXT,
  next_action_date DATE,
  
  -- Assignment
  assigned_to UUID REFERENCES user_profiles(id),
  created_by UUID REFERENCES user_profiles(id),
  
  -- Metadata
  is_completed BOOLEAN DEFAULT FALSE,
  reminder_sent BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_activities_lead ON crm_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_assigned ON crm_activities(assigned_to);
CREATE INDEX IF NOT EXISTS idx_crm_activities_scheduled ON crm_activities(scheduled_at);

-- ============================================
-- 10. CRM OPPORTUNITIES (Deals)
-- ============================================

CREATE TABLE IF NOT EXISTS crm_opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  lead_id UUID REFERENCES crm_leads(id),
  
  -- Opportunity details
  title VARCHAR(200) NOT NULL,
  description TEXT,
  
  -- Value
  value NUMERIC(20,4),
  currency VARCHAR(3) DEFAULT 'IDR',
  
  -- Formula builder reference
  category_id UUID REFERENCES bopp_categories(id),
  custom_formula JSONB, -- Store formula override
  
  -- Timeline
  expected_start_date DATE,
  expected_duration_months INTEGER,
  expected_close_date DATE,
  actual_close_date DATE,
  
  -- Status
  stage VARCHAR(30) DEFAULT 'discovery' CHECK (stage IN ('discovery', 'proposal', 'negotiation', 'contract', 'won', 'lost', 'on_hold')),
  probability INTEGER DEFAULT 0 CHECK (probability BETWEEN 0 AND 100),
  
  -- Team
  pic_sales_id UUID REFERENCES user_profiles(id),
  se_assigned_id UUID REFERENCES user_profiles(id),
  
  -- Win/Loss reason
  loss_reason VARCHAR(100),
  loss_reason_detail TEXT,
  competitor_name VARCHAR(100),
  
  -- BOPP tracking
  bopp_formula_id UUID REFERENCES bopp_formulas(id),
  estimated_bopp_amount NUMERIC(20,4),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  created_by UUID,
  updated_by UUID
);

CREATE INDEX IF NOT EXISTS idx_crm_opportunities_tenant ON crm_opportunities(tenant_id);
CREATE INDEX IF NOT EXISTS idx_crm_opportunities_stage ON crm_opportunities(stage);
CREATE INDEX IF NOT EXISTS idx_crm_opportunities_pic ON crm_opportunities(pic_sales_id);
CREATE INDEX IF NOT EXISTS idx_crm_opportunities_close ON crm_opportunities(expected_close_date);

-- ============================================
-- 11. PRODUCT CATALOG
-- ============================================

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  code VARCHAR(50) NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  
  -- Pricing
  base_price NUMERIC(20,4),
  cost_estimate NUMERIC(20,4),
  
  -- Category & Type
  category_id UUID REFERENCES bopp_categories(id),
  product_type VARCHAR(30) DEFAULT 'project' CHECK (product_type IN ('project', 'retainer', 'subscription', 'license', 'service')),
  
  -- Recurring settings
  is_recurring BOOLEAN DEFAULT FALSE,
  billing_frequency VARCHAR(20) CHECK (billing_frequency IN ('monthly', 'quarterly', 'yearly')),
  
  -- Formula (if custom per product)
  has_custom_formula BOOLEAN DEFAULT FALSE,
  custom_formula JSONB,
  
  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  created_by UUID,
  updated_by UUID,
  
  UNIQUE(tenant_id, code)
);

CREATE INDEX IF NOT EXISTS idx_products_tenant ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_type ON products(product_type);

-- ============================================
-- 12. OPPORTUNITY LINE ITEMS
-- ============================================

CREATE TABLE IF NOT EXISTS opportunity_line_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  opportunity_id UUID NOT NULL REFERENCES crm_opportunities(id),
  product_id UUID REFERENCES products(id),
  
  -- Line details
  description TEXT,
  quantity NUMERIC(10,2) DEFAULT 1,
  unit_price NUMERIC(20,4),
  discount_percent NUMERIC(5,2) DEFAULT 0,
  discount_amount NUMERIC(20,4) DEFAULT 0,
  
  -- Totals
  subtotal NUMERIC(20,4) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  total NUMERIC(20,4) GENERATED ALWAYS AS (quantity * unit_price - discount_amount) STORED,
  
  -- Delivery
  expected_delivery_date DATE,
  delivery_status VARCHAR(20) DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'in_progress', 'delivered', 'accepted')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_opp_line_items_opportunity ON opportunity_line_items(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_opp_line_items_product ON opportunity_line_items(product_id);

-- ============================================
-- RLS ENABLE
-- ============================================

ALTER TABLE crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunity_line_items ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies will be added after auth setup
