-- Performance 360: penyimpanan submission + jawaban ke DB (bukan hanya draft lokal)
-- Run after 012_performance_360_templates.sql & 015 (questions columns).

CREATE TABLE IF NOT EXISTS performance_360_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  template_id UUID NOT NULL REFERENCES performance_360_templates(id) ON DELETE CASCADE,
  rater_user_profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  assessed_user_profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  assignment_kind VARCHAR(20) NOT NULL
    CHECK (assignment_kind IN ('self', 'manager', 'peer', 'subordinate')),
  assignment_key VARCHAR(260) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'submitted')),
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT performance_360_submissions_tpl_assignment_unique
    UNIQUE (tenant_id, template_id, assignment_key)
);

CREATE INDEX IF NOT EXISTS idx_perf360_sub_tenant_template
  ON performance_360_submissions(tenant_id, template_id);
CREATE INDEX IF NOT EXISTS idx_perf360_sub_ratee
  ON performance_360_submissions(assessed_user_profile_id);
CREATE INDEX IF NOT EXISTS idx_perf360_sub_rater
  ON performance_360_submissions(rater_user_profile_id);

CREATE TABLE IF NOT EXISTS performance_360_submission_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID NOT NULL REFERENCES performance_360_submissions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES performance_360_template_questions(id) ON DELETE CASCADE,
  rating INTEGER,
  reason_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT performance_360_submission_answers_unique
    UNIQUE (submission_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_perf360_sans_submission
  ON performance_360_submission_answers(submission_id);

COMMENT ON TABLE performance_360_submissions IS 'Satu baris per assignment (penilai → yang dinilai) per template & tenant';
COMMENT ON TABLE performance_360_submission_answers IS 'Jawaban per pertanyaan untuk submission 360';
COMMENT ON COLUMN performance_360_submissions.assignment_key IS 'Kunci stabil `kind:assessedId:raterId` selaras lib/perf360-assignments';

ALTER TABLE performance_360_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_360_submission_answers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS performance_360_submissions_authenticated_all ON performance_360_submissions;
CREATE POLICY performance_360_submissions_authenticated_all
  ON performance_360_submissions
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS performance_360_submission_answers_authenticated_all ON performance_360_submission_answers;
CREATE POLICY performance_360_submission_answers_authenticated_all
  ON performance_360_submission_answers
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON performance_360_submissions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON performance_360_submission_answers TO authenticated;
