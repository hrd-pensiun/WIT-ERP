# WIT-ERP — Database Migrations & Seeds

Folder ini berisi **migration SQL lengkap** yang bisa dijalankan secara berurutan di database baru (PostgreSQL / InsForge / Supabase).

---

## Struktur Folder

```
migration-new/
├── migrations/          # DDL — CREATE TABLE, ALTER, INDEX, RLS Policy
│   ├── 001_extensions.sql
│   ├── 002_organizations.sql
│   ├── 003_hr_core.sql
│   ├── 004_user_profiles.sql
│   ├── 005_salary_core.sql
│   ├── 006_payroll_config.sql
│   ├── 007_attendance.sql
│   ├── 008_leave.sql
│   ├── 009_employee_histories.sql
│   ├── 010_payroll.sql
│   ├── 011_performance_360.sql
│   ├── 012_position_eligibility.sql
│   ├── 013_crm_core.sql
│   ├── 014_commercial_nomenclature.sql
│   ├── 015_commercial_projects.sql
│   ├── 016_lead_documents.sql
│   └── 017_project_features.sql
└── seeds/               # DML — INSERT data awal
    ├── 001_seed_master_data.sql   # Entity HQ, job grades, work shifts, leave types, libur 2026
    ├── 002_seed_hr.sql            # Departments, divisions, positions, salary components, matrix
    ├── 003_seed_commercial.sql    # Lead status, project types, rate cards, nomenclature
    └── 004_seed_sample_data.sql   # Sample users, leads, project (DEV/STAGING only)
```

---

## Urutan Eksekusi

> **PENTING**: Jalankan migration sesuai urutan nomor file karena ada dependency antar tabel (FK).

### Step 1 — Migrations (DDL)
Jalankan semua file di folder `migrations/` **secara berurutan** (001 → 017):

```sql
-- Di SQL editor InsForge / Supabase / psql
\i migrations/001_extensions.sql
\i migrations/002_organizations.sql
\i migrations/003_hr_core.sql
\i migrations/004_user_profiles.sql
\i migrations/005_salary_core.sql
\i migrations/006_payroll_config.sql
\i migrations/007_attendance.sql
\i migrations/008_leave.sql
\i migrations/009_employee_histories.sql
\i migrations/010_payroll.sql
\i migrations/011_performance_360.sql
\i migrations/012_position_eligibility.sql
\i migrations/013_crm_core.sql
\i migrations/014_commercial_nomenclature.sql
\i migrations/015_commercial_projects.sql
\i migrations/016_lead_documents.sql
\i migrations/017_project_features.sql
```

Atau gunakan psql batch:
```bash
for f in migrations/*.sql; do psql $DATABASE_URL -f "$f"; done
```

### Step 2 — Seeds (DML)
```sql
\i seeds/001_seed_master_data.sql
\i seeds/002_seed_hr.sql
\i seeds/003_seed_commercial.sql
-- Opsional (dev/staging only):
\i seeds/004_seed_sample_data.sql
```

---

## Konfigurasi Tenant

Semua seed menggunakan UUID default:
- **Tenant ID**: `00000000-0000-0000-0000-000000000001`
- **Entity (HQ) ID**: `00000000-0000-0000-0000-000000000010`

Ganti nilai ini di bagian `DO $$ DECLARE` di setiap seed file sebelum eksekusi di production.

---

## Dependency Map

```
001_extensions
    └── 002_organizations (entities, departments, divisions)
            └── 003_hr_core (hr_job_grades, hr_positions, hr_work_shifts, hr_leave_types)
                    └── 004_user_profiles
                            ├── 005_salary_core (salary_components, salary_matrix, allowance_matrix)
                            ├── 006_payroll_config
                            ├── 007_attendance
                            ├── 008_leave
                            ├── 009_employee_histories
                            ├── 010_payroll
                            ├── 011_performance_360
                            ├── 012_position_eligibility
                            └── 013_crm_core (crm_leads, crm_opportunities)
                                    ├── 014_commercial_nomenclature
                                    ├── 015_commercial_projects
                                    ├── 016_lead_documents
                                    └── 017_project_features
```

---

## Tabel yang Dibuat (57 tabel)

| # | Migration | Tabel |
|---|-----------|-------|
| 1 | 002 | `entities`, `departments`, `divisions` |
| 2 | 003 | `hr_job_grades`, `hr_positions`, `hr_work_shifts`, `hr_work_calendars`, `hr_leave_types` |
| 3 | 004 | `user_profiles` |
| 4 | 005 | `salary_components`, `salary_matrix`, `allowance_matrix` |
| 5 | 006 | `entity_payroll_configs`, `payroll_cutoff_configs`, `payroll_period_overrides` |
| 6 | 007 | `attendance_records`, `attendance_fine_config`, `attendance_fine_tiers` |
| 7 | 008 | `leave_requests`, `employee_leave_balances` |
| 8 | 009 | `employee_salaries`, `employee_allowances`, `employee_allowance_histories`, `employee_family_members`, `employee_education_histories`, `employee_informal_education_histories`, `employee_organization_experiences`, `employee_work_histories`, `employee_portfolios` |
| 9 | 010 | `payroll_periods`, `payroll_details`, `payroll_calibration_logs` |
| 10 | 011 | `performance_360_templates`, `performance_360_template_questions`, `performance_360_submissions`, `performance_360_submission_answers`, `performance_360_rater_settings` |
| 11 | 012 | `position_allowance_eligibility`, `position_fine_eligibility` |
| 12 | 013 | `commercial_lead_status`, `crm_leads`, `crm_opportunities` |
| 13 | 014 | `commercial_nomenclature`, `commercial_project_types`, `commercial_rate_cards` |
| 14 | 015 | `commercial_projects`, `commercial_project_manpower` |
| 15 | 016 | `lead_mom`, `lead_quotations`, `lead_cost_analyses`, `lead_project_briefs`, `lead_technical_analyses`, `lead_quotation_summaries` |
| 16 | 017 | `project_milestones`, `project_tasks`, `project_members`, `project_contacts`, `project_checklist_items`, `project_payment_terms`, `project_comments` |

---

## Catatan

- Semua tabel menggunakan **RLS (Row Level Security)** dengan policy `FOR ALL TO authenticated`
- UUID primary key menggunakan `gen_random_uuid()` (built-in PostgreSQL 13+)
- Semua migration menggunakan `IF NOT EXISTS` sehingga **idempotent** (aman dijalankan ulang)
- Seed file menggunakan `ON CONFLICT DO NOTHING` sehingga aman dijalankan ulang
