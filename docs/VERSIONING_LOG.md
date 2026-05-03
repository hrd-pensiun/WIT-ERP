# WIT-ERP — versioning & session changelog

Dokumen ini mencatat perubahan produk dari sesi pengembangan agar mudah dilacak antar rilis. Tambahkan entri baru di **bagian atas** (reverse chronological).

---

## 2026-04-30 — Tambahan riwayat HR lanjutan (many entries)

### Ringkasan

- Menambahkan data **pendidikan informal**, **pengalaman organisasi**, **riwayat pekerjaan**, dan **portfolio** pada form edit karyawan.
- Seluruh section baru menggunakan pola **many entries** (tambah/hapus item per riwayat).

### Detail implementasi

| Area | Perubahan |
|------|-----------|
| Tab baru | Menambahkan tab **Karier & Organisasi** dan **Portfolio** pada halaman edit karyawan. |
| Pendidikan informal | Disimpan sebagai `documents.informal_education_history[]`. |
| Pengalaman organisasi | Disimpan sebagai `documents.organization_experience_history[]`. |
| Riwayat pekerjaan | Disimpan sebagai `documents.work_history[]`. |
| Portfolio | Disimpan sebagai `documents.portfolio[]` (judul, peran, tahun, URL, deskripsi). |

### File

- `app/(dashboard)/hr/employees/[id]/edit/client.tsx`

---

## 2026-04-30 — Kaitan Job Title dengan Job Grade (level via dropdown)

### Ringkasan

- Job Title sekarang dikaitkan ke Job Grade melalui `job_grade_id`.
- Form Job Title tidak lagi memakai input level bebas, melainkan dropdown grade sehingga level mengikuti grade.
- Form karyawan otomatis mengisi `job_grade_id` ketika memilih Job Title yang sudah terhubung grade.

### Detail implementasi

| Area | Perubahan |
|------|-----------|
| Migrasi DB | Menambahkan kolom `hr_positions.job_grade_id` + index + backfill awal dari kecocokan `level`. |
| Form Job Title (new/edit) | Ganti field `Level` ke dropdown `Job Grade` (`code - name (Level x)`). |
| Hook positions | `usePositions` sekarang memuat relasi `hr_job_grades` agar level grade bisa dipakai di UI. |
| Form Employee (new/edit) | Saat pilih Job Title, sistem otomatis set `job_grade_id` dari title tersebut. |
| List Job Title | Kolom level di page organisasi membaca `hr_job_grades.level` bila tersedia. |

### File

- `migrations/20260430184500_position-grade-link.sql`
- `supabase/migrations/010_position_grade_link.sql`
- `hooks/usePositions.ts`
- `app/(dashboard)/master-data/organization/position/new/page.tsx`
- `app/(dashboard)/master-data/organization/position/[id]/edit/client.tsx`
- `app/(dashboard)/master-data/organization/page.tsx`
- `app/(dashboard)/hr/employees/new/page.tsx`
- `app/(dashboard)/hr/employees/[id]/edit/client.tsx`
- `types/database.ts`

---

## 2026-04-30 — Migrasi DB profil karyawan + CRUD terhubung

### Ringkasan

- Menambahkan migrasi struktur data profil karyawan (kolom pajak + tabel riwayat HR terpisah).
- CRUD halaman edit/detail karyawan sekarang memakai tabel relasional baru (bukan hanya JSON `documents`).
- Migrasi sudah dieksekusi ke project InsForge via CLI (`db import`) dan tervalidasi.

### Migrasi baru

- `migrations/20260430173500_employee-profile-histories.sql`
- `supabase/migrations/009_employee_profile_histories.sql`

### Cakupan schema

- `user_profiles`: tambah kolom `ptkp_status`, `tax_position`.
- Tabel baru:
  - `employee_family_members`
  - `employee_education_histories`
  - `employee_informal_education_histories`
  - `employee_organization_experiences`
  - `employee_work_histories`
  - `employee_portfolios`

### Integrasi aplikasi

