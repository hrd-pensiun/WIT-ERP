-- Kebijakan alasan/komentar tambahan per pertanyaan (rating & pilihan ganda)

ALTER TABLE performance_360_template_questions
  ADD COLUMN IF NOT EXISTS reason_mode VARCHAR(20);

UPDATE performance_360_template_questions
SET reason_mode = 'none'
WHERE reason_mode IS NULL;

ALTER TABLE performance_360_template_questions
  ALTER COLUMN reason_mode SET DEFAULT 'none';

ALTER TABLE performance_360_template_questions
  ALTER COLUMN reason_mode SET NOT NULL;

ALTER TABLE performance_360_template_questions
  DROP CONSTRAINT IF EXISTS performance_360_template_questions_reason_mode_check;

ALTER TABLE performance_360_template_questions
  ADD CONSTRAINT performance_360_template_questions_reason_mode_check
  CHECK (reason_mode IN ('none', 'optional', 'required'));

COMMENT ON COLUMN performance_360_template_questions.reason_mode IS
  'Alasan tambahan: none | optional | required (untuk rating/multiple_choice; pertanyaan teks dianggap jawaban narasi penuh)';
