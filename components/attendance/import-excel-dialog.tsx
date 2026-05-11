"use client"

import { useState, useRef } from "react"
import * as XLSX from "xlsx"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2, Download, X } from "lucide-react"
import { insForge } from "@/lib/insforge"
import { getTenantId } from "@/lib/tenant"

const tenantId = getTenantId()

// ── Types ─────────────────────────────────────────────────────────────────────
type RowStatus = "ok" | "error" | "duplicate"
type ParsedRow = {
  index: number
  employee_number: string
  date: string          // YYYY-MM-DD
  check_in: string | null   // HH:MM
  check_out: string | null  // HH:MM
  status: string
  notes: string
  rowStatus: RowStatus
  errorMsg?: string
  user_profile_id?: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function normalizeDate(raw: any): string | null {
  if (!raw) return null
  // If it's an Excel serial number
  if (typeof raw === "number") {
    const d = XLSX.SSF.parse_date_code(raw)
    if (!d) return null
    return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`
  }
  const s = String(raw).trim()
  // Handle dd/mm/yyyy or dd-mm-yyyy
  const dmyMatch = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
  if (dmyMatch) {
    return `${dmyMatch[3]}-${dmyMatch[2].padStart(2, "0")}-${dmyMatch[1].padStart(2, "0")}`
  }
  // Handle yyyy-mm-dd
  const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`
  return null
}

function normalizeTime(raw: any): string | null {
  if (!raw) return null
  if (typeof raw === "number") {
    // Excel time fraction (0–1)
    const totalMin = Math.round(raw * 1440)
    const h = Math.floor(totalMin / 60) % 24
    const m = totalMin % 60
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
  }
  const s = String(raw).trim()
  // HH:MM or HH:MM:SS
  const match = s.match(/^(\d{1,2}):(\d{2})/)
  if (match) return `${match[1].padStart(2, "0")}:${match[2]}`
  return null
}

function normalizeStatus(raw: any): string {
  const s = String(raw ?? "present").toLowerCase().trim()
  if (s.includes("absen") || s === "absent") return "absent"
  if (s.includes("telambat") || s.includes("late") || s === "terlambat") return "late"
  if (s.includes("sakit") || s === "sick") return "sick"
  if (s.includes("cuti") || s === "leave") return "leave"
  return "present"
}

function toISO(date: string, time: string | null): string | null {
  if (!time) return null
  return `${date}T${time}:00`
}

// ── Download template ─────────────────────────────────────────────────────────
function downloadTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([
    ["employee_number", "date", "check_in", "check_out", "status", "notes"],
    ["EMP001", "2026-05-01", "08:00", "17:00", "present", ""],
    ["EMP002", "2026-05-01", "08:30", "17:00", "late", "Terlambat 30 menit"],
    ["EMP003", "2026-05-01", "", "", "absent", "Tanpa keterangan"],
  ])
  ws["!cols"] = [{ wch: 18 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 30 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, "Absensi")
  XLSX.writeFile(wb, "template_absensi.xlsx")
}

// ── Main Dialog ───────────────────────────────────────────────────────────────
interface ImportExcelDialogProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function ImportExcelDialog({ open, onClose, onSuccess }: ImportExcelDialogProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [fileName, setFileName] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [importDone, setImportDone] = useState(false)
  const [importResult, setImportResult] = useState<{ ok: number; err: number } | null>(null)
  const [globalError, setGlobalError] = useState<string | null>(null)

  function reset() {
    setRows([])
    setFileName(null)
    setImporting(false)
    setImportDone(false)
    setImportResult(null)
    setGlobalError(null)
    if (fileRef.current) fileRef.current.value = ""
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setGlobalError(null)
    setImportDone(false)
    setImportResult(null)

    try {
      const buf = await file.arrayBuffer()
      const wb  = XLSX.read(buf, { type: "array", cellDates: false })
      const ws  = wb.Sheets[wb.SheetNames[0]]
      const raw: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" })

      if (raw.length < 2) { setGlobalError("File kosong atau tidak memiliki data"); return }

      // Detect header row (first row)
      const header: string[] = raw[0].map((h: any) => String(h).toLowerCase().replace(/\s+/g, "_").trim())
      const col = (name: string) => header.indexOf(name)

      const idxEmpNo   = col("employee_number") !== -1 ? col("employee_number") : col("no_karyawan") !== -1 ? col("no_karyawan") : 0
      const idxDate    = col("date") !== -1 ? col("date") : col("tanggal") !== -1 ? col("tanggal") : 1
      const idxCheckIn = col("check_in") !== -1 ? col("check_in") : col("jam_masuk") !== -1 ? col("jam_masuk") : 2
      const idxCheckOut= col("check_out") !== -1 ? col("check_out") : col("jam_keluar") !== -1 ? col("jam_keluar") : 3
      const idxStatus  = col("status") !== -1 ? col("status") : 4
      const idxNotes   = col("notes") !== -1 ? col("notes") : col("catatan") !== -1 ? col("catatan") : 5

      const parsed: ParsedRow[] = []
      for (let i = 1; i < raw.length; i++) {
        const row = raw[i]
        const empNo = String(row[idxEmpNo] ?? "").trim()
        const date  = normalizeDate(row[idxDate])
        const checkIn  = normalizeTime(row[idxCheckIn])
        const checkOut = normalizeTime(row[idxCheckOut])
        const status = normalizeStatus(row[idxStatus])
        const notes  = String(row[idxNotes] ?? "").trim()

        if (!empNo && !date) continue // skip blank rows

        const p: ParsedRow = {
          index: i,
          employee_number: empNo,
          date: date ?? "",
          check_in: checkIn,
          check_out: checkOut,
          status,
          notes,
          rowStatus: "ok",
        }

        if (!empNo) { p.rowStatus = "error"; p.errorMsg = "No. karyawan kosong" }
        else if (!date) { p.rowStatus = "error"; p.errorMsg = "Format tanggal tidak dikenali" }

        parsed.push(p)
      }

      // Resolve employee_number → user_profile_id in batch
      const empNumbers = [...new Set(parsed.filter(r => r.rowStatus === "ok").map(r => r.employee_number))]
      if (empNumbers.length > 0 && insForge) {
        const { data: profiles } = await (insForge as any)
          .from("user_profiles")
          .select("id, employee_number")
          .eq("tenant_id", tenantId)
          .in("employee_number", empNumbers)

        const profileMap = new Map<string, string>()
        for (const p of (profiles ?? [])) profileMap.set(p.employee_number, p.id)

        for (const row of parsed) {
          if (row.rowStatus !== "ok") continue
          const pid = profileMap.get(row.employee_number)
          if (!pid) { row.rowStatus = "error"; row.errorMsg = `Karyawan "${row.employee_number}" tidak ditemukan` }
          else row.user_profile_id = pid
        }
      }

      setRows(parsed)
    } catch (err: any) {
      setGlobalError(err?.message ?? "Gagal membaca file Excel")
    }
  }

  async function handleImport() {
    const validRows = rows.filter(r => r.rowStatus === "ok" && r.user_profile_id)
    if (!validRows.length || !insForge) return

    setImporting(true)
    let ok = 0; let err = 0

    // Upsert in batches of 50
    const batchSize = 50
    for (let i = 0; i < validRows.length; i += batchSize) {
      const batch = validRows.slice(i, i + batchSize).map(r => ({
        tenant_id: tenantId,
        user_profile_id: r.user_profile_id!,
        date: r.date,
        check_in:  toISO(r.date, r.check_in),
        check_out: toISO(r.date, r.check_out),
        work_hours: (r.check_in && r.check_out)
          ? Math.round(((new Date(`${r.date}T${r.check_out}:00`).getTime() - new Date(`${r.date}T${r.check_in}:00`).getTime()) / 3600000) * 100) / 100
          : null,
        status:     r.status,
        check_in_status: r.status === "late" ? "late" : r.check_in ? "on_time" : null,
        notes:      r.notes || null,
      }))

      const { error } = await (insForge as any)
        .from("attendance_records")
        .upsert(batch, { onConflict: "tenant_id,user_profile_id,date", ignoreDuplicates: false })

      if (error) err += batch.length
      else ok += batch.length
    }

    setImporting(false)
    setImportDone(true)
    setImportResult({ ok, err })
    onSuccess?.()
  }

  const validCount  = rows.filter(r => r.rowStatus === "ok").length
  const errorCount  = rows.filter(r => r.rowStatus === "error").length

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { reset(); onClose() } }}>
      <DialogContent className="max-w-2xl gap-0 p-0 overflow-hidden">

        {/* Header */}
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            </div>
            <div>
              <DialogTitle className="text-base">Import Absensi dari Excel</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Data yang ada akan di-override jika tanggal + karyawan sama
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">

          {/* Upload area */}
          {!importDone && (
            <div
              className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="w-8 h-8 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">
                  {fileName ? fileName : "Klik untuk pilih file Excel"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Format .xlsx · Kolom: employee_number, date, check_in, check_out, status, notes
                </p>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFile}
              />
            </div>
          )}

          {/* Download template */}
          {!rows.length && !importDone && (
            <div className="flex justify-center">
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground gap-1.5" onClick={downloadTemplate}>
                <Download className="w-3.5 h-3.5" /> Download Template
              </Button>
            </div>
          )}

          {/* Global error */}
          {globalError && (
            <div className="flex items-start gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              {globalError}
            </div>
          )}

          {/* Preview table */}
          {rows.length > 0 && !importDone && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-xs">{validCount} valid</Badge>
                  {errorCount > 0 && <Badge className="bg-red-500/20 text-red-400 border-0 text-xs">{errorCount} error</Badge>}
                </div>
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground" onClick={reset}>
                  <X className="w-3 h-3" /> Ganti file
                </Button>
              </div>

              <div className="border border-border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-muted/60 backdrop-blur-sm">
                    <tr className="border-b border-border">
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">No. Kary.</th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">Tanggal</th>
                      <th className="text-center px-3 py-2 font-medium text-muted-foreground">Check In</th>
                      <th className="text-center px-3 py-2 font-medium text-muted-foreground">Check Out</th>
                      <th className="text-center px-3 py-2 font-medium text-muted-foreground">Status</th>
                      <th className="text-left px-3 py-2 font-medium text-muted-foreground">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.index} className={`border-b border-border/50 ${
                        row.rowStatus === "error" ? "bg-red-500/5" : ""
                      }`}>
                        <td className="px-3 py-1.5 font-mono">{row.employee_number}</td>
                        <td className="px-3 py-1.5">{row.date}</td>
                        <td className="px-3 py-1.5 text-center">{row.check_in ?? "—"}</td>
                        <td className="px-3 py-1.5 text-center">{row.check_out ?? "—"}</td>
                        <td className="px-3 py-1.5 text-center">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            row.status === "absent"  ? "bg-red-500/20 text-red-400" :
                            row.status === "late"    ? "bg-yellow-500/20 text-yellow-400" :
                            row.status === "sick"    ? "bg-orange-500/20 text-orange-400" :
                            row.status === "leave"   ? "bg-blue-500/20 text-blue-400" :
                            "bg-emerald-500/20 text-emerald-400"
                          }`}>{row.status}</span>
                        </td>
                        <td className="px-3 py-1.5">
                          {row.rowStatus === "error"
                            ? <span className="text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{row.errorMsg}</span>
                            : <span className="text-muted-foreground">{row.notes || "—"}</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Import done */}
          {importDone && importResult && (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="w-14 h-14 rounded-full bg-emerald-500/15 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-emerald-500" />
              </div>
              <div className="text-center">
                <p className="font-medium text-foreground">Import selesai</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {importResult.ok} record berhasil diimport
                  {importResult.err > 0 && `, ${importResult.err} gagal`}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t border-border gap-2">
          {importDone ? (
            <Button onClick={() => { reset(); onClose() }} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Tutup
            </Button>
          ) : (
            <>
              <Button variant="ghost" onClick={() => { reset(); onClose() }} disabled={importing}>
                Batal
              </Button>
              <Button
                onClick={handleImport}
                disabled={validCount === 0 || importing}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
              >
                {importing
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Mengimport...</>
                  : <><Upload className="w-4 h-4" /> Import {validCount} Record</>
                }
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
