-- InsForge CLI migration mirror:
-- Add app_role on user_profiles to control UI access via employee menu

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS app_role VARCHAR(50);

UPDATE user_profiles
SET app_role = 'employee'
WHERE app_role IS NULL;

ALTER TABLE user_profiles
  ALTER COLUMN app_role SET DEFAULT 'employee';

ALTER TABLE user_profiles
  ALTER COLUMN app_role SET NOT NULL;

ALTER TABLE user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_app_role_check;

ALTER TABLE user_profiles
  ADD CONSTRAINT user_profiles_app_role_check
  CHECK (app_role IN ('employee', 'manager', 'hr_admin', 'SuperAdmin'));
