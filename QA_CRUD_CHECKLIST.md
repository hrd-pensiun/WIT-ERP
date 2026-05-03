# QA Checklist Per Halaman (CRUD)

Checklist ini dipakai untuk verifikasi manual halaman frontend terhadap database setelah hardening pass.

## Setup Umum

- [ ] Environment InsForge valid (bukan mock mode).
- [ ] User login dengan role yang punya akses tabel sesuai modul.
- [ ] Data referensi minimal sudah ada: `entities`, `departments`, `hr_job_grades`, `projects`.

## Master Data

### `master-data/entity`
- [ ] **Create**: tambah entity baru dari `master-data/entity/new`.
- [ ] **Read**: entity baru muncul di tabel list.
- [ ] **Update**: edit entity dari tombol pensil, simpan, data berubah.
- [ ] **Delete**: hapus entity dari list, data hilang dari list.
- [ ] **Error UX**: jika gagal delete (FK/RLS), banner error tampil.

### `master-data/organization` (Departments + Grades)
- [ ] **Create**: tambah department dan grade dari halaman `new`.
- [ ] **Read**: data tampil di tab sesuai.
- [ ] **Update**: edit dari tombol pensil masing-masing baris.
- [ ] **Delete**: hapus department/grade dari tombol trash.
- [ ] **Error UX**: gagal delete tampil banner error.

### `master-data/payroll` (Salary Components)
- [ ] **Create**: tambah komponen salary dari `component/new`.
- [ ] **Read**: komponen tampil di card earnings/deductions.
- [ ] **Update**: edit komponen dari tombol pensil.
- [ ] **Delete**: hapus komponen dari tombol trash.
- [ ] **Error UX**: gagal delete tampil banner error.

## HR

### `hr/employees`
- [ ] **Create**: tambah karyawan baru.
- [ ] **Read**: karyawan muncul di list + detail.
- [ ] **Update**: edit profil karyawan lalu simpan.
- [ ] **Delete**: hapus karyawan dari list.

### `hr/attendance`
- [ ] **Create**: input presensi manual dari `hr/attendance/new`.
- [ ] **Read**: data presensi muncul di list.
- [ ] **Update**: checkout/update status bila flow tersedia.

### `hr/leave`
- [ ] **Create**: pengajuan cuti baru tersimpan.
- [ ] **Read**: pengajuan muncul di list + detail.
- [ ] **Update**: approve/reject dari halaman detail mengubah status.

### `hr/payroll`
- [ ] **Create**: generate periode payroll dari `hr/payroll/generate`.
- [ ] **Read**: periode baru muncul di list `hr/payroll`.
- [ ] **Read detail**: buka detail periode (`hr/payroll/[period]`) dan data payroll detail tampil bila ada.
- [ ] **Delete**: hapus periode dari list.

## CRM

### `crm/pipeline`, `crm/leads`, `crm/opportunities`
- [ ] **Create**: tambah lead & opportunity.
- [ ] **Read**: data tampil di pipeline/list.
- [ ] **Update**: edit lead/opportunity + drag stage di pipeline.
- [ ] **Delete**: pastikan delete flow (jika tersedia di UI) bekerja.

### `crm/activities`
- [ ] **Create**: log aktivitas dari `crm/activities/new`.
- [ ] **Read**: aktivitas tampil di list.

## Projects

### `projects` (list)
- [ ] **Create**: buat project dari `projects/new`.
- [ ] **Read**: project tampil di `projects` dan `projects/kanban`.
- [ ] **Update**: edit project dari `projects/[id]/edit`.
- [ ] **Delete**: hapus project dari list `projects`.
- [ ] **Error UX**: gagal delete tampil banner error.

### `projects/kanban`
- [ ] **Create**: buat task dari `projects/tasks/new` atau `projects/[id]/tasks/new`.
- [ ] **Read**: task tampil di kolom sesuai status.
- [ ] **Update**: drag-drop status + edit task dari ikon pensil.
- [ ] **Delete**: hapus task dari ikon trash.
- [ ] **Error UX**: gagal update/delete tampil banner error.

## Finance

### `finance/expenses`
- [ ] **Create**: tambah expense dari `finance/expenses/new`.
- [ ] **Read**: expense tampil di list + detail.
- [ ] **Update**: ubah `payment_status` dari detail.
- [ ] **Delete**: hapus expense dari list atau detail.
- [ ] **Error UX**: gagal delete tampil banner error.

### `finance/invoices`
- [ ] **Create**: tambah invoice dari `finance/invoices/new`.
- [ ] **Read**: invoice tampil di list + detail.
- [ ] **Update**: ubah status invoice dari detail.
- [ ] **Delete**: hapus invoice dari list atau detail.
- [ ] **Error UX**: gagal delete tampil banner error.

## Reports

### `reports/employees`
- [ ] **Read**: statistik memuat data dari `user_profiles` (bukan mock).
- [ ] **Sanity**: angka total employee konsisten dengan `hr/employees`.

## Regression Cepat (Wajib Sebelum UAT)

- [ ] Tidak ada route 404 saat redirect setelah submit form.
- [ ] Tidak ada error console saat create/update/delete sukses.
- [ ] Error dari DB (RLS/FK/unique) terlihat jelas di UI.
- [ ] Data benar-benar berubah di DB (cek via SQL editor / halaman list).
