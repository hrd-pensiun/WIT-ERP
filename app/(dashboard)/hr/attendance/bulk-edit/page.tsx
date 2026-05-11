"use client"

import { useState, useEffect, useMemo } from "react"
import { ArrowLeft, Save, Loader2, CheckCircle2, X, CalendarDays } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FilterBar, FilterBarSearch, FilterBarSeparator, FilterBarActions } from "@/components/ui/filter-bar"
import { useAttendance } from "@/hooks/useAttendance"
import { useEmployees } from "@/hooks/useEmployees"
import { insForge } from "@/lib/insforge"
import { getTenantId } from "@/lib/tenant"
import Link from "next/link"

const tenantId = getTenantId()

function pad(n: number) { return String(n).padStart(2, "0") }
function monthRange(year: number, month: number) {
  const last = new Date(year, month, 0).getDate()
  return { from: `${year}-${pad(month)}-01`, to: `${year}-${pad(month)}-${last}` }
}

// Extract time (HH:MM) from ISO string for editing
function toTimeInput(iso: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// Combine date + HH:MM into ISO string
function combineDateTime(date: string, time: string): string | null {
  if (!time) return null
  return `${date}T${time}:00`
}

type EditRow = {
  id: string
  date: string
  employee: string
  employeeId: string
  checkIn: string      // HH:MM
  checkOut: string     // HH:MM
  status: string
  notes: string
  dirty: boolean
  saving: boolean
  saved: boolean
  error: string | null
  original: any
}

export default function BulkEditPage() {
  const today = new Date()
  const [dateFrom, setDateFrom] = useState(() => monthRange(today.getFullYear(), today.getMonth() + 1).from)
  const [dateTo,   setDateTo]   = useState(() => monthRange(today.getFullYear(), today.getMonth() + 1).to)
  const [search,    setSearch]    = useState("")
  const [empFilter, setEmpFilter] = useState("all")
  const [rows, setRows] = useState<EditRow[]>([])
  const [saving, setSaving] = useState(false)
  const [savedCount, setSavedCount] = useState(0)

  const { attendance, loading, fetchAttendance } = useAttendance()
  const { employees } = useEmployees()

  useEffect(() => {
    if (dateFrom && dateTo) fetchAttendance({ date_from: dateFrom, date_to: dateTo })
  }, [dateFrom, dateTo]) // eslint-disable-line

  // Sync attendance → rows whenever data changes
  useEffect(() => {
    setRows(attendance.map((r: any) => ({
      id: r.id,
      date: r.date,
      employee: r.user_profiles?.full_name ?? "—",
      employeeId: r.user_profile_id,
      checkIn:  toTimeInput(r.check_in),
      checkOut: toTimeInput(r.check_out),
      status: r.status ?? "present",
      notes: r.notes ?? "",
      dirty: false,
      saving: false,
      saved: false,
      error: null,
      original: r,
    })))
    setSavedCount(0)
  }, [attendance])

  const filtered = useMemo(() => rows.filter((r) => {
    const matchSearch = search === "" || r.employee.toLowerCase().includes(search.toLowerCase())
    const matchEmp = empFilter === "all" || r.employeeId === empFilter
    return matchSearch && matchEmp
  }), [rows, search, empFilter])

  const dirtyCount = rows.filter(r => r.dirty).length

  function updateRow(id: string, field: keyof EditRow, value: string) {
    setRows(prev => prev.map(r => r.id === id
      ? { ...r, [field]: value, dirty: true, saved: false, error: null }
      : r
    ))
  }

  async function saveRow(row: EditRow) {
    setRows(prev => prev.map(r => r.id === row.id ? { ...r, saving: true, error: null } : r))
    try {
      const checkIn  = combineDateTime(row.date, row.checkIn)
      const checkOut = combineDateTime(row.date, row.checkOut)
      const workHours = (checkIn && checkOut)
        ? Math.round(((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 3600000) * 100) / 100
        : null

      const { error } = await (insForge as any)
        .from("attendance_records")
        .update({
          check_in:   checkIn,
          check_out:  checkOut,
          work_hours: workHours,
          status:     row.status,
          notes:      row.notes || null,
        })
        .eq("id", row.id)
        .eq("tenant_id", tenantId)

      if (error) throw error
      setRows(prev => prev.map(r => r.id === row.id
        ? { ...r, saving: false, dirty: false, saved: true, error: null }
        : r
      ))
      setSavedCount(c => c + 1)
    } catch (e: any) {
      setRows(prev => prev.map(r => r.id === row.id
        ? { ...r, saving: false, error: e?.message ?? "Gagal menyimpan" }
        : r
      ))
    }
  }

  async function saveAll() {
    const dirty = rows.filter(r => r.dirty)
    if (!dirty.length) return
    setSaving(true)
    await Promise.all(dirty.map(saveRow))
    setSaving(false)
  }

  const rangeLabel = dateFrom === dateTo
    ? new Date(dateFrom + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    : `${new Date(dateFrom + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short" })} – ${new Date(dateTo + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}`

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/hr/attendance">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Bulk Edit Absensi</h1>
            <p className="text-muted-foreground mt-1">Edit massal data kehadiran karyawan</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {dirtyCount > 0 && (
            <span className="text-sm text-muted-foreground">{dirtyCount} perubahan belum disimpan</span>
          )}
          <Button
            onClick={saveAll}
            disabled={dirtyCount === 0 || saving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
          >
            {saving
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
              : <><Save className="w-4 h-4" /> Simpan Semua ({dirtyCount})</>
            }
          </Button>
        </div>
      </div>

      {/* Date filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Dari Tanggal</Label>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
            className="h-9 w-40 text-sm bg-background border-border" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Sampai Tanggal</Label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
            className="h-9 w-40 text-sm bg-background border-border" />
        </div>
      </div>

      {/* Search + employee filter */}
      <FilterBar>
        <FilterBarSearch
          placeholder="Cari nama karyawan..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <FilterBarSeparator />
        <Select value={empFilter} onValueChange={setEmpFilter}>
          <SelectTrigger className="h-8 w-auto min-w-[160px] text-sm border-border bg-background">
            <SelectValue placeholder="Semua karyawan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Karyawan</SelectItem>
            {employees.map((emp: any) => (
              <SelectItem key={emp.id} value={emp.id}>{emp.full_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(search || empFilter !== "all") && (
          <FilterBarActions>
            <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground"
              onClick={() => { setSearch(""); setEmpFilter("all") }}>
              <X className="w-3 h-3 mr-1" /> Reset
            </Button>
          </FilterBarActions>
        )}
      </FilterBar>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base text-foreground flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-emerald-500" />
              {rangeLabel}
            </CardTitle>
            <span className="text-sm text-muted-foreground">{filtered.length} record</span>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <p className="text-muted-foreground text-center py-12">Memuat data...</p>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground text-center py-12">Tidak ada data untuk periode ini</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Tanggal</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Karyawan</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Check In</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Check Out</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Catatan</th>
                    <th className="px-4 py-3 text-center font-medium text-muted-foreground">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => (
                    <tr
                      key={row.id}
                      className={`border-b border-border/50 transition-colors ${
                        row.dirty ? "bg-yellow-500/5" : row.saved ? "bg-emerald-500/5" : ""
                      }`}
                    >
                      <td className="px-4 py-2 text-foreground whitespace-nowrap text-xs">
                        {new Date(row.date + "T00:00:00").toLocaleDateString("id-ID", {
                          weekday: "short", day: "2-digit", month: "short"
                        })}
                      </td>
                      <td className="px-4 py-2">
                        <p className="text-foreground font-medium text-xs leading-tight">{row.employee}</p>
                      </td>
                      <td className="px-4 py-2">
                        <Input
                          type="time"
                          value={row.checkIn}
                          onChange={(e) => updateRow(row.id, "checkIn", e.target.value)}
                          className="h-7 w-28 text-xs text-center mx-auto border-border bg-background"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <Input
                          type="time"
                          value={row.checkOut}
                          onChange={(e) => updateRow(row.id, "checkOut", e.target.value)}
                          className="h-7 w-28 text-xs text-center mx-auto border-border bg-background"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <Select value={row.status} onValueChange={(v) => updateRow(row.id, "status", v)}>
                          <SelectTrigger className="h-7 w-32 text-xs border-border bg-background mx-auto">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="present">Hadir</SelectItem>
                            <SelectItem value="late">Terlambat</SelectItem>
                            <SelectItem value="absent">Tidak Hadir</SelectItem>
                            <SelectItem value="sick">Sakit</SelectItem>
                            <SelectItem value="leave">Cuti</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-2">
                        <Input
                          value={row.notes}
                          onChange={(e) => updateRow(row.id, "notes", e.target.value)}
                          placeholder="Catatan..."
                          className="h-7 text-xs border-border bg-background"
                        />
                      </td>
                      <td className="px-4 py-2 text-center">
                        {row.error ? (
                          <span className="text-xs text-red-400">{row.error}</span>
                        ) : row.saving ? (
                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground mx-auto" />
                        ) : row.saved && !row.dirty ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                        ) : row.dirty ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 text-xs px-2"
                            onClick={() => saveRow(row)}
                          >
                            <Save className="w-3 h-3 mr-1" /> Simpan
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
