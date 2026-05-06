/**
 * Teks pedagogis form penilaian 360° untuk UI.
 *
 * Dokumentasi sumber bagi tim HR/produk: `docs/form360.md`
 * Pastikan konten penting tetap konsisten antara file ini dan dokumen tersebut.
 */

export const PERF360_REFERENCE_DOC_PATH = "docs/form360.md" as const

/** Petunjuk untuk penilai (ringkas, Bahasa Indonesia) */
export const PERF360_INSTRUCTION_ITEMS: string[] = [
  "Baca dengan teliti setiap pernyataan.",
  "Berikan rating berdasarkan pengalaman Anda bekerja bersama orang yang dinilai.",
  "Jujur dan objektif — hindari bias yang tidak berdasarkan pekerjaan.",
  "Jelaskan alasan di kolom komentar dengan contoh konkret jika diminta atau disarankan.",
  "Luangkan waktu sekitar 15–20 menit untuk satu form.",
  "Kirim sebelum batas waktu yang berlaku untuk periode ini.",
]

/** Catatan penting — bahasa asli dari dokumen referensi */
export const PERF360_IMPORTANT_NOTE_EN =
  "This assessment form has been designed to enable you to objectively appraise the work performance and potential of colleagues, subordinates, and supervisors in your organization. Please keep in mind that this assessment will become an important part of the Employee's record and will influence their future development and career. It is therefore important that you consider all of the following factors carefully before rating and describing in detail individual aspects of the Employee's performance."

/** Label kerahasiaan */
export const PERF360_CONFIDENTIAL_LINE =
  "Form ini rahasia — hanya untuk evaluasi internal dan pengembangan karier."

/** Arti tiap tingkat skala 1–5 (bahasa utama Indonesia, label EN seperti dokumen). */
export const PERF360_SCALE_LEGEND_1_5: readonly {
  score: number
  labelId: string
  labelEn: string
  bullets: readonly string[]
}[] = [
  {
    score: 1,
    labelId: "Sangat tidak setuju",
    labelEn: "Strongly Disagree",
    bullets: [
      "Perilaku/kinerja tidak sesuai sama sekali",
      "Perlu peningkatan yang signifikan",
      "Belum menunjukkan kompetensi yang diharapkan",
    ],
  },
  {
    score: 2,
    labelId: "Tidak setuju",
    labelEn: "Disagree",
    bullets: [
      "Masih di bawah ekspektasi",
      "Memerlukan perbaikan yang jelas",
      "Kompetensi terlihat tetapi belum cukup baik",
    ],
  },
  {
    score: 3,
    labelId: "Netral",
    labelEn: "Neutral",
    bullets: [
      "Cukup sesuai ekspektasi standar",
      "Kompetensi pada level yang wajar/diterima",
    ],
  },
  {
    score: 4,
    labelId: "Setuju",
    labelEn: "Agree",
    bullets: [
      "Sesuai atau sedikit melebihi ekspektasi",
      "Kompetensi baik dan dapat diandalkan",
    ],
  },
  {
    score: 5,
    labelId: "Sangat setuju",
    labelEn: "Strongly Agree",
    bullets: [
      "Sering melebihi ekspektasi",
      "Kompetensi kuat dan bisa jadi teladan",
    ],
  },
]

export const PERF360_SECTION_INTRO_ID =
  "Setiap pernyataan dinilai dengan skala sesuai template. Setelah memberi nilai, isi kolom komentar bila ditampilkan atau wajib untuk pertanyaan tersebut."
