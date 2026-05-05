-- =====================================================================
-- Seed: 10 karyawan DEMO — field diisi ACAK, FK valid (random entity + dept + posisi)
-- =====================================================================
-- Pilih SATU entitas aktif yang punya minimal satu departemen aktif dan satu
-- hr_positions (entity tersebut atau entity_id NULL). Lalu 10 baris: kombinasi dept/posisi acak per baris.
--
-- Jalankan di SQL Editor InsForge / Postgres (bukan migrasi otomatis).
-- Nomor pegawai: SEED-DEMO-<timestamp_us>-NN (unik per eksekusi; aman rerun).
--
-- Agar muncul di /hr/employees: tenant_id harus sama dengan NEXT_PUBLIC_TENANT_ID
-- (tanpa itu app pakai fallback 00000000-0000-0000-0000-000000000000).
-- Verifikasi: SELECT DISTINCT tenant_id FROM user_profiles WHERE documents->>'demo'='random_v1';
--
-- Bersihkan demo: DELETE FROM user_profiles WHERE documents->>'demo' = 'random_v1';
-- =====================================================================

WITH anchor AS (
  SELECT e.tenant_id, e.id AS entity_id
  FROM entities e
  WHERE e.deleted_at IS NULL
    AND e.status = 'active'
    AND EXISTS (
      SELECT 1 FROM departments d
      WHERE d.entity_id = e.id AND d.deleted_at IS NULL AND d.status = 'active'
    )
    AND EXISTS (
      SELECT 1 FROM hr_positions hp
      WHERE hp.tenant_id = e.tenant_id
        AND hp.deleted_at IS NULL AND hp.status = 'active'
        AND (hp.entity_id = e.id OR hp.entity_id IS NULL)
    )
  ORDER BY random()
  LIMIT 1
),
numbered AS (
  SELECT generate_series(1, 10) AS seq
),
base AS (
  SELECT
    n.seq,
    a.tenant_id,
    a.entity_id,
    d.id AS department_id,
    dv.id AS division_id,
    p.id AS position_id,
    g.id AS job_grade_id,

    ('SEED-DEMO-' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISSUS') || '-' || lpad(n.seq::text, 2, '0')) AS employee_number,

    trim(
      (ARRAY[
        'Ahmad','Budi','Citra','Dewi','Eko','Fitri','Gita','Hadi','Indah','Joko',
        'Kartika','Lina','Maya','Nanda','Putri','Rizki','Sari','Tono','Utami','Yoga'
      ])[(floor(random() * 20))::int + 1]
      || ' '
      || (ARRAY[
        'Permata','Wijaya','Santoso','Kusuma','Maharani','Pratama','Nugroho','Lestari','Firmansyah','Saputra',
        'Handayani','Siregar','Gunawan','Purnama','Susanto','Ramadhani','Febrianto','Melati','Anggraini','Hidayat'
      ])[(floor(random() * 20))::int + 1]
    ) AS full_name,

    substring(replace(gen_random_uuid()::text, '-', ''), 1, 12) || '@seed.demo.local' AS email,

    left(
      '628'
      || (ARRAY['11','21','31','812','813'])[(floor(random() * 5))::int + 1]
      || lpad(((floor(random() * 89999999))::bigint + 10000000)::text, 8, '0'),
      20
    ) AS phone,

    (ARRAY['male', 'female'])[(floor(random() * 2))::int + 1]::varchar AS gender,

    (ARRAY['single','married','divorced','widowed'])[(floor(random() * 4))::int + 1]::varchar AS marital_status,

    (DATE '1965-01-01' + ((floor(random() * 16000))::text || ' days')::interval)::date AS date_of_birth,

    (ARRAY['Islam','Kristen','Katolik','Hindu','Buddha'])[(floor(random() * 5))::int + 1]::varchar AS religion,

    (ARRAY['TK/0','TK/1','TK/2','K/0','K/1','K/2'])[(floor(random() * 6))::int + 1]::varchar AS ptkp_status,

    ('Jl. ' || (ARRAY['Sudirman','Thamrin','Gatot Subroto','HR Rasuna Said','Pakubuwono'])[(floor(random() * 5))::int + 1]
      || ' No. ' || ((floor(random() * 200))::int + 1)::text) AS address,

    (ARRAY['Jakarta','Bandung','Surabaya','Tangerang','Medan','Semarang'])[(floor(random() * 6))::int + 1]::varchar AS city,

    /* npwp VARCHAR(30) */
    left(
      '12.'
      || substring(replace(gen_random_uuid()::text, '-', '') from 1 for 7)
      || '.'
      || substring(md5(random()::text || n.seq::text) from 1 for 5)
      || '.123456',
      30
    ) AS npwp,

    /* bpjs VARCHAR(20) */
    left('001' || lpad(((floor(random() * 99999999))::bigint)::text, 9, '0'), 20) AS bpjs_tk_number,

    left('10' || lpad(((floor(random() * 999999999))::bigint)::text, 10, '0'), 20) AS bpjs_kes_number,

    (ARRAY['BCA','Mandiri','BNI','BRI','CIMB'])[(floor(random() * 5))::int + 1]::varchar AS bank_name,

    left(lpad(((floor(random() * 899999999999))::bigint)::text, 12, '0'), 30) AS bank_account_number,

    (ARRAY['permanent','contract','freelance','intern'])[(floor(random() * 4))::int + 1]::varchar AS employment_type,

    (DATE '2018-06-01' + ((floor(random() * 2500))::text || ' days')::interval)::date AS join_date,

    (ARRAY['active','active','active','inactive'])[(floor(random() * 4))::int + 1]::varchar AS status,

    'staff'::varchar(20) AS tax_position,

    substring(replace(gen_random_uuid()::text, '-', ''), 1, 22) AS unique_slug
  FROM numbered n
  CROSS JOIN anchor a
  JOIN LATERAL (
    SELECT d0.id
    FROM departments d0
    WHERE d0.entity_id = a.entity_id
      AND d0.tenant_id = a.tenant_id
      AND d0.deleted_at IS NULL
      AND d0.status = 'active'
    ORDER BY random()
    LIMIT 1
  ) d ON true
  JOIN LATERAL (
    SELECT hp.id
    FROM hr_positions hp
    WHERE hp.tenant_id = a.tenant_id
      AND hp.deleted_at IS NULL
      AND hp.status = 'active'
      AND (hp.entity_id = a.entity_id OR hp.entity_id IS NULL)
    ORDER BY random()
    LIMIT 1
  ) p ON true
  LEFT JOIN LATERAL (
    SELECT dv0.id
    FROM divisions dv0
    WHERE dv0.department_id = d.id
      AND dv0.deleted_at IS NULL
      AND dv0.status = 'active'
    ORDER BY random()
    LIMIT 1
  ) dv ON true
  LEFT JOIN LATERAL (
    SELECT hg.id
    FROM hr_job_grades hg
    WHERE hg.tenant_id = a.tenant_id
      AND hg.deleted_at IS NULL
      AND hg.status = 'active'
    ORDER BY random()
    LIMIT 1
  ) g ON true
)
INSERT INTO user_profiles (
  tenant_id,
  entity_id,
  department_id,
  division_id,
  position_id,
  job_grade_id,
  employee_number,
  full_name,
  email,
  phone,
  gender,
  marital_status,
  date_of_birth,
  religion,
  address,
  city,
  npwp,
  bpjs_tk_number,
  bpjs_kes_number,
  bank_name,
  bank_account_number,
  bank_account_name,
  employment_type,
  join_date,
  status,
  ptkp_status,
  tax_position,
  emergency_contact_name,
  emergency_contact_phone,
  blood_type,
  documents
)
SELECT
  b.tenant_id,
  b.entity_id,
  b.department_id,
  b.division_id,
  b.position_id,
  b.job_grade_id,
  b.employee_number,
  b.full_name,
  b.email,
  b.phone,
  b.gender,
  b.marital_status,
  b.date_of_birth,
  b.religion,
  b.address,
  b.city,
  b.npwp,
  b.bpjs_tk_number,
  b.bpjs_kes_number,
  b.bank_name,
  b.bank_account_number,
  b.full_name,
  b.employment_type,
  b.join_date,
  b.status,
  b.ptkp_status,
  b.tax_position,
  ('Emergency ' || split_part(b.full_name, ' ', 1)),
  left('62859' || lpad(((floor(random() * 89999999))::bigint + 10000000)::text, 8, '0'), 20),
  (ARRAY['A','B','O','AB'])[(floor(random() * 4))::int + 1]::varchar,
  jsonb_build_object(
    'seed', true,
    'demo', 'random_v1',
    'slug', b.unique_slug,
    'tax', jsonb_build_object('ptkp_status', b.ptkp_status, 'position', b.tax_position)
  )
FROM base b;
