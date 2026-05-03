-- WIT-ERP Sprint: Enable authenticated CRUD policies
-- This migration assumes application users are authenticated via InsForge Auth.

-- MASTER DATA
DROP POLICY IF EXISTS entities_authenticated_all ON entities;
CREATE POLICY entities_authenticated_all ON entities FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS departments_authenticated_all ON departments;
CREATE POLICY departments_authenticated_all ON departments FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS divisions_authenticated_all ON divisions;
CREATE POLICY divisions_authenticated_all ON divisions FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS hr_positions_authenticated_all ON hr_positions;
CREATE POLICY hr_positions_authenticated_all ON hr_positions FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS hr_job_grades_authenticated_all ON hr_job_grades;
CREATE POLICY hr_job_grades_authenticated_all ON hr_job_grades FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS salary_components_authenticated_all ON salary_components;
CREATE POLICY salary_components_authenticated_all ON salary_components FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS bopp_formulas_authenticated_all ON bopp_formulas;
CREATE POLICY bopp_formulas_authenticated_all ON bopp_formulas FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- HR
DROP POLICY IF EXISTS user_profiles_authenticated_all ON user_profiles;
CREATE POLICY user_profiles_authenticated_all ON user_profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS attendance_records_authenticated_all ON attendance_records;
CREATE POLICY attendance_records_authenticated_all ON attendance_records FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS leave_requests_authenticated_all ON leave_requests;
CREATE POLICY leave_requests_authenticated_all ON leave_requests FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- CRM
DROP POLICY IF EXISTS crm_leads_authenticated_all ON crm_leads;
CREATE POLICY crm_leads_authenticated_all ON crm_leads FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS crm_opportunities_authenticated_all ON crm_opportunities;
CREATE POLICY crm_opportunities_authenticated_all ON crm_opportunities FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- PROJECTS
DROP POLICY IF EXISTS projects_authenticated_all ON projects;
CREATE POLICY projects_authenticated_all ON projects FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS project_tasks_authenticated_all ON project_tasks;
CREATE POLICY project_tasks_authenticated_all ON project_tasks FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- GRANTS
GRANT SELECT, INSERT, UPDATE, DELETE ON entities TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON departments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON divisions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON hr_positions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON hr_job_grades TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON salary_components TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON bopp_formulas TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON attendance_records TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON leave_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON crm_leads TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON crm_opportunities TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON projects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON project_tasks TO authenticated;
