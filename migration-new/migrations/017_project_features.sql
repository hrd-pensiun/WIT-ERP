-- ============================================================
-- 017_project_features.sql
-- Project-level features: milestones, tasks, members,
-- contacts, checklist, payment terms, comments
-- ============================================================

CREATE TABLE IF NOT EXISTS project_milestones (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id          uuid NOT NULL,
  project_id         uuid NOT NULL REFERENCES commercial_projects(id) ON DELETE CASCADE,
  title              varchar(300) NOT NULL,
  description        text,
  target_date        date,
  is_payment_trigger boolean DEFAULT false,
  payment_percent    numeric(5,2) DEFAULT 0,
  status             varchar(20) NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending','in_progress','completed','overdue')),
  completed_at       timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  deleted_at         timestamptz
);

CREATE TABLE IF NOT EXISTS project_tasks (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid NOT NULL,
  project_id       uuid NOT NULL REFERENCES commercial_projects(id) ON DELETE CASCADE,
  title            varchar(300) NOT NULL,
  description      text,
  assigned_to      uuid REFERENCES user_profiles(id),
  status           varchar(20) NOT NULL DEFAULT 'todo'
                     CHECK (status IN ('todo','in_progress','review','done','blocked')),
  priority         varchar(20) DEFAULT 'medium'
                     CHECK (priority IN ('low','medium','high','urgent')),
  start_date       date,
  due_date         date,
  estimated_hours  numeric(6,2) DEFAULT 0,
  actual_hours     numeric(6,2) DEFAULT 0,
  progress_percent integer DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  deleted_at       timestamptz
);

CREATE TABLE IF NOT EXISTS project_members (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         uuid NOT NULL,
  project_id        uuid NOT NULL REFERENCES commercial_projects(id) ON DELETE CASCADE,
  user_profile_id   uuid NOT NULL REFERENCES user_profiles(id),
  role              varchar(100),
  allocation_percent numeric(5,2) DEFAULT 100,
  is_active         boolean DEFAULT true,
  joined_at         date,
  created_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, user_profile_id)
);

CREATE TABLE IF NOT EXISTS project_contacts (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid NOT NULL,
  project_id uuid NOT NULL REFERENCES commercial_projects(id) ON DELETE CASCADE,
  full_name  varchar(200) NOT NULL,
  role       varchar(100),
  phone      varchar(30),
  email      varchar(200),
  is_primary boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS project_checklist_items (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      uuid NOT NULL,
  project_id     uuid NOT NULL REFERENCES commercial_projects(id) ON DELETE CASCADE,
  category       varchar(50) NOT NULL
                   CHECK (category IN ('credentials','development','handover')),
  item_name      varchar(200) NOT NULL,
  status         varchar(20) NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','on_going','done','hold','not_applicable')),
  due_date       date,
  completed_date date,
  link_drive     text,
  notes          text,
  sort_order     integer NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  deleted_at     timestamptz
);

CREATE TABLE IF NOT EXISTS project_payment_terms (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  uuid NOT NULL,
  project_id uuid NOT NULL REFERENCES commercial_projects(id) ON DELETE CASCADE,
  term_name  varchar(200) NOT NULL,
  percentage numeric(5,2),
  nominal    numeric(20,2) NOT NULL DEFAULT 0,
  due_date   date,
  paid_date  date,
  status     varchar(20) NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending','waiting_payment','paid','overdue')),
  notes      text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS project_comments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid NOT NULL,
  project_id   uuid NOT NULL REFERENCES commercial_projects(id) ON DELETE CASCADE,
  content      text NOT NULL,
  comment_type varchar(50) DEFAULT 'general',
  created_by   uuid REFERENCES user_profiles(id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  deleted_at   timestamptz
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_proj_milestones_project  ON project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_proj_tasks_project       ON project_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_proj_tasks_assigned      ON project_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_proj_members_project     ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_proj_contacts_project    ON project_contacts(project_id);
CREATE INDEX IF NOT EXISTS idx_proj_checklist_project   ON project_checklist_items(project_id);
CREATE INDEX IF NOT EXISTS idx_proj_payment_project     ON project_payment_terms(project_id);
CREATE INDEX IF NOT EXISTS idx_proj_comments_project    ON project_comments(project_id);

-- RLS
ALTER TABLE project_milestones     ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tasks          ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members        ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_contacts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_payment_terms  ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_comments       ENABLE ROW LEVEL SECURITY;

CREATE POLICY proj_milestones_all      ON project_milestones      FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY proj_tasks_all           ON project_tasks           FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY proj_members_all         ON project_members         FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY proj_contacts_all        ON project_contacts        FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY proj_checklist_all       ON project_checklist_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY proj_payment_terms_all   ON project_payment_terms   FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY proj_comments_all        ON project_comments        FOR ALL TO authenticated USING (true) WITH CHECK (true);
