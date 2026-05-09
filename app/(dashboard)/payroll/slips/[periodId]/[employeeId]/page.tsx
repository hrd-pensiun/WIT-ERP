"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Download,
  CheckCircle2,
  Loader2,
  Printer,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePayroll } from "@/hooks/usePayroll"
import { useEmployees } from "@/hooks/useEmployees"
import { formatIDR, periodLabel } from "@/lib/mock-payroll-data"

export default function SlipDetailPage() {
  const params = useParams()
  const periodId = params.periodId as string
  const employeeId = params.employeeId as string

  const { getPeriod, fetchDetails } = usePayroll()
  const { getEmployee } = useEmployees()

  const [period, setPeriod] = useState<any>(null)
  const [detail, setDetail] = useState<any>(null)
  const [employee, setEmployee] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [paid, setPaid] = useState(false)

  useEffect(() => {
    if (!periodId || !employeeId) return
    setLoading(true)
    Promise.all([
      getPeriod(periodId).catch(() => null),
      fetchDetails(periodId),
      getEmployee(employeeId).catch(() => null),
    ]).then(([p, details, emp]) => {
      setPeriod(p)
      const d = (details as any[]).find((x) => x.user_profile_id === employeeId)
      setDetail(d ?? null)
      if (d?.status === "paid") setPaid(true)
      setEmployee(emp)
    }).finally(() => setLoading(false))
  }, [periodId, employeeId, getPeriod, fetchDetails, getEmployee])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Memuat slip gaji...
      </div>
    )
  }

  const periodLbl = period ? periodLabel(period.period_year, period.period_month) : "—"
  const emp = employee ?? detail?.user_profiles ?? {}

  // Parse allowance_details & deduction_details JSON fields
  const allowances: Array<{ name: string; amount: number; is_fixed?: boolean }> =
    Array.isArray(detail?.allowance_details) ? detail.allowance_details : []
  const deductions: Array<{ name: string; amount: number }> =
    Array.isArray(detail?.deduction_details) ? detail.deduction_details : []

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <Link href="/payroll/slips">
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-200 gap-1">
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          {!paid && detail && (
            <Button
              onClick={() => setPaid(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              Konfirmasi Pembayaran
            </Button>
          )}
          {paid && (
            <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
              <CheckCircle2 className="w-4 h-4" />
              Sudah Dibayar
            </span>
          )}
          <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 gap-1.5">
            <Download className="w-4 h-4" />
            Unduh PDF
          </Button>
        </div>
      </div>

      {/* Slip Document */}
      <div className="bg-white text-slate-900 rounded-lg shadow-xl overflow-hidden">
        {/* Slip Header */}
        <div className="bg-slate-800 text-white px-8 py-5 flex items-center justify-between">
          <div>
            <p className="text-2xl font-black tracking-tight">
              WIT<span className="text-red-400">.</span>
            </p>
            <p className="text-xs text-slate-400 mt-0.5">PT WIT Teknologi Indonesia</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400 uppercase tracking-widest">Slip Gaji</p>
            <p className="text-lg font-bold text-white mt-0.5">{periodLbl}</p>
            {period?.payment_date && (
              <p className="text-xs text-slate-400 mt-0.5">
                Tgl Bayar: {new Date(period.payment_date).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}
              </p>
            )}
          </div>
        </div>

        {/* Employee Info */}
        <div className="px-8 py-5 border-b border-slate-200 bg-slate-50">
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <InfoRow label="Nama Karyawan" value={emp.full_name ?? "—"} />
            <InfoRow label="No. Induk" value={emp.employee_number ?? "—"} />
            <InfoRow label="Jabatan" value={emp.hr_positions?.name ?? employee?.hr_positions?.name ?? "—"} />
            <InfoRow label="Departemen" value={emp.departments?.name ?? employee?.departments?.name ?? "—"} />
            <InfoRow label="Grade" value={emp.hr_job_grades?.name ?? employee?.hr_job_grades?.name ?? "—"} />
            <InfoRow label="Status Karyawan" value={emp.status === "active" ? "Karyawan Tetap / Aktif" : (emp.employment_type ?? "—")} />
          </div>
        </div>

        {/* Earnings */}
        <div className="px-8 py-5 border-b border-slate-100">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Pendapatan</p>
          <table className="w-full text-sm">
            <tbody>
              <SlipRow label="Gaji Pokok" amount={detail?.basic_salary ?? 0} />
              {allowances.map((a, i) => (
                <SlipRow key={i} label={a.name} amount={a.amount} />
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200">
                <td className="pt-2 font-semibold text-slate-700">Penghasilan Bruto</td>
                <td className="pt-2 text-right font-bold text-slate-900">{formatIDR(detail?.gross_salary ?? 0)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Deductions */}
        <div className="px-8 py-5 border-b border-slate-100">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Potongan</p>
          <table className="w-full text-sm">
            <tbody>
              {deductions.length > 0 ? (
                deductions.map((d, i) => (
                  <SlipRow key={i} label={d.name} amount={d.amount} negative />
                ))
              ) : (
                <>
                  <SlipRow label="BPJS Tenaga Kerja" amount={detail?.bpjs_tk_amount ?? 0} negative />
                  <SlipRow label="BPJS Kesehatan" amount={detail?.bpjs_kes_amount ?? 0} negative />
                  <SlipRow label="PPh 21 Pasal 21" amount={detail?.pph21_amount ?? 0} negative />
                </>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200">
                <td className="pt-2 font-semibold text-slate-700">Total Potongan</td>
                <td className="pt-2 text-right font-bold text-red-600">({formatIDR(detail?.total_deductions ?? 0)})</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Net Salary */}
        <div className="px-8 py-5 bg-emerald-50">
          <div className="flex items-center justify-between">
            <p className="text-base font-bold text-slate-800 uppercase tracking-wide">Gaji Bersih (Take Home Pay)</p>
            <p className="text-2xl font-black text-emerald-700">{formatIDR(detail?.net_salary ?? 0)}</p>
          </div>
          {paid && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-600">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Telah ditransfer ke rekening karyawan
            </div>
          )}
        </div>

        {/* Signature Footer */}
        <div className="px-8 py-6 border-t border-slate-200">
          <div className="flex justify-between items-end">
            <div className="text-center">
              <p className="text-xs text-slate-400 mb-12">Diterima oleh,</p>
              <div className="border-t border-slate-300 pt-1 w-40">
                <p className="text-xs text-slate-500">{emp.full_name ?? "Karyawan"}</p>
              </div>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-400 mb-12">Mengetahui,</p>
              <div className="border-t border-slate-300 pt-1 w-40">
                <p className="text-xs text-slate-500">HR Manager</p>
              </div>
            </div>
            <div className="text-right text-xs text-slate-400">
              <p>Dicetak pada:</p>
              <p>{new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}</p>
              <p className="mt-1 text-[10px] text-slate-300">Dokumen ini digenerate secara otomatis oleh sistem WIT-ERP</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-slate-500 min-w-[140px]">{label}</span>
      <span className="font-medium text-slate-800">: {value}</span>
    </div>
  )
}

function SlipRow({ label, amount, negative }: { label: string; amount: number; negative?: boolean }) {
  return (
    <tr>
      <td className="py-1 text-slate-600">{label}</td>
      <td className={`py-1 text-right font-medium ${negative ? "text-red-600" : "text-slate-800"}`}>
        {negative ? `(${formatIDR(amount)})` : formatIDR(amount)}
      </td>
    </tr>
  )
}
