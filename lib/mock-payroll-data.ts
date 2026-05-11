/**
 * mock-payroll-data.ts
 * Mock data hanya untuk data yang belum tersedia di DB:
 * - Analytics aggregations (monthly trend, grade distribution, top allowances)
 * - Approval workflow state (belum ada tabel approval di DB)
 *
 * Data karyawan, periode, dan detail payroll → diambil dari DB via hooks.
 */

export const formatIDR = (amount: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount)

// ── Approval Workflow (belum ada tabel approval di DB) ──────────────────────

export type MockApprovalItem = {
  id: string
  period_id: string
  period_label: string
  period_start: string
  period_end: string
  submitted_by: string
  submitted_at: string
  total_employees: number
  total_gross: number
  total_net: number
  workflow_step: "draft" | "processing" | "approved" | "paid"
  approver: string
  notes?: string
}

export const MOCK_APPROVAL_QUEUE: MockApprovalItem[] = [
  {
    id: "apv-001",
    period_id: "period-2026-04",
    period_label: "April 2026",
    period_start: "2026-04-01",
    period_end: "2026-04-30",
    submitted_by: "Siti Rahma (HR Manager)",
    submitted_at: "2026-04-25T09:00:00Z",
    total_employees: 87,
    total_gross: 890_000_000,
    total_net: 766_000_000,
    workflow_step: "processing",
    approver: "Direktur Keuangan",
  },
  {
    id: "apv-002",
    period_id: "period-2026-03",
    period_label: "Maret 2026",
    period_start: "2026-03-01",
    period_end: "2026-03-31",
    submitted_by: "Siti Rahma (HR Manager)",
    submitted_at: "2026-03-26T10:30:00Z",
    total_employees: 85,
    total_gross: 872_500_000,
    total_net: 751_000_000,
    workflow_step: "approved",
    approver: "Direktur Keuangan",
    notes: "Disetujui. Proses transfer ke rekening karyawan.",
  },
  {
    id: "apv-003",
    period_id: "period-2026-02",
    period_label: "Februari 2026",
    period_start: "2026-02-01",
    period_end: "2026-02-28",
    submitted_by: "Siti Rahma (HR Manager)",
    submitted_at: "2026-02-24T08:15:00Z",
    total_employees: 84,
    total_gross: 860_000_000,
    total_net: 740_000_000,
    workflow_step: "paid",
    approver: "Direktur Keuangan",
    notes: "Dibayar pada 28 Feb 2026.",
  },
]

// ── Monthly Payroll Trend (aggregasi 6 bulan) ───────────────────────────────

export type MonthlyTrend = {
  month: string
  period_label: string
  gross: number
  net: number
  employee_count: number
  pph21: number
  bpjs_total: number
}

export const MOCK_MONTHLY_TREND: MonthlyTrend[] = [
  { month: "Nov", period_label: "Nov 2025", gross: 825_000_000, net: 711_000_000, employee_count: 81, pph21: 58_000_000, bpjs_total: 56_000_000 },
  { month: "Des", period_label: "Des 2025", gross: 838_000_000, net: 722_000_000, employee_count: 82, pph21: 59_200_000, bpjs_total: 56_800_000 },
  { month: "Jan", period_label: "Jan 2026", gross: 845_000_000, net: 728_000_000, employee_count: 83, pph21: 59_900_000, bpjs_total: 57_100_000 },
  { month: "Feb", period_label: "Feb 2026", gross: 860_000_000, net: 740_000_000, employee_count: 84, pph21: 61_000_000, bpjs_total: 59_000_000 },
  { month: "Mar", period_label: "Mar 2026", gross: 872_500_000, net: 751_000_000, employee_count: 85, pph21: 62_100_000, bpjs_total: 59_400_000 },
  { month: "Apr", period_label: "Apr 2026", gross: 890_000_000, net: 766_000_000, employee_count: 87, pph21: 63_500_000, bpjs_total: 60_500_000 },
]

// ── Grade Distribution (aggregasi — belum ada view di DB) ───────────────────

export type GradeDistribution = {
  grade: string
  count: number
  avg_salary: number
  pct: number
  color: string
  bg: string
}

export const MOCK_GRADE_DISTRIBUTION: GradeDistribution[] = [
  { grade: "Grade 3", count: 18, avg_salary: 7_500_000, pct: 20.7, color: "text-blue-600", bg: "bg-blue-500" },
  { grade: "Grade 4", count: 31, avg_salary: 10_200_000, pct: 35.6, color: "text-emerald-600", bg: "bg-emerald-500" },
  { grade: "Grade 5", count: 25, avg_salary: 13_800_000, pct: 28.7, color: "text-amber-600", bg: "bg-amber-500" },
  { grade: "Grade 6", count: 13, avg_salary: 19_500_000, pct: 14.9, color: "text-purple-600", bg: "bg-purple-500" },
]

// ── Top Allowance Components (aggregasi) ────────────────────────────────────

export type TopAllowance = {
  rank: number
  name: string
  total: number
  employee_count: number
  pct_of_total: number
}

export const MOCK_TOP_ALLOWANCES: TopAllowance[] = [
  { rank: 1, name: "Tunjangan Transport", total: 87_000_000, employee_count: 87, pct_of_total: 28.5 },
  { rank: 2, name: "Tunjangan Makan", total: 65_250_000, employee_count: 87, pct_of_total: 21.4 },
  { rank: 3, name: "Tunjangan Jabatan", total: 43_500_000, employee_count: 29, pct_of_total: 14.3 },
  { rank: 4, name: "Tunjangan Kesehatan", total: 26_100_000, employee_count: 87, pct_of_total: 8.6 },
  { rank: 5, name: "Insentif Kinerja", total: 18_000_000, employee_count: 15, pct_of_total: 5.9 },
]

// ── PTKP Reference (static reference data) ─────────────────────────────────

export const PTKP_TABLE = [
  { status: "TK/0", label: "Tidak Kawin, tanpa tanggungan", annual: 54_000_000 },
  { status: "TK/1", label: "Tidak Kawin, 1 tanggungan", annual: 58_500_000 },
  { status: "TK/2", label: "Tidak Kawin, 2 tanggungan", annual: 63_000_000 },
  { status: "TK/3", label: "Tidak Kawin, 3 tanggungan", annual: 67_500_000 },
  { status: "K/0",  label: "Kawin, tanpa tanggungan",    annual: 58_500_000 },
  { status: "K/1",  label: "Kawin, 1 tanggungan",        annual: 63_000_000 },
  { status: "K/2",  label: "Kawin, 2 tanggungan",        annual: 67_500_000 },
  { status: "K/3",  label: "Kawin, 3 tanggungan",        annual: 72_000_000 },
]

// ── Indonesian month names ──────────────────────────────────────────────────

export const BULAN_ID = [
  "", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
]

export function periodLabel(year: number, month: number): string {
  return `${BULAN_ID[month]} ${year}`
}
