-- ============================================================
-- Migration 20260516003: Convert Lead to Commercial Project
-- ============================================================
-- 1. Extend commercial_projects with project management fields
-- 2. Create project_team_members table
-- ============================================================

-- ============================================================
-- 1. ALTER commercial_projects — Add columns
-- ============================================================
ALTER TABLE commercial_projects
  ADD COLUMN IF NOT EXISTS company_name         text,
  ADD COLUMN IF NOT EXISTS pic_commercial_id     uuid,
  ADD COLUMN IF NOT EXISTS pic_adm_id            uuid,
  ADD COLUMN IF NOT EXISTS pm_id                uuid,
  ADD COLUMN IF NOT EXISTS po_value              numeric(15,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS start_date            date,
  ADD COLUMN IF NOT EXISTS end_date              date,
  ADD COLUMN IF NOT EXISTS term_of_payment       text,
  ADD COLUMN IF NOT EXISTS lead_data_snapshot       jsonb,
  ADD COLUMN IF NOT EXISTS mom_snapshot             jsonb,
  ADD COLUMN IF NOT EXISTS cost_analysis_snapshot   jsonb,
  ADD COLUMN IF NOT EXISTS summary_snapshot         jsonb;

-- ============================================================
-- 2. CREATE project_team_members
-- ============================================================
CREATE TABLE IF NOT EXISTS project_team_members (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid NOT NULL REFERENCES commercial_projects(id) ON DELETE CASCADE,
  user_profile_id uuid NOT NULL,
  role            text NOT NULL DEFAULT 'Member',
  created_at      timestamptz DEFAULT now(),
  deleted_at      timestamptz
);

ALTER TABLE project_team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access project_team_members" ON project_team_members FOR ALL USING (true);
GRANT ALL ON project_team_members TO anon, authenticated;

CREATE INDEX IF NOT EXISTS idx_team_members_project ON project_team_members(project_id);

-- ============================================================
-- 3. Update the project code trigger to also add "WON-" prefix for won projects
-- (Optional — keeping existing behavior, no changes to trigger)
-- ============================================================
