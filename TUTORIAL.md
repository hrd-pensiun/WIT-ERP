# WIT-ERP — Tutorial Demo (HRIS)

Panduan langkah demi langkah untuk mendemokan WIT-ERP versi HRIS. Ikuti urutan ini agar alur cerita mengalir dari HR dasar → Payroll → Performance.

---

## Persiapan Sebelum Demo

1. Jalankan aplikasi (`npm run dev`) dan pastikan `.env.local` berisi kredensial InsForge yang benar.
2. Login dengan akun yang punya role **admin/manager** (bukan role `employee`, karena employee hanya melihat versi terbatas — misalnya menu Performance otomatis disempitkan ke "My Performance" saja).
3. Cek **Settings → Visibilitas Modul** — pastikan semua toggle (Workforce, Commercial, Projects, Finance, Laporan Non-HRIS) dalam keadaan **mati**, supaya menu yang tampil hanya modul HRIS.

## Halaman Utama

- Buka halaman utama (`/`) — tunjukkan ringkasan metrik.

## 1. HR — Data Karyawan (3 menit)

- **HR → Employees** — tunjukkan daftar 13 karyawan aktif dengan departemen/divisi/jabatan berbeda.
- Klik salah satu karyawan → tunjukkan detail profil (riwayat kerja, pendidikan, keluarga).
- **HR → Attendance** — tunjukkan rekap absensi. Data absensi sudah tersedia dari pertengahan Mei sampai awal Juli 2026 untuk seluruh karyawan (termasuk pola hadir/telat/absen yang realistis).
- **HR → Leave** — tunjukkan pengajuan cuti & saldo cuti.

## 2. Payroll — Bagian Paling Menarik (5–7 menit)

Ini bagian showcase utama karena datanya paling lengkap:

- **Payroll → Compensation** — tunjukkan gaji pokok per karyawan (sumber: override individu atau matrix per grade).
- **Payroll → Reports / Analytics** — tunjukkan riwayat gaji **Januari–Juni 2026** yang sudah lunas (status "paid") untuk seluruh 13 karyawan.
- **Payroll → Slips** — buka slip gaji salah satu karyawan, tunjukkan breakdown tunjangan, BPJS, PPh21.
- **Live Demo — Proses Penggajian Juli 2026**:
  1. Buka **Payroll → Proses Penggajian**.
  2. Buat periode baru "Juli 2026".
  3. Klik **Proses** — sistem akan otomatis menghitung gaji semua karyawan berdasarkan matrix gaji + data absensi Juli yang sudah ada.
  4. Ini menunjukkan mesin kalkulasi payroll bekerja live di depan audiens, bukan data yang di-hardcode.

## 3. Performance 360 (2–3 menit)

- **Performance → Dashboard** — tunjukkan hasil penilaian 360 karyawan.
- **Performance → My Performance** — versi self-service (yang dilihat staff/manager biasa).

## 4. Master Data (opsional, jika audiens teknis/HR)

- **Master Data → Organization** — struktur entity, departemen, divisi, jabatan.
- **Master Data → Payroll Config** — matrix gaji per grade, konfigurasi BPJS/PPh21.

## 5. Settings & Kustomisasi

- Tunjukkan **Settings → Visibilitas Modul** sebagai contoh bahwa tampilan bisa disesuaikan per kebutuhan klien (misal: klien yang cuma butuh HRIS bisa sembunyikan Commercial/Finance/Projects — seperti yang sedang aktif saat ini).

---

## Catatan Teknis (untuk yang mendemokan, bukan untuk audiens)

- Menu **Reports → Sales** dan **Reports → Projects** belum ada halamannya (404 jika diklik) — sudah otomatis tersembunyi selama toggle "Laporan Non-HRIS" di Settings tetap mati. Jangan nyalakan toggle itu saat demo.
- Modul Workforce, Commercial/CRM, Projects, dan Finance sengaja disembunyikan untuk demo HRIS ini — semua datanya tetap ada di database bila suatu saat ingin didemokan terpisah.
- Semua data di atas adalah **data demo/seed**, bukan data produksi nyata — aman untuk diklik-klik dan diproses ulang.

---

*Dibuat otomatis sebagai bagian dari audit kesiapan demo — Juli 2026.*
