-- Optional one-off demo: submission + jawaban untuk template 360 dengan period_end sudah lewat.
-- Jalankan manual di SQL editor (Supabase / InsForge) SETELAH migrasi 017_performance_360_submissions.
-- Tidak mengubah struktur HR; menggunakan profil dan pertanyaan yang sudah ada.

DO $$
DECLARE
  tid UUID;
  ttenant UUID;
  p1 UUID;
  p2 UUID;
  sid UUID;
  k_self TEXT;
  k_mgr TEXT;
BEGIN
  SELECT t.id, t.tenant_id
  INTO tid, ttenant
  FROM performance_360_templates t
  WHERE t.period_end IS NOT NULL
    AND t.period_end < CURRENT_DATE
  ORDER BY t.period_end DESC
  LIMIT 1;

  IF tid IS NULL THEN
    RAISE NOTICE '[seed 360] Skip: tidak ada template dengan period_end < hari ini';
    RETURN;
  END IF;

  SELECT id INTO p1 FROM user_profiles ORDER BY created_at ASC LIMIT 1;
  IF p1 IS NULL THEN
    RAISE NOTICE '[seed 360] Skip: tidak ada baris user_profiles';
    RETURN;
  END IF;

  SELECT id INTO p2 FROM user_profiles WHERE id <> p1 ORDER BY created_at ASC LIMIT 1;
  IF p2 IS NULL THEN
    p2 := p1;
  END IF;

  k_self := 'self:' || p1::text || ':' || p1::text;
  k_mgr := 'manager:' || p1::text || ':' || p2::text;

  INSERT INTO performance_360_submissions (
    tenant_id,
    template_id,
    rater_user_profile_id,
    assessed_user_profile_id,
    assignment_kind,
    assignment_key,
    status,
    submitted_at,
    updated_at
  )
  VALUES (
    ttenant,
    tid,
    p1,
    p1,
    'self',
    k_self,
    'submitted',
    NOW() - INTERVAL '2 days',
    NOW()
  )
  ON CONFLICT (tenant_id, template_id, assignment_key)
  DO UPDATE SET
    status = EXCLUDED.status,
    submitted_at = EXCLUDED.submitted_at,
    updated_at = NOW()
  RETURNING id INTO sid;

  DELETE FROM performance_360_submission_answers WHERE submission_id = sid;
  INSERT INTO performance_360_submission_answers (submission_id, question_id, rating, reason_text, updated_at)
  SELECT
    sid,
    q.id,
    4,
    'Seed historis — self',
    NOW()
  FROM performance_360_template_questions q
  WHERE q.template_id = tid
    AND q.question_type IN ('rating', 'multiple_choice');

  IF p2 IS DISTINCT FROM p1 THEN
    INSERT INTO performance_360_submissions (
      tenant_id,
      template_id,
      rater_user_profile_id,
      assessed_user_profile_id,
      assignment_kind,
      assignment_key,
      status,
      submitted_at,
      updated_at
    )
    VALUES (
      ttenant,
      tid,
      p2,
      p1,
      'manager',
      k_mgr,
      'submitted',
      NOW() - INTERVAL '1 day',
      NOW()
    )
    ON CONFLICT (tenant_id, template_id, assignment_key)
    DO UPDATE SET
      status = EXCLUDED.status,
      submitted_at = EXCLUDED.submitted_at,
      updated_at = NOW()
    RETURNING id INTO sid;

    DELETE FROM performance_360_submission_answers WHERE submission_id = sid;
    INSERT INTO performance_360_submission_answers (submission_id, question_id, rating, reason_text, updated_at)
    SELECT
      sid,
      q.id,
      5,
      'Seed historis — manager',
      NOW()
    FROM performance_360_template_questions q
    WHERE q.template_id = tid
      AND q.question_type IN ('rating', 'multiple_choice');
  END IF;

  RAISE NOTICE '[seed 360] OK untuk template_id=% pertanyaan terisi untuk self (+ manager bila dua profil)', tid;
END $$;
