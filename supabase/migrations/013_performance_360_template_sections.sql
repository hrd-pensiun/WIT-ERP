-- Performance 360: optional section grouping per question (Judul blok: "Assessment A", dll.)

ALTER TABLE performance_360_template_questions
  ADD COLUMN IF NOT EXISTS section_title VARCHAR(300);

COMMENT ON COLUMN performance_360_template_questions.section_title IS 'Judul bagian/bab penilaian; NULL = tidak digrup ke bagian bernama';
