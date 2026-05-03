-- WIT-ERP Sprint 2: Finance & BOPP Module Schema
-- Run this in InsForge SQL Editor after 004_project_module.sql

-- ============================================
-- 19. BOPP DISTRIBUTION RECORDS
-- ============================================

CREATE TABLE IF NOT EXISTS bopp_distributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  entity_id UUID REFERENCES entities(id),
  
  -- Source
  source_type VARCHAR(30) CHECK (source_type IN ('project', 'opportunity', 'recurring', 'manual')),
  source_id UUID, -- Polymorphic: project_id or opportunity_id
  source_code VARCHAR(50), -- project_code or opportunity code
  
  -- Revenue info
  revenue_amount NUMERIC(20,4) NOT NULL,
  distribution_date DATE NOT NULL,
  period_month INTEGER,
  period_year INTEGER,
  
  -- Formula used
  formula_id UUID REFERENCES bopp_formulas(id),
  
  -- Distribution amounts
  marketing_amount NUMERIC(20,4) DEFAULT 0,
  se_amount NUMERIC(20,4) DEFAULT 0,
  management_amount NUMERIC(20,4) DEFAULT 0,
  tech_amount NUMERIC(20,4) DEFAULT 0,
  operational_amount NUMERIC(20,4) DEFAULT 0,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'distributed', 'cancelled')),
  
  -- Approvals
  approved_by UUID REFERENCES user_profiles(id),
  approved_at TIMESTAMPTZ,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID
);

CREATE INDEX IF NOT EXISTS idx_bopp_dist_tenant ON bopp_distributions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bopp_dist_status ON bopp_distributions(status);
CREATE INDEX IF NOT EXISTS idx_bopp_dist_date ON bopp_distributions(distribution_date);

-- ============================================
-- 20. BOPP INDIVIDUAL DISTRIBUTIONS (Per person)
-- ============================================

CREATE TABLE IF NOT EXISTS bopp_individual_shares (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  bopp_distribution_id UUID NOT NULL REFERENCES bopp_distributions(id),
  user_profile_id UUID NOT NULL REFERENCES user_profiles(id),
  
  -- Share details
  share_type VARCHAR(20) CHECK (share_type IN ('marketing', 'se', 'management', 'tech', 'operational')),
  share_amount NUMERIC(20,4) NOT NULL DEFAULT 0,
  
  -- Calculated based on
  calculation_basis TEXT, -- e.g., "10% of project value"
  
  -- Payment
  is_paid BOOLEAN DEFAULT FALSE,
  paid_at TIMESTAMPTZ,
  paid_by UUID REFERENCES user_profiles(id),
  payroll_period_id UUID, -- Link to payroll
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bopp_shares_distribution ON bopp_individual_shares(bopp_distribution_id);
CREATE INDEX IF NOT EXISTS idx_bopp_shares_user ON bopp_individual_shares(user_profile_id);

-- ============================================
-- 21. INVOICES (AR)
-- ============================================

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  entity_id UUID REFERENCES entities(id),
  
  -- Document numbers
  invoice_number VARCHAR(50) NOT NULL,
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  
  -- Customer
  customer_name VARCHAR(200) NOT NULL,
  customer_email VARCHAR(100),
  customer_address TEXT,
  customer_npwp VARCHAR(30),
  
  -- Source
  project_id UUID REFERENCES projects(id),
  opportunity_id UUID REFERENCES crm_opportunities(id),
  
  -- Amounts
  subtotal NUMERIC(20,4) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(20,4) DEFAULT 0,
  tax_amount NUMERIC(20,4) DEFAULT 0,
  tax_percent NUMERIC(5,2) DEFAULT 11.0,
  total_amount NUMERIC(20,4) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(20,4) DEFAULT 0,
  balance_due NUMERIC(20,4) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
  
  -- Status
  status VARCHAR(30) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'paid', 'partial', 'overdue', 'cancelled')),
  
  -- Payment tracking
  payment_terms VARCHAR(50) DEFAULT 'Net 30',
  last_reminder_sent_at TIMESTAMPTZ,
  
  -- BOPP link
  bopp_distribution_id UUID REFERENCES bopp_distributions(id),
  
  notes TEXT,
  terms_and_conditions TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  created_by UUID,
  updated_by UUID,
  
  UNIQUE(tenant_id, invoice_number)
);

CREATE INDEX IF NOT EXISTS idx_invoices_tenant ON invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_project ON invoices(project_id);

-- ============================================
-- 22. INVOICE LINE ITEMS
-- ============================================

