-- Visibilitas pertanyaan berdasarkan peran penilai pada assignment 360

ALTER TABLE performance_360_template_questions
  ADD COLUMN IF NOT EXISTS applies_to_role VARCHAR(20);

UPDATE performance_360_template_questions
SET applies_to_role = 'all'
WHERE applies_to_role IS NULL;

ALTER TABLE performance_360_template_questions
  ALTER COLUMN applies_to_role SET DEFAULT 'all';

ALTER TABLE performance_360_template_questions
  ALTER COLUMN applies_to_role SET NOT NULL;

ALTER TABLE performance_360_template_questions
  DROP CONSTRAINT IF EXISTS performance_360_template_questions_applies_to_role_check;

ALTER TABLE performance_360_template_questions
  ADD CONSTRAINT performance_360_template_questions_applies_to_role_check
  CHECK (applies_to_role IN ('all', 'self', 'manager', 'peer', 'subordinate'));

COMMENT ON COLUMN performance_360_template_questions.applies_to_role IS
  'Visibilitas pertanyaan berdasarkan role penilai pada assignment: all | self | manager | peer | subordinate';