- Hook baru: `hooks/useEmployeeProfileDetails.ts` untuk load/replace riwayat per employee.
- Form edit employee: simpan ke tabel baru + update kolom pajak terstruktur.
- Detail employee: baca data dari tabel baru untuk tab Keluarga/Pendidikan/Karier/Portfolio.

---

## 2026-04-30 — Sinkronisasi halaman detail employee

### Ringkasan

- Halaman detail employee diperbarui agar menampilkan data riwayat baru yang sudah diinput dari form edit.
- Menambahkan tab terstruktur untuk mempermudah review cepat data HR.

### Detail implementasi

| Area | Perubahan |
|------|-----------|
| Header detail | Menampilkan jabatan dari relasi `hr_positions` (bukan field string lama). |
| Ringkasan | Perbaikan pembacaan department/position/status sesuai struktur `user_profiles`. |
| Tab detail | Menambahkan tab: `Overview`, `Keluarga`, `Pendidikan`, `Karier`, `Portfolio`. |
| Riwayat | Menampilkan `family_history`, `education_history`, `informal_education_history`, `organization_experience_history`, `work_history`, dan `portfolio` dari `documents` JSON. |
| Pajak | Menampilkan status PTKP di tab overview. |

### File

- `app/(dashboard)/hr/employees/[id]/client.tsx`

---

## 2026-04-30 — Upgrade halaman edit karyawan (multi-tab)

### Ringkasan

- Halaman `hr/employees/[id]/edit` ditingkatkan dari form sederhana menjadi form multi-tab.
- Menambahkan field yang lebih lengkap termasuk **Data Keluarga** dan **Data Pendidikan**.

### Detail implementasi

| Area | Perubahan |
|------|-----------|
| Struktur UI | Menambahkan tab: **Data Pribadi**, **Kepegawaian**, **Data Keluarga**, **Data Pendidikan**. |
| Relasi organisasi | Field `department_id`, `division_id`, `position_id`, `job_grade_id` menggunakan dropdown referensi master data. |
| Data kepegawaian | Menambahkan field `employment_type`, `status`, tanggal kerja, NPWP, BPJS, bank, dan kontak darurat. |
| Data keluarga & pendidikan | Disimpan ke `documents` (`JSONB`) dengan struktur `documents.family` dan `documents.education` agar tanpa migrasi schema baru. |
| Sinkronisasi payload | Payload update diselaraskan dengan kolom tabel `user_profiles` (menghilangkan field lama yang tidak relevan). |

### File

- `app/(dashboard)/hr/employees/[id]/edit/client.tsx`

---

## 2026-04-30 — Status perpajakan + many history keluarga/pendidikan

### Ringkasan

- Menambahkan field **status perpajakan PTKP** (TK/0, K/1, dst) di informasi karyawan.
- Mengubah input keluarga dan pendidikan menjadi model **many / riwayat** (bisa tambah/hapus banyak item).

### Detail implementasi

| Area | Perubahan |
|------|-----------|
| Perpajakan | Menambahkan `Status PTKP` dan `Posisi Pajak` pada tab kepegawaian. |
| Data keluarga | Dari single field menjadi list `family_history` dengan tombol tambah/hapus per anggota keluarga. |
| Data pendidikan | Dari single field menjadi list `education_history` dengan tombol tambah/hapus per riwayat pendidikan. |
| Penyimpanan | Data disimpan di `documents` JSON (`tax`, `family_history`, `education_history`) dan tetap kompatibel dengan data lama (`family`/`education`). |

### File

- `app/(dashboard)/hr/employees/[id]/edit/client.tsx`

---

## 2026-04-30 — Breadcrumb navigation global (dashboard)

### Ringkasan

- Menambahkan breadcrumb global di semua halaman dashboard agar user selalu tahu konteks halaman aktif.
- Breadcrumb otomatis mengikuti URL path, termasuk label ramah-baca untuk route penting (Finance, HR, Master Data, dll).

### Detail implementasi

| File | Perubahan |
|------|-----------|
| `components/layout/breadcrumbs.tsx` | Komponen baru breadcrumb berbasis `usePathname()`, membangun hirarki link dari path aktif. |
| `app/(dashboard)/layout.tsx` | Menyisipkan `<Breadcrumbs />` di atas konten `children` agar berlaku untuk seluruh halaman dalam dashboard layout. |