CREATE TABLE IF NOT EXISTS invoice_line_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  invoice_id UUID NOT NULL REFERENCES invoices(id),
  
  description TEXT NOT NULL,
  quantity NUMERIC(10,2) DEFAULT 1,
  unit VARCHAR(20), -- hours, days, pcs, etc.
  unit_price NUMERIC(20,4) NOT NULL,
  
  -- Totals
  amount NUMERIC(20,4) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  
  -- Reference
  project_task_id UUID REFERENCES project_tasks(id),
  time_entry_ids UUID[], -- Array of time entries billed
  
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inv_line_items_invoice ON invoice_line_items(invoice_id);

-- ============================================
-- 23. PAYMENTS RECEIVED
-- ============================================

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  invoice_id UUID REFERENCES invoices(id),
  
  -- Payment details
  payment_date DATE NOT NULL,
  amount NUMERIC(20,4) NOT NULL,
  payment_method VARCHAR(30) CHECK (payment_method IN ('cash', 'bank_transfer', 'check', 'credit_card', 'virtual_account', 'other')),
  
  -- Reference
  reference_number VARCHAR(100),
  bank_name VARCHAR(100),
  
  -- For advance payments (not linked to invoice yet)
  customer_name VARCHAR(200),
  notes TEXT,
  
  -- Reconciliation
  is_reconciled BOOLEAN DEFAULT FALSE,
  reconciled_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID
);

CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);

-- ============================================
-- 24. EXPENSES (AP)
-- ============================================

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  entity_id UUID REFERENCES entities(id),
  
  -- Expense details
  expense_date DATE NOT NULL,
  category VARCHAR(50) NOT NULL, -- Will be master data
  description TEXT NOT NULL,
  
  -- Amounts
  amount NUMERIC(20,4) NOT NULL,
  tax_amount NUMERIC(20,4) DEFAULT 0,
  total_amount NUMERIC(20,4) GENERATED ALWAYS AS (amount + tax_amount) STORED,
  
  -- Vendor
  vendor_name VARCHAR(200),
  vendor_tax_id VARCHAR(30),
  
  -- Receipt
  receipt_number VARCHAR(100),
  receipt_url TEXT,
  
  -- Project allocation
  project_id UUID REFERENCES projects(id),
  allocation_percent NUMERIC(5,2) DEFAULT 100,
  
  -- Payment status
  payment_status VARCHAR(20) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid')),
  paid_amount NUMERIC(20,4) DEFAULT 0,
  
  -- Billed to client?
  is_billable BOOLEAN DEFAULT FALSE,
  is_billed BOOLEAN DEFAULT FALSE,
  invoice_id UUID REFERENCES invoices(id),
  
  -- Submitter
  submitted_by UUID REFERENCES user_profiles(id),
  approved_by UUID REFERENCES user_profiles(id),
  approved_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  updated_by UUID
);

CREATE INDEX IF NOT EXISTS idx_expenses_tenant ON expenses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_project ON expenses(project_id);

-- ============================================
-- 25. EXPENSE CATEGORIES (Master Data)
-- ============================================

CREATE TABLE IF NOT EXISTS expense_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  code VARCHAR(20) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  account_code VARCHAR(20), -- For accounting integration
  is_billable_default BOOLEAN DEFAULT FALSE,
  requires_receipt BOOLEAN DEFAULT TRUE,
  
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  UNIQUE(tenant_id, code)
);

CREATE INDEX IF NOT EXISTS idx_expense_cat_tenant ON expense_categories(tenant_id);

-- ============================================
-- SEED DATA
-- ============================================

INSERT INTO expense_categories (tenant_id, code, name, description, is_billable_default)
VALUES 
  ('00000000-0000-0000-0000-000000000000', 'TRAVEL', 'Perjalanan Dinas', 'Transportasi, hotel, makan saat perjalanan', TRUE),
  ('00000000-0000-0000-0000-000000000000', 'OFFICE', 'Keperluan Kantor', 'ATK, konsumsi, utilities', FALSE),
  ('00000000-0000-0000-0000-000000000000', 'SOFTWARE', 'Software & Tools', 'License, subscription tools', TRUE),
  ('00000000-0000-0000-0000-000000000000', 'MEETING', 'Meeting & Entertainment', 'Meeting dengan client', TRUE),
  ('00000000-0000-0000-0000-000000000000', 'TRAINING', 'Training & Development', 'Kursus, workshop, sertifikasi', FALSE),
  ('00000000-0000-0000-0000-000000000000', 'EQUIPMENT', 'Equipment', 'Hardware, devices', FALSE),
  ('00000000-0000-0000-0000-000000000000', 'MARKETING', 'Marketing', 'Iklan, event, promosi', FALSE),
  ('00000000-0000-0000-0000-000000000000', 'OTHER', 'Lain-lain', 'Pengeluaran lainnya', FALSE)
ON CONFLICT DO NOTHING;

-- ============================================
-- RLS ENABLE
-- ============================================

ALTER TABLE bopp_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bopp_individual_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies will be added after auth setup
