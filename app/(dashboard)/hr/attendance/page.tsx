"use client"

import { useState, useEffect, useMemo } from "react"
import { CheckCircle, XCircle, AlertCircle, Settings, CalendarDays, X, MapPin, Clock, Camera, MessageSquare, ChevronRight, Upload, TableProperties } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FilterBar, FilterBarSearch, FilterBarSeparator, FilterBarActions } from "@/components/ui/filter-bar"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useAttendance } from "@/hooks/useAttendance"
import { useEmployees } from "@/hooks/useEmployees"
import { ImportExcelDialog } from "@/components/attendance/import-excel-dialog"
import Link from "next/link"

// ── Attendance Detail Sheet ────────────────────────────────────────────────────

function OsmMap({ lat, lng }: { lat: number; lng: number }) {
  const delta = 0.004
  const bbox = `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`
  return (
    <iframe
      src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`}
      className="w-full rounded-lg border border-border"
      style={{ height: 200, border: 0 }}
      loading="lazy"
    />
  )
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm text-foreground">{value || "—"}</p>
    </div>
  )
}

function AttendanceDetailSheet({ record, open, onClose }: { record: any; open: boolean; onClose: () => void }) {
  if (!record) return null

  const emp = record.user_profiles
  const fmtDT = (ts: string | null) => {
    if (!ts) return "—"
    const d = new Date(ts)
    return d.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" }) +
      " · " + d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
  }
  const fmtDate = (d: string) => new Date(d + "T00:00:00").toLocaleDateString("id-ID", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })

  const hasCheckIn  = !!record.check_in
  const hasCheckOut = !!record.check_out
  const hasInMap    = record.check_in_lat  != null && record.check_in_lng  != null
  const hasOutMap   = record.check_out_lat != null && record.check_out_lng != null

  const statusBadge = () => {
    if (record.status === "absent") return <Badge className="bg-red-500/20 text-red-400 border-0">Tidak Hadir</Badge>
    if (record.check_in_status === "late") return <Badge className="bg-yellow-500/20 text-yellow-400 border-0">Terlambat</Badge>
    return <Badge className="bg-emerald-500/20 text-emerald-400 border-0">Hadir</Badge>
  }

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <SheetContent side="right" className="flex flex-col p-0 gap-0" style={{ width: "520px", maxWidth: "100vw" }}>
        <SheetHeader className="px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 font-bold text-sm shrink-0">
                {emp?.full_name?.split(" ").map((w: string) => w[0]).slice(0, 2).join("") || "?"}
              </div>
              <div>
                <SheetTitle className="text-base leading-tight">{emp?.full_name || "—"}</SheetTitle>
                <p className="text-xs text-muted-foreground mt-0.5">{emp?.employee_number || "—"}</p>
              </div>
            </div>
            {statusBadge()}
          </div>
          <p className="text-xs text-muted-foreground mt-2">{fmtDate(record.date)}</p>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* ── Check In ── */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-500" /> Check In
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <InfoRow label="Waktu" value={hasCheckIn ? new Date(record.check_in).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : undefined} />
              <InfoRow label="Status" value={record.check_in_status === "late" ? "Terlambat" : record.check_in_status === "on_time" ? "Tepat Waktu" : record.check_in_status || undefined} />
            </div>
            {record.check_in_reason && (
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <MessageSquare className="w-3.5 h-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                <span>{record.check_in_reason}</span>
              </div>
            )}
            {record.check_in_location && (
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>{record.check_in_location}</span>
              </div>
            )}
            {hasInMap && <OsmMap lat={Number(record.check_in_lat)} lng={Number(record.check_in_lng)} />}
            {!hasInMap && hasCheckIn && (
              <p className="text-xs text-muted-foreground italic">Tidak ada data lokasi</p>
            )}
            {record.check_in_photo && (
              <div className="space-y-1.5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide flex items-center gap-1"><Camera className="w-3 h-3" /> Selfie</p>
                <img src={record.check_in_photo} alt="Selfie check-in" className="w-full max-h-64 object-cover rounded-lg border border-border" />
              </div>
            )}
          </section>

          {/* ── Check Out ── */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-400" /> Check Out
            </h3>
            {hasCheckOut ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <InfoRow label="Waktu" value={new Date(record.check_out).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} />
                  <InfoRow label="Jam Kerja" value={record.work_hours != null ? `${record.work_hours} jam` : undefined} />
                </div>
                {record.check_out_reason && (
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MessageSquare className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>{record.check_out_reason}</span>
                  </div>
                )}
                {record.check_out_location && (
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>{record.check_out_location}</span>
                  </div>
                )}
                {hasOutMap && <OsmMap lat={Number(record.check_out_lat)} lng={Number(record.check_out_lng)} />}
                {record.check_out_photo && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide flex items-center gap-1"><Camera className="w-3 h-3" /> Selfie</p>
                    <img src={record.check_out_photo} alt="Selfie check-out" className="w-full max-h-64 object-cover rounded-lg border border-border" />
                  </div>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground italic">Belum melakukan check out</p>
            )}
          </section>

          {/* ── Notes ── */}
          {record.notes && (
            <section className="space-y-1.5">
              <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide">Catatan</h3>
              <p className="text-sm text-muted-foreground">{record.notes}</p>
            </section>
          )}

        </div>
      </SheetContent>
    </Sheet>
  )
}

const MONTHS = [
  "Jan","Feb","Mar","Apr","Mei","Jun",
  "Jul","Agu","Sep","Okt","Nov","Des",
]

function pad(n: number) { return String(n).padStart(2, "0") }

function monthRange(year: number, month: number) {
  const lastDay = new Date(year, month, 0).getDate()
  return {
    from: `${year}-${pad(month)}-01`,
    to:   `${year}-${pad(month)}-${lastDay}`,
  }
}

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function weekRange() {
  const d = new Date()
  const day = d.getDay() || 7
  const mon = new Date(d); mon.setDate(d.getDate() - day + 1)
  const sun = new Date(d); sun.setDate(d.getDate() + (7 - day))
  const fmt = (dt: Date) => `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`
  return { from: fmt(mon), to: fmt(sun) }
}

export default function AttendancePage() {
  const today = new Date()
  const [dateFrom, setDateFrom] = useState(() => monthRange(today.getFullYear(), today.getMonth() + 1).from)
  const [dateTo,   setDateTo]   = useState(() => monthRange(today.getFullYear(), today.getMonth() + 1).to)
  const [search,    setSearch]    = useState("")
  const [empFilter, setEmpFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  const [selectedRecord, setSelectedRecord] = useState<any>(null)
  const [importOpen, setImportOpen] = useState(false)
  const { attendance, loading, fetchAttendance } = useAttendance()
  const { employees } = useEmployees()

  useEffect(() => {
    if (dateFrom && dateTo) {
      fetchAttendance({ date_from: dateFrom, date_to: dateTo })
    }
  }, [dateFrom, dateTo]) // eslint-disable-line

  // Quick range shortcuts
  function applyThisMonth() {
    const r = monthRange(today.getFullYear(), today.getMonth() + 1)
    setDateFrom(r.from); setDateTo(r.to)
  }
  function applyLastMonth() {
    const m = today.getMonth() === 0 ? 12 : today.getMonth()
    const y = today.getMonth() === 0 ? today.getFullYear() - 1 : today.getFullYear()
    const r = monthRange(y, m)
    setDateFrom(r.from); setDateTo(r.to)
  }
  function applyThisWeek() {
    const r = weekRange()
    setDateFrom(r.from); setDateTo(r.to)
  }
  function applyToday() {
    const t = todayStr()
    setDateFrom(t); setDateTo(t)
  }

  const hasActiveFilters = search !== "" || empFilter !== "all" || statusFilter !== "all"
  function resetFilters() {
    setSearch(""); setEmpFilter("all"); setStatusFilter("all")
  }

  const filtered = useMemo(() => {
    return attendance.filter((r: any) => {
      const name: string = r.user_profiles?.full_name ?? ""
      const empNum: string = r.user_profiles?.employee_number ?? ""
      const matchSearch = search === "" ||
        name.toLowerCase().includes(search.toLowerCase()) ||
        empNum.includes(search)
      const matchEmp = empFilter === "all" || r.user_profile_id === empFilter
      const recStatus = r.status === "absent"
        ? "absent"
        : r.check_in_status === "late" ? "late" : "present"
      const matchStatus = statusFilter === "all" || recStatus === statusFilter
      return matchSearch && matchEmp && matchStatus
    })
  }, [attendance, search, empFilter, statusFilter])

  const stats = useMemo(() => ({
    present: filtered.filter((r: any) => r.status !== "absent" && r.check_in_status !== "late").length,
    late:    filtered.filter((r: any) => r.check_in_status === "late").length,
    absent:  filtered.filter((r: any) => r.status === "absent").length,
  }), [filtered])

  function statusBadge(r: any) {
    if (r.status === "absent")
      return <Badge className="bg-red-500/20 text-red-400 border-0 text-xs">Tidak Hadir</Badge>
    if (r.check_in_status === "late")
      return <Badge className="bg-yellow-500/20 text-yellow-400 border-0 text-xs">Terlambat</Badge>
    return <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-xs">Hadir</Badge>
  }

  function fmtTime(ts: string | null) {
    if (!ts) return "—"
    return new Date(ts).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
  }

  function fmtDate(d: string) {
    const dt = new Date(d + "T00:00:00")
    return dt.toLocaleDateString("id-ID", { weekday: "short", day: "2-digit", month: "short" })
  }

  const rangeLabel = dateFrom === dateTo
    ? new Date(dateFrom + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
    : `${new Date(dateFrom + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short" })} – ${new Date(dateTo + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}`

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Absensi</h1>
          <p className="text-muted-foreground mt-1">Kelola kehadiran karyawan</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Import Excel
          </Button>
          <Link href="/hr/attendance/bulk-edit">
            <Button variant="outline" size="sm">
              <TableProperties className="w-4 h-4 mr-2" />
              Bulk Edit
            </Button>
          </Link>
          <Link href="/hr/attendance/settings">
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Pengaturan Denda
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-lg shrink-0">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.present}</p>
                <p className="text-xs text-muted-foreground">Hadir Tepat Waktu</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-500/10 rounded-lg shrink-0">
                <AlertCircle className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.late}</p>
                <p className="text-xs text-muted-foreground">Terlambat</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-500/10 rounded-lg shrink-0">
                <XCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.absent}</p>
                <p className="text-xs text-muted-foreground">Tidak Hadir</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter section */}
      <div className="space-y-3">
        {/* Date range */}
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Dari Tanggal</Label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-9 w-40 text-sm bg-background border-border"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Sampai Tanggal</Label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-9 w-40 text-sm bg-background border-border"
            />
          </div>
          {/* Quick shortcuts */}
          <div className="flex items-center gap-1.5 pb-0.5">
            <Button variant="outline" size="sm" className="h-9 text-xs" onClick={applyToday}>Hari ini</Button>
            <Button variant="outline" size="sm" className="h-9 text-xs" onClick={applyThisWeek}>Minggu ini</Button>
            <Button variant="outline" size="sm" className="h-9 text-xs" onClick={applyThisMonth}>Bulan ini</Button>
            <Button variant="outline" size="sm" className="h-9 text-xs" onClick={applyLastMonth}>Bulan lalu</Button>
          </div>
        </div>

        {/* Search + status + employee */}
        <FilterBar>
          <FilterBarSearch
            placeholder="Cari nama atau no. karyawan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <FilterBarSeparator />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 w-auto min-w-[140px] text-sm border-border bg-background">
              <SelectValue placeholder="Semua status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="present">Hadir</SelectItem>
              <SelectItem value="late">Terlambat</SelectItem>
              <SelectItem value="absent">Tidak Hadir</SelectItem>
            </SelectContent>
          </Select>
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
          {hasActiveFilters && (
            <FilterBarActions>
              <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground" onClick={resetFilters}>
                <X className="w-3 h-3 mr-1" /> Reset filter
              </Button>
            </FilterBarActions>
          )}
        </FilterBar>
      </div>

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
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">Jam Kerja</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((record: any) => (
                    <tr
                      key={record.id}
                      className="border-b border-border/50 hover:bg-muted/20 transition-colors cursor-pointer"
                      onClick={() => setSelectedRecord(record)}
                    >
                      <td className="px-4 py-3 text-foreground whitespace-nowrap">
                        {fmtDate(record.date)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-foreground font-medium leading-tight">
                          {record.user_profiles?.full_name ?? "—"}
                        </p>
                        {record.user_profiles?.employee_number && (
                          <p className="text-xs text-muted-foreground">{record.user_profiles.employee_number}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-foreground tabular-nums">
                        {fmtTime(record.check_in)}
                        {record.check_in_lat != null && (
                          <MapPin className="w-3 h-3 inline ml-1 text-muted-foreground/50" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-foreground tabular-nums">
                        {fmtTime(record.check_out)}
                        {record.check_out_lat != null && (
                          <MapPin className="w-3 h-3 inline ml-1 text-muted-foreground/50" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-muted-foreground tabular-nums">
                        {record.work_hours != null ? `${record.work_hours} j` : "—"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {statusBadge(record)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <AttendanceDetailSheet
        record={selectedRecord}
        open={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
      />

      <ImportExcelDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onSuccess={() => fetchAttendance({ date_from: dateFrom, date_to: dateTo })}
      />
    </div>
  )
}