### Perilaku

- Root tampil sebagai **Dashboard**.
- Segmen route umum dipetakan ke label yang lebih jelas (contoh: `master-data` → `Master Data`, `position` → `Job Title`).
- Segmen ID numerik/UUID otomatis ditampilkan sebagai **Detail** agar tidak membingungkan pengguna.
- Item breadcrumb terakhir ditandai sebagai halaman aktif (non-clickable).

---

## 2026-04-30 — Penanda konteks record di halaman edit

### Ringkasan

- Menambahkan keterangan "Sedang mengedit: ..." pada header form edit agar user tahu record yang sedang dibuka.
- Fokus diterapkan pada halaman edit master data utama yang paling sering dipakai operasional.

### Detail implementasi

| File | Perubahan |
|------|-----------|
| `app/(dashboard)/master-data/entity/[id]/edit/client.tsx` | Header menampilkan nama + kode entity aktif. |
| `app/(dashboard)/master-data/organization/department/[id]/edit/client.tsx` | Header menampilkan nama + kode department aktif. |
| `app/(dashboard)/master-data/organization/division/[id]/edit/client.tsx` | Header menampilkan nama + kode divisi aktif. |
| `app/(dashboard)/master-data/organization/position/[id]/edit/client.tsx` | Header menampilkan nama + kode job title aktif. |
| `app/(dashboard)/master-data/organization/grade/[id]/edit/client.tsx` | Header menampilkan nama + kode grade aktif. |
| `app/(dashboard)/master-data/payroll/component/[id]/edit/client.tsx` | Header menampilkan nama + kode salary component aktif. |

### Perilaku

- Teks konteks muncul tepat di bawah subtitle halaman edit.
- Format konsisten: `Sedang mengedit: <nama> (<kode>)`.
- Jika data belum ada, fallback ke `-` untuk menjaga UI tetap stabil.

---

## 2026-04-30 — Sederhanakan BPJS di edit entity

### Ringkasan

- Menghapus input `BPJS TK` dan `BPJS Kesehatan` dari tab **Informasi Umum** pada halaman edit entity.
- BPJS kini difokuskan di tab **Payroll, BPJS, Pajak** untuk mencegah duplikasi konteks dan kebingungan user.

### File

- `app/(dashboard)/master-data/entity/[id]/edit/client.tsx`

---

## 2026-04-30 — UI layout, tipografi, master organisasi (SuperAdmin), Divisi & Job title

### Ringkasan

- Perbaikan tumpang tindih **sidebar** vs konten dashboard.
- Tipografi global: **Open Sans** + fallback **Helvetica / Arial**.
- **Struktur organisasi**: alur **SuperAdmin** pilih instansi (entity) lewat dialog; penyimpanan default di `localStorage` untuk scope CRUD.
- **CRUD Divisi** dan **Job title** (`hr_positions`) di halaman master organisasi, termasuk filter scope instansi dan perbaikan form.

### 1. Layout dashboard

| Area | Perubahan |
|------|-----------|
| `app/(dashboard)/layout.tsx` | Kolom utama memakai `lg:ml-64` agar sejajar dengan sidebar `fixed` lebar `w-64` — konten tidak lagi di bawah menu. |

**Akar masalah:** sidebar `position: fixed` tidak memakan ruang di flex; `lg:ml-0` membuat konten menabrak sidebar.

### 2. Tipografi

| File | Perubahan |
|------|-----------|
| `app/layout.tsx` | `next/font/google` **Open_Sans** (variable), subset `latin` + `latin-ext`, weight variable, fallback Helvetica stack. |
| `app/globals.css` | `@theme` — `--font-sans` / `--font-mono` memakai `var(--font-open-sans)` + **Helvetica Neue**, Helvetica, Arial. |
| `test-db.html`, `test-crud.html`, `check-db.html` | Google Fonts Open Sans + stack yang sama (utilitas lokal). |

