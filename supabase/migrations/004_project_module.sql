-- WIT-ERP Sprint 2: Project Module Schema
-- Run this in InsForge SQL Editor after 003_crm_module.sql

-- ============================================
-- 13. PROJECTS
-- ============================================

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  entity_id UUID REFERENCES entities(id),
  
  -- Project details
  project_code VARCHAR(50) NOT NULL,
  project_name VARCHAR(200) NOT NULL,
  description TEXT,
  
  -- Linked to opportunity/customer
  opportunity_id UUID REFERENCES crm_opportunities(id),
  client_name VARCHAR(200),
  client_email VARCHAR(100),
  client_phone VARCHAR(20),
  
  -- Project manager
  project_manager_id UUID REFERENCES user_profiles(id),
  
  -- Timeline
  start_date DATE,
  target_end_date DATE,
  actual_end_date DATE,
  
  -- Status
  status VARCHAR(30) DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'cancelled')),
  health VARCHAR(20) DEFAULT 'green' CHECK (health IN ('green', 'yellow', 'red')),
  
  -- Budget & Costs
  budget NUMERIC(20,4),
  estimated_cost NUMERIC(20,4),
  actual_cost NUMERIC(20,4) DEFAULT 0,
  
  -- Billing
  billing_type VARCHAR(30) DEFAULT 'fixed' CHECK (billing_type IN ('fixed', 'time_material', 'retainer')),
  total_billable_amount NUMERIC(20,4) DEFAULT 0,
  total_billed_amount NUMERIC(20,4) DEFAULT 0,
  
  -- BOPP tracking
  bopp_formula_id UUID REFERENCES bopp_formulas(id),
  bopp_amount NUMERIC(20,4) DEFAULT 0,
  bopp_distributed BOOLEAN DEFAULT FALSE,
  
  -- Priority
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  
  -- Progress
  progress_percent INTEGER DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  created_by UUID,
  updated_by UUID,
  
  UNIQUE(tenant_id, project_code)
);

CREATE INDEX IF NOT EXISTS idx_projects_tenant ON projects(tenant_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_manager ON projects(project_manager_id);
CREATE INDEX IF NOT EXISTS idx_projects_opportunity ON projects(opportunity_id);

-- ============================================
-- 14. PROJECT TASKS
-- ============================================

CREATE TABLE IF NOT EXISTS project_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  project_id UUID NOT NULL REFERENCES projects(id),
  
  -- Task hierarchy
  parent_task_id UUID REFERENCES project_tasks(id),
  
  -- Task details
  task_code VARCHAR(50),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  
  -- Assignment
  assigned_to UUID REFERENCES user_profiles(id),
  reviewer_id UUID REFERENCES user_profiles(id),
  
  -- Timeline
  start_date DATE,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  
  -- Time tracking
  estimated_hours NUMERIC(6,2),
  actual_hours NUMERIC(6,2) DEFAULT 0,
  billable_hours NUMERIC(6,2) DEFAULT 0,
  
  -- Status
  status VARCHAR(30) DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'review', 'done', 'cancelled')),
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  
  -- Progress
  progress_percent INTEGER DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
  
  -- Type
  task_type VARCHAR(30) DEFAULT 'task' CHECK (task_type IN ('task', 'milestone', 'bug', 'feature', 'meeting')),
  
  -- Recurring
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_rule TEXT, -- RRULE format or simple: daily, weekly, monthly
  
  -- Order
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  created_by UUID,
  updated_by UUID
);

CREATE INDEX IF NOT EXISTS idx_tasks_project ON project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON project_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON project_tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due ON project_tasks(due_date);

-- ============================================
-- 15. TIME ENTRIES
-- ============================================

CREATE TABLE IF NOT EXISTS time_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  user_profile_id UUID NOT NULL REFERENCES user_profiles(id),
  project_id UUID REFERENCES projects(id),
  task_id UUID REFERENCES project_tasks(id),
  
  -- Time
  entry_date DATE NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  duration_minutes INTEGER,
  
  -- Details
  description TEXT,
  is_billable BOOLEAN DEFAULT TRUE,
  is_approved BOOLEAN DEFAULT FALSE,
  approved_by UUID REFERENCES user_profiles(id),
  approved_at TIMESTAMPTZ,
  
  -- Overtime
  is_overtime BOOLEAN DEFAULT FALSE,
  overtime_multiplier NUMERIC(3,2) DEFAULT 1.0,
  
  -- Status
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
  rejection_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID
);

CREATE INDEX IF NOT EXISTS idx_time_entries_user ON time_entries(user_profile_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_project ON time_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_date ON time_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_time_entries_status ON time_entries(status);

-- ============================================
-- 16. PROJECT MILESTONES
-- ============================================

CREATE TABLE IF NOT EXISTS project_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  project_id UUID NOT NULL REFERENCES projects(id),
  
  title VARCHAR(200) NOT NULL,
  description TEXT,
  
  target_date DATE NOT NULL,
  completed_at TIMESTAMPTZ,
  
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'achieved', 'missed')),
  
  -- Payment trigger
  is_payment_trigger BOOLEAN DEFAULT FALSE,
  payment_percent NUMERIC(5,2) DEFAULT 0, -- Percentage of project value
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_milestones_project ON project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_milestones_date ON project_milestones(target_date);

-- ============================================
-- 17. PROJECT TEAM MEMBERS
-- ============================================

CREATE TABLE IF NOT EXISTS project_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  project_id UUID NOT NULL REFERENCES projects(id),
  user_profile_id UUID NOT NULL REFERENCES user_profiles(id),
  
  role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('project_manager', 'tech_lead', 'developer', 'designer', 'qa', 'member', 'stakeholder')),
  
  allocation_percent INTEGER DEFAULT 100 CHECK (allocation_percent BETWEEN 0 AND 100),
  
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(project_id, user_profile_id)
);

CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members(user_profile_id);

-- ============================================
-- 18. PROJECT COMMENTS (Activity Feed)
-- ============================================

CREATE TABLE IF NOT EXISTS project_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  project_id UUID NOT NULL REFERENCES projects(id),
  task_id UUID REFERENCES project_tasks(id),
  
  comment_type VARCHAR(30) DEFAULT 'comment' CHECK (comment_type IN ('comment', 'update', 'milestone', 'file', 'time_logged')),
  content TEXT NOT NULL,
  
  -- File attachment
  file_url TEXT,
  file_name VARCHAR(200),
  file_size INTEGER,
  
  -- Author
  author_id UUID REFERENCES user_profiles(id),
  
  -- For update type
  field_changed VARCHAR(100),
  old_value TEXT,
  new_value TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_comments_project ON project_comments(project_id);
CREATE INDEX IF NOT EXISTS idx_project_comments_task ON project_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_project_comments_created ON project_comments(created_at);

-- ============================================
-- RLS ENABLE
-- ============================================

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_comments ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies will be added after auth setup
