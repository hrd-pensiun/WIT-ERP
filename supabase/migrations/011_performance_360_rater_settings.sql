-- Performance 360: rater configuration (per ratee) + optional org line for subordinates
-- Run after 002_hr_module.sql (and auth RLS migration if applicable).

-- ============================================
-- 1. Org line: siapa atasan formal (untuk daftar bawahan akurat)
-- ============================================

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS reports_to_profile_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_user_profiles_reports_to ON user_profiles(reports_to_profile_id);

COMMENT ON COLUMN user_profiles.reports_to_profile_id IS 'Atasan langsung (profil). Nullable; isi dari HR master bila tersedia.';

-- ============================================
-- 2. Pengaturan penilai 360 (khusus modul Performance)
-- ============================================

CREATE TABLE IF NOT EXISTS performance_360_rater_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  ratee_user_profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  direct_manager_user_profile_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  allow_self BOOLEAN NOT NULL DEFAULT TRUE,
  allow_manager BOOLEAN NOT NULL DEFAULT TRUE,
  allow_peer BOOLEAN NOT NULL DEFAULT TRUE,
  allow_subordinate BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT performance_360_rater_settings_ratee_unique UNIQUE (tenant_id, ratee_user_profile_id),
  CONSTRAINT performance_360_rater_settings_not_self_manager CHECK (
    direct_manager_user_profile_id IS NULL OR direct_manager_user_profile_id <> ratee_user_profile_id
  )
);

CREATE INDEX IF NOT EXISTS idx_perf360_rater_tenant ON performance_360_rater_settings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_perf360_rater_ratee ON performance_360_rater_settings(ratee_user_profile_id);

ALTER TABLE performance_360_rater_settings ENABLE ROW LEVEL SECURITY;

-- Mirror project pattern: authenticated app users (InsForge)
DROP POLICY IF EXISTS performance_360_rater_settings_authenticated_all ON performance_360_rater_settings;
CREATE POLICY performance_360_rater_settings_authenticated_all
  ON performance_360_rater_settings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON performance_360_rater_settings TO authenticated;
