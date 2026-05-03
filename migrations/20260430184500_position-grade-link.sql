ALTER TABLE hr_positions
  ADD COLUMN IF NOT EXISTS job_grade_id UUID REFERENCES hr_job_grades(id);

CREATE INDEX IF NOT EXISTS idx_hr_positions_job_grade_id
  ON hr_positions(job_grade_id);

UPDATE hr_positions p
SET job_grade_id = g.id
FROM hr_job_grades g
WHERE p.job_grade_id IS NULL
  AND p.tenant_id = g.tenant_id
  AND p.level = g.level
  AND g.status = 'active';
