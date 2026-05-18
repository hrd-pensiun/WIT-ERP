-- ============================================================
-- 011_performance_360.sql
-- Performance 360: templates, questions, submissions, answers, rater settings
-- ============================================================

CREATE TABLE IF NOT EXISTS performance_360_templates (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL,
  name                varchar(200) NOT NULL,
  description         text,
  period_kind         varchar(20) NOT NULL DEFAULT 'annual'
                        CHECK (period_kind IN ('annual','semester','quarterly','custom')),
  period_year         integer NOT NULL DEFAULT EXTRACT(YEAR FROM NOW())::integer,
  period_custom_label varchar(100),
  period_start        date,
  period_end          date,
  rating_scale_max    integer NOT NULL DEFAULT 5,
  status              varchar(20) NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft','active','closed','archived')),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  deleted_at          timestamptz,
  created_by          uuid
);

CREATE TABLE IF NOT EXISTS performance_360_template_questions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id     uuid NOT NULL REFERENCES performance_360_templates(id) ON DELETE CASCADE,
  sort_order      integer NOT NULL DEFAULT 0,
  section_title   varchar(200),
  question_text   text NOT NULL,
  question_type   varchar(20) DEFAULT 'rating'
                    CHECK (question_type IN ('rating','text','rating_with_reason')),
  category        varchar(50),
  weight          numeric(5,2) DEFAULT 1.0,
  reason_mode     varchar(20) DEFAULT 'optional'
                    CHECK (reason_mode IN ('none','optional','required')),
  applies_to_role varchar(50) NOT NULL DEFAULT 'all'
);

CREATE TABLE IF NOT EXISTS performance_360_submissions (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                uuid NOT NULL,
  template_id              uuid NOT NULL REFERENCES performance_360_templates(id),
  rater_user_profile_id    uuid REFERENCES user_profiles(id),
  assessed_user_profile_id uuid REFERENCES user_profiles(id),
  assignment_kind          varchar(30),
  assignment_key           varchar(200),
  status                   varchar(20) NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending','in_progress','submitted','expired')),
  submitted_at             timestamptz,
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, template_id, assignment_key)
);

CREATE TABLE IF NOT EXISTS performance_360_submission_answers (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES performance_360_submissions(id) ON DELETE CASCADE,
  question_id   uuid NOT NULL REFERENCES performance_360_template_questions(id),
  rating        integer,
  reason_text   text,
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (submission_id, question_id)
);

CREATE TABLE IF NOT EXISTS performance_360_rater_settings (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   uuid NOT NULL,
  ratee_user_profile_id       uuid NOT NULL REFERENCES user_profiles(id),
  direct_manager_user_profile_id uuid REFERENCES user_profiles(id),
  allow_self                  boolean DEFAULT true,
  allow_manager               boolean DEFAULT true,
  allow_peer                  boolean DEFAULT true,
  allow_subordinate           boolean DEFAULT false,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, ratee_user_profile_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_p360_templates_tenant    ON performance_360_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_p360_questions_template  ON performance_360_template_questions(template_id);
CREATE INDEX IF NOT EXISTS idx_p360_submissions_tenant  ON performance_360_submissions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_p360_submissions_rater   ON performance_360_submissions(rater_user_profile_id);
CREATE INDEX IF NOT EXISTS idx_p360_answers_submission  ON performance_360_submission_answers(submission_id);

-- RLS
ALTER TABLE performance_360_templates           ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_360_template_questions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_360_submissions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_360_submission_answers  ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_360_rater_settings      ENABLE ROW LEVEL SECURITY;

CREATE POLICY p360_templates_all          ON performance_360_templates           FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY p360_questions_all          ON performance_360_template_questions  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY p360_submissions_all        ON performance_360_submissions         FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY p360_submission_answers_all ON performance_360_submission_answers  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY p360_rater_settings_all     ON performance_360_rater_settings      FOR ALL TO authenticated USING (true) WITH CHECK (true);
