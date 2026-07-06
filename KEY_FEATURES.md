# WIT-ERP — Key Features (HRIS)

Sistem informasi HR terpadu, dibangun di atas Next.js + InsForge (PostgreSQL). Dokumen ini merangkum fitur yang tampil di menu utama (mode HRIS — modul non-HRIS seperti Workforce, Commercial, Projects, dan Finance disembunyikan secara default lewat **Settings → Visibilitas Modul**).

---

## 1. HR (Human Resources)

- **Data Karyawan** — profil lengkap: jabatan, divisi, departemen, grade, riwayat kerja, pendidikan, keluarga.
- **Absensi** — clock-in/clock-out dengan foto & lokasi, deteksi keterlambatan, rekap kehadiran per periode.
- **Cuti (Leave)** — pengajuan cuti, saldo cuti otomatis per tipe, approval workflow, kuota tahunan.

## 2. Payroll (Penggajian)

- **Kompensasi Karyawan** — gaji pokok (matrix per grade + override per individu), tunjangan (fixed/variabel), potongan.
- **Proses Penggajian** — generate slip gaji otomatis dari data absensi + kompensasi + konfigurasi BPJS/PPh21 per entity.
- **Approval Payroll** — alur draft → approved → paid.
- **Slip Gaji & Pembayaran** — slip per karyawan per periode.
- **Analitik & Laporan Payroll** — ringkasan biaya gaji, tren bulanan, breakdown BPJS/pajak.
- **Pajak & Potongan** — konfigurasi PPh21 (metode gross/TER), BPJS Ketenagakerjaan & Kesehatan.

## 3. Performance (360 Feedback)

- **Template Penilaian** — kustomisasi pertanyaan penilaian.
- **Mapping Penilaian** — penentuan siapa menilai siapa (atasan/rekan/bawahan).
- **Dashboard 360** — hasil agregat penilaian per karyawan.
- **My Performance** — tampilan self-service untuk staff/manager (role staff/manager otomatis diarahkan ke sini saja).

## 4. Master Data

- **Organisasi** — entity, departemen, divisi, jabatan, job grade.
- **Payroll Config** — komponen gaji, matrix gaji per grade, konfigurasi entity (BPJS/PPh21/UMR).
- **HR Config (Kalender & Shift)** — kalender kerja, shift, hari libur.

## 5. Reports & Dashboard

- **Laporan Karyawan** — rekap data HR.
- **Dashboard Executive & HR** — ringkasan metrik perusahaan dan HR.

## 6. Settings

- **Profil & Akun** — informasi login dan data karyawan yang terhubung.
- **Visibilitas Modul** — admin bisa menyembunyikan/menampilkan modul non-HRIS (Workforce, Commercial, Projects, Finance) sesuai kebutuhan tampilan (tersimpan per browser).

## 7. Autentikasi & Keamanan

- Login email/password via InsForge Auth.
- Role-based access (employee, manager, admin, dst) — membatasi menu Performance untuk staff/manager ke tampilan self-service saja.
- Row Level Security (RLS) aktif di seluruh tabel database.

---

*Catatan: Workforce, Commercial/CRM, Projects, dan Finance tetap ada di codebase dan bisa dinyalakan kapan saja lewat Settings → Visibilitas Modul, tapi di luar cakupan dokumen ini karena fokus HRIS.*

*Dibuat otomatis sebagai bagian dari audit kesiapan demo — Juli 2026.*