**Catatan:** `font-mono` utilitas mengikuti stack sans (bukan monospace) agar seluruh UI mematuhi pilihan font; jika nanti butuh monospace untuk kode, pisahkan di tema.

### 3. Instansi default (SuperAdmin) — Struktur organisasi

| File / konstanta | Isi |
|------------------|-----|
| `lib/organization-default-entity.ts` | Key `wit-erp:organization-default-entity-id`, getter/setter; alias role SuperAdmin (`SuperAdmin`, `super_admin`, `Super Admin`). |
| `components/master-data/organization-instansi-dialog.tsx` | Dialog pemilihan instansi (dropdown entity). Mode **mandatory** jika belum ada ID tersimpan. |
| `app/(dashboard)/master-data/organization/page.tsx` | Banner “Instansi aktif”, integrasi dialog, filter data per scope. |

**Perilaku:**

- User dengan role SuperAdmin (di `user.metadata.role`) memilih instansi saat pertama masuk tanpa default tersimpan.
- Nilai disimpan di **localStorage** dan dipakai sebagai scope untuk daftar/tambah data organisasi.
- Tombol **Ubah instansi** membuka dialog lagi (boleh batal jika sudah punya default).

### 4. Hook & filter data

| Hook | Opsi tambahan / perilaku |
|------|---------------------------|
| `hooks/useDepartments.ts` | `entityId` (filter `departments.entity_id`), `skipFetch` (tunggu pilihan instansi). |
| `hooks/usePositions.ts` | `entityId` (filter `hr_positions.entity_id`), `skipFetch`. |
| `hooks/useDivisions.ts` | Select embed `departments (id, code, name, entity_id)`; `departmentEntityId` (filter lewat `departments.entity_id`); `skipFetch`; fallback `select('*')` jika embed gagal. |

### 5. Divisi (divisions)

- **Skema:** `divisions.department_id` → `departments` → `departments.entity_id` (tidak ada kolom `entity_id` langsung di `divisions`).
- **List + hapus:** tab **Divisi** di `/master-data/organization`.
- **Form:** `division/new` — pilih departemen, tampilkan instansi induk; `division/[id]/edit` — ubah termasuk `department_id` + tampilan instansi.

### 6. Job title (hr_positions)

- Tab **Job title** menggantikan placeholder “Coming soon” — tabel, tambah, edit, hapus.
- **Form:** `position/new` & `position/[id]/edit` — field **Instansi (entity)** (`entity_id` opsional / diedit).
- `grade/new` — perbaikan `tenant_id` memakai `getTenantId()` (bukan UUID nol).

### 7. File terkait (referensi cepat)

```
app/(dashboard)/layout.tsx
app/layout.tsx
app/globals.css
lib/organization-default-entity.ts
components/master-data/organization-instansi-dialog.tsx
app/(dashboard)/master-data/organization/page.tsx
app/(dashboard)/master-data/organization/division/new/page.tsx
app/(dashboard)/master-data/organization/division/[id]/edit/client.tsx
app/(dashboard)/master-data/organization/position/new/page.tsx
app/(dashboard)/master-data/organization/position/[id]/edit/client.tsx
hooks/useDepartments.ts
hooks/useDivisions.ts
hooks/usePositions.ts
test-db.html, test-crud.html, check-db.html
```

### 8. Catatan operasional

- **Role SuperAdmin** harus tersetel di metadata user (InsForge) agar dialog & filter instansi aktif.
- Jika embed `divisions` + `departments` gagal di environment tertentu, hook fallback ke `select('*')` — kolom **Instansi** di tabel bisa kosong sampai relasi diperbaiki di API.

---

## Cara memakai log ini untuk versioning

1. Saat menyiapkan rilis, salin entri tanggal relevan ke catatan rilis (Git tag / GitHub Release).
2. Nomori versi semver di commit rilis dan tautkan ke section tanggal di file ini.
3. Tambahkan entri baru di atas section ini; jangan menghapus riwayat lama tanpa kebijakan arsip terpisah.

---

*Entri pertama: 2026-04-30 — diselaraskan dengan sesi pengembangan terbaru.*
