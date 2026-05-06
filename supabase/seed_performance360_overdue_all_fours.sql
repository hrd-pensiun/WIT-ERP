/*
  Isi submission 360: template active dengan period_end < hari ini (UI: «Terlambat»).
  Rating 4; reason_text = 'asdasd'. Jalankan di SQL editor atau:
  npx @insforge/cli db query "$(cat supabase/seed_performance360_overdue_all_fours.sql)"
  (Komentar pakai -- di baris pertama bisa diartikan jadi flag CLI — pakai blok ini saja.)
*/

DO $$
DECLARE
  tpl RECORD;
  rs RECORD;
  ratee_id UUID;
  ttenant UUID;
  tid UUID;
  eff_mgr UUID;
  sid UUID;
  sub_id UUID;
  peer_id UUID;
  ak TEXT;
BEGIN
  SELECT t.id, t.tenant_id
  INTO tpl
  FROM performance_360_templates t
  WHERE t.status = 'active'
    AND t.period_end IS NOT NULL
    AND t.period_end < CURRENT_DATE
  ORDER BY t.period_end DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE NOTICE '[360 overdue fill] Skip: tidak ada template active dengan period_end < hari ini';
    RETURN;
  END IF;

  tid := tpl.id;
  ttenant := tpl.tenant_id;

  FOR rs IN
    SELECT *
    FROM performance_360_rater_settings p
    WHERE p.tenant_id = ttenant
  LOOP
    ratee_id := rs.ratee_user_profile_id;
    IF NOT EXISTS (SELECT 1 FROM user_profiles u WHERE u.id = ratee_id) THEN
      CONTINUE;
    END IF;

    eff_mgr := COALESCE(
      rs.direct_manager_user_profile_id,
      (SELECT u.reports_to_profile_id FROM user_profiles u WHERE u.id = ratee_id)
    );

    IF rs.allow_self THEN
      ak := 'self:' || ratee_id::text || ':' || ratee_id::text;
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
        ratee_id,
        ratee_id,
        'self',
        ak,
        'submitted',
        NOW(),
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
        'asdasd',
        NOW()
      FROM performance_360_template_questions q
      WHERE q.template_id = tid
        AND q.question_type IN ('rating', 'multiple_choice')
        AND (q.applies_to_role = 'all' OR q.applies_to_role = 'self');
    END IF;

    IF rs.allow_manager AND eff_mgr IS NOT NULL AND eff_mgr <> ratee_id
       AND EXISTS (SELECT 1 FROM user_profiles u WHERE u.id = eff_mgr) THEN
      ak := 'manager:' || ratee_id::text || ':' || eff_mgr::text;
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
        eff_mgr,
        ratee_id,
        'manager',
        ak,
        'submitted',
        NOW(),
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
        'asdasd',
        NOW()
      FROM performance_360_template_questions q
      WHERE q.template_id = tid
        AND q.question_type IN ('rating', 'multiple_choice')
        AND (q.applies_to_role = 'all' OR q.applies_to_role = 'manager');
    END IF;

    IF rs.allow_subordinate THEN
      FOR sub_id IN
        SELECT u.id
        FROM user_profiles u
        WHERE u.reports_to_profile_id = ratee_id
      LOOP
        ak := 'subordinate:' || ratee_id::text || ':' || sub_id::text;
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
          sub_id,
          ratee_id,
          'subordinate',
          ak,
          'submitted',
          NOW(),
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
          'asdasd',
          NOW()
        FROM performance_360_template_questions q
        WHERE q.template_id = tid
          AND q.question_type IN ('rating', 'multiple_choice')
          AND (q.applies_to_role = 'all' OR q.applies_to_role = 'subordinate');
      END LOOP;
    END IF;

    IF rs.allow_peer THEN
      FOR peer_id IN
        SELECT p2.id
        FROM user_profiles p2
        INNER JOIN user_profiles p1 ON p1.id = ratee_id
        WHERE p2.tenant_id = p1.tenant_id
          AND p2.id <> p1.id
          AND (eff_mgr IS NULL OR p2.id <> eff_mgr)
          AND p2.department_id IS NOT DISTINCT FROM p1.department_id
          AND p2.job_grade_id IS NOT DISTINCT FROM p1.job_grade_id
      LOOP
        ak := 'peer:' || ratee_id::text || ':' || peer_id::text;
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
          peer_id,
          ratee_id,
          'peer',
          ak,
          'submitted',
          NOW(),
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
          'asdasd',
          NOW()
        FROM performance_360_template_questions q
        WHERE q.template_id = tid
          AND q.question_type IN ('rating', 'multiple_choice')
          AND (q.applies_to_role = 'all' OR q.applies_to_role = 'peer');
      END LOOP;
    END IF;
  END LOOP;

  RAISE NOTICE '[360 overdue fill] Selesai template_id=% tenant=% (alasan: asdasd)', tid, ttenant;
END $$;
